/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./types/API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onPatientChange = /* GraphQL */ `subscription OnPatientChange($organizationId: ID!) {
  onPatientChange(organizationId: $organizationId) {
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
` as GeneratedSubscription<
  APITypes.OnPatientChangeSubscriptionVariables,
  APITypes.OnPatientChangeSubscription
>;
export const onClaimChange = /* GraphQL */ `subscription OnClaimChange($organizationId: ID!) {
  onClaimChange(organizationId: $organizationId) {
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
` as GeneratedSubscription<
  APITypes.OnClaimChangeSubscriptionVariables,
  APITypes.OnClaimChangeSubscription
>;
export const onPriorAuthChange = /* GraphQL */ `subscription OnPriorAuthChange($organizationId: ID!) {
  onPriorAuthChange(organizationId: $organizationId) {
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
` as GeneratedSubscription<
  APITypes.OnPriorAuthChangeSubscriptionVariables,
  APITypes.OnPriorAuthChangeSubscription
>;
