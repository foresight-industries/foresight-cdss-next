import { eq } from 'drizzle-orm';
import type { DatabaseWrapper, PhiDataClassification, HipaaComplianceStatus } from './types';

/**
 * HIPAA Compliance Manager for Webhooks
 * Handles PHI classification, BAA validation, and audit logging
 */
export class WebhookHipaaComplianceManager {
  private readonly organizationId: string;
  private readonly userId?: string;
  private readonly databaseWrapper: DatabaseWrapper;

  constructor(organizationId: string, databaseWrapper: DatabaseWrapper, userId?: string) {
    this.organizationId = organizationId;
    this.databaseWrapper = databaseWrapper;
    this.userId = userId;
  }

  /**
   * Validate webhook creation for HIPAA compliance
   */
  async validateWebhookCreation(webhookData: {
    url: string;
    phiDataClassification: PhiDataClassification;
    hipaaComplianceStatus: HipaaComplianceStatus;
    vendorName?: string;
    baaSignedDate?: Date;
    baaExpiryDate?: Date;
  }): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // PHI Classification Validation
    if (webhookData.phiDataClassification !== 'none') {
      // Require BAA for any PHI transmission
      if (webhookData.hipaaComplianceStatus === 'non_compliant') {
        errors.push('BAA required for PHI data transmission');
        riskLevel = 'critical';
      }

      // Warn about external domains
      const domain = new URL(webhookData.url).hostname;
      if (!this.isInternalDomain(domain)) {
        warnings.push(`External domain detected: ${domain}. Ensure vendor is HIPAA compliant.`);
        riskLevel = this.escalateRiskLevel(riskLevel, 'medium');
      }

      // Check BAA expiry
      if (webhookData.baaExpiryDate && webhookData.baaExpiryDate < new Date()) {
        errors.push('BAA has expired. Renewal required before PHI transmission.');
        riskLevel = 'critical';
      }

      // Full PHI requires additional validation
      if (webhookData.phiDataClassification === 'full') {
        if (!webhookData.vendorName) {
          errors.push('Vendor name required for full PHI transmission');
        }
        riskLevel = this.escalateRiskLevel(riskLevel, 'high');
      }
    }

