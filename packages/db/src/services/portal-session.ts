import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { db } from '../connection';
import {
  portalSessions,
  payerPortalCredentials,
  NewPortalSession,
  PortalSession
} from '../schema';
import { twilioSMSService } from './twilio-sms';
import { randomUUID } from 'node:crypto';

export interface BrowserbaseConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
}

export interface PortalAuthResult {
  success: boolean;
  sessionId?: string;
  requiresSMS?: boolean;
  smsAttemptId?: string;
  error?: string;
}

export interface SessionLock {
  sessionId: string;
  lockToken: string;
  lockExpiresAt: Date;
  acquired: boolean;
}

export class PortalSessionManager {
  private readonly browserbaseConfig: BrowserbaseConfig;
  private readonly activeSessions: Map<string, PortalSession> = new Map();
  private readonly activeLocks: Map<string, SessionLock> = new Map();
  private readonly lockExpirationMinutes: number = 30;
  private readonly instanceId: string;

  constructor(browserbaseConfig: BrowserbaseConfig) {
    this.browserbaseConfig = browserbaseConfig;
    this.instanceId = this.generateInstanceId();
    
    // Start background task to refresh locks and cleanup expired ones
    this.startLockMaintenance();
  }

  private generateInstanceId(): string {
    return `portal-session-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  async createSession(
    organizationId: string,
    payerId: string,
    options: {
      keepAliveEnabled?: boolean;
      keepAliveIntervalMinutes?: number;
      maxSessionAgeHours?: number;
    } = {}
  ): Promise<PortalAuthResult> {
    try {
      // Get portal credentials
      const credentials = await this.getPortalCredentials(organizationId, payerId);
      if (!credentials) {
        return { success: false, error: 'Portal credentials not found' };
      }

      // Check for existing active session
      const existingSession = await this.getActiveSession(organizationId, payerId);
      if (existingSession) {
        // Try to acquire lock on existing session
        const lockResult = await this.acquireSessionLock(existingSession.id);
        if (lockResult.acquired && await this.isSessionValid(existingSession.id)) {
          return {
            success: true,
            sessionId: existingSession.id,
            requiresSMS: false
          };
        }
        // If we can't acquire lock, continue to create new session
      }

      // Create new Browserbase session
      const browserbaseSession = await this.createBrowserbaseSession();

      // Generate lock token for new session
      const lockToken = randomUUID();
      const lockExpiry = new Date(Date.now() + this.lockExpirationMinutes * 60 * 1000);

      // Create portal session record with initial lock
      const newSession: NewPortalSession = {
        organizationId,
        payerId,
        portalCredentialId: credentials.id,
        browserbaseSessionId: browserbaseSession.id,
        browserbaseProxyUrl: browserbaseSession.connectUrl,
        authenticationStatus: 'pending_login',
        keepAliveEnabled: options.keepAliveEnabled ?? true,
        keepAliveIntervalMinutes: options.keepAliveIntervalMinutes ?? 5,
        maxSessionAgeHours: options.maxSessionAgeHours ?? 8,
        portalUserAgent: browserbaseSession.userAgent,
        lockToken,
        lockedBy: this.instanceId,
        lockExpiresAt: lockExpiry,
        lockAcquiredAt: new Date(),
      };

      const [session] = await db
        .insert(portalSessions)
        .values(newSession)
        .returning();

      // Register lock in memory
      this.activeLocks.set(session.id, {
        sessionId: session.id,
        lockToken,
        lockExpiresAt: lockExpiry,
        acquired: true
      });

      // Start authentication process
      return await this.authenticateSession(session.id);

    } catch (error) {
      console.error('Error creating portal session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async authenticateSession(sessionId: string): Promise<PortalAuthResult> {
    // Ensure we have a lock on this session
    const lockResult = await this.acquireSessionLock(sessionId);
    if (!lockResult.acquired) {
      return { success: false, error: 'Could not acquire session lock - another instance may be using this session' };
    }

    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Get credentials
      const credentials = await db
        .select()
        .from(payerPortalCredentials)
        .where(eq(payerPortalCredentials.id, session.portalCredentialId))
        .limit(1);

      if (!credentials.length) {
        return { success: false, error: 'Portal credentials not found' };
      }

      const credential = credentials[0];

      // Navigate to portal and attempt login
      const browser = await this.getBrowserInstance(session.browserbaseSessionId);

      // Navigate to login page
      await browser.page.goto(credential.portalUrl);

      // Fill login form
      await browser.page.fill('[name="username"], [name="email"], #username, #email', credential.username);
      await browser.page.fill('[name="password"], #password', this.decryptPassword(credential.encryptedPassword));

      // Submit login form
      await browser.page.click('[type="submit"], button[type="submit"], .login-button, #login-button');

      // Wait for response
      await browser.page.waitForLoadState();

      // Check if SMS verification is required
      const smsRequired = await this.checkForSMSPrompt(browser.page);

      if (smsRequired) {
        // Update session status
        await this.updateSessionStatus(sessionId, 'sms_required');

        // Get SMS config
        const smsConfig = await twilioSMSService.getSMSConfig(
          session.organizationId,
          session.payerId
        );

        if (!smsConfig) {
          return {
            success: false,
            error: 'SMS authentication required but no SMS config found'
          };
        }

        // Start OTP capture for CoverMyMeds
        const otpResult = await twilioSMSService.startOTPCapture(smsConfig.id, {
          phoneNumber: smsConfig.twilioPhoneNumber,
          organizationId: session.organizationId,
          payerId: session.payerId,
          sessionId,
          purpose: 'covermymeds_auth'
        });

        if (!otpResult.success) {
          return {
            success: false,
            error: otpResult.error || 'Failed to start OTP capture'
          };
        }

        const smsAttemptId = otpResult.attemptId;

        return {
          success: false,
          requiresSMS: true,
          smsAttemptId,
          sessionId
        };
      }

      // Check if login was successful
      const loginSuccess = await this.verifyLoginSuccess(browser.page);

      if (loginSuccess) {
        await this.updateSessionStatus(sessionId, 'authenticated');
        await this.saveSessionCookies(sessionId, browser);

        // Start keep-alive if enabled
        if (session.keepAliveEnabled) {
          this.startKeepAlive(sessionId);
        }

        return { success: true, sessionId };
      } else {
        await this.updateSessionStatus(sessionId, 'failed');
        return { success: false, error: 'Login failed - invalid credentials or unexpected portal behavior' };
      }

    } catch (error) {
      console.error('Error authenticating session:', error);
      await this.updateSessionStatus(sessionId, 'failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      };
    } finally {
      // Always release the lock when done
      await this.releaseSessionLock(sessionId);
    }
  }

  async completeSMSAuthentication(
    sessionId: string,
    smsAttemptId: string
  ): Promise<PortalAuthResult> {
    try {
      // Get the received OTP code from CoverMyMeds
      const otpResult = await twilioSMSService.getReceivedOTP(smsAttemptId);

      if (!otpResult.success) {
        if (otpResult.error?.includes('timeout')) {
          // Request human intervention
          await twilioSMSService.requestHumanIntervention(
            smsAttemptId,
            'OTP capture timeout - manual intervention required'
          );
        }
        return { success: false, error: otpResult.error };
      }

      // Get browser instance and enter OTP code
      const session = await this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const browser = await this.getBrowserInstance(session.browserbaseSessionId);

      // Find OTP input field and enter code
      await browser.page.fill('[name="code"], [name="sms"], [name="verification"], #sms-code, #verification-code', otpResult.otpCode!);
      await browser.page.click('[type="submit"], .verify-button, #verify-button');

      // Wait for verification
      await browser.page.waitForLoadState();

      // Check if authentication is now complete
      const loginSuccess = await this.verifyLoginSuccess(browser.page);

      if (loginSuccess) {
        await this.updateSessionStatus(sessionId, 'authenticated');
        await this.saveSessionCookies(sessionId, browser);

        // Start keep-alive if enabled
        if (session.keepAliveEnabled) {
          this.startKeepAlive(sessionId);
        }

        return { success: true, sessionId };
      } else {
        return { success: false, error: 'OTP verification succeeded but login still failed' };
      }

    } catch (error) {
      console.error('Error completing SMS authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS authentication error'
      };
    }
  }

  async completeSMSAuthenticationWithManualEntry(
    sessionId: string,
    smsAttemptId: string,
    manualOTP: string,
    enteredBy: string
  ): Promise<PortalAuthResult> {
    try {
      // Record manual OTP entry
      const recordResult = await twilioSMSService.recordManualOTPEntry(
        smsAttemptId,
        manualOTP,
        enteredBy
      );

      if (!recordResult.success) {
        return { success: false, error: recordResult.error };
      }

      // Get browser instance and enter manual OTP code
      const session = await this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const browser = await this.getBrowserInstance(session.browserbaseSessionId);

      // Find OTP input field and enter code
      await browser.page.fill('[name="code"], [name="sms"], [name="verification"], #sms-code, #verification-code', manualOTP);
      await browser.page.click('[type="submit"], .verify-button, #verify-button');

      // Wait for verification
      await browser.page.waitForLoadState();

      // Check if authentication is now complete
      const loginSuccess = await this.verifyLoginSuccess(browser.page);

      if (loginSuccess) {
        await this.updateSessionStatus(sessionId, 'authenticated');
        await this.saveSessionCookies(sessionId, browser);

        // Start keep-alive if enabled
        if (session.keepAliveEnabled) {
          this.startKeepAlive(sessionId);
        }

        return { success: true, sessionId };
      } else {
        return { success: false, error: 'Manual OTP entry succeeded but login still failed' };
      }

    } catch (error) {
      console.error('Error completing manual SMS authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Manual SMS authentication error'
      };
    }
  }

  async getActiveSession(organizationId: string, payerId: string): Promise<PortalSession | null> {
    const sessions = await db
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.organizationId, organizationId),
          eq(portalSessions.payerId, payerId),
          eq(portalSessions.isActive, true),
          eq(portalSessions.authenticationStatus, 'authenticated')
        )
      )
      .orderBy(portalSessions.lastActivityAt)
      .limit(1);

    return sessions.length > 0 ? sessions[0] : null;
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session?.isActive) {
      return false;
    }

    // Check if session has expired based on max age
    if (session.maxSessionAgeHours) {
      const maxAge = session.maxSessionAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const sessionAge = Date.now() - session.createdAt.getTime();

      if (sessionAge > maxAge) {
        await this.terminateSession(sessionId, 'expired_max_age');
        return false;
      }
    }

    // Check if session has been inactive for too long
    if (session.lastActivityAt) {
      const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
      const inactiveTime = Date.now() - session.lastActivityAt.getTime();

      if (inactiveTime > inactivityThreshold) {
        // Try to refresh the session
        return await this.refreshSession(sessionId);
      }
    }

    return true;
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      const browser = await this.getBrowserInstance(session.browserbaseSessionId);

      // Perform a simple action to check if session is still valid
      await browser.page.evaluate(() => {
        document.dispatchEvent(new Event('mousemove'));
      });

      // Update last activity
      await this.updateLastActivity(sessionId);

      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.terminateSession(sessionId, 'refresh_failed');
      return false;
    }
  }

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return;

      // Terminate Browserbase session
      if (session.browserbaseSessionId) {
        await this.terminateBrowserbaseSession(session.browserbaseSessionId);
      }

      // Update database record and clear lock
      await db
        .update(portalSessions)
        .set({
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: reason,
          lockToken: null,
          lockedBy: null,
          lockExpiresAt: null,
          lockAcquiredAt: null,
          updatedAt: new Date(),
        })
        .where(eq(portalSessions.id, sessionId));

      // Remove from caches
      this.activeSessions.delete(sessionId);
      this.activeLocks.delete(sessionId);

    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  private async getSession(sessionId: string): Promise<PortalSession | null> {
    // Check cache first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Query database
    const sessions = await db
      .select()
      .from(portalSessions)
      .where(eq(portalSessions.id, sessionId))
      .limit(1);

    if (sessions.length > 0) {
      this.activeSessions.set(sessionId, sessions[0]);
      return sessions[0];
    }

    return null;
  }

  private async getPortalCredentials(organizationId: string, payerId: string) {
    const credentials = await db
      .select()
      .from(payerPortalCredentials)
      .where(
        and(
          eq(payerPortalCredentials.organizationId, organizationId),
          eq(payerPortalCredentials.payerId, payerId),
          eq(payerPortalCredentials.isActive, true)
        )
      )
      .limit(1);

    return credentials.length > 0 ? credentials[0] : null;
  }

  private async createBrowserbaseSession(): Promise<any> {
    // TODO: Implement actual Browserbase API integration
    // This is a placeholder for the Browserbase session creation
    const response = await fetch(`${this.browserbaseConfig.baseUrl || 'https://www.browserbase.com'}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.browserbaseConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: this.browserbaseConfig.projectId,
        keepAlive: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Browserbase session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get browser instance for a session (public method for workflow integration)
   */
  async getBrowserForSession(sessionId: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (!session.browserbaseSessionId) {
      throw new Error(`No browser session ID found for session: ${sessionId}`);
    }
    
    return await this.getBrowserInstance(session.browserbaseSessionId);
  }

  private async getBrowserInstance(browserbaseSessionId: string): Promise<any> {
    // TODO: Implement actual browser connection to Browserbase
    // This would return a Playwright/Puppeteer-like interface
    const mockBrowser = {
      page: {
        goto: async (url: string) => { console.log(`Navigate to: ${url}`); },
        fill: async (selector: string, value: string) => { console.log(`Fill ${selector}: ${value}`); },
        click: async (selector: string) => { console.log(`Click: ${selector}`); },
        type: async (selector: string, text: string) => { console.log(`Type ${text} in ${selector}`); },
        waitForSelector: async (selector: string) => { return true; },
        waitForLoadState: async () => { console.log('Wait for load state'); },
        evaluate: async (fn: Function, ...args: any[]) => { return fn(...args); },
        $: async (selector: string) => { return { textContent: () => 'mock-content' }; },
        screenshot: async () => { return Buffer.from('mock-screenshot'); },
        textContent: async (selector: string) => { return 'mock-text-content'; }
      },
      context: () => ({
        cookies: async () => [{ name: 'session', value: 'mock-session-id' }]
      })
    };
    
    console.log(`Getting browser instance for session: ${browserbaseSessionId}`);
    return mockBrowser;
  }

  private async checkForSMSPrompt(browser: any): Promise<boolean> {
    // Check for common SMS verification UI patterns
    const smsSelectors = [
      '[name="code"]',
      '[name="sms"]',
      '[name="verification"]',
      '#sms-code',
      '#verification-code',
      '.sms-verification',
      '.two-factor',
      'text=Enter verification code',
      'text=SMS code',
    ];

    for (const selector of smsSelectors) {
      try {
        const element = await browser.$(selector);
        if (element) return true;
      } catch (error) {
        console.debug('SMS selector check failed:', selector, error);
      }
    }

    return false;
  }

  private async verifyLoginSuccess(browser: any): Promise<boolean> {
    // Check for indicators of successful login
    const successSelectors = [
      '.dashboard',
      '.welcome',
      '.user-menu',
      '.logout',
      '[href*="logout"]',
      'text=Welcome',
      'text=Dashboard',
    ];

    for (const selector of successSelectors) {
      try {
        const element = await browser.$(selector);
        if (element) return true;
      } catch (error) {
        console.debug('SMS selector check failed:', selector, error);
      }
    }

    return false;
  }

  private async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    await db
      .update(portalSessions)
      .set({
        authenticationStatus: status,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(portalSessions.id, sessionId));
  }

  private async updateLastActivity(sessionId: string): Promise<void> {
    await db
      .update(portalSessions)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(portalSessions.id, sessionId));
  }

