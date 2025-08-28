'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, User, Building2, Pills, FileText, AlertCircle, CheckCircle, XCircle, Download, Edit, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PADetailPageProps {
  params: { id: string };
}

// Mock data - in real implementation, this would be fetched based on the ID
const mockPAData = {
  id: 'PA-2025-0001',
  status: 'auto-processing' as const,
  confidence: 87,
  createdAt: '2025-01-25T10:30:00Z',
  updatedAt: '2025-01-25T14:22:00Z',
  patient: {
    name: 'Sarah Johnson',
    id: 'PT-789123',
    dateOfBirth: '1985-03-15',
    age: 39,
    gender: 'Female',
    address: '123 Main St, Austin, TX 78701',
    phone: '(555) 123-4567',
    conditions: ['Type 2 Diabetes', 'Obesity', 'BMI: 32.1']
  },
  medication: {
    name: 'Mounjaro',
    genericName: 'Tirzepatide',
    strength: '2.5mg/0.5mL',
    dosage: '2.5 mg subcutaneous injection once weekly',
    quantity: '4 pens (28-day supply)',
    ndc: '0002-1825-01',
    priority: 'T2D Priority'
  },
  provider: {
    name: 'Dr. Michael Chen',
    npi: '1234567890',
    clinic: 'Austin Diabetes Center',
    address: '456 Medical Blvd, Austin, TX 78705',
    phone: '(555) 987-6543'
  },
  payer: {
    name: 'Aetna',
    planName: 'Aetna Better Health',
    memberId: 'AET789123456',
    groupNumber: 'GRP001234',
    subscriberId: 'SUB789123'
  },
  attempt: {
    current: 1,
    total: 1,
    previousDenials: []
  },
  timeline: [
    { timestamp: '2025-01-25T10:30:00Z', event: 'PA Request Initiated', user: 'System', status: 'completed' },
    { timestamp: '2025-01-25T10:31:00Z', event: 'Insurance Verified', user: 'System', status: 'completed' },
    { timestamp: '2025-01-25T10:32:00Z', event: 'Clinical Data Extracted', user: 'OCR System', status: 'completed' },
    { timestamp: '2025-01-25T10:35:00Z', event: 'Clinical Questions Answered', user: 'GPT-4', status: 'completed' },
    { timestamp: '2025-01-25T10:40:00Z', event: 'Submitted to Payer', user: 'System', status: 'completed' },
    { timestamp: '2025-01-25T14:22:00Z', event: 'Status Update Received', user: 'Webhook', status: 'in-progress' }
  ],
  clinicalQuestions: [
    { question: 'Has the patient tried metformin?', answer: 'Yes, patient has been on metformin 1000mg BID for 18 months with inadequate glycemic control (A1C 8.2%)', confidence: 95 },
    { question: 'What is the patient\'s current BMI?', answer: '32.1 kg/m² (height: 165cm, weight: 87kg)', confidence: 98 },
    { question: 'Has the patient tried other GLP-1 agonists?', answer: 'Yes, patient tried semaglutide for 6 months but discontinued due to nausea and vomiting', confidence: 90 },
    { question: 'What is the patient\'s latest A1C?', answer: '8.2% (drawn on 01/15/2025)', confidence: 97 }
  ]
};

const statusConfig = {
  'needs-review': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Needs Review' },
  'auto-processing': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Auto Processing' },
  'auto-approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Auto Approved' },
  'denied': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Denied' }
} as const;

export default function PADetailPage({ params }: PADetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'timeline' | 'documents'>('overview');

  const StatusIcon = statusConfig[mockPAData.status].icon;

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mockPAData.id}</h1>
            <p className="text-gray-600">{mockPAData.patient.name} • {mockPAData.medication.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <StatusIcon className="w-5 h-5" />
            <Badge className={statusConfig[mockPAData.status].color}>
              {statusConfig[mockPAData.status].label}
            </Badge>
          </div>
          <Badge variant="secondary" className={
            mockPAData.confidence >= 90 ? 'bg-green-100 text-green-800' :
            mockPAData.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }>
            {mockPAData.confidence}% Confidence
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Details
        </Button>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'clinical', label: 'Clinical Questions' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'documents', label: 'Documents' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{mockPAData.patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-medium">{mockPAData.patient.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{mockPAData.patient.age}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium">{mockPAData.patient.gender}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conditions</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mockPAData.patient.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="text-sm text-gray-900">{mockPAData.patient.phone}</p>
                <p className="text-sm text-gray-500">{mockPAData.patient.address}</p>
              </div>
            </div>
          </Card>

          {/* Medication Information */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Pills className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Medication Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Brand Name</p>
                <p className="font-medium">{mockPAData.medication.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Generic Name</p>
                <p className="font-medium">{mockPAData.medication.genericName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Strength</p>
                <p className="font-medium">{mockPAData.medication.strength}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dosage</p>
                <p className="text-sm text-gray-900">{mockPAData.medication.dosage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-medium">{mockPAData.medication.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">NDC</p>
                <p className="font-medium">{mockPAData.medication.ndc}</p>
              </div>
              <div>
                <Badge className="bg-blue-100 text-blue-800">
                  {mockPAData.medication.priority}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Provider & Payer Information */}
          <div className="space-y-6">
            {/* Provider */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Provider</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{mockPAData.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NPI</p>
                  <p className="font-medium">{mockPAData.provider.npi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clinic</p>
                  <p className="text-sm text-gray-900">{mockPAData.provider.clinic}</p>
                  <p className="text-sm text-gray-500">{mockPAData.provider.address}</p>
                  <p className="text-sm text-gray-500">{mockPAData.provider.phone}</p>
                </div>
              </div>
            </Card>

            {/* Payer */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Insurance</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payer</p>
                  <p className="font-medium">{mockPAData.payer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium">{mockPAData.payer.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member ID</p>
                  <p className="font-medium">{mockPAData.payer.memberId}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Group #</p>
                    <p className="text-sm font-medium">{mockPAData.payer.groupNumber}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'clinical' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Clinical Questions & AI Responses</h3>
          <div className="space-y-4">
            {mockPAData.clinicalQuestions.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{item.question}</h4>
                  <Badge variant="secondary" className={
                    item.confidence >= 95 ? 'bg-green-100 text-green-800' :
                    item.confidence >= 85 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {item.confidence}%
                  </Badge>
                </div>
                <p className="text-gray-700">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Processing Timeline</h3>
          <Card className="p-6">
            <div className="space-y-6">
              {mockPAData.timeline.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{item.event}</p>
                      <p className="text-sm text-gray-500">{formatDate(item.timestamp)}</p>
                    </div>
                    <p className="text-sm text-gray-600">by {item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
          <Card className="p-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <Button variant="outline" className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}