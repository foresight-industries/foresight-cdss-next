import { db } from '../../connection';
import { claimsSpecialtyConfigs } from '../../schema';
import { eq, and } from 'drizzle-orm';

export interface ClaimData {
  claimId: string;
  claimType: 'PROFESSIONAL' | 'INSTITUTIONAL' | 'DME' | 'PHARMACY';
  specialty: string;
  organizationId: string;
  payerId: string;
  patientId: string;
  providerId: string;

  // Claim line items
  serviceLines: ClaimServiceLine[];

  // Financial data
  totalCharges: number;
  allowedAmount?: number;
  expectedReimbursement?: number;

  // Dates
  serviceDate: Date;
  submissionDate: Date;

  // Patient demographics
  patientAge: number;
  patientGender: string;

  // Clinical data
  diagnosisCodes: string[];
  placeOfService: string;

  // Supporting documentation
  supportingDocuments: string[];

  // Workflow metadata
  submissionMethod: 'EDI' | 'PORTAL' | 'PAPER';
  priority: 'ROUTINE' | 'URGENT' | 'STAT';

  // Additional context
  [key: string]: any;
}

export interface ClaimServiceLine {
  lineNumber: number;
  procedureCode: string;
  procedureDescription: string;
  modifiers: string[];
  units: number;
  chargeAmount: number;
  diagnosisPointers: number[];
  placeOfService?: string;
  dateOfService: Date;

  // Specialty-specific fields
  revenueCode?: string; // For institutional claims
  ndcNumber?: string; // For drug claims
  serialNumber?: string; // For DME claims
}

export interface ClaimsValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  errors: ClaimValidationError[];
  warnings: ClaimValidationWarning[];
  autoSubmissionEligible: boolean;
  recommendedAction: 'SUBMIT' | 'HOLD_FOR_REVIEW' | 'REJECT' | 'REQUEST_ADDITIONAL_INFO';
  estimatedReimbursement?: number;
  expectedProcessingTime?: number; // in days
}

export interface ClaimValidationError {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  field: string;
  message: string;
  suggestedFix?: string;
}

export interface ClaimValidationWarning {
  code: string;
  field: string;
  message: string;
  impact: 'DELAY' | 'REDUCED_PAYMENT' | 'AUDIT_RISK' | 'INFORMATIONAL';
}

export interface ReimbursementCalculation {
  grossCharges: number;
  allowedAmount: number;
  patientResponsibility: number;
  insurancePayment: number;
  adjustments: ReimbursementAdjustment[];
  netPayment: number;
  paymentProbability: number; // 0-1 score
}

export interface ReimbursementAdjustment {
  type: 'DEDUCTIBLE' | 'COPAY' | 'COINSURANCE' | 'CONTRACTUAL' | 'BUNDLING' | 'MODIFIER';
  amount: number;
  reason: string;
  code?: string;
}

export interface ClaimsWorkflowConfig {
  specialty: string;
  claimType: string;

  // Validation rules
  requiredFields: string[];
  validationRules: Record<string, any>;

  // Modifiers and bundling
  allowedModifiers: string[];
  bundlingRules: BundlingRule[];

  // Reimbursement
  feeSchedule: Record<string, number>;
  contractualAdjustments: Record<string, number>;

  // Processing settings
  autoSubmissionThreshold: number;
  requiresManualReview: boolean;
  maxUnitsPerService: Record<string, number>;

  // Specialty-specific settings
  globalPeriodRules?: Record<string, number>; // For surgery
  imagingBundlingRules?: Record<string, string[]>; // For radiology
  sessionDurationLimits?: Record<string, number>; // For mental health

  // Timeouts and processing
  timeoutMinutes: number;
  expectedProcessingDays: number;
}

export interface BundlingRule {
  primaryCode: string;
  bundledCodes: string[];
  reductionPercentage: number;
  conditions?: string[];
}

export abstract class BaseClaimsWorkflowService {
  protected specialty: string;
  protected config: ClaimsWorkflowConfig;

