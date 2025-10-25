import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import { 
  claims, 
  claimsSpecialtyConfigs, 
  auditLogs, 
  failedJobs,
  NewFailedJob 
} from '../schema';
import { randomUUID } from 'node:crypto';

import { 
  BaseClaimsWorkflowService, 
  ClaimData, 
  ClaimsValidationResult 
} from './claims/base-claims-workflow';
import { RadiologyClaimsWorkflowService } from './claims/radiology-claims-workflow';
import { SurgeryClaimsWorkflowService } from './claims/surgery-claims-workflow';

export interface ClaimsWorkflowRequest {
  claimId: string;
  organizationId: string;
  payerId: string;
  specialty?: string;
  claimType: 'PROFESSIONAL' | 'INSTITUTIONAL' | 'DME' | 'PHARMACY';
  automationLevel: 'full_auto' | 'human_in_loop' | 'manual_review_required';
  
  // Claim data
  claimData: ClaimData;
  
  // Processing options
  priority: 'low' | 'medium' | 'high' | 'urgent';
  validateOnly?: boolean; // If true, only validate without submission
  bypassValidation?: boolean; // If true, skip validation and submit directly
}

export interface ClaimsWorkflowResult {
  success: boolean;
  claimId: string;
  status: 'validated' | 'submitted' | 'requires_review' | 'failed' | 'pending';
  confirmationNumber?: string;
  workflowId: string;
  executionId: string;
  humanReviewRequired: boolean;
  reviewId?: string;
  error?: string;
  nextSteps: string[];
  validationResult?: ClaimsValidationResult;
  metadata: {
    submissionMethod: 'EDI' | 'portal' | 'manual' | 'api';
    automationLevel: string;
    processingTime: number;
    retryCount: number;
    auditTrail: string[];
    specialty?: string;
    estimatedReimbursement?: number;
    expectedProcessingDays?: number;
  };
}

export class ClaimsWorkflowIntegrationService {
  /**
   * Load specialty-specific workflow configuration
   */
  async loadSpecialtyWorkflowConfig(
    specialty: string,
    organizationId: string,
    payerId?: string
  ): Promise<any> {
    try {
      let overrides = null;
      
      if (payerId) {
        const payerOverrides = await db
          .select()
          .from(claimsSpecialtyConfigs)
          .where(
            and(
              eq(claimsSpecialtyConfigs.organizationId, organizationId),
              eq(claimsSpecialtyConfigs.specialty, specialty),
              eq(claimsSpecialtyConfigs.payerId, payerId),
              eq(claimsSpecialtyConfigs.isActive, true)
            )
          )
          .limit(1);

        if (payerOverrides.length > 0) {
          overrides = payerOverrides[0];
        }
      }

      // If no payer-specific config, try organization-only config
      if (!overrides) {
        const orgOverrides = await db
          .select()
          .from(claimsSpecialtyConfigs)
          .where(
            and(
              eq(claimsSpecialtyConfigs.organizationId, organizationId),
              eq(claimsSpecialtyConfigs.specialty, specialty),
              eq(claimsSpecialtyConfigs.isActive, true)
            )
          )
          .limit(1);

        if (orgOverrides.length > 0) {
          overrides = orgOverrides[0];
        }
      }

      return {
        specialtyConfig: overrides,
        mergedConfig: overrides?.workflowOverrides || {}
      };

    } catch (error) {
      console.error(`Error loading specialty config for ${specialty}:`, error);
      return null;
    }
  }

  /**
   * Create specialty-specific claims workflow service instance
   */
  createSpecialtyClaimsWorkflowService(
    specialty: string,
    workflowConfig?: any
  ): BaseClaimsWorkflowService {
    switch (specialty.toUpperCase()) {
      case 'RADIOLOGY':
      case 'DIAGNOSTIC_RADIOLOGY':
      case 'INTERVENTIONAL_RADIOLOGY':
        return new RadiologyClaimsWorkflowService();
        
      case 'SURGERY':
      case 'GENERAL_SURGERY':
      case 'ORTHOPEDIC_SURGERY':
      case 'PLASTIC_SURGERY':
      case 'NEUROSURGERY':
      case 'CARDIOVASCULAR_SURGERY':
        return new SurgeryClaimsWorkflowService();
        
      default:
        // For unknown specialties, use radiology as a conservative default
        // since it has comprehensive validation rules
        return new RadiologyClaimsWorkflowService();
    }
  }

