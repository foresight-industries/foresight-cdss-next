import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import {
  priorAuths,
  payers,
  payerPortalCredentials,
  smsAuthConfigs,
  documents as documentsTable,
  organizationPaSettings,
} from '../schema';
import { StagehandAutomation, StagehandConfig } from './stagehand-automation';
import { PortalSessionManager } from './portal-session';
import { humanInterventionService } from './human-intervention';

export interface PriorAuthSubmissionRequest {
  priorAuthId: string;
  organizationId: string;
  automationLevel?: 'full_auto' | 'human_in_loop' | 'manual_review_required';
  formData?: Record<string, any>;
  documents?: string[];
  skipSMSAuth?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PriorAuthStatusCheckRequest {
  priorAuthId: string;
  organizationId: string;
  referenceNumber?: string;
}

export interface OrchestrationResult {
  success: boolean;
  priorAuthId: string;
  workflowId?: string;
  status: 'submitted' | 'pending' | 'failed' | 'requires_intervention' | 'timeout';
  confirmationNumber?: string;
  referenceNumber?: string;
  submissionDate?: Date;
  error?: string;
  humanInterventionRequired?: boolean;
  interventionId?: string;
  estimatedCompletionTime?: Date;
  nextSteps?: string[];
}

export class PriorAuthOrchestrator {
  // @ts-expect-error - TS6133 - usage in constructor is unrecognized
  private readonly stagehandConfig: StagehandConfig;
  private readonly sessionManager: PortalSessionManager;
  private readonly automation: StagehandAutomation;

  constructor(stagehandConfig: StagehandConfig) {
    this.stagehandConfig = stagehandConfig;
    this.sessionManager = new PortalSessionManager({
      apiKey: stagehandConfig.apiKey,
      projectId: stagehandConfig.projectId,
      baseUrl: 'https://www.browserbase.com',
    });
    this.automation = new StagehandAutomation(stagehandConfig, this.sessionManager);
  }

  async submitPriorAuth(request: PriorAuthSubmissionRequest): Promise<OrchestrationResult> {
    try {
      // Validate request
      const validationResult = await this.validateSubmissionRequest(request);
      if (!validationResult.valid) {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: validationResult.error,
        };
      }

      // Get prior auth details
      const priorAuth = await this.getPriorAuth(request.priorAuthId);
      if (!priorAuth) {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: 'Prior authorization not found',
        };
      }

      // Check payer automation capabilities
      const payerCapabilities = await this.getPayerAutomationCapabilities(priorAuth.payerId);
      if (!payerCapabilities.automationEnabled) {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: 'Automation not available for this payer',
          nextSteps: ['Submit manually via payer portal', 'Contact payer directly'],
        };
      }

      // Prepare form data by merging request data with prior auth data
      const formData = await this.prepareFormData(priorAuth, request.formData || {});

      // Prepare documents by combining request documents with organization defaults
      const documentsToSubmit = await this.prepareDocumentsForSubmission(
        request.documents || [],
        request.organizationId,
        priorAuth.payerId
      );

      // Validate combined documents
      const documents = await this.validateDocuments(documentsToSubmit);

      // Start automation workflow
      const automationResult = await this.automation.submitPriorAuth(
        request.organizationId,
        request.priorAuthId,
        formData,
        documents,
        request.automationLevel || 'human_in_loop'
      );

