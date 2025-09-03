import { Database } from '@/types/database.types';

export type DosespotDiagnosis = {
  DiagnosisId: number;
  DiagnosisCode: string;
  DiagnosisDescription: string;
};

export type DosespotResult = {
  ResultCode: string;
  ResultDescription: string;
};

export type DosespotPageResult = {
  CurrentPage: number;
  TotalPages: number;
  PageSize: number;
  TotalCount: number;
  HasPrevious: boolean;
  HasNext: boolean;
};

export type DosespotPrescriptionDiagnosis = {
  PrimaryDiagnosis: DosespotDiagnosis;
  SecondaryDiagnosis: DosespotDiagnosis;
};

export type PrescriberNotificationCountsData = {
  ClinicianId: number;
  ClinicId: number;
  PendingPrescriptionCount: number;
  TransmissionErrorCount: number;
  RefillRequestCount: number;
  ChangeRequestCount: number;
  Total: {
    PendingPrescriptionCount: number;
    TransmissionErrorCount: number;
    RefillRequestCount: number;
    ChangeRequestCount: number;
  };
};

export type Patient = Pick<
  Database['public']['Tables']['patient']['Row'],
  'id'
>;

export type DosespotPharmacy = {
  PharmacyId: number;
  StoreName: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  PrimaryPhone: string;
  PrimaryPhoneType: number;
  PrimaryFax: string;
  PhoneAdditional1: string | null;
  PhoneAdditionalType1: number;
  PhoneAdditional2: string | null;
  PhoneAdditionalType2: number;
  PhoneAdditional3: string | null;
  PhoneAdditionalType3: number;
  PharmacySpecialties: string[];
  ServiceLevel: number;
  Latitude: number;
  Longitude: number;
  NCPDPID: string;
};

export type DosespotMedication = {
  DispensableDrugId: number;
  RoutedDoseFormDrugId: number;
  NDC: string;
  RXCUI: number;
  NameWithRouteDoseForm: string;
  Strength: string;
  IsObsolete: boolean;
};

export type DosespotSupply = {
  SupplyId: number;
  NDC: string;
  UPC: string;
  Name: string;
  OTC: boolean;
  IsObsolete: boolean;
};

export type DosespotSupplyResponse = {
  Items: DosespotSupply[];
  Result: DosespotResult;
};

export type PatientPharmacy = DosespotPharmacy & {
  IsDefault: boolean;
  IsPreferred: boolean;
};

export type DosespotPharmacyInformationResponse = {
  Item: DosespotPharmacy;
  Result: DosespotResult;
};

export type DosespotPrescription = {
  PrescriptionId: number; //*
  WrittenDate: string; //*
  Directions: string; //*
  Quantity: string; //*
  DispenseUnitId: number; //*
  DispenseUnitDescription?: string; //*
  Refills: string; //*
  DaysSupply: number; //*
  PharmacyId: number; //*
  PharmacyNotes: string;
  NoSubstitutions: false;
  EffectiveDate: string;
  LastFillDate: string | null;
  PrescriberId: number; //*
  PrescriberAgentId: number | null;
  RxReferenceNumber: number | null;
  Status: string; //*
  Formulary: boolean;
  EligibilityId: number; //*
  Type: number;
  NonDoseSpotPrescriptionId: number | null;
  ErrorIgnored: boolean;
  SupplyId: number | null;
  CompoundId: number | null;
  FreeTextType: string | null;
  ClinicId: number; //*
  SupervisorId: number | null;
  IsUrgent: boolean;
  IsRxRenewal: boolean;
  RxRenewalNote: string | null;
  FirstPrescriptionDiagnosis: DosespotPrescriptionDiagnosis | null;
  SecondPrescriptionDiagnosis: DosespotPrescriptionDiagnosis | null;
  PatientMedicationId: number;
  MedicationStatus: number;
  Comment: string | null;
  DateInactive: string | null;
  Encounter: string | null;
  DoseForm: string; //*
  Route: string; //*
  Strength: string; //*
  GenericProductName: string; //*
  GenericDrugName: string; //*
  LexiGenProductId: number;
  LexiDrugSynId: number;
  LexiSynonymTypeId: number;
  LexiGenDrugId: string;
  RxCUI: string;
  OTC: boolean;
  NDC: string; //*
  MonographPath: string;
  DrugClassification: string;
  StateSchedules: string | null;
  Brand: boolean;
  CompoundIngredients: null;
  DispensableDrugId: number;
  DisplayName: string;
  Schedule: string;
};

