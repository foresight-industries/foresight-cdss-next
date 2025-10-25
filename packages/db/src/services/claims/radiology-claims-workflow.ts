import {
  BaseClaimsWorkflowService,
  ClaimData,
  ClaimsValidationResult,
  ClaimValidationError,
  ClaimValidationWarning
} from './base-claims-workflow';

export class RadiologyClaimsWorkflowService extends BaseClaimsWorkflowService {
  constructor() {
    super('RADIOLOGY', {
      claimType: 'PROFESSIONAL',
      requiredFields: [
        'claimId', 'specialty', 'organizationId', 'payerId', 'patientId',
        'providerId', 'serviceLines', 'totalCharges', 'serviceDate',
        'diagnosisCodes', 'placeOfService'
      ],
      allowedModifiers: [
        '26', // Professional component
        'TC', // Technical component
        '59', // Distinct procedural service
        'XU', // Unusual non-overlapping service
        'RT', // Right side
        'LT', // Left side
        'GA', // Waiver of liability
        'GY', // Item or service statutorily excluded
        'GZ', // Item or service expected to be denied
        'KX', // Requirements specified in the medical policy have been met
        'Q6', // Service furnished under a fee-for-time compensation arrangement
        'QW'  // CLIA waived test
      ],
      bundlingRules: [
        {
          primaryCode: '70450', // CT head without contrast
          bundledCodes: ['70460'], // CT head with contrast
          reductionPercentage: 50,
          conditions: ['same_session']
        },
        {
          primaryCode: '72148', // MRI lumbar spine without contrast
          bundledCodes: ['72158'], // MRI lumbar spine with contrast
          reductionPercentage: 50,
          conditions: ['same_session']
        },
        {
          primaryCode: '76700', // Abdominal ultrasound
          bundledCodes: ['76705'], // Limited abdominal ultrasound
          reductionPercentage: 75,
          conditions: ['same_session']
        }
      ],
      maxUnitsPerService: {
        '70450': 1, // CT head
        '70460': 1, // CT head with contrast
        '72148': 1, // MRI lumbar spine
        '72158': 1, // MRI lumbar spine with contrast
        '76700': 1, // Abdominal ultrasound
        '76705': 1, // Limited abdominal ultrasound
        '71020': 2, // Chest X-ray (can have 2 views)
        '73630': 3  // Knee X-ray (can have multiple views)
      },
      imagingBundlingRules: {
        'CT_HEAD': ['70450', '70460', '70470'],
        'CT_CHEST': ['71250', '71260', '71270'],
        'CT_ABDOMEN': ['74150', '74160', '74170'],
        'MRI_BRAIN': ['70551', '70552', '70553'],
        'MRI_SPINE': ['72148', '72149', '72158']
      },
      autoSubmissionThreshold: 0.85,
      requiresManualReview: false,
      timeoutMinutes: 20,
      expectedProcessingDays: 10
    });
  }

  async validateSpecialtySpecificCriteria(data: ClaimData): Promise<Partial<ClaimsValidationResult>> {
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];
    const reasons: string[] = [];

    // Validate imaging-specific requirements
    await this.validateImagingRequirements(data, errors, warnings, reasons);

    // Validate contrast usage
    await this.validateContrastUsage(data, errors, warnings, reasons);

    // Validate professional vs technical components
    await this.validateComponentBilling(data, errors, warnings, reasons);

    // Validate multiple imaging sessions
    await this.validateMultipleImagingSessions(data, errors, warnings, reasons);

    // Validate anatomical site consistency
    await this.validateAnatomicalSiteConsistency(data, errors, warnings, reasons);

    if (errors.length === 0) {
      reasons.push('Radiology-specific criteria validated successfully');
    }