      if (automationResult.success) {
        // Update prior auth status
        await this.updatePriorAuthStatus(request.priorAuthId, {
          status: 'submitted',
          submissionDate: new Date(),
          confirmationNumber: automationResult.submissionConfirmation,
          automationWorkflowId: automationResult.workflowId,
        });

        return {
          success: true,
          priorAuthId: request.priorAuthId,
          workflowId: automationResult.workflowId,
          status: 'submitted',
          confirmationNumber: automationResult.submissionConfirmation,
          submissionDate: new Date(),
          nextSteps: [
            'Monitor status automatically',
            'Check for payer response in 24-48 hours',
            'Follow up if no response within expected timeframe',
          ],
        };
      } else {
        // Handle automation failure
        if (automationResult.humanInterventionRequired) {
          const interventionId = await this.requestHumanIntervention({
            workflowId: automationResult.workflowId!,
            organizationId: request.organizationId,
            priorAuthId: request.priorAuthId,
            error: automationResult.error || 'Automation requires human assistance',
            priority: request.priority || 'medium',
          });

          return {
            success: false,
            priorAuthId: request.priorAuthId,
            workflowId: automationResult.workflowId,
            status: 'requires_intervention',
            humanInterventionRequired: true,
            interventionId,
            error: automationResult.error,
            nextSteps: [
              'Wait for human intervention',
              'Check intervention status',
              'Consider manual submission if intervention fails',
            ],
          };
        } else {
          return {
            success: false,
            priorAuthId: request.priorAuthId,
            workflowId: automationResult.workflowId,
            status: 'failed',
            error: automationResult.error,
            nextSteps: [
              'Review automation logs',
              'Check payer portal manually',
              'Submit via alternative method',
            ],
          };
        }
      }

    } catch (error) {
      console.error('Error in prior auth orchestration:', error);
      return {
        success: false,
        priorAuthId: request.priorAuthId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown orchestration error',
        nextSteps: [
          'Contact technical support',
          'Submit manually via payer portal',
          'Check system status',
        ],
      };
    }
  }

  async checkPriorAuthStatus(request: PriorAuthStatusCheckRequest): Promise<OrchestrationResult> {
    try {
      const priorAuth = await this.getPriorAuth(request.priorAuthId);
      if (!priorAuth) {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: 'Prior authorization not found',
        };
      }

      // Check if automation is available for status checks
      const payerCapabilities = await this.getPayerAutomationCapabilities(priorAuth.payerId);
      if (!payerCapabilities.statusCheckEnabled) {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: 'Automated status check not available for this payer',
          nextSteps: ['Check status manually via payer portal'],
        };
      }

      // Run status check automation
      const statusResult = await this.automation.checkPriorAuthStatus(
        request.organizationId,
        request.priorAuthId,
        request.referenceNumber
      );

      if (statusResult.success && statusResult.extractedData) {
        // Update prior auth with new status information
        await this.updatePriorAuthStatus(request.priorAuthId, {
          status: statusResult.extractedData.status || 'pending',
          decision: statusResult.extractedData.decision,
          decisionDate: statusResult.extractedData.decisionDate ?
                       new Date(statusResult.extractedData.decisionDate) : undefined,
          notes: statusResult.extractedData.notes,
          lastStatusCheck: new Date(),
        });

        return {
          success: true,
          priorAuthId: request.priorAuthId,
          workflowId: statusResult.workflowId,
          status: statusResult.extractedData.status || 'pending',
          nextSteps: this.getNextStepsForStatus(statusResult.extractedData.status),
        };
      } else {
        return {
          success: false,
          priorAuthId: request.priorAuthId,
          status: 'failed',
          error: statusResult.error || 'Status check failed',
          nextSteps: ['Check status manually', 'Contact payer directly'],
        };
      }

    } catch (error) {
      console.error('Error checking prior auth status:', error);
      return {
        success: false,
        priorAuthId: request.priorAuthId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check error',
      };
    }
  }

  async uploadAdditionalDocuments(
    priorAuthId: string,
    organizationId: string,
    documents: string[]
  ): Promise<OrchestrationResult> {
    try {
      const priorAuth = await this.getPriorAuth(priorAuthId);
      if (!priorAuth) {
        return {
          success: false,
          priorAuthId,
          status: 'failed',
          error: 'Prior authorization not found',
        };
      }

      // Validate documents
      const validatedDocs = await this.validateDocuments(documents);

      // Run document upload automation
      const uploadResult = await this.automation.uploadDocuments(
        organizationId,
        priorAuthId,
        validatedDocs
      );

      if (uploadResult.success) {
        await this.updatePriorAuthStatus(priorAuthId, {
          lastDocumentUpload: new Date(),
          additionalDocuments: validatedDocs,
        });

        return {
          success: true,
          priorAuthId,
          workflowId: uploadResult.workflowId,
          status: 'pending',
          nextSteps: ['Monitor for payer response', 'Check status in 24 hours'],
        };
      } else {
        return {
          success: false,
          priorAuthId,
          status: 'failed',
          error: uploadResult.error,
          humanInterventionRequired: uploadResult.humanInterventionRequired,
        };
      }

    } catch (error) {
      console.error('Error uploading documents:', error);
      return {
        success: false,
        priorAuthId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Document upload error',
      };
    }
  }

  async retryFailedAutomation(
    priorAuthId: string,
    organizationId: string,
    options?: {
      automationLevel?: 'full_auto' | 'human_in_loop' | 'manual_review_required';
      skipSteps?: string[];
    }
  ): Promise<OrchestrationResult> {
    try {
      // Get the previous workflow to understand what failed
      const priorAuth = await this.getPriorAuth(priorAuthId);
      if (!priorAuth) {
        return {
          success: false,
          priorAuthId,
          status: 'failed',
          error: 'Prior authorization not found',
        };
      }

      // Retry with adjusted automation level
      const retryRequest: PriorAuthSubmissionRequest = {
        priorAuthId,
        organizationId,
        automationLevel: options?.automationLevel || 'human_in_loop',
        priority: 'high', // Retries get higher priority
      };

      return await this.submitPriorAuth(retryRequest);

    } catch (error) {
      console.error('Error retrying automation:', error);
      return {
        success: false,
        priorAuthId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Retry failed',
      };
    }
  }

  private async validateSubmissionRequest(
    request: PriorAuthSubmissionRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Check required fields
    if (!request.priorAuthId || !request.organizationId) {
      return { valid: false, error: 'Missing required fields: priorAuthId and organizationId' };
    }

    // Validate prior auth exists and is in correct status
    const priorAuth = await this.getPriorAuth(request.priorAuthId);
    if (!priorAuth) {
      return { valid: false, error: 'Prior authorization not found' };
    }

    if (priorAuth.status === 'submitted') {
      return { valid: false, error: 'Prior authorization already submitted' };
    }

    // Check if required data is available
    if (!priorAuth.patientName || !priorAuth.providerNpi) {
      return { valid: false, error: 'Prior authorization missing required patient or provider information' };
    }

    return { valid: true };
  }

  private async getPriorAuth(priorAuthId: string): Promise<any> {
    const priorAuthsData = await db
      .select()
      .from(priorAuths)
      .where(eq(priorAuths.id, priorAuthId))
      .limit(1);

    return priorAuthsData.length > 0 ? priorAuthsData[0] : null;
  }

  private async getPayerAutomationCapabilities(payerId: string): Promise<{
    automationEnabled: boolean;
    statusCheckEnabled: boolean;
    documentUploadEnabled: boolean;
    smsAuthRequired: boolean;
    supportedFormats: string[];
  }> {
    // Get payer information and portal credentials
    const payer = await db
      .select()
      .from(payers)
      .where(eq(payers.id, payerId))
      .limit(1);

    if (!payer.length) {
      return {
        automationEnabled: false,
        statusCheckEnabled: false,
        documentUploadEnabled: false,
        smsAuthRequired: false,
        supportedFormats: [],
      };
    }

    // Check if portal credentials exist
    const credentials = await db
      .select()
      .from(payerPortalCredentials)
      .where(
        and(
          eq(payerPortalCredentials.payerId, payerId),
          eq(payerPortalCredentials.isActive, true)
        )
      )
      .limit(1);

    const hasCredentials = credentials.length > 0;

    // Check if SMS auth is configured
    const smsConfig = await db
      .select()
      .from(smsAuthConfigs)
      .where(
        and(
          eq(smsAuthConfigs.payerId, payerId),
          eq(smsAuthConfigs.isActive, true)
        )
      )
      .limit(1);

    const smsAuthRequired = smsConfig.length > 0;

    // TODO: Make this configurable per payer
    return {
      automationEnabled: hasCredentials,
      statusCheckEnabled: hasCredentials,
      documentUploadEnabled: hasCredentials,
      smsAuthRequired,
      supportedFormats: ['pdf', 'jpg', 'png', 'doc', 'docx'],
    };
  }

  private async prepareFormData(
    priorAuth: any,
    requestFormData: Record<string, any>
  ): Promise<Record<string, any>> {
    // Merge prior auth data with request form data
    return {
      // Patient information
      patientName: requestFormData.patientName || priorAuth.patientName,
      patientDob: requestFormData.patientDob || priorAuth.patientDateOfBirth,
      memberId: requestFormData.memberId || priorAuth.memberId,
      patientPhone: requestFormData.patientPhone || priorAuth.patientPhone,
      patientAddress: requestFormData.patientAddress || priorAuth.patientAddress,

      // Provider information
      providerName: requestFormData.providerName || priorAuth.providerName,
      providerNpi: requestFormData.providerNpi || priorAuth.providerNpi,
      providerPhone: requestFormData.providerPhone || priorAuth.providerPhone,
      providerFax: requestFormData.providerFax || priorAuth.providerFax,

      // Clinical information
      diagnosisCode: requestFormData.diagnosisCode || priorAuth.primaryDiagnosis,
      procedureCode: requestFormData.procedureCode || priorAuth.requestedService,
      clinicalRationale: requestFormData.clinicalRationale || priorAuth.clinicalRationale,
      urgency: requestFormData.urgency || priorAuth.urgency,

      // Service details
      serviceDate: requestFormData.serviceDate || priorAuth.plannedServiceDate,
      serviceDuration: requestFormData.serviceDuration || priorAuth.serviceDuration,
      serviceLocation: requestFormData.serviceLocation || priorAuth.serviceLocation,

      // Custom fields from request
      ...requestFormData,
    };
  }

  private async prepareDocumentsForSubmission(
    requestDocuments: string[],
    organizationId: string,
    payerId: string
  ): Promise<string[]> {
    try {
      // Get organization default documents
      const defaultDocs = await this.getOrganizationDefaultDocuments(organizationId, payerId);

      // Combine request documents with default documents (avoid duplicates)
      const allDocuments = [...new Set([...requestDocuments, ...defaultDocs])];

      console.log(
        `Document preparation: Request docs: ${requestDocuments.length}, ` +
        `Default docs: ${defaultDocs.length}, Combined: ${allDocuments.length}`
      );

      return allDocuments;
    } catch (error) {
      console.error('Error preparing documents for submission:', error);
      // Fall back to just request documents if default document retrieval fails
      return requestDocuments;
    }
  }

  private async getOrganizationDefaultDocuments(
    organizationId: string,
    payerId?: string
  ): Promise<string[]> {
    try {
      // Get organization PA settings
      const settings = await db
        .select()
        .from(organizationPaSettings)
        .where(
          and(
            eq(organizationPaSettings.organizationId, organizationId),
            eq(organizationPaSettings.isActive, true)
          )
        )
        .limit(1);

      if (settings.length === 0) {
        console.log(`No PA settings found for organization: ${organizationId}`);
        return [];
      }

      const orgSettings = settings[0];

      // Check if auto-attach is enabled
      if (!orgSettings.autoAttachEnabled) {
        console.log(`Auto-attach disabled for organization: ${organizationId}`);
        return [];
      }

      let defaultDocuments: string[] = [];

      // 1. Check for payer-specific settings first (if payerId provided)
      if (payerId && orgSettings.payerSpecificSettings) {
        const payerSettings = (orgSettings.payerSpecificSettings as any)[payerId];
        if (payerSettings) {
          // Use payer-specific auto-attach setting if available
          if (payerSettings.autoAttachEnabled === false) {
            console.log(`Auto-attach disabled for payer ${payerId} in organization: ${organizationId}`);
            return [];
          }

          // Use payer-specific default documents
          if (payerSettings.defaultDocuments && Array.isArray(payerSettings.defaultDocuments)) {
            defaultDocuments = payerSettings.defaultDocuments;
            console.log(`Using payer-specific default documents for ${payerId}: ${defaultDocuments.length} documents`);
          }
        }
      }

      // 2. Fall back to organization-wide default documents if no payer-specific docs
      if (defaultDocuments.length === 0 && orgSettings.defaultDocuments) {
        defaultDocuments = orgSettings.defaultDocuments as string[];
        console.log(`Using organization-wide default documents: ${defaultDocuments.length} documents`);
      }

      // 3. Check document categories for "prior_auth" if no direct defaults
      if (defaultDocuments.length === 0 && orgSettings.documentCategories) {
        const categories = orgSettings.documentCategories as Record<string, string[]>;
        if (categories.prior_auth && Array.isArray(categories.prior_auth)) {
          defaultDocuments = categories.prior_auth;
          console.log(`Using prior_auth category documents: ${defaultDocuments.length} documents`);
        }
      }

      // Validate that all default documents are valid UUIDs or S3 keys
      const validatedDefaults = defaultDocuments.filter(doc => {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc);
        const isValidS3Key = typeof doc === 'string' && doc.length > 0;
        
        if (!isValidUuid && !isValidS3Key) {
          console.warn(`Invalid document identifier in default documents: ${doc}`);
          return false;
        }
        return true;
      });

      if (validatedDefaults.length !== defaultDocuments.length) {
        console.warn(
          `Filtered out ${defaultDocuments.length - validatedDefaults.length} invalid default documents`
        );
      }

      return validatedDefaults;

    } catch (error) {
      console.error('Error retrieving organization default documents:', error);
      return [];
    }
  }

  private async validateDocuments(documents: string[]): Promise<string[]> {
    const validatedDocs: string[] = [];
    
    if (!documents || documents.length === 0) {
      return validatedDocs;
    }

    // Import AWS SDK and PHI utilities dynamically to avoid bundling issues
    const { S3Client, HeadObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { ComprehendMedicalClient, DetectPHICommand } = await import('@aws-sdk/client-comprehendmedical');

    const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
    const comprehendClient = new ComprehendMedicalClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
    
    const bucketName = process.env.DOCUMENTS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('DOCUMENTS_BUCKET_NAME environment variable not configured');
    }

    // Define validation constants
    const ALLOWED_FILE_TYPES = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/heic',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    const MIN_FILE_SIZE = 100; // 100 bytes

    for (const docPath of documents) {
      try {
        // Parse document path - could be S3 key or document ID
        let s3Key: string;
        let documentRecord = null;

        // Check if it's a UUID (document ID) or S3 key
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(docPath)) {
          // It's a document ID, look up the S3 key
          const docs = await db
            .select()
            .from(documentsTable)
            .where(eq(documentsTable.uploadId, docPath))
            .limit(1);
          
          if (docs.length === 0) {
            console.warn(`Document not found in database: ${docPath}`);
            continue;
          }
          
          documentRecord = docs[0];
          s3Key = documentRecord.s3Key;
        } else {
          // Assume it's an S3 key
          s3Key = docPath;
        }

        // 1. Check if file exists in S3
        let fileMetadata;
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          });
          fileMetadata = await s3Client.send(headCommand);
        } catch (error: any) {
          if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            console.warn(`Document not found in S3: ${s3Key}`);
            continue;
          }
          throw error;
        }

        // 2. Check file size
        const fileSize = fileMetadata.ContentLength || 0;
        if (fileSize < MIN_FILE_SIZE) {
          console.warn(`Document too small (${fileSize} bytes): ${s3Key}`);
          continue;
        }
        
        if (fileSize > MAX_FILE_SIZE) {
          console.warn(`Document too large (${fileSize} bytes): ${s3Key}`);
          continue;
        }

        // 3. Check file format
        const contentType = fileMetadata.ContentType || '';
        if (!ALLOWED_FILE_TYPES.has(contentType)) {
          console.warn(`Unsupported file type (${contentType}): ${s3Key}`);
          continue;
        }

        // 4. PHI Compliance Scanning for text-based files
        if (contentType === 'text/plain' || contentType.includes('document')) {
          try {
            // Get file content for text analysis
            const getCommand = new GetObjectCommand({
              Bucket: bucketName,
              Key: s3Key,
            });
            
            const response = await s3Client.send(getCommand);
            const fileContent = await this.streamToString(response.Body);
            
            // Limit text analysis to first 10KB for performance
            const textToAnalyze = fileContent.substring(0, 10240);
            
            // Use AWS Comprehend Medical to detect PHI
            if (textToAnalyze.trim().length > 0) {
              const phiDetection = new DetectPHICommand({
                Text: textToAnalyze,
              });
              
              const phiResult = await comprehendClient.send(phiDetection);
              
              // Check for high-risk PHI entities
              const highRiskPHI = phiResult.Entities?.filter(entity => 
                entity.Category === 'PROTECTED_HEALTH_INFORMATION' && 
                (entity.Score || 0) > 0.8
              ) || [];
              
              if (highRiskPHI.length > 0) {
                console.warn(`High-risk PHI detected in document: ${s3Key}`);
                // Still include document but log for audit
              }
            }
            
            // Basic PHI pattern detection as backup
            try {
              const phiPatterns = [
                /\b\d{3}-?\d{2}-?\d{4}\b/g, // SSN patterns
                /\b[A-Z]{1,2}\d{8,10}\b/g, // Medical record numbers
                /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Date patterns
                /\b\d{3}-?\d{3}-?\d{4}\b/g, // Phone patterns
              ];
              
              let phiMatches = 0;
              for (const pattern of phiPatterns) {
                const matches = textToAnalyze.match(pattern);
                if (matches) {
                  phiMatches += matches.length;
                }
              }
              
              if (phiMatches > 3) {
                console.warn(`Multiple PHI patterns detected (${phiMatches} matches) in document: ${s3Key}`);
              }
            } catch (phiError) {
              console.warn(`PHI pattern detection failed for ${s3Key}:`, phiError);
            }
          } catch (textAnalysisError) {
            console.warn(`Text analysis failed for ${s3Key}:`, textAnalysisError);
            // Continue with document validation even if PHI scan fails
          }
        }

        // 5. Additional format-specific validations
        if (contentType === 'application/pdf') {
          // Basic PDF validation - check for PDF magic number
          try {
            const getCommand = new GetObjectCommand({
              Bucket: bucketName,
              Key: s3Key,
              Range: 'bytes=0-7',  // First 8 bytes for PDF header
            });
            
            const response = await s3Client.send(getCommand);
            const headerBytes = await this.streamToBuffer(response.Body);
            const headerString = headerBytes.toString('ascii', 0, 4);
            
            if (headerString !== '%PDF') {
              console.warn(`Invalid PDF format: ${s3Key}`);
              continue;
            }
          } catch (pdfError) {
            console.warn(`PDF validation failed for ${s3Key}:`, pdfError);
          }
        }

        // 6. Check file age (optional security measure)
        const lastModified = fileMetadata.LastModified;
        if (lastModified) {
          const fileAge = Date.now() - lastModified.getTime();
          const maxAgeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
          
          if (fileAge > maxAgeMs) {
            console.warn(`Document older than 90 days: ${s3Key}`);
            // Still include but log for review
          }
        }

        // 7. Virus scanning placeholder
        // In production, integrate with AWS GuardDuty Malware Protection or similar
        const virusScanPassed = await this.performVirusScan(s3Key, bucketName);
        if (!virusScanPassed) {
          console.warn(`Virus scan failed for: ${s3Key}`);
          continue;
        }

        // Document passed all validations
        validatedDocs.push(docPath);
        
        console.log(`Document validated successfully: ${s3Key} (${fileSize} bytes, ${contentType})`);

      } catch (error) {
        console.error(`Error validating document ${docPath}:`, error);
        // Skip invalid documents but continue processing others
        continue;
      }
    }

    console.log(`Document validation completed: ${validatedDocs.length}/${documents.length} documents passed validation`);
    return validatedDocs;
  }

  private async streamToString(stream: any): Promise<string> {
    if (!stream) return '';
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    if (!stream) return Buffer.alloc(0);
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private async performVirusScan(s3Key: string, bucketName: string): Promise<boolean> {
    // Placeholder for virus scanning integration
    // In production, this would integrate with:
    // - AWS GuardDuty Malware Protection
    // - ClamAV
    // - Or other enterprise virus scanning solutions
    
    try {
      // Basic file extension check as minimal security measure
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js'];
      const lowercaseKey = s3Key.toLowerCase();
      
      for (const ext of suspiciousExtensions) {
        if (lowercaseKey.endsWith(ext)) {
          console.warn(`Suspicious file extension detected: ${s3Key}`);
          return false;
        }
      }
      
      // TODO: Integrate with actual virus scanning service
      // For now, assume all files pass virus scan
      return true;
      
    } catch (error) {
      console.error(`Virus scan error for ${s3Key}:`, error);
      // Fail closed - reject file if virus scan fails
      return false;
    }
  }

  private async updatePriorAuthStatus(
    priorAuthId: string,
    updates: Record<string, any>
  ): Promise<void> {
    await db
      .update(priorAuths)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(priorAuths.id, priorAuthId));
  }

  private async requestHumanIntervention(options: {
    workflowId: string;
    organizationId: string;
    priorAuthId: string;
    error: string;
    priority: string;
  }): Promise<string> {
    return await humanInterventionService.requestIntervention({
      workflowId: options.workflowId,
      organizationId: options.organizationId,
      type: 'manual_review',
      priority: options.priority as any,
      title: `Prior Auth Automation Failed - ${options.priorAuthId}`,
      description: `Automated prior authorization submission failed and requires human intervention.`,
      instructions: `Please review the workflow logs and complete the prior authorization submission manually.`,
      context: {
        priorAuthId: options.priorAuthId,
        error: options.error,
      },
      timeoutMinutes: 60, // 1 hour for prior auth interventions
    });
  }

  private getNextStepsForStatus(status?: string): string[] {
    switch (status?.toLowerCase()) {
      case 'approved':
        return [
          'Notify provider of approval',
          'Schedule approved services',
          'Update patient record',
        ];
      case 'denied':
        return [
          'Review denial reason',
          'Prepare appeal if appropriate',
          'Notify provider and patient',
        ];
      case 'pending':
        return [
          'Monitor for updates',
          'Check status again in 24-48 hours',
          'Follow up if no response in expected timeframe',
        ];
      case 'requires_additional_info':
        return [
          'Review requested information',
          'Gather additional documentation',
          'Submit additional information',
        ];
      default:
        return [
          'Monitor status',
          'Contact payer if needed',
          'Check again in 24 hours',
        ];
    }
  }

  async getOrchestrationMetrics(organizationId?: string): Promise<{
    totalSubmissions: number;
    successRate: number;
    averageCompletionTime: number;
    humanInterventionRate: number;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    // TODO: Implement metrics calculation from workflow logs
    return {
      totalSubmissions: 0,
      successRate: 0,
      averageCompletionTime: 0,
      humanInterventionRate: 0,
      topFailureReasons: [],
    };
  }

  async cleanup(): Promise<void> {
    await this.automation.cleanup();
  }
}