  constructor(specialty: string, config?: Partial<ClaimsWorkflowConfig>) {
    this.specialty = specialty;
    this.config = {
      specialty,
      claimType: 'PROFESSIONAL',
      requiredFields: [
        'claimId', 'specialty', 'organizationId', 'payerId', 'patientId',
        'providerId', 'serviceLines', 'totalCharges', 'serviceDate',
        'diagnosisCodes', 'placeOfService'
      ],
      validationRules: {},
      allowedModifiers: [],
      bundlingRules: [],
      feeSchedule: {},
      contractualAdjustments: {},
      autoSubmissionThreshold: 0.8,
      requiresManualReview: false,
      maxUnitsPerService: {},
      timeoutMinutes: 30,
      expectedProcessingDays: 14,
      ...config
    };
  }

  /**
   * Load specialty and organization-specific configuration
   */
  async loadSpecialtyConfig(organizationId: string, payerId?: string): Promise<void> {
    try {
      let configOverrides = null;

      if (payerId) {
        const payerConfig = await db
          .select()
          .from(claimsSpecialtyConfigs)
          .where(
            and(
              eq(claimsSpecialtyConfigs.organizationId, organizationId),
              eq(claimsSpecialtyConfigs.specialty, this.specialty),
              eq(claimsSpecialtyConfigs.payerId, payerId),
              eq(claimsSpecialtyConfigs.isActive, true)
            )
          )
          .limit(1)
          .then(results => results[0] || null);

        if (payerConfig) {
          configOverrides = payerConfig.workflowOverrides;
        }
      }

      // If no payer-specific config, try organization-only
      if (!configOverrides) {
        const orgConfig = await db
          .select()
          .from(claimsSpecialtyConfigs)
          .where(
            and(
              eq(claimsSpecialtyConfigs.organizationId, organizationId),
              eq(claimsSpecialtyConfigs.specialty, this.specialty),
              eq(claimsSpecialtyConfigs.isActive, true)
            )
          )
          .limit(1)
          .then(results => results[0] || null);

        if (orgConfig) {
          configOverrides = orgConfig.workflowOverrides;
        }
      }

      if (configOverrides) {
        this.config = { ...this.config, ...configOverrides };
      }
    } catch (error) {
      console.error(`Error loading specialty config for ${this.specialty}:`, error);
    }
  }

  /**
   * Main workflow processing method
   */
  async processClaimsWorkflow(data: ClaimData): Promise<ClaimsValidationResult> {
    // Load dynamic configuration
    await this.loadSpecialtyConfig(data.organizationId, data.payerId);

    // Validate basic claim structure
    const structuralValidation = await this.validateClaimStructure(data);

    // Validate specialty-specific criteria
    const specialtyValidation = await this.validateSpecialtySpecificCriteria(data);

    // Apply coding and modifier rules
    const codingValidation = await this.validateCodingAndModifiers(data);

    // Calculate reimbursement
    const reimbursement = await this.calculateReimbursement(data);

    // Combine results
    const allErrors = [
      ...(structuralValidation.errors || []),
      ...(specialtyValidation.errors || []),
      ...(codingValidation.errors || [])
    ];

    const allWarnings = [
      ...(structuralValidation.warnings || []),
      ...(specialtyValidation.warnings || []),
      ...(codingValidation.warnings || [])
    ];

    const allReasons = [
      ...(structuralValidation.reasons || []),
      ...(specialtyValidation.reasons || []),
      ...(codingValidation.reasons || [])
    ];

    // Calculate overall score
    const criticalErrors = allErrors.filter(e => e.severity === 'CRITICAL').length;
    const highErrors = allErrors.filter(e => e.severity === 'HIGH').length;

    let score = 1;
    score -= (criticalErrors * 0.4);
    score -= (highErrors * 0.2);
    score -= (allWarnings.length * 0.05);
    score = Math.max(0, Math.min(1, score));

    // Determine auto-submission eligibility
    const autoSubmissionEligible = score >= this.config.autoSubmissionThreshold &&
                                   criticalErrors === 0 &&
                                   !this.config.requiresManualReview;

    // Determine recommended action
    let recommendedAction: ClaimsValidationResult['recommendedAction'] = 'SUBMIT';

    if (criticalErrors > 0) {
      recommendedAction = 'REJECT';
    } else if (highErrors > 0 || score < 0.6) {
      recommendedAction = 'HOLD_FOR_REVIEW';
    } else if (allWarnings.some(w => w.impact === 'REDUCED_PAYMENT')) {
      recommendedAction = 'REQUEST_ADDITIONAL_INFO';
    }

    return {
      isValid: criticalErrors === 0,
      score,
      reasons: allReasons,
      errors: allErrors,
      warnings: allWarnings,
      autoSubmissionEligible,
      recommendedAction,
      estimatedReimbursement: reimbursement.netPayment,
      expectedProcessingTime: this.config.expectedProcessingDays
    };
  }

