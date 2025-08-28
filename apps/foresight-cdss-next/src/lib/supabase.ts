import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Since this is a dashboard app, we might not need session persistence
  },
});

// Type-safe table names based on actual schema
export const Tables = {
  PATIENT: 'patient' as const,
  PATIENT_PROFILE: 'patient_profile' as const,
  INSURANCE_POLICY: 'insurance_policy' as const,
  PAYER: 'payer' as const,
  PRIOR_AUTH: 'prior_auth' as const,
  PRESCRIPTION_REQUEST: 'prescription_request' as const,
  PRESCRIPTION: 'prescription' as const,
  CLINICIAN: 'clinician' as const,
  MEDICATION: 'medication' as const,
  PATIENT_DIAGNOSIS: 'patient_diagnosis' as const,
  CLINICIAN_NOTE: 'clinician_note' as const,
} as const;
