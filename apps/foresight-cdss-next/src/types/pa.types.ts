export type PAStatus =
  | "needs-review"
  | "auto-processing"
  | "auto-approved"
  | "auto-denied"
  | "denied"
  | "error";

export type EventType =
  | "pa-initiated"
  | "fields-populated"
  | "questions-answered"
  | "documents-attached"
  | "submitted"
  | "status-update"
  | "completed";

export type Priority = 'high' | 'medium' | 'low';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  priority?: number;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  conditions: string[];
  bmi: number;
  hasType2Diabetes: boolean;
  insurance: Insurance;
  dosespot_patient_id?: number;
}

export interface Insurance {
  id: string;
  company: string;
  memberId: string;
  groupNumber?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  ocrStatus?: 'success' | 'failed' | 'pending';
  ocrConfidence?: number;
}

export interface Provider {
  id: string;
  name: string;
  npi: string;
  practice: string;
}

export interface PACase {
  id: string;
  patientId: string;
  patient: Patient;
  provider: Provider;
  attemptNumber: number;
  maxAttempts: number;
  medication: Medication;
  medicationSequence: string[];
  status: PAStatus;
  automationScore: number;
  priority: Priority;
  payer: string;
  denialReasons?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date;
}

export interface AutomationEvent {
  id: string;
  caseId: string;
  type: EventType;
  timestamp: Date;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  confidence?: number;
  details: Record<string, any>;
  description?: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    positive: boolean;
  };
  target?: string;
}

export interface StatusDistribution {
  needsReview: number;
  autoProcessing: number;
  autoApproved: number;
  denied: number;
  total: number;
}

export interface AutomationMetrics {
  overallConfidence: number;
  fieldsCompleted: {
    completed: number;
    total: number;
  };
  documentsAttached: {
    attached: number;
    total: number;
  };
  processingTime: number;
  requiresReview: boolean;
}
