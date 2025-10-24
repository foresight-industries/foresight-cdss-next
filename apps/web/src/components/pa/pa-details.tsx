'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Building2, Pill, FileText, AlertCircle, CheckCircle, XCircle, Download, Edit, MessageSquare, Save, ChevronLeft, ChevronRight, X as XIcon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { epaQueueItems, type EpaQueueItem } from '@/data/epa-queue';

// Define the PA data structure
interface PAData {
  id: string;
  status: 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  confidence: number;
  createdAt: string;
  updatedAt: string;
  patient: {
    name: string;
    id: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    address: string;
    phone: string;
    conditions: string[];
  };
  medication: {
    name: string;
    genericName: string;
    strength: string;
    dosage: string;
    quantity: string;
    ndc: string;
    priority: string;
  };
  provider: {
    name: string;
    npi: string;
    clinic: string;
    address: string;
    phone: string;
  };
  payer: {
    name: string;
    planName: string;
    memberId: string;
    groupNumber: string;
    subscriberId: string;
  };
  attempt: {
    current: number;
    total: number;
    previousDenials: string[];
  };
  timeline: Array<{
    timestamp: string;
    event: string;
    user: string;
    status: string;
  }>;
  clinicalQuestions: Array<{
    question: string;
    answer: string;
    confidence: number;
  }>;
}

interface PADetailsProps {
  pa: PAData | EpaQueueItem | null;
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  initialAction?: 'edit' | 'documents' | 'notes';
}

// Helper to check if object has PAData structure
const isPAData = (obj: any): obj is PAData => {
  return obj && typeof obj === 'object' && 'patient' in obj && 'medication' in obj && 'provider' in obj && 'payer' in obj;
};

// Get PA data from queue items, with enhanced mock data for detailed view
const getPAData = (id: string): PAData => {
  // Find the queue item by ID
  const queueItem: EpaQueueItem | undefined = epaQueueItems.find(item => item.id === id);

  if (!queueItem) {
    // Fallback to default data if PA not found
    return {
      id: id,
      status: 'auto-processing' as const,
      confidence: 87,
      createdAt: '2025-01-25T10:30:00Z',
      updatedAt: '2025-01-25T14:22:00Z',
      patient: {
        name: 'Unknown Patient',
        id: 'PT-UNKNOWN',
        dateOfBirth: '1985-03-15',
        age: 39,
        gender: 'Unknown',
        address: '123 Main St, Austin, TX 78701',
        phone: '(555) 123-4567',
        conditions: ['Unknown Condition']
      },
      medication: {
        name: 'Unknown Medication',
        genericName: 'Unknown',
        strength: 'Unknown',
        dosage: 'Unknown',
        quantity: 'Unknown',
        ndc: 'Unknown',
        priority: 'Standard'
      },
      provider: {
        name: 'Dr. Michael Chen',
        npi: '1234567890',
        clinic: 'Austin Diabetes Center',
        address: '456 Medical Blvd, Austin, TX 78705',
        phone: '(555) 987-6543'
      },
      payer: {
        name: 'Unknown Payer',
        planName: 'Unknown Plan',
        memberId: 'UNKNOWN',
        groupNumber: 'UNKNOWN',
        subscriberId: 'UNKNOWN'
      },
      attempt: {
        current: 1,
        total: 1,
        previousDenials: []
      },
      timeline: [
        { timestamp: '2025-01-25T10:30:00Z', event: 'PA Request Initiated', user: 'System', status: 'completed' },
        { timestamp: '2025-01-25T14:22:00Z', event: 'Status Update Received', user: 'Webhook', status: 'in-progress' }
      ],
      clinicalQuestions: [
        { question: 'Clinical data not available', answer: 'Please contact the provider for more information', confidence: 0 }
      ]
    };
  }

  // Enhanced data mapping from queue item to detailed PA view
  const enhancedData = {
    id: queueItem.id,
    status: queueItem.status,
    confidence: queueItem.confidence,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updatedAt: queueItem.updatedAt,
    patient: {
      name: queueItem.patientName,
      id: queueItem.patientId,
      dateOfBirth: generateDateOfBirth(queueItem.patientName),
      age: calculateAge(queueItem.patientName),
      gender: inferGender(queueItem.patientName),
      address: generateAddress(queueItem.patientName),
      phone: generatePhone(queueItem.patientName),
      conditions: queueItem.conditions ? queueItem.conditions.split(',').map(c => c.trim()) : ['Unknown Condition']
    },
    medication: {
      name: queueItem.medication,
      genericName: getGenericName(queueItem.medication),
      strength: getMedicationStrength(queueItem.medication),
      dosage: getMedicationDosage(queueItem.medication),
      quantity: getMedicationQuantity(queueItem.medication),
      ndc: generateNDC(queueItem.medication),
      priority: getMedicationPriority(queueItem.medication, queueItem.conditions)
    },
    provider: {
      name: generateProviderName(queueItem.payer),
      npi: generateNPI(queueItem.payer),
      clinic: generateClinicName(queueItem.payer),
      address: generateProviderAddress(queueItem.payer),
      phone: generateProviderPhone(queueItem.payer)
    },
    payer: {
      name: queueItem.payer,
      planName: generatePlanName(queueItem.payer),
      memberId: generateMemberId(queueItem.patientId, queueItem.payer),
      groupNumber: generateGroupNumber(queueItem.payer),
      subscriberId: generateSubscriberId(queueItem.patientId)
    },
    attempt: {
      current: getAttemptNumber(queueItem.attempt),
      total: getAttemptNumber(queueItem.attempt),
      previousDenials: queueItem.attempt.includes('Resubmission') || queueItem.attempt.includes('Appeal')
        ? ['Previous submission denied due to incomplete documentation']
        : []
    },
    timeline: generateTimeline(queueItem),
    clinicalQuestions: generateClinicalQuestions(queueItem)
  };

  return enhancedData;
};

