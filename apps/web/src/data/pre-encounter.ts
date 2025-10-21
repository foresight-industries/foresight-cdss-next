import type { PreEncounterIssue, PreEncounterAnalytics, UpcomingEncounter } from '@/types/pre-encounter.types';

// Mock pre-encounter issues data
export const mockPreEncounterIssues: PreEncounterIssue[] = [
  {
    id: 'pe-001',
    patientId: 'pat-001',
    patientName: 'Sarah Johnson',
    appointmentDate: '2024-10-12',
    issueType: 'insurance_not_verified',
    description: 'Insurance eligibility not verified - unable to contact payer',
    priority: 'high',
    status: 'pending',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    payerName: 'Aetna',
    createdAt: '2024-10-09T08:30:00Z',
    updatedAt: '2024-10-09T08:30:00Z',
  },
  {
    id: 'pe-002',
    patientId: 'pat-002',
    patientName: 'Michael Chen',
    appointmentDate: '2024-10-12',
    issueType: 'provider_not_credentialed',
    description: 'Provider not credentialed with Blue Cross Blue Shield',
    priority: 'high',
    status: 'pending',
    providerId: 'prov-002',
    providerName: 'Dr. Williams',
    payerName: 'Blue Cross Blue Shield',
    createdAt: '2024-10-09T09:15:00Z',
    updatedAt: '2024-10-09T09:15:00Z',
  },
  {
    id: 'pe-003',
    patientId: 'pat-003',
    patientName: 'Emma Davis',
    appointmentDate: '2024-10-13',
    issueType: 'expired_insurance',
    description: 'Insurance policy expired - requires updated information',
    priority: 'medium',
    status: 'in_progress',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    payerName: 'UnitedHealthcare',
    createdAt: '2024-10-08T14:20:00Z',
    updatedAt: '2024-10-09T10:45:00Z',
  },
  {
    id: 'pe-004',
    patientId: 'pat-004',
    patientName: 'James Wilson',
    appointmentDate: '2024-10-14',
    issueType: 'missing_information',
    description: 'Missing insurance member ID and group number',
    priority: 'medium',
    status: 'pending',
    providerId: 'prov-003',
    providerName: 'Dr. Brown',
    payerName: 'Cigna',
    createdAt: '2024-10-09T11:00:00Z',
    updatedAt: '2024-10-09T11:00:00Z',
  },
  {
    id: 'pe-005',
    patientId: 'pat-005',
    patientName: 'Lisa Anderson',
    appointmentDate: '2024-10-15',
    issueType: 'insurance_not_verified',
    description: 'Real-time eligibility check failed - network timeout',
    priority: 'low',
    status: 'pending',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    payerName: 'Humana',
    createdAt: '2024-10-09T12:30:00Z',
    updatedAt: '2024-10-09T12:30:00Z',
  },
];

// Mock upcoming encounters data
export const mockUpcomingEncounters: UpcomingEncounter[] = [
  {
    id: 'enc-001',
    patientId: 'pat-001',
    patientName: 'Sarah Johnson',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    appointmentDate: '2024-10-12',
    appointmentTime: '09:00',
    payerId: 'payer-001',
    payerName: 'Aetna',
    eligibilityStatus: 'not_verified',
    providerCredentialingStatus: 'credentialed',
    issues: [mockPreEncounterIssues[0]],
  },
  {
    id: 'enc-002',
    patientId: 'pat-002',
    patientName: 'Michael Chen',
    providerId: 'prov-002',
    providerName: 'Dr. Williams',
    appointmentDate: '2024-10-12',
    appointmentTime: '10:30',
    payerId: 'payer-002',
    payerName: 'Blue Cross Blue Shield',
    eligibilityStatus: 'verified',
    providerCredentialingStatus: 'not_credentialed',
    issues: [mockPreEncounterIssues[1]],
  },
  {
    id: 'enc-003',
    patientId: 'pat-003',
    patientName: 'Emma Davis',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    appointmentDate: '2024-10-13',
    appointmentTime: '14:00',
    payerId: 'payer-003',
    payerName: 'UnitedHealthcare',
    eligibilityStatus: 'failed',
    providerCredentialingStatus: 'credentialed',
    issues: [mockPreEncounterIssues[2]],
  },
  {
    id: 'enc-004',
    patientId: 'pat-004',
    patientName: 'James Wilson',
    providerId: 'prov-003',
    providerName: 'Dr. Brown',
    appointmentDate: '2024-10-14',
    appointmentTime: '11:15',
    payerId: 'payer-004',
    payerName: 'Cigna',
    eligibilityStatus: 'not_verified',
    providerCredentialingStatus: 'credentialed',
    issues: [mockPreEncounterIssues[3]],
  },
  {
    id: 'enc-005',
    patientId: 'pat-005',
    patientName: 'Lisa Anderson',
    providerId: 'prov-001',
    providerName: 'Dr. Smith',
    appointmentDate: '2024-10-15',
    appointmentTime: '15:45',
    payerId: 'payer-005',
    payerName: 'Humana',
    eligibilityStatus: 'not_verified',
    providerCredentialingStatus: 'credentialed',
    issues: [mockPreEncounterIssues[4]],
  },
];

// Mock analytics data
export const mockPreEncounterAnalytics: PreEncounterAnalytics = {
  totalUpcomingEncounters: 25,
  totalIssues: 5,
  resolvedIssues: 20,
  successRate: 95,
  issuesByType: {
    insurance_not_verified: 2,
    provider_not_credentialed: 1,
    expired_insurance: 1,
    missing_information: 1,
  },
};

// Utility functions
export const getIssueTypeLabel = (issueType: PreEncounterIssue['issueType']): string => {
  const labels: Record<PreEncounterIssue['issueType'], string> = {
    insurance_not_verified: 'Insurance Not Verified',
    provider_not_credentialed: 'Provider Not Credentialed',
    expired_insurance: 'Expired Insurance',
    missing_information: 'Missing Information',
  };
  return labels[issueType];
};

export const getIssuePriorityColor = (priority: PreEncounterIssue['priority']): string => {
  const colors: Record<PreEncounterIssue['priority'], string> = {
    low: 'border-blue-200 bg-blue-50 text-blue-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    high: 'border-red-200 bg-red-50 text-red-700',
  };
  return colors[priority];
};

export const getIssueStatusColor = (status: PreEncounterIssue['status']): string => {
  const colors: Record<PreEncounterIssue['status'], string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
    resolved: 'border-green-200 bg-green-50 text-green-700',
  };
  return colors[status];
};