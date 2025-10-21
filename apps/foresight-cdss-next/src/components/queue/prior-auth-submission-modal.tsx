'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Pill,
  Brain,
  Send,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  History,
  ClipboardList,
  Shield,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PriorAuthAutomation,
  type AutomationResult,
  type DosespotRequirements,
  type PatientData,
  type ProviderData,
  type PayerData,
  getSubmissionStrategy,
  generateSubmissionSummary
} from '@/lib/prior-auth-automation';

// ============================================================================
// TYPES
// ============================================================================

interface PriorAuthSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  priorAuthItem: {
    id: string;
    patientName: string;
    medication: string;
    payer: string;
    status: string;
    dosespotCaseId?: number;
    // Add other queue item properties as needed
  };
  onSubmissionComplete: (result: any) => void;
}

interface DosespotQuestion {
  QuestionId: number;
  QuestionText: string;
  AnswerType: 'Select' | 'Multiselect' | 'FreeText' | 'Numeric' | 'Date';
  AnswerChoices?: Array<{
    QuestionChoiceId: number;
    QuestionChoiceText: string;
  }>;
  Required: boolean;
}

interface QuestionAnswer {
  questionId: number;
  answerType: string;
  answer: any;
  answerText?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PriorAuthSubmissionModal({
  open,
  onClose,
  priorAuthItem,
  onSubmissionComplete
}: PriorAuthSubmissionModalProps) {
  const [currentStep, setCurrentStep] = useState<'analysis' | 'review' | 'questions' | 'submission'>('analysis');
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);
  const [dosespotRequirements, setDosespotRequirements] = useState<DosespotRequirements | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dosespotQuestions, setDosespotQuestions] = useState<DosespotQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mock data - in real implementation, fetch from API
  const mockPatientData: PatientData | null = priorAuthItem ? {
    id: priorAuthItem.id,
    firstName: priorAuthItem.patientName.split(' ')[0],
    lastName: priorAuthItem.patientName.split(' ')[1] || '',
    dateOfBirth: '1985-06-15',
    diagnosisCodes: ['E11.9', 'E66.9'],
    currentMedications: ['Metformin 1000mg'],
    allergies: ['NKDA'],
    medicalHistory: ['Type 2 Diabetes', 'Obesity']
  } : null;

  const mockProviderData: ProviderData = {
    id: 'provider-1',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    npi: '1234567890',
    specialties: ['Endocrinology', 'Internal Medicine'],
    dosespotProviderId: 12345
  };

  const mockPayerData: PayerData | null = priorAuthItem ? {
    id: 'payer-1',
    name: priorAuthItem.payer,
    requiresDoseSpot: priorAuthItem.dosespotCaseId ? true : false,
    commonRequirements: ['Medical necessity', 'Prior treatments tried'],
    typicalProcessingDays: 3
  } : null;

  // Initialize automation analysis
  useEffect(() => {
    if (open && !automationResult && priorAuthItem && mockPatientData && mockPayerData) {
      analyzeAutomation();
    }
  }, [open, priorAuthItem]);

  const analyzeAutomation = async () => {
    if (!priorAuthItem || !mockPatientData || !mockPayerData) return;

    setLoading(true);
    try {
      // Analyze automation potential
      const result = await PriorAuthAutomation.analyzePriorAuth(
        mockPatientData,
        mockProviderData,
        mockPayerData,
        priorAuthItem.medication,
        mockPatientData.diagnosisCodes
      );

      // Check DoseSpot requirements
      const dosespotReq = await PriorAuthAutomation.checkDosespotRequirements(
        mockPayerData,
        priorAuthItem.medication,
        priorAuthItem.dosespotCaseId
      );

      setAutomationResult(result);
      setDosespotRequirements(dosespotReq);
      setFormData(result.preFilled);

      // If DoseSpot questions needed, fetch them
      if (dosespotReq.requiresQuestionnaire && priorAuthItem.dosespotCaseId) {
        await fetchDosespotQuestions();
      }

      setCurrentStep('review');
    } catch (error) {
      console.error('Error analyzing automation:', error);
      toast.error('Failed to analyze prior authorization requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchDosespotQuestions = async () => {
    try {
      // Mock DoseSpot questions - in real implementation, fetch from API
      const mockQuestions: DosespotQuestion[] = [
        {
          QuestionId: 1,
          QuestionText: "What is the patient's current HbA1c level?",
          AnswerType: 'Numeric',
          Required: true
        },
        {
          QuestionId: 2,
          QuestionText: "Has the patient tried Metformin?",
          AnswerType: 'Select',
          AnswerChoices: [
            { QuestionChoiceId: 1, QuestionChoiceText: 'Yes, currently taking' },
            { QuestionChoiceId: 2, QuestionChoiceText: 'Yes, previously tried' },
            { QuestionChoiceId: 3, QuestionChoiceText: 'No, contraindicated' },
            { QuestionChoiceId: 4, QuestionChoiceText: 'No, not tried' }
          ],
          Required: true
        },
        {
          QuestionId: 3,
          QuestionText: "Date of last diabetes education visit:",
          AnswerType: 'Date',
          Required: false
        },
        {
          QuestionId: 4,
          QuestionText: "Additional clinical notes:",
          AnswerType: 'FreeText',
          Required: false
        }
      ];

      setDosespotQuestions(mockQuestions);
    } catch (error) {
      console.error('Error fetching DoseSpot questions:', error);
      toast.error('Failed to load questionnaire');
    }
  };

  const submissionStrategy = useMemo(() => {
    if (!automationResult || !dosespotRequirements) return 'manual';
    return getSubmissionStrategy(automationResult, dosespotRequirements);
  }, [automationResult, dosespotRequirements]);

  // const handleFormChange = (field: string, value: any) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

  const handleQuestionAnswer = (questionId: number, answerType: string, answer: any, answerText?: string) => {
    setQuestionAnswers(prev => {
      const existing = prev.findIndex(qa => qa.questionId === questionId);
      const newAnswer = { questionId, answerType, answer, answerText };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      } else {
        return [...prev, newAnswer];
      }
    });
  };

  const canProceedToNextQuestion = () => {
    const currentQuestion = dosespotQuestions[currentQuestionIndex];
    if (!currentQuestion?.Required) return true;

    const hasAnswer = questionAnswers.some(qa => qa.questionId === currentQuestion.QuestionId);
    return hasAnswer;
  };

  const handleSubmission = async () => {
    setSubmitting(true);
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        dosespotAnswers: questionAnswers,
        automationMetadata: {
          strategy: submissionStrategy,
          confidence: automationResult?.estimatedApprovalChance,
          riskFactors: automationResult?.riskFactors
        }
      };

      // Submit to API
      const response = await fetch('/api/prior-auth/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Prior authorization submitted successfully!');
        onSubmissionComplete(result);
        onClose();
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit prior authorization');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAnalysisStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Analyzing Prior Authorization</h3>
        <p className="text-gray-600">Evaluating automation potential and requirements...</p>
      </div>

      <Progress value={loading ? 50 : 100} className="w-full" />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm">Patient data analyzed</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm">Provider compatibility checked</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm">Payer requirements evaluated</span>
        </div>
        {dosespotRequirements?.requiresQuestionnaire && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm">DoseSpot questionnaire requirements checked</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Automation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Automation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Submission Strategy:</span>
            <Badge variant={submissionStrategy === 'auto' ? 'default' : submissionStrategy === 'guided' ? 'secondary' : 'destructive'}>
              {submissionStrategy.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Approval Confidence:</span>
            <span className="font-semibold">{automationResult?.estimatedApprovalChance}%</span>
          </div>

          <p className="text-sm text-gray-600">
            {generateSubmissionSummary(automationResult!, dosespotRequirements!)}
          </p>
        </CardContent>
      </Card>

      {/* Clinical Context Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Clinical Context & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <div className="relative">
              <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap">
                <TabsTrigger value="overview" className="flex-shrink-0 text-sm">Overview</TabsTrigger>
                <TabsTrigger value="history" className="flex-shrink-0 text-sm">Med History</TabsTrigger>
                <TabsTrigger value="pending" className="flex-shrink-0 text-sm">Pending</TabsTrigger>
                <TabsTrigger value="eligibility" className="flex-shrink-0 text-sm">Eligibility</TabsTrigger>
                <TabsTrigger value="formulary" className="flex-shrink-0 text-sm">Formulary</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Patient Demographics</Label>
                  <div className="space-y-1 mt-1">
                    <p className="font-medium">{mockPatientData?.firstName} {mockPatientData?.lastName}</p>
                    <p className="text-sm text-gray-500">DOB: {mockPatientData?.dateOfBirth}</p>
                    <p className="text-sm text-gray-500">Allergies: {mockPatientData?.allergies.join(', ')}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Current Conditions</Label>
                  <div className="space-y-1 mt-1">
                    {mockPatientData?.medicalHistory.map((condition, i) => (
                      <p key={i} className="text-sm">{condition}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Current Medications</Label>
                  <div className="space-y-1 mt-1">
                    {mockPatientData?.currentMedications.map((med, i) => (
                      <p key={i} className="text-sm">{med}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Provider Information</Label>
                  <div className="space-y-1 mt-1">
                    <p className="font-medium">{mockProviderData.firstName} {mockProviderData.lastName}</p>
                    <p className="text-sm text-gray-500">NPI: {mockProviderData.npi}</p>
                    <p className="text-sm text-gray-500">Specialties: {mockProviderData.specialties.join(', ')}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4" />
                <span className="font-medium">Medication History</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Recent medication history helps justify the need for new treatment:</p>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-sm">Metformin 1000mg</p>
                    <p className="text-xs text-gray-500">Active • Started 6 months ago</p>
                    <p className="text-xs text-gray-500">Indication: Type 2 Diabetes</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-sm">Metformin 500mg</p>
                    <p className="text-xs text-gray-500">Discontinued • 7 months ago</p>
                    <p className="text-xs text-gray-500">Reason: Dose escalation needed</p>
                  </div>
                </div>
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Current monotherapy showing inadequate glycemic control. Combination therapy or alternative agent indicated.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4" />
                <span className="font-medium">Pending Prescriptions</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Prescriptions awaiting prior authorization:</p>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-medium text-sm">{priorAuthItem.medication}</p>
                    <p className="text-xs text-gray-500">Status: Pending Prior Authorization</p>
                    <p className="text-xs text-gray-500">Quantity: 90 day supply</p>
                    <p className="text-xs text-gray-500">Prescriber: {mockProviderData.firstName} {mockProviderData.lastName}</p>
                  </div>
                </div>
                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This prescription requires prior authorization before it can be dispensed. Completing this submission will enable patient access to therapy.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="eligibility" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Insurance Eligibility</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Patient insurance verification:</p>
                <div className="bg-white p-3 rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Payer</Label>
                      <p className="font-medium">{priorAuthItem.payer}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Member ID</Label>
                      <p className="font-medium">••••••1234</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Coverage Status</Label>
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600">Copay Tier</Label>
                      <p className="font-medium">Tier 2 - Preferred Brand</p>
                    </div>
                  </div>
                </div>
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Patient eligibility verified. Coverage active with prior authorization requirement for requested medication.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="formulary" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4" />
                <span className="font-medium">Formulary Coverage</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Medication coverage information:</p>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{priorAuthItem.medication}</p>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Prior Auth Required</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <Label className="text-gray-600">Formulary Status</Label>
                        <p>Tier 2 - Non-Preferred</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Patient Cost</Label>
                        <p>$45 copay (after PA approval)</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Coverage Criteria</Label>
                        <p>Step therapy, medical necessity</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Alternatives</Label>
                        <p>3 preferred alternatives available</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-medium text-sm mb-1">Step Therapy Requirements</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Trial of Metformin (completed)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>HbA1c &gt;7% despite therapy (documented)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Provider specialty appropriate (endocrinology)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    All step therapy requirements appear to be met. Prior authorization should be approved based on clinical criteria.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {(automationResult?.riskFactors?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {automationResult?.riskFactors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pre-filled Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pre-filled Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Request Date</Label>
              <p className="font-medium">{formData.requestDate}</p>
            </div>
            <div>
              <Label className="text-gray-600">Requested Service</Label>
              <p className="font-medium">{formData.requestedService}</p>
            </div>
            <div>
              <Label className="text-gray-600">Diagnosis Codes</Label>
              <p className="font-medium">{JSON.parse(formData.diagnosisCodes || '[]').join(', ')}</p>
            </div>
            <div>
              <Label className="text-gray-600">Submission Method</Label>
              <p className="font-medium">{formData.submissionMethod}</p>
            </div>
          </div>

          {formData.clinicalNotes && (
            <div>
              <Label className="text-gray-600">Clinical Notes (Preview)</Label>
              <p className="text-sm bg-gray-50 p-3 rounded max-h-24 overflow-y-auto">
                {formData.clinicalNotes.substring(0, 200)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Required */}
      {(automationResult?.requiresManualInput?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Manual Input Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {automationResult?.requiresManualInput.map((field, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="capitalize">{field.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* DoseSpot Requirements */}
      {dosespotRequirements?.requiresQuestionnaire && (
        <Alert>
          <Pill className="h-4 w-4" />
          <AlertDescription>
            This payer requires DoseSpot questionnaire completion (~{dosespotRequirements.estimatedQuestions} questions).
            You&apos;ll be guided through the questions in the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderQuestionsStep = () => {
    if (!dosespotQuestions.length) return null;

    const currentQuestion = dosespotQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / dosespotQuestions.length) * 100;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DoseSpot Questionnaire</h3>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {dosespotQuestions.length}
          </span>
        </div>

        <Progress value={progress} className="w-full" />

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  {currentQuestion.QuestionText}
                  {currentQuestion.Required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>

              <DosespotQuestionInput
                question={currentQuestion}
                onAnswer={(answer, answerText) =>
                  handleQuestionAnswer(currentQuestion.QuestionId, currentQuestion.AnswerType, answer, answerText)
                }
                currentAnswer={questionAnswers.find(qa => qa.questionId === currentQuestion.QuestionId)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={() => {
              if (currentQuestionIndex === dosespotQuestions.length - 1) {
                setCurrentStep('submission');
              } else {
                setCurrentQuestionIndex(prev => prev + 1);
              }
            }}
            disabled={!canProceedToNextQuestion()}
          >
            {currentQuestionIndex === dosespotQuestions.length - 1 ? 'Review & Submit' : 'Next'}
            {currentQuestionIndex < dosespotQuestions.length - 1 && (
              <ChevronRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderSubmissionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Ready for Submission</h3>
        <p className="text-gray-600">Review the final summary before submitting</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Patient</Label>
              <p className="font-medium">{priorAuthItem.patientName}</p>
            </div>
            <div>
              <Label className="text-gray-600">Medication</Label>
              <p className="font-medium">{priorAuthItem.medication}</p>
            </div>
            <div>
              <Label className="text-gray-600">Payer</Label>
              <p className="font-medium">{priorAuthItem.payer}</p>
            </div>
            <div>
              <Label className="text-gray-600">Strategy</Label>
              <Badge variant={submissionStrategy === 'auto' ? 'default' : 'secondary'}>
                {submissionStrategy.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-gray-600">Completion Status</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Clinical information reviewed</span>
              </div>
              {dosespotRequirements?.requiresQuestionnaire && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">DoseSpot questionnaire completed ({questionAnswers.length} answers)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Approval confidence: {automationResult?.estimatedApprovalChance}%</span>
              </div>
            </div>
          </div>

          {(automationResult?.recommendations?.length ?? 0) > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-gray-600">Recommendations</Label>
                <ul className="mt-2 space-y-1">
                  {automationResult?.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (dosespotRequirements?.requiresQuestionnaire) {
              setCurrentStep('questions');
            } else {
              setCurrentStep('review');
            }
          }}
          disabled={submitting}
        >
          Back to Review
        </Button>
        <Button
          onClick={handleSubmission}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : 'Submit Prior Authorization'}
        </Button>
      </div>
    </div>
  );

  if (!open || !priorAuthItem) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prior Authorization Submission</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Header */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{priorAuthItem.patientName}</h3>
                  <p className="text-sm text-gray-600">{priorAuthItem.medication} • {priorAuthItem.payer}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          {currentStep === 'analysis' && renderAnalysisStep()}
          {currentStep === 'review' && renderReviewStep()}
          {currentStep === 'questions' && renderQuestionsStep()}
          {currentStep === 'submission' && renderSubmissionStep()}

          {/* Navigation (for review step) */}
          {currentStep === 'review' && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (dosespotRequirements?.requiresQuestionnaire) {
                    setCurrentStep('questions');
                  } else {
                    setCurrentStep('submission');
                  }
                }}
              >
                {dosespotRequirements?.requiresQuestionnaire ? 'Answer Questions' : 'Proceed to Submit'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DOSESPOT QUESTION INPUT COMPONENT
// ============================================================================

interface DosespotQuestionInputProps {
  question: DosespotQuestion;
  onAnswer: (answer: any, answerText?: string) => void;
  currentAnswer?: QuestionAnswer;
}

function DosespotQuestionInput({ question, onAnswer, currentAnswer }: Readonly<DosespotQuestionInputProps>) {
  const [textValue, setTextValue] = useState(currentAnswer?.answer || '');
  const [dateValue, setDateValue] = useState<Date | undefined>(
    currentAnswer?.answer ? new Date(currentAnswer.answer) : undefined
  );
  const [multiSelectValues, setMultiSelectValues] = useState<number[]>(
    currentAnswer?.answer || []
  );

  const handleTextChange = (value: string) => {
    setTextValue(value);
    onAnswer(value);
  };

  const handleDateChange = (date: Date | undefined) => {
    setDateValue(date);
    if (date) {
      onAnswer(date.toISOString());
    }
  };

  const handleSelectChange = (choiceId: string) => {
    const choice = question.AnswerChoices?.find(c => c.QuestionChoiceId === parseInt(choiceId));
    onAnswer(parseInt(choiceId), choice?.QuestionChoiceText);
  };

  const handleMultiSelectChange = (choiceId: number, checked: boolean) => {
    let newValues: number[];
    if (checked) {
      newValues = [...multiSelectValues, choiceId];
    } else {
      newValues = multiSelectValues.filter(id => id !== choiceId);
    }
    setMultiSelectValues(newValues);
    onAnswer(newValues);
  };

  switch (question.AnswerType) {
    case 'Select':
      return (
        <Select value={currentAnswer?.answer?.toString()} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.AnswerChoices?.map(choice => (
              <SelectItem key={choice.QuestionChoiceId} value={choice.QuestionChoiceId.toString()}>
                {choice.QuestionChoiceText}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'Multiselect':
      return (
        <div className="space-y-2">
          {question.AnswerChoices?.map(choice => (
            <div key={choice.QuestionChoiceId} className="flex items-center space-x-2">
              <Checkbox
                id={`choice-${choice.QuestionChoiceId}`}
                checked={multiSelectValues.includes(choice.QuestionChoiceId)}
                onCheckedChange={(checked) =>
                  handleMultiSelectChange(choice.QuestionChoiceId, checked as boolean)
                }
              />
              <Label htmlFor={`choice-${choice.QuestionChoiceId}`}>
                {choice.QuestionChoiceText}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'FreeText':
      return (
        <Textarea
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter your response..."
          rows={4}
        />
      );

    case 'Numeric':
      return (
        <Input
          type="number"
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter a number..."
        />
      );

    case 'Date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateChange}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      );

    default:
      return <div>Unsupported question type</div>;
  }
}