  /**
   * Determine specialty from claim data if not provided
   */
  async determineSpecialtyFromClaim(claimData: ClaimData): Promise<string> {
    // Simple specialty determination based on procedure codes
    const procedureCodes = claimData.serviceLines.map(line => line.procedureCode);
    
    // Radiology procedures (70000-79999)
    if (procedureCodes.some(code => {
      const numCode = parseInt(code);
      return numCode >= 70000 && numCode <= 79999;
    })) {
      return 'RADIOLOGY';
    }
    
    // Surgery procedures (10000-69999, excluding radiology range)
    if (procedureCodes.some(code => {
      const numCode = parseInt(code);
      return numCode >= 10000 && numCode <= 69999;
    })) {
      return 'SURGERY';
    }
    
    // Default to surgery for comprehensive validation
    return 'SURGERY';
  }

  /**
   * Main claims workflow orchestration method
   */
  async orchestrateClaimsWorkflow(
    request: ClaimsWorkflowRequest
  ): Promise<ClaimsWorkflowResult> {
    const startTime = Date.now();
    const executionId = randomUUID();

    const result: ClaimsWorkflowResult = {
      success: false,
      claimId: request.claimId,
      status: 'pending',
      workflowId: `CWF_${Date.now()}`,
      executionId,
      humanReviewRequired: false,
      nextSteps: [],
      metadata: {
        submissionMethod: 'api',
        automationLevel: request.automationLevel,
        processingTime: 0,
        retryCount: 0,
        auditTrail: []
      }
    };

    try {
      // Step 1: Determine specialty if not provided
      let specialty = request.specialty;
      if (!specialty) {
        specialty = await this.determineSpecialtyFromClaim(request.claimData);
        result.metadata.specialty = specialty;
      }

      await this.logAuditEvent(request.claimId, 'claims_workflow_started', {
        executionId,
        specialty,
        automationLevel: request.automationLevel,
        priority: request.priority
      });

      // Step 2: Load specialty configuration
      const specialtyConfig = await this.loadSpecialtyWorkflowConfig(
        specialty,
        request.organizationId,
        request.payerId
      );

      // Step 3: Create specialty-specific workflow service
      const workflowService = this.createSpecialtyClaimsWorkflowService(
        specialty,
        specialtyConfig?.mergedConfig
      );

      // Step 4: Process claims validation
      if (!request.bypassValidation) {
        console.log('Processing claims validation with specialty workflow...');
        const validationResult = await workflowService.processClaimsWorkflow(request.claimData);
        
        result.validationResult = validationResult;
        result.metadata.estimatedReimbursement = validationResult.estimatedReimbursement;
        result.metadata.expectedProcessingDays = validationResult.expectedProcessingTime;

        // Log validation results
        await this.logAuditEvent(request.claimId, 'claims_validation_completed', {
          executionId,
          specialty,
          validationScore: validationResult.score,
          isValid: validationResult.isValid,
          recommendedAction: validationResult.recommendedAction,
          autoSubmissionEligible: validationResult.autoSubmissionEligible,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length
        });

        // Handle validation results
        if (validationResult.recommendedAction === 'REJECT') {
          result.status = 'failed';
          result.error = 'Claim validation failed with critical errors';
          result.nextSteps = [
            'Review and correct validation errors',
            'Update claim data with required information',
            'Resubmit claim after corrections'
          ];

          await this.updateClaimStatus(request.claimId, 'rejected');
          return result;
        }

        if (validationResult.recommendedAction === 'HOLD_FOR_REVIEW' || 
            validationResult.recommendedAction === 'REQUEST_ADDITIONAL_INFO' ||
            request.automationLevel === 'manual_review_required') {
          
          result.status = 'requires_review';
          result.humanReviewRequired = true;
          result.reviewId = await this.createClaimsReviewTask(request, validationResult);
          result.nextSteps = [
            'Human review required for claim validation',
            'Address validation warnings and errors',
            'Complete manual claim submission if approved'
          ];

          await this.updateClaimStatus(request.claimId, 'pending_review');
          return result;
        }

        // If validation passed and this is validate-only request
        if (request.validateOnly) {
          result.success = true;
          result.status = 'validated';
          result.nextSteps = [
            'Claim validation completed successfully',
            'Ready for submission when authorized'
          ];
          return result;
        }
      }

      // Step 5: Submit claim if validation passed or bypassed
      if (!request.validateOnly) {
        const submissionResult = await this.submitClaim(request, workflowService);
        
        if (submissionResult.success) {
          result.success = true;
          result.status = 'submitted';
          result.confirmationNumber = submissionResult.confirmationNumber;
          result.nextSteps = [
            'Claim submitted successfully',
            `Monitor claim status with confirmation number: ${submissionResult.confirmationNumber}`,
            `Expected processing time: ${result.metadata.expectedProcessingDays || 14} days`
          ];

          await this.updateClaimStatus(request.claimId, 'submitted', submissionResult.confirmationNumber);
        } else {
          result.status = 'failed';
          result.error = submissionResult.error;
          result.nextSteps = [
            'Claim submission failed',
            'Review submission error details',
            'Retry submission or submit manually'
          ];

          await this.updateClaimStatus(request.claimId, 'submission_failed');
        }
      }

      await this.logAuditEvent(request.claimId, 'claims_workflow_completed', {
        executionId,
        specialty,
        finalStatus: result.status,
        success: result.success,
        confirmationNumber: result.confirmationNumber,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Claims workflow orchestration error:', error);

      // Log as failed job for retry logic
      await this.createFailedJobEntry(request, error, executionId);

      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.nextSteps = [
        'Review error logs and system status',
        'Retry claim processing',
        'Submit claim manually if system issues persist'
      ];

      await this.logAuditEvent(request.claimId, 'claims_workflow_failed', {
        executionId,
        error: result.error,
        processingTime: Date.now() - startTime
      });
    } finally {
      result.metadata.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Submit claim through appropriate method
   */
  private async submitClaim(
    request: ClaimsWorkflowRequest,
    workflowService: BaseClaimsWorkflowService
  ): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
    try {
      // Determine submission method based on claim type and configuration
      const submissionMethod = this.determineSubmissionMethod(request);

      switch (submissionMethod) {
        case 'EDI':
          return await this.submitClaimViaEDI(request);
        
        case 'portal':
          return await this.submitClaimViaPortal(request);
        
        case 'manual':
          return await this.queueForManualSubmission(request);
        
        default:
          return {
            success: false,
            error: `Unknown submission method: ${submissionMethod}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claim submission failed'
      };
    }
  }

  private determineSubmissionMethod(request: ClaimsWorkflowRequest): string {
    // Logic to determine best submission method
    // This would be configurable based on payer preferences
    
    if (request.claimData.submissionMethod) {
      return request.claimData.submissionMethod.toLowerCase();
    }
    
    // Default to EDI for most claims
    return 'EDI';
  }

  private async submitClaimViaEDI(request: ClaimsWorkflowRequest): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
    // Mock EDI submission
    // In production, this would integrate with EDI processing system
    
    const confirmationNumber = `EDI_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    console.log(`Submitting claim ${request.claimId} via EDI...`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      confirmationNumber
    };
  }

  private async submitClaimViaPortal(request: ClaimsWorkflowRequest): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
    // Mock portal submission
    // In production, this would integrate with payer portal automation
    
    const confirmationNumber = `POR_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    console.log(`Submitting claim ${request.claimId} via payer portal...`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      confirmationNumber
    };
  }

  private async queueForManualSubmission(request: ClaimsWorkflowRequest): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
    // Queue claim for manual submission
    const taskId = `MAN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    console.log(`Queuing claim ${request.claimId} for manual submission...`);
    
    // In production, this would create a task in a work queue system
    
    return {
      success: true,
      confirmationNumber: taskId
    };
  }

  /**
   * Create review task for claims requiring human review
   */
  private async createClaimsReviewTask(
    request: ClaimsWorkflowRequest,
    validationResult: ClaimsValidationResult
  ): Promise<string> {
    const reviewId = randomUUID();
    
    // In production, this would create a task in a review queue system
    console.log(`Created claims review task ${reviewId} for claim ${request.claimId}`);
    
    // Log the review creation
    await this.logAuditEvent(request.claimId, 'claims_review_created', {
      reviewId,
      validationScore: validationResult.score,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      recommendedAction: validationResult.recommendedAction
    });
    
    return reviewId;
  }

  /**
   * Update claim status in database
   */
  private async updateClaimStatus(
    claimId: string,
    status: string,
    confirmationNumber?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: new Date()
      };
      
      if (confirmationNumber) {
        updates.confirmationNumber = confirmationNumber;
        updates.submittedAt = new Date();
      }
      
      if (status === 'rejected' || status === 'submission_failed') {
        updates.failedAt = new Date();
      }

      await db
        .update(claims)
        .set(updates)
        .where(eq(claims.id, claimId));

      // Log the status update
      await this.logAuditEvent(claimId, 'claim_status_updated', {
        previousStatus: 'pending',
        newStatus: status,
        confirmationNumber
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    claimId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        entityType: 'claims_workflow',
        entityId: claimId,
        action,
        organizationId: metadata.organizationId || '',
        oldValues: null,
        newValues: metadata,
        changedFields: null,
        userId: null,
        userEmail: null,
        ipAddress: null,
        userAgent: null,
        containsPhi: false,
        accessReason: `Claims workflow: ${action}`
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Create failed job entry for retry logic
   */
  private async createFailedJobEntry(
    request: ClaimsWorkflowRequest,
    error: unknown,
    executionId: string
  ): Promise<void> {
    try {
      const failedJob = {
        organizationId: request.organizationId,
        jobType: 'claims_workflow',
        jobName: `Claims Workflow: ${request.claimId}`,
        jobId: request.claimId,
        failureReason: 'claims_workflow_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? (error.stack || null) : null,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        jobPayload: request,
        contextData: {
          executionId,
          automationLevel: request.automationLevel,
          priority: request.priority,
          specialty: request.specialty
        },
        payerId: request.payerId
      } satisfies Partial<NewFailedJob>;

      await db.insert(failedJobs).values(failedJob);
    } catch (dbError) {
      console.error('Error creating failed job entry:', dbError);
    }
  }

  /**
   * Get claims workflow recommendations for organization/payer
   */
  async getClaimsWorkflowRecommendations(
    organizationId: string,
    payerId: string,
    specialty?: string
  ): Promise<{
    recommendedAutomationLevel: string;
    successRate: number;
    avgProcessingTime: number;
    commonIssues: string[];
    recommendations: string[];
  }> {
    try {
      // This would analyze historical claims data to provide recommendations
      // For now, return basic recommendations based on specialty
      const recommendations = {
        recommendedAutomationLevel: 'human_in_loop',
        successRate: 92,
        avgProcessingTime: 2, // days
        commonIssues: [] as string[],
        recommendations: [] as string[]
      };

      if (specialty === 'RADIOLOGY') {
        recommendations.recommendedAutomationLevel = 'full_auto';
        recommendations.successRate = 95;
        recommendations.commonIssues = [
          'Missing contrast justification',
          'Professional vs technical component confusion',
          'Multiple procedure bundling issues'
        ];
        recommendations.recommendations = [
          'Implement automatic contrast necessity checking',
          'Set up component billing validation rules',
          'Configure specialty-specific bundling rules'
        ];
      } else if (specialty === 'SURGERY') {
        recommendations.recommendedAutomationLevel = 'human_in_loop';
        recommendations.successRate = 88;
        recommendations.avgProcessingTime = 3;
        recommendations.commonIssues = [
          'Missing operative reports',
          'Global period modifier confusion',
          'Assistant surgeon documentation gaps'
        ];
        recommendations.recommendations = [
          'Require operative reports for all surgical procedures',
          'Implement global period tracking',
          'Set up assistant surgeon justification workflows'
        ];
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting claims workflow recommendations:', error);
      return {
        recommendedAutomationLevel: 'manual_review_required',
        successRate: 50,
        avgProcessingTime: 7,
        commonIssues: ['Configuration not available'],
        recommendations: ['Manual review recommended until configuration is complete']
      };
    }
  }
}

export const claimsWorkflowIntegrationService = new ClaimsWorkflowIntegrationService();