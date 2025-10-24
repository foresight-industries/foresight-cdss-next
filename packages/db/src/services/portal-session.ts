import { eq, and, lt } from 'drizzle-orm';
import { db } from '../connection';
import {
  portalSessions,
  payerPortalCredentials,
  NewPortalSession,
  PortalSession
} from '../schema';
import { twilioSMSService } from './twilio-sms';

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

export class PortalSessionManager {
  private browserbaseConfig: BrowserbaseConfig;
  private activeSessions: Map<string, PortalSession> = new Map();

  constructor(browserbaseConfig: BrowserbaseConfig) {
    this.browserbaseConfig = browserbaseConfig;
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
      if (existingSession && await this.isSessionValid(existingSession.id)) {
        return {
          success: true,
          sessionId: existingSession.id,
          requiresSMS: false
        };
      }

      // Create new Browserbase session
      const browserbaseSession = await this.createBrowserbaseSession();

      // Create portal session record
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
      };

      const [session] = await db
        .insert(portalSessions)
        .values(newSession)
        .returning();

      // Start authentication process
      const authResult = await this.authenticateSession(session.id);

      return authResult;

    } catch (error) {
      console.error('Error creating portal session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async authenticateSession(sessionId: string): Promise<PortalAuthResult> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    try {
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
      await browser.goto(credential.portalUrl);

      // Fill login form
      await browser.fill('[name="username"], [name="email"], #username, #email', credential.username);
      await browser.fill('[name="password"], #password', this.decryptPassword(credential.encryptedPassword));

      // Submit login form
      await browser.click('[type="submit"], button[type="submit"], .login-button, #login-button');

      // Wait for response
      await browser.waitForLoadState();

      // Check if SMS verification is required
      const smsRequired = await this.checkForSMSPrompt(browser);

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

        // Create SMS attempt
        const smsAttemptId = await twilioSMSService.createSMSAuthAttempt(
          smsConfig.id,
          smsConfig.twilioPhoneNumber,
          sessionId
        );

        return {
          success: false,
          requiresSMS: true,
          smsAttemptId,
          sessionId
        };
      }

      // Check if login was successful
      const loginSuccess = await this.verifyLoginSuccess(browser);

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
    }
  }

  async completeSMSAuthentication(
    sessionId: string,
    smsAttemptId: string
  ): Promise<PortalAuthResult> {
    try {
      // Wait for SMS code
      const smsResult = await twilioSMSService.waitForSMSCode(smsAttemptId, 300000);

      if (!smsResult.success) {
        if (smsResult.error?.includes('timeout')) {
          // Request human intervention
          await twilioSMSService.requestHumanIntervention(
            smsAttemptId,
            'SMS authentication timeout - manual intervention required'
          );
        }
        return { success: false, error: smsResult.error };
      }

      // Get browser instance and enter SMS code
      const session = await this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const browser = await this.getBrowserInstance(session.browserbaseSessionId);

      // Find SMS input field and enter code
      await browser.fill('[name="code"], [name="sms"], [name="verification"], #sms-code, #verification-code', smsResult.code!);
      await browser.click('[type="submit"], .verify-button, #verify-button');

      // Wait for verification
      await browser.waitForLoadState();

      // Verify SMS code with our service
      const verifyResult = await twilioSMSService.verifySMSCode(smsAttemptId, smsResult.code!);

      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error };
      }

      // Check if authentication is now complete
      const loginSuccess = await this.verifyLoginSuccess(browser);

      if (loginSuccess) {
        await this.updateSessionStatus(sessionId, 'authenticated');
        await this.saveSessionCookies(sessionId, browser);

        // Start keep-alive if enabled
        if (session.keepAliveEnabled) {
          this.startKeepAlive(sessionId);
        }

        return { success: true, sessionId };
      } else {
        return { success: false, error: 'SMS verification succeeded but login still failed' };
      }

    } catch (error) {
      console.error('Error completing SMS authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS authentication error'
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
    if (!session || !session.isActive) {
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
        const refreshResult = await this.refreshSession(sessionId);
        return refreshResult;
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
      await browser.evaluate(() => {
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

      // Update database record
      await db
        .update(portalSessions)
        .set({
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(portalSessions.id, sessionId));

      // Remove from active sessions cache
      this.activeSessions.delete(sessionId);

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

  private async getBrowserInstance(browserbaseSessionId: string): Promise<any> {
    // TODO: Implement actual browser connection to Browserbase
    // This would return a Playwright/Puppeteer-like interface
    return {
      goto: async (url: string) => { /* Navigate to URL */ },
      fill: async (selector: string, value: string) => { /* Fill form field */ },
      click: async (selector: string) => { /* Click element */ },
      waitForLoadState: async () => { /* Wait for page load */ },
      evaluate: async (fn: Function) => { /* Execute JS in browser */ },
    };
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
      } catch (e) {
        // Continue checking other selectors
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
      } catch (e) {
        // Continue checking other selectors
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
    if (!session || !session.keepAliveEnabled) return;

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
