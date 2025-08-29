// Re-export client functions for convenience
export { createClient, supabase } from './supabase/client';
// Note: Server functions are in ./supabase/server.ts - import directly when needed

// Type-safe table names based on actual schema
export const Tables = {
  PATIENT: 'patient' as const,
  PATIENT_PROFILE: 'patient_profile' as const,
  USER_PROFILE: 'user_profile' as const,
  TEAM: 'team' as const,
  TEAM_MEMBER: 'team_member' as const,
  TEAM_INVITATION: 'team_invitation' as const,
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
