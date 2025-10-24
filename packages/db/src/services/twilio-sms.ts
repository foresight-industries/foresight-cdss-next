import { Twilio } from 'twilio';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '../connection';
import { smsAuthConfigs, smsAuthAttempts, NewSmsAuthAttempt } from '../schema';

export class TwilioSMSService {
  private readonly twilioClients: Map<string, Twilio> = new Map();

  private async getTwilioClient(smsConfigId: string): Promise<Twilio> {
    if (this.twilioClients.has(smsConfigId)) {
      return this.twilioClients.get(smsConfigId)!;
    }

    const config = await db
      .select()
      .from(smsAuthConfigs)
      .where(eq(smsAuthConfigs.id, smsConfigId))
      .limit(1);

    if (!config.length) {
      throw new Error(`SMS config not found: ${smsConfigId}`);
    }

    const { twilioAccountSid, twilioAuthToken } = config[0];

    // Decrypt the auth token in production
    const decryptedToken = this.decryptAuthToken(twilioAuthToken);

    const client = new Twilio(twilioAccountSid, decryptedToken);
    this.twilioClients.set(smsConfigId, client);

    return client;
  }

  private decryptAuthToken(encryptedToken: string): string {
    // TODO: Implement proper encryption/decryption
    // For now, assume token is stored as plaintext (development only)
    return encryptedToken;
  }

  async getSMSConfig(organizationId: string, payerId: string) {
    const config = await db
      .select()
      .from(smsAuthConfigs)
      .where(
        and(
          eq(smsAuthConfigs.organizationId, organizationId),
          eq(smsAuthConfigs.payerId, payerId),
          eq(smsAuthConfigs.isActive, true)
        )
      )
      .limit(1);

    return config.length > 0 ? config[0] : null;
  }

