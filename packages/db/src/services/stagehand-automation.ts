import { Stagehand } from '@browserbasehq/stagehand';
import { eq } from 'drizzle-orm';
import { db } from '../connection';
import {
  priorAuthWorkflows,
  workflowStepLogs,
  NewPriorAuthWorkflow,
  NewWorkflowStepLog,
  PriorAuthWorkflow,
  priorAuths,
} from '../schema';
import { PortalSessionManager } from './portal-session';
import { twilioSMSService } from './twilio-sms';

export interface StagehandConfig {
  apiKey: string;
  projectId: string;
  env: 'LOCAL' | 'BROWSERBASE';
  headless?: boolean;
  logger?: (message: any) => void;
}

export interface AutomationStep {
  name: string;
  type: 'navigate' | 'act' | 'extract' | 'observe' | 'wait' | 'sms_auth' | 'upload_file';
  instruction?: string;
  url?: string;
  selector?: string;
  text?: string;
  filePath?: string;
  waitForText?: string;
  timeoutMs?: number;
  retryable?: boolean;
  maxRetries?: number;
}

export interface AutomationResult {
  success: boolean;
  workflowId?: string;
  completedSteps?: number;
  totalSteps?: number;
  error?: string;
  humanInterventionRequired?: boolean;
  extractedData?: any;
  submissionConfirmation?: string;
}

export class StagehandAutomation {
  private readonly config: StagehandConfig;
  private readonly sessionManager: PortalSessionManager;
  private readonly activeStagehandInstances: Map<string, Stagehand> = new Map();

  constructor(config: StagehandConfig, sessionManager: PortalSessionManager) {
    this.config = config;
    this.sessionManager = sessionManager;
  }

  async submitPriorAuth(
    organizationId: string,
    priorAuthId: string,
    formData: Record<string, any>,
    documents: string[] = [],
    automationLevel: 'full_auto' | 'human_in_loop' | 'manual_review_required' = 'human_in_loop'
  ): Promise<AutomationResult> {
    let stagehand: Stagehand | null = null;

    try {
      // Get prior auth details
      const priorAuth = await this.getPriorAuth(priorAuthId);
      if (!priorAuth) {
        return { success: false, error: 'Prior auth not found' };
      }

      // Create workflow
      const workflow = await this.createWorkflow(
        organizationId,
        priorAuthId,
        'submit_new',
        automationLevel
      );

      // Initialize Stagehand
      stagehand = new Stagehand({
        ...this.config,
        enableCaching: true,
        disablePino: true,
        env: process.env.NODE_ENV === 'development' ? 'LOCAL' : 'BROWSERBASE',
      });

      await stagehand.init();
      this.activeStagehandInstances.set(workflow.id, stagehand);

      // Get portal session for authentication
      const sessionResult = await this.sessionManager.createSession(
        organizationId,
        priorAuth.payerId
      );

      if (!sessionResult.success) {
        if (sessionResult.requiresSMS) {
          // Handle SMS authentication
          const smsResult = await this.handleSMSAuthentication(
            workflow.id,
            sessionResult.smsAttemptId!,
            stagehand
          );

          if (!smsResult.success) {
            await this.markWorkflowFailed(workflow.id, smsResult.error || 'SMS authentication failed');
            return { success: false, error: smsResult.error, humanInterventionRequired: true };
          }
        } else {
          await this.markWorkflowFailed(workflow.id, sessionResult.error || 'Failed to create portal session');
          return { success: false, error: sessionResult.error };
        }
      }

      // Build payer-specific automation steps
      const steps = await this.buildPriorAuthSubmissionSteps(priorAuth, formData, documents);

      // Execute the automation workflow
      const result = await this.executeAutomationWorkflow(workflow.id, steps, stagehand);

      return result;

    } catch (error) {
      console.error('Error in prior auth automation:', error);
      if (stagehand) {
        await this.markWorkflowFailed(
          (await this.getWorkflowByPriorAuth(priorAuthId))?.id || '',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown automation error'
      };
    } finally {
      if (stagehand) {
        await stagehand.close();
      }
    }
  }

  async checkPriorAuthStatus(
    organizationId: string,
    priorAuthId: string,
    referenceNumber?: string
  ): Promise<AutomationResult> {
    let stagehand: Stagehand | null = null;

    try {
      const priorAuth = await this.getPriorAuth(priorAuthId);
      if (!priorAuth) {
        return { success: false, error: 'Prior auth not found' };
      }

      const workflow = await this.createWorkflow(
        organizationId,
        priorAuthId,
        'check_status',
        'full_auto'
      );

      stagehand = new Stagehand(this.config);
      await stagehand.init();
      this.activeStagehandInstances.set(workflow.id, stagehand);

      // Authenticate with portal
      const sessionResult = await this.sessionManager.createSession(
        organizationId,
        priorAuth.payerId
      );

      if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
      }

      const steps = await this.buildStatusCheckSteps(priorAuth, referenceNumber);
      const result = await this.executeAutomationWorkflow(workflow.id, steps, stagehand);

      return result;

    } catch (error) {
      console.error('Error checking prior auth status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check error'
      };
    } finally {
      if (stagehand) {
        await stagehand.close();
      }
    }
  }