export type DosespotPrescriptionsResponse = {
  Items: DosespotPrescription[];
  PageResult: DosespotPageResult;
  Result: DosespotResult;
};

export type Clinician = Pick<
  Database['public']['Tables']['clinician']['Row'],
  'id' | 'npi_key'
>;

export type MedicationQuantity = Pick<
  Database['public']['Tables']['medication_quantity']['Row'],
  'id' | 'price'
> & {
  medication_dosage: Pick<
    Database['public']['Tables']['medication_dosage']['Row'],
    'dosespot_ndc' | 'national_drug_code'
  >;
  quantity: Pick<Database['public']['Tables']['quantity']['Row'], 'quantity'>;
};

export type PrescriptionResultData = {
  PatientId: number;
  ClinicId: number;
  ClinicianId: number;
  PrescriptionId: number;
  RelatedRxRequestQueueItemId: number | null;
  RelatedRxChangeQueueItemId: number | null;
  PrescriptionStatus: number;
  StatusDateTime: string;
  StatusDetails: string;
  AgentId: number | null;
};

export type DosespotPatient = {
  Active: boolean;
  Address1: string;
  Address2: null;
  City: string;
  DateOfBirth: string;
  Email: null;
  Encounter: null;
  FirstName: string;
  Gender: string;
  Height: null;
  HeightMetric: number;
  IsHospice: boolean;
  LastName: string;
  MiddleName: null;
  NonDoseSpotMedicalRecordNumber: null;
  PatientId: number;
  PhoneAdditional1: null;
  PhoneAdditional2: null;
  PhoneAdditionalType1: string;
  PhoneAdditionalType2: string;
  Prefix: null;
  PrimaryPhone: null;
  PrimaryPhoneType: string;
  State: string;
  Suffix: null;
  Weight: null;
  WeightMetric: number;
  ZipCode: string;
};

export type DosespotRxRequest = {
  RxChangeRequestId: number;
  RxChangeType: string;
  RxChangeSubType: null;
  NewPatient: boolean;
  Patient: DosespotPatient;
  UnmatchedChange: boolean;
  PrescribedPrescriptionId: number;
  RequestedMedications: number[];
  ClinicianId: number;
  ClinicId: number;
  PharmacyId: number;
  RequestedDate: string;
  OriginalPrescriptionId: number;
  PayerName: string;
  DrugUseEvaluations: [];
};

export type DetailedDosespotRxRequest = {
  RxChangeRequestId: number;
  RxChangeType: string;
  RxChangeSubType: null;
  NewPatient: boolean;
  Patient: DosespotPatient;
  UnmatchedChange: boolean;
  PrescribedPrescriptionId: number;
  PrescribedMedication: DosespotPrescription;
  RequestedMedications: DosespotPrescription[];
  ClinicianId: number;
  ClinicId: number;
  PharmacyId: number;
  RequestedDate: string;
  OriginalPrescriptionId: number;
  PayerName: string;
};

export type DosespotRxRequestsResponse = {
  Items: DosespotRxRequest[];
  PageResult: DosespotPageResult;
  Result: DosespotResult;
};

export type DosespotNotificationsResponse = {
  RefillRequestsCount: number;
  TransactionErrorsCount: number;
  PendingPrescriptionsCount: number;
  PendingRxChangeCount: number;
  Result: DosespotResult;
};

export type DosespotTransmissionError = {
  DateWritten: string;
  ErrorDateTimeStamp: string;
  ErrorDetails: string;
  PatientId: number;
  PrescriptionId: number;
};

export type DetailedDosespotTransmissionError = {
  Prescription: DosespotPrescription;
  DateWritten: string;
  ErrorDateTimeStamp: string;
  ErrorDetails: string;
  PatientId: number;
  PrescriptionId: number;
};

export type DosespotTransmissionErrorResponse = {
  Items: DosespotTransmissionError[];
  PageResult: DosespotPageResult;
  Result: DosespotResult;
};

export type DosespotPrescriptionByIdResponse = {
  Prescription: DosespotPrescription;
  Result: DosespotResult;
};

export type PrescriptionIgnoreError = {
  dosespotPatientId: number;
  dosespotPrescriptionId: number;
};

