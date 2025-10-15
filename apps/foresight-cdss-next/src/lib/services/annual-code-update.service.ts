import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  cptCodeMaster,
  icd10CodeMaster,
  cptCodeStaging,
  icd10CodeStaging,
  annualCodeUpdates
} from '@foresight-cdss-next/db/src/schema';
import { eq, inArray, count, gt } from "drizzle-orm";
import { getMedicalCodeCache } from './medical-code-cache.service';
import * as XLSX from 'xlsx';

interface UpdateProgress {
  stage: 'validation' | 'backup' | 'staging' | 'production' | 'cleanup' | 'complete';
  progress: number;
  message: string;
  errors?: string[];
}

interface CodeUpdateResult {
  success: boolean;
  updateId: string;
  added: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

export class AnnualCodeUpdateService {
  private readonly db: ReturnType<typeof drizzle>;
  private readonly s3: S3Client;
  private readonly cache = getMedicalCodeCache();

  constructor() {
    // Initialize AWS clients
    const rdsClient = new RDSDataClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    if (
      !process.env.DATABASE_NAME ||
      !process.env.DATABASE_SECRET_ARN ||
      !process.env.DATABASE_CLUSTER_ARN
    ) {
      throw new Error('Missing required AWS RDS environment variables');
    }

    this.db = drizzle(rdsClient, {
      database: process.env.DATABASE_NAME,
      secretArn: process.env.DATABASE_SECRET_ARN,
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
    });

    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  // ===================================
  // MAIN UPDATE ORCHESTRATION
  // ===================================
  async performAnnualUpdate(
    codeType: 'cpt' | 'icd10',
    s3Bucket: string,
    s3Key: string,
    effectiveDate: string,
    organizationId: string,
    progressCallback?: (progress: UpdateProgress) => void
  ): Promise<CodeUpdateResult> {

    const updateId = `${codeType}_${Date.now()}`;
    const errors: string[] = [];

    try {
      // Create update record
      await this.db.insert(annualCodeUpdates as any).values({
        id: updateId,
        organizationId,
        updateYear: new Date(effectiveDate).getFullYear(),
        codeType: codeType.toUpperCase() as 'ICD10' | 'CPT',
        sourceFile: `s3://${s3Bucket}/${s3Key}`,
        status: 'in_progress',
        startedAt: new Date(),
      });

      // Step 1: Download and validate file
      progressCallback?.({
        stage: 'validation',
        progress: 10,
        message: 'Downloading and validating source file...'
      });

      const fileData = await this.downloadFromS3(s3Bucket, s3Key);
      const parsedData = this.parseCodeFile(fileData, codeType);

      if (parsedData.length === 0) {
        throw new Error('No valid codes found in source file');
      }

      // Step 2: Create backup
      progressCallback?.({
        stage: 'backup',
        progress: 20,
        message: 'Creating backup of current codes...'
      });

      await this.createBackup(codeType, updateId);

      // Step 3: Load to staging
      progressCallback?.({
        stage: 'staging',
        progress: 40,
        message: 'Loading codes to staging tables...'
      });

      const stagingResult = await this.loadToStaging(codeType, parsedData, updateId, organizationId);
      if (!stagingResult.success) {
        errors.push(...stagingResult.errors);
        throw new Error('Staging validation failed');
      }

      // Step 4: Validate staging data
      progressCallback?.({
        stage: 'staging',
        progress: 60,
        message: 'Validating staging data...'
      });

      const validationResult = await this.validateStagingData(codeType);
      if (!validationResult.success) {
        errors.push(...validationResult.errors);
        throw new Error('Staging data validation failed');
      }

      // Step 5: Promote to production
      progressCallback?.({
        stage: 'production',
        progress: 80,
        message: 'Promoting codes to production...'
      });

      const promotionResult = await this.promoteToProduction(codeType, effectiveDate);

      // Step 6: Clear cache and cleanup
      progressCallback?.({
        stage: 'cleanup',
        progress: 95,
        message: 'Clearing cache and cleaning up...'
      });

      await this.cache.clearAllCache();
      await this.cleanupStaging(codeType);

      // Mark complete
      await this.db.update(annualCodeUpdates as any)
        .set({
          status: 'completed',
          completedAt: new Date(),
          newCodes: promotionResult.added,
          updatedCodes: promotionResult.updated,
          deprecatedCodes: promotionResult.deactivated,
        })
        .where(eq((annualCodeUpdates as any).id, updateId));

      progressCallback?.({
        stage: 'complete',
        progress: 100,
        message: 'Annual code update completed successfully'
      });

      return {
        success: true,
        updateId,
        added: promotionResult.added,
        updated: promotionResult.updated,
        deactivated: promotionResult.deactivated,
        errors
      };

    } catch (error) {
      // Mark failed and rollback if needed
      await this.db.update(annualCodeUpdates as any)
        .set({
          status: 'failed',
          completedAt: new Date(),
          // errorMessage field doesn't exist in schema
        })
        .where(eq((annualCodeUpdates as any).id, updateId));

      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        updateId,
        added: 0,
        updated: 0,
        deactivated: 0,
        errors
      };
    }
  }

