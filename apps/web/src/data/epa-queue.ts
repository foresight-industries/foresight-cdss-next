export type EpaQueueStatus =
  | 'needs-review'
  | 'auto-processing'
  | 'auto-approved'
  | 'denied';

export interface EpaQueueItem {
  id: string;
  patientName: string;
  patientId: string;
  conditions: string;
  attempt: string;
  medication: string;
  payer: string;
  status: EpaQueueStatus;
  confidence: number;
  updatedAt: string;
}

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const epaQueueItems: EpaQueueItem[] = [
  {
    id: 'PA-2025-001',
    patientName: 'Sarah Johnson',
    patientId: 'P12345',
    conditions: 'Type 2 Diabetes',
    attempt: 'Initial PA Request',
    medication: 'Ozempic 0.5mg/dose pen',
    payer: 'Aetna',
    status: 'needs-review',
    confidence: 85,
    updatedAt: minutesAgo(120),
  },
  {
    id: 'PA-2025-002',
    patientName: 'Michael Chen',
    patientId: 'P12346',
    conditions: 'Hypertension',
    attempt: 'Prior Auth - Resubmission',
    medication: 'Eliquis 5mg',
    payer: 'UnitedHealth',
    status: 'auto-processing',
    confidence: 92,
    updatedAt: minutesAgo(60),
  },
  {
    id: 'PA-2025-003',
    patientName: 'Emma Rodriguez',
    patientId: 'P12347',
    conditions: 'Rheumatoid Arthritis',
    attempt: 'Step Therapy Override',
    medication: 'Humira 40mg/0.8mL',
    payer: 'Cigna',
    status: 'auto-approved',
    confidence: 96,
    updatedAt: minutesAgo(30),
  },
  {
    id: 'PA-2025-004',
    patientName: 'James Wilson',
    patientId: 'P12348',
    conditions: 'Depression',
    attempt: 'Initial PA Request',
    medication: 'Trintellix 20mg',
    payer: 'Anthem',
    status: 'denied',
    confidence: 65,
    updatedAt: minutesAgo(180),
  },
  {
    id: 'PA-2025-005',
    patientName: 'Lisa Thompson',
    patientId: 'P12349',
    conditions: 'Migraine',
    attempt: 'Appeal Request',
    medication: 'Aimovig 70mg/mL',
    payer: 'Aetna',
    status: 'needs-review',
    confidence: 78,
    updatedAt: minutesAgo(45),
  },
  {
    id: 'PA-2025-006',
    patientName: 'Robert Davis',
    patientId: 'P12350',
    conditions: 'COPD',
    attempt: 'Initial PA Request',
    medication: 'Spiriva Respimat',
    payer: 'UnitedHealth',
    status: 'auto-processing',
    confidence: 89,
    updatedAt: minutesAgo(90),
  },
  {
    id: 'PA-2025-007',
    patientName: 'Jennifer Lee',
    patientId: 'P12351',
    conditions: 'Psoriasis',
    attempt: 'Prior Auth - Resubmission',
    medication: 'Cosentyx 150mg/mL',
    payer: 'Cigna',
    status: 'auto-approved',
    confidence: 94,
    updatedAt: minutesAgo(20),
  },
  {
    id: 'PA-2025-008',
    patientName: 'David Martinez',
    patientId: 'P12352',
    conditions: 'High Cholesterol',
    attempt: 'Initial PA Request',
    medication: 'Repatha 140mg/mL',
    payer: 'Anthem',
    status: 'needs-review',
    confidence: 72,
    updatedAt: minutesAgo(150),
  },
  {
    id: 'PA-2025-009',
    patientName: 'Amanda White',
    patientId: 'P12353',
    conditions: 'Asthma',
    attempt: 'Step Therapy Override',
    medication: 'Dupixent 300mg/2mL',
    payer: 'Aetna',
    status: 'auto-processing',
    confidence: 87,
    updatedAt: minutesAgo(40),
  },
  {
    id: 'PA-2025-010',
    patientName: 'Christopher Brown',
    patientId: 'P12354',
    conditions: "Crohn's Disease",
    attempt: 'Initial PA Request',
    medication: 'Stelara 90mg/mL',
    payer: 'UnitedHealth',
    status: 'auto-approved',
    confidence: 91,
    updatedAt: minutesAgo(15),
  },
];
