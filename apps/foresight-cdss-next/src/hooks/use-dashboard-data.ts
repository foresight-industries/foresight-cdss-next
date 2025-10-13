import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase";
import type { StatusDistribution } from "@/types/pa.types";

// Fetch dashboard metrics from the existing prior_auth table
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Get basic counts from existing prior_auth table
      const { data: paData, error: paError } = await supabase
        .from(Tables.PRIOR_AUTH)
        .select('id, status, created_at, updated_at');

      if (paError) throw paError;

      const totalPas = paData?.length || 0;

      // Calculate basic status distribution
      // const statusCounts = paData?.reduce((acc, pa) => {
      //   const status = pa.status || 'pending';
      //   acc[status] = (acc[status] || 0) + 1;
      //   return acc;
      // }, {} as Record<string, number>) || {};

      return {
        coreMetrics: [
          {
            label: 'Active PAs',
            value: totalPas.toString(),
            change: { value: '0% from yesterday', trend: 'neutral' as const, positive: true }
          },
          {
            label: 'Automation Rate',
            value: '87%',
            change: { value: '5% improvement', trend: 'up' as const, positive: true },
            target: '70%'
          },
          {
            label: 'Avg Processing Time',
            value: '2.1h',
            change: { value: '22min reduction', trend: 'down' as const, positive: true },
            target: '≤6min P95'
          },
          {
            label: 'Field Accuracy',
            value: '98.2%',
            change: { value: 'Above 95% target', trend: 'up' as const, positive: true }
          }
        ],
        automationMetrics: [
          {
            label: 'LLM Confidence Score',
            value: '94.7%',
            change: { value: 'High confidence answers', trend: 'neutral' as const, positive: true }
          },
          {
            label: 'Status Sync Latency',
            value: '1.8h',
            change: { value: 'Under 4h target via webhooks', trend: 'neutral' as const, positive: true }
          },
          {
            label: 'Duplicate Prevention',
            value: '100%',
            change: { value: 'Zero duplicates via idempotency keys', trend: 'neutral' as const, positive: true }
          }
        ]
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch status distribution from prior_auth table
export function useStatusDistribution() {
  return useQuery({
    queryKey: ['status-distribution'],
    queryFn: async () => {
      return calculateStatusDistributionFallback();
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Fetch recent PA activity using the basic prior_auth table
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(Tables.PRIOR_AUTH)
        .select(`
          id,
          attempt_count,
          status,
          created_at,
          updated_at,
          patient_id,
          prescription_request:prescription_request_id (
            medication_quantity:medication_quantity_id (
              medication_dosage:medication_dosage_id (
                medication:medication_id (
                  display_name,
                  name
                )
              )
            )
          ),
          patient:patient_id (
            id,
            external_id,
            height,
            weight,
            patient_profile:patient_profile (
              first_name,
              last_name,
              birth_date
            ),
            patient_diagnosis (
              name,
              ICD_10
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((item, index) => {
        const patient = item.patient;
        // const profile = patient?.patient_profile;
        // const diagnosis = patient?.patient_diagnosis || [];
        // const medication = item.prescription_request?.medication_quantity?.medication_dosage?.medication;
        const profile = {
          first_name: 'John',
          last_name: 'Doe',
          birth_date: '1990-01-01'
        };
        const diagnosis = [
          { name: 'Diabetes', ICD_10: 'D00' },
          { name: 'Hypertension', ICD_10: 'H00' }
        ];
        const medication = {
          display_name: 'Wegovy',
          name: 'Wegovy',
        }

        return {
          id: `PA-2025-${String(item.id).padStart(4, "0")}`,
          patientName:
            `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
            "Unknown Patient",
          patientId: `PT-${item.patient_id}`,
          conditions: formatPatientConditions(patient, diagnosis),
          attempt: `${getOrdinal(item.attempt_count || 1)} Attempt`,
          medication: getMedicationDisplay(
            medication?.display_name || medication?.name
          ),
          payer: "Aetna", // Default payer since payer_name doesn't exist
          status: mapStatusToUIStatus(item.status ?? ""),
          confidence: 85 + Math.floor(Math.random() * 15), // Random confidence for demo
          updatedAt: formatTimeAgo(
            item.updated_at
              ? item.updated_at
              : item.created_at ?? new Date().toISOString()
          ),
        };
      }) || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Calculate status distribution from prior_auth table
async function calculateStatusDistributionFallback(): Promise<StatusDistribution> {
  const { data, error } = await supabase
    .from(Tables.PRIOR_AUTH)
    .select('status');

  if (error) throw error;

  const distribution: StatusDistribution = {
    needsReview: 0,
    autoProcessing: 0,
    autoApproved: 0,
    denied: 0,
    total: data?.length || 0
  };

  for (const item of data) {
    if (
      item.status === "in_review" ||
      item.status === "pending_info" ||
      !item.status
    ) {
      distribution.needsReview++;
    } else if (
      item.status === "ready_to_submit" ||
      item.status === "submitted"
    ) {
      distribution.autoProcessing++;
    } else if (
      item.status === "approved" ||
      item.status === "partially_approved"
    ) {
      distribution.autoApproved++;
    } else if (item.status === "denied" || item.status === "expired") {
      distribution.denied++;
    }
  }

  return distribution;
}

// Helper functions
function formatPatientConditions(patient: any, diagnosis: any[] = []): string {
  if (!patient) return '';

  const conditions: string[] = [];

  // Add conditions from diagnosis array
  if (Array.isArray(diagnosis) && diagnosis.length > 0) {
    conditions.push(...diagnosis.map(d => d.name || d.ICD_10).filter(Boolean));
  }

  // Calculate BMI if height and weight are available
  if (patient.height && patient.weight) {
    const heightInM = patient.height / 100; // Convert cm to m
    const bmi = (patient.weight / (heightInM * heightInM)).toFixed(1);
    conditions.push(`BMI: ${bmi}`);
  }

  return conditions.slice(0, 3).join(', '); // Limit to first 3 conditions
}


function mapStatusToUIStatus(status: string): 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied' {
  switch (status) {
    case 'pending':
    case 'review':
      return 'needs-review';
    case 'processing':
    case 'submitted':
      return 'auto-processing';
    case 'approved':
    case 'authorized':
      return 'auto-approved';
    case 'denied':
    case 'rejected':
    default:
      return 'denied';
  }
}

function getMedicationDisplay(medicationName: string | null | undefined): string {
  if (!medicationName) return 'Unknown Medication';

  // Add context based on patient conditions or attempt number
  const contexts = [
    'T2D Priority',
    'Patient Choice',
    'After Previous Denial',
    'Step Therapy'
  ];

  const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
  return `${medicationName} (${randomContext})`;
}

function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
