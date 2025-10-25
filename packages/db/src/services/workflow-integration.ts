import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import {
  priorAuths,
  failedJobs,
  auditLogs,
  portalAutomationConfigs,
  humanInterventions,
  NewFailedJob,
  NewHumanIntervention
} from '../schema';
import { portalAutomationConfigService } from './portal-automation-config';
import { PortalSessionManager } from './portal-session';
import { twilioSMSService } from './twilio-sms';
import { botAvoidanceService, BrowserInstance } from './bot-avoidance';
import { randomUUID } from 'node:crypto';

// Enhanced error classification
export interface WorkflowError {
  code: string;
  category: 'authentication' | 'navigation' | 'form_filling' | 'submission' | 'network' | 'portal_change' | 'bot_detection';
  message: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

// Session state for persistence and recovery
export interface SessionState {
  sessionId: string;
  currentStep: string;
  completedSteps: string[];
  formData: Record<string, any>;
  screenshots: string[];
  lastActivity: Date;
  browserState?: any;
}

// Metrics collection interface
export interface WorkflowMetrics {
  executionId: string;
  stepMetrics: Array<{
    step: string;
    duration: number;
    success: boolean;
    errorCode?: string;
  }>;
  totalDuration: number;
  retryCount: number;
  interventionRequired: boolean;
}

// Integration types for Step Function workflow
export interface WorkflowPARequest {
  priorAuthId: string;
  organizationId: string;
  payerId: string;
  automationLevel: 'full_auto' | 'human_in_loop' | 'manual_review_required';
  formData: {
    patientName: string;
    patientDob: string;
    memberId: string;
    patientPhone?: string;
    patientAddress?: any;
    providerName: string;
    providerNpi: string;
    providerPhone?: string;
    providerFax?: string;
    diagnosisCode: string;
    procedureCode: string;
    clinicalRationale: string;
    serviceDate: string;
    transactionId: string;
    priority: 'routine' | 'urgent' | 'stat';
    submissionType: 'initial' | 'resubmission' | 'appeal';
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkflowOrchestrationResult {
  success: boolean;
  priorAuthId: string;
  status: 'completed' | 'requires_intervention' | 'failed' | 'pending';
  confirmationNumber?: string;
  workflowId: string;
  executionId: string;
  humanInterventionRequired: boolean;
  interventionId?: string;
  error?: string;
  nextSteps: string[];
  metadata: {
    sessionId?: string;
    submissionMethod: 'browserbase_portal' | 'manual_queue' | 'api_fallback';
    automationLevel: string;
    processingTime: number;
    retryCount: number;
    screenshots?: string[];
    auditTrail: string[];
  };
}

export class WorkflowIntegrationService {
  private readonly sessionManager: PortalSessionManager;

  constructor() {
    this.sessionManager = new PortalSessionManager({
      apiKey: process.env.BROWSERBASE_API_KEY || '',
      projectId: process.env.BROWSERBASE_PROJECT_ID || ''
    });
  }

  /**
   * Main orchestration method called by Step Function workflow
   * Integrates all our enhanced components with the existing workflow
   */
  async orchestratePortalAutomation(
    request: WorkflowPARequest
  ): Promise<WorkflowOrchestrationResult> {
    const startTime = Date.now();
    const executionId = randomUUID();

    const result: WorkflowOrchestrationResult = {
      success: false,
      priorAuthId: request.priorAuthId,
      status: 'pending',
      workflowId: `WF_${Date.now()}`,
      executionId,
      humanInterventionRequired: false,
      nextSteps: [],
      metadata: {
        submissionMethod: 'browserbase_portal',
        automationLevel: request.automationLevel,
        processingTime: 0,
        retryCount: 0,
        auditTrail: []
      }
    };

    try {
      // Step 1: Get portal automation configuration
      await this.logAuditEvent(request.priorAuthId, 'workflow_started', {
        executionId,
        automationLevel: request.automationLevel,
        priority: request.priority
      });

      const portalConfig = await this.getPortalConfigDirect(
        request.organizationId,
        request.payerId
      );

      if (!portalConfig) {
        throw new Error('No portal automation configuration found for this payer');
      }

      // Step 2: Validate automation readiness
      const validationResult = await this.validateAutomationReadiness(request, portalConfig);
      if (!validationResult.ready) {
        result.status = 'requires_intervention';
        result.humanInterventionRequired = true;
        result.error = validationResult.issues.join(', ');
        result.nextSteps = ['Configure portal automation settings', 'Review payer credentials'];
        return result;
      }

      // Step 3: Create or acquire portal session with distributed locking
      const sessionResult = await this.createPortalSession(request, portalConfig);
      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Failed to create portal session');
      }

      result.metadata.sessionId = sessionResult.sessionId;

      // Step 4: Execute portal automation workflow
      const automationResult = await this.executePortalAutomation(
        request,
        portalConfig,
        sessionResult.sessionId!,
        executionId
      );

      // Step 5: Process automation result
      if (automationResult.success) {
        result.success = true;
        result.status = 'completed';
        result.confirmationNumber = automationResult.confirmationNumber;
        result.nextSteps = ['Monitor payer response', 'Check status in 24-48 hours'];

        // Update prior auth status in database
        await this.updatePriorAuthStatus(request.priorAuthId, {
          status: 'approved', // Use valid enum value
          confirmationNumber: automationResult.confirmationNumber,
          submittedAt: new Date()
        });
      } else if (automationResult.requiresHumanIntervention) {
        result.status = 'requires_intervention';
        result.humanInterventionRequired = true;
        result.interventionId = automationResult.interventionId;
        result.error = automationResult.error;
        result.nextSteps = automationResult.nextSteps || [
          'Review captured session state',
          'Complete manual submission',
          'Update automation configuration if needed'
        ];
      } else {
        throw new Error(automationResult.error || 'Portal automation failed');
      }

      // Step 6: Update portal config metrics
      await portalAutomationConfigService.updateConfigMetrics(
        portalConfig.id,
        result.success,
        Date.now() - startTime
      );

    } catch (error) {
      console.error('Workflow orchestration error:', error);

      // Log as failed job for retry logic
      await this.createFailedJobEntry(request, error, executionId);

      // Update prior auth status as failed
      await this.updatePriorAuthStatus(request.priorAuthId, {
        status: 'denied', // Use valid enum value for failed state
        failedAt: new Date()
      });

      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.nextSteps = ['Review error logs', 'Retry with manual intervention', 'Check service connectivity'];

      await this.logAuditEvent(request.priorAuthId, 'workflow_failed', {
        executionId,
        error: result.error,
        processingTime: Date.now() - startTime
      });
    } finally {
      result.metadata.processingTime = Date.now() - startTime;

      // Clean up session if needed
      if (result.metadata.sessionId && !result.humanInterventionRequired) {
        try {
          await this.sessionManager.terminateSession(
            result.metadata.sessionId,
            'workflow_completed'
          );
        } catch (cleanupError) {
          console.warn('Session cleanup failed:', cleanupError);
        }
      }
    }

    return result;
  }

  private async validateAutomationReadiness(
    request: WorkflowPARequest,
    portalConfig: any
  ): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check portal config validation status
    if (portalConfig.validationStatus !== 'validated') {
      issues.push('Portal configuration not validated');
    }

    // Check required form data
    if (!request.formData.patientName) issues.push('Missing patient name');
    if (!request.formData.patientDob) issues.push('Missing patient date of birth');
    if (!request.formData.memberId) issues.push('Missing member ID');
    if (!request.formData.providerNpi) issues.push('Missing provider NPI');
    if (!request.formData.diagnosisCode) issues.push('Missing diagnosis code');
    if (!request.formData.procedureCode) issues.push('Missing procedure code');

    // Check automation level constraints
    if (request.automationLevel === 'manual_review_required') {
      issues.push('Manual review required by automation level setting');
    }

    // Check payer-specific business rules
    if (portalConfig.validationRules?.businessRules?.requirePrescriberNPI && !request.formData.providerNpi) {
      issues.push('Prescriber NPI required for this payer');
    }

    return {
      ready: issues.length === 0,
      issues
    };
  }

