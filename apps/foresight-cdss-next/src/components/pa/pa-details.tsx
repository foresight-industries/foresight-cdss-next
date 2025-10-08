'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Building2, Pill, FileText, AlertCircle, CheckCircle, XCircle, Download, Edit, MessageSquare, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PADetailsProps {
  paId: string;
  onClose?: () => void;
}

// Mock data - this would be fetched based on the ID in a real implementation
const getMockPAData = (id: string) => ({
  id: id,
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
});

const statusConfig = {
  'needs-review': { color: 'bg-yellow-50 text-yellow-900 border-yellow-200', icon: AlertCircle, label: 'Needs Review' },
  'auto-processing': { color: 'bg-blue-50 text-blue-900 border-blue-200', icon: Clock, label: 'Auto Processing' },
  'auto-approved': { color: 'bg-green-50 text-green-900 border-green-200', icon: CheckCircle, label: 'Auto Approved' },
  'denied': { color: 'bg-red-50 text-red-900 border-red-200', icon: XCircle, label: 'Denied' }
} as const;

export function PADetails({ paId, onClose }: PADetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'timeline' | 'documents'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [mockPAData, setMockPAData] = useState(() => getMockPAData(paId));
  const [editData, setEditData] = useState(mockPAData);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Array<{id: string; text: string; timestamp: string; user: string}>>([]);

  const StatusIcon = statusConfig[mockPAData.status].icon;

  // Update data when paId changes
  useEffect(() => {
    const newData = getMockPAData(paId);
    setMockPAData(newData);
    setEditData(newData);
  }, [paId]);

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
          <div>
            <h1 className="text-2xl font-bold">{mockPAData.id}</h1>
            <p className="text-muted-foreground">{mockPAData.patient.name} • {mockPAData.medication.name}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5" />
              <Badge variant="outline" className={statusConfig[mockPAData.status].color}>
                {statusConfig[mockPAData.status].label}
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
                  <p className="font-medium">{mockPAData.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{mockPAData.patient.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{mockPAData.patient.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{mockPAData.patient.gender}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conditions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mockPAData.patient.conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="text-sm">{mockPAData.patient.phone}</p>
                  <p className="text-sm text-muted-foreground">{mockPAData.patient.address}</p>
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
                  <p className="font-medium">{mockPAData.medication.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generic Name</p>
                  <p className="font-medium">{mockPAData.medication.genericName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strength</p>
                  <p className="font-medium">{mockPAData.medication.strength}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dosage</p>
                  <p className="text-sm">{mockPAData.medication.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{mockPAData.medication.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NDC</p>
                  <p className="font-medium">{mockPAData.medication.ndc}</p>
                </div>
                <div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {mockPAData.medication.priority}
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
                    <p className="font-medium">{mockPAData.provider.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NPI</p>
                    <p className="font-medium">{mockPAData.provider.npi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clinic</p>
                    <p className="text-sm">{mockPAData.provider.clinic}</p>
                    <p className="text-sm text-muted-foreground">{mockPAData.provider.address}</p>
                    <p className="text-sm text-muted-foreground">{mockPAData.provider.phone}</p>
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
                    <p className="font-medium">{mockPAData.payer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{mockPAData.payer.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member ID</p>
                    <p className="font-medium">{mockPAData.payer.memberId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Group #</p>
                    <p className="text-sm font-medium">{mockPAData.payer.groupNumber}</p>
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
              {mockPAData.clinicalQuestions.map((item, index) => (
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
                  {mockPAData.timeline.map((item, index) => (
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
                setMockPAData(editData);
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
