export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      address: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          created_at: string | null
          patient_id: number
          state: string
          updated_address: boolean
          updated_address_at: string | null
          updated_at: string | null
          verified_address: boolean
          zip_code: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          created_at?: string | null
          patient_id: number
          state: string
          updated_address?: boolean
          updated_address_at?: string | null
          updated_at?: string | null
          verified_address?: boolean
          zip_code: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          created_at?: string | null
          patient_id?: number
          state?: string
          updated_address?: boolean
          updated_address_at?: string | null
          updated_at?: string | null
          verified_address?: boolean
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          case_id: string | null
          confidence: number | null
          description: string | null
          details: Json | null
          event_type: string
          id: string
          status: string
          timestamp: string
        }
        Insert: {
          case_id?: string | null
          confidence?: number | null
          description?: string | null
          details?: Json | null
          event_type: string
          id?: string
          status: string
          timestamp?: string
        }
        Update: {
          case_id?: string | null
          confidence?: number | null
          description?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      clinician: {
        Row: {
          created_at: string
          dosespot_provider_id: number | null
          id: number
          npi_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosespot_provider_id?: number | null
          id?: number
          npi_key: string
          updated_at: string
        }
        Update: {
          created_at?: string
          dosespot_provider_id?: number | null
          id?: number
          npi_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinician_note: {
        Row: {
          amended: boolean | null
          clinician_id: number | null
          created_at: string
          id: number
          note: string | null
          patient_id: number | null
          signed: boolean | null
          updated_at: string
          version: number | null
        }
        Insert: {
          amended?: boolean | null
          clinician_id?: number | null
          created_at?: string
          id?: number
          note?: string | null
          patient_id?: number | null
          signed?: boolean | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          amended?: boolean | null
          clinician_id?: number | null
          created_at?: string
          id?: number
          note?: string | null
          patient_id?: number | null
          signed?: boolean | null
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          calculated_at: string
          id: string
          metric_name: string
          metric_value: Json
        }
        Insert: {
          calculated_at?: string
          id?: string
          metric_name: string
          metric_value: Json
        }
        Update: {
          calculated_at?: string
          id?: string
          metric_name?: string
          metric_value?: Json
        }
        Relationships: []
      }
      dosage: {
        Row: {
          created_at: string
          dosage: string
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      insurance_policy: {
        Row: {
          canvas_coverage_id: string | null
          created_at: string | null
          id: number
          is_dependent: boolean
          member_id: string
          member_obligation: number | null
          out_of_network: boolean | null
          patient_id: number
          payer_id: number
          plan_name: string | null
          plan_status: string | null
          plan_type: string | null
          policy_type: Database["public"]["Enums"]["insurance_policy_type"]
          policyholder_first_name: string
          policyholder_last_name: string
          updated_at: string | null
        }
        Insert: {
          canvas_coverage_id?: string | null
          created_at?: string | null
          id?: number
          is_dependent: boolean
          member_id: string
          member_obligation?: number | null
          out_of_network?: boolean | null
          patient_id: number
          payer_id: number
          plan_name?: string | null
          plan_status?: string | null
          plan_type?: string | null
          policy_type?: Database["public"]["Enums"]["insurance_policy_type"]
          policyholder_first_name: string
          policyholder_last_name: string
          updated_at?: string | null
        }
        Update: {
          canvas_coverage_id?: string | null
          created_at?: string | null
          id?: number
          is_dependent?: boolean
          member_id?: string
          member_obligation?: number | null
          out_of_network?: boolean | null
          patient_id?: number
          payer_id?: number
          plan_name?: string | null
          plan_status?: string | null
          plan_type?: string | null
          policy_type?: Database["public"]["Enums"]["insurance_policy_type"]
          policyholder_first_name?: string
          policyholder_last_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
        ]
      }
      intake: {
        Row: {
          created_at: string
          id: number
          patient_id: number | null
          questionnaire_name: string | null
          response: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          patient_id?: number | null
          questionnaire_name?: string | null
          response?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          patient_id?: number | null
          questionnaire_name?: string | null
          response?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_history: {
        Row: {
          allergies: string | null
          created_at: string | null
          current_medications: string | null
          medical_conditions: string | null
          patient_id: number
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          medical_conditions?: string | null
          patient_id: number
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          medical_conditions?: string | null
          patient_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      medication: {
        Row: {
          created_at: string
          display_name: string | null
          id: number
          name: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: number
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: number
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_dosage: {
        Row: {
          active: boolean | null
          aps_drug_id: number | null
          created_at: string
          designator_id: string | null
          dosage_id: number | null
          dosespot_ndc: string | null
          id: number
          medication_id: number | null
          national_drug_code: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          aps_drug_id?: number | null
          created_at?: string
          designator_id?: string | null
          dosage_id?: number | null
          dosespot_ndc?: string | null
          id?: number
          medication_id?: number | null
          national_drug_code?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          aps_drug_id?: number | null
          created_at?: string
          designator_id?: string | null
          dosage_id?: number | null
          dosespot_ndc?: string | null
          id?: number
          medication_id?: number | null
          national_drug_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_quantity: {
        Row: {
          active: boolean | null
          created_at: string
          id: number
          medication_dosage_id: number | null
          price: number | null
          quantity_id: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: number
          medication_dosage_id?: number | null
          price?: number | null
          quantity_id?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: number
          medication_dosage_id?: number | null
          price?: number | null
          quantity_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      patient: {
        Row: {
          created_at: string
          dosespot_patient_id: number | null
          external_id: string | null
          has_verified_identity: boolean
          height: number | null
          id: number
          profile_id: number | null
          region: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          dosespot_patient_id?: number | null
          external_id?: string | null
          has_verified_identity?: boolean
          height?: number | null
          id?: number
          profile_id?: number | null
          region?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          dosespot_patient_id?: number | null
          external_id?: string | null
          has_verified_identity?: boolean
          height?: number | null
          id?: number
          profile_id?: number | null
          region?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "patient_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_diagnosis: {
        Row: {
          condition_external_id: string | null
          created_at: string | null
          ICD_10: string | null
          id: number
          name: string | null
          patient_id: number | null
          status: string | null
        }
        Insert: {
          condition_external_id?: string | null
          created_at?: string | null
          ICD_10?: string | null
          id?: number
          name?: string | null
          patient_id?: number | null
          status?: string | null
        }
        Update: {
          condition_external_id?: string | null
          created_at?: string | null
          ICD_10?: string | null
          id?: number
          name?: string | null
          patient_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnosis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_pharmacy: {
        Row: {
          created_at: string | null
          dosespot_pharmacy_id: number | null
          name: string | null
          patient_id: number
          pharmacy: string | null
        }
        Insert: {
          created_at?: string | null
          dosespot_pharmacy_id?: number | null
          name?: string | null
          patient_id: number
          pharmacy?: string | null
        }
        Update: {
          created_at?: string | null
          dosespot_pharmacy_id?: number | null
          name?: string | null
          patient_id?: number
          pharmacy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_pharmacy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_profile: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gender: string | null
          id: number
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payer: {
        Row: {
          created_at: string | null
          external_payer_id: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_payer_id: string
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_payer_id?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prescription: {
        Row: {
          clinician_id: number | null
          created_at: string
          dispense_quantity: number | null
          dosage_instructions: string | null
          dosespot_prescription_id: number | null
          dosespot_prescription_status: string | null
          duration_in_days: number | null
          expires_on: string | null
          id: number
          is_injectable: boolean | null
          medication: string | null
          medication_id: string | null
          national_drug_code: string | null
          note: string | null
          order_name: string | null
          patient_id: number | null
          pharmacy: string | null
          status: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          clinician_id?: number | null
          created_at?: string
          dispense_quantity?: number | null
          dosage_instructions?: string | null
          dosespot_prescription_id?: number | null
          dosespot_prescription_status?: string | null
          duration_in_days?: number | null
          expires_on?: string | null
          id?: number
          is_injectable?: boolean | null
          medication?: string | null
          medication_id?: string | null
          national_drug_code?: string | null
          note?: string | null
          order_name?: string | null
          patient_id?: number | null
          pharmacy?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          clinician_id?: number | null
          created_at?: string
          dispense_quantity?: number | null
          dosage_instructions?: string | null
          dosespot_prescription_id?: number | null
          dosespot_prescription_status?: string | null
          duration_in_days?: number | null
          expires_on?: string | null
          id?: number
          is_injectable?: boolean | null
          medication?: string | null
          medication_id?: string | null
          national_drug_code?: string | null
          note?: string | null
          order_name?: string | null
          patient_id?: number | null
          pharmacy?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescription_request: {
        Row: {
          clinician_id: number | null
          created_at: string
          dosespot_prescription_id: number | null
          id: number
          is_adjustment: boolean | null
          medication_quantity_id: number | null
          note: string | null
          number_of_month_requested: number | null
          patient_id: number | null
          quantity: number | null
          region: string | null
          specific_medication: string | null
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          clinician_id?: number | null
          created_at?: string
          dosespot_prescription_id?: number | null
          id?: number
          is_adjustment?: boolean | null
          medication_quantity_id?: number | null
          note?: string | null
          number_of_month_requested?: number | null
          patient_id?: number | null
          quantity?: number | null
          region?: string | null
          specific_medication?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          clinician_id?: number | null
          created_at?: string
          dosespot_prescription_id?: number | null
          id?: number
          is_adjustment?: boolean | null
          medication_quantity_id?: number | null
          note?: string | null
          number_of_month_requested?: number | null
          patient_id?: number | null
          quantity?: number | null
          region?: string | null
          specific_medication?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prior_auth: {
        Row: {
          attempt_count: number | null
          cmm_request_case_id: number | null
          created_at: string
          date_approved: string | null
          date_prescribed: string | null
          date_submitted: string | null
          dosespot_prescription_id: number | null
          id: number
          patient_id: number | null
          prescription_request_id: number | null
          priority: number | null
          rx_submitted: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number | null
          cmm_request_case_id?: number | null
          created_at?: string
          date_approved?: string | null
          date_prescribed?: string | null
          date_submitted?: string | null
          dosespot_prescription_id?: number | null
          id?: number
          patient_id?: number | null
          prescription_request_id?: number | null
          priority?: number | null
          rx_submitted?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number | null
          cmm_request_case_id?: number | null
          created_at?: string
          date_approved?: string | null
          date_prescribed?: string | null
          date_submitted?: string | null
          dosespot_prescription_id?: number | null
          id?: number
          patient_id?: number | null
          prescription_request_id?: number | null
          priority?: number | null
          rx_submitted?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quantity: {
        Row: {
          created_at: string
          id: number
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      team: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          plan_type: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_type?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_type?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitation: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          team_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          team_id?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          team_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_member_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_team_id: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          location: string | null
          onboarded_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_team_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          onboarded_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_team_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          onboarded_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: boolean
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_expired_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_team_with_owner: {
        Args: { owner_id?: string; team_name: string; team_slug: string }
        Returns: string
      }
      get_patients_for_clinical_engine: {
        Args: Record<PropertyKey, never>
        Returns: {
          conditions_count: number
          diff_dx_count: number
          encounter_id: string
          encounter_uuid: string
          first_name: string
          last_name: string
          patient_id: string
          transcript: string
          transcript_length: number
        }[]
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_guidelines: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      migrate_patient_alerts_to_unified_system: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      search_guidelines_text: {
        Args: { match_count?: number; search_query: string }
        Returns: {
          content: string
          id: number
          similarity: number
          source: string
          specialty: string
          title: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      insurance_policy_type: "Primary" | "Secondary"
      user_role: "admin" | "coordinator" | "user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      insurance_policy_type: ["Primary", "Secondary"],
      user_role: ["admin", "coordinator", "user", "viewer"],
    },
  },
} as const