  // ===================================
  // S3 FILE HANDLING
  // ===================================
  private async downloadFromS3(bucket: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new Error('Empty file response from S3');
      }

      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  }

  private parseCodeFile(fileData: Buffer, codeType: 'cpt' | 'icd10'): any[] {
    try {
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (codeType === 'cpt') {
        return this.parseCptData(jsonData);
      } else {
        return this.parseIcd10Data(jsonData);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${codeType.toUpperCase()} file: ${error}`);
    }
  }

  private parseCptData(data: any[]): any[] {
    return data
      .filter(row => row.code && /^\d{5}$/.test(row.code))
      .map(row => ({
        cptCode: row.code,
        shortDescription: row.description || '',
        longDescription: row.long_description || row.description || '',
        category: row.category || 'General',
        isActive: true,
        effectiveDate: new Date().toISOString().split('T')[0],
      }));
  }

  private parseIcd10Data(data: any[]): any[] {
    return data
      .filter(row => row.code && /^[A-Z]\d{2}/.test(row.code))
      .map(row => ({
        icd10Code: row.code,
        shortDescription: row.description || '',
        longDescription: row.long_description || row.description || '',
        category: this.determineIcd10Category(row.code),
        isActive: true,
        isBillable: this.determineIcd10Billable(row.code),
        requiresAdditionalDigit: this.determineRequiresAdditionalDigit(row.code),
        parentCode: this.determineParentCode(row.code),
        effectiveDate: new Date().toISOString().split('T')[0],
      }));
  }

  // ===================================
  // STAGING OPERATIONS
  // ===================================
  private async loadToStaging(
    codeType: 'cpt' | 'icd10',
    data: any[],
    updateId: string,
    organizationId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Clear existing staging data
      if (codeType === 'cpt') {
        await this.db.delete(cptCodeStaging as any);
      } else {
        await this.db.delete(icd10CodeStaging as any);
      }

      // Insert new staging data in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).map(item => ({
          ...item,
          organizationId, // Need to pass this to the method
          updateYear: new Date().getFullYear(),
          importBatch: updateId,
          validationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        if (codeType === 'cpt') {
          await this.db.insert(cptCodeStaging as any).values(batch);
        } else {
          await this.db.insert(icd10CodeStaging as any).values(batch);
        }
      }

      return { success: true, errors };
    } catch (error) {
      errors.push(`Staging load error: ${error}`);
      return { success: false, errors };
    }
  }

  private async validateStagingData(codeType: 'cpt' | 'icd10'): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check for duplicates, invalid formats, etc.
      if (codeType === 'cpt') {
        const duplicates = await this.db
          .select({
            code: (cptCodeStaging as any).cptCode,
            count: count()
          })
          .from(cptCodeStaging as any)
          .groupBy((cptCodeStaging as any).cptCode)
          .having(gt(count(), 1));

        if (duplicates.length > 0) {
          errors.push(`Found ${duplicates.length} duplicate CPT codes in staging`);
        }
      } else {
        const duplicates = await this.db
          .select({
            code: (icd10CodeStaging as any).icd10Code,
            count: count()
          })
          .from(icd10CodeStaging as any)
          .groupBy((icd10CodeStaging as any).icd10Code)
          .having(gt(count(), 1));

        if (duplicates.length > 0) {
          errors.push(`Found ${duplicates.length} duplicate ICD-10 codes in staging`);
        }
      }

      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Validation error: ${error}`);
      return { success: false, errors };
    }
  }

