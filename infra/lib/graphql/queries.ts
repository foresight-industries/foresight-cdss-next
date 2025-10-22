/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./types/API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getPatient = /* GraphQL */ `query GetPatient($id: ID!) {
  getPatient(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetPatientQueryVariables,
  APITypes.GetPatientQuery
>;
export const listPatientsByOrganization = /* GraphQL */ `query ListPatientsByOrganization(
  $organizationId: ID!
  $limit: Int
  $nextToken: String
) {
  listPatientsByOrganization(
    organizationId: $organizationId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPatientsByOrganizationQueryVariables,
  APITypes.ListPatientsByOrganizationQuery
>;
export const searchPatients = /* GraphQL */ `query SearchPatients($organizationId: ID!, $searchTerm: String!, $limit: Int) {
  searchPatients(
    organizationId: $organizationId
    searchTerm: $searchTerm
    limit: $limit
  ) {
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
` as GeneratedQuery<
  APITypes.SearchPatientsQueryVariables,
  APITypes.SearchPatientsQuery
>;
export const getClaim = /* GraphQL */ `query GetClaim($id: ID!) {
  getClaim(id: $id) {
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
` as GeneratedQuery<APITypes.GetClaimQueryVariables, APITypes.GetClaimQuery>;
export const listClaimsByOrganization = /* GraphQL */ `query ListClaimsByOrganization(
  $organizationId: ID!
  $limit: Int
  $nextToken: String
) {
  listClaimsByOrganization(
    organizationId: $organizationId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListClaimsByOrganizationQueryVariables,
  APITypes.ListClaimsByOrganizationQuery
>;
export const listClaimsByPatient = /* GraphQL */ `query ListClaimsByPatient($patientId: ID!, $limit: Int, $nextToken: String) {
  listClaimsByPatient(
    patientId: $patientId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListClaimsByPatientQueryVariables,
  APITypes.ListClaimsByPatientQuery
>;
export const listClaimsByStatus = /* GraphQL */ `query ListClaimsByStatus(
  $organizationId: ID!
  $status: ClaimStatus!
  $limit: Int
  $nextToken: String
) {
  listClaimsByStatus(
    organizationId: $organizationId
    status: $status
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListClaimsByStatusQueryVariables,
  APITypes.ListClaimsByStatusQuery
>;
export const getPriorAuth = /* GraphQL */ `query GetPriorAuth($id: ID!) {
  getPriorAuth(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetPriorAuthQueryVariables,
  APITypes.GetPriorAuthQuery
>;
export const listPriorAuthsByOrganization = /* GraphQL */ `query ListPriorAuthsByOrganization(
  $organizationId: ID!
  $limit: Int
  $nextToken: String
) {
  listPriorAuthsByOrganization(
    organizationId: $organizationId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPriorAuthsByOrganizationQueryVariables,
  APITypes.ListPriorAuthsByOrganizationQuery
>;
export const listPriorAuthsByPatient = /* GraphQL */ `query ListPriorAuthsByPatient(
  $patientId: ID!
  $limit: Int
  $nextToken: String
) {
  listPriorAuthsByPatient(
    patientId: $patientId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPriorAuthsByPatientQueryVariables,
  APITypes.ListPriorAuthsByPatientQuery
>;
export const listPriorAuthsByStatus = /* GraphQL */ `query ListPriorAuthsByStatus(
  $organizationId: ID!
  $status: PriorAuthStatus!
  $limit: Int
  $nextToken: String
) {
  listPriorAuthsByStatus(
    organizationId: $organizationId
    status: $status
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    total
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPriorAuthsByStatusQueryVariables,
  APITypes.ListPriorAuthsByStatusQuery
>;
export const getOrganization = /* GraphQL */ `query GetOrganization($id: ID!) {
  getOrganization(id: $id) {
    id
    name
    taxId
    address
    phone
    email
    createdAt
    updatedAt
    members {
      id
      userId
      organizationId
      role
      permissions
      createdAt
      updatedAt
      __typename
    }
    patients {
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
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetOrganizationQueryVariables,
  APITypes.GetOrganizationQuery
>;
export const listTeamMembers = /* GraphQL */ `query ListTeamMembers($organizationId: ID!) {
  listTeamMembers(organizationId: $organizationId) {
    id
    userId
    organizationId
    role
    permissions
    createdAt
    updatedAt
    organization {
      id
      name
      taxId
      address
      phone
      email
      createdAt
      updatedAt
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTeamMembersQueryVariables,
  APITypes.ListTeamMembersQuery
>;
export const getRealtimeMetrics = /* GraphQL */ `query GetRealtimeMetrics($organizationId: ID!) {
  getRealtimeMetrics(organizationId: $organizationId) {
    organizationId
    activePAs
    pendingClaims
    ehrSyncStatus
    healthLakeJobs {
      jobId
      status
      progress
      createdAt
      updatedAt
      __typename
    }
    timestamp
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetRealtimeMetricsQueryVariables,
  APITypes.GetRealtimeMetricsQuery
>;
