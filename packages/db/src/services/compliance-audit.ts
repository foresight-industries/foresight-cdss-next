import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../connection';
import {
  auditLogs,
  NewAuditLog
} from '../schema';
import { createHash } from 'node:crypto';

export interface ComplianceEvent {
  entityType: 'prior_auth' | 'portal_session' | 'sms_otp' | 'automation_workflow' | 'human_intervention';
  entityId: string;
  action: string;
  performedBy: string;
  organizationId: string;
  patientId?: string;
  payerId?: string;
  sessionId?: string;
  compliance: {
    baaCompliant: boolean;
    phiAccessed: boolean;
    consentVerified: boolean;
    dataEncrypted: boolean;
    retentionPolicy: string;
    accessJustification: string;
  };
  technical: {
    ipAddress?: string;
    userAgent?: string;
    browserFingerprint?: string;
    automationLevel?: 'full_auto' | 'human_in_loop' | 'manual';
    botDetectionSignals?: string[];
    processingTime?: number;
  };
  clinical: {
    diagnosisCode?: string;
    procedureCode?: string;
    medicalNecessity?: boolean;
    urgencyLevel?: 'routine' | 'urgent' | 'stat';
  };
  risks: {
    sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationActions: string[];
  };
}

export interface ComplianceReport {
  reportId: string;
  organizationId: string;
  reportType: 'baa_compliance' | 'automation_audit' | 'phi_access' | 'security_incident';
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalEvents: number;
    compliantEvents: number;
    nonCompliantEvents: number;
    complianceRate: number;
    riskDistribution: Record<string, number>;
  };
  details: {
    eventsByType: Record<string, number>;
    phiAccessEvents: number;
    automationEvents: number;
    humanInterventions: number;
    securityIncidents: number;
    dataRetentionViolations: number;
  };
  recommendations: string[];
  generatedAt: Date;
}

export class ComplianceAuditService {
  private readonly baaEnabled: boolean = true;
  private readonly retentionPolicyDays: number = 2555; // 7 years for HIPAA
  private readonly encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';

  async logComplianceEvent(event: ComplianceEvent): Promise<string> {
    try {
      // Hash PHI data for storage
      const hashedMetadata = this.hashSensitiveData({
        ...event.compliance,
        ...event.technical,
        ...event.clinical,
        ...event.risks
      });

      const auditLogEntry: NewAuditLog = {
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        performedBy: event.performedBy,
        organizationId: event.organizationId,
        metadata: {
          ...hashedMetadata,
          // Additional compliance metadata
          auditVersion: '1.0',
          timestamp: new Date().toISOString(),
          complianceFlags: this.calculateComplianceFlags(event),
          dataClassification: this.classifyDataSensitivity(event),
          hashedFingerprint: this.createEventFingerprint(event)
        }
      };

      const [inserted] = await db.insert(auditLogs).values(auditLogEntry).returning();

      // Check for compliance violations and trigger alerts
      await this.checkComplianceViolations(event, inserted.id);

      return inserted.id;

    } catch (error) {
      console.error('Error logging compliance event:', error);
      throw new Error('Failed to log compliance event');
    }
  }