  private async saveSessionCookies(sessionId: string, browser: any): Promise<void> {
    try {
      const cookies = await browser.context().cookies();

      await db
        .update(portalSessions)
        .set({
          portalSessionCookies: cookies,
          lastAuthenticatedAt: new Date(),
        })
        .where(eq(portalSessions.id, sessionId));
    } catch (error) {
      console.error('Error saving session cookies:', error);
    }
  }

  private startKeepAlive(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session?.keepAliveEnabled) return;

    const intervalMs = (session.keepAliveIntervalMinutes || 5) * 60 * 1000;

    const keepAliveInterval = setInterval(async () => {
      const isValid = await this.refreshSession(sessionId);
      if (!isValid) {
        clearInterval(keepAliveInterval);
      }
    }, intervalMs);
  }

  private decryptPassword(encryptedPassword: string): string {
    // TODO: Implement proper decryption
    return encryptedPassword;
  }

  private async terminateBrowserbaseSession(browserbaseSessionId: string): Promise<void> {
    try {
      await fetch(`${this.browserbaseConfig.baseUrl || 'https://www.browserbase.com'}/v1/sessions/${browserbaseSessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.browserbaseConfig.apiKey}`,
        },
      });
    } catch (error) {
      console.error('Error terminating Browserbase session:', error);
    }
  }

  // ============================================================================
  // DISTRIBUTED LOCKING METHODS
  // ============================================================================

  private async acquireSessionLock(sessionId: string, timeoutMs: number = 30000): Promise<SessionLock> {
    const lockToken = randomUUID();
    const lockExpiry = new Date(Date.now() + this.lockExpirationMinutes * 60 * 1000);
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Try to acquire lock using atomic update
        const result = await db
          .update(portalSessions)
          .set({
            lockToken,
            lockedBy: this.instanceId,
            lockExpiresAt: lockExpiry,
            lockAcquiredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(portalSessions.id, sessionId),
              or(
                isNull(portalSessions.lockToken), // No existing lock
                lt(portalSessions.lockExpiresAt, new Date()) // Expired lock
              )
            )
          )
          .returning({ id: portalSessions.id });

        if (result.length > 0) {
          // Successfully acquired lock
          const lock: SessionLock = {
            sessionId,
            lockToken,
            lockExpiresAt: lockExpiry,
            acquired: true
          };
          this.activeLocks.set(sessionId, lock);
          return lock;
        }

        // Lock acquisition failed, wait before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error acquiring session lock:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Timeout reached
    return {
      sessionId,
      lockToken: '',
      lockExpiresAt: new Date(),
      acquired: false
    };
  }

  private async releaseSessionLock(sessionId: string): Promise<boolean> {
    try {
      const lock = this.activeLocks.get(sessionId);
      if (!lock) {
        return true; // Already released
      }

      // Release lock in database
      await db
        .update(portalSessions)
        .set({
          lockToken: null,
          lockedBy: null,
          lockExpiresAt: null,
          lockAcquiredAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portalSessions.id, sessionId),
            eq(portalSessions.lockToken, lock.lockToken)
          )
        );

      // Remove from memory
      this.activeLocks.delete(sessionId);
      return true;
    } catch (error) {
      console.error('Error releasing session lock:', error);
      return false;
    }
  }

  private async refreshLock(sessionId: string): Promise<boolean> {
    try {
      const lock = this.activeLocks.get(sessionId);
      if (!lock?.acquired) {
        return false;
      }

      const newExpiry = new Date(Date.now() + this.lockExpirationMinutes * 60 * 1000);
      
      const result = await db
        .update(portalSessions)
        .set({
          lockExpiresAt: newExpiry,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portalSessions.id, sessionId),
            eq(portalSessions.lockToken, lock.lockToken)
          )
        )
        .returning({ id: portalSessions.id });

      if (result.length > 0) {
        lock.lockExpiresAt = newExpiry;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing session lock:', error);
      return false;
    }
  }

  private startLockMaintenance(): void {
    // Refresh active locks every 10 minutes
    setInterval(async () => {
      for (const [sessionId, lock] of this.activeLocks) {
        if (lock.acquired) {
          const refreshed = await this.refreshLock(sessionId);
          if (!refreshed) {
            console.warn(`Failed to refresh lock for session ${sessionId}`);
            this.activeLocks.delete(sessionId);
          }
        }
      }
    }, 10 * 60 * 1000);

    // Cleanup expired locks every 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredLocks();
    }, 5 * 60 * 1000);
  }

  private async cleanupExpiredLocks(): Promise<number> {
    try {
      const result = await db
        .update(portalSessions)
        .set({
          lockToken: null,
          lockedBy: null,
          lockExpiresAt: null,
          lockAcquiredAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            lt(portalSessions.lockExpiresAt, new Date()),
            eq(portalSessions.isActive, true)
          )
        )
        .returning({ id: portalSessions.id });

      console.log(`Cleaned up ${result.length} expired session locks`);
      return result.length;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await db
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.isActive, true),
          // Sessions older than their max age
          lt(
            portalSessions.createdAt,
            new Date(Date.now() - (8 * 60 * 60 * 1000)) // Default 8 hours
          )
        )
      );

    let cleanedCount = 0;
    for (const session of expiredSessions) {
      await this.terminateSession(session.id, 'cleanup_expired');
      cleanedCount++;
    }

    return cleanedCount;
  }
}