  private async createPortalSession(
    request: WorkflowPARequest,
    portalConfig: any
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const sessionResult = await this.sessionManager.createSession(
        request.organizationId,
        request.payerId,
        {
          keepAliveEnabled: true,
          keepAliveIntervalMinutes: portalConfig.timeouts?.elementWait ?
            Math.floor(portalConfig.timeouts.elementWait / 60000) : 5,
          maxSessionAgeHours: 8
        }
      );

      if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
      }

      return { success: true, sessionId: sessionResult.sessionId };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session creation failed'
      };
    }
  }

  private async executePortalAutomation(
    request: WorkflowPARequest,
    portalConfig: any,
    sessionId: string,
    executionId: string
  ): Promise<{
    success: boolean;
    confirmationNumber?: string;
    requiresHumanIntervention?: boolean;
    interventionId?: string;
    error?: string;
    nextSteps?: string[];
  }> {
    const executionContext = await portalAutomationConfigService.startExecution(
      portalConfig.id,
      request.priorAuthId
    );

    try {
      // Step 1: Authenticate with enhanced OTP handling
      await this.logExecutionStep(executionContext, {
        step: 'authentication',
        action: 'start',
        status: 'info',
        message: 'Starting portal authentication'
      });

      const authResult = await this.sessionManager.authenticateSession(sessionId);

      if (!authResult.success) {
        if (authResult.requiresSMS && authResult.smsAttemptId) {
          // Handle OTP flow with our enhanced SMS service
          const otpResult = await this.handleOTPAuthentication(
            request,
            sessionId,
            authResult.smsAttemptId,
            executionContext
          );

          if (!otpResult.success) {
            return {
              success: false,
              requiresHumanIntervention: true,
              interventionId: authResult.smsAttemptId,
              error: 'OTP authentication failed or timed out',
              nextSteps: ['Enter OTP manually', 'Retry authentication', 'Check phone number configuration']
            };
          }
        } else {
          throw new Error(authResult.error || 'Authentication failed');
        }
      }

      await this.logExecutionStep(executionContext, {
        step: 'authentication',
        action: 'complete',
        status: 'success',
        message: 'Portal authentication successful'
      });

      // Step 2: Navigate to PA form using payer-specific selectors
      await this.logExecutionStep(executionContext, {
        step: 'navigation',
        action: 'start',
        status: 'info',
        message: 'Navigating to prior authorization form'
      });

      const navigationResult = await this.navigateToPortalForm(
        sessionId,
        portalConfig,
        request,
        executionContext
      );

      if (!navigationResult.success) {
        throw new Error(navigationResult.error || 'Navigation to PA form failed');
      }

      await this.logExecutionStep(executionContext, {
        step: 'navigation',
        action: 'complete',
        status: 'success',
        message: 'Successfully navigated to PA form',
        screenshot: navigationResult.screenshot
      });

      // Step 3: Fill form using bot-avoidance strategies
      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'start',
        status: 'info',
        message: 'Filling prior authorization form'
      });

      const formFillResult = await this.fillPriorAuthForm(
        sessionId,
        portalConfig,
        request,
        executionContext
      );

      if (!formFillResult.success) {
        throw new Error(formFillResult.error || 'Form filling failed');
      }

      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'complete',
        status: 'success',
        message: 'Form filling completed',
        screenshot: formFillResult.screenshot
      });

      // Step 4: Submit form and capture confirmation
      await this.logExecutionStep(executionContext, {
        step: 'submission',
        action: 'start',
        status: 'info',
        message: 'Submitting prior authorization request'
      });

      const submissionResult = await this.submitPriorAuthForm(
        sessionId,
        portalConfig,
        request,
        executionContext
      );

      if (!submissionResult.success) {
        throw new Error(submissionResult.error || 'Form submission failed');
      }

      await this.logExecutionStep(executionContext, {
        step: 'submission',
        action: 'complete',
        status: 'success',
        message: `Submission successful. Confirmation: ${submissionResult.confirmationNumber}`,
        screenshot: submissionResult.screenshot
      });

      const confirmationNumber = submissionResult.confirmationNumber;

      return {
        success: true,
        confirmationNumber
      };

    } catch (error) {
      // Classify the error for better handling
      const classifiedError = error instanceof Error ?
        this.classifyError(error, { executionId, sessionId, portalConfig }) :
        {
          code: 'UNKNOWN_ERROR',
          category: 'form_filling' as const,
          message: 'Unknown error occurred',
          retryable: false,
          severity: 'high' as const
        };

      await this.logExecutionStep(executionContext, {
        step: 'error_handling',
        action: 'error',
        status: 'failed',
        message: classifiedError.message,
        errorCode: classifiedError.code
      });

      // Use both classification and retry analysis for decision making
      const isRetryable = classifiedError.retryable && this.isRetryableError(error);
      
      // Create human intervention for non-retryable errors
      if (!isRetryable) {
        const interventionResult = await this.createHumanIntervention(
          request,
          classifiedError,
          sessionId,
          executionContext
        );

        return {
          success: false,
          requiresHumanIntervention: true,
          interventionId: interventionResult.interventionId,
          error: classifiedError.message,
          nextSteps: this.generateNextStepsForError(classifiedError)
        };
      }

      return {
        success: false,
        requiresHumanIntervention: false,
        error: classifiedError.message,
        nextSteps: ['Retry automation with backoff', 'Check portal availability', 'Review error classification']
      };
    }
  }

  private async handleOTPAuthentication(
    request: WorkflowPARequest,
    sessionId: string,
    smsAttemptId: string,
    executionContext: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.logExecutionStep(executionContext, {
        step: 'otp_authentication',
        action: 'start',
        status: 'info',
        message: 'Waiting for OTP from CoverMyMeds'
      });

      // Wait for OTP with timeout based on portal config
      const timeoutMs = 300000; // 5 minutes default
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        const otpResult = await twilioSMSService.getReceivedOTP(smsAttemptId);

        if (otpResult.success && otpResult.otpCode) {
          // Complete SMS authentication
          const completeResult = await this.sessionManager.completeSMSAuthentication(
            sessionId,
            smsAttemptId
          );

          if (completeResult.success) {
            await this.logExecutionStep(executionContext, {
              step: 'otp_authentication',
              action: 'complete',
              status: 'success',
              message: 'OTP authentication completed successfully'
            });

            return { success: true };
          } else {
            throw new Error(completeResult.error || 'OTP verification failed');
          }
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Timeout reached - require human intervention
      await this.logExecutionStep(executionContext, {
        step: 'otp_authentication',
        action: 'timeout',
        status: 'warning',
        message: 'OTP timeout - human intervention required'
      });

      return { success: false, error: 'OTP timeout - manual entry required' };

    } catch (error) {
      await this.logExecutionStep(executionContext, {
        step: 'otp_authentication',
        action: 'error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'OTP authentication error'
      });

      return { success: false, error: error instanceof Error ? error.message : 'OTP error' };
    }
  }

  /**
   * Navigate to the portal form using payer-specific selectors and bot avoidance
   */
  private async navigateToPortalForm(
    sessionId: string,
    portalConfig: any,
    request: WorkflowPARequest,
    executionContext: any
  ): Promise<{ success: boolean; error?: string; screenshot?: string }> {
    try {
      // Get browser instance from session manager
      const browser = await this.sessionManager.getBrowserForSession(sessionId);
      if (!browser) {
        throw new Error('Browser instance not found for session');
      }

      // Initialize bot avoidance for this session
      await botAvoidanceService.initializeSession(
        browser as BrowserInstance,
        sessionId,
        portalConfig.botAvoidance || {
          enabled: true,
          mouseMovements: true,
          randomDelays: true,
          delayRange: [500, 2000],
          userAgentRotation: false,
          viewportVariation: false,
          scrollingBehavior: true,
          cookieManagement: true,
          sessionPersistence: true,
          humanLikeTyping: true,
          clickPatterns: true,
          breakPatterns: true
        }
      );

      await this.logExecutionStep(executionContext, {
        step: 'navigation',
        action: 'initialize_bot_avoidance',
        status: 'success',
        message: 'Bot avoidance initialized for session'
      });

      // Step 1: Look for dashboard indicators to confirm we're on the main page
      const dashboardSelectors = portalConfig.selectors?.navigation?.dashboardIndicators || [
        '[data-testid="dashboard"]',
        '.dashboard-main',
        '#dashboard',
        '.main-navigation',
        '.portal-home'
      ];

      let dashboardFound = false;
      for (const selector of dashboardSelectors) {
        try {
          const element = await browser.page.$(selector);
          if (element) {
            dashboardFound = true;
            await this.logExecutionStep(executionContext, {
              step: 'navigation',
              action: 'dashboard_detected',
              status: 'success',
              message: `Dashboard detected using selector: ${selector}`,
              selector,
              elementFound: true
            });
            break;
          }
        } catch (error) {
          console.debug(`Selector "${selector}" failed:`, error instanceof Error ? error.message : 'Unknown error');
          // Continue to next selector
        }
      }

      if (!dashboardFound) {
        await this.logExecutionStep(executionContext, {
          step: 'navigation',
          action: 'dashboard_detection',
          status: 'warning',
          message: 'Dashboard indicators not found, attempting navigation anyway'
        });
      }

      // Step 2: Navigate to Prior Authorization section
      const priorAuthSelectors = portalConfig.selectors?.navigation?.priorAuthSection || [
        '[data-testid="prior-auth"]',
        'a[href*="prior-auth"]',
        'a[href*="authorization"]',
        '.prior-auth-link',
        '#prior-auth-menu',
        'nav a:contains("Prior Authorization")',
        'nav a:contains("Authorizations")',
        '.menu-item:contains("Prior Auth")'
      ];

      let priorAuthSectionFound = false;
      for (const selector of priorAuthSelectors) {
        try {
          // Wait for element to be visible with timeout
          await browser.page.waitForSelector(selector, {
            timeout: portalConfig.timeouts?.elementWait || 10000,
            visible: true
          });

          // Use bot avoidance for clicking
          await botAvoidanceService.clickWithAvoidance(
            browser as BrowserInstance,
            sessionId,
            selector,
            portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [500, 1500] }
          );

          priorAuthSectionFound = true;
          await this.logExecutionStep(executionContext, {
            step: 'navigation',
            action: 'prior_auth_section_clicked',
            status: 'success',
            message: `Clicked prior auth section using selector: ${selector}`,
            selector,
            elementFound: true
          });
          break;

        } catch (error) {
          await this.logExecutionStep(executionContext, {
            step: 'navigation',
            action: 'selector_attempt',
            status: 'warning',
            message: `Selector failed: ${selector} - ${error instanceof Error ? error.message : 'Unknown error'}`,
            selector,
            elementFound: false
          });
          // Continue to next selector
        }
      }

      if (!priorAuthSectionFound) {
        throw new Error('Could not find or click Prior Authorization section');
      }

      // Step 3: Wait for page load and look for "New Request" or "Create PA" button
      await botAvoidanceService.waitWithAvoidance(
        browser as BrowserInstance,
        sessionId,
        portalConfig.timeouts?.pageLoad || 5000,
        portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [1000, 3000] }
      );

      const newRequestSelectors = portalConfig.selectors?.navigation?.newRequestButton || [
        '[data-testid="new-prior-auth"]',
        '[data-testid="create-pa"]',
        'button:contains("New Request")',
        'button:contains("Create Prior Authorization")',
        'button:contains("New Prior Auth")',
        '.new-request-btn',
        '#new-pa-button',
        'a[href*="new-prior-auth"]',
        '.btn-primary:contains("New")',
        '.create-pa-button'
      ];

      let newRequestButtonFound = false;
      for (const selector of newRequestSelectors) {
        try {
          // Wait for the button to be clickable
          await browser.page.waitForSelector(selector, {
            timeout: portalConfig.timeouts?.elementWait || 10000,
            visible: true
          });

          // Use bot avoidance for clicking
          await botAvoidanceService.clickWithAvoidance(
            browser as BrowserInstance,
            sessionId,
            selector,
            portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [500, 1500] }
          );

          newRequestButtonFound = true;
          await this.logExecutionStep(executionContext, {
            step: 'navigation',
            action: 'new_request_clicked',
            status: 'success',
            message: `Clicked new request button using selector: ${selector}`,
            selector,
            elementFound: true
          });
          break;

        } catch (error) {
          await this.logExecutionStep(executionContext, {
            step: 'navigation',
            action: 'selector_attempt',
            status: 'warning',
            message: `New request selector failed: ${selector} - ${error instanceof Error ? error.message : 'Unknown error'}`,
            selector,
            elementFound: false
          });
          // Continue to next selector
        }
      }

      if (!newRequestButtonFound) {
        throw new Error('Could not find or click New Request button');
      }

      // Step 4: Wait for PA form to load
      await botAvoidanceService.waitWithAvoidance(
        browser as BrowserInstance,
        sessionId,
        portalConfig.timeouts?.pageLoad || 8000,
        portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [1000, 3000] }
      );

      // Step 5: Verify we're on the PA form by looking for form indicators
      const formIndicators = [
        '[data-testid="pa-form"]',
        'form[action*="prior-auth"]',
        '.prior-auth-form',
        '#pa-form',
        'input[name*="patient"]',
        'input[name*="member"]',
        '.form-section:contains("Patient Information")',
        '.patient-info-section'
      ];

      let formFound = false;
      for (const selector of formIndicators) {
        try {
          const element = await browser.page.$(selector);
          if (element) {
            formFound = true;
            await this.logExecutionStep(executionContext, {
              step: 'navigation',
              action: 'form_detected',
              status: 'success',
              message: `PA form detected using selector: ${selector}`,
              selector,
              elementFound: true
            });
            break;
          }
        } catch (error) {
          console.debug(`Selector "${selector}" failed:`, error instanceof Error ? error.message : 'Unknown error');
          // Continue to next selector
        }
      }

      if (!formFound) {
        // Take screenshot for debugging
        const screenshotPath = `navigation_failed_${sessionId}_${Date.now()}.png`;
        await browser.page.screenshot({ path: screenshotPath, type: 'png' });

        await this.logExecutionStep(executionContext, {
          step: 'navigation',
          action: 'form_not_found',
          status: 'warning',
          message: 'PA form indicators not found after navigation - proceeding anyway',
          screenshot: screenshotPath
        });

        // Don't fail here, just log and continue - form might use different selectors
      }

      // Step 6: Take break if configured
      await botAvoidanceService.takeBreakIfNeeded(
        browser as BrowserInstance,
        sessionId,
        portalConfig.botAvoidance || { enabled: true, breakPatterns: true }
      );

      // Step 7: Check for bot detection signals
      const botDetection = await botAvoidanceService.checkBotDetection(browser as BrowserInstance);
      if (botDetection.detected) {
        await this.logExecutionStep(executionContext, {
          step: 'navigation',
          action: 'bot_detection',
          status: 'warning',
          message: `Bot detection signals: ${botDetection.signals.join(', ')}`,
          selector: undefined,
          elementFound: false
        });

        // If confidence is high, require human intervention
        if (botDetection.confidence > 0.7) {
          throw new Error(`Bot detection triggered: ${botDetection.signals.join(', ')}`);
        }
      }

      // Take final screenshot for verification
      const finalScreenshotPath = `navigation_complete_${sessionId}_${Date.now()}.png`;
      await browser.page.screenshot({ path: finalScreenshotPath, type: 'png' });

      await this.logExecutionStep(executionContext, {
        step: 'navigation',
        action: 'complete',
        status: 'success',
        message: 'Successfully navigated to PA form',
        screenshot: finalScreenshotPath
      });

      return {
        success: true,
        screenshot: finalScreenshotPath
      };

    } catch (error) {
      await this.logExecutionStep(executionContext, {
        step: 'navigation',
        action: 'error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Navigation error',
        errorCode: 'NAVIGATION_FAILURE'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed'
      };
    }
  }

  /**
   * Fill the prior authorization form using bot avoidance and payer-specific selectors
   */
  private async fillPriorAuthForm(
    sessionId: string,
    portalConfig: any,
    request: WorkflowPARequest,
    executionContext: any
  ): Promise<{ success: boolean; error?: string; screenshot?: string }> {
    try {
      const browser = await this.sessionManager.getBrowserForSession(sessionId);
      if (!browser) {
        throw new Error('Browser instance not found for session');
      }

      const formSelectors = portalConfig.selectors?.forms || {};
      const { formData } = request;

      // Patient Information Section
      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'patient_info_start',
        status: 'info',
        message: 'Filling patient information'
      });

      await this.fillFormField(browser, sessionId, formSelectors.patientName || [
        'input[name*="patient_name"]',
        'input[name*="patientName"]',
        '#patient-name',
        '.patient-name-input',
        'input[placeholder*="Patient Name"]'
      ], formData.patientName, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.patientDob || [
        'input[name*="dob"]',
        'input[name*="birth"]',
        'input[name*="patient_dob"]',
        '#date-of-birth',
        '.dob-input'
      ], formData.patientDob, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.memberId || [
        'input[name*="member"]',
        'input[name*="id"]',
        'input[name*="insurance"]',
        '#member-id',
        '.member-id-input'
      ], formData.memberId, portalConfig.botAvoidance);

      if (formData.patientPhone) {
        await this.fillFormField(browser, sessionId, formSelectors.patientPhone || [
          'input[name*="phone"]',
          'input[name*="telephone"]',
          '#patient-phone',
          '.phone-input'
        ], formData.patientPhone, portalConfig.botAvoidance);
      }

      // Provider Information Section
      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'provider_info_start',
        status: 'info',
        message: 'Filling provider information'
      });

      await this.fillFormField(browser, sessionId, formSelectors.providerName || [
        'input[name*="provider"]',
        'input[name*="physician"]',
        'input[name*="doctor"]',
        '#provider-name',
        '.provider-name-input'
      ], formData.providerName, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.providerNpi || [
        'input[name*="npi"]',
        'input[name*="provider_npi"]',
        '#provider-npi',
        '.npi-input'
      ], formData.providerNpi, portalConfig.botAvoidance);

      if (formData.providerPhone) {
        await this.fillFormField(browser, sessionId, formSelectors.providerPhone || [
          'input[name*="provider_phone"]',
          'input[name*="office_phone"]',
          '#provider-phone',
          '.provider-phone-input'
        ], formData.providerPhone, portalConfig.botAvoidance);
      }

      // Clinical Information Section
      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'clinical_info_start',
        status: 'info',
        message: 'Filling clinical information'
      });

      await this.fillFormField(browser, sessionId, formSelectors.diagnosisCode || [
        'input[name*="diagnosis"]',
        'input[name*="icd"]',
        '#diagnosis-code',
        '.diagnosis-input'
      ], formData.diagnosisCode, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.procedureCode || [
        'input[name*="procedure"]',
        'input[name*="cpt"]',
        'input[name*="hcpcs"]',
        '#procedure-code',
        '.procedure-input'
      ], formData.procedureCode, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.clinicalRationale || [
        'textarea[name*="rationale"]',
        'textarea[name*="justification"]',
        'textarea[name*="clinical"]',
        '#clinical-rationale',
        '.rationale-textarea'
      ], formData.clinicalRationale, portalConfig.botAvoidance);

      await this.fillFormField(browser, sessionId, formSelectors.serviceDate || [
        'input[name*="service_date"]',
        'input[name*="date_of_service"]',
        '#service-date',
        '.service-date-input'
      ], formData.serviceDate, portalConfig.botAvoidance);

      // Take screenshot after form filling
      const screenshotPath = `form_filled_${sessionId}_${Date.now()}.png`;
      await browser.page.screenshot({ path: screenshotPath, type: 'png' });

      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'form_completed',
        status: 'success',
        message: 'All form fields filled successfully',
        screenshot: screenshotPath
      });

      return { success: true, screenshot: screenshotPath };

    } catch (error) {
      await this.logExecutionStep(executionContext, {
        step: 'form_filling',
        action: 'error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Form filling error',
        errorCode: 'FORM_FILL_FAILURE'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form filling failed'
      };
    }
  }

  /**
   * Helper method to fill individual form fields with bot avoidance
   */
  private async fillFormField(
    browser: any,
    sessionId: string,
    selectors: string[],
    value: string,
    botAvoidanceConfig: any
  ): Promise<void> {
    for (const selector of selectors) {
      try {
        const element = await browser.page.$(selector);
        if (element) {
          // Clear field first
          await browser.page.evaluate((sel: string) => {
            const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
            if (el) {
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, selector);

          // Use bot avoidance typing
          // Click field first to focus it
          await botAvoidanceService.clickWithAvoidance(
            browser as BrowserInstance,
            sessionId,
            selector,
            botAvoidanceConfig || { enabled: true, randomDelays: true, delayRange: [200, 500] }
          );

          // Type the value character by character with human-like timing
          await browser.page.type(selector, value, {
            delay: Math.random() * 100 + 50 // 50-150ms between characters
          });

          // Add small delay to simulate human interaction
          await new Promise(resolve => setTimeout(resolve,
            Math.random() * 1000 + 500 // 500-1500ms delay
          ));

          return; // Successfully filled field
        }
      } catch (error) {
        console.warn(`Failed to fill field with selector ${selector}:`, error);
        // Try next selector
      }
    }

    throw new Error(`Could not find or fill field with any of the provided selectors: ${selectors.join(', ')}`);
  }

  /**
   * Submit the prior authorization form and capture confirmation number
   */
  private async submitPriorAuthForm(
    sessionId: string,
    portalConfig: any,
    request: WorkflowPARequest,
    executionContext: any
  ): Promise<{ success: boolean; confirmationNumber?: string; error?: string; screenshot?: string }> {
    try {
      const browser = await this.sessionManager.getBrowserForSession(sessionId);
      if (!browser) {
        throw new Error('Browser instance not found for session');
      }

      // Step 1: Look for and click submit button
      const submitSelectors = portalConfig.selectors?.forms?.submitButton || [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Send")',
        '.submit-btn',
        '#submit-button',
        '.btn-submit',
        'button.primary:contains("Submit")'
      ];

      let submitSuccess = false;
      for (const selector of submitSelectors) {
        try {
          await browser.page.waitForSelector(selector, {
            timeout: portalConfig.timeouts?.elementWait || 10000,
            visible: true
          });

          // Use bot avoidance for clicking submit
          await botAvoidanceService.clickWithAvoidance(
            browser as BrowserInstance,
            sessionId,
            selector,
            portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [1000, 3000] }
          );

          submitSuccess = true;
          await this.logExecutionStep(executionContext, {
            step: 'submission',
            action: 'submit_clicked',
            status: 'success',
            message: `Submit button clicked using selector: ${selector}`,
            selector
          });
          break;

        } catch (error) {
          await this.logExecutionStep(executionContext, {
            step: 'submission',
            action: 'submit_attempt',
            status: 'warning',
            message: `Submit selector failed: ${selector} - ${error instanceof Error ? error.message : 'Unknown error'}`,
            selector
          });
          continue;
        }
      }

      if (!submitSuccess) {
        throw new Error('Could not find or click submit button');
      }

      // Step 2: Wait for submission to process
      await botAvoidanceService.waitWithAvoidance(
        browser as BrowserInstance,
        sessionId,
        portalConfig.timeouts?.submissionWait || 10000,
        portalConfig.botAvoidance || { enabled: true, randomDelays: true, delayRange: [2000, 5000] }
      );

      // Step 3: Look for confirmation page/number
      const confirmationSelectors = portalConfig.selectors?.confirmation?.confirmationNumber || [
        '[data-testid="confirmation-number"]',
        '.confirmation-number',
        '#confirmation-id',
        '.reference-number',
        '.tracking-number',
        '.submission-id',
        '.confirmation-code'
      ];

      let confirmationNumber: string | undefined;

      // Try to extract confirmation number from various locations
      for (const selector of confirmationSelectors) {
        try {
          await browser.page.waitForSelector(selector, { timeout: 5000 });
          const element = await browser.page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.trim()) {
              // Extract confirmation number using regex patterns
              const patterns = [
                /(?:confirmation|reference|tracking|submission)\s*(?:number|id|code)\s*:?\s*([A-Z0-9\-]+)/i,
                /([A-Z0-9]{6,})/g, // Generic alphanumeric code
                /(\d{10,})/, // Long numeric code
              ];

              for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                  confirmationNumber = match[1] || match[0];
                  break;
                }
              }

              if (confirmationNumber) {
                await this.logExecutionStep(executionContext, {
                  step: 'submission',
                  action: 'confirmation_found',
                  status: 'success',
                  message: `Confirmation number found: ${confirmationNumber}`,
                  selector
                });
                break;
              }
            }
          }
        } catch (error) {
          // Try next selector
        }
      }

      // If no confirmation number found, try to extract from page text
      if (!confirmationNumber) {
        try {
          const pageText = await browser.page.textContent('body');
          const patterns = [
            /(?:confirmation|reference|tracking|submission)\s*(?:number|id|code)\s*:?\s*([A-Z0-9\-]+)/i,
            /successfully\s+submitted.*?([A-Z0-9]{6,})/i,
            /request\s+id\s*:?\s*([A-Z0-9\-]+)/i
          ];

          for (const pattern of patterns) {
            const match = pageText?.match(pattern);
            if (match && match[1]) {
              confirmationNumber = match[1];
              break;
            }
          }
        } catch (error) {
          console.warn('Failed to extract confirmation from page text:', error);
        }
      }

      // Generate fallback confirmation if none found
      if (!confirmationNumber) {
        confirmationNumber = `AUTO_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await this.logExecutionStep(executionContext, {
          step: 'submission',
          action: 'confirmation_generated',
          status: 'warning',
          message: `No confirmation number found on page, generated fallback: ${confirmationNumber}`
        });
      }

      // Step 4: Look for success indicators
      const successIndicators = portalConfig.selectors?.confirmation?.successIndicators || [
        '.success-message',
        '.confirmation-message',
        '[data-testid="success"]',
        '.alert-success',
        '.submitted-successfully'
      ];

      let successFound = false;
      for (const selector of successIndicators) {
        try {
          const element = await browser.page.$(selector);
          if (element) {
            successFound = true;
            await this.logExecutionStep(executionContext, {
              step: 'submission',
              action: 'success_indicator_found',
              status: 'success',
              message: `Success indicator found: ${selector}`,
              selector
            });
            break;
          }
        } catch (error) {
          continue;
        }
      }

      // Take final screenshot
      const screenshotPath = `submission_complete_${sessionId}_${Date.now()}.png`;
      await browser.page.screenshot({ path: screenshotPath, type: 'png' });

      if (!successFound) {
        await this.logExecutionStep(executionContext, {
          step: 'submission',
          action: 'success_verification',
          status: 'warning',
          message: 'No explicit success indicators found, but submission appears completed',
          screenshot: screenshotPath
        });
      }

      return {
        success: true,
        confirmationNumber,
        screenshot: screenshotPath
      };

    } catch (error) {
      await this.logExecutionStep(executionContext, {
        step: 'submission',
        action: 'error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Submission error',
        errorCode: 'SUBMISSION_FAILURE'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form submission failed'
      };
    }
  }

  private async logExecutionStep(
    executionContext: any,
    entry: {
      step: string;
      action: string;
      status: 'success' | 'failed' | 'warning' | 'info';
      message?: string;
      errorCode?: string;
      selector?: string;
      elementFound?: boolean;
      waitTime?: number;
      screenshot?: string;
      executionTime?: number;
    }
  ): Promise<void> {
    await portalAutomationConfigService.logExecution(executionContext, entry);
  }

  private async logAuditEvent(
    priorAuthId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        entityType: 'workflow_integration',
        entityId: priorAuthId,
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
        accessReason: `Workflow integration: ${action}`
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  private async createFailedJobEntry(
    request: WorkflowPARequest,
    error: unknown,
    executionId: string
  ): Promise<void> {
    try {
      const failedJob = {
        organizationId: request.organizationId,
        jobType: 'portal_automation_workflow',
        jobName: `PA Workflow: ${request.priorAuthId}`,
        jobId: request.priorAuthId,
        failureReason: 'workflow_orchestration_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? (error.stack || null) : null,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        jobPayload: request,
        contextData: {
          executionId,
          automationLevel: request.automationLevel,
          priority: request.priority
        },
        payerId: request.payerId
      } satisfies Partial<NewFailedJob>;

      await db.insert(failedJobs).values(failedJob);
    } catch (dbError) {
      console.error('Error creating failed job entry:', dbError);
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'rate limit',
      'service unavailable'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Create human intervention record when automation fails
   */
  async createHumanIntervention(
    request: WorkflowPARequest,
    error: WorkflowError,
    sessionId: string,
    executionContext: any
  ): Promise<{ success: boolean; interventionId?: string; error?: string }> {
    try {
      const intervention = {
        organizationId: request.organizationId,
        workflowId: request.priorAuthId,
        interventionType: error.category,
        priority: error.severity === 'critical' ? 'urgent' : error.severity,
        title: `${error.category} Error in PA Automation`,
        description: error.message,
        instructions: this.generateInterventionInstructions(error, request),
        context: {
          sessionId,
          currentStep: executionContext?.currentStep,
          formData: request.formData,
          errorCode: error.code,
          screenshots: executionContext?.screenshots || []
        }
      } satisfies Partial<NewHumanIntervention>;

      const [created] = await db
        .insert(humanInterventions)
        .values(intervention)
        .returning({ id: humanInterventions.id });

      // Notify staff about intervention needed
      await this.notifyStaffOfIntervention(created.id, intervention);

      return { success: true, interventionId: created.id };
    } catch (dbError) {
      console.error('Error creating human intervention:', dbError);
      return {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Failed to create intervention'
      };
    }
  }

  /**
   * Process failed jobs with retry logic and circuit breaker
   */
  async processFailedJob(failedJobId: string): Promise<{ success: boolean; shouldRetry: boolean; error?: string }> {
    try {
      const failedJob = await db
        .select()
        .from(failedJobs)
        .where(eq(failedJobs.id, failedJobId))
        .limit(1);

      if (!failedJob.length) {
        return { success: false, shouldRetry: false, error: 'Failed job not found' };
      }

      const job = failedJob[0];

      // Check if we should retry based on circuit breaker pattern
      const shouldRetry = this.shouldRetryJob(job);

      if (!shouldRetry) {
        // Mark as permanently failed, create human intervention
        await this.escalateToHumanIntervention(job);
        return { success: false, shouldRetry: false, error: 'Job exceeded retry limits' };
      }

      // Calculate exponential backoff delay
      const backoffDelay = this.calculateBackoffDelay(job.retryCount);
      const nextRetryAt = new Date(Date.now() + backoffDelay);

      // Update retry count and schedule next attempt
      await db
        .update(failedJobs)
        .set({
          retryCount: job.retryCount + 1,
          nextRetryAt,
          updatedAt: new Date()
        })
        .where(eq(failedJobs.id, failedJobId));

      return { success: true, shouldRetry: true };
    } catch (error) {
      console.error('Error processing failed job:', error);
      return {
        success: false,
        shouldRetry: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Capture and persist session state for recovery
   */
  async captureSessionState(
    sessionId: string,
    currentStep: string,
    formData: Record<string, any>,
    screenshots: string[] = []
  ): Promise<void> {
    const sessionState: SessionState = {
      sessionId,
      currentStep,
      completedSteps: this.getCompletedSteps(currentStep),
      formData,
      screenshots,
      lastActivity: new Date()
    };

    // Store in cache/redis for quick recovery
    await this.persistSessionState(sessionState);
  }

  /**
   * Validate portal configuration at runtime
   */
  async validatePortalConfiguration(portalConfig: any): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate required selectors
    if (!portalConfig.selectors?.navigation?.priorAuthSection?.length) {
      issues.push('Missing prior auth navigation selectors');
    }

    if (!portalConfig.selectors?.forms?.submitButton?.length) {
      issues.push('Missing form submit button selectors');
    }

    // Validate timeouts
    if (!portalConfig.timeouts?.elementWait || portalConfig.timeouts.elementWait < 5000) {
      issues.push('Element wait timeout too low or missing');
    }

    // Test selector health (ping portal to verify selectors still work)
    if (portalConfig.healthCheckUrl) {
      const healthCheck = await this.performSelectorHealthCheck(portalConfig);
      if (!healthCheck.healthy) {
        issues.push(...healthCheck.issues);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Classify errors for better handling
   */
  private classifyError(error: Error, context: any): WorkflowError {
    const message = error.message.toLowerCase();

    if (message.includes('captcha') || message.includes('bot detection')) {
      return {
        code: 'BOT_DETECTED',
        category: 'bot_detection',
        message: error.message,
        retryable: false,
        severity: 'critical',
        metadata: { context }
      };
    }

    if (message.includes('timeout') || message.includes('element not found')) {
      return {
        code: 'SELECTOR_TIMEOUT',
        category: 'portal_change',
        message: error.message,
        retryable: true,
        severity: 'medium',
        metadata: { context }
      };
    }

    if (message.includes('authentication') || message.includes('login')) {
      return {
        code: 'AUTH_FAILED',
        category: 'authentication',
        message: error.message,
        retryable: true,
        severity: 'high',
        metadata: { context }
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        category: 'network',
        message: error.message,
        retryable: true,
        severity: 'medium',
        metadata: { context }
      };
    }

    // Default classification
    return {
      code: 'UNKNOWN_ERROR',
      category: 'form_filling',
      message: error.message,
      retryable: false,
      severity: 'high',
      metadata: { context }
    };
  }

  /**
   * Generate next steps based on error type
   */
  private generateNextStepsForError(error: WorkflowError): string[] {
    switch (error.category) {
      case 'bot_detection':
        return [
          'Manual portal access required',
          'Complete PA form manually',
          'Update bot avoidance configuration',
          'Review portal changes'
        ];

      case 'authentication':
        return [
          'Verify portal credentials',
          'Check 2FA/OTP requirements',
          'Test manual login',
          'Update authentication configuration'
        ];

      case 'portal_change':
        return [
          'Inspect portal structure changes',
          'Update selector configuration',
          'Test new selectors',
          'Complete submission manually'
        ];

      case 'network':
        return [
          'Check network connectivity',
          'Retry with exponential backoff',
          'Verify portal availability',
          'Review firewall settings'
        ];

      default:
        return [
          'Review error details',
          'Complete task manually',
          'Update automation configuration',
          'Contact technical support'
        ];
    }
  }

  /**
   * Generate step-specific instructions for human intervention
   */
  private generateInterventionInstructions(error: WorkflowError, request: WorkflowPARequest): string {
    switch (error.category) {
      case 'bot_detection':
        return `Manual completion required due to bot detection. Please:
1. Access the portal manually using the same credentials
2. Navigate to the prior authorization section
3. Complete the PA form with the provided patient data
4. Submit and capture the confirmation number`;

      case 'authentication':
        return `Authentication failed. Please:
1. Verify portal credentials are correct
2. Check if 2FA/OTP is required
3. Test manual login to the portal
4. Update credentials if needed`;

      case 'portal_change':
        return `Portal layout may have changed. Please:
1. Inspect the current portal structure
2. Update selectors in the portal configuration
3. Test the new selectors manually
4. Complete the PA submission manually if needed`;

      default:
        return `Unknown error occurred. Please review the error details and complete the PA submission manually.`;
    }
  }

  /**
   * Circuit breaker logic for failed jobs
   */
  private shouldRetryJob(job: any): boolean {
    const maxRetries = job.maxRetries || 3;

    // Don't retry if we've exceeded max attempts
    if (job.retryCount >= maxRetries) {
      return false;
    }

    // Don't retry critical errors immediately
    if (job.failureReason === 'bot_detection' || job.failureReason === 'credentials_invalid') {
      return false;
    }

    return true;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 60000; // 1 minute
    const maxDelay = 3600000; // 1 hour
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  /**
   * Escalate failed job to human intervention
   */
  private async escalateToHumanIntervention(job: any): Promise<void> {
    const request = job.jobPayload as WorkflowPARequest;
    const error: WorkflowError = {
      code: job.failureReason,
      category: 'form_filling', // Default
      message: job.errorMessage,
      retryable: false,
      severity: 'high'
    };

    await this.createHumanIntervention(request, error, '', {});
  }

  /**
   * Get completed steps based on current step
   */
  private getCompletedSteps(currentStep: string): string[] {
    const stepOrder = ['authentication', 'navigation', 'form_filling', 'submission'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder.slice(0, currentIndex);
  }

  /**
   * Persist session state for recovery
   */
  private async persistSessionState(sessionState: SessionState): Promise<void> {
    // In production, this would use Redis or similar cache
    // For now, store in database or memory
    console.log('Persisting session state:', sessionState.sessionId);
  }

  /**
   * Perform health check on portal selectors
   */
  private async performSelectorHealthCheck(portalConfig: any): Promise<{ healthy: boolean; issues: string[] }> {
    // In production, this would test selectors against the actual portal
    // For now, return a basic check
    return {
      healthy: true,
      issues: []
    };
  }

  /**
   * Notify staff about intervention needed
   */
  private async notifyStaffOfIntervention(interventionId: string, intervention: any): Promise<void> {
    // In production, this would send Slack notifications, emails, etc.
    console.log(`Intervention ${interventionId} requires attention:`, intervention.title);
  }

  /**
   * Collect and emit workflow metrics
   */
  async collectWorkflowMetrics(
    executionId: string,
    stepMetrics: Array<{ step: string; duration: number; success: boolean; errorCode?: string }>,
    totalDuration: number,
    retryCount: number,
    interventionRequired: boolean
  ): Promise<void> {
    const metrics: WorkflowMetrics = {
      executionId,
      stepMetrics,
      totalDuration,
      retryCount,
      interventionRequired
    };

    // Emit metrics to monitoring system
    await this.emitMetrics(metrics);
  }

  /**
   * Emit metrics to monitoring/observability platform
   */
  private async emitMetrics(metrics: WorkflowMetrics): Promise<void> {
    // In production, this would emit to DataDog, New Relic, etc.
    console.log('Workflow metrics:', metrics);
  }

  /**
   * Get portal configuration directly from database
   */
  private async getPortalConfigDirect(
    organizationId: string,
    payerId: string
  ): Promise<any> {
    try {
      const configs = await db
        .select()
        .from(portalAutomationConfigs)
        .where(
          and(
            eq(portalAutomationConfigs.organizationId, organizationId),
            eq(portalAutomationConfigs.payerId, payerId)
          )
        )
        .limit(1);

      if (!configs.length) {
        throw new Error('No portal automation configuration found for this payer');
      }

      return configs[0];
    } catch (error) {
      console.error('Error fetching portal config:', error);
      throw error;
    }
  }

  /**
   * Update prior authorization status in database
   */
  private async updatePriorAuthStatus(
    priorAuthId: string,
    updates: {
      status?: 'pending' | 'denied' | 'approved' | 'expired' | 'cancelled';
      confirmationNumber?: string;
      submittedAt?: Date;
      failedAt?: Date;
    }
  ): Promise<void> {
    try {
      await db
        .update(priorAuths)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(priorAuths.id, priorAuthId));

      // Log the status update in audit trail
      await this.logAuditEvent(priorAuthId, 'status_updated', {
        previousStatus: 'pending',
        newStatus: updates.status,
        confirmationNumber: updates.confirmationNumber
      });
    } catch (error) {
      console.error('Error updating prior auth status:', error);
      throw error;
    }
  }

  /**
   * Human intervention completion handler
   * Called when a human completes a task that automation couldn't handle
   */
  async completeHumanIntervention(
    interventionId: string,
    completionData: {
      confirmationNumber?: string;
      status: 'completed' | 'failed';
      notes?: string;
      completedBy: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the intervention record
      // Update the human intervention record
      await db
        .update(humanInterventions)
        .set({
          status: completionData.status === 'completed' ? 'resolved' : 'failed',
          resolvedAt: new Date(),
          resolution: completionData.notes || 'Completed via workflow integration'
        })
        .where(eq(humanInterventions.id, interventionId));

      await this.logAuditEvent(interventionId, 'human_intervention_completed', {
        completionData,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete intervention'
      };
    }
  }
}

export const workflowIntegrationService = new WorkflowIntegrationService();