  async logPriorAuthWorkflow(
    priorAuthId: string,
    organizationId: string,
    action: string,
    metadata: {
      automationLevel?: string;
      sessionId?: string;
      payerId?: string;
      processingTime?: number;
      success?: boolean;
      error?: string;
      botSignals?: string[];
      humanInterventionRequired?: boolean;
    }
  ): Promise<void> {
    const event: ComplianceEvent = {
      entityType: 'prior_auth',
      entityId: priorAuthId,
      action,
      performedBy: metadata.humanInterventionRequired ? 'human' : 'system',
      organizationId,
      payerId: metadata.payerId,
      sessionId: metadata.sessionId,
      compliance: {
        baaCompliant: true,
        phiAccessed: true, // PA forms contain PHI
        consentVerified: true, // Assumed for PA workflows
        dataEncrypted: this.baaEnabled,
        retentionPolicy: '7_years_hipaa',
        accessJustification: 'prior_authorization_processing'
      },
      technical: {
        automationLevel: metadata.automationLevel as any,
        botDetectionSignals: metadata.botSignals,
        processingTime: metadata.processingTime
      },
      clinical: {
        urgencyLevel: 'routine', // Could be extracted from PA data
        medicalNecessity: true
      },
      risks: {
        sensitivityLevel: 'high', // PA data is sensitive
        riskFactors: [
          ...(metadata.botSignals?.length ? ['bot_detection'] : []),
          ...(metadata.error ? ['processing_error'] : []),
          ...(metadata.humanInterventionRequired ? ['automation_failure'] : [])
        ],
        mitigationActions: [
          'encrypted_storage',
          'audit_logging',
          'access_controls',
          ...(metadata.humanInterventionRequired ? ['human_oversight'] : [])
        ]
      }
    };

    await this.logComplianceEvent(event);
  }

  async logPortalSession(
    sessionId: string,
    organizationId: string,
    action: string,
    metadata: {
      payerId?: string;
      priorAuthId?: string;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      lockStatus?: string;
      authMethod?: string;
      otpUsed?: boolean;
    }
  ): Promise<void> {
    const event: ComplianceEvent = {
      entityType: 'portal_session',
      entityId: sessionId,
      action,
      performedBy: 'system',
      organizationId,
      payerId: metadata.payerId,
      compliance: {
        baaCompliant: true,
        phiAccessed: action.includes('auth') || action.includes('form'),
        consentVerified: true,
        dataEncrypted: true,
        retentionPolicy: '7_years_hipaa',
        accessJustification: 'portal_automation'
      },
      technical: {
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        automationLevel: 'full_auto',
        processingTime: undefined
      },
      clinical: {
        urgencyLevel: 'routine'
      },
      risks: {
        sensitivityLevel: metadata.otpUsed ? 'high' : 'medium',
        riskFactors: [
          ...(metadata.success === false ? ['session_failure'] : []),
          ...(metadata.lockStatus === 'failed' ? ['lock_contention'] : []),
          ...(metadata.otpUsed ? ['sms_authentication'] : [])
        ],
        mitigationActions: [
          'session_encryption',
          'distributed_locking',
          'audit_logging',
          ...(metadata.otpUsed ? ['otp_verification', 'sms_audit'] : [])
        ]
      }
    };

    await this.logComplianceEvent(event);
  }

  async logSMSOTP(
    attemptId: string,
    organizationId: string,
    action: string,
    metadata: {
      phoneNumber?: string;
      sessionId?: string;
      payerId?: string;
      otpReceived?: boolean;
      manualEntry?: boolean;
      timeout?: boolean;
    }
  ): Promise<void> {
    const event: ComplianceEvent = {
      entityType: 'sms_otp',
      entityId: attemptId,
      action,
      performedBy: metadata.manualEntry ? 'human' : 'system',
      organizationId,
      payerId: metadata.payerId,
      sessionId: metadata.sessionId,
      compliance: {
        baaCompliant: true,
        phiAccessed: false, // OTP codes are not PHI
        consentVerified: true,
        dataEncrypted: true,
        retentionPolicy: '30_days', // Shorter retention for OTP data
        accessJustification: 'multi_factor_authentication'
      },
      technical: {
        automationLevel: metadata.manualEntry ? 'human_in_loop' : 'full_auto'
      },
      clinical: {
        urgencyLevel: 'routine'
      },
      risks: {
        sensitivityLevel: 'medium',
        riskFactors: [
          ...(metadata.timeout ? ['otp_timeout'] : []),
          ...(metadata.manualEntry ? ['manual_intervention'] : []),
          'sms_interception_risk'
        ],
        mitigationActions: [
          'otp_encryption',
          'time_limited_codes',
          'attempt_limiting',
          'audit_logging',
          ...(metadata.manualEntry ? ['human_verification'] : [])
        ]
      }
    };

    await this.logComplianceEvent(event);
  }

