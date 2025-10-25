import { db } from '@foresight-cdss-next/db';
import { medicalSpecialties, priorAuthSpecialtyConfigs } from '@foresight-cdss-next/db/schema';
import { eq, and } from 'drizzle-orm';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  missingRequirements: string[];
  autoApproval: boolean;
  recommendedAction: 'APPROVE' | 'DENY' | 'MANUAL_REVIEW' | 'REQUEST_ADDITIONAL_INFO';
}

export interface SpecialtyWorkflowConfig {
  necessityCriteria: Record<string, string[]>;
  requiredDocuments: string[];
  autoApprovalThresholds: Record<string, number>;
  specializedValidations: string[];
  timeoutMinutes: number;
  requiresManualReview: boolean;
}

export interface PriorAuthData {
  diagnosisCodes: string[];
  procedureCodes: string[];
  clinicalRationale: string;
  patientAge: number;
  patientGender: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENT';
  priorTreatments: string[];
  supportingDocuments: string[];
  organizationId: string;
  payerId: string;
  [key: string]: any;
}

export abstract class BaseSpecialtyWorkflowService {
  protected specialty: string;
  protected config: SpecialtyWorkflowConfig;

  constructor(specialty: string, config?: SpecialtyWorkflowConfig) {
    this.specialty = specialty;
    this.config = config || this.getDefaultConfig();
  }

  abstract validateMedicalNecessity(data: PriorAuthData): Promise<ValidationResult>;
  abstract calculateApprovalProbability(data: PriorAuthData): Promise<number>;
  abstract getRequiredDocuments(data: PriorAuthData): string[];
  abstract validateSpecialtySpecificCriteria(data: PriorAuthData): Promise<ValidationResult>;

  async loadSpecialtyConfig(organizationId: string, payerId?: string): Promise<void> {
    try {
      // Get base specialty config
      const baseSpecialty = await db.query.medicalSpecialties.findFirst({
        where: eq(medicalSpecialties.code, this.specialty)
      });

      // Get organization/payer specific overrides
      const overrides = await db.query.priorAuthSpecialtyConfigs.findFirst({
        where: and(
          eq(priorAuthSpecialtyConfigs.organizationId, organizationId),
          eq(priorAuthSpecialtyConfigs.specialtyId, baseSpecialty?.id || ''),
          payerId ? eq(priorAuthSpecialtyConfigs.payerId, payerId) : undefined
        )
      });

      // Merge configs
      if (baseSpecialty?.workflowConfig) {
        this.config = { ...this.config, ...baseSpecialty.workflowConfig };
      }

      if (overrides?.workflowOverrides) {
        this.config = this.mergeConfigs(this.config, overrides.workflowOverrides);
      }

    } catch (error) {
      console.error(`Error loading specialty config for ${this.specialty}:`, error);
      // Continue with default config
    }
  }

  protected mergeConfigs(base: SpecialtyWorkflowConfig, override: any): SpecialtyWorkflowConfig {
    return {
      ...base,
      ...override,
      necessityCriteria: { ...base.necessityCriteria, ...override.necessityCriteria },
      requiredDocuments: override.requiredDocuments || base.requiredDocuments,
      autoApprovalThresholds: { ...base.autoApprovalThresholds, ...override.autoApprovalThresholds }
    };
  }

  protected validateCriteriaGroup(
    groupName: string,
    criteria: string[],
    data: PriorAuthData
  ): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let passed = true;

    for (const criterion of criteria) {
      const result = this.evaluateCriterion(criterion, data);
      if (!result.passed) {
        passed = false;
        reasons.push(`Failed ${groupName}: ${criterion} - ${result.reason}`);
      }
    }

    return { passed, reasons };
  }

  protected evaluateCriterion(criterion: string, data: PriorAuthData): { passed: boolean; reason: string } {
    // Basic criterion evaluation - can be overridden by specialty services
    const lowerCriterion = criterion.toLowerCase();
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';

    // Simple keyword matching for now - more sophisticated logic can be added
    if (lowerCriterion.includes('age') && lowerCriterion.includes('>=')) {
      const ageMatch = criterion.match(/(\d+)/);
      if (ageMatch) {
        const requiredAge = parseInt(ageMatch[1]);
        return {
          passed: data.patientAge >= requiredAge,
          reason: `Patient age ${data.patientAge} vs required ${requiredAge}`
        };
      }
    }

    // Check if criterion keywords are mentioned in clinical rationale
    const keywords = lowerCriterion.split(/\s+/).filter(word => word.length > 3);
    const hasKeywords = keywords.some(keyword => clinicalText.includes(keyword));

    return {
      passed: hasKeywords,
      reason: hasKeywords ? 'Criterion mentioned in clinical rationale' : 'Criterion not documented'
    };
  }

  protected calculateBaseScore(data: PriorAuthData): number {
    let score = 0.5; // Base score

    // Factor in urgency
    switch (data.urgency) {
      case 'EMERGENT':
        score += 0.3;
        break;
      case 'URGENT':
        score += 0.2;
        break;
      case 'ROUTINE':
        score += 0.1;
        break;
    }

    // Factor in documentation completeness
    const documentCompleteness = data.supportingDocuments.length / this.getRequiredDocuments(data).length;
    score += Math.min(0.2, documentCompleteness * 0.2);

    // Factor in clinical rationale quality (simple length check for now)
    if (data.clinicalRationale && data.clinicalRationale.length > 100) {
      score += 0.1;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  protected getDefaultConfig(): SpecialtyWorkflowConfig {
    return {
      necessityCriteria: {},
      requiredDocuments: ['medical_record'],
      autoApprovalThresholds: { score: 0.8 },
      specializedValidations: [],
      timeoutMinutes: 30,
      requiresManualReview: true
    };
  }

  async processWorkflow(data: PriorAuthData): Promise<ValidationResult> {
    // Load dynamic configuration
    await this.loadSpecialtyConfig(data.organizationId, data.payerId);

    // Validate medical necessity
    const necessityResult = await this.validateMedicalNecessity(data);

    // Validate specialty-specific criteria
    const specialtyResult = await this.validateSpecialtySpecificCriteria(data);

    // Calculate approval probability
    const approvalProbability = await this.calculateApprovalProbability(data);

    // Combine results
    const combinedScore = (necessityResult.score + specialtyResult.score + approvalProbability) / 3;
    const allReasons = [...necessityResult.reasons, ...specialtyResult.reasons];
    const allMissing = [...necessityResult.missingRequirements, ...specialtyResult.missingRequirements];

    // Determine auto-approval
    const scoreThreshold = this.config.autoApprovalThresholds.score || 0.8;
    const autoApproval = combinedScore >= scoreThreshold &&
                        allMissing.length === 0 &&
                        !this.config.requiresManualReview;

    // Determine recommended action
    let recommendedAction: ValidationResult['recommendedAction'] = 'MANUAL_REVIEW';

    if (autoApproval) {
      recommendedAction = 'APPROVE';
    } else if (combinedScore < 0.3) {
      recommendedAction = 'DENY';
    } else if (allMissing.length > 0) {
      recommendedAction = 'REQUEST_ADDITIONAL_INFO';
    }

    return {
      isValid: necessityResult.isValid && specialtyResult.isValid,
      score: combinedScore,
      reasons: allReasons,
      missingRequirements: allMissing,
      autoApproval,
      recommendedAction
    };
  }
}