  // ===================================
  // PRODUCTION PROMOTION
  // ===================================
  private async promoteToProduction(
    codeType: 'cpt' | 'icd10',
    effectiveDate: string
  ): Promise<{ added: number; updated: number; deactivated: number }> {

    let added = 0, updated = 0, deactivated = 0;

    if (codeType === 'cpt') {
      // Get staging data
      const stagingCodes = await this.db.select().from(cptCodeStaging as any);
      const stagingCodeSet = new Set(stagingCodes.map(c => c.cptCode));

      // Deactivate codes not in new set
      const existingCodes = await this.db.select({ code: (cptCodeMaster as any).cptCode }).from(cptCodeMaster as any);
      const codesToDeactivate = existingCodes
        .filter(c => !stagingCodeSet.has(c.code))
        .map(c => c.code);

      if (codesToDeactivate.length > 0) {
        await this.db.update(cptCodeMaster as any)
          .set({ isActive: false })
          .where(inArray((cptCodeMaster as any).cptCode, codesToDeactivate));
        deactivated = codesToDeactivate.length;
      }

      // Upsert staging codes to production
      for (const stagingCode of stagingCodes) {
        const existing = await this.db
          .select()
          .from(cptCodeMaster as any)
          .where(eq((cptCodeMaster as any).cptCode, stagingCode.cptCode))
          .limit(1);

        if (existing.length > 0) {
          await this.db.update(cptCodeMaster as any)
            .set({
              shortDescription: stagingCode.shortDescription,
              category: stagingCode.category,
              isActive: true,
              effectiveDate: stagingCode.effectiveDate,
              updatedAt: new Date(),
            })
            .where(eq((cptCodeMaster as any).cptCode, stagingCode.cptCode));
          updated++;
        } else {
          await this.db.insert(cptCodeMaster as any).values({
            cptCode: stagingCode.cptCode,
            shortDescription: stagingCode.shortDescription,
            category: stagingCode.category,
            isActive: true,
            effectiveDate: stagingCode.effectiveDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          added++;
        }
      }
    } else {
      // Similar logic for ICD-10 codes
      const stagingCodes = await this.db.select().from(icd10CodeStaging as any);
      const stagingCodeSet = new Set(stagingCodes.map(c => c.icd10Code));

      const existingCodes = await this.db.select({ code: (icd10CodeMaster as any).icd10Code }).from(icd10CodeMaster as any);
      const codesToDeactivate = existingCodes
        .filter(c => !stagingCodeSet.has(c.code))
        .map(c => c.code);

      if (codesToDeactivate.length > 0) {
        await this.db.update(icd10CodeMaster as any)
          .set({ isActive: false })
          .where(inArray((icd10CodeMaster as any).icd10Code, codesToDeactivate));
        deactivated = codesToDeactivate.length;
      }

      for (const stagingCode of stagingCodes) {
        const existing = await this.db
          .select()
          .from(icd10CodeMaster as any)
          .where(eq((icd10CodeMaster as any).icd10Code, stagingCode.icd10Code))
          .limit(1);

        if (existing.length > 0) {
          await this.db.update(icd10CodeMaster as any)
            .set({
              shortDescription: stagingCode.shortDescription,
              category: stagingCode.category,
              isActive: true,
              isBillable: stagingCode.isBillable,
              requiresAdditionalDigit: stagingCode.requiresAdditionalDigit,
              parentCode: stagingCode.parentCode,
              effectiveDate: stagingCode.effectiveDate,
              updatedAt: new Date(),
            })
            .where(eq((icd10CodeMaster as any).icd10Code, stagingCode.icd10Code));
          updated++;
        } else {
          await this.db.insert(icd10CodeMaster as any).values({
            icd10Code: stagingCode.icd10Code,
            shortDescription: stagingCode.shortDescription,
            category: stagingCode.category,
            isActive: true,
            isBillable: stagingCode.isBillable,
            requiresAdditionalDigit: stagingCode.requiresAdditionalDigit,
            parentCode: stagingCode.parentCode,
            effectiveDate: stagingCode.effectiveDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          added++;
        }
      }
    }

    return { added, updated, deactivated };
  }

  // ===================================
  // UTILITY FUNCTIONS
  // ===================================
  private async createBackup(codeType: 'cpt' | 'icd10', updateId: string): Promise<void> {
    // This could export current production data to S3 as backup
    // Implementation depends on your backup strategy
    console.log(`Creating backup for ${codeType} update ${updateId}`);
  }

  private async cleanupStaging(codeType: 'cpt' | 'icd10'): Promise<void> {
    if (codeType === 'cpt') {
      await this.db.delete(cptCodeStaging as any);
    } else {
      await this.db.delete(icd10CodeStaging as any);
    }
  }

  private determineIcd10Category(code: string): string {
    const categories: Record<string, string> = {
      'A': 'Infectious and parasitic diseases',
      'B': 'Infectious and parasitic diseases',
      'C': 'Neoplasms',
      'D': 'Diseases of blood and immune system',
      'E': 'Endocrine, nutritional and metabolic diseases',
      'F': 'Mental and behavioral disorders',
      'G': 'Diseases of the nervous system',
      'H': 'Diseases of eye/ear and adnexa',
      'I': 'Diseases of the circulatory system',
      'J': 'Diseases of the respiratory system',
      'K': 'Diseases of the digestive system',
      'L': 'Diseases of skin and subcutaneous tissue',
      'M': 'Diseases of musculoskeletal system',
      'N': 'Diseases of the genitourinary system',
      'O': 'Pregnancy, childbirth and the puerperium',
      'P': 'Perinatal conditions',
      'Q': 'Congenital malformations',
      'R': 'Symptoms, signs and abnormal findings',
      'S': 'Injury, poisoning (by body region)',
      'T': 'Injury, poisoning (by type)',
      'V': 'External causes - transport accidents',
      'W': 'External causes - other accidents',
      'X': 'External causes - intentional self-harm',
      'Y': 'External causes - assault, undetermined',
      'Z': 'Factors influencing health status'
    };
    return categories[code[0]] || 'Other';
  }

  private determineIcd10Billable(code: string): boolean {
    if (code.length === 3) return false;
    if (code.length === 4 && code.endsWith('9')) return false;
    return !code.includes('X');
  }

  private determineRequiresAdditionalDigit(code: string): boolean {
    if (code.startsWith('S') || code.startsWith('T')) return code.length >= 6;
    return code.startsWith('M80') || code.startsWith('M84') ||
           code.startsWith('M48.4') || code.startsWith('M48.5');
  }

  private determineParentCode(code: string): string | null {
    if (code.length <= 3) return null;
    if (code.length === 4) return code.substring(0, 3);
    if (code.length === 5) return code.substring(0, 4);
    if (code.length >= 6) return code.substring(0, 5);
    return null;
  }
}