  async generateComplianceReport(
    organizationId: string,
    reportType: ComplianceReport['reportType'],
    timeRange: { startDate: Date; endDate: Date }
  ): Promise<ComplianceReport> {
    try {
      const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Query audit logs for the time period
      const auditEvents = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.organizationId, organizationId),
            gte(auditLogs.createdAt, timeRange.startDate),
            lte(auditLogs.createdAt, timeRange.endDate)
          )
        )
        .orderBy(desc(auditLogs.createdAt));

      // Analyze compliance metrics
      const totalEvents = auditEvents.length;
      const compliantEvents = auditEvents.filter(event =>
        event.metadata?.compliance?.baaCompliant === true
      ).length;
      const nonCompliantEvents = totalEvents - compliantEvents;
      const complianceRate = totalEvents > 0 ? (compliantEvents / totalEvents) * 100 : 100;

      // Risk distribution
      const riskDistribution: Record<string, number> = {};
      auditEvents.forEach(event => {
        const riskLevel = event.metadata?.risks?.sensitivityLevel || 'unknown';
        riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;
      });

      // Event type analysis
      const eventsByType: Record<string, number> = {};
      auditEvents.forEach(event => {
        eventsByType[event.entityType] = (eventsByType[event.entityType] || 0) + 1;
      });

      // Specific compliance metrics
      const phiAccessEvents = auditEvents.filter(event =>
        event.metadata?.compliance?.phiAccessed === true
      ).length;

      const automationEvents = auditEvents.filter(event =>
        event.metadata?.technical?.automationLevel !== undefined
      ).length;

      const humanInterventions = auditEvents.filter(event =>
        event.performedBy === 'human' ||
        event.metadata?.technical?.automationLevel === 'human_in_loop'
      ).length;

      // Security incidents (high-risk events)
      const securityIncidents = auditEvents.filter(event =>
        event.metadata?.risks?.sensitivityLevel === 'critical' ||
        (event.metadata?.risks?.riskFactors as string[])?.some(factor =>
          factor.includes('security') || factor.includes('breach') || factor.includes('violation')
        )
      ).length;

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        complianceRate,
        securityIncidents,
        humanInterventions,
        automationEvents,
        riskDistribution
      });

      const report: ComplianceReport = {
        reportId,
        organizationId,
        reportType,
        timeRange,
        summary: {
          totalEvents,
          compliantEvents,
          nonCompliantEvents,
          complianceRate,
          riskDistribution
        },
        details: {
          eventsByType,
          phiAccessEvents,
          automationEvents,
          humanInterventions,
          securityIncidents,
          dataRetentionViolations: 0 // Would need separate calculation
        },
        recommendations,
        generatedAt: new Date()
      };

      // Store report for future reference
      await this.storeComplianceReport(report);

      return report;

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  private hashSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.hashPII(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.hashSensitiveData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const hashed: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Hash values for sensitive fields
        if (this.isSensitiveField(key)) {
          hashed[`${key}Hash`] = this.hashPII(String(value));
        } else {
          hashed[key] = this.hashSensitiveData(value);
        }
      }
      return hashed;
    }

    return data;
  }

  private hashPII(data: string): string {
    if (!this.baaEnabled) return data;
    return createHash('sha256')
      .update(data + this.encryptionKey)
      .digest('hex');
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'phoneNumber', 'ipAddress', 'userAgent', 'patientName',
      'memberId', 'ssn', 'email', 'address'
    ];
    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  private calculateComplianceFlags(event: ComplianceEvent): string[] {
    const flags: string[] = [];

    if (!event.compliance.baaCompliant) flags.push('baa_non_compliant');
    if (event.compliance.phiAccessed && !event.compliance.dataEncrypted) flags.push('unencrypted_phi');
    if (!event.compliance.consentVerified) flags.push('missing_consent');
    if (event.risks.sensitivityLevel === 'critical') flags.push('critical_risk');

    return flags;
  }

  private classifyDataSensitivity(event: ComplianceEvent): string {
    if (event.compliance.phiAccessed) return 'phi';
    if (event.entityType === 'prior_auth') return 'clinical';
    if (event.risks.sensitivityLevel === 'high') return 'sensitive';
    return 'standard';
  }

  private createEventFingerprint(event: ComplianceEvent): string {
    const fingerprintData = {
      entityType: event.entityType,
      action: event.action,
      organizationId: event.organizationId,
      timestamp: new Date().getTime()
    };

    return createHash('md5')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
  }

  private async checkComplianceViolations(
    event: ComplianceEvent,
    auditLogId: string
  ): Promise<void> {
    const violations: string[] = [];

    // Check for BAA violations
    if (event.compliance.phiAccessed && !event.compliance.baaCompliant) {
      violations.push('PHI accessed without BAA compliance');
    }

    // Check for encryption violations
    if (event.compliance.phiAccessed && !event.compliance.dataEncrypted) {
      violations.push('PHI accessed without encryption');
    }

    // Check for consent violations
    if (!event.compliance.consentVerified) {
      violations.push('Action performed without verified consent');
    }

    // Log violations if any found
    if (violations.length > 0) {
      console.warn('Compliance violations detected:', violations);

      // Could trigger alerts, notifications, or automatic remediation here
      await this.handleComplianceViolation(event, violations, auditLogId);
    }
  }

  private async handleComplianceViolation(
    event: ComplianceEvent,
    violations: string[],
    auditLogId: string
  ): Promise<void> {
    // Log the violation as a separate audit event
    await this.logComplianceEvent({
      ...event,
      action: 'compliance_violation_detected',
      risks: {
        ...event.risks,
        sensitivityLevel: 'critical',
        riskFactors: [...event.risks.riskFactors, ...violations],
        mitigationActions: [...event.risks.mitigationActions, 'violation_review', 'corrective_action']
      }
    });

    // Could implement automatic notifications, workflow stops, etc.
  }

  private generateRecommendations(metrics: {
    complianceRate: number;
    securityIncidents: number;
    humanInterventions: number;
    automationEvents: number;
    riskDistribution: Record<string, number>;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.complianceRate < 95) {
      recommendations.push('Improve BAA compliance procedures - current rate below 95%');
    }

    if (metrics.securityIncidents > 0) {
      recommendations.push('Review and address security incidents identified in this period');
    }

    if (metrics.humanInterventions > metrics.automationEvents * 0.2) {
      recommendations.push('High manual intervention rate - review automation configurations');
    }

    if (metrics.riskDistribution.critical > 0) {
      recommendations.push('Critical risk events detected - implement additional safeguards');
    }

    if (metrics.riskDistribution.high > metrics.riskDistribution.low) {
      recommendations.push('Consider risk mitigation strategies for high-risk activities');
    }

    return recommendations;
  }

  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    // Store the report as an audit log entry
    await this.logComplianceEvent({
      entityType: 'automation_workflow',
      entityId: report.reportId,
      action: 'compliance_report_generated',
      performedBy: 'system',
      organizationId: report.organizationId,
      compliance: {
        baaCompliant: true,
        phiAccessed: false,
        consentVerified: true,
        dataEncrypted: true,
        retentionPolicy: '7_years_hipaa',
        accessJustification: 'compliance_reporting'
      },
      technical: {
        automationLevel: 'full_auto',
        processingTime: undefined
      },
      clinical: {
        urgencyLevel: 'routine'
      },
      risks: {
        sensitivityLevel: 'low',
        riskFactors: [],
        mitigationActions: ['audit_logging', 'compliance_monitoring']
      }
    });
  }

  async cleanupExpiredAuditLogs(): Promise<number> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.retentionPolicyDays);

      // Delete expired audit logs (respecting HIPAA 7-year requirement)
      const deletedLogs = await db
        .delete(auditLogs)
        .where(lte(auditLogs.createdAt, retentionDate))
        .returning({ id: auditLogs.id });

      console.log(`Cleaned up ${deletedLogs.length} expired audit logs`);
      return deletedLogs.length;

    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return 0;
    }
  }
}

export const complianceAuditService = new ComplianceAuditService();