// Helper functions for generating realistic data based on queue items
const generateDateOfBirth = (name: string): string => {
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const year = 1970 + (hash % 35); // Age between 20-55
  const month = (hash % 12) + 1;
  const day = (hash % 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const calculateAge = (name: string): number => {
  const birthYear = parseInt(generateDateOfBirth(name).split('-')[0]);
  return 2025 - birthYear;
};

const inferGender = (name: string): string => {
  const femaleNames = ['Sarah', 'Emma', 'Lisa', 'Jennifer', 'Amanda'];
  const firstName = name.split(' ')[0];
  return femaleNames.includes(firstName) ? 'Female' : 'Male';
};

const generateAddress = (name: string): string => {
  const addresses = [
    '123 Main St, Austin, TX 78701',
    '456 Oak Ave, Houston, TX 77001',
    '789 Pine Rd, Dallas, TX 75201',
    '321 Elm St, San Antonio, TX 78201',
    '654 Maple Dr, Fort Worth, TX 76101'
  ];
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return addresses[hash % addresses.length];
};

const generatePhone = (name: string): string => {
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const areaCode = 512 + (hash % 200);
  const number = (hash * 1000 + 1000000) % 9000000 + 1000000;
  return `(${areaCode}) ${Math.floor(number / 10000)}-${number % 10000}`;
};

const getGenericName = (medication: string): string => {
  const genericMap: { [key: string]: string } = {
    'Ozempic': 'Semaglutide',
    'Eliquis': 'Apixaban',
    'Humira': 'Adalimumab',
    'Trintellix': 'Vortioxetine',
    'Aimovig': 'Erenumab',
    'Spiriva': 'Tiotropium',
    'Cosentyx': 'Secukinumab',
    'Repatha': 'Evolocumab',
    'Dupixent': 'Dupilumab',
    'Stelara': 'Ustekinumab'
  };

  const brandName = medication.split(' ')[0];
  return genericMap[brandName] || 'Unknown Generic';
};

const getMedicationStrength = (medication: string): string => {
  const strengthRegex = /(\d+(?:\.\d+)?(?:mg|mL|units?))/;
  const strengthMatch = strengthRegex.exec(medication);
  return strengthMatch ? strengthMatch[0] : 'Standard strength';
};

const getMedicationDosage = (medication: string): string => {
  const dosageMap: { [key: string]: string } = {
    'Ozempic': 'Subcutaneous injection once weekly',
    'Eliquis': 'Oral tablet twice daily',
    'Humira': 'Subcutaneous injection every other week',
    'Trintellix': 'Oral tablet once daily',
    'Aimovig': 'Subcutaneous injection once monthly',
    'Spiriva': 'Inhalation once daily',
    'Cosentyx': 'Subcutaneous injection weekly',
    'Repatha': 'Subcutaneous injection twice monthly',
    'Dupixent': 'Subcutaneous injection every 2 weeks',
    'Stelara': 'Subcutaneous injection every 12 weeks'
  };

  const brandName = medication.split(' ')[0];
  return dosageMap[brandName] || 'As directed by physician';
};

const getMedicationQuantity = (medication: string): string => {
  const quantityMap: { [key: string]: string } = {
    'Ozempic': '3 pens (3-month supply)',
    'Eliquis': '60 tablets (30-day supply)',
    'Humira': '2 syringes (28-day supply)',
    'Trintellix': '30 tablets (30-day supply)',
    'Aimovig': '1 syringe (28-day supply)',
    'Spiriva': '30 capsules (30-day supply)',
    'Cosentyx': '4 syringes (28-day supply)',
    'Repatha': '2 syringes (28-day supply)',
    'Dupixent': '2 syringes (28-day supply)',
    'Stelara': '1 syringe (84-day supply)'
  };

  const brandName = medication.split(' ')[0];
  return quantityMap[brandName] || '30-day supply';
};

const generateNDC = (medication: string): string => {
  const ndcMap: { [key: string]: string } = {
    'Ozempic': '0169-2837-10',
    'Eliquis': '0087-6212-30',
    'Humira': '0074-3799-02',
    'Trintellix': '0456-2100-30',
    'Aimovig': '55513-100-01',
    'Spiriva': '0597-0075-18',
    'Cosentyx': '0078-0639-15',
    'Repatha': '55513-200-01',
    'Dupixent': '0024-5756-10',
    'Stelara': '57894-030-01'
  };

  const brandName = medication.split(' ')[0];
  return ndcMap[brandName] || '0000-0000-00';
};

const getMedicationPriority = (medication: string, conditions: string): string => {
  if (conditions.toLowerCase().includes('diabetes')) return 'T2D Priority';
  if (conditions.toLowerCase().includes('arthritis')) return 'RA Priority';
  if (conditions.toLowerCase().includes('depression')) return 'Mental Health Priority';
  if (conditions.toLowerCase().includes('migraine')) return 'Neurology Priority';
  return 'Standard Priority';
};

const generateProviderName = (payer: string): string => {
  const providerMap: { [key: string]: string } = {
    'Aetna': 'Dr. Sarah Mitchell',
    'UnitedHealth': 'Dr. Michael Chen',
    'Cigna': 'Dr. Jennifer Rodriguez',
    'Anthem': 'Dr. David Thompson'
  };
  return providerMap[payer] || 'Dr. John Smith';
};

const generateNPI = (payer: string): string => {
  const hash = payer.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return `1${(hash % 900000000 + 100000000).toString()}`;
};

const generateClinicName = (payer: string): string => {
  const clinicMap: { [key: string]: string } = {
    'Aetna': 'Austin Comprehensive Care',
    'UnitedHealth': 'Houston Medical Associates',
    'Cigna': 'Dallas Specialty Clinic',
    'Anthem': 'San Antonio Family Medicine'
  };
  return clinicMap[payer] || 'Community Health Center';
};

const generateProviderAddress = (payer: string): string => {
  const addressMap: { [key: string]: string } = {
    'Aetna': '456 Medical Blvd, Austin, TX 78705',
    'UnitedHealth': '789 Healthcare Dr, Houston, TX 77002',
    'Cigna': '321 Clinic Way, Dallas, TX 75202',
    'Anthem': '654 Provider St, San Antonio, TX 78202'
  };
  return addressMap[payer] || '123 Medical Center Dr, TX 78701';
};

const generateProviderPhone = (payer: string): string => {
  const phoneMap: { [key: string]: string } = {
    'Aetna': '(512) 987-6543',
    'UnitedHealth': '(713) 555-0123',
    'Cigna': '(214) 555-0456',
    'Anthem': '(210) 555-0789'
  };
  return phoneMap[payer] || '(555) 123-4567';
};

const generatePlanName = (payer: string): string => {
  const planMap: { [key: string]: string } = {
    'Aetna': 'Aetna Better Health',
    'UnitedHealth': 'UnitedHealth Community Plan',
    'Cigna': 'Cigna HealthCare',
    'Anthem': 'Anthem Blue Cross'
  };
  return planMap[payer] || `${payer} Health Plan`;
};

const generateMemberId = (patientId: string, payer: string): string => {
  const payerPrefix = payer.substring(0, 3).toUpperCase();
  return `${payerPrefix}${patientId.replace('P', '')}`;
};

const generateGroupNumber = (payer: string): string => {
  const hash = payer.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return `GRP${(hash % 900000 + 100000).toString()}`;
};

const generateSubscriberId = (patientId: string): string => {
  return `SUB${patientId.replace('P', '')}`;
};

const getAttemptNumber = (attempt: string): number => {
  if (attempt.includes('Resubmission')) return 2;
  if (attempt.includes('Appeal')) return 3;
  return 1;
};

const generateTimeline = (queueItem: EpaQueueItem) => {
  const baseTime = new Date(queueItem.updatedAt).getTime();
  const timeline = [
    { timestamp: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(), event: 'PA Request Initiated', user: 'System', status: 'completed' },
    { timestamp: new Date(baseTime - 3.5 * 60 * 60 * 1000).toISOString(), event: 'Insurance Verified', user: 'System', status: 'completed' },
    { timestamp: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(), event: 'Clinical Data Extracted', user: 'OCR System', status: 'completed' },
    { timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(), event: 'Clinical Questions Answered', user: 'GPT-4', status: 'completed' },
    { timestamp: new Date(baseTime - 1 * 60 * 60 * 1000).toISOString(), event: 'Submitted to Payer', user: 'System', status: 'completed' },
    { timestamp: queueItem.updatedAt, event: 'Status Update Received', user: 'Webhook', status: queueItem.status === 'auto-processing' ? 'in-progress' : 'completed' }
  ];

  if (queueItem.status === 'auto-approved') {
    timeline.push({
      timestamp: new Date(baseTime + 30 * 60 * 1000).toISOString(),
      event: 'PA Approved',
      user: queueItem.payer,
      status: 'completed'
    });
  } else if (queueItem.status === 'denied') {
    timeline.push({
      timestamp: new Date(baseTime + 30 * 60 * 1000).toISOString(),
      event: 'PA Denied',
      user: queueItem.payer,
      status: 'completed'
    });
  }

  return timeline;
};

const generateClinicalQuestions = (queueItem: EpaQueueItem) => {
  const medicationQuestions: { [key: string]: any[] } = {
    'Ozempic': [
      { question: 'Has the patient tried metformin?', answer: 'Yes, patient has been on metformin 1000mg BID for 18 months with inadequate glycemic control (A1C 8.2%)', confidence: 95 },
      { question: 'What is the patient\'s current BMI?', answer: '32.1 kg/m² (height: 165cm, weight: 87kg)', confidence: 98 },
      { question: 'Has the patient tried other GLP-1 agonists?', answer: 'Yes, patient tried liraglutide for 6 months but discontinued due to nausea', confidence: 90 },
      { question: 'What is the patient\'s latest A1C?', answer: '8.2% (drawn within last 3 months)', confidence: 97 }
    ],
    'Humira': [
      { question: 'Has the patient tried methotrexate?', answer: 'Yes, patient was on methotrexate 15mg weekly for 6 months with partial response', confidence: 92 },
      { question: 'What is the patient\'s current disease activity?', answer: 'Moderate to high disease activity with DAS28 score of 5.2', confidence: 88 },
      { question: 'Has the patient tried other DMARDs?', answer: 'Yes, tried sulfasalazine and hydroxychloroquine with insufficient response', confidence: 85 },
      { question: 'Are there any contraindications to TNF inhibitors?', answer: 'No active infections, recent TB screening negative', confidence: 94 }
    ],
    'Eliquis': [
      { question: 'What is the patient\'s CHA2DS2-VASc score?', answer: 'Score of 4 (age >75, hypertension, diabetes, female)', confidence: 96 },
      { question: 'Has the patient tried warfarin?', answer: 'Yes, patient had difficulty maintaining therapeutic INR on warfarin', confidence: 89 },
      { question: 'What is the patient\'s creatinine clearance?', answer: 'CrCl 65 mL/min - appropriate for standard dosing', confidence: 93 },
      { question: 'Any contraindications to anticoagulation?', answer: 'No active bleeding, no high bleeding risk procedures planned', confidence: 91 }
    ]
  };

  const brandName = queueItem.medication.split(' ')[0];
  return medicationQuestions[brandName] || [
    { question: 'Has the patient tried first-line therapy?', answer: 'Yes, patient has tried and failed first-line treatment options', confidence: 85 },
    { question: 'What is the medical necessity?', answer: 'Patient requires this medication due to treatment failure or contraindications to alternatives', confidence: 80 },
    { question: 'Are there any contraindications?', answer: 'No contraindications identified in patient\'s medical history', confidence: 90 }
  ];
};

const statusConfig = {
  'needs-review': { color: 'bg-yellow-50 text-yellow-900 border-yellow-200', icon: AlertCircle, label: 'Needs Review' },
  'auto-processing': { color: 'bg-blue-50 text-blue-900 border-blue-200', icon: Clock, label: 'Auto Processing' },
  'auto-approved': { color: 'bg-green-50 text-green-900 border-green-200', icon: CheckCircle, label: 'Auto Approved' },
  'denied': { color: 'bg-red-50 text-red-900 border-red-200', icon: XCircle, label: 'Denied' }
} as const;

export function PADetails({
  pa,
  open,
  onClose,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  initialAction,
}: Readonly<PADetailsProps>) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<
    Array<{ id: string; text: string; timestamp: string; user: string }>
  >([]);

  // Convert pa to PAData format if needed
  const [paData, setPaData] = useState<PAData | null>(() => 
    pa ? (isPAData(pa) ? pa : getPAData(pa.id)) : null
  );
  const [editData, setEditData] = useState<PAData | null>(paData);

  // Update data when pa changes
  useEffect(() => {
    if (pa) {
      const newPaData = isPAData(pa) ? pa : getPAData(pa.id);
      setPaData(newPaData);
      setEditData(newPaData);
    }
  }, [pa]);

  // Handle initial action when component opens
  useEffect(() => {
    if (initialAction) {
      switch (initialAction) {
        case "edit":
          setShowEditModal(true);
          break;
        case "documents":
          // Documents section is now always visible in the main view
          break;
        case "notes":
          setShowNoteModal(true);
          break;
      }
    }
  }, [initialAction]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  if (!paData) {
    return null;
  }

  return (
    <>
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Custom overlay that respects sidebar */}
        <DialogPrimitive.Overlay 
          className="fixed inset-0 left-[256px] bg-black/30 z-[49] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        
        {/* Custom positioned content */}
        <DialogPrimitive.Content
          className="fixed left-[calc(256px+2rem)] top-6 right-6 bottom-6 z-50 bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onEscapeKeyDown={onClose}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header Section - Sticky */}
          <div className="flex-shrink-0 sticky top-0 bg-background z-10 border-b">
            <div className="px-8 py-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                {/* Left side: Navigation arrows */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrev}
                    disabled={disablePrev}
                    className="h-8 w-8 p-0"
                    aria-label="Previous PA"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNext}
                    disabled={disableNext}
                    className="h-8 w-8 p-0"
                    aria-label="Next PA"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Center: PA ID and Status */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <DialogPrimitive.Title className="text-2xl font-bold text-foreground">
                      {paData.id}
                    </DialogPrimitive.Title>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusConfig[paData.status].color)}
                    >
                      {statusConfig[paData.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{paData.patient.name}</span>
                    <span>{paData.medication.name}</span>
                  </div>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                    aria-label="Close"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-8 py-6 space-y-4">
              {/* Patient & Provider - Two Column Layout */}
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-4 w-4" /> Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Name</div>
                      <div className="font-semibold text-foreground">{paData.patient.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Patient ID</div>
                      <div className="font-medium text-foreground">{paData.patient.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Age</div>
                      <div className="font-medium text-foreground">{paData.patient.age}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Gender</div>
                      <div className="font-medium text-foreground">{paData.patient.gender}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Conditions</div>
                      <div className="flex flex-wrap gap-1">
                        {paData.patient.conditions.map((condition, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-4 w-4" /> Provider
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Name</div>
                      <div className="font-semibold text-foreground">{paData.provider.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">NPI</div>
                      <div className="font-medium text-foreground">{paData.provider.npi}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Clinic</div>
                      <div className="font-medium text-foreground">{paData.provider.clinic}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Contact</div>
                      <div className="text-sm text-foreground">{paData.provider.phone}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Medication & Insurance - Two Column Layout */}
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Pill className="h-4 w-4" /> Medication Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Brand Name</div>
                      <div className="font-semibold text-foreground">{paData.medication.name}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Generic Name</div>
                      <div className="font-medium text-foreground">{paData.medication.genericName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Strength</div>
                      <div className="font-medium text-foreground">{paData.medication.strength}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Quantity</div>
                      <div className="font-medium text-foreground">{paData.medication.quantity}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Dosage</div>
                      <div className="text-sm text-foreground">{paData.medication.dosage}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">NDC</div>
                      <div className="font-medium text-foreground font-mono text-xs">{paData.medication.ndc}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Priority</div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                      >
                        {paData.medication.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-4 w-4" /> Insurance
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Payer</div>
                      <div className="font-semibold text-foreground">{paData.payer.name}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Plan</div>
                      <div className="font-medium text-foreground">{paData.payer.planName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Member ID</div>
                      <div className="font-medium text-foreground">{paData.payer.memberId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Group #</div>
                      <div className="font-medium text-foreground">{paData.payer.groupNumber}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clinical Questions & AI Responses */}
              <section className="bg-muted/20 rounded-xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /> Clinical Questions & AI Responses
                </h3>
                <div className="space-y-3">
                  {paData.clinicalQuestions.map((item, index) => (
                    <div key={index} className="bg-background border border-border/60 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-foreground">{item.question}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs flex-shrink-0 ml-2",
                            item.confidence >= 95
                              ? "bg-green-50 text-green-700 border-green-200"
                              : item.confidence >= 85
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {item.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Timeline & Documents - Side by Side */}
              <section className="grid gap-4 lg:grid-cols-2">
                {/* Timeline */}
                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <History className="h-4 w-4" /> Processing Timeline
                  </h3>
                  <div className="space-y-3">
                    {paData.timeline.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-background border border-border/60 rounded-lg">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mt-1 flex-shrink-0",
                            item.status === "completed"
                              ? "bg-green-500"
                              : item.status === "in-progress"
                              ? "bg-blue-500"
                              : "bg-muted"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-foreground">{item.event}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(item.timestamp)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">by {item.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-4 w-4" /> Supporting Documents
                  </h3>
                  <div className="bg-background border border-border/60 rounded-lg p-6 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No documents uploaded yet
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    {/* Edit Details Modal */}
    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit PA Details</DialogTitle>
                <DialogDescription>
                  Update the prior authorization information below.
                </DialogDescription>
              </DialogHeader>

              {editData && (
              <div className="space-y-6 py-4">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-name">Patient Name</Label>
                      <Input
                        id="patient-name"
                        value={editData.patient.name}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            patient: {
                              ...editData.patient,
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-id">Patient ID</Label>
                      <Input
                        id="patient-id"
                        value={editData.patient.id}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            patient: {
                              ...editData.patient,
                              id: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Medication Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Medication Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="med-name">Brand Name</Label>
                      <Input
                        id="med-name"
                        value={editData.medication.name}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            medication: {
                              ...editData.medication,
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="med-generic">Generic Name</Label>
                      <Input
                        id="med-generic"
                        value={editData.medication.genericName}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            medication: {
                              ...editData.medication,
                              genericName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editData) {
                      setPaData(editData);
                      setShowEditModal(false);
                      alert("Changes saved successfully!");
                    }
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Note Modal */}
          <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Note</DialogTitle>
                <DialogDescription>
                  Add a note to this prior authorization request.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="note-text">Note</Label>
                  <Textarea
                    id="note-text"
                    placeholder="Enter your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Previous Notes */}
                {notes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Previous Notes</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="border-b last:border-0 pb-2 last:pb-0"
                        >
                          <div className="flex justify-between items-start text-sm">
                            <span className="font-medium">{note.user}</span>
                            <span className="text-muted-foreground">
                              {new Date(note.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNewNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newNote.trim()) {
                      setNotes([
                        ...notes,
                        {
                          id: Date.now().toString(),
                          text: newNote,
                          timestamp: new Date().toISOString(),
                          user: "PA Coordinator",
                        },
                      ]);
                      setNewNote("");
                      setShowNoteModal(false);
                      alert("Note added successfully!");
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
  );
}
