/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./types/API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createPatient = /* GraphQL */ `mutation CreatePatient($input: CreatePatientInput!) {
  createPatient(input: $input) {
    id
    mrn
    firstName
    lastName
    email
    phone
    dateOfBirth
    gender
    status
    organizationId
    createdAt
    updatedAt
    claims {
      id
      claimNumber
      patientId
      providerId
      payerId
      status
      totalAmount
      submittedDate
      processedDate
      organizationId
      createdAt
      updatedAt
      __typename
    }
    appointments {
      id
      patientId
      providerId
      appointmentDate
      duration
      status
      visitType
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    insurancePolicies {
      id
      patientId
      payerId
      policyNumber
      groupNumber
      subscriberId
      subscriberName
      effectiveDate
      terminationDate
      isPrimary
      organizationId
      createdAt
      updatedAt
      __typename
    }
    priorAuths {
      id
      authNumber
      patientId
      providerId
      payerId
      status
      requestedDate
      approvedDate
      expirationDate
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreatePatientMutationVariables,
  APITypes.CreatePatientMutation
>;
export const updatePatient = /* GraphQL */ `mutation UpdatePatient($input: UpdatePatientInput!) {
  updatePatient(input: $input) {
    id
    mrn
    firstName
    lastName
    email
    phone
    dateOfBirth
    gender
    status
    organizationId
    createdAt
    updatedAt
    claims {
      id
      claimNumber
      patientId
      providerId
      payerId
      status
      totalAmount
      submittedDate
      processedDate
      organizationId
      createdAt
      updatedAt
      __typename
    }
    appointments {
      id
      patientId
      providerId
      appointmentDate
      duration
      status
      visitType
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    insurancePolicies {
      id
      patientId
      payerId
      policyNumber
      groupNumber
      subscriberId
      subscriberName
      effectiveDate
      terminationDate
      isPrimary
      organizationId
      createdAt
      updatedAt
      __typename
    }
    priorAuths {
      id
      authNumber
      patientId
      providerId
      payerId
      status
      requestedDate
      approvedDate
      expirationDate
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdatePatientMutationVariables,
  APITypes.UpdatePatientMutation
>;
export const deletePatient = /* GraphQL */ `mutation DeletePatient($id: ID!) {
  deletePatient(id: $id)
}
` as GeneratedMutation<
  APITypes.DeletePatientMutationVariables,
  APITypes.DeletePatientMutation
>;
export const createClaim = /* GraphQL */ `mutation CreateClaim($input: CreateClaimInput!) {
  createClaim(input: $input) {
    id
    claimNumber
    patientId
    providerId
    payerId
    status
    totalAmount
    submittedDate
    processedDate
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    claimLines {
      id
      claimId
      cptCode
      icd10Code
      units
      chargeAmount
      allowedAmount
      paidAmount
      adjustmentAmount
      status
      createdAt
      updatedAt
      __typename
    }
    remittanceAdvice {
      id
      claimId
      eraNumber
      paymentAmount
      adjustmentAmount
      paymentDate
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateClaimMutationVariables,
  APITypes.CreateClaimMutation
>;
export const updateClaimStatus = /* GraphQL */ `mutation UpdateClaimStatus($input: UpdateClaimStatusInput!) {
  updateClaimStatus(input: $input) {
    id
    claimNumber
    patientId
    providerId
    payerId
    status
    totalAmount
    submittedDate
    processedDate
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    claimLines {
      id
      claimId
      cptCode
      icd10Code
      units
      chargeAmount
      allowedAmount
      paidAmount
      adjustmentAmount
      status
      createdAt
      updatedAt
      __typename
    }
    remittanceAdvice {
      id
      claimId
      eraNumber
      paymentAmount
      adjustmentAmount
      paymentDate
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateClaimStatusMutationVariables,
  APITypes.UpdateClaimStatusMutation
>;
export const submitClaim = /* GraphQL */ `mutation SubmitClaim($id: ID!) {
  submitClaim(id: $id) {
    id
    claimNumber
    patientId
    providerId
    payerId
    status
    totalAmount
    submittedDate
    processedDate
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    claimLines {
      id
      claimId
      cptCode
      icd10Code
      units
      chargeAmount
      allowedAmount
      paidAmount
      adjustmentAmount
      status
      createdAt
      updatedAt
      __typename
    }
    remittanceAdvice {
      id
      claimId
      eraNumber
      paymentAmount
      adjustmentAmount
      paymentDate
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.SubmitClaimMutationVariables,
  APITypes.SubmitClaimMutation
>;
export const createPriorAuth = /* GraphQL */ `mutation CreatePriorAuth($input: CreatePriorAuthInput!) {
  createPriorAuth(input: $input) {
    id
    authNumber
    patientId
    providerId
    payerId
    status
    requestedDate
    approvedDate
    expirationDate
    notes
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreatePriorAuthMutationVariables,
  APITypes.CreatePriorAuthMutation
>;
export const updatePriorAuthStatus = /* GraphQL */ `mutation UpdatePriorAuthStatus($input: UpdatePriorAuthStatusInput!) {
  updatePriorAuthStatus(input: $input) {
    id
    authNumber
    patientId
    providerId
    payerId
    status
    requestedDate
    approvedDate
    expirationDate
    notes
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdatePriorAuthStatusMutationVariables,
  APITypes.UpdatePriorAuthStatusMutation
>;
export const batchUpdateClaimStatuses = /* GraphQL */ `mutation BatchUpdateClaimStatuses($claims: [UpdateClaimStatusInput!]!) {
  batchUpdateClaimStatuses(claims: $claims) {
    id
    claimNumber
    patientId
    providerId
    payerId
    status
    totalAmount
    submittedDate
    processedDate
    organizationId
    createdAt
    updatedAt
    patient {
      id
      mrn
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    provider {
      id
      npi
      firstName
      lastName
      organizationName
      taxonomy
      organizationId
      createdAt
      updatedAt
      __typename
    }
    payer {
      id
      name
      payerCode
      organizationId
      createdAt
      updatedAt
      __typename
    }
    claimLines {
      id
      claimId
      cptCode
      icd10Code
      units
      chargeAmount
      allowedAmount
      paidAmount
      adjustmentAmount
      status
      createdAt
      updatedAt
      __typename
    }
    remittanceAdvice {
      id
      claimId
      eraNumber
      paymentAmount
      adjustmentAmount
      paymentDate
      status
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.BatchUpdateClaimStatusesMutationVariables,
  APITypes.BatchUpdateClaimStatusesMutation
>;
export const batchCreatePatients = /* GraphQL */ `mutation BatchCreatePatients($patients: [CreatePatientInput!]!) {
  batchCreatePatients(patients: $patients) {
    id
    mrn
    firstName
    lastName
    email
    phone
    dateOfBirth
    gender
    status
    organizationId
    createdAt
    updatedAt
    claims {
      id
      claimNumber
      patientId
      providerId
      payerId
      status
      totalAmount
      submittedDate
      processedDate
      organizationId
      createdAt
      updatedAt
      __typename
    }
    appointments {
      id
      patientId
      providerId
      appointmentDate
      duration
      status
      visitType
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    insurancePolicies {
      id
      patientId
      payerId
      policyNumber
      groupNumber
      subscriberId
      subscriberName
      effectiveDate
      terminationDate
      isPrimary
      organizationId
      createdAt
      updatedAt
      __typename
    }
    priorAuths {
      id
      authNumber
      patientId
      providerId
      payerId
      status
      requestedDate
      approvedDate
      expirationDate
      notes
      organizationId
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.BatchCreatePatientsMutationVariables,
  APITypes.BatchCreatePatientsMutation
>;