// Factory function to create orchestrator with environment-specific config
export function createPriorAuthOrchestrator(): PriorAuthOrchestrator {
  const stagehandConfig: StagehandConfig = {
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    env: process.env.NODE_ENV === 'production' ? 'BROWSERBASE' : 'LOCAL',
    headless: process.env.NODE_ENV === 'production',
    logger: process.env.DEBUG_AUTOMATION ? console.log : undefined,
  };

  return new PriorAuthOrchestrator(stagehandConfig);
}

export const priorAuthOrchestrator = createPriorAuthOrchestrator();

// Organization PA Settings Management Functions
export class OrganizationPaSettingsService {
  async getSettings(organizationId: string): Promise<any> {
    const settings = await db
      .select()
      .from(organizationPaSettings)
      .where(eq(organizationPaSettings.organizationId, organizationId))
      .limit(1);

    return settings.length > 0 ? settings[0] : null;
  }

  async createOrUpdateSettings(
    organizationId: string,
    settingsData: {
      defaultDocuments?: string[];
      autoAttachEnabled?: boolean;
      documentCategories?: Record<string, string[]>;
      payerSpecificSettings?: Record<string, any>;
      description?: string;
      createdBy?: string;
      updatedBy?: string;
    }
  ): Promise<any> {
    // Check if settings already exist
    const existingSettings = await this.getSettings(organizationId);

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await db
        .update(organizationPaSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(organizationPaSettings.organizationId, organizationId))
        .returning();

      return updatedSettings[0];
    } else {
      // Create new settings
      const newSettings = await db
        .insert(organizationPaSettings)
        .values({
          organizationId,
          ...settingsData,
        })
        .returning();

      return newSettings[0];
    }
  }

  async updateDefaultDocuments(
    organizationId: string,
    documents: string[],
    updatedBy?: string
  ): Promise<void> {
    await this.createOrUpdateSettings(organizationId, {
      defaultDocuments: documents,
      updatedBy,
    });
  }

  async updatePayerSpecificSettings(
    organizationId: string,
    payerId: string,
    payerSettings: {
      defaultDocuments?: string[];
      autoAttachEnabled?: boolean;
      documentCategories?: Record<string, string[]>;
    },
    updatedBy?: string
  ): Promise<void> {
    const currentSettings = await this.getSettings(organizationId);
    const existingPayerSettings = currentSettings?.payerSpecificSettings || {};

    await this.createOrUpdateSettings(organizationId, {
      payerSpecificSettings: {
        ...existingPayerSettings,
        [payerId]: payerSettings,
      },
      updatedBy,
    });
  }

  async updateDocumentCategories(
    organizationId: string,
    categories: Record<string, string[]>,
    updatedBy?: string
  ): Promise<void> {
    await this.createOrUpdateSettings(organizationId, {
      documentCategories: categories,
      updatedBy,
    });
  }

  async setAutoAttachEnabled(
    organizationId: string,
    enabled: boolean,
    updatedBy?: string
  ): Promise<void> {
    await this.createOrUpdateSettings(organizationId, {
      autoAttachEnabled: enabled,
      updatedBy,
    });
  }

  async deleteSettings(organizationId: string): Promise<void> {
    await db
      .update(organizationPaSettings)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(organizationPaSettings.organizationId, organizationId));
  }

  async getAllActiveSettings(): Promise<any[]> {
    return await db
      .select()
      .from(organizationPaSettings)
      .where(eq(organizationPaSettings.isActive, true));
  }
}

export const organizationPaSettingsService = new OrganizationPaSettingsService();
