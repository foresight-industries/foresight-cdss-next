import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import {
  priorAuths,
  payers,
  payerPortalCredentials,
  smsAuthConfigs,
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

      // Validate documents
      const documents = await this.validateDocuments(request.documents || []);

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

  private async validateDocuments(documents: string[]): Promise<string[]> {
    const validatedDocs: string[] = [];

    for (const doc of documents) {
      // TODO: Implement document validation
      // - Check file exists
      // - Check file size
      // - Check file format
      // - Scan for PHI compliance
      validatedDocs.push(doc);
    }

    return validatedDocs;
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
