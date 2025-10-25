import {
  BaseClaimsWorkflowService,
  ClaimData,
  ClaimsValidationResult,
  ClaimValidationError,
  ClaimValidationWarning
} from './base-claims-workflow';

export class SurgeryClaimsWorkflowService extends BaseClaimsWorkflowService {
  constructor() {
    super('SURGERY', {
      claimType: 'PROFESSIONAL',
      requiredFields: [
        'claimId', 'specialty', 'organizationId', 'payerId', 'patientId',
        'providerId', 'serviceLines', 'totalCharges', 'serviceDate',
        'diagnosisCodes', 'placeOfService'
      ],
      allowedModifiers: [
        '22', // Increased procedural services
        '26', // Professional component
        '47', // Anesthesia by surgeon
        '50', // Bilateral procedure
        '51', // Multiple procedures
        '52', // Reduced services
        '53', // Discontinued procedure
        '54', // Surgical care only
        '55', // Postoperative management only
        '56', // Preoperative management only
        '58', // Staged or related procedure by same physician during postop period
        '59', // Distinct procedural service
        '62', // Two surgeons
        '66', // Surgical team
        '78', // Unplanned return to OR for related procedure during postop period
        '79', // Unrelated procedure by same physician during postop period
        '80', // Assistant surgeon
        '81', // Minimum assistant surgeon
        '82', // Assistant surgeon when qualified resident surgeon not available
        'AS', // Physician assistant, nurse practitioner, or clinical nurse specialist services for assistant at surgery
        'LT', // Left side
        'RT', // Right side
        'E1', 'E2', 'E3', 'E4', // Eyelid procedures
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'FA', // Finger/toe modifiers
        'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'TA' // Toe modifiers
      ],
      bundlingRules: [
        {
          primaryCode: '19301', // Mastectomy, partial
          bundledCodes: ['38525'], // Biopsy or excision lymph nodes
          reductionPercentage: 50,
          conditions: ['same_session']
        },
        {
          primaryCode: '27447', // Total knee arthroplasty
          bundledCodes: ['27440'], // Arthrotomy, knee
          reductionPercentage: 100, // Fully bundled
          conditions: ['same_session']
        },
        {
          primaryCode: '47562', // Laparoscopic cholecystectomy
          bundledCodes: ['47563'], // Laparoscopic cholecystectomy with cholangiography
          reductionPercentage: 25,
          conditions: ['same_session']
        }
      ],
      maxUnitsPerService: {
        '27447': 1, // Total knee arthroplasty
        '27130': 1, // Total hip arthroplasty
        '19301': 2, // Mastectomy (can be bilateral)
        '47562': 1, // Laparoscopic cholecystectomy
        '43770': 1, // Laparoscopic gastric restrictive procedure
        '64483': 4  // Injection, anesthetic agent; transforaminal epidural (can do multiple levels)
      },
      globalPeriodRules: {
        // Major procedures - 90 day global period
        '27447': 90, // Total knee arthroplasty
        '27130': 90, // Total hip arthroplasty
        '19301': 90, // Mastectomy
        '47562': 90, // Laparoscopic cholecystectomy
        '43770': 90, // Laparoscopic gastric restrictive procedure
        '44970': 90, // Laparoscopic appendectomy

        // Minor procedures - 10 day global period
        '11401': 10, // Excision, benign lesion including margins, trunk, arms or legs; excised diameter 0.6 to 1.0 cm
        '11042': 10, // Debridement, subcutaneous tissue (includes epidermis and dermis, if performed)
        '12031': 10, // Repair, intermediate, wounds of scalp, axillae, trunk and/or extremities (excluding hands and feet)
        '64483': 0,  // Injection procedures - no global period

        // Endoscopic procedures - 0 or 10 day global period
        '45378': 0,  // Colonoscopy, flexible; diagnostic
        '43239': 0,  // Esophagogastroduodenoscopy, flexible, transoral; with biopsy
        '47555': 10  // Laparoscopy, surgical; with guided transhepatic cholangiography
      },
      autoSubmissionThreshold: 0.8,
      requiresManualReview: true, // Surgery typically requires more review
      timeoutMinutes: 45,
      expectedProcessingDays: 21 // Surgery claims often take longer
    });
  }

  async validateSpecialtySpecificCriteria(data: ClaimData): Promise<Partial<ClaimsValidationResult>> {
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];
    const reasons: string[] = [];

    // Validate surgical procedure requirements
    await this.validateSurgicalRequirements(data, errors, warnings, reasons);