export type PrescriptionIgnoreErrorsPayload = {
  errors: PrescriptionIgnoreError[];
  dosespotProviderId: number;
};

export type DosespotClinician = {
  ClinicianId: number;
  Prefix: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Suffix: string;
  DateOfBirth: string;
  Email: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  PrimaryPhone: string;
  PrimaryPhoneType: string;
  PrimaryFax: string;
  PhoneAdditional1: string;
  PhoneAdditionalType1: string;
  PhoneAdditional2: string;
  PhoneAdditionalType2: string;
  PhoneAdditional3: string;
  PhoneAdditionalType3: string;
  DEANumbers: [
    {
      DEANumber: string;
      State: string;
      ClinicId: string;
    }
  ];
  DEANumber: string;
  NADEANumbers: [
    {
      NADEANumber: string;
      State: string;
      ClinicId: string;
    }
  ];
  MedicalLicenseNumbers: [
    {
      LicenseNumber: string;
      State: string;
      ClinicId: string;
    }
  ];
  NPINumber: string;
  Roles: string[];
  PDMPRoleType: string;
  SpecialtyTypeId: number;
  Confirmed: boolean;
  Active: boolean;
  AccountLocked: boolean;
  EpcsRequested: boolean;
  ClinicInfo: [
    {
      ClinicId: number;
      HasNewRx: boolean;
      HasRefills: boolean;
      HasRxChange: boolean;
      HasCancel: boolean;
      HasRxFill: boolean;
      HasEpcs: boolean;
    }
  ];
};

export type DosespotClinicianInformationResponse = {
  Item: DosespotClinician;
  Result: DosespotResult;
};

export type PAStatusUpdateEventData = {
  PriorAuthorizationCaseId: number;
  ClinicId: number;
  PatientId: number;
  PrescriptionId: number;
  PrescriberId: number;
  PharmacyId: number;
  PriorAuthorizationCaseStatus: string;
  StatusDateTime: string;
};

export type DosespotPriorAuth = {
  PriorAuthorizationCaseId: number;
  PrescriptionId: number;
  CaseAlias: string;
  Note: string;
  IsOffline: boolean;
  InitializedDate: string;
  NextResponseDeadline: string;
  CurrentStatus: string;
  CurrentStatusDate: string;
  ExpectedResponseDate: string;
  AttachmentRequired: boolean;
  NextQuestionId: number;
  IsExpedited: boolean;
  FinalStatus: {
    PriorAuthorizationStatusType: string;
    ClosedReasonCodeId: string;
    AuthorizationNumber: string;
    AuthorizationPeriodStart: string;
    AuthorizationPeriodEnd: string;
    PharmacyType: string;
    Quantity: string;
    DaysSupply: string;
    NumberOfCycles: string;
    NumberOfRefills: string;
    Note: string;
    CanAppeal: boolean;
  };
  AppealDetails: {
    AppealCaseId: string;
    NotesForAppeal: string;
    AppealReason: string;
  };
  CancelDetails: {
    CancelReason: string;
  };
  Attachments: [
    {
      AttachmentId: number;
      CreatedDateStamp: string;
      FileName: string;
      IsOutbound: boolean;
    }
  ];
};

export type DosespotPatientEligibility = {
  PatientEligibilityId: 0;
  PayerName: string;
  PharmacyEligibilities: [
    {
      PharmacyType: string;
      EligibilityStatus: string;
      Name: string;
    }
  ];
  PlanName: string;
  CoverageId: string;
  PayerId: string;
  BIN: string;
  PCN: string;
  FormularyId: string;
  AlternativesId: string;
  CopayId: string;
  DemographicChanges: true;
  Demographics: {
    LastName: string;
    FirstName: string;
    MiddleName: string;
    Suffix: string;
    DateOfBirth: string;
    Gender: string;
    Address: {
      AddressLine1: string;
      AddressLine2: string;
      City: string;
      State: string;
      ZipCode: string;
    };
  };
  ErrorMessage: string;
  InfoMessage: string;
  MemberId: string;
};

export type DosespotPatientEligibilityResponse = {
  Items: DosespotPatientEligibility[];
  Result: DosespotResult;
};

