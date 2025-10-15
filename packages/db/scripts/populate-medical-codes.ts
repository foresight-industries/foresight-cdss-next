#!/usr/bin/env tsx

/**
 * Script to populate ICD-10 and CPT code master tables from the generated SQL file.
 * This script adapts the existing SQL to work with our current schema structure.
 */

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { icd10CodeMaster, cptCodeMaster } from "../src";

const client = new RDSDataClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

if (
  !process.env.DATABASE_NAME ||
  !process.env.DATABASE_SECRET_ARN ||
  !process.env.DATABASE_CLUSTER_ARN
) {
  throw new Error('Missing required AWS RDS environment variables');
}

const db = drizzle(client, {
  database: process.env.DATABASE_NAME ?? 'rcm',
  secretArn: process.env.DATABASE_SECRET_ARN,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
});

interface ICD10Code {
  code: string;
  description: string;
  category: string;
  isActive: boolean;
  isBillable: boolean;
  requiresAdditionalDigit: boolean;
  parentCode?: string;
  effectiveDate: string;
}

interface CPTCode {
  code: string;
  description: string;
  category: string;
  isActive: boolean;
  effectiveDate: string;
}

// async function getDefaultOrganization() {
//   console.log('Finding default organization...');
//
//   const orgs = await db.select().from(organizations).limit(1);
//
//   if (orgs.length === 0) {
//     throw new Error('No organizations found. Please create an organization first.');
//   }
//
//   console.log(`Using organization: ${orgs[0].name} (${orgs[0].id})`);
//   return orgs[0].id;
// }

function parseSQLFile(filePath: string): { icd10Codes: ICD10Code[], cptCodes: CPTCode[] } {
  console.log(`Reading SQL file: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const icd10Codes: ICD10Code[] = [];
  const cptCodes: CPTCode[] = [];

  // Split by major sections
  const sections = content.split('INSERT INTO');

  for (const section of sections) {
    if (section.includes('icd10_code_master')) {
      console.log('Processing ICD-10 codes section...');

      // Extract VALUES section
      const valuesMatch = section.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|$)/);
      if (!valuesMatch) continue;

      const valuesSection = valuesMatch[1];

      // Parse each value line
      const valueLines = valuesSection.split(/\),\s*\(/);

      for (let line of valueLines) {
        line = line.replace(/^\s*\(/, '').replace(/\)\s*$/, '');

        // Parse the values: (code, description, category, is_active, is_billable, requires_additional_digit, parent_code, effective_date)
        const match = line.match(/'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*(true|false),\s*(true|false),\s*(true|false),\s*(?:'([^']*)'|NULL),\s*'([^']*)'/);

        if (match) {
          icd10Codes.push({
            code: match[1],
            description: match[2].replace(/''/g, "'"), // Unescape single quotes
            category: match[3],
            isActive: match[4] === 'true',
            isBillable: match[5] === 'true',
            requiresAdditionalDigit: match[6] === 'true',
            parentCode: match[7] || undefined,
            effectiveDate: match[8],
          });
        }
      }
    } else if (section.includes('cpt_code_master')) {
      console.log('Processing CPT codes section...');

      // Extract VALUES section
      const valuesMatch = section.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|$)/);
      if (!valuesMatch) continue;

      const valuesSection = valuesMatch[1];

      // Parse each value line
      const valueLines = valuesSection.split(/\),\s*\(/);

      for (let line of valueLines) {
        line = line.replace(/^\s*\(/, '').replace(/\)\s*$/, '');

        // Parse the values: (code, description, category, is_active, effective_date)
        const match = line.match(/'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*(true|false),\s*'([^']*)'/);

        if (match) {
          cptCodes.push({
            code: match[1],
            description: match[2].replace(/''/g, "'"), // Unescape single quotes
            category: match[3],
            isActive: match[4] === 'true',
            effectiveDate: match[5],
          });
        }
      }
    }
  }

  console.log(`Parsed ${icd10Codes.length} ICD-10 codes and ${cptCodes.length} CPT codes`);
  return { icd10Codes, cptCodes };
}

async function populateICD10Codes(codes: ICD10Code[]) {
  console.log(`Populating ${codes.length} ICD-10 codes...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    try {
      await db.insert(icd10CodeMaster).values(
        batch.map(code => ({
          id: uuid(),
          icd10Code: code.code,
          shortDescription: code.description.substring(0, 100),
          longDescription: code.description,
          category: code.category.substring(0, 50),
          isActive: code.isActive,
          isBillable: code.isBillable,
          requiresAdditionalDigit: code.requiresAdditionalDigit,
          effectiveDate: new Date(code.effectiveDate).toISOString().split('T')[0],
          usageCount: 0,
        }))
      ).onConflictDoNothing({ target: [icd10CodeMaster.icd10Code] });

      processed += batch.length;
      console.log(`Processed ${processed}/${codes.length} ICD-10 codes...`);
    } catch (error) {
      console.error(`Error inserting ICD-10 batch ${i}-${i + batch.length}:`, error);
      // Continue with next batch
    }
  }

  console.log('ICD-10 codes population completed');
}

async function populateCPTCodes(codes: CPTCode[]) {
  console.log(`Populating ${codes.length} CPT codes...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    try {
      await db.insert(cptCodeMaster).values(
        batch.map(code => ({
          id: uuid(),
          cptCode: code.code,
          shortDescription: code.description.substring(0, 100),
          longDescription: code.description,
          category: code.category.substring(0, 50),
          isActive: code.isActive,
          effectiveDate: new Date(code.effectiveDate).toISOString().split('T')[0],
          usageCount: 0,
        }))
      ).onConflictDoNothing({ target: [cptCodeMaster.cptCode] });

      processed += batch.length;
      console.log(`Processed ${processed}/${codes.length} CPT codes...`);
    } catch (error) {
      console.error(`Error inserting CPT batch ${i}-${i + batch.length}:`, error);
      // Continue with next batch
    }
  }

  console.log('CPT codes population completed');
}

export default async () => {
  // Main execution
  try {
    console.log("Starting medical codes population...");

    // Check if file exists
    const sqlFilePath = path.join(
      __dirname,
      "populate_complete_medical_codes.sql"
    );
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      console.log(
        "Please run the Python script first to generate the SQL file."
      );
      throw new Error("SQL file not found");
    }

    // Parse the SQL file
    const { icd10Codes, cptCodes } = parseSQLFile(sqlFilePath);

    if (icd10Codes.length === 0 && cptCodes.length === 0) {
      console.error("No codes found in SQL file");
      throw new Error("No codes found in SQL file");
    }

    // Populate tables
    if (icd10Codes.length > 0) {
      await populateICD10Codes(icd10Codes);
    }

    if (cptCodes.length > 0) {
      await populateCPTCodes(cptCodes);
    }

    console.log("Medical codes population completed successfully!");
    console.log(`Total ICD-10 codes: ${icd10Codes.length}`);
    console.log(`Total CPT codes: ${cptCodes.length}`);
  } catch (error) {
    console.error("Error populating medical codes:", error);
    throw error;
  }
}