    return { errors, warnings, reasons };
  }

  private async validateImagingRequirements(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const procedureCode = line.procedureCode;

      // Check if this is an imaging procedure
      if (this.isImagingProcedure(procedureCode)) {
        // Validate diagnosis codes support imaging
        if (!this.diagnosisSupportsImaging(data.diagnosisCodes, procedureCode)) {
          warnings.push({
            code: 'IMAGING_DIAGNOSIS_MISMATCH',
            field: `serviceLines[${line.lineNumber}].procedureCode`,
            message: `Diagnosis codes may not support imaging procedure ${procedureCode}`,
            impact: 'AUDIT_RISK'
          });
        }

        // Check for appropriate clinical indication
        if (data.diagnosisCodes.length === 0) {
          errors.push({
            code: 'MISSING_CLINICAL_INDICATION',
            severity: 'HIGH',
            field: 'diagnosisCodes',
            message: 'Imaging procedures require clinical indication (diagnosis codes)',
            suggestedFix: 'Add appropriate ICD-10 diagnosis codes'
          });
        }

        // Validate place of service for imaging
        if (!this.isValidImagingPlaceOfService(data.placeOfService)) {
          warnings.push({
            code: 'UNUSUAL_PLACE_OF_SERVICE',
            field: 'placeOfService',
            message: `Unusual place of service (${data.placeOfService}) for imaging procedure`,
            impact: 'AUDIT_RISK'
          });
        }

        reasons.push(`Imaging procedure ${procedureCode} validated`);
      }
    }
  }

  private async validateContrastUsage(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    const contrastCodes = data.serviceLines.filter(line =>
      this.isContrastEnhancedProcedure(line.procedureCode)
    );

    for (const contrastLine of contrastCodes) {
      // Check if contrast is medically necessary
      if (!this.contrastMedicallyNecessary(data.diagnosisCodes, contrastLine.procedureCode)) {
        warnings.push({
          code: 'CONTRAST_MEDICAL_NECESSITY',
          field: `serviceLines[${contrastLine.lineNumber}].procedureCode`,
          message: `Contrast enhancement may not be medically necessary for ${contrastLine.procedureCode}`,
          impact: 'REDUCED_PAYMENT'
        });
      }

      // Check for contraindications
      if (this.hasContrastContraindications(data)) {
        errors.push({
          code: 'CONTRAST_CONTRAINDICATION',
          severity: 'HIGH',
          field: `serviceLines[${contrastLine.lineNumber}].procedureCode`,
          message: 'Patient may have contraindications to contrast administration',
          suggestedFix: 'Verify patient can safely receive contrast or use non-contrast alternative'
        });
      }

      reasons.push(`Contrast usage validated for ${contrastLine.procedureCode}`);
    }
  }

  private async validateComponentBilling(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const has26Modifier = line.modifiers.includes('26'); // Professional component
      const hasTCModifier = line.modifiers.includes('TC'); // Technical component

      if (has26Modifier && hasTCModifier) {
        errors.push({
          code: 'CONFLICTING_COMPONENT_MODIFIERS',
          severity: 'HIGH',
          field: `serviceLines[${line.lineNumber}].modifiers`,
          message: 'Cannot bill both professional (26) and technical (TC) components on same line',
          suggestedFix: 'Use separate lines for professional and technical components'
        });
      }

      // Check if procedure requires component billing
      if (this.requiresComponentBilling(line.procedureCode)) {
        if (!has26Modifier && !hasTCModifier) {
          warnings.push({
            code: 'MISSING_COMPONENT_MODIFIER',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Procedure ${line.procedureCode} typically requires component modifier (26 or TC)`,
            impact: 'REDUCED_PAYMENT'
          });
        }
      }

      // Validate place of service matches component
      if (has26Modifier && !this.isValidProfessionalComponentPOS(data.placeOfService)) {
        warnings.push({
          code: 'PROFESSIONAL_COMPONENT_POS_MISMATCH',
          field: 'placeOfService',
          message: 'Professional component billing with non-office place of service',
          impact: 'AUDIT_RISK'
        });
      }

      if (hasTCModifier && !this.isValidTechnicalComponentPOS(data.placeOfService)) {
        warnings.push({
          code: 'TECHNICAL_COMPONENT_POS_MISMATCH',
          field: 'placeOfService',
          message: 'Technical component billing with inappropriate place of service',
          impact: 'AUDIT_RISK'
        });
      }

      reasons.push(`Component billing validated for ${line.procedureCode}`);
    }
  }

  private async validateMultipleImagingSessions(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    // Group procedures by anatomical area
    const anatomicalGroups = this.groupProceduresByAnatomy(data.serviceLines);

    for (const [anatomy, procedures] of Object.entries(anatomicalGroups)) {
      if (procedures.length > 1) {
        // Check if multiple procedures on same anatomy are appropriate
        const hasSeparateSessionModifier = procedures.some(p =>
          p.modifiers.includes('59') || p.modifiers.includes('XU')
        );

        if (!hasSeparateSessionModifier) {
          warnings.push({
            code: 'MULTIPLE_ANATOMY_PROCEDURES',
            field: 'serviceLines',
            message: `Multiple ${anatomy} procedures may require distinct service modifier (59 or XU)`,
            impact: 'REDUCED_PAYMENT'
          });
        }

        reasons.push(`Multiple ${anatomy} procedures validated`);
      }
    }
  }

  private async validateAnatomicalSiteConsistency(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const hasRightModifier = line.modifiers.includes('RT');
      const hasLeftModifier = line.modifiers.includes('LT');

      if (hasRightModifier && hasLeftModifier) {
        errors.push({
          code: 'CONFLICTING_LATERALITY_MODIFIERS',
          severity: 'HIGH',
          field: `serviceLines[${line.lineNumber}].modifiers`,
          message: 'Cannot bill both right (RT) and left (LT) modifiers on same line',
          suggestedFix: 'Use separate lines for bilateral procedures'
        });
      }

      // Check if procedure requires laterality modifier
      if (this.requiresLateralityModifier(line.procedureCode)) {
        if (!hasRightModifier && !hasLeftModifier) {
          warnings.push({
            code: 'MISSING_LATERALITY_MODIFIER',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Procedure ${line.procedureCode} may require laterality modifier (RT or LT)`,
            impact: 'AUDIT_RISK'
          });
        }
      }

      reasons.push(`Anatomical site consistency validated for ${line.procedureCode}`);
    }
  }

  protected getSpecialtySpecificDocuments(data: ClaimData, baseDocuments: string[]): string[] {
    const documents = [...baseDocuments];

    // Add radiology-specific documents
    documents.push('radiology_report', 'imaging_study');

    // Add contrast-specific documents if contrast was used
    const hasContrast = data.serviceLines.some(line =>
      this.isContrastEnhancedProcedure(line.procedureCode)
    );

    if (hasContrast) {
      documents.push('contrast_consent_form', 'renal_function_labs');
    }

    // Add prior imaging if this is follow-up
    const isFollowUpImaging = this.isFollowUpImaging(data.diagnosisCodes);
    if (isFollowUpImaging) {
      documents.push('prior_imaging_studies', 'comparison_report');
    }

    return documents;
  }

  // Utility methods specific to radiology
  private isImagingProcedure(procedureCode: string): boolean {
    // CPT codes for imaging typically fall in these ranges
    const code = Number.parseInt(procedureCode);
    return (code >= 70010 && code <= 79999) || // Radiology codes
           procedureCode.startsWith('G') || // Some HCPCS imaging codes
           procedureCode.startsWith('S'); // Some supplemental imaging codes
  }

  private isContrastEnhancedProcedure(procedureCode: string): boolean {
    // Common contrast-enhanced procedures
    const contrastCodes = [
      '70460', '70470', // CT head with contrast
      '71260', '71270', // CT chest with contrast
      '74160', '74170', // CT abdomen with contrast
      '72156', '72157', '72158', // MRI spine with contrast
      '70552', '70553', // MRI brain with contrast
      '73719', '73720', '73721', // MRI lower extremity with contrast
      '73218', '73219', '73220'  // MRI upper extremity with contrast
    ];

    return contrastCodes.includes(procedureCode);
  }

  private diagnosisSupportsImaging(diagnosisCodes: string[], procedureCode: string): boolean {
    // Simplified logic - in production, this would use comprehensive guidelines
    const code = Number.parseInt(procedureCode);

    // Head imaging
    if (code >= 70450 && code <= 70470) {
      return diagnosisCodes.some(dx =>
        dx.startsWith('G') || // Nervous system disorders
        dx.startsWith('S06') || // Head injury
        dx.startsWith('R51') // Headache
      );
    }

    // Chest imaging
    if (code >= 71250 && code <= 71270) {
      return diagnosisCodes.some(dx =>
        dx.startsWith('J') || // Respiratory disorders
        dx.startsWith('I') || // Circulatory disorders
        dx.startsWith('C78') // Secondary malignant neoplasm of lung
      );
    }

    return true; // Default to allow if unsure
  }

  private contrastMedicallyNecessary(diagnosisCodes: string[], procedureCode: string): boolean {
    // Conditions that typically require contrast
    const contrastIndications = [
      'C', // Malignant neoplasms
      'D37', 'D38', 'D39', 'D40', 'D41', 'D42', 'D43', 'D44', 'D45', 'D46', 'D47', 'D48', // Uncertain behavior neoplasms
      'I60', 'I61', 'I62', // Stroke
      'G93', // Brain disorders
      'M54' // Back pain (for spine imaging)
    ];

    return diagnosisCodes.some(dx =>
      contrastIndications.some(indication => dx.startsWith(indication))
    );
  }

  private hasContrastContraindications(data: ClaimData): boolean {
    // This would check for allergies, renal function, etc.
    // For now, simplified check
    return data.diagnosisCodes.some(dx =>
      dx.startsWith('N18') || // Chronic kidney disease
      dx.startsWith('T78.4') // Allergy to contrast
    );
  }

  private requiresComponentBilling(procedureCode: string): boolean {
    // Procedures that have both professional and technical components
    const componentProcedures = [
      '70450', '70460', '70470', // CT head
      '71250', '71260', '71270', // CT chest
      '74150', '74160', '74170', // CT abdomen
      '72148', '72149', '72158', // MRI spine
      '70551', '70552', '70553'  // MRI brain
    ];

    return componentProcedures.includes(procedureCode);
  }

  private isValidImagingPlaceOfService(placeOfService: string): boolean {
    // Valid places of service for imaging
    const validPOS = [
      '11', // Office
      '22', // Outpatient hospital
      '24', // Ambulatory surgical center
      '26', // Military treatment facility
      '49', // Independent clinic
      '50', // Federally qualified health center
      '71', // State or local public health clinic
      '72'  // Rural health clinic
    ];

    return validPOS.includes(placeOfService);
  }

  private isValidProfessionalComponentPOS(placeOfService: string): boolean {
    // Professional component typically billed from office
    return ['11', '22', '49'].includes(placeOfService);
  }

  private isValidTechnicalComponentPOS(placeOfService: string): boolean {
    // Technical component typically billed from facility
    return ['22', '24', '26'].includes(placeOfService);
  }

  private groupProceduresByAnatomy(serviceLines: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const line of serviceLines) {
      const anatomy = this.getAnatomicalArea(line.procedureCode);
      if (!groups[anatomy]) {
        groups[anatomy] = [];
      }
      groups[anatomy].push(line);
    }

    return groups;
  }

  private getAnatomicalArea(procedureCode: string): string {
    const code = Number.parseInt(procedureCode);

    if (code >= 70010 && code <= 70559) return 'HEAD_NECK';
    if (code >= 71010 && code <= 71555) return 'CHEST';
    if (code >= 72010 && code <= 72295) return 'SPINE';
    if (code >= 73000 && code <= 73725) return 'EXTREMITIES';
    if (code >= 74000 && code <= 74485) return 'ABDOMEN';
    if (code >= 75600 && code <= 75774) return 'VASCULAR';

    return 'OTHER';
  }

  private requiresLateralityModifier(procedureCode: string): boolean {
    // Procedures on paired organs/structures
    const lateralityProcedures = [
      '73060', '73070', '73080', // Hand/wrist
      '73100', '73110', '73120', // Elbow
      '73200', '73201', '73202', // Shoulder
      '73500', '73510', '73520', // Hip
      '73590', '73592', '73594', // Knee
      '73600', '73610', '73620'  // Ankle/foot
    ];

    return lateralityProcedures.includes(procedureCode);
  }

  private isFollowUpImaging(diagnosisCodes: string[]): boolean {
    // Diagnosis codes that suggest follow-up imaging
    return diagnosisCodes.some(dx =>
      dx.includes('follow') ||
      dx.startsWith('Z51') || // Follow-up care
      dx.startsWith('Z08') || // Follow-up examination after treatment
      dx.startsWith('Z09')    // Follow-up examination after treatment
    );
  }
}
