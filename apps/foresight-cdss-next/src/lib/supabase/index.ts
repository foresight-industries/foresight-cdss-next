// Main exports for Supabase with automatic Clerk authentication

// Server-side exports
export {
  createSupabaseServerClient,
  createAuthenticatedSupabaseClient,
  createSupabaseAdminClient,
  createSupabaseMiddlewareClient,
  getCurrentUser,
  supabaseAdmin
} from './server';

// Client-side exports
export {
  createClient,
  useSupabaseWithAuth,
  useSupabase,
  useSupabaseUser,
  supabase
} from './client';

// Type exports
export type { Database } from '@/types/database.types';

// Legacy table names export
export const Tables = {
  PRIOR_AUTH: 'prior_auth',
  PATIENT: 'patient',
  PATIENT_PROFILE: 'patient_profile',
  PATIENT_DIAGNOSIS: 'patient_diagnosis',
  MEDICATION: 'medication',
  MEDICATION_DOSAGE: 'medication_dosage',
  MEDICATION_QUANTITY: 'medication_quantity',
  PRESCRIPTION_REQUEST: 'prescription_request',
  TEAM_MEMBER: 'team_member',
  CLERK_USER_SYNC: 'clerk_user_sync',
  USER_PROFILE: 'user_profile',
  TEAM: 'team',
  AUDIT_LOG: 'audit_log'
} as const;