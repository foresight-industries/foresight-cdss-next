'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Building2, Pill, FileText, AlertCircle, CheckCircle, XCircle, Download, Edit, MessageSquare, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { epaQueueItems, type EpaQueueItem } from '@/data/epa-queue';

interface PADetailsProps {
  paId: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  initialAction?: 'edit' | 'documents' | 'notes';
}

// Get PA data from queue items, with enhanced mock data for detailed view
const getPAData = (id: string) => {
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
  const strengthMatch = medication.match(/(\d+(?:\.\d+)?(?:mg|mL|units?))/);
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

export function PADetails({ paId, onClose, onPrev, onNext, disablePrev, disableNext, initialAction }: PADetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'timeline' | 'documents'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [paData, setPaData] = useState(() => getPAData(paId));
  const [editData, setEditData] = useState(paData);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Array<{id: string; text: string; timestamp: string; user: string}>>([]);

  const StatusIcon = statusConfig[paData.status].icon;

  // Update data when paId changes
  useEffect(() => {
    const newData = getPAData(paId);
    setPaData(newData);
    setEditData(newData);
  }, [paId]);

  // Handle initial action when component opens
  useEffect(() => {
    if (initialAction) {
      switch (initialAction) {
        case 'edit':
          setShowEditModal(true);
          break;
        case 'documents':
          setActiveTab('documents');
          break;
        case 'notes':
          setShowNoteModal(true);
          break;
      }
    }
  }, [initialAction]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 space-y-6 p-8 pb-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Navigation buttons */}
            <div className="flex items-center space-x-1">
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

            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-bold">{paData.id}</h1>
              <p className="text-muted-foreground">{paData.patient.name} • {paData.medication.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5" />
              <Badge variant="outline" className={statusConfig[paData.status].color}>
                {statusConfig[paData.status].label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNoteModal(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 h-full overflow-y-auto px-8">
        <div className="p-8">

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 text-muted-foreground mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{paData.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{paData.patient.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{paData.patient.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{paData.patient.gender}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conditions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {paData.patient.conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="text-sm">{paData.patient.phone}</p>
                  <p className="text-sm text-muted-foreground">{paData.patient.address}</p>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Medication Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="w-5 h-5 text-muted-foreground mr-2" />
                  Medication Details
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Brand Name</p>
                  <p className="font-medium">{paData.medication.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generic Name</p>
                  <p className="font-medium">{paData.medication.genericName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strength</p>
                  <p className="font-medium">{paData.medication.strength}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dosage</p>
                  <p className="text-sm">{paData.medication.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{paData.medication.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NDC</p>
                  <p className="font-medium">{paData.medication.ndc}</p>
                </div>
                <div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {paData.medication.priority}
                  </Badge>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Provider Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 text-muted-foreground mr-2" />
                  Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{paData.provider.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NPI</p>
                    <p className="font-medium">{paData.provider.npi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clinic</p>
                    <p className="text-sm">{paData.provider.clinic}</p>
                    <p className="text-sm text-muted-foreground">{paData.provider.address}</p>
                    <p className="text-sm text-muted-foreground">{paData.provider.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 text-muted-foreground mr-2" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Payer</p>
                    <p className="font-medium">{paData.payer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{paData.payer.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member ID</p>
                    <p className="font-medium">{paData.payer.memberId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Group #</p>
                    <p className="text-sm font-medium">{paData.payer.groupNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="clinical" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Clinical Questions & AI Responses</h3>
            <div className="space-y-4">
              {paData.clinicalQuestions.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{item.question}</h4>
                      <Badge variant="outline" className={
                        item.confidence >= 95 ? 'bg-green-50 text-green-700 border-green-200' :
                        item.confidence >= 85 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }>
                        {item.confidence}%
                      </Badge>
                    </div>
                    <p className="text-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Processing Timeline</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {paData.timeline.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-muted'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.event}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(item.timestamp)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">by {item.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supporting Documents</h3>
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                  <Button variant="ghost" className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>
        </Tabs>

        {/* Edit Details Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit PA Details</DialogTitle>
              <DialogDescription>
                Update the prior authorization information below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-name">Patient Name</Label>
                    <Input
                      id="patient-name"
                      value={editData.patient.name}
                      onChange={(e) => setEditData({...editData, patient: {...editData.patient, name: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-id">Patient ID</Label>
                    <Input
                      id="patient-id"
                      value={editData.patient.id}
                      onChange={(e) => setEditData({...editData, patient: {...editData.patient, id: e.target.value}})}
                    />
                  </div>
                </div>
              </div>

              {/* Medication Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Medication Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="med-name">Brand Name</Label>
                    <Input
                      id="med-name"
                      value={editData.medication.name}
                      onChange={(e) => setEditData({...editData, medication: {...editData.medication, name: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="med-generic">Generic Name</Label>
                    <Input
                      id="med-generic"
                      value={editData.medication.genericName}
                      onChange={(e) => setEditData({...editData, medication: {...editData.medication, genericName: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setPaData(editData);
                setShowEditModal(false);
                alert('Changes saved successfully!');
              }}>
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
                      <div key={note.id} className="border-b last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-medium">{note.user}</span>
                          <span className="text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mt-1">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowNoteModal(false);
                setNewNote('');
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (newNote.trim()) {
                  setNotes([...notes, {
                    id: Date.now().toString(),
                    text: newNote,
                    timestamp: new Date().toISOString(),
                    user: 'PA Coordinator'
                  }]);
                  setNewNote('');
                  setShowNoteModal(false);
                  alert('Note added successfully!');
                }
              }}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}