  /**
   * Validate basic claim structure and required fields
   */
  protected async validateClaimStructure(data: ClaimData): Promise<Partial<ClaimsValidationResult>> {
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];
    const reasons: string[] = [];

    // Check required fields
    for (const field of this.config.requiredFields) {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'CRITICAL',
          field,
          message: `Required field '${field}' is missing or empty`,
          suggestedFix: `Please provide a value for ${field}`
        });
      }
    }

    // Validate service lines
    if (data.serviceLines?.length === 0) {
      errors.push({
        code: 'NO_SERVICE_LINES',
        severity: 'CRITICAL',
        field: 'serviceLines',
        message: 'Claim must have at least one service line'
      });
    }

    // Validate dates
    if (data.serviceDate > new Date()) {
      errors.push({
        code: 'FUTURE_SERVICE_DATE',
        severity: 'HIGH',
        field: 'serviceDate',
        message: 'Service date cannot be in the future'
      });
    }

    // Validate total charges match service line totals
    const calculatedTotal = data.serviceLines?.reduce((sum, line) => sum + line.chargeAmount, 0) || 0;
    if (Math.abs(calculatedTotal - data.totalCharges) > 0.01) {
      warnings.push({
        code: 'CHARGE_MISMATCH',
        field: 'totalCharges',
        message: 'Total charges do not match sum of service line charges',
        impact: 'DELAY'
      });
    }

    if (errors.length === 0) {
      reasons.push('Basic claim structure is valid');
    }

    return { errors, warnings, reasons };
  }

  /**
   * Abstract method for specialty-specific validation
   * Must be implemented by concrete specialty classes
   */
  abstract validateSpecialtySpecificCriteria(data: ClaimData): Promise<Partial<ClaimsValidationResult>>;

  /**
   * Validate coding and modifiers
   */
  protected async validateCodingAndModifiers(data: ClaimData): Promise<Partial<ClaimsValidationResult>> {
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];
    const reasons: string[] = [];

    for (const line of data.serviceLines) {
      // Validate procedure code format
      if (!this.isValidProcedureCode(line.procedureCode)) {
        errors.push({
          code: 'INVALID_PROCEDURE_CODE',
          severity: 'HIGH',
          field: `serviceLines[${line.lineNumber}].procedureCode`,
          message: `Invalid procedure code format: ${line.procedureCode}`
        });
      }

      // Validate modifiers
      for (const modifier of line.modifiers) {
        if (!this.isValidModifier(modifier)) {
          warnings.push({
            code: 'UNRECOGNIZED_MODIFIER',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Unrecognized modifier: ${modifier}`,
            impact: 'AUDIT_RISK'
          });
        }
      }

      // Check units
      if (line.units <= 0) {
        errors.push({
          code: 'INVALID_UNITS',
          severity: 'HIGH',
          field: `serviceLines[${line.lineNumber}].units`,
          message: 'Units must be greater than 0'
        });
      }

      // Check max units per service
      const maxUnits = this.config.maxUnitsPerService[line.procedureCode];
      if (maxUnits && line.units > maxUnits) {
        warnings.push({
          code: 'EXCESSIVE_UNITS',
          field: `serviceLines[${line.lineNumber}].units`,
          message: `Units (${line.units}) exceed typical maximum (${maxUnits}) for procedure ${line.procedureCode}`,
          impact: 'AUDIT_RISK'
        });
      }
    }

    if (errors.length === 0) {
      reasons.push('Coding and modifiers are valid');
    }

    return { errors, warnings, reasons };
  }

  /**
   * Calculate expected reimbursement
   */
  async calculateReimbursement(data: ClaimData): Promise<ReimbursementCalculation> {
    let grossCharges = 0;
    let allowedAmount = 0;
    const adjustments: ReimbursementAdjustment[] = [];

    for (const line of data.serviceLines) {
      grossCharges += line.chargeAmount;

      // Get allowed amount from fee schedule
      const feeScheduleAmount = this.config.feeSchedule[line.procedureCode] || line.chargeAmount;
      const contractualAdjustment = this.config.contractualAdjustments[line.procedureCode] || 0;

      const lineAllowed = feeScheduleAmount * (1 - contractualAdjustment);
      allowedAmount += lineAllowed;

      if (contractualAdjustment > 0) {
        adjustments.push({
          type: 'CONTRACTUAL',
          amount: feeScheduleAmount * contractualAdjustment,
          reason: `Contractual adjustment for ${line.procedureCode}`,
          code: line.procedureCode
        });
      }
    }

    // Apply bundling rules
    const bundlingAdjustments = this.applyBundlingRules(data.serviceLines);
    adjustments.push(...bundlingAdjustments);

    // Calculate patient responsibility (simplified)
    const patientResponsibility = allowedAmount * 0.2; // Assume 20% coinsurance
    const insurancePayment = allowedAmount - patientResponsibility;

    const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const netPayment = insurancePayment - totalAdjustments;

    return {
      grossCharges,
      allowedAmount,
      patientResponsibility,
      insurancePayment,
      adjustments,
      netPayment: Math.max(0, netPayment),
      paymentProbability: this.calculatePaymentProbability(data)
    };
  }

  /**
   * Apply bundling rules to service lines
   */
  protected applyBundlingRules(serviceLines: ClaimServiceLine[]): ReimbursementAdjustment[] {
    const adjustments: ReimbursementAdjustment[] = [];
    const procedureCodes = new Set(serviceLines.map(line => line.procedureCode));

    for (const rule of this.config.bundlingRules) {
      const hasPrimary = procedureCodes.has(rule.primaryCode);
      const bundledCodes = rule.bundledCodes.filter(code => procedureCodes.has(code));

      if (hasPrimary && bundledCodes.length > 0) {
        for (const bundledCode of bundledCodes) {
          const line = serviceLines.find(l => l.procedureCode === bundledCode);
          if (line) {
            const reductionAmount = line.chargeAmount * (rule.reductionPercentage / 100);
            adjustments.push({
              type: 'BUNDLING',
              amount: reductionAmount,
              reason: `Bundled with primary procedure ${rule.primaryCode}`,
              code: bundledCode
            });
          }
        }
      }
    }

    return adjustments;
  }

  /**
   * Calculate probability of payment success
   */
  protected calculatePaymentProbability(data: ClaimData): number {
    let probability = 0.85; // Base probability

    // Adjust based on claim characteristics
    if (data.priority === 'STAT') probability += 0.05;
    if (data.submissionMethod === 'EDI') probability += 0.1;
    if (data.supportingDocuments.length > 0) probability += 0.05;

    return Math.min(0.95, Math.max(0.1, probability));
  }

  /**
   * Get required documents for claim submission
   */
  getRequiredDocuments(data: ClaimData): string[] {
    const baseDocuments = ['claim_form', 'medical_records'];

    // Add specialty-specific documents
    return this.getSpecialtySpecificDocuments(data, baseDocuments);
  }

  /**
   * Abstract method for specialty-specific required documents
   */
  protected abstract getSpecialtySpecificDocuments(data: ClaimData, baseDocuments: string[]): string[];

  /**
   * Utility methods
   */
  protected isValidProcedureCode(code: string): boolean {
    // Basic CPT/HCPCS validation
    return /^\d{5}$|^[A-Z]\d{4}$/.test(code);
  }

  protected isValidModifier(modifier: string): boolean {
    // Basic modifier validation
    return /^[A-Z0-9]{2}$/.test(modifier);
  }

  /**
   * Calculate base score for the workflow
   */
  protected calculateBaseScore(data: ClaimData): number {
    let score = 0.7; // Base score

    // Adjust based on data completeness
    if (data.diagnosisCodes.length > 0) score += 0.1;
    if (data.supportingDocuments.length > 0) score += 0.1;
    if (data.serviceLines.every(line => line.modifiers.length > 0)) score += 0.05;
    if (data.placeOfService) score += 0.05;

    return Math.min(0.9, score);
  }
}