export type DosespotPricingCoverage = {
  DrugStatusCode: string;
  DrugStatus: string;
  QuantityPricedValue: string;
  QuantityPricedCodeListQualifier: string;
  QuantityPricedUnitOfMeasureType: string;
  QuantityPricedUnitOfMeasureTypeId: number;
  DaysSupplyPriced: string;
  PlanPayAmount: string;
  EstimatedPatientPayAmount: string;
  OOPAppliedAmount: string;
  OOPRemainingAmount: string;
  DeductibleAppliedAmount: string;
  DeductibleRemainingAmount: string;
  CoverageAlerts: [
    {
      ReferenceCode: string;
      ReferenceText: string;
    }
  ];
  FormularyStatus: string;
  PriorAuthRequired: boolean;
};

export type DosespotCopay = {
  IsDrugSpecific: boolean;
  PharmacyType: string;
  FlatCopayAmount: number;
  PercentCopayAmount: number;
  FlatCopayAmountFirst: boolean;
  MinimumCopayAmount: number;
  MaximumCopayAmount: number;
  DaysSupply: number;
  CopayTier: number;
  MaximumCopayTier: number;
  OutOfPocketMinimum: number;
  OutOfPocketMaximum: number;
};

export type DosespotAgeLimitRestriction = {
  MinimumAge: number;
  MinimumAgeUnit: string;
  MaximumAge: number;
  MaximumAgeUnit: string;
};

export type DosespotQuantityLimitRestriction = {
  MaximumAmount: number;
  AmountUnit: string;
  TimePeriodUnit: string;
  StartDate: string;
  EndDate: string;
  MaximumTimePeriodUnits: number;
};

export type DosespotStepMedicationRestriction = {
  Ndc: string;
  StepDrugType: string;
  StepOrder: number;
  DisplayName: string;
  RxCUI: number;
  DispensableDrugId: number;
};

export type DosespotPrescriptionLog = {
  Status: string;
  DateTimeStamp: string;
  AdditionalInfo: string;
  Ignored: boolean;
  User: string;
  WasRefillRequest: boolean;
  MedicationStatus: string;
};

export type DosespotCoverageRestrictions = {
  IsExcluded: boolean;
  HasMedicalNecessity: boolean;
  HasPriorAuthorization: boolean;
  HasStepTherapy: boolean;
  HasQuantityLimit: boolean;
  HasAgeLimit: boolean;
  AgeLimitRestrictions: DosespotAgeLimitRestriction[];
  GenderRestriction: string;
  QuantityLimitRestrictions: DosespotQuantityLimitRestriction[];
  StepMedicationRestrictions: DosespotStepMedicationRestriction[];
  Messages: [
    {
      Message: string;
      LongMessage: string;
    }
  ];
  DrugResources: [
    {
      Url: string;
      ResourceType: string;
    }
  ];
  SummaryResources: [
    {
      Url: string;
      ResourceType: string;
    }
  ];
};

export type DosespotTherapeuticAlternative = {
  Ndc: string;
  FormularyStatus: string;
  Copay: DosespotCopay;
  DisplayName: string;
  FormularyInfo: {
    ProductId: number;
    Ndc: string;
    FormularyStatusId: number;
    FormularyAbbreviation: string;
    FormularyStatusMessage: string;
    OrderRank: number;
    IsGeneric: boolean;
    IsRx: boolean;
  };
  FullDisplayString: string;
  DisplayStrength: string;
  DefaultDispenseUnitID: number;
  DispensableDrugId: number;
  Schedule: number;
  IsDetox: boolean;
  HasGHB: boolean;
  RxCUI: number;
};

