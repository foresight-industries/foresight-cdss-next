import * as crypto from 'node:crypto';
import { KMSClient, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';

/**
 * PHI Field-Level Encryption Manager
 * Handles encryption/decryption of PHI data fields in webhook payloads
 */
export class PhiEncryptionManager {
  private readonly kmsClient: KMSClient;
  private readonly kmsKeyId: string;
  private readonly algorithm: crypto.CipherGCMTypes = 'aes-256-gcm';

  constructor(kmsKeyId: string, region?: string) {
    this.kmsKeyId = kmsKeyId;
    this.kmsClient = new KMSClient({
      region: region ?? process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  /**
   * Encrypt PHI fields in webhook payload
   */
  async encryptPhiFields(
    payload: any,
    phiFieldPaths: string[]
  ): Promise<{
    encryptedPayload: any;
    encryptionMetadata: EncryptionMetadata;
    error?: string;
  }> {
    try {
      // Generate data encryption key using AWS KMS
      const dataKeyResult = await this.kmsClient.send(new GenerateDataKeyCommand({
        KeyId: this.kmsKeyId,
        KeySpec: 'AES_256',
      }));

      if (!dataKeyResult.Plaintext || !dataKeyResult.CiphertextBlob) {
        throw new Error('Failed to generate data encryption key');
      }

      const dataKey = Buffer.from(dataKeyResult.Plaintext);
      const encryptedDataKey = Buffer.from(dataKeyResult.CiphertextBlob);

      const encryptedPayload = structuredClone(payload);
      const encryptedFields: Record<string, FieldEncryptionInfo> = {};

      // Encrypt each PHI field
      for (const fieldPath of phiFieldPaths) {
        const value = this.getNestedValue(payload, fieldPath);

        if (value !== undefined && value !== null) {
          const encryptedField = this.encryptField(value, dataKey);
          this.setNestedValue(encryptedPayload, fieldPath, encryptedField.ciphertext);

          encryptedFields[fieldPath] = {
            iv: encryptedField.iv,
            authTag: encryptedField.authTag,
            originalType: typeof value,
          };
        }
      }

      const encryptionMetadata: EncryptionMetadata = {
        kmsKeyId: this.kmsKeyId,
        encryptedDataKey: encryptedDataKey.toString('base64'),
        algorithm: this.algorithm,
        fields: encryptedFields,
        timestamp: new Date().toISOString(),
      };

      // Clear the data key from memory
      dataKey.fill(0);

      return {
        encryptedPayload,
        encryptionMetadata,
      };

    } catch (error) {
      console.error('PHI encryption error:', error);
      return {
        encryptedPayload: payload,
        encryptionMetadata: {
          kmsKeyId: this.kmsKeyId,
          encryptedDataKey: '',
          algorithm: this.algorithm,
          fields: {},
          timestamp: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown encryption error',
      };
    }
  }

  /**
   * Decrypt PHI fields in webhook payload
   */
  async decryptPhiFields(
    encryptedPayload: any,
    encryptionMetadata: EncryptionMetadata
  ): Promise<{
    decryptedPayload: any;
    error?: string;
  }> {
    try {
      // Decrypt the data encryption key using AWS KMS
      const decryptResult = await this.kmsClient.send(new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptionMetadata.encryptedDataKey, 'base64'),
      }));

      if (!decryptResult.Plaintext) {
        throw new Error('Failed to decrypt data encryption key');
      }

      const dataKey = Buffer.from(decryptResult.Plaintext);
      const decryptedPayload = JSON.parse(JSON.stringify(encryptedPayload));

      // Decrypt each PHI field
      for (const [fieldPath, fieldInfo] of Object.entries(encryptionMetadata.fields)) {
        const encryptedValue = this.getNestedValue(encryptedPayload, fieldPath);

        if (encryptedValue !== undefined && encryptedValue !== null) {
          const decryptedValue = this.decryptField(
            encryptedValue,
            dataKey,
            fieldInfo.iv,
            fieldInfo.authTag
          );

          // Convert back to original type
          const typedValue = this.convertToOriginalType(decryptedValue, fieldInfo.originalType);
          this.setNestedValue(decryptedPayload, fieldPath, typedValue);
        }
      }

      // Clear the data key from memory
      dataKey.fill(0);

      return {
        decryptedPayload,
      };

    } catch (error) {
      console.error('PHI decryption error:', error);
      return {
        decryptedPayload: encryptedPayload,
        error: error instanceof Error ? error.message : 'Unknown decryption error',
      };
    }
  }

  /**
   * Create masked version of payload for logging/debugging
   */
  createMaskedPayload(
    payload: any,
    phiFieldPaths: string[],
    maskChar = '*'
  ): any {
    const maskedPayload = JSON.parse(JSON.stringify(payload));

    for (const fieldPath of phiFieldPaths) {
      const value = this.getNestedValue(payload, fieldPath);

      if (value !== undefined && value !== null) {
        const stringValue = String(value);
        let maskedValue: string;

        if (stringValue.length <= 4) {
          // Mask everything for short values
          maskedValue = maskChar.repeat(stringValue.length);
        } else {
          // Show first and last character for longer values
          maskedValue = stringValue[0] + maskChar.repeat(stringValue.length - 2) + stringValue[stringValue.length - 1];
        }

        this.setNestedValue(maskedPayload, fieldPath, maskedValue);
      }
    }

    return maskedPayload;
  }

  /**
   * Validate encryption integrity
   */
  validateEncryptionIntegrity(
    encryptionMetadata: EncryptionMetadata
  ): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!encryptionMetadata.kmsKeyId) {
      issues.push('Missing KMS key ID');
    }

    if (!encryptionMetadata.encryptedDataKey) {
      issues.push('Missing encrypted data key');
    }

    if (!encryptionMetadata.algorithm || encryptionMetadata.algorithm !== this.algorithm) {
      issues.push(`Unsupported encryption algorithm: ${encryptionMetadata.algorithm}`);
    }

    if (!encryptionMetadata.timestamp) {
      issues.push('Missing encryption timestamp');
    }

    // Check if encryption is too old (optional security measure)
    if (encryptionMetadata.timestamp) {
      const encryptionAge = Date.now() - new Date(encryptionMetadata.timestamp).getTime();
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

      if (encryptionAge > maxAgeMs) {
        issues.push('Encryption timestamp is too old - potential replay attack');
      }
    }

    // Validate field metadata
    for (const [fieldPath, fieldInfo] of Object.entries(encryptionMetadata.fields)) {
      if (!fieldInfo.iv || !fieldInfo.authTag) {
        issues.push(`Missing encryption parameters for field: ${fieldPath}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private encryptField(
    value: any,
    dataKey: Buffer
  ): {
    ciphertext: string;
    iv: string;
    authTag: string;
  } {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);

    const plaintext = JSON.stringify(value);
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  private decryptField(
    ciphertext: string,
    dataKey: Buffer,
    iv: string,
    authTag: string
  ): any {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      dataKey,
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return JSON.parse(plaintext);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  private convertToOriginalType(value: any, originalType: string): any {
    switch (originalType) {
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'string':
        return String(value);
      default:
        return value;
    }
  }
}

/**
 * PHI Field Detection Utility
 */
export class PhiFieldDetector {
  private static readonly PHI_FIELD_PATTERNS = [
    // High priority PHI fields
    /ssn|social_security/i,
    /medical_record|mrn/i,
    /patient_id|patient_name/i,
    /diagnosis|condition/i,
    /medication|prescription/i,
    /procedure|treatment/i,

    // Medium priority PHI fields
    /first_name|last_name|full_name/i,
    /date_of_birth|dob|birth_date/i,
    /insurance|policy_number/i,
    /provider_name|physician/i,

    // Low priority PHI fields
    /email|phone|address/i,
    /emergency_contact|next_of_kin/i,
  ];

  /**
   * Automatically detect PHI fields in payload
   */
  static detectPhiFields(payload: any): {
    detectedFields: string[];
    confidenceScore: number;
    recommendations: string[];
  } {
    const detectedFields: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let fieldCount = 0;

    const analyzeObject = (obj: any, path = ''): void => {
      if (typeof obj !== 'object' || !obj) return;

      for (const [key, value] of Object.entries(obj)) {
        fieldCount++;
        const currentPath = path ? `${path}.${key}` : key;
        let fieldScore = 0;

        // Check key against PHI patterns
        for (const pattern of this.PHI_FIELD_PATTERNS) {
          if (pattern.test(key)) {
            detectedFields.push(currentPath);
            fieldScore = this.getPatternScore(pattern);
            break;
          }
        }

        // Check value content for potential PHI
        if (typeof value === 'string' && value.length > 0) {
          fieldScore += this.analyzeValueContent(value);
        }

        totalScore += fieldScore;

        // Recursively analyze nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          analyzeObject(value, currentPath);
        }
      }
    };

    analyzeObject(payload);

    const confidenceScore = fieldCount > 0 ? (totalScore / fieldCount) * 100 : 0;

    // Generate recommendations
    if (detectedFields.length > 0) {
      recommendations.push('PHI fields detected - enable field-level encryption');
      recommendations.push('Ensure BAA is in place for external transmissions');
      recommendations.push('Consider data minimization techniques');

      if (confidenceScore > 70) {
        recommendations.push('High PHI risk detected - require manual review');
      }
    }

    return {
      detectedFields: [...new Set(detectedFields)],
      confidenceScore: Math.min(confidenceScore, 100),
      recommendations,
    };
  }

  private static getPatternScore(pattern: RegExp): number {
    const patternString = pattern.toString();

    // High-risk patterns
    if (/ssn|medical_record|diagnosis|medication/.test(patternString)) {
      return 10;
    }

    // Medium-risk patterns
    if (/patient|insurance|provider/.test(patternString)) {
      return 7;
    }

    // Low-risk patterns
    return 4;
  }

  private static analyzeValueContent(value: string): number {
    let score = 0;

    // SSN patterns
    if (/^\d{3}-\d{2}-\d{4}$/.test(value) || /^\d{9}$/.test(value)) {
      score += 15;
    }

    // Phone number patterns
    if (/^\+?[\d\s\-()]{10,}$/.test(value)) {
      score += 3;
    }

    // Email patterns
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      score += 3;
    }

    // Date patterns
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      score += 2;
    }

    return score;
  }
}

// Type definitions
export interface EncryptionMetadata {
  kmsKeyId: string;
  encryptedDataKey: string;
  algorithm: string;
  fields: Record<string, FieldEncryptionInfo>;
  timestamp: string;
}

export interface FieldEncryptionInfo {
  iv: string;
  authTag: string;
  originalType: string;
}

export interface PhiEncryptionConfig {
  kmsKeyId: string;
  region?: string;
  autoDetectPhi?: boolean;
  encryptionRequired?: boolean;
  maxPayloadSize?: number;
}
