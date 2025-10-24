import { Twilio } from 'twilio';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '../connection';
import { smsAuthConfigs, smsAuthAttempts, NewSmsAuthAttempt, auditLogs } from '../schema';
import { createHash, createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { SecretsManagerClient, GetSecretValueCommand, CreateSecretCommand } from '@aws-sdk/client-secrets-manager';

export interface OTPCaptureOptions {
  phoneNumber: string;
  organizationId: string;
  payerId?: string;
  priorAuthId?: string;
  sessionId?: string;
  purpose?: 'covermymeds_auth' | 'portal_auth' | 'pa_verification';
  expectedFrom?: string; // Expected sender (e.g., 'CoverMyMeds', 'COVERMYMEDS')
  timeoutMinutes?: number;
}

export interface BAAAuditMetadata {
  action: 'otp_capture_started' | 'otp_received' | 'otp_extracted' | 'otp_timeout' | 'otp_manual_entry';
  phoneNumber: string;
  organizationId: string;
  payerId?: string;
  priorAuthId?: string;
  sessionId?: string;
  purpose: string;
  ipAddress?: string;
  userAgent?: string;
  messageFrom?: string;
  messageBody?: string;
}

export class TwilioSMSService {
  private readonly twilioClients: Map<string, Twilio> = new Map();
  private readonly baaComplianceEnabled: boolean = true;
  private readonly scryptAsync = promisify(scrypt);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly covermymedsPatterns = [
    /\b\d{4,8}\b/, // Basic 4-8 digit codes
    /(?:code|verification|otp)\s*:?\s*(\d{4,8})/i, // 'Code: 123456'
    /your\s+(?:code|verification)\s+(?:is|code)\s*:?\s*(\d{4,8})/i, // 'Your verification code is: 123456'
    /(?:covermymeds|cmm)\s+(?:code|verification)\s*:?\s*(\d{4,8})/i // 'CoverMyMeds code: 123456'
  ];

  // AWS Secrets Manager client and caching
  private readonly secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });
  private readonly keyCache = new Map<string, { key: string; expires: number }>();
  private readonly cacheExpiryMs = 30 * 60 * 1000; // 30 minutes

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
    const decryptedToken = await this.decryptAuthToken(twilioAuthToken);

    const client = new Twilio(twilioAccountSid, decryptedToken);
    this.twilioClients.set(smsConfigId, client);

    return client;
  }

  private async decryptAuthToken(encryptedToken: string): Promise<string> {
    if (!this.baaComplianceEnabled) {
      return encryptedToken; // Return as-is if encryption disabled
    }

    try {
      // Check if the token is already plaintext (legacy support)
      if (!encryptedToken.includes(':')) {
        console.warn('Twilio auth token appears to be in plaintext format. Consider re-encrypting.');
        return encryptedToken;
      }

      const [ivHex, tagHex, encryptedHex] = encryptedToken.split(':');
      if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error('Invalid encrypted token format');
      }

      const masterKey = await this.getMasterKey();
      const key = await this.scryptAsync(masterKey, 'twilioAuthTokenSalt', this.keyLength) as Buffer;
      
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt Twilio auth token:', error);
      throw new Error('Invalid or corrupted auth token');
    }
  }

  /**
   * Encrypts a Twilio auth token for secure storage
   * Format: iv:tag:encrypted (all hex encoded)
   */
  async encryptAuthToken(plainToken: string): Promise<string> {
    if (!this.baaComplianceEnabled) {
      return plainToken; // Return as-is if encryption disabled
    }

    try {
      const masterKey = await this.getMasterKey();
      const key = await this.scryptAsync(masterKey, 'twilioAuthTokenSalt', this.keyLength) as Buffer;
      
      const iv = randomBytes(16); // 128-bit IV for GCM
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(plainToken, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      // Return in format: iv:tag:encrypted (all hex encoded)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      console.error('Failed to encrypt Twilio auth token:', error);
      throw new Error('Failed to encrypt auth token');
    }
  }

  /**
   * Gets the master key for encryption/decryption from AWS Secrets Manager
   * Falls back to environment variables for local development
   */
  private async getMasterKey(): Promise<string> {
    const secretName = process.env.TWILIO_ENCRYPTION_SECRET_NAME || 'foresight-cdss/twilio-encryption-key';
    
    // Check cache first
    const cached = this.keyCache.get(secretName);
    if (cached && cached.expires > Date.now()) {
      return cached.key;
    }

    try {
      // Try AWS Secrets Manager first
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.secretsClient.send(command);
      
      let masterKey: string;
      if (response.SecretString) {
        // Handle both plain string and JSON format
        try {
          const parsed = JSON.parse(response.SecretString);
          masterKey = parsed.encryptionKey || parsed.key || parsed.masterKey;
        } catch {
          // It's a plain string
          masterKey = response.SecretString;
        }
      } else {
        throw new Error('Secret value is empty');
      }

      if (!masterKey || masterKey.length < 32) {
        throw new Error('Invalid encryption key from Secrets Manager (must be at least 32 characters)');
      }

      // Cache the key
      this.keyCache.set(secretName, {
        key: masterKey,
        expires: Date.now() + this.cacheExpiryMs
      });

      return masterKey;
    } catch (error) {
      console.warn('Failed to retrieve key from AWS Secrets Manager, falling back to environment variables:', error);
      
      // Fallback to environment variables for local development
      const envKey = process.env.TWILIO_ENCRYPTION_KEY || process.env.MASTER_ENCRYPTION_KEY;
      
      if (!envKey) {
        throw new Error(
          `Unable to retrieve encryption key. Please ensure:\n` +
          `1. AWS Secrets Manager secret "${secretName}" exists and contains an encryption key\n` +
          `2. Or set TWILIO_ENCRYPTION_KEY environment variable for local development\n` +
          `3. Ensure AWS credentials are properly configured`
        );
      }

      if (envKey.length < 32) {
        throw new Error('Encryption key must be at least 32 characters long');
      }

      return envKey;
    }
  }

  /**
   * Creates a new encryption key in AWS Secrets Manager
   * Use this method to initialize the encryption key for the first time
   */
  async createEncryptionKey(description: string = 'Twilio SMS encryption key for FORESIGHT CDSS'): Promise<string> {
    const secretName = process.env.TWILIO_ENCRYPTION_SECRET_NAME || 'foresight-cdss/twilio-encryption-key';
    
    // Generate a cryptographically secure 256-bit key
    const encryptionKey = randomBytes(32).toString('base64');
    
    const secretValue = JSON.stringify({
      encryptionKey,
      createdAt: new Date().toISOString(),
      purpose: 'twilio-sms-otp-encryption',
      keyVersion: 'v1'
    });

    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: secretValue,
        Description: description,
        Tags: [
          { Key: 'Service', Value: 'foresight-cdss' },
          { Key: 'Purpose', Value: 'twilio-encryption' },
          { Key: 'Environment', Value: process.env.NODE_ENV || 'development' }
        ]
      });

      const response = await this.secretsClient.send(command);
      console.log(`Encryption key created in Secrets Manager: ${response.ARN}`);
      
      return encryptionKey;
    } catch (error) {
      console.error('Failed to create encryption key in Secrets Manager:', error);
      throw new Error('Unable to create encryption key in AWS Secrets Manager');
    }
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

  async startOTPCapture(
    smsConfigId: string,
    options: OTPCaptureOptions
  ): Promise<{ attemptId: string; success: boolean; error?: string }> {
    try {
      // Validate BAA compliance requirements
      if (this.baaComplianceEnabled) {
        const consentValid = await this.validateBAAConsent(options.organizationId, options.phoneNumber);
        if (!consentValid) {
          throw new Error('BAA consent not found or expired for this phone number');
        }
      }

      // Create SMS attempt record for OTP capture
      const attemptId = await this.createOTPCaptureAttempt(
        smsConfigId,
        options.phoneNumber,
        options.sessionId,
        options.priorAuthId,
        options.purpose || 'covermymeds_auth'
      );

      // Log BAA audit event
      await this.logBAAEvent({
        action: 'otp_capture_started',
        phoneNumber: this.hashPhoneNumber(options.phoneNumber),
        organizationId: options.organizationId,
        payerId: options.payerId,
        priorAuthId: options.priorAuthId,
        sessionId: options.sessionId,
        purpose: options.purpose || 'covermymeds_auth'
      });

      return { attemptId, success: true };
    } catch (error) {
      console.error('Error starting OTP capture:', error);
      return {
        attemptId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createOTPCaptureAttempt(
    smsConfigId: string,
    phoneNumber: string,
    sessionId?: string,
    priorAuthId?: string,
    purpose: string = 'covermymeds_auth'
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
      phoneNumber: this.baaComplianceEnabled ? this.hashPhoneNumber(phoneNumber) : phoneNumber,
      sessionId,
      priorAuthId,
      attemptNumber,
      status: 'waiting_for_otp', // Waiting for CoverMyMeds to send OTP
      expiresAt,
      purpose,
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

  async receiveCoverMyMedsOTP(
    phoneNumber: string,
    messageBody: string,
    messageFrom: string,
    twilioMessageSid: string,
    accountSid: string
  ): Promise<{ processed: boolean; attemptId?: string; otpCode?: string }> {
    try {
      // Extract OTP code using multiple patterns
      const otpCode = this.extractOTPFromMessage(messageBody, messageFrom);
      if (!otpCode) {
        console.log('No OTP code found in message from:', messageFrom, 'Body:', messageBody);
        return { processed: false };
      }

      // Hash phone number for lookup if BAA compliance is enabled
      const lookupPhone = this.baaComplianceEnabled ? this.hashPhoneNumber(phoneNumber) : phoneNumber;

      // Find the most recent OTP capture attempt for this phone number
      const recentAttempt = await db
        .select()
        .from(smsAuthAttempts)
        .leftJoin(smsAuthConfigs, eq(smsAuthAttempts.smsConfigId, smsAuthConfigs.id))
        .where(
          and(
            eq(smsAuthAttempts.phoneNumber, lookupPhone),
            eq(smsAuthAttempts.status, 'waiting_for_otp'),
            eq(smsAuthConfigs.twilioAccountSid, accountSid),
            gt(smsAuthAttempts.expiresAt, new Date())
          )
        )
        .orderBy(smsAuthAttempts.createdAt)
        .limit(1);

      if (!recentAttempt.length) {
        console.log('No waiting OTP attempt found for phone number:', phoneNumber);
        return { processed: false };
      }

      const attempt = recentAttempt[0].sms_auth_attempt;
      const config = recentAttempt[0].sms_auth_config;

      // Update the attempt with the received OTP
      await db
        .update(smsAuthAttempts)
        .set({
          status: 'otp_received',
          smsCode: this.baaComplianceEnabled ? await this.encryptOTP(otpCode) : otpCode,
          twilioMessageSid,
          receivedAt: new Date(),
          messageFrom,
          messageBody: this.baaComplianceEnabled ? this.hashMessage(messageBody) : messageBody,
        })
        .where(eq(smsAuthAttempts.id, attempt.id));

      // Log BAA audit event
      if (this.baaComplianceEnabled && config) {
        await this.logBAAEvent({
          action: 'otp_received',
          phoneNumber: this.hashPhoneNumber(phoneNumber),
          organizationId: config.organizationId,
          payerId: config.payerId,
          priorAuthId: String(attempt?.priorAuthId),
          sessionId: String(attempt?.sessionId),
          purpose: attempt.purpose || 'covermymeds_auth',
          messageFrom,
          messageBody: this.hashMessage(messageBody)
        });
      }

      console.log(`OTP successfully captured for attempt ${attempt.id}`);
      return { processed: true, attemptId: attempt.id, otpCode };
    } catch (error) {
      console.error('Error processing CoverMyMeds OTP:', error);
      return { processed: false };
    }
  }

  async getReceivedOTP(
    attemptId: string
  ): Promise<{ success: boolean; otpCode?: string; error?: string }> {
    const attempt = await db
      .select()
      .from(smsAuthAttempts)
      .where(eq(smsAuthAttempts.id, attemptId))
      .limit(1);

    if (!attempt.length) {
      return { success: false, error: 'OTP attempt not found' };
    }

    const currentAttempt = attempt[0];

    // Check if expired
    if (currentAttempt.expiresAt && new Date() > currentAttempt.expiresAt) {
      await this.markAttemptExpired(attemptId);
      return { success: false, error: 'OTP capture timeout expired' };
    }

    // Check if OTP was received
    if (currentAttempt.status !== 'otp_received' || !currentAttempt.smsCode) {
      return { success: false, error: 'OTP not yet received' };
    }

    // Decrypt OTP if encrypted
    const otpCode = this.baaComplianceEnabled ?
      await this.decryptOTP(currentAttempt.smsCode) : currentAttempt.smsCode;

    // Mark as retrieved
    await db
      .update(smsAuthAttempts)
      .set({
        status: 'otp_retrieved',
        retrievedAt: new Date(),
      })
      .where(eq(smsAuthAttempts.id, attemptId));

    return { success: true, otpCode };
  }

  async recordManualOTPEntry(
    attemptId: string,
    manualOTP: string,
    enteredBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const attempt = await db
        .select()
        .from(smsAuthAttempts)
        .where(eq(smsAuthAttempts.id, attemptId))
        .limit(1);

      if (!attempt.length) {
        return { success: false, error: 'OTP attempt not found' };
      }

      const currentAttempt = attempt[0];

      // Check if expired
      if (currentAttempt.expiresAt && new Date() > currentAttempt.expiresAt) {
        await this.markAttemptExpired(attemptId);
        return { success: false, error: 'OTP capture timeout expired' };
      }

      // Update with manual entry
      await db
        .update(smsAuthAttempts)
        .set({
          status: 'manual_entry',
          smsCode: this.baaComplianceEnabled ? await this.encryptOTP(manualOTP) : manualOTP,
          humanResolvedAt: new Date(),
          enteredBy,
        })
        .where(eq(smsAuthAttempts.id, attemptId));

      // Log BAA audit event
      if (this.baaComplianceEnabled) {
        await this.logBAAEvent({
          action: 'otp_manual_entry',
          phoneNumber: this.hashPhoneNumber(currentAttempt.phoneNumber ?? ''),
          organizationId: '', // Would need to join to get this
          sessionId: String(currentAttempt?.sessionId),
          priorAuthId: String(currentAttempt?.priorAuthId),
          purpose: currentAttempt.purpose || 'covermymeds_auth'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording manual OTP entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifySMSCode(
    attemptId: string,
    providedCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
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

      // Check if we have a received SMS code
      if (!currentAttempt.smsCode) {
        return { success: false, error: 'No SMS code available for verification' };
      }

      // Decrypt the stored OTP if encrypted
      const storedCode = this.baaComplianceEnabled ?
        await this.decryptOTP(currentAttempt.smsCode) : currentAttempt.smsCode;

      // Verify the codes match
      if (storedCode !== providedCode) {
        // Update attempt with failed verification
        await db
          .update(smsAuthAttempts)
          .set({
            status: 'failed',
            verificationResult: 'code_mismatch',
            errorMessage: 'SMS code verification failed',
          })
          .where(eq(smsAuthAttempts.id, attemptId));

        return { success: false, error: 'SMS code verification failed' };
      }

      // Mark as successfully verified
      await db
        .update(smsAuthAttempts)
        .set({
          status: 'verified',
          verificationResult: 'success',
          codeEnteredAt: new Date(),
        })
        .where(eq(smsAuthAttempts.id, attemptId));

      // Log BAA audit event
      if (this.baaComplianceEnabled) {
        await this.logBAAEvent({
          action: 'otp_extracted',
          phoneNumber: this.hashPhoneNumber(currentAttempt.phoneNumber ?? ''),
          organizationId: '', // Would need to join to get this
          sessionId: String(currentAttempt?.sessionId),
          priorAuthId: String(currentAttempt?.priorAuthId),
          purpose: currentAttempt.purpose || 'covermymeds_auth'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

  // ============================================================================
  // BAA COMPLIANCE AND SECURITY METHODS
  // ============================================================================

  private extractOTPFromMessage(messageBody: string, messageFrom: string): string | null {
    // Try multiple patterns to extract OTP from CoverMyMeds messages
    for (const pattern of this.covermymedsPatterns) {
      const match = messageBody.match(pattern);
      if (match) {
        // Return the captured group if it exists, otherwise the full match
        const code = match[1] || match[0];
        // Validate it's a reasonable OTP length
        if (code.length >= 4 && code.length <= 8) {
          return code;
        }
      }
    }

    // If no pattern matches, try to find any sequence of 4-8 digits
    const fallbackMatch = messageBody.match(/\b\d{4,8}\b/);
    if (fallbackMatch) {
      return fallbackMatch[0];
    }

    return null;
  }

  private hashPhoneNumber(phoneNumber: string): string {
    if (!this.baaComplianceEnabled) return phoneNumber;
    return createHash('sha256').update(phoneNumber + process.env.BAA_SALT || 'default-salt').digest('hex');
  }

  private hashMessage(messageBody: string): string {
    if (!this.baaComplianceEnabled) return messageBody;
    return createHash('sha256').update(messageBody + process.env.BAA_SALT || 'default-salt').digest('hex');
  }

  private async encryptOTP(otp: string): Promise<string> {
    if (!this.baaComplianceEnabled) return otp;

    try {
      const masterKey = await this.getMasterKey();
      const key = await this.scryptAsync(masterKey, 'otpEncryptionSalt', this.keyLength) as Buffer;
      
      const iv = randomBytes(16); // 128-bit IV for GCM
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(otp, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      // Return in format: iv:tag:encrypted (all hex encoded)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      console.error('Failed to encrypt OTP:', error);
      // Fallback to base64 for backwards compatibility
      return Buffer.from(otp).toString('base64');
    }
  }

  private async decryptOTP(encryptedOTP: string): Promise<string> {
    if (!this.baaComplianceEnabled) return encryptedOTP;

    try {
      // Check if it's in the new format (contains colons)
      if (encryptedOTP.includes(':')) {
        const [ivHex, tagHex, encryptedHex] = encryptedOTP.split(':');
        if (!ivHex || !tagHex || !encryptedHex) {
          throw new Error('Invalid encrypted OTP format');
        }

        const masterKey = await this.getMasterKey();
        const key = await this.scryptAsync(masterKey, 'otpEncryptionSalt', this.keyLength) as Buffer;
        
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        const decipher = createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      } else {
        // Legacy base64 format - decode for backwards compatibility
        return Buffer.from(encryptedOTP, 'base64').toString();
      }
    } catch (error) {
      console.error('Failed to decrypt OTP:', error);
      // Fallback to original if decryption fails
      return encryptedOTP;
    }
  }

  private async validateBAAConsent(organizationId: string, phoneNumber: string): Promise<boolean> {
    if (!this.baaComplianceEnabled) return true;

    // TODO: Implement actual BAA consent validation
    // Check if organization has valid BAA and phone number has consent
    // This would typically check against a consent management system

    console.log(`Validating BAA consent for org ${organizationId} and phone ${phoneNumber}`);
    return true; // Placeholder - always return true for now
  }

  private async logBAAEvent(metadata: BAAAuditMetadata): Promise<void> {
    if (!this.baaComplianceEnabled) return;

    try {
      await db.insert(auditLogs).values({
        entityType: 'sms_otp',
        entityId: metadata.sessionId || metadata.priorAuthId || 'unknown',
        action: metadata.action,
        organizationId: metadata.organizationId,
        oldValues: null,
        newValues: {
          phoneNumber: metadata.phoneNumber,
          payerId: metadata.payerId,
          priorAuthId: metadata.priorAuthId,
          sessionId: metadata.sessionId,
          purpose: metadata.purpose,
          messageFrom: metadata.messageFrom,
          messageBody: metadata.messageBody,
        },
        changedFields: null,
        userId: null,
        userEmail: null,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        containsPhi: false, // OTP codes are not PHI
        accessReason: `SMS OTP ${metadata.action} for ${metadata.purpose}`,
      });
    } catch (error) {
      console.error('Error logging BAA audit event:', error);
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
          eq(smsAuthAttempts.status, 'waiting_for_otp'),
          lt(smsAuthAttempts.expiresAt, new Date())
        )
      )
      .returning({ id: smsAuthAttempts.id });

    return result.length;
  }

  // ============================================================================
  // WEBHOOK ENDPOINT HELPER
  // ============================================================================

  async processTwilioWebhook(webhookData: {
    From: string;
    To: string;
    Body: string;
    MessageSid: string;
    AccountSid: string;
    FromCountry?: string;
    FromState?: string;
  }): Promise<{ processed: boolean; attemptId?: string; otpCode?: string }> {
    const { From, To, Body, MessageSid, AccountSid } = webhookData;

    // Normalize phone numbers (remove +1, etc.)
    const normalizedTo = this.normalizePhoneNumber(To);

    return this.receiveCoverMyMedsOTP(
      normalizedTo,
      Body,
      From,
      MessageSid,
      AccountSid
    );
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove common prefixes and formatting
    return phoneNumber.replace(/^\+?1?/, '').replaceAll(/\D/g, '');
  }
}

export const twilioSMSService = new TwilioSMSService();
