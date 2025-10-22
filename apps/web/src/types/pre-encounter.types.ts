export interface PreEncounterIssue {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  issueType: 'insurance_not_verified' | 'provider_not_credentialed' | 'expired_insurance' | 'missing_information';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  providerId?: string;
  providerName?: string;
  payerName?: string;
  createdAt: string;
  updatedAt: string;
  infoRequestSentAt?: string;
}

export interface EligibilityStatus {
  patientId: string;
  isEligible: boolean;
  lastChecked: string;
  payerResponse?: string;
  errorDetails?: string;
}

export interface ProviderCredentialing {
  providerId: string;
  providerName: string;
  payerId: string;
  payerName: string;
  isCredentialed: boolean;
  credentialingStatus: 'active' | 'pending' | 'expired' | 'denied';
  expirationDate?: string;
}

export interface PreEncounterAnalytics {
  totalUpcomingEncounters: number;
  totalIssues: number;
  resolvedIssues: number;
  successRate: number;
  issuesByType: Record<PreEncounterIssue['issueType'], number>;
}

export interface UpcomingEncounter {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentDate: string;
  appointmentTime: string;
  payerId: string;
  payerName: string;
  eligibilityStatus: 'verified' | 'not_verified' | 'failed';
  providerCredentialingStatus: 'credentialed' | 'not_credentialed' | 'expired';
  issues: PreEncounterIssue[];
}