  private async executeAutomationWorkflow(
    workflowId: string,
    steps: AutomationStep[],
    stagehand: Stagehand
  ): Promise<AutomationResult> {
    try {
      await this.updateWorkflow(workflowId, {
        totalSteps: steps.length,
        status: 'in_progress',
        currentStep: steps[0]?.name || 'starting',
      });

      let completedSteps = 0;
      let extractedData: any = {};

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Log step start
        const stepLog = await this.logStepStart(workflowId, step, i + 1);

        try {
          const stepResult = await this.executeAutomationStep(stagehand, step, stepLog.id);

          if (stepResult.success) {
            await this.logStepCompletion(stepLog.id, stepResult.result);
            completedSteps++;

            // Collect extracted data
            if (stepResult.extractedData) {
              extractedData = { ...extractedData, ...stepResult.extractedData };
            }

            // Update workflow progress
            await this.updateWorkflow(workflowId, {
              completedSteps,
              currentStep: i + 1 < steps.length ? steps[i + 1].name : 'completed',
              lastStepCompletedAt: new Date(),
            });

          } else {
            await this.logStepFailure(stepLog.id, stepResult.error || 'Step failed');

            // Handle retries
            if (step.retryable && (stepResult.retryAttempt || 0) < (step.maxRetries || 3)) {
              console.log(`Retrying step: ${step.name}`);
              i--; // Retry current step
              continue;
            }

            if (stepResult.requiresHuman) {
              await this.requestHumanIntervention(workflowId, step, stepResult.error || 'Manual intervention needed');
              return {
                success: false,
                workflowId,
                completedSteps,
                totalSteps: steps.length,
                humanInterventionRequired: true,
                error: stepResult.error,
                extractedData
              };
            }

            await this.markWorkflowFailed(workflowId, stepResult.error || 'Step execution failed');
            return {
              success: false,
              workflowId,
              completedSteps,
              totalSteps: steps.length,
              error: stepResult.error,
              extractedData
            };
          }

        } catch (error) {
          console.error(`Error executing step ${step.name}:`, error);
          await this.logStepFailure(stepLog.id, error instanceof Error ? error.message : 'Unknown error');

          await this.markWorkflowFailed(workflowId, `Step "${step.name}" failed: ${error}`);
          return {
            success: false,
            workflowId,
            completedSteps,
            totalSteps: steps.length,
            error: `Step "${step.name}" failed`,
            extractedData
          };
        }
      }

      // Mark workflow as completed
      await this.markWorkflowCompleted(workflowId, extractedData);

      return {
        success: true,
        workflowId,
        completedSteps,
        totalSteps: steps.length,
        extractedData,
        submissionConfirmation: extractedData.confirmationNumber || extractedData.referenceNumber
      };

    } catch (error) {
      console.error('Error executing automation workflow:', error);
      await this.markWorkflowFailed(workflowId, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        workflowId,
        error: error instanceof Error ? error.message : 'Workflow execution error'
      };
    }
  }

  private async executeAutomationStep(
    stagehand: Stagehand,
    step: AutomationStep,
    stepLogId: string
  ): Promise<{
    success: boolean;
    result?: any;
    extractedData?: any;
    error?: string;
    requiresHuman?: boolean;
    retryAttempt?: number;
  }> {

    try {
      switch (step.type) {
        case 'navigate': {
          if (!step.url) {
            return { success: false, error: 'Navigate step missing URL' };
          }

          await stagehand.page.goto(step.url);
          await stagehand.page.waitForLoadState();

          // Take screenshot for debugging
          const screenshot = await stagehand.page.screenshot({
            fullPage: true,
          });
          await this.saveStepScreenshot(stepLogId, screenshot);

          return { success: true, result: { navigatedTo: step.url } };
        }

        case 'act': {
          if (!step.instruction) {
            return { success: false, error: 'Act step missing instruction' };
          }

          const actResult = await stagehand.page.act(step.instruction);

          // Stagehand act() method throws on failure, so if we get here it succeeded
          return { success: true, result: actResult };
        }

        case 'extract': {
          if (!step.instruction) {
            return {
              success: false,
              error: 'Extract step missing instruction',
            };
          }

          const extractResult = await stagehand.page.extract({
            instruction: step.instruction,
            schema: step.text ? JSON.parse(step.text) : undefined,
          });

          return {
            success: true,
            result: extractResult,
            extractedData: extractResult,
          };
        }

        case 'observe': {
          if (!step.instruction) {
            return {
              success: false,
              error: 'Observe step missing instruction',
            };
          }

          const observeResult = await stagehand.page.observe({
            instruction: step.instruction,
          });

          return { success: true, result: observeResult };
        }

        case 'wait':
          const waitTime = step.timeoutMs || 5000;

          if (step.waitForText) {
            // Wait for specific text to appear
            await stagehand.page.waitForFunction(
              (text) => document.body.innerText.includes(text),
              step.waitForText,
              { timeout: waitTime }
            );
          } else {
            // Simple wait
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          return { success: true, result: { waitedMs: waitTime } };

        case 'upload_file':
          if (!step.filePath || !step.selector) {
            return { success: false, error: 'Upload file step missing file path or selector' };
          }

          await stagehand.page.setInputFiles(step.selector, step.filePath);

          // Wait for upload completion if specified
          if (step.waitForText) {
            await stagehand.page.waitForFunction(
              (text) => document.body.innerText.includes(text),
              step.waitForText,
              { timeout: 30000 }
            );
          }

          return { success: true, result: { uploadedFile: step.filePath } };

        case 'sms_auth':
          return {
            success: false,
            error: 'SMS authentication requires human intervention',
            requiresHuman: true
          };

        default:
          return { success: false, error: `Unknown step type: ${step.type}` };
      }

    } catch (error) {
      console.error(`Error in step execution:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Step execution error',
        requiresHuman: true
      };
    }
  }

  private async handleSMSAuthentication(
    workflowId: string,
    smsAttemptId: string,
    stagehand: Stagehand
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for SMS code with timeout
      const smsResult = await twilioSMSService.waitForSMSCode(smsAttemptId, 300000); // 5 minutes

      if (!smsResult.success) {
        if (smsResult.error?.includes('timeout')) {
          await twilioSMSService.requestHumanIntervention(
            smsAttemptId,
            'SMS timeout - human intervention required'
          );
        }
        return { success: false, error: smsResult.error };
      }

      // Use Stagehand to enter the SMS code
      const enterCodeResult = await stagehand.page.act(
        `Enter the SMS verification code "${smsResult.code}" in the verification field and submit`
      );

      if (!enterCodeResult.success) {
        return { success: false, error: 'Failed to enter SMS code automatically' };
      }

      // Verify the code with our service
      const verifyResult = await twilioSMSService.verifySMSCode(smsAttemptId, smsResult.code!);

      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error };
      }

      return { success: true };

    } catch (error) {
      console.error('Error handling SMS authentication:', error);
      return { success: false, error: error instanceof Error ? error.message : 'SMS authentication error' };
    }
  }

  private async buildPriorAuthSubmissionSteps(
    priorAuth: any,
    formData: Record<string, any>,
    documents: string[]
  ): Promise<AutomationStep[]> {
    const steps: AutomationStep[] = [
      {
        name: 'Navigate to Prior Auth Portal',
        type: 'navigate',
        url: this.getPayerPortalUrl(priorAuth.payerId, 'prior-auth'),
      },
      {
        name: 'Start New Prior Auth Request',
        type: 'act',
        instruction: 'Click on "New Prior Authorization Request" or "Submit Prior Auth" button',
        retryable: true,
        maxRetries: 2,
      },
      {
        name: 'Fill Patient Demographics',
        type: 'act',
        instruction: `Fill out the patient information form with:
          - Patient Name: ${formData.patientName || priorAuth.patientName}
          - Date of Birth: ${formData.patientDob || priorAuth.patientDob}
          - Member ID: ${formData.memberId || priorAuth.memberId}
          - Phone: ${formData.patientPhone || priorAuth.patientPhone}`,
        retryable: true,
      },
      {
        name: 'Fill Provider Information',
        type: 'act',
        instruction: `Fill out the provider information with:
          - Provider Name: ${formData.providerName || priorAuth.providerName}
          - NPI: ${formData.providerNpi || priorAuth.providerNpi}
          - Phone: ${formData.providerPhone || priorAuth.providerPhone}
          - Fax: ${formData.providerFax || priorAuth.providerFax}`,
        retryable: true,
      },
      {
        name: 'Fill Clinical Information',
        type: 'act',
        instruction: `Fill out the clinical details:
          - Diagnosis Code: ${formData.diagnosisCode || priorAuth.primaryDiagnosis}
          - Procedure Code: ${formData.procedureCode || priorAuth.requestedService}
          - Clinical Notes: ${formData.clinicalRationale || priorAuth.clinicalRationale}`,
        retryable: true,
      },
    ];

    // Add document upload steps
    documents.forEach((documentPath, index) => {
      steps.push({
        name: `Upload Document ${index + 1}`,
        type: 'upload_file',
        filePath: documentPath,
        selector: 'input[type="file"], [accept*="pdf"], .file-upload',
        waitForText: 'uploaded successfully',
        retryable: true,
      });
    });

    steps.push({
      name: 'Review and Submit',
      type: 'act',
      instruction: 'Review all entered information and click Submit or Send Request button',
      retryable: true,
    });

    steps.push({
      name: 'Extract Confirmation Details',
      type: 'extract',
      instruction: 'Extract the confirmation number, reference number, and submission status from the success page',
      text: JSON.stringify({
        confirmationNumber: 'string',
        referenceNumber: 'string',
        submissionDate: 'string',
        status: 'string'
      }),
    });

    return steps;
  }

  private async buildStatusCheckSteps(
    priorAuth: any,
    referenceNumber?: string
  ): Promise<AutomationStep[]> {
    const refNumber = referenceNumber || priorAuth.referenceNumber || priorAuth.confirmationNumber;

    return [
      {
        name: 'Navigate to Status Check Page',
        type: 'navigate',
        url: this.getPayerPortalUrl(priorAuth.payerId, 'status'),
      },
      {
        name: 'Search for Prior Auth',
        type: 'act',
        instruction: `Search for prior authorization using reference number: ${refNumber}`,
        retryable: true,
      },
      {
        name: 'Extract Status Information',
        type: 'extract',
        instruction: 'Extract the current status, decision date, and any additional notes from the results',
        text: JSON.stringify({
          status: 'string',
          decision: 'string',
          decisionDate: 'string',
          notes: 'string',
          nextSteps: 'string'
        }),
      },
    ];
  }

  private getPayerPortalUrl(payerId: string, section: string): string {
    // This would be configurable per payer
    const portalMappings: Record<string, Record<string, string>> = {
      'covermymeds': {
        'prior-auth': 'https://portal.covermymeds.com/requests/new',
        'status': 'https://portal.covermymeds.com/requests/search',
      },
      'anthem': {
        'prior-auth': 'https://provider.anthem.com/prior-auth/new',
        'status': 'https://provider.anthem.com/prior-auth/status',
      },
      // Add other payers...
    };

    return portalMappings[payerId]?.[section] || `https://provider-portal.com/${section}`;
  }

  // Workflow management methods (same as before)
  private async createWorkflow(
    organizationId: string,
    priorAuthId: string,
    workflowType: string,
    automationLevel: string
  ): Promise<PriorAuthWorkflow> {
    const newWorkflow: NewPriorAuthWorkflow = {
      organizationId,
      priorAuthId,
      workflowType,
      automationLevel,
      currentStep: 'initializing',
      totalSteps: 0,
      status: 'pending',
    };

    const [workflow] = await db
      .insert(priorAuthWorkflows)
      .values(newWorkflow)
      .returning();

    return workflow;
  }

  private async updateWorkflow(workflowId: string, updates: Partial<PriorAuthWorkflow>): Promise<void> {
    await db
      .update(priorAuthWorkflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(priorAuthWorkflows.id, workflowId));
  }

  private async markWorkflowCompleted(workflowId: string, result?: any): Promise<void> {
    await this.updateWorkflow(workflowId, {
      status: 'completed',
      completedAt: new Date(),
      submissionResult: result,
    });
  }

  private async markWorkflowFailed(workflowId: string, error: string): Promise<void> {
    await this.updateWorkflow(workflowId, {
      status: 'failed',
      lastErrorMessage: error,
      errorCount: 1,
    });
  }

  private async logStepStart(
    workflowId: string,
    step: AutomationStep,
    stepNumber: number
  ): Promise<{ id: string }> {
    const newLog: NewWorkflowStepLog = {
      workflowId,
      stepName: step.name,
      stepNumber,
      stepType: step.type,
      status: 'in_progress',
    };

    const [log] = await db
      .insert(workflowStepLogs)
      .values(newLog)
      .returning({ id: workflowStepLogs.id });

    return log;
  }

  private async logStepCompletion(stepLogId: string, result: any): Promise<void> {
    await db
      .update(workflowStepLogs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result,
      })
      .where(eq(workflowStepLogs.id, stepLogId));
  }

  private async logStepFailure(stepLogId: string, error: string): Promise<void> {
    await db
      .update(workflowStepLogs)
      .set({
        status: 'failed',
        errorMessage: error,
        completedAt: new Date(),
      })
      .where(eq(workflowStepLogs.id, stepLogId));
  }

  private async requestHumanIntervention(
    workflowId: string,
    step: AutomationStep,
    reason: string
  ): Promise<void> {
    await this.updateWorkflow(workflowId, {
      status: 'waiting_human',
      humanInterventionRequired: true,
      humanInterventionReason: reason,
      humanNotifiedAt: new Date(),
    });
  }

  private async getPriorAuth(priorAuthId: string): Promise<any> {
    const priorAuthsData = await db
      .select()
      .from(priorAuths)
      .where(eq(priorAuths.id, priorAuthId))
      .limit(1);

    return priorAuthsData.length > 0 ? priorAuthsData[0] : null;
  }

  private async getWorkflowByPriorAuth(priorAuthId: string): Promise<PriorAuthWorkflow | null> {
    const workflows = await db
      .select()
      .from(priorAuthWorkflows)
      .where(eq(priorAuthWorkflows.priorAuthId, priorAuthId))
      .orderBy(priorAuthWorkflows.createdAt)
      .limit(1);

    return workflows.length > 0 ? workflows[0] : null;
  }

  private async saveStepScreenshot(stepLogId: string, screenshot: Buffer): Promise<string> {
    // TODO: Save to cloud storage (S3, etc.)
    const screenshotUrl = `https://screenshots.example.com/${stepLogId}.png`;

    await db
      .update(workflowStepLogs)
      .set({
        screenshotUrls: [screenshotUrl],
      })
      .where(eq(workflowStepLogs.id, stepLogId));

    return screenshotUrl;
  }

  async uploadDocuments(
    organizationId: string,
    priorAuthId: string,
    documents: string[]
  ): Promise<AutomationResult> {
    let stagehand: Stagehand | null = null;

    try {
      const priorAuth = await this.getPriorAuth(priorAuthId);
      if (!priorAuth) {
        return { success: false, error: 'Prior auth not found' };
      }

      const workflow = await this.createWorkflow(
        organizationId,
        priorAuthId,
        'upload_documents',
        'full_auto'
      );

      stagehand = new Stagehand(this.config);
      await stagehand.init();
      this.activeStagehandInstances.set(workflow.id, stagehand);

      // Authenticate with portal
      const sessionResult = await this.sessionManager.createSession(
        organizationId,
        priorAuth.payerId
      );

      if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
      }

      // Build document upload steps
      const steps = await this.buildDocumentUploadSteps(priorAuth, documents);
      const result = await this.executeAutomationWorkflow(workflow.id, steps, stagehand);

      return result;

    } catch (error) {
      console.error('Error uploading documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document upload error'
      };
    } finally {
      if (stagehand) {
        await stagehand.close();
      }
    }
  }

  private async buildDocumentUploadSteps(
    priorAuth: any,
    documents: string[]
  ): Promise<AutomationStep[]> {
    const steps: AutomationStep[] = [
      {
        name: 'Navigate to Prior Auth Portal',
        type: 'navigate',
        url: this.getPayerPortalUrl(priorAuth.payerId, 'prior-auth'),
      },
      {
        name: 'Find Existing Prior Auth',
        type: 'act',
        instruction: `Search for and navigate to existing prior authorization with reference: ${priorAuth.referenceNumber}`,
        retryable: true,
      },
    ];

    // Add document upload steps
    documents.forEach((documentPath, index) => {
      steps.push({
        name: `Upload Additional Document ${index + 1}`,
        type: 'upload_file',
        filePath: documentPath,
        selector: 'input[type="file"], [accept*="pdf"], .file-upload',
        waitForText: 'uploaded successfully',
        retryable: true,
      });
    });

    steps.push({
      name: 'Save Document Upload',
      type: 'act',
      instruction: 'Save or submit the uploaded documents',
      retryable: true,
    });

    return steps;
  }

  async cleanup(): Promise<void> {
    // Clean up active Stagehand instances
    for (const [workflowId, stagehand] of this.activeStagehandInstances) {
      try {
        await stagehand.close();
      } catch (error) {
        console.error(`Error closing Stagehand instance for workflow ${workflowId}:`, error);
      }
    }
    this.activeStagehandInstances.clear();
  }
}
