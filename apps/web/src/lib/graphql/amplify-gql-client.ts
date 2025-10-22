import { generateClient } from 'aws-amplify/api';

// Create GraphQL client instance
export const graphqlClient = generateClient({
  endpoint: process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT!,
  authMode: 'apiKey',
  apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY!,
});

// TypeScript types for GraphQL operations
export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O' | 'U';
  status: 'active' | 'inactive' | 'deceased' | 'merged' | 'test';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  providerId: string;
  payerId: string;
  status: 'draft' | 'ready_for_submission' | 'submitted' | 'accepted' | 'rejected' | 'paid' | 'denied' | 'pending' | 'needs_review' | 'appeal_required';
  totalAmount: number;
  submittedDate?: string;
  processedDate?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriorAuth {
  id: string;
  authNumber: string;
  patientId: string;
  providerId: string;
  payerId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';
  requestedDate: string;
  approvedDate?: string;
  expirationDate?: string;
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeMetrics {
  organizationId: string;
  activePAs: number;
  pendingClaims: number;
  ehrSyncStatus: Record<string, string>;
  healthLakeJobs: Array<{
    jobId: string;
    status: string;
    progress: number;
  }>;
  timestamp: string;
}

// Event types for subscriptions
export interface ClaimStatusChangeEvent {
  claimId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  organizationId: string;
}

export interface PriorAuthStatusChangeEvent {
  priorAuthId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  organizationId: string;
}

export interface EHRSyncEvent {
  connectionId: string;
  status: string;
  recordsProcessed: number;
  errors: string[];
  timestamp: string;
  organizationId: string;
}

// GraphQL query and mutation strings
export const GET_PATIENT = /* GraphQL */ `
  query GetPatient($id: ID!) {
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
    }
  }
`;

export const LIST_PATIENTS_BY_ORGANIZATION = /* GraphQL */ `
  query ListPatientsByOrganization($organizationId: ID!, $limit: Int, $nextToken: String) {
    listPatientsByOrganization(organizationId: $organizationId, limit: $limit, nextToken: $nextToken) {
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
      }
      nextToken
      total
    }
  }
`;

export const CREATE_PATIENT = /* GraphQL */ `
  mutation CreatePatient($input: CreatePatientInput!) {
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
    }
  }
`;

export const GET_CLAIM = /* GraphQL */ `
  query GetClaim($id: ID!) {
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
    }
  }
`;

export const LIST_CLAIMS_BY_ORGANIZATION = /* GraphQL */ `
  query ListClaimsByOrganization($organizationId: ID!, $limit: Int, $nextToken: String) {
    listClaimsByOrganization(organizationId: $organizationId, limit: $limit, nextToken: $nextToken) {
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
      }
      nextToken
      total
    }
  }
`;

export const UPDATE_CLAIM_STATUS = /* GraphQL */ `
  mutation UpdateClaimStatus($input: UpdateClaimStatusInput!) {
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
    }
  }
`;

export const CREATE_PRIOR_AUTH = /* GraphQL */ `
  mutation CreatePriorAuth($input: CreatePriorAuthInput!) {
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
    }
  }
`;

export const GET_REALTIME_METRICS = /* GraphQL */ `
  query GetRealtimeMetrics($organizationId: ID!) {
    getRealtimeMetrics(organizationId: $organizationId) {
      organizationId
      activePAs
      pendingClaims
      ehrSyncStatus
      healthLakeJobs {
        jobId
        status
        progress
      }
      timestamp
    }
  }
`;

// Subscription queries
export const ON_CLAIM_STATUS_CHANGE = /* GraphQL */ `
  subscription OnClaimStatusChange($organizationId: ID!) {
    onClaimStatusChange(organizationId: $organizationId) {
      claimId
      oldStatus
      newStatus
      timestamp
      organizationId
    }
  }
`;

export const ON_PRIOR_AUTH_STATUS_CHANGE = /* GraphQL */ `
  subscription OnPriorAuthStatusChange($organizationId: ID!) {
    onPriorAuthStatusChange(organizationId: $organizationId) {
      priorAuthId
      oldStatus
      newStatus
      timestamp
      organizationId
    }
  }
`;

export const ON_EHR_SYNC_UPDATE = /* GraphQL */ `
  subscription OnEHRSyncUpdate($organizationId: ID!) {
    onEHRSyncUpdate(organizationId: $organizationId) {
      connectionId
      status
      recordsProcessed
      errors
      timestamp
      organizationId
    }
  }
`;

export const ON_METRICS_UPDATE = /* GraphQL */ `
  subscription OnMetricsUpdate($organizationId: ID!) {
    onMetricsUpdate(organizationId: $organizationId) {
      organizationId
      activePAs
      pendingClaims
      ehrSyncStatus
      healthLakeJobs {
        jobId
        status
        progress
      }
      timestamp
    }
  }
`;

export const ON_NEW_PATIENT = /* GraphQL */ `
  subscription OnNewPatient($organizationId: ID!) {
    onNewPatient(organizationId: $organizationId) {
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
    }
  }
`;

export const ON_NEW_CLAIM = /* GraphQL */ `
  subscription OnNewClaim($organizationId: ID!) {
    onNewClaim(organizationId: $organizationId) {
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
    }
  }
`;

// Helper functions for common operations
export async function getPatient(id: string): Promise<Patient | null> {
  try {
    const result = await graphqlClient.graphql({ query: GET_PATIENT, variables: { id } });
    return (result as any).data.getPatient;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
}

export async function listPatientsByOrganization(
  organizationId: string,
  limit = 20,
  nextToken?: string
): Promise<{ items: Patient[]; nextToken?: string; total?: number }> {
  try {
    const result = await graphqlClient.graphql({ query: LIST_PATIENTS_BY_ORGANIZATION, variables: {
      organizationId,
      limit,
      nextToken,
    }});

    return (result as any).data.listPatientsByOrganization;
  } catch (error) {
    console.error('Error listing patients:', error);
    throw error;
  }
}

export async function createPatient(input: {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O' | 'U';
  organizationId: string;
}): Promise<Patient> {
  try {
    const result = await graphqlClient.graphql({ query: CREATE_PATIENT, variables: { input } });
    return (result as any).data.createPatient;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

export async function updateClaimStatus(input: {
  id: string;
  status: string;
  notes?: string;
}): Promise<Claim> {
  try {
    const result = await graphqlClient.graphql({ query: UPDATE_CLAIM_STATUS, variables: { input } });
    return (result as any).data.updateClaimStatus;
  } catch (error) {
    console.error('Error updating claim status:', error);
    throw error;
  }
}

export async function getRealtimeMetrics(organizationId: string): Promise<RealtimeMetrics> {
  try {
    const result = await graphqlClient.graphql({ query: GET_REALTIME_METRICS, variables: { organizationId } });
    return (result as any).data.getRealtimeMetrics;
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    throw error;
  }
}

// Modern Amplify subscription helpers
export function subscribeToClaimStatusChanges(
  organizationId: string,
  onUpdate: (event: ClaimStatusChangeEvent) => void
) {
  return graphqlClient.graphql({ query: ON_CLAIM_STATUS_CHANGE, variables: { organizationId } });
}

export function subscribeToMetricsUpdates(
  organizationId: string,
  onUpdate: (metrics: RealtimeMetrics) => void
) {
  return graphqlClient.graphql({
    query: ON_METRICS_UPDATE,
    variables: { organizationId } });
}

export function subscribeToNewPatients(
  organizationId: string,
  onNewPatient: (patient: Patient) => void
) {
  return graphqlClient.graphql({
    query: ON_NEW_PATIENT,
    variables: { organizationId } });
}

// Additional modern subscription helpers for the new schema
export function subscribeToPatientChanges(
  organizationId: string
) {
  return graphqlClient.graphql({
    query: /* GraphQL */ `
      subscription OnPatientChange($organizationId: ID!) {
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
        }
      }
    `,
    variables: { organizationId } });
}

export function subscribeToClaimChanges(
  organizationId: string
) {
  return graphqlClient.graphql({
    query: /* GraphQL */ `
      subscription OnClaimChange($organizationId: ID!) {
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
        }
      }
    `,
    variables: { organizationId } });
}

export function subscribeToPriorAuthChanges(
  organizationId: string
) {
  return graphqlClient.graphql({
    query: /* GraphQL */ `
      subscription OnPriorAuthChange($organizationId: ID!) {
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
        }
      }
    `,
    variables: { organizationId } });
}
