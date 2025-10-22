/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreatePatientInput = {
  mrn: string,
  firstName: string,
  lastName: string,
  email?: string | null,
  phone?: string | null,
  dateOfBirth: string,
  gender: Gender,
  organizationId: string,
};

// Enums
export enum Gender {
  M = "M",
  F = "F",
  O = "O",
  U = "U",
}


export type Patient = {
  __typename: "Patient",
  id: string,
  mrn: string,
  firstName: string,
  lastName: string,
  email?: string | null,
  phone?: string | null,
  dateOfBirth: string,
  gender: Gender,
  status: PatientStatus,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  claims:  Array<Claim >,
  appointments:  Array<Appointment >,
  insurancePolicies:  Array<InsurancePolicy >,
  priorAuths:  Array<PriorAuth >,
};

export enum PatientStatus {
  active = "active",
  inactive = "inactive",
  deceased = "deceased",
  merged = "merged",
  test = "test",
}


export type Claim = {
  __typename: "Claim",
  id: string,
  claimNumber: string,
  patientId: string,
  providerId: string,
  payerId: string,
  status: ClaimStatus,
  totalAmount: number,
  submittedDate?: string | null,
  processedDate?: string | null,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  patient: Patient,
  provider: Provider,
  payer: Payer,
  claimLines:  Array<ClaimLine >,
  remittanceAdvice:  Array<RemittanceAdvice >,
};

export enum ClaimStatus {
  draft = "draft",
  ready_for_submission = "ready_for_submission",
  submitted = "submitted",
  accepted = "accepted",
  rejected = "rejected",
  paid = "paid",
  denied = "denied",
  pending = "pending",
  needs_review = "needs_review",
  appeal_required = "appeal_required",
}


export type Provider = {
  __typename: "Provider",
  id: string,
  npi: string,
  firstName?: string | null,
  lastName?: string | null,
  organizationName?: string | null,
  taxonomy?: string | null,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
};

export type Payer = {
  __typename: "Payer",
  id: string,
  name: string,
  payerCode: string,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
};

export type ClaimLine = {
  __typename: "ClaimLine",
  id: string,
  claimId: string,
  cptCode: string,
  icd10Code?: string | null,
  units: number,
  chargeAmount: number,
  allowedAmount?: number | null,
  paidAmount?: number | null,
  adjustmentAmount?: number | null,
  status: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  claim: Claim,
};

export type RemittanceAdvice = {
  __typename: "RemittanceAdvice",
  id: string,
  claimId: string,
  eraNumber: string,
  paymentAmount: number,
  adjustmentAmount: number,
  paymentDate: string,
  status: EraStatus,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  claim: Claim,
};

export enum EraStatus {
  pending = "pending",
  processing = "processing",
  posted = "posted",
  failed = "failed",
  partial = "partial",
}


export type Appointment = {
  __typename: "Appointment",
  id: string,
  patientId: string,
  providerId: string,
  appointmentDate: string,
  duration: number,
  status: EncounterStatus,
  visitType: VisitType,
  notes?: string | null,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  patient: Patient,
  provider: Provider,
};

export enum EncounterStatus {
  scheduled = "scheduled",
  checked_in = "checked_in",
  in_progress = "in_progress",
  completed = "completed",
  cancelled = "cancelled",
  no_show = "no_show",
}


export enum VisitType {
  office_visit = "office_visit",
  telemedicine = "telemedicine",
  emergency = "emergency",
  inpatient = "inpatient",
  outpatient = "outpatient",
  consultation = "consultation",
  procedure = "procedure",
  follow_up = "follow_up",
  annual_physical = "annual_physical",
}


export type InsurancePolicy = {
  __typename: "InsurancePolicy",
  id: string,
  patientId: string,
  payerId: string,
  policyNumber: string,
  groupNumber?: string | null,
  subscriberId: string,
  subscriberName: string,
  effectiveDate: string,
  terminationDate?: string | null,
  isPrimary: boolean,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  patient: Patient,
  payer: Payer,
};

export type PriorAuth = {
  __typename: "PriorAuth",
  id: string,
  authNumber: string,
  patientId: string,
  providerId: string,
  payerId: string,
  status: PriorAuthStatus,
  requestedDate: string,
  approvedDate?: string | null,
  expirationDate?: string | null,
  notes?: string | null,
  organizationId: string,
  createdAt: string,
  updatedAt: string,
  // Relationships
  patient: Patient,
  provider: Provider,
  payer: Payer,
};