    // Validate global period implications
    await this.validateGlobalPeriodRules(data, errors, warnings, reasons);

    // Validate multiple procedure rules
    await this.validateMultipleProcedureRules(data, errors, warnings, reasons);

    // Validate assistant surgeon billing
    await this.validateAssistantSurgeonBilling(data, errors, warnings, reasons);

    // Validate bilateral procedure billing
    await this.validateBilateralProcedures(data, errors, warnings, reasons);

    // Validate place of service for surgical procedures
    await this.validateSurgicalPlaceOfService(data, errors, warnings, reasons);

    if (errors.length === 0) {
      reasons.push('Surgery-specific criteria validated successfully');
    }

    return { errors, warnings, reasons };
  }

  private async validateSurgicalRequirements(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const procedureCode = line.procedureCode;

      // Check if this is a surgical procedure
      if (this.isSurgicalProcedure(procedureCode)) {
        // Validate surgical diagnosis codes
        if (!this.diagnosisSupportsSurgery(data.diagnosisCodes, procedureCode)) {
          warnings.push({
            code: 'SURGICAL_DIAGNOSIS_MISMATCH',
            field: `serviceLines[${line.lineNumber}].procedureCode`,
            message: `Diagnosis codes may not support surgical procedure ${procedureCode}`,
            impact: 'AUDIT_RISK'
          });
        }

        // Check for pre-operative clearance requirements
        if (this.requiresPreOpClearance(procedureCode) && !this.hasPreOpClearance(data)) {
          warnings.push({
            code: 'MISSING_PREOP_CLEARANCE',
            field: 'supportingDocuments',
            message: `Major surgical procedure ${procedureCode} typically requires pre-operative clearance`,
            impact: 'DELAY'
          });
        }

        // Validate operative report requirements
        if (this.requiresOperativeReport(procedureCode) && !this.hasOperativeReport(data)) {
          errors.push({
            code: 'MISSING_OPERATIVE_REPORT',
            severity: 'HIGH',
            field: 'supportingDocuments',
            message: `Surgical procedure ${procedureCode} requires operative report`,
            suggestedFix: 'Include detailed operative report with procedure documentation'
          });
        }

        reasons.push(`Surgical requirements validated for ${procedureCode}`);
      }
    }
  }

  private async validateGlobalPeriodRules(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const globalPeriod = this.config.globalPeriodRules?.[line.procedureCode];

      if (globalPeriod !== undefined && globalPeriod > 0) {
        // Check for postoperative modifier if within global period
        const hasPostOpModifier = line.modifiers.some(mod =>
          ['54', '55', '56', '58', '78', '79'].includes(mod)
        );

        if (!hasPostOpModifier) {
          warnings.push({
            code: 'GLOBAL_PERIOD_CONSIDERATION',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Procedure ${line.procedureCode} has ${globalPeriod}-day global period. Consider postoperative modifiers if applicable.`,
            impact: 'INFORMATIONAL'
          });
        }

        // Validate modifier usage
        if (line.modifiers.includes('54') && line.modifiers.includes('55')) {
          errors.push({
            code: 'CONFLICTING_GLOBAL_MODIFIERS',
            severity: 'HIGH',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: 'Cannot bill both surgical care only (54) and postoperative care only (55) modifiers',
            suggestedFix: 'Use separate claims for surgical and postoperative care'
          });
        }

        reasons.push(`Global period rules validated for ${line.procedureCode}`);
      }
    }
  }

  private async validateMultipleProcedureRules(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    const surgicalProcedures = data.serviceLines.filter(line =>
      this.isSurgicalProcedure(line.procedureCode)
    );

    if (surgicalProcedures.length > 1) {
      // Check for appropriate multiple procedure modifiers
      const secondaryProcedures = surgicalProcedures.slice(1); // All except primary

      for (const procedure of secondaryProcedures) {
        const hasMultipleModifier = procedure.modifiers.includes('51') ||
                                   procedure.modifiers.includes('59') ||
                                   procedure.modifiers.includes('XU');

        if (!hasMultipleModifier) {
          warnings.push({
            code: 'MISSING_MULTIPLE_PROCEDURE_MODIFIER',
            field: `serviceLines[${procedure.lineNumber}].modifiers`,
            message: `Secondary surgical procedure ${procedure.procedureCode} may require multiple procedure modifier (51, 59, or XU)`,
            impact: 'REDUCED_PAYMENT'
          });
        }
      }

      // Check for staged procedures
      const hasStagedModifier = surgicalProcedures.some(proc =>
        proc.modifiers.includes('58')
      );

      if (hasStagedModifier) {
        reasons.push('Staged procedure modifier (58) detected - ensure appropriate documentation');
      }

      reasons.push(`Multiple procedure rules validated for ${surgicalProcedures.length} procedures`);
    }
  }

  private async validateAssistantSurgeonBilling(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const assistantModifiers = new Set(['80', '81', '82', 'AS']);
      const hasAssistantModifier = line.modifiers.some(mod =>
        assistantModifiers.has(mod)
      );

      if (hasAssistantModifier) {
        // Validate that procedure allows assistant surgeon
        if (!this.allowsAssistantSurgeon(line.procedureCode)) {
          errors.push({
            code: 'ASSISTANT_NOT_ALLOWED',
            severity: 'HIGH',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Procedure ${line.procedureCode} does not typically allow assistant surgeon billing`,
            suggestedFix: 'Remove assistant surgeon modifier or verify procedure complexity'
          });
        }

        // Validate assistant surgeon documentation
        if (!this.hasAssistantSurgeonDocumentation(data)) {
          warnings.push({
            code: 'MISSING_ASSISTANT_DOCUMENTATION',
            field: 'supportingDocuments',
            message: 'Assistant surgeon billing requires documentation of medical necessity',
            impact: 'AUDIT_RISK'
          });
        }

        // Check for conflicting assistant modifiers
        const assistantModifiersUsed = line.modifiers.filter(mod =>
          assistantModifiers.has(mod)
        );

        if (assistantModifiersUsed.length > 1) {
          errors.push({
            code: 'MULTIPLE_ASSISTANT_MODIFIERS',
            severity: 'HIGH',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: 'Cannot use multiple assistant surgeon modifiers on same line',
            suggestedFix: 'Use only one appropriate assistant surgeon modifier'
          });
        }

        reasons.push(`Assistant surgeon billing validated for ${line.procedureCode}`);
      }
    }
  }

  private async validateBilateralProcedures(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    for (const line of data.serviceLines) {
      const hasBilateralModifier = line.modifiers.includes('50');
      const hasLateralityModifiers = line.modifiers.includes('RT') || line.modifiers.includes('LT');

      if (hasBilateralModifier && hasLateralityModifiers) {
        errors.push({
          code: 'CONFLICTING_BILATERAL_MODIFIERS',
          severity: 'HIGH',
          field: `serviceLines[${line.lineNumber}].modifiers`,
          message: 'Cannot use bilateral modifier (50) with laterality modifiers (RT/LT)',
          suggestedFix: 'Use either bilateral modifier (50) or separate lines with laterality modifiers'
        });
      }

      if (hasBilateralModifier) {
        // Validate that procedure can be performed bilaterally
        if (!this.canBePerformedBilaterally(line.procedureCode)) {
          errors.push({
            code: 'INVALID_BILATERAL_PROCEDURE',
            severity: 'HIGH',
            field: `serviceLines[${line.lineNumber}].modifiers`,
            message: `Procedure ${line.procedureCode} cannot be performed bilaterally`,
            suggestedFix: 'Remove bilateral modifier or use appropriate procedure code'
          });
        }

        // Check units for bilateral procedures
        if (line.units !== 1) {
          warnings.push({
            code: 'BILATERAL_UNITS_QUESTION',
            field: `serviceLines[${line.lineNumber}].units`,
            message: 'Bilateral procedures typically billed with 1 unit and modifier 50',
            impact: 'AUDIT_RISK'
          });
        }

        reasons.push(`Bilateral procedure billing validated for ${line.procedureCode}`);
      }
    }
  }

  private async validateSurgicalPlaceOfService(
    data: ClaimData,
    errors: ClaimValidationError[],
    warnings: ClaimValidationWarning[],
    reasons: string[]
  ): Promise<void> {
    const surgicalProcedures = data.serviceLines.filter(line =>
      this.isSurgicalProcedure(line.procedureCode)
    );

    if (surgicalProcedures.length > 0) {
      if (!this.isValidSurgicalPlaceOfService(data.placeOfService)) {
        warnings.push({
          code: 'UNUSUAL_SURGICAL_POS',
          field: 'placeOfService',
          message: `Unusual place of service (${data.placeOfService}) for surgical procedures`,
          impact: 'AUDIT_RISK'
        });
      }

      // Check for office-based surgery requirements
      if (data.placeOfService === '11') { // Office
        const hasOfficeBasedProcedures = surgicalProcedures.some(proc =>
          this.isOfficeBasedProcedure(proc.procedureCode)
        );

        if (!hasOfficeBasedProcedures) {
          warnings.push({
            code: 'OFFICE_SURGERY_QUESTION',
            field: 'placeOfService',
            message: 'Major surgical procedures in office setting may require additional documentation',
            impact: 'AUDIT_RISK'
          });
        }
      }

      reasons.push(`Surgical place of service validated`);
    }
  }

  protected getSpecialtySpecificDocuments(data: ClaimData, baseDocuments: string[]): string[] {
    const documents = [...baseDocuments];

    // Add surgery-specific documents
    const surgicalProcedures = data.serviceLines.filter(line =>
      this.isSurgicalProcedure(line.procedureCode)
    );

    if (surgicalProcedures.length > 0) {
      documents.push(
        'operative_report',
        'anesthesia_record',
        'pathology_report' // If applicable
      );

      // Add pre-operative documents for major surgery
      const hasMajorSurgery = surgicalProcedures.some(proc =>
        this.isMajorSurgery(proc.procedureCode)
      );

      if (hasMajorSurgery) {
        documents.push(
          'preoperative_clearance',
          'informed_consent',
          'surgical_plan'
        );
      }

      // Add assistant surgeon documentation if applicable
      const hasAssistantSurgeon = surgicalProcedures.some(proc =>
        proc.modifiers.some(mod => ['80', '81', '82', 'AS'].includes(mod))
      );

      if (hasAssistantSurgeon) {
        documents.push('assistant_surgeon_justification');
      }

      // Add implant documentation if applicable
      const hasImplantProcedure = surgicalProcedures.some(proc =>
        this.isImplantProcedure(proc.procedureCode)
      );

      if (hasImplantProcedure) {
        documents.push(
          'implant_documentation',
          'device_serial_numbers'
        );
      }
    }

    return documents;
  }

  // Utility methods specific to surgery
  private isSurgicalProcedure(procedureCode: string): boolean {
    const code = Number.parseInt(procedureCode);

    // CPT surgery codes typically fall in these ranges
    return (code >= 10021 && code <= 69990) && // Surgery section
           !(code >= 70010 && code <= 79999) && // Exclude radiology
           !(code >= 80047 && code <= 89398) && // Exclude pathology/lab
           !(code >= 90281 && code <= 99607);   // Exclude medicine
  }

  private isMajorSurgery(procedureCode: string): boolean {
    // Procedures typically considered major surgery
    const majorSurgeryCodes = [
      '27447', '27130', // Joint replacements
      '19301', '19302', // Mastectomy
      '47562', '47563', // Cholecystectomy
      '43770', '43775', // Bariatric surgery
      '44970', '44979', // Appendectomy
      '33533', '33534', // Coronary artery bypass
      '47135', '47136'  // Liver transplant
    ];

    return majorSurgeryCodes.includes(procedureCode) ||
           this.config.globalPeriodRules?.[procedureCode] === 90;
  }

  private requiresPreOpClearance(procedureCode: string): boolean {
    return this.isMajorSurgery(procedureCode);
  }

  private requiresOperativeReport(procedureCode: string): boolean {
    return this.isSurgicalProcedure(procedureCode) &&
           Number.parseInt(procedureCode) >= 10000; // Most surgical procedures
  }

  private hasPreOpClearance(data: ClaimData): boolean {
    return data.supportingDocuments.includes('preoperative_clearance') ||
           data.supportingDocuments.includes('medical_clearance');
  }

  private hasOperativeReport(data: ClaimData): boolean {
    return data.supportingDocuments.includes('operative_report') ||
           data.supportingDocuments.includes('surgical_report');
  }

  private hasAssistantSurgeonDocumentation(data: ClaimData): boolean {
    return data.supportingDocuments.includes('assistant_surgeon_justification') ||
           data.supportingDocuments.includes('surgical_complexity_documentation');
  }

  private diagnosisSupportsSurgery(diagnosisCodes: string[], procedureCode: string): boolean {
    const comprehensiveGuidelines = this.getSurgicalDiagnosisGuidelines();
    const guidelines = comprehensiveGuidelines[procedureCode];

    if (!guidelines) {
      // For unlisted procedures, check general surgical indicators
      return this.hasGeneralSurgicalIndications(diagnosisCodes, procedureCode);
    }

    // Check if any diagnosis code matches the required, preferred, or acceptable criteria
    const hasRequired = !guidelines.required ||
      diagnosisCodes.some(dx => guidelines.required?.some(req => dx.startsWith(req)));

    const hasPreferred = !guidelines.preferred ||
      diagnosisCodes.some(dx => guidelines.preferred?.some(pref => dx.startsWith(pref)));

    const hasContraindicated = guidelines.contraindicated &&
      diagnosisCodes.some(dx => guidelines.contraindicated?.some(contra => dx.startsWith(contra)));

    // Must have required diagnoses and cannot have contraindicated diagnoses
    // Preferred diagnoses improve validation confidence but aren't strictly required
    return hasRequired && !hasContraindicated && (hasPreferred || !guidelines.preferred);
  }

  private getSurgicalDiagnosisGuidelines(): Record<string, {
    required?: string[];
    preferred?: string[];
    acceptable?: string[];
    contraindicated?: string[];
    notes?: string;
  }> {
    return {
      // Orthopedic Procedures
      '27447': { // Total knee arthroplasty
        required: ['M17'], // Osteoarthritis of knee
        preferred: ['M17.1', 'M17.9'], // Primary/unspecified osteoarthritis
        acceptable: ['S82', 'M23', 'M22'], // Fractures, internal derangements
        contraindicated: ['M00', 'M01'], // Infectious arthritis
        notes: 'Requires documented conservative treatment failure'
      },
      '27130': { // Total hip arthroplasty
        required: ['M16'], // Osteoarthritis of hip
        preferred: ['M16.1', 'M16.9'], // Primary/unspecified osteoarthritis
        acceptable: ['S72', 'M87'], // Fractures, osteonecrosis
        contraindicated: ['M00', 'M01'], // Infectious arthritis
      },
      '23472': { // Total shoulder arthroplasty
        required: ['M19.01', 'M87.01'], // Osteoarthritis/osteonecrosis of shoulder
        acceptable: ['S42.2', 'M75'], // Proximal humerus fracture, shoulder lesions
        contraindicated: ['M00.01'], // Infectious arthritis of shoulder
      },

      // General Surgery Procedures
      '47562': { // Laparoscopic cholecystectomy
        required: ['K80', 'K81'], // Cholelithiasis, cholecystitis
        acceptable: ['K87', 'K82'], // Other gallbladder disorders, obstruction
        contraindicated: ['K83.0'], // Cholangitis (may require open approach)
      },
      '47563': { // Laparoscopic cholecystectomy with cholangiography
        required: ['K80', 'K81'],
        acceptable: ['K87', 'K82', 'K83.1'], // Include biliary obstruction
      },
      '44970': { // Laparoscopic appendectomy
        required: ['K35', 'K36', 'K37'], // Acute appendicitis
        contraindicated: ['K38'], // Other appendiceal diseases without acute inflammation
      },
      '49650': { // Laparoscopic inguinal hernia repair
        required: ['K40'], // Inguinal hernia
        acceptable: ['K41'], // Femoral hernia
      },

      // Cardiovascular Surgery
      '33533': { // Coronary artery bypass, single graft
        required: ['I25.1'], // Atherosclerotic heart disease
        acceptable: ['I21', 'I22'], // Acute MI
        contraindicated: ['I25.83'], // Coronary microvascular dysfunction
      },
      '33534': { // Coronary artery bypass, two grafts
        required: ['I25.1'],
        preferred: ['I25.10'], // Multi-vessel disease
      },

      // Neurosurgery
      '61510': { // Craniectomy for tumor
        required: ['C71', 'D33'], // Brain tumor
        acceptable: ['G93.1'], // Anoxic brain damage
      },
      '63030': { // Laminectomy, lumbar
        required: ['M48.0', 'M99.3'], // Spinal stenosis
        acceptable: ['M51.1'], // Lumbar disc disorders with radiculopathy
        contraindicated: ['M54.5'], // Low back pain without radiculopathy
      },

      // Plastic Surgery
      '19318': { // Reduction mammaplasty
        required: ['N62'], // Hypertrophy of breast
        acceptable: ['M79.3'], // Panniculitis (for associated symptoms)
        notes: 'Requires documentation of symptoms and conservative treatment failure'
      },
      '15734': { // Muscle/fascia flap, trunk
        required: ['L89', 'T81.3'], // Pressure ulcer, wound dehiscence
        acceptable: ['L97'], // Non-pressure chronic ulcer
      },

      // Urological Surgery
      '55866': { // Laparoscopic radical prostatectomy
        required: ['C61'], // Malignant neoplasm of prostate
        acceptable: ['N40'], // Enlarged prostate (in specific cases)
      },
      '50545': { // Laparoscopic radical nephrectomy
        required: ['C64'], // Malignant neoplasm of kidney
        acceptable: ['N28.1'], // Cyst of kidney (large/complex)
      },

      // ENT Surgery
      '31575': { // Laryngoscopy, flexible
        required: ['J38'], // Diseases of vocal cords
        acceptable: ['R06.02'], // Shortness of breath
      },
      '30520': { // Septoplasty
        required: ['J34.2'], // Deviated nasal septum
        contraindicated: ['J30'], // Allergic rhinitis (primary indication)
      },

      // Ophthalmology
      '66984': { // Cataract extraction with IOL
        required: ['H25', 'H26'], // Cataract
        notes: 'Must document visual impairment affecting daily activities'
      },
      '67028': { // Vitrectomy
        required: ['H43.1'], // Vitreous hemorrhage
        acceptable: ['H33', 'H35.3'], // Retinal detachment, macular degeneration
      }
    };
  }

  private hasGeneralSurgicalIndications(diagnosisCodes: string[], procedureCode: string): boolean {
    // General surgical indication patterns
    const traumaticInjuries = diagnosisCodes.some(dx =>
      dx.startsWith('S') || dx.startsWith('T'));

    const malignantNeoplasms = diagnosisCodes.some(dx =>
      dx.startsWith('C'));

    const severeInflammation = diagnosisCodes.some(dx =>
      dx.includes('.0') && (dx.startsWith('K') || dx.startsWith('N')));

    // Most surgical procedures are justified by trauma, cancer, or severe inflammation
    if (traumaticInjuries || malignantNeoplasms || severeInflammation) {
      return true;
    }

    // Emergency procedures (often justified by broader criteria)
    if (this.isEmergencyProcedure(procedureCode)) {
      return true;
    }

    // Elective procedures require more specific indications
    return false;
  }

  private isEmergencyProcedure(procedureCode: string): boolean {
    const emergencyProcedures = [
      '44970', // Appendectomy
      '47562', // Emergency cholecystectomy
      '35221', // Vascular repair
      '61154', // Emergency craniotomy
    ];

    return emergencyProcedures.includes(procedureCode);
  }

  private allowsAssistantSurgeon(procedureCode: string): boolean {
    // Most major surgical procedures allow assistant surgeon
    // Some procedures specifically prohibit it
    const prohibitedAssistantCodes = [
      '64483', // Injection procedures
      '11401', // Simple excisions
      '12031'  // Simple repairs
    ];

    return !prohibitedAssistantCodes.includes(procedureCode) &&
           this.isMajorSurgery(procedureCode);
  }

  private canBePerformedBilaterally(procedureCode: string): boolean {
    // Procedures that can be performed on paired organs/structures
    const bilateralProcedures = [
      '19301', '19302', // Mastectomy
      '27447', // Knee replacement (can do both knees)
      '27130', // Hip replacement (can do both hips)
      '64483', // Bilateral injections
      '11401'  // Bilateral excisions
    ];

    return bilateralProcedures.includes(procedureCode);
  }

  private isValidSurgicalPlaceOfService(placeOfService: string): boolean {
    // Valid places of service for surgical procedures
    const validSurgicalPOS = [
      '11', // Office (for minor procedures)
      '22', // Outpatient hospital
      '24', // Ambulatory surgical center
      '21', // Inpatient hospital
      '23'  // Emergency room
    ];

    return validSurgicalPOS.includes(placeOfService);
  }

  private isOfficeBasedProcedure(procedureCode: string): boolean {
    // Procedures commonly performed in office
    const officeProcedures = [
      '11401', '11402', '11403', // Excision of benign lesions
      '12031', '12032', '12034', // Intermediate repairs
      '64483', '64484', // Injection procedures
      '17000', '17003', '17004'  // Destruction of lesions
    ];

    return officeProcedures.includes(procedureCode);
  }

  private isImplantProcedure(procedureCode: string): boolean {
    // Procedures involving implants
    const implantProcedures = [
      '27447', '27130', // Joint replacements
      '33249', '33225', // Pacemaker insertion
      '19340', '19342', // Breast implant
      '64590'  // Spinal cord stimulator
    ];

    return implantProcedures.includes(procedureCode);
  }
}
