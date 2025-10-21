export interface QueueItem {
  id: string;
  patientName: string;
  patientId: string;
  conditions: string;
  attempt: string;
  medication: string;
  payer: string;
  status: 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  confidence: number;
  updatedAt: string;
  dosespotCaseId?: number;
  authNumber?: string;
  requestedService?: string;
  clinicalNotes?: string;
  prescriptionId?: string;
  providerId?: string;
  payerId?: string;
}

export interface QueueData {
  items: QueueItem[];
  statusCounts: Record<string, number>;
  payerCounts: Record<string, number>;
  medicationCounts: Record<string, number>;
  totalItems: number;
}