export enum PriorAuthStatus {
  pending = "pending",
  approved = "approved",
  denied = "denied",
  expired = "expired",
  cancelled = "cancelled",
}


export type UpdatePatientInput = {
  id: string,
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  phone?: string | null,
  status?: PatientStatus | null,
};

export type CreateClaimInput = {
  claimNumber: string,
  patientId: string,
  providerId: string,
  payerId: string,
  totalAmount: number,
  organizationId: string,
};

export type UpdateClaimStatusInput = {
  id: string,
  status: ClaimStatus,
  notes?: string | null,
};

export type CreatePriorAuthInput = {
  authNumber: string,
  patientId: string,
  providerId: string,
  payerId: string,
  requestedDate: string,
  organizationId: string,
};

export type UpdatePriorAuthStatusInput = {
  id: string,
  status: PriorAuthStatus,
  approvedDate?: string | null,
  expirationDate?: string | null,
  notes?: string | null,
};

export type PaginatedPatients = {
  __typename: "PaginatedPatients",
  items:  Array<Patient >,
  nextToken?: string | null,
  total?: number | null,
};

export type PaginatedClaims = {
  __typename: "PaginatedClaims",
  items:  Array<Claim >,
  nextToken?: string | null,
  total?: number | null,
};

export type PaginatedPriorAuths = {
  __typename: "PaginatedPriorAuths",
  items:  Array<PriorAuth >,
  nextToken?: string | null,
  total?: number | null,
};

export type Organization = {
  __typename: "Organization",
  id: string,
  name: string,
  taxId?: string | null,
  address?: string | null,
  phone?: string | null,
  email?: string | null,
  createdAt: string,
  updatedAt: string,
  // Relationships
  members:  Array<TeamMember >,
  patients:  Array<Patient >,
  claims:  Array<Claim >,
};

export type TeamMember = {
  __typename: "TeamMember",
  id: string,
  userId: string,
  organizationId: string,
  role: string,
  permissions: Array< string >,
  createdAt: string,
  updatedAt: string,
  // Relationships
  organization: Organization,
};

export type RealtimeMetrics = {
  __typename: "RealtimeMetrics",
  organizationId: string,
  activePAs: number,
  pendingClaims: number,
  ehrSyncStatus: string,
  healthLakeJobs:  Array<HealthLakeJob >,
  timestamp: string,
};

export type HealthLakeJob = {
  __typename: "HealthLakeJob",
  jobId: string,
  status: string,
  progress: number,
  createdAt: string,
  updatedAt: string,
};

export type CreatePatientMutationVariables = {
  input: CreatePatientInput,
};

export type CreatePatientMutation = {
  // Patient Mutations
  createPatient:  {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  },
};

export type UpdatePatientMutationVariables = {
  input: UpdatePatientInput,
};

export type UpdatePatientMutation = {
  updatePatient:  {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  },
};

export type DeletePatientMutationVariables = {
  id: string,
};

export type DeletePatientMutation = {
  deletePatient: boolean,
};

export type CreateClaimMutationVariables = {
  input: CreateClaimInput,
};

export type CreateClaimMutation = {
  // Claim Mutations
  createClaim:  {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  },
};

export type UpdateClaimStatusMutationVariables = {
  input: UpdateClaimStatusInput,
};

export type UpdateClaimStatusMutation = {
  updateClaimStatus:  {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  },
};

export type SubmitClaimMutationVariables = {
  id: string,
};

export type SubmitClaimMutation = {
  submitClaim:  {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  },
};

export type CreatePriorAuthMutationVariables = {
  input: CreatePriorAuthInput,
};

export type CreatePriorAuthMutation = {
  // Prior Auth Mutations
  createPriorAuth:  {
    __typename: "PriorAuth",
    id: string,
    authNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: PriorAuthStatus,
    requestedDate: string,
    approvedDate?: string | null,
    expirationDate?: string | null,
    notes?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
  },
};

export type UpdatePriorAuthStatusMutationVariables = {
  input: UpdatePriorAuthStatusInput,
};

export type UpdatePriorAuthStatusMutation = {
  updatePriorAuthStatus:  {
    __typename: "PriorAuth",
    id: string,
    authNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: PriorAuthStatus,
    requestedDate: string,
    approvedDate?: string | null,
    expirationDate?: string | null,
    notes?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
  },
};