    // URL Security Validation
    if (!webhookData.url.startsWith('https://')) {
      errors.push('HTTPS required for all webhook endpoints');
      riskLevel = 'critical';
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskLevel
    };
  }

  /**
   * Log HIPAA audit event for webhook activity
   */
  async logHipaaAuditEvent(eventData: {
    webhookConfigId: string;
    webhookDeliveryId?: string;
    auditEventType: 'phi_accessed' | 'baa_verified' | 'data_transmitted' | 'retention_policy_applied' | 'config_created' | 'config_updated';
    dataClassification: PhiDataClassification;
    phiDataTypes?: string[];
    entityIds?: string[];
    baaVerified?: boolean;
    encryptionVerified?: boolean;
    retentionPolicyApplied?: boolean;
    ipAddress?: string;
    userAgent?: string;
    requestHeaders?: Record<string, any>;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    complianceStatus?: 'compliant' | 'violation' | 'under_review';
  }): Promise<{ success: boolean; auditLogId?: string; error?: string }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      const { data: auditLog, error } = await this.databaseWrapper.safeInsert(async () =>
        db.insert(this.databaseWrapper.schemas.webhookHipaaAuditLog)
          .values({
            webhookConfigId: eventData.webhookConfigId,
            webhookDeliveryId: eventData.webhookDeliveryId,
            auditEventType: eventData.auditEventType,
            userId: this.userId,
            organizationId: this.organizationId,
            phiDataTypes: eventData.phiDataTypes ? JSON.stringify(eventData.phiDataTypes) : null,
            entityIds: eventData.entityIds ? JSON.stringify(eventData.entityIds) : null,
            dataClassification: eventData.dataClassification,
            baaVerified: eventData.baaVerified ?? false,
            encryptionVerified: eventData.encryptionVerified ?? false,
            retentionPolicyApplied: eventData.retentionPolicyApplied ?? false,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent,
            requestHeaders: eventData.requestHeaders ? JSON.stringify(eventData.requestHeaders) : null,
            riskLevel: eventData.riskLevel ?? 'low',
            complianceStatus: eventData.complianceStatus ?? 'compliant',
          })
          .returning({ id: this.databaseWrapper.schemas.webhookHipaaAuditLog.id })
      );

      if (error || !auditLog || auditLog.length === 0) {
        return { success: false, error: 'Failed to create audit log entry' };
      }

      return {
        success: true,
        auditLogId: auditLog[0].id
      };

    } catch (error) {
      console.error('HIPAA audit logging error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if webhook is HIPAA-compliant for specific data classification
   */
  async checkWebhookCompliance(
    webhookConfigId: string,
    dataClassification: PhiDataClassification
  ): Promise<{
    compliant: boolean;
    blockers: string[];
    warnings: string[];
    baaStatus: HipaaComplianceStatus;
  }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      const { data: webhook } = await this.databaseWrapper.safeSingle(async () =>
        db.select({
          phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
          hipaaComplianceStatus: this.databaseWrapper.schemas.webhookConfigs.hipaaComplianceStatus,
          baaSignedDate: this.databaseWrapper.schemas.webhookConfigs.baaSignedDate,
          baaExpiryDate: this.databaseWrapper.schemas.webhookConfigs.baaExpiryDate,
          vendorName: this.databaseWrapper.schemas.webhookConfigs.vendorName,
          requiresEncryption: this.databaseWrapper.schemas.webhookConfigs.requiresEncryption,
          url: this.databaseWrapper.schemas.webhookConfigs.url,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(eq(this.databaseWrapper.schemas.webhookConfigs.id, webhookConfigId))
      );

      if (!webhook) {
        return {
          compliant: false,
          blockers: ['Webhook configuration not found'],
          warnings: [],
          baaStatus: 'non_compliant'
        };
      }

      const blockers: string[] = [];
      const warnings: string[] = [];

      // Check if webhook can handle the requested data classification
      const allowedClassifications = this.getAllowedClassifications(webhook.phiDataClassification);
      if (!allowedClassifications.includes(dataClassification)) {
        blockers.push(`Webhook classified for ${webhook.phiDataClassification} PHI, cannot transmit ${dataClassification} PHI`);
      }

      // PHI-specific checks
      if (dataClassification !== 'none') {
        // BAA compliance check
        if (webhook.hipaaComplianceStatus === 'non_compliant') {
          blockers.push('No valid BAA on file for PHI transmission');
        } else if (webhook.hipaaComplianceStatus === 'pending') {
          warnings.push('BAA review pending - proceeding with caution');
        }

        // BAA expiry check
        if (webhook.baaExpiryDate && webhook.baaExpiryDate < new Date()) {
          blockers.push('BAA has expired');
        }

        // Encryption requirement
        if (webhook.requiresEncryption && !webhook.url.startsWith('https://')) {
          blockers.push('HTTPS required for PHI transmission');
        }

        // Full PHI additional checks
        if (dataClassification === 'full') {
          if (!webhook.vendorName) {
            warnings.push('Vendor name not specified for full PHI transmission');
          }
        }
      }

      return {
        compliant: blockers.length === 0,
        blockers,
        warnings,
        baaStatus: webhook.hipaaComplianceStatus
      };

    } catch (error) {
      console.error('HIPAA compliance check error:', error);
      return {
        compliant: false,
        blockers: ['Error checking compliance status'],
        warnings: [],
        baaStatus: 'non_compliant'
      };
    }
  }

  /**
   * Extract PHI types from event data
   */
  extractPhiTypes(eventData: any): string[] {
    const phiTypes: string[] = [];

    if (typeof eventData !== 'object' || !eventData) {
      return phiTypes;
    }

    // Common PHI field patterns
    const phiPatterns = [
      'ssn', 'social_security', 'social_security_number',
      'patient_id', 'patient_name', 'first_name', 'last_name',
      'email', 'phone', 'phone_number', 'address',
      'date_of_birth', 'dob', 'birth_date',
      'medical_record_number', 'mrn', 'account_number',
      'insurance_id', 'policy_number',
      'diagnosis', 'procedure', 'medication',
      'provider_name', 'physician_name'
    ];

    const checkObject = (obj: any, path = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check if key matches PHI pattern
        if (phiPatterns.some(pattern => lowerKey.includes(pattern))) {
          phiTypes.push(currentPath);
        }

        // Recursively check nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkObject(value, currentPath);
        }
      }
    };

    checkObject(eventData);
    return [...new Set(phiTypes)]; // Remove duplicates
  }

  /**
   * Extract entity IDs that contain PHI
   */
  extractEntityIds(eventData: any): string[] {
    const entityIds: string[] = [];

    // Common entity ID patterns
    const entityIdPatterns = ['patient_id', 'user_id', 'member_id', 'account_id'];

    const extractIds = (obj: any): void => {
      if (typeof obj !== 'object' || !obj) return;

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        if (entityIdPatterns.some(pattern => lowerKey.includes(pattern)) &&
            typeof value === 'string') {
          entityIds.push(value as string);
        }

        if (typeof value === 'object' && value !== null) {
          extractIds(value);
        }
      }
    };

    extractIds(eventData);
    return [...new Set(entityIds)]; // Remove duplicates
  }

  /**
   * Classify data based on content analysis
   */
  classifyEventData(eventData: any): PhiDataClassification {
    const phiTypes = this.extractPhiTypes(eventData);

    if (phiTypes.length === 0) {
      return 'none';
    }

    // High-risk PHI indicators
    const highRiskPatterns = [
      'ssn', 'social_security_number', 'medical_record_number',
      'diagnosis', 'medication', 'procedure', 'treatment'
    ];

    const hasHighRiskPhi = phiTypes.some(type =>
      highRiskPatterns.some(pattern => type.toLowerCase().includes(pattern))
    );

    if (hasHighRiskPhi) {
      return 'full';
    }

    // Limited PHI (dates, demographics without identifiers)
    return 'limited';
  }

  private isInternalDomain(domain: string): boolean {
    // Configure internal domains for your organization
    const internalDomains = [
      'localhost',
      '127.0.0.1',
      '.internal',
      '.foresight-cdss.com', // Replace with your internal domains
    ];

    return internalDomains.some(internal =>
      domain === internal || domain.endsWith(internal)
    );
  }

  private getAllowedClassifications(webhookClassification: PhiDataClassification): PhiDataClassification[] {
    switch (webhookClassification) {
      case 'none':
        return ['none'];
      case 'limited':
        return ['none', 'limited'];
      case 'full':
        return ['none', 'limited', 'full'];
      default:
        return ['none'];
    }
  }

  private escalateRiskLevel(
    current: 'low' | 'medium' | 'high' | 'critical',
    proposed: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = levels[current];
    const proposedLevel = levels[proposed];

    return proposedLevel > currentLevel ? proposed : current;
  }
}