  async createSMSAuthAttempt(
    smsConfigId: string,
    phoneNumber: string,
    sessionId?: string,
    priorAuthId?: string
  ): Promise<string> {
    const config = await db
      .select()
      .from(smsAuthConfigs)
      .where(eq(smsAuthConfigs.id, smsConfigId))
      .limit(1);

    if (!config.length) {
      throw new Error(`SMS config not found: ${smsConfigId}`);
    }

    const { codeExpirationSeconds, maxRetryAttempts } = config[0];

    // Check if we're within cooldown period
    await this.checkCooldownPeriod(smsConfigId, phoneNumber);

    // Check if we've exceeded max retry attempts
    const recentAttempts = await this.getRecentAttempts(smsConfigId, phoneNumber);
    const maxRetries = maxRetryAttempts ?? 3; // Default to 3 if null
    if (recentAttempts.length >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded for phone number ${phoneNumber}`);
    }

    const expirationSeconds = codeExpirationSeconds ?? 300; // Default to 5 minutes if null
    const expiresAt = new Date(Date.now() + (expirationSeconds * 1000));
    const attemptNumber = recentAttempts.length + 1;

    const newAttempt: NewSmsAuthAttempt = {
      smsConfigId,
      phoneNumber,
      sessionId,
      priorAuthId,
      attemptNumber,
      status: 'pending',
      expiresAt,
    };

    const [attempt] = await db
      .insert(smsAuthAttempts)
      .values(newAttempt)
      .returning({ id: smsAuthAttempts.id });

    return attempt.id;
  }

  async waitForSMSCode(
    attemptId: string,
    timeoutMs: number = 300000
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const attempt = await db
        .select()
        .from(smsAuthAttempts)
        .where(eq(smsAuthAttempts.id, attemptId))
        .limit(1);

      if (!attempt.length) {
        return { success: false, error: 'SMS attempt not found' };
      }

      const currentAttempt = attempt[0];

      // Check if code was received
      if (currentAttempt.status === 'received' && currentAttempt.smsCode) {
        return { success: true, code: currentAttempt.smsCode };
      }

      // Check if attempt failed
      if (currentAttempt.status === 'failed') {
        return { success: false, error: currentAttempt.errorMessage || 'SMS failed' };
      }

      // Check if expired
      if (currentAttempt.expiresAt && new Date() > currentAttempt.expiresAt) {
        await this.markAttemptExpired(attemptId);
        return { success: false, error: 'SMS code expired' };
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: 'Timeout waiting for SMS code' };
  }

  async receiveSMSWebhook(
    phoneNumber: string,
    messageBody: string,
    twilioMessageSid: string,
    accountSid: string
  ): Promise<{ processed: boolean; attemptId?: string }> {
    // Extract SMS code from message body (assuming it's a 6-digit number)
    const codeMatch = messageBody.match(/\b\d{4,8}\b/);
    if (!codeMatch) {
      console.log('No SMS code found in message:', messageBody);
      return { processed: false };
    }

    const smsCode = codeMatch[0];

    // Find the most recent pending SMS attempt for this phone number
    const recentAttempt = await db
      .select()
      .from(smsAuthAttempts)
      .leftJoin(smsAuthConfigs, eq(smsAuthAttempts.smsConfigId, smsAuthConfigs.id))
      .where(
        and(
          eq(smsAuthAttempts.phoneNumber, phoneNumber),
          eq(smsAuthAttempts.status, 'pending'),
          eq(smsAuthConfigs.twilioAccountSid, accountSid),
          gt(smsAuthAttempts.expiresAt, new Date())
        )
      )
      .orderBy(smsAuthAttempts.createdAt)
      .limit(1);

    if (!recentAttempt.length) {
      console.log('No pending SMS attempt found for phone number:', phoneNumber);
      return { processed: false };
    }

    const attempt = recentAttempt[0].sms_auth_attempt;

    // Update the attempt with the received code
    await db
      .update(smsAuthAttempts)
      .set({
        status: 'received',
        smsCode,
        twilioMessageSid,
        receivedAt: new Date(),
      })
      .where(eq(smsAuthAttempts.id, attempt.id));

    return { processed: true, attemptId: attempt.id };
  }

  async verifySMSCode(
    attemptId: string,
    enteredCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const attempt = await db
      .select()
      .from(smsAuthAttempts)
      .where(eq(smsAuthAttempts.id, attemptId))
      .limit(1);

    if (!attempt.length) {
      return { success: false, error: 'SMS attempt not found' };
    }

    const currentAttempt = attempt[0];

    // Check if expired
    if (currentAttempt.expiresAt && new Date() > currentAttempt.expiresAt) {
      await this.markAttemptExpired(attemptId);
      return { success: false, error: 'SMS code expired' };
    }

    // Check if code matches
    if (currentAttempt.smsCode !== enteredCode) {
      await db
        .update(smsAuthAttempts)
        .set({
          status: 'failed',
          verificationResult: 'invalid_code',
          codeEnteredAt: new Date(),
        })
        .where(eq(smsAuthAttempts.id, attemptId));

      return { success: false, error: 'Invalid SMS code' };
    }

    // Mark as verified
    await db
      .update(smsAuthAttempts)
      .set({
        status: 'verified',
        verificationResult: 'success',
        codeEnteredAt: new Date(),
      })
      .where(eq(smsAuthAttempts.id, attemptId));

    return { success: true };
  }

  async requestHumanIntervention(
    attemptId: string,
    reason: string = 'SMS authentication required'
  ): Promise<void> {
    await db
      .update(smsAuthAttempts)
      .set({
        requiresHumanIntervention: true,
        humanNotifiedAt: new Date(),
        errorMessage: reason,
      })
      .where(eq(smsAuthAttempts.id, attemptId));

    // TODO: Send notification to staff (Slack, email, etc.)
    console.log(`Human intervention requested for SMS attempt ${attemptId}: ${reason}`);
  }

  async markHumanResolved(
    attemptId: string,
    smsCode: string
  ): Promise<void> {
    await db
      .update(smsAuthAttempts)
      .set({
        status: 'verified',
        smsCode,
        verificationResult: 'success',
        humanResolvedAt: new Date(),
      })
      .where(eq(smsAuthAttempts.id, attemptId));
  }

  private async checkCooldownPeriod(smsConfigId: string, phoneNumber: string): Promise<void> {
    const config = await db
      .select()
      .from(smsAuthConfigs)
      .where(eq(smsAuthConfigs.id, smsConfigId))
      .limit(1);

    if (!config.length) return;

    const { cooldownPeriodSeconds } = config[0];
    const cooldownSeconds = cooldownPeriodSeconds ?? 60; // Default to 60 seconds if null
    const cooldownThreshold = new Date(Date.now() - (cooldownSeconds * 1000));

    const recentAttempt = await db
      .select()
      .from(smsAuthAttempts)
      .where(
        and(
          eq(smsAuthAttempts.smsConfigId, smsConfigId),
          eq(smsAuthAttempts.phoneNumber, phoneNumber),
          gt(smsAuthAttempts.createdAt, cooldownThreshold)
        )
      )
      .orderBy(smsAuthAttempts.createdAt)
      .limit(1);

    if (recentAttempt.length > 0) {
      throw new Error(`SMS request is in cooldown period. Please wait ${cooldownSeconds} seconds between requests.`);
    }
  }

  private async getRecentAttempts(smsConfigId: string, phoneNumber: string) {
    // Get attempts from the last hour to check retry limits
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));

    return await db
      .select()
      .from(smsAuthAttempts)
      .where(
        and(
          eq(smsAuthAttempts.smsConfigId, smsConfigId),
          eq(smsAuthAttempts.phoneNumber, phoneNumber),
          gt(smsAuthAttempts.createdAt, oneHourAgo)
        )
      )
      .orderBy(smsAuthAttempts.createdAt);
  }

  private async markAttemptExpired(attemptId: string): Promise<void> {
    await db
      .update(smsAuthAttempts)
      .set({
        status: 'expired',
        verificationResult: 'expired',
      })
      .where(eq(smsAuthAttempts.id, attemptId));
  }

  async testSMSConfig(smsConfigId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await db
        .select()
        .from(smsAuthConfigs)
        .where(eq(smsAuthConfigs.id, smsConfigId))
        .limit(1);

      if (!config.length) {
        return { success: false, error: 'SMS config not found' };
      }

      const twilioClient = await this.getTwilioClient(smsConfigId);

      // Test by sending a test message to the configured phone number
      await twilioClient.messages.create({
        body: 'Test message from Foresight CDSS - SMS configuration is working correctly.',
        from: config[0].twilioPhoneNumber,
        to: config[0].twilioPhoneNumber, // Send to self for testing
      });

      await db
        .update(smsAuthConfigs)
        .set({
          lastTestedAt: new Date(),
          testStatus: 'success',
        })
        .where(eq(smsAuthConfigs.id, smsConfigId));

      return { success: true };
    } catch (error) {
      await db
        .update(smsAuthConfigs)
        .set({
          lastTestedAt: new Date(),
          testStatus: 'failed',
        })
        .where(eq(smsAuthConfigs.id, smsConfigId));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cleanupExpiredAttempts(): Promise<number> {
    const result = await db
      .update(smsAuthAttempts)
      .set({
        status: 'expired',
        verificationResult: 'expired',
      })
      .where(
        and(
          eq(smsAuthAttempts.status, 'pending'),
          lt(smsAuthAttempts.expiresAt, new Date())
        )
      )
      .returning({ id: smsAuthAttempts.id });

    return result.length;
  }
}

export const twilioSMSService = new TwilioSMSService();