export type BatchUpdateClaimStatusesMutationVariables = {
  claims: Array< UpdateClaimStatusInput >,
};

export type BatchUpdateClaimStatusesMutation = {
  // Bulk Operations
  batchUpdateClaimStatuses:  Array< {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } >,
};

export type BatchCreatePatientsMutationVariables = {
  patients: Array< CreatePatientInput >,
};

export type BatchCreatePatientsMutation = {
  batchCreatePatients:  Array< {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } >,
};

export type GetPatientQueryVariables = {
  id: string,
};

export type GetPatientQuery = {
  // Patient Queries
  getPatient?:  {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } | null,
};

export type ListPatientsByOrganizationQueryVariables = {
  organizationId: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPatientsByOrganizationQuery = {
  listPatientsByOrganization?:  {
    __typename: "PaginatedPatients",
    items:  Array< {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type SearchPatientsQueryVariables = {
  organizationId: string,
  searchTerm: string,
  limit?: number | null,
};

export type SearchPatientsQuery = {
  searchPatients:  Array< {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } >,
};

export type GetClaimQueryVariables = {
  id: string,
};

export type GetClaimQuery = {
  // Claim Queries
  getClaim?:  {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } | null,
};

export type ListClaimsByOrganizationQueryVariables = {
  organizationId: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListClaimsByOrganizationQuery = {
  listClaimsByOrganization?:  {
    __typename: "PaginatedClaims",
    items:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type ListClaimsByPatientQueryVariables = {
  patientId: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListClaimsByPatientQuery = {
  listClaimsByPatient?:  {
    __typename: "PaginatedClaims",
    items:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type ListClaimsByStatusQueryVariables = {
  organizationId: string,
  status: ClaimStatus,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListClaimsByStatusQuery = {
  listClaimsByStatus?:  {
    __typename: "PaginatedClaims",
    items:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type GetPriorAuthQueryVariables = {
  id: string,
};

export type GetPriorAuthQuery = {
  // Prior Auth Queries
  getPriorAuth?:  {
    __typename: "PriorAuth",
    id: string,
    authNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: PriorAuthStatus,
    requestedDate: string,
    approvedDate?: string | null,
    expirationDate?: string | null,
    notes?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
  } | null,
};

export type ListPriorAuthsByOrganizationQueryVariables = {
  organizationId: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPriorAuthsByOrganizationQuery = {
  listPriorAuthsByOrganization?:  {
    __typename: "PaginatedPriorAuths",
    items:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type ListPriorAuthsByPatientQueryVariables = {
  patientId: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPriorAuthsByPatientQuery = {
  listPriorAuthsByPatient?:  {
    __typename: "PaginatedPriorAuths",
    items:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type ListPriorAuthsByStatusQueryVariables = {
  organizationId: string,
  status: PriorAuthStatus,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPriorAuthsByStatusQuery = {
  listPriorAuthsByStatus?:  {
    __typename: "PaginatedPriorAuths",
    items:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    nextToken?: string | null,
    total?: number | null,
  } | null,
};

export type GetOrganizationQueryVariables = {
  id: string,
};

export type GetOrganizationQuery = {
  // Organization Queries
  getOrganization?:  {
    __typename: "Organization",
    id: string,
    name: string,
    taxId?: string | null,
    address?: string | null,
    phone?: string | null,
    email?: string | null,
    createdAt: string,
    updatedAt: string,
    // Relationships
    members:  Array< {
      __typename: "TeamMember",
      id: string,
      userId: string,
      organizationId: string,
      role: string,
      permissions: Array< string >,
      createdAt: string,
      updatedAt: string,
    } >,
    patients:  Array< {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } | null,
};

export type ListTeamMembersQueryVariables = {
  organizationId: string,
};

export type ListTeamMembersQuery = {
  listTeamMembers:  Array< {
    __typename: "TeamMember",
    id: string,
    userId: string,
    organizationId: string,
    role: string,
    permissions: Array< string >,
    createdAt: string,
    updatedAt: string,
    // Relationships
    organization:  {
      __typename: "Organization",
      id: string,
      name: string,
      taxId?: string | null,
      address?: string | null,
      phone?: string | null,
      email?: string | null,
      createdAt: string,
      updatedAt: string,
    },
  } >,
};

export type GetRealtimeMetricsQueryVariables = {
  organizationId: string,
};

export type GetRealtimeMetricsQuery = {
  // Analytics and Metrics
  getRealtimeMetrics?:  {
    __typename: "RealtimeMetrics",
    organizationId: string,
    activePAs: number,
    pendingClaims: number,
    ehrSyncStatus: string,
    healthLakeJobs:  Array< {
      __typename: "HealthLakeJob",
      jobId: string,
      status: string,
      progress: number,
      createdAt: string,
      updatedAt: string,
    } >,
    timestamp: string,
  } | null,
};

export type OnPatientChangeSubscriptionVariables = {
  organizationId: string,
};

export type OnPatientChangeSubscription = {
  // Patient subscriptions
  onPatientChange?:  {
    __typename: "Patient",
    id: string,
    mrn: string,
    firstName: string,
    lastName: string,
    email?: string | null,
    phone?: string | null,
    dateOfBirth: string,
    gender: Gender,
    status: PatientStatus,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    claims:  Array< {
      __typename: "Claim",
      id: string,
      claimNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: ClaimStatus,
      totalAmount: number,
      submittedDate?: string | null,
      processedDate?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    appointments:  Array< {
      __typename: "Appointment",
      id: string,
      patientId: string,
      providerId: string,
      appointmentDate: string,
      duration: number,
      status: EncounterStatus,
      visitType: VisitType,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    insurancePolicies:  Array< {
      __typename: "InsurancePolicy",
      id: string,
      patientId: string,
      payerId: string,
      policyNumber: string,
      groupNumber?: string | null,
      subscriberId: string,
      subscriberName: string,
      effectiveDate: string,
      terminationDate?: string | null,
      isPrimary: boolean,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
    priorAuths:  Array< {
      __typename: "PriorAuth",
      id: string,
      authNumber: string,
      patientId: string,
      providerId: string,
      payerId: string,
      status: PriorAuthStatus,
      requestedDate: string,
      approvedDate?: string | null,
      expirationDate?: string | null,
      notes?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } | null,
};

export type OnClaimChangeSubscriptionVariables = {
  organizationId: string,
};

export type OnClaimChangeSubscription = {
  // Claim subscriptions
  onClaimChange?:  {
    __typename: "Claim",
    id: string,
    claimNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: ClaimStatus,
    totalAmount: number,
    submittedDate?: string | null,
    processedDate?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    claimLines:  Array< {
      __typename: "ClaimLine",
      id: string,
      claimId: string,
      cptCode: string,
      icd10Code?: string | null,
      units: number,
      chargeAmount: number,
      allowedAmount?: number | null,
      paidAmount?: number | null,
      adjustmentAmount?: number | null,
      status: string,
      createdAt: string,
      updatedAt: string,
    } >,
    remittanceAdvice:  Array< {
      __typename: "RemittanceAdvice",
      id: string,
      claimId: string,
      eraNumber: string,
      paymentAmount: number,
      adjustmentAmount: number,
      paymentDate: string,
      status: EraStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    } >,
  } | null,
};

export type OnPriorAuthChangeSubscriptionVariables = {
  organizationId: string,
};

export type OnPriorAuthChangeSubscription = {
  // Prior Auth subscriptions
  onPriorAuthChange?:  {
    __typename: "PriorAuth",
    id: string,
    authNumber: string,
    patientId: string,
    providerId: string,
    payerId: string,
    status: PriorAuthStatus,
    requestedDate: string,
    approvedDate?: string | null,
    expirationDate?: string | null,
    notes?: string | null,
    organizationId: string,
    createdAt: string,
    updatedAt: string,
    // Relationships
    patient:  {
      __typename: "Patient",
      id: string,
      mrn: string,
      firstName: string,
      lastName: string,
      email?: string | null,
      phone?: string | null,
      dateOfBirth: string,
      gender: Gender,
      status: PatientStatus,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    provider:  {
      __typename: "Provider",
      id: string,
      npi: string,
      firstName?: string | null,
      lastName?: string | null,
      organizationName?: string | null,
      taxonomy?: string | null,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
    payer:  {
      __typename: "Payer",
      id: string,
      name: string,
      payerCode: string,
      organizationId: string,
      createdAt: string,
      updatedAt: string,
    },
  } | null,
};