export type DosespotInsuranceCoverageAlternative = {
  Ndc: string;
  DisplayName: string;
  RxCUI: number;
  DispensableDrugId: number;
  Brand: boolean;
  Otc: boolean;
  Details: [
    {
      PatientSpecificPricingCoverages: [
        {
          Pharmacy: DosespotPharmacy;
          PricingCoverage: DosespotPricingCoverage;
        }
      ];
      Ndc: string;
      DisplayName: string;
      RxCUI: number;
      DispensableDrugId: number;
      Coverage: {
        FormularyStatus: string;
        Copays: DosespotCopay[];
        Alternatives: [
          {
            Ndc: string;
            Details: [
              {
                Ndc: string;
                Coverage: object;
              }
            ];
          }
        ];
        Restrictions: DosespotCoverageRestrictions;
      };
    }
  ];
  RepresentativeFormularyCoverage: {
    CopayFactors: DosespotCopay[];
    FormularyStatus: string;
    FormularyStatusText: string;
    RealTimeFormularyCoverageRestrictions: {
      HasCoverageRestrictions: boolean;
      IsExcluded: boolean;
      HasMedicalNecessity: boolean;
      HasPriorAuthorization: boolean;
      HasStepTherapy: boolean;
      AgeLimitRestrictions: DosespotAgeLimitRestriction[];
      GenderLimitRestrictions: [
        {
          GenderAbbreviation: string;
          GenderDescription: string;
        }
      ];
      QuantityLimitRestrictions: DosespotQuantityLimitRestriction[];
      StepMedicationRestrictions: DosespotStepMedicationRestriction[];
      Messages: [
        {
          Message: string;
          LongMessage: string;
        }
      ];
      DrugResources: [
        {
          Url: string;
          ResourceType: string;
        }
      ];
      SummaryResources: [
        {
          Url: string;
          ResourceType: string;
        }
      ];
    };
  };
  PatientSpecificPricingCoverages: [
    {
      Pharmacy: DosespotPharmacy;
      PricingCoverage: DosespotPricingCoverage;
    }
  ];
};

export type DosespotPatientInsuranceCoverage = {
  FormularyStatus: string;
  Brand: boolean;
  Otc: boolean;
  Copays: DosespotCopay[];
  Alternatives: DosespotInsuranceCoverageAlternative[];
  TherapeuticAlternatives: DosespotTherapeuticAlternative[];
  Restrictions: DosespotCoverageRestrictions;
  RealTimeFormularyRequestStatus: number;
};

export type DosespotPatientInsuranceCoverageResponse = {
  Item: DosespotPatientInsuranceCoverage;
  Result: DosespotResult;
};

export enum DosespotDenyReason {
  DeniedPatientUnknown = 4,
  DeniedPatientNotUnderCare = 5,
  DeniedPatientNoLongerUnderPatientCare = 6,
  DeniedTooSoon = 7,
  DeniedNeverPrescribed = 8,
  DeniedHavePatientContact = 9,
  DeniedChangeInappropriate = 14,
  DeniedNeedAppointment = 15,
  DeniedPrescriberNotAssociateWithLocation = 16,
  DeniedNoPriorAuthAttempt = 17,
  DeniedAlreadyHandled = 18,
  DeniedAtPatientRequest = 21,
  DeniedPatientAllergicToRequestMed = 22,
  DeniedMedicationDiscontinued = 23,
}

export type DosespotLegalAgreement = {
  AgreementDate: string | null;
  AgreementId: number;
  AgreementText: string;
};

export type DosespotInitiatePriorAuthResponse = {
  Id: number;
  Result: DosespotResult;
};

export type DosespotCreateClinicianResponse = {
  Id: number;
  Result: DosespotResult;
};

export type DosespotCreateCodedPrescriptionResponse = {
  Id: number;
  Result: DosespotResult;
};

export type DosespotSendPrescriptionsResponse = {
  Id: number;
  Result: DosespotResult;
}[];

export type DosespotAddClinicianToClinicResponse = {
  Id: number;
  Result: DosespotResult;
}[];

export type DosespotRemoveClinicianToClinicResponse = {
  Id: number;
  Result: DosespotResult;
};

export type DosespotPatientDemographicsResponse = {
  Item: DosespotPatient;
  Result: DosespotResult;
};

export type DosespotLegalAgreementsResponse = {
  Items: DosespotLegalAgreement[];
  Result: DosespotResult;
};

export type DosespotAcceptAgreementResponse = {
  AgreementId: number;
  NameSigned: string;
  Result: DosespotResult;
};

export type DosespotIDPDisclaimerResponse = {
  IdpDisclaimerDate: string | null;
  IdpDisclaimerId: number;
  IdpDisclaimerText: string;
  Result: DosespotResult;
};

export type DosespotIDPInitializeResponse = {
  SessionID: string;
  Questions: string[];
  Answers: string[][];
  OtpSent: true;
  IdpResultSummary: string | null;
  IDCapture: true;
  Result: DosespotResult;
};

export type DosespotPrescriptionLogsResponse = {
  Items: DosespotPrescriptionLog[];
  Result: DosespotResult;
};

export type DosespotPatientPharmacies = {
  Items: PatientPharmacy[];
  Result: DosespotResult;
};