/**
 * PHI Data Classification Helper
 */
export class PhiDataClassifier {
  static readonly PHI_PATTERNS = {
    HIGH_RISK: [
      'ssn', 'social_security_number', 'social_security',
      'medical_record_number', 'mrn', 'medical_record',
      'diagnosis', 'medical_diagnosis', 'condition',
      'medication', 'prescription', 'drug',
      'procedure', 'treatment', 'therapy',
      'lab_result', 'test_result', 'pathology'
    ],
    MEDIUM_RISK: [
      'patient_name', 'first_name', 'last_name', 'full_name',
      'date_of_birth', 'dob', 'birth_date',
      'insurance_id', 'policy_number', 'member_id',
      'provider_name', 'physician_name', 'doctor_name'
    ],
    LOW_RISK: [
      'email', 'phone', 'phone_number', 'telephone',
      'address', 'street_address', 'zip_code', 'postal_code',
      'emergency_contact', 'next_of_kin'
    ]
  };

  static classifyData(data: any): {
    classification: PhiDataClassification;
    phiTypes: string[];
    riskScore: number;
    recommendations: string[];
  } {
    const phiTypes: string[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    const analyzeObject = (obj: any, path = ''): void => {
      if (typeof obj !== 'object' || !obj) return;

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check against PHI patterns
        if (this.PHI_PATTERNS.HIGH_RISK.some(pattern => lowerKey.includes(pattern))) {
          phiTypes.push(currentPath);
          riskScore += 10;
        } else if (this.PHI_PATTERNS.MEDIUM_RISK.some(pattern => lowerKey.includes(pattern))) {
          phiTypes.push(currentPath);
          riskScore += 5;
        } else if (this.PHI_PATTERNS.LOW_RISK.some(pattern => lowerKey.includes(pattern))) {
          phiTypes.push(currentPath);
          riskScore += 2;
        }

        // Recursive analysis
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          analyzeObject(value, currentPath);
        }
      }
    };

    analyzeObject(data);

    // Determine classification based on risk score
    let classification: PhiDataClassification;
    if (riskScore === 0) {
      classification = 'none';
    } else if (riskScore < 5) {
      classification = 'limited';
      recommendations.push('Consider data minimization techniques');
    } else {
      classification = 'full';
      recommendations.push('Requires BAA and enhanced security measures');
      recommendations.push('Consider de-identification before transmission');
    }

    // Additional recommendations
    if (phiTypes.length > 0) {
      recommendations.push('Ensure HTTPS encryption for all transmissions');
      recommendations.push('Implement audit logging for PHI access');

      if (riskScore > 10) {
        recommendations.push('Consider field-level encryption for sensitive data');
        recommendations.push('Implement access controls and monitoring');
      }
    }

    return {
      classification,
      phiTypes: [...new Set(phiTypes)],
      riskScore,
      recommendations
    };
  }
}
