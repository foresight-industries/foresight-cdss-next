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
    PostgrestVersion: "13.0.5"
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
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "address_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "address_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      adjustment_reason_code: {
        Row: {
          action_required: boolean | null
          category: string | null
          code: string
          code_type: string
          created_at: string | null
          description: string
        }
        Insert: {
          action_required?: boolean | null
          category?: string | null
          code: string
          code_type: string
          created_at?: string | null
          description: string
        }
        Update: {
          action_required?: boolean | null
          category?: string | null
          code?: string
          code_type?: string
          created_at?: string | null
          description?: string
        }
        Relationships: []
      }
      analytics_event: {
        Row: {
          created_at: string | null
          event_category: string | null
          event_data: Json | null
          event_name: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          team_id: string
          team_member_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          team_id: string
          team_member_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          team_id?: string
          team_member_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_event_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_event_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "analytics_event_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_event_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
        ]
      }
      api_key: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string | null
          last_used_at: string | null
          name: string | null
          rate_limit: number | null
          scopes: Json | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          rate_limit?: number | null
          scopes?: Json | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          rate_limit?: number | null
          scopes?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "api_key_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      api_version: {
        Row: {
          changes: Json | null
          created_at: string | null
          deprecated_at: string | null
          release_date: string
          sunset_at: string | null
          version: string
        }
        Insert: {
          changes?: Json | null
          created_at?: string | null
          deprecated_at?: string | null
          release_date: string
          sunset_at?: string | null
          version: string
        }
        Update: {
          changes?: Json | null
          created_at?: string | null
          deprecated_at?: string | null
          release_date?: string
          sunset_at?: string | null
          version?: string
        }
        Relationships: []
      }
      appeal: {
        Row: {
          appeal_letter_path: string | null
          appeal_level: number | null
          appeal_type: string | null
          claim_id: string | null
          created_at: string | null
          created_by: string | null
          decision: string | null
          decision_date: string | null
          denial_tracking_id: string | null
          id: string
          notes: string | null
          recovered_amount: number | null
          response_due_date: string | null
          status: string | null
          submission_date: string | null
          supporting_docs: Json | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          appeal_letter_path?: string | null
          appeal_level?: number | null
          appeal_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision?: string | null
          decision_date?: string | null
          denial_tracking_id?: string | null
          id?: string
          notes?: string | null
          recovered_amount?: number | null
          response_due_date?: string | null
          status?: string | null
          submission_date?: string | null
          supporting_docs?: Json | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          appeal_letter_path?: string | null
          appeal_level?: number | null
          appeal_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision?: string | null
          decision_date?: string | null
          denial_tracking_id?: string | null
          id?: string
          notes?: string | null
          recovered_amount?: number | null
          response_due_date?: string | null
          status?: string | null
          submission_date?: string | null
          supporting_docs?: Json | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appeal_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "appeal_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "appeal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "appeal_denial_tracking_id_fkey"
            columns: ["denial_tracking_id"]
            isOneToOne: false
            referencedRelation: "denial_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      appointment: {
        Row: {
          appointment_type: string | null
          checked_in_at: string | null
          confirmation_sent_at: string | null
          created_at: string | null
          duration_minutes: number | null
          encounter_created: boolean | null
          encounter_id: string | null
          id: string
          notes: string | null
          patient_id: number | null
          provider_id: number | null
          reminder_sent_at: string | null
          scheduled_date: string
          scheduled_time: string
          service_location_id: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          checked_in_at?: string | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          encounter_created?: boolean | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          provider_id?: number | null
          reminder_sent_at?: string | null
          scheduled_date: string
          scheduled_time: string
          service_location_id?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          checked_in_at?: string | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          encounter_created?: boolean | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          provider_id?: number | null
          reminder_sent_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_location_id?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointment_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "appointment_service_location_id_fkey"
            columns: ["service_location_id"]
            isOneToOne: false
            referencedRelation: "service_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string | null
          table_name: string
          team_id: string | null
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
          team_id?: string | null
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
          team_id?: string | null
        }
        Relationships: []
      }
      automation_event: {
        Row: {
          case_id: string
          case_type: string
          confidence: number | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_type: string
          id: string
          status: string
          team_id: string | null
          timestamp: string
        }
        Insert: {
          case_id: string
          case_type: string
          confidence?: number | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type: string
          id: string
          status: string
          team_id?: string | null
          timestamp: string
        }
        Update: {
          case_id?: string
          case_type?: string
          confidence?: number | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          status?: string
          team_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_event_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_event_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      automation_retry: {
        Row: {
          attempt_number: number | null
          automation_type: string
          backoff_strategy: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number | null
          metadata: Json | null
          next_retry_at: string | null
          status: string | null
          team_id: string
        }
        Insert: {
          attempt_number?: number | null
          automation_type: string
          backoff_strategy?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          status?: string | null
          team_id: string
        }
        Update: {
          attempt_number?: number | null
          automation_type?: string
          backoff_strategy?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_retry_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_retry_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      automation_rule: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          team_id: string
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          team_id: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          team_id?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      batch_job: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_log: Json | null
          failed_items: number | null
          id: string
          job_type: string | null
          parameters: Json | null
          processed_items: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          successful_items: number | null
          team_id: string
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_items?: number | null
          id?: string
          job_type?: string | null
          parameters?: Json | null
          processed_items?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          team_id: string
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_items?: number | null
          id?: string
          job_type?: string | null
          parameters?: Json | null
          processed_items?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          team_id?: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_job_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_job_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "batch_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      batch_job_item: {
        Row: {
          batch_job_id: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          processing_result: Json | null
          status: string | null
        }
        Insert: {
          batch_job_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processing_result?: Json | null
          status?: string | null
        }
        Update: {
          batch_job_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processing_result?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_job_item_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "batch_job"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits_coverage: {
        Row: {
          coinsurance_percent: number | null
          copay_amount: number | null
          covered: boolean | null
          cpt_code: string | null
          created_at: string | null
          deductible_applies: boolean | null
          effective_date: string | null
          frequency_limit: string | null
          id: string
          max_units: number | null
          notes: string | null
          payer_id: number | null
          plan_name: string | null
          requires_prior_auth: boolean | null
          team_id: string
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          coinsurance_percent?: number | null
          copay_amount?: number | null
          covered?: boolean | null
          cpt_code?: string | null
          created_at?: string | null
          deductible_applies?: boolean | null
          effective_date?: string | null
          frequency_limit?: string | null
          id?: string
          max_units?: number | null
          notes?: string | null
          payer_id?: number | null
          plan_name?: string | null
          requires_prior_auth?: boolean | null
          team_id: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          coinsurance_percent?: number | null
          copay_amount?: number | null
          covered?: boolean | null
          cpt_code?: string | null
          created_at?: string | null
          deductible_applies?: boolean | null
          effective_date?: string | null
          frequency_limit?: string | null
          id?: string
          max_units?: number | null
          notes?: string | null
          payer_id?: number | null
          plan_name?: string | null
          requires_prior_auth?: boolean | null
          team_id?: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_coverage_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_coverage_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "benefits_coverage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_coverage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      business_rule: {
        Row: {
          applies_to_cpts: string[] | null
          applies_to_payers: number[] | null
          created_at: string | null
          description: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_category: string | null
          rule_logic: Json
          rule_name: string
          team_id: string | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to_cpts?: string[] | null
          applies_to_payers?: number[] | null
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_category?: string | null
          rule_logic: Json
          rule_name: string
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to_cpts?: string[] | null
          applies_to_payers?: number[] | null
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_category?: string | null
          rule_logic?: Json
          rule_name?: string
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      claim: {
        Row: {
          accepted_at: string | null
          attempt_count: number | null
          auto_submitted: boolean | null
          claim_number: string | null
          confidence: number | null
          created_at: string | null
          encounter_id: string
          field_confidences: Json | null
          id: string
          issues: string[] | null
          meta: Json | null
          paid_amount: number | null
          paid_at: string | null
          payer_id: number
          rejected_at: string | null
          status: string
          submitted_at: string | null
          suggested_fixes: Json[] | null
          team_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          attempt_count?: number | null
          auto_submitted?: boolean | null
          claim_number?: string | null
          confidence?: number | null
          created_at?: string | null
          encounter_id: string
          field_confidences?: Json | null
          id: string
          issues?: string[] | null
          meta?: Json | null
          paid_amount?: number | null
          paid_at?: string | null
          payer_id: number
          rejected_at?: string | null
          status: string
          submitted_at?: string | null
          suggested_fixes?: Json[] | null
          team_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          attempt_count?: number | null
          auto_submitted?: boolean | null
          claim_number?: string | null
          confidence?: number | null
          created_at?: string | null
          encounter_id?: string
          field_confidences?: Json | null
          id?: string
          issues?: string[] | null
          meta?: Json | null
          paid_amount?: number | null
          paid_at?: string | null
          payer_id?: number
          rejected_at?: string | null
          status?: string
          submitted_at?: string | null
          suggested_fixes?: Json[] | null
          team_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      claim_attachment: {
        Row: {
          attachment_control_number: string | null
          attachment_type: string | null
          claim_id: string | null
          created_at: string | null
          file_path: string | null
          file_size: number | null
          id: string
          page_count: number | null
          sent_at: string | null
          sent_method: string | null
          team_id: string
        }
        Insert: {
          attachment_control_number?: string | null
          attachment_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          page_count?: number | null
          sent_at?: string | null
          sent_method?: string | null
          team_id: string
        }
        Update: {
          attachment_control_number?: string | null
          attachment_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          page_count?: number | null
          sent_at?: string | null
          sent_method?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_attachment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_attachment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_attachment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_attachment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_attachment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_attachment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      claim_line: {
        Row: {
          adjustment_amount: number | null
          allowed_amount: number | null
          charge_amount: number
          claim_id: string
          cpt_code: string
          created_at: string | null
          diagnosis_pointers: number[] | null
          id: string
          line_number: number
          modifiers: string[] | null
          paid_amount: number | null
          patient_responsibility: number | null
          place_of_service: string | null
          revenue_code: string | null
          service_date: string
          status: string | null
          team_id: string
          units: number | null
        }
        Insert: {
          adjustment_amount?: number | null
          allowed_amount?: number | null
          charge_amount: number
          claim_id: string
          cpt_code: string
          created_at?: string | null
          diagnosis_pointers?: number[] | null
          id?: string
          line_number: number
          modifiers?: string[] | null
          paid_amount?: number | null
          patient_responsibility?: number | null
          place_of_service?: string | null
          revenue_code?: string | null
          service_date: string
          status?: string | null
          team_id: string
          units?: number | null
        }
        Update: {
          adjustment_amount?: number | null
          allowed_amount?: number | null
          charge_amount?: number
          claim_id?: string
          cpt_code?: string
          created_at?: string | null
          diagnosis_pointers?: number[] | null
          id?: string
          line_number?: number
          modifiers?: string[] | null
          paid_amount?: number | null
          patient_responsibility?: number | null
          place_of_service?: string | null
          revenue_code?: string | null
          service_date?: string
          status?: string | null
          team_id?: string
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_line_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_line_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_line_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_line_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_line_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_line_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      claim_state_history: {
        Row: {
          actor: string
          at: string
          claim_id: string
          created_at: string | null
          details: Json | null
          id: string
          state: string
        }
        Insert: {
          actor: string
          at: string
          claim_id: string
          created_at?: string | null
          details?: Json | null
          id: string
          state: string
        }
        Update: {
          actor?: string
          at?: string
          claim_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_state_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_state_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_state_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_state_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      claim_submission_batch: {
        Row: {
          batch_control_number: string | null
          claim_count: number | null
          clearinghouse_id: string | null
          file_name: string | null
          id: string
          response_file: string | null
          status: string | null
          submitted_at: string | null
          team_id: string | null
          total_amount: number | null
        }
        Insert: {
          batch_control_number?: string | null
          claim_count?: number | null
          clearinghouse_id?: string | null
          file_name?: string | null
          id: string
          response_file?: string | null
          status?: string | null
          submitted_at?: string | null
          team_id?: string | null
          total_amount?: number | null
        }
        Update: {
          batch_control_number?: string | null
          claim_count?: number | null
          clearinghouse_id?: string | null
          file_name?: string | null
          id?: string
          response_file?: string | null
          status?: string | null
          submitted_at?: string | null
          team_id?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      claim_validation: {
        Row: {
          auto_fixed: Json | null
          claim_id: string
          confidence_score: number | null
          created_at: string | null
          errors: Json | null
          id: string
          overall_status: string | null
          rules_evaluated: Json | null
          team_id: string
          validation_run_at: string | null
          warnings: Json | null
        }
        Insert: {
          auto_fixed?: Json | null
          claim_id: string
          confidence_score?: number | null
          created_at?: string | null
          errors?: Json | null
          id?: string
          overall_status?: string | null
          rules_evaluated?: Json | null
          team_id: string
          validation_run_at?: string | null
          warnings?: Json | null
        }
        Update: {
          auto_fixed?: Json | null
          claim_id?: string
          confidence_score?: number | null
          created_at?: string | null
          errors?: Json | null
          id?: string
          overall_status?: string | null
          rules_evaluated?: Json | null
          team_id?: string
          validation_run_at?: string | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_validation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_validation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_validation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_validation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "claim_validation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_validation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      clearinghouse_batch: {
        Row: {
          acknowledged_at: string | null
          acknowledgment_data: Json | null
          batch_number: string | null
          clearinghouse_id: string | null
          created_at: string | null
          file_path: string | null
          id: string
          status: string | null
          submitted_at: string | null
          team_id: string
          total_amount: number | null
          total_claims: number | null
          transaction_type: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledgment_data?: Json | null
          batch_number?: string | null
          clearinghouse_id?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          team_id: string
          total_amount?: number | null
          total_claims?: number | null
          transaction_type?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledgment_data?: Json | null
          batch_number?: string | null
          clearinghouse_id?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          team_id?: string
          total_amount?: number | null
          total_claims?: number | null
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clearinghouse_batch_clearinghouse_id_fkey"
            columns: ["clearinghouse_id"]
            isOneToOne: false
            referencedRelation: "clearinghouse_connection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearinghouse_batch_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearinghouse_batch_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      clearinghouse_connection: {
        Row: {
          clearinghouse_name: string | null
          connection_type: string | null
          created_at: string | null
          credentials: Json | null
          endpoint_urls: Json | null
          id: string
          is_active: boolean | null
          last_connection_test: string | null
          supported_transactions: string[] | null
          team_id: string
          test_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          clearinghouse_name?: string | null
          connection_type?: string | null
          created_at?: string | null
          credentials?: Json | null
          endpoint_urls?: Json | null
          id?: string
          is_active?: boolean | null
          last_connection_test?: string | null
          supported_transactions?: string[] | null
          team_id: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          clearinghouse_name?: string | null
          connection_type?: string | null
          created_at?: string | null
          credentials?: Json | null
          endpoint_urls?: Json | null
          id?: string
          is_active?: boolean | null
          last_connection_test?: string | null
          supported_transactions?: string[] | null
          team_id?: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clearinghouse_connection_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearinghouse_connection_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      clerk_user_sync: {
        Row: {
          clerk_user_id: string
          last_synced_at: string | null
          metadata: Json | null
          organization_id: string | null
          supabase_user_id: string | null
          sync_status: string | null
          team_id: string | null
        }
        Insert: {
          clerk_user_id: string
          last_synced_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          supabase_user_id?: string | null
          sync_status?: string | null
          team_id?: string | null
        }
        Update: {
          clerk_user_id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          supabase_user_id?: string | null
          sync_status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clerk_user_sync_supabase_user_id_fkey"
            columns: ["supabase_user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clerk_user_sync_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clerk_user_sync_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      clerk_webhook_log: {
        Row: {
          clerk_id: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed_at: string | null
        }
        Insert: {
          clerk_id?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
        }
        Update: {
          clerk_id?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
        }
        Relationships: []
      }
      clinician: {
        Row: {
          created_at: string
          first_name: string | null
          id: number
          last_name: string | null
          license_number: string | null
          license_state: string | null
          npi_key: string
          specialty: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          npi_key: string
          specialty?: string | null
          team_id?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          npi_key?: string
          specialty?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
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
      collection_account: {
        Row: {
          agency_name: string | null
          created_at: string | null
          id: string
          last_activity_date: string | null
          notes: string | null
          original_balance: number
          patient_id: number | null
          sent_to_collections_date: string | null
          status: string | null
          team_id: string
          total_balance: number
          updated_at: string | null
        }
        Insert: {
          agency_name?: string | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          notes?: string | null
          original_balance: number
          patient_id?: number | null
          sent_to_collections_date?: string | null
          status?: string | null
          team_id: string
          total_balance: number
          updated_at?: string | null
        }
        Update: {
          agency_name?: string | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          notes?: string | null
          original_balance?: number
          patient_id?: number | null
          sent_to_collections_date?: string | null
          status?: string | null
          team_id?: string
          total_balance?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_account_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "collection_account_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_account_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "collection_account_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_account_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      communication_log: {
        Row: {
          attachments: Json | null
          communication_type: string | null
          contact_details: Json | null
          contact_name: string | null
          contact_type: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          direction: string | null
          entity_id: string | null
          entity_type: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          outcome: string | null
          subject: string | null
          team_id: string
        }
        Insert: {
          attachments?: Json | null
          communication_type?: string | null
          contact_details?: Json | null
          contact_name?: string | null
          contact_type?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          entity_id?: string | null
          entity_type?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          subject?: string | null
          team_id: string
        }
        Update: {
          attachments?: Json | null
          communication_type?: string | null
          contact_details?: Json | null
          contact_name?: string | null
          contact_type?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          entity_id?: string | null
          entity_type?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          subject?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "communication_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      cpt_code_master: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string
          effective_date: string | null
          global_period_days: number | null
          is_active: boolean | null
          is_telemedicine_eligible: boolean | null
          requires_modifier: boolean | null
          rvu_malpractice: number | null
          rvu_practice_expense: number | null
          rvu_work: number | null
          termination_date: string | null
          typical_modifiers: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description: string
          effective_date?: string | null
          global_period_days?: number | null
          is_active?: boolean | null
          is_telemedicine_eligible?: boolean | null
          requires_modifier?: boolean | null
          rvu_malpractice?: number | null
          rvu_practice_expense?: number | null
          rvu_work?: number | null
          termination_date?: string | null
          typical_modifiers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string
          effective_date?: string | null
          global_period_days?: number | null
          is_active?: boolean | null
          is_telemedicine_eligible?: boolean | null
          requires_modifier?: boolean | null
          rvu_malpractice?: number | null
          rvu_practice_expense?: number | null
          rvu_work?: number | null
          termination_date?: string | null
          typical_modifiers?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_balance: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          patient_id: number | null
          payer_id: number | null
          reason: string | null
          refund_check_number: string | null
          refund_date: string | null
          refund_method: string | null
          source_claim_id: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          payer_id?: number | null
          reason?: string | null
          refund_check_number?: string | null
          refund_date?: string | null
          refund_method?: string | null
          source_claim_id?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          payer_id?: number | null
          reason?: string | null
          refund_check_number?: string | null
          refund_date?: string | null
          refund_method?: string | null
          source_claim_id?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_balance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "credit_balance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "credit_balance_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balance_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "credit_balance_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balance_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "credit_balance_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balance_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "credit_balance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_balance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      custom_field: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_type: string
          field_config: Json | null
          field_label: string | null
          field_name: string
          field_type: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_type: string
          field_config?: Json | null
          field_label?: string | null
          field_name: string
          field_type?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_type?: string
          field_config?: Json | null
          field_label?: string | null
          field_name?: string
          field_type?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      custom_field_mapping: {
        Row: {
          created_at: string | null
          ehr_connection_id: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          source_path: string
          target_column: string | null
          target_table: string | null
          team_id: string
          transformation_rules: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          ehr_connection_id?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          source_path: string
          target_column?: string | null
          target_table?: string | null
          team_id: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          ehr_connection_id?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          source_path?: string
          target_column?: string | null
          target_table?: string | null
          team_id?: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_mapping_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "ehr_connection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_mapping_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "integration_health"
            referencedColumns: ["connection_id"]
          },
          {
            foreignKeyName: "custom_field_mapping_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_mapping_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      custom_field_value: {
        Row: {
          created_at: string | null
          custom_field_id: string
          entity_id: string
          id: string
          updated_at: string | null
          value_boolean: boolean | null
          value_date: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string | null
          custom_field_id: string
          entity_id: string
          id?: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string | null
          custom_field_id?: string
          entity_id?: string
          id?: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_value_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_field"
            referencedColumns: ["id"]
          },
        ]
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
      denial_playbook: {
        Row: {
          code: string
          created_at: string | null
          enabled: boolean | null
          fix: Json
          id: number
          notes: string | null
          success_rate: number | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          enabled?: boolean | null
          fix: Json
          id?: number
          notes?: string | null
          success_rate?: number | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          enabled?: boolean | null
          fix?: Json
          id?: number
          notes?: string | null
          success_rate?: number | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "denial_playbook_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_playbook_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      denial_tracking: {
        Row: {
          appeal_deadline: string | null
          appealable: boolean | null
          assigned_to: string | null
          carc_code: string | null
          claim_id: string | null
          created_at: string | null
          denial_date: string
          denial_reason: string | null
          denial_type: string | null
          financial_impact: number | null
          id: string
          preventable: boolean | null
          rarc_code: string | null
          root_cause: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          appeal_deadline?: string | null
          appealable?: boolean | null
          assigned_to?: string | null
          carc_code?: string | null
          claim_id?: string | null
          created_at?: string | null
          denial_date: string
          denial_reason?: string | null
          denial_type?: string | null
          financial_impact?: number | null
          id?: string
          preventable?: boolean | null
          rarc_code?: string | null
          root_cause?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          appeal_deadline?: string | null
          appealable?: boolean | null
          assigned_to?: string | null
          carc_code?: string | null
          claim_id?: string | null
          created_at?: string | null
          denial_date?: string
          denial_reason?: string | null
          denial_type?: string | null
          financial_impact?: number | null
          id?: string
          preventable?: boolean | null
          rarc_code?: string | null
          root_cause?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "denial_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "denial_tracking_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_tracking_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "denial_tracking_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_tracking_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "denial_tracking_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_tracking_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      document: {
        Row: {
          created_at: string | null
          document_type: string | null
          entity_id: string | null
          entity_type: string | null
          file_name: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          storage_path: string | null
          team_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          storage_path?: string | null
          team_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          storage_path?: string | null
          team_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "document_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
        ]
      }
      document_template: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          payer_id: number | null
          payer_specific: boolean | null
          team_id: string | null
          template_content: string | null
          template_type: string | null
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payer_id?: number | null
          payer_specific?: boolean | null
          team_id?: string | null
          template_content?: string | null
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payer_id?: number | null
          payer_specific?: boolean | null
          team_id?: string | null
          template_content?: string | null
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_template_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_template_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "document_template_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_template_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "document_template_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_template_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
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
      drug_formulary: {
        Row: {
          created_at: string | null
          drug_name: string
          effective_date: string | null
          generic_name: string | null
          id: string
          ndc_code: string | null
          pa_criteria: Json | null
          payer_id: number | null
          preferred_alternatives: string[] | null
          quantity_days: number | null
          quantity_limit: number | null
          requires_prior_auth: boolean | null
          step_therapy_required: boolean | null
          termination_date: string | null
          therapeutic_class: string | null
          tier: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          drug_name: string
          effective_date?: string | null
          generic_name?: string | null
          id?: string
          ndc_code?: string | null
          pa_criteria?: Json | null
          payer_id?: number | null
          preferred_alternatives?: string[] | null
          quantity_days?: number | null
          quantity_limit?: number | null
          requires_prior_auth?: boolean | null
          step_therapy_required?: boolean | null
          termination_date?: string | null
          therapeutic_class?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          drug_name?: string
          effective_date?: string | null
          generic_name?: string | null
          id?: string
          ndc_code?: string | null
          pa_criteria?: Json | null
          payer_id?: number | null
          preferred_alternatives?: string[] | null
          quantity_days?: number | null
          quantity_limit?: number | null
          requires_prior_auth?: boolean | null
          step_therapy_required?: boolean | null
          termination_date?: string | null
          therapeutic_class?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_formulary_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_formulary_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      ehr_connection: {
        Row: {
          auth_config: Json | null
          base_url: string | null
          connection_name: string | null
          created_at: string | null
          custom_headers: Json | null
          ehr_system_id: string
          environment: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          metadata: Json | null
          status: string | null
          sync_config: Json | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          auth_config?: Json | null
          base_url?: string | null
          connection_name?: string | null
          created_at?: string | null
          custom_headers?: Json | null
          ehr_system_id: string
          environment?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_config?: Json | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          auth_config?: Json | null
          base_url?: string | null
          connection_name?: string | null
          created_at?: string | null
          custom_headers?: Json | null
          ehr_system_id?: string
          environment?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_config?: Json | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ehr_connection_ehr_system_id_fkey"
            columns: ["ehr_system_id"]
            isOneToOne: false
            referencedRelation: "ehr_system"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_connection_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_connection_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      ehr_system: {
        Row: {
          api_type: string | null
          auth_method: string | null
          base_urls: Json | null
          capabilities: Json | null
          created_at: string | null
          display_name: string | null
          documentation_url: string | null
          fhir_version: string | null
          id: string
          is_active: boolean | null
          name: string
          rate_limits: Json | null
          updated_at: string | null
        }
        Insert: {
          api_type?: string | null
          auth_method?: string | null
          base_urls?: Json | null
          capabilities?: Json | null
          created_at?: string | null
          display_name?: string | null
          documentation_url?: string | null
          fhir_version?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rate_limits?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_type?: string | null
          auth_method?: string | null
          base_urls?: Json | null
          capabilities?: Json | null
          created_at?: string | null
          display_name?: string | null
          documentation_url?: string | null
          fhir_version?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate_limits?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eligibility_cache: {
        Row: {
          cache_key: string | null
          copay: number | null
          created_at: string | null
          deductible_remaining: number | null
          expires_at: string | null
          id: string
          insurance_policy_id: number | null
          is_eligible: boolean | null
          out_of_pocket_remaining: number | null
          patient_id: number | null
          response_data: Json | null
          team_id: string
        }
        Insert: {
          cache_key?: string | null
          copay?: number | null
          created_at?: string | null
          deductible_remaining?: number | null
          expires_at?: string | null
          id?: string
          insurance_policy_id?: number | null
          is_eligible?: boolean | null
          out_of_pocket_remaining?: number | null
          patient_id?: number | null
          response_data?: Json | null
          team_id: string
        }
        Update: {
          cache_key?: string | null
          copay?: number | null
          created_at?: string | null
          deductible_remaining?: number | null
          expires_at?: string | null
          id?: string
          insurance_policy_id?: number | null
          is_eligible?: boolean | null
          out_of_pocket_remaining?: number | null
          patient_id?: number | null
          response_data?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_cache_insurance_policy_id_fkey"
            columns: ["insurance_policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_cache_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "eligibility_cache_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_cache_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "eligibility_cache_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_cache_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      eligibility_check: {
        Row: {
          check_type: string | null
          coverage_details: Json | null
          created_at: string | null
          effective_date: string | null
          eligibility_status: string | null
          error_message: string | null
          id: string
          insurance_policy_id: number | null
          last_verified_at: string | null
          patient_id: number | null
          request_data: Json
          response_data: Json | null
          status: string
          team_id: string
          termination_date: string | null
        }
        Insert: {
          check_type?: string | null
          coverage_details?: Json | null
          created_at?: string | null
          effective_date?: string | null
          eligibility_status?: string | null
          error_message?: string | null
          id?: string
          insurance_policy_id?: number | null
          last_verified_at?: string | null
          patient_id?: number | null
          request_data: Json
          response_data?: Json | null
          status: string
          team_id: string
          termination_date?: string | null
        }
        Update: {
          check_type?: string | null
          coverage_details?: Json | null
          created_at?: string | null
          effective_date?: string | null
          eligibility_status?: string | null
          error_message?: string | null
          id?: string
          insurance_policy_id?: number | null
          last_verified_at?: string | null
          patient_id?: number | null
          request_data?: Json
          response_data?: Json | null
          status?: string
          team_id?: string
          termination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_check_insurance_policy_id_fkey"
            columns: ["insurance_policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_check_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "eligibility_check_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_check_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "eligibility_check_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_check_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      encounter: {
        Row: {
          appointment_id: string | null
          cpt: string
          created_at: string | null
          dos: string
          duration_minutes: number | null
          icd10: string
          id: string
          modifiers: string[] | null
          notes: string | null
          patient_id: number
          pos: string
          rendering_clinician_id: number
          service_location_id: string | null
          team_id: string | null
          units: number | null
          updated_at: string | null
          visit_type: string | null
        }
        Insert: {
          appointment_id?: string | null
          cpt: string
          created_at?: string | null
          dos: string
          duration_minutes?: number | null
          icd10: string
          id: string
          modifiers?: string[] | null
          notes?: string | null
          patient_id: number
          pos: string
          rendering_clinician_id: number
          service_location_id?: string | null
          team_id?: string | null
          units?: number | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Update: {
          appointment_id?: string | null
          cpt?: string
          created_at?: string | null
          dos?: string
          duration_minutes?: number | null
          icd10?: string
          id?: string
          modifiers?: string[] | null
          notes?: string | null
          patient_id?: number
          pos?: string
          rendering_clinician_id?: number
          service_location_id?: string | null
          team_id?: string | null
          units?: number | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "encounter_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "encounter_rendering_clinician_id_fkey"
            columns: ["rendering_clinician_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_rendering_clinician_id_fkey"
            columns: ["rendering_clinician_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "encounter_service_location_id_fkey"
            columns: ["service_location_id"]
            isOneToOne: false
            referencedRelation: "service_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      era_line_detail: {
        Row: {
          adjustment_amounts: number[] | null
          adjustment_group_code: string | null
          adjustment_reason_codes: string[] | null
          allowed_amount: number | null
          billed_amount: number | null
          claim_line_id: string | null
          coinsurance: number | null
          copay: number | null
          created_at: string | null
          deductible: number | null
          id: string
          paid_amount: number | null
          payment_detail_id: string
          procedure_code: string | null
          remark_codes: string[] | null
          service_date: string | null
        }
        Insert: {
          adjustment_amounts?: number[] | null
          adjustment_group_code?: string | null
          adjustment_reason_codes?: string[] | null
          allowed_amount?: number | null
          billed_amount?: number | null
          claim_line_id?: string | null
          coinsurance?: number | null
          copay?: number | null
          created_at?: string | null
          deductible?: number | null
          id?: string
          paid_amount?: number | null
          payment_detail_id: string
          procedure_code?: string | null
          remark_codes?: string[] | null
          service_date?: string | null
        }
        Update: {
          adjustment_amounts?: number[] | null
          adjustment_group_code?: string | null
          adjustment_reason_codes?: string[] | null
          allowed_amount?: number | null
          billed_amount?: number | null
          claim_line_id?: string | null
          coinsurance?: number | null
          copay?: number | null
          created_at?: string | null
          deductible?: number | null
          id?: string
          paid_amount?: number | null
          payment_detail_id?: string
          procedure_code?: string | null
          remark_codes?: string[] | null
          service_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "era_line_detail_claim_line_id_fkey"
            columns: ["claim_line_id"]
            isOneToOne: false
            referencedRelation: "claim_line"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "era_line_detail_payment_detail_id_fkey"
            columns: ["payment_detail_id"]
            isOneToOne: false
            referencedRelation: "payment_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_job: {
        Row: {
          error_message: string | null
          error_trace: string | null
          failed_at: string | null
          id: string
          job_type: string | null
          max_retries: number | null
          next_retry_at: string | null
          payload: Json | null
          retry_count: number | null
          team_id: string | null
        }
        Insert: {
          error_message?: string | null
          error_trace?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          retry_count?: number | null
          team_id?: string | null
        }
        Update: {
          error_message?: string | null
          error_trace?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          retry_count?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failed_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      fee_schedule: {
        Row: {
          allowed_amount: number | null
          contract_name: string | null
          cpt_code: string
          created_at: string | null
          effective_date: string
          facility_rate: number | null
          id: string
          modifier: string | null
          non_facility_rate: number | null
          notes: string | null
          payer_id: number | null
          percentage_of_billed: number | null
          team_id: string
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_amount?: number | null
          contract_name?: string | null
          cpt_code: string
          created_at?: string | null
          effective_date: string
          facility_rate?: number | null
          id?: string
          modifier?: string | null
          non_facility_rate?: number | null
          notes?: string | null
          payer_id?: number | null
          percentage_of_billed?: number | null
          team_id: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_amount?: number | null
          contract_name?: string | null
          cpt_code?: string
          created_at?: string | null
          effective_date?: string
          facility_rate?: number | null
          id?: string
          modifier?: string | null
          non_facility_rate?: number | null
          notes?: string | null
          payer_id?: number | null
          percentage_of_billed?: number | null
          team_id?: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_schedule_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_schedule_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "fee_schedule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_schedule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      fhir_resource: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          mapped_entity_id: string | null
          mapped_entity_type: string | null
          resource_data: Json
          resource_id: string
          resource_type: string
          source_system: string | null
          team_id: string
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          mapped_entity_id?: string | null
          mapped_entity_type?: string | null
          resource_data: Json
          resource_id: string
          resource_type: string
          source_system?: string | null
          team_id: string
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          mapped_entity_id?: string | null
          mapped_entity_type?: string | null
          resource_data?: Json
          resource_id?: string
          resource_type?: string
          source_system?: string | null
          team_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_resource_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fhir_resource_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      field_mapping_template: {
        Row: {
          created_at: string | null
          ehr_system_id: string | null
          entity_type: string | null
          id: string
          is_default: boolean | null
          mappings: Json
          name: string
          transformations: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ehr_system_id?: string | null
          entity_type?: string | null
          id?: string
          is_default?: boolean | null
          mappings: Json
          name: string
          transformations?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ehr_system_id?: string | null
          entity_type?: string | null
          id?: string
          is_default?: boolean | null
          mappings?: Json
          name?: string
          transformations?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_mapping_template_ehr_system_id_fkey"
            columns: ["ehr_system_id"]
            isOneToOne: false
            referencedRelation: "ehr_system"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_document: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          file_path: string | null
          generated_content: string | null
          id: string
          merge_data: Json | null
          sent_at: string | null
          sent_to: string | null
          status: string | null
          team_id: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_path?: string | null
          generated_content?: string | null
          id?: string
          merge_data?: Json | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          team_id: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_path?: string | null
          generated_content?: string | null
          id?: string
          merge_data?: Json | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          team_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_document_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_document_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "generated_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "generated_document_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_report: {
        Row: {
          file_path: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          parameters_used: Json | null
          report_definition_id: string | null
          row_count: number | null
          status: string | null
          team_id: string
        }
        Insert: {
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters_used?: Json | null
          report_definition_id?: string | null
          row_count?: number | null
          status?: string | null
          team_id: string
        }
        Update: {
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters_used?: Json | null
          report_definition_id?: string | null
          row_count?: number | null
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_report_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_report_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "generated_report_report_definition_id_fkey"
            columns: ["report_definition_id"]
            isOneToOne: false
            referencedRelation: "report_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_report_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_report_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      icd10_code_master: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string
          effective_date: string | null
          is_active: boolean | null
          is_billable: boolean | null
          parent_code: string | null
          requires_additional_digit: boolean | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description: string
          effective_date?: string | null
          is_active?: boolean | null
          is_billable?: boolean | null
          parent_code?: string | null
          requires_additional_digit?: boolean | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string
          effective_date?: string | null
          is_active?: boolean | null
          is_billable?: boolean | null
          parent_code?: string | null
          requires_additional_digit?: boolean | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_policy: {
        Row: {
          canvas_coverage_id: string | null
          created_at: string | null
          effective_date: string | null
          group_number: string | null
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
          team_id: string | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          canvas_coverage_id?: string | null
          created_at?: string | null
          effective_date?: string | null
          group_number?: string | null
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
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          canvas_coverage_id?: string | null
          created_at?: string | null
          effective_date?: string | null
          group_number?: string | null
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
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "insurance_policy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "insurance_policy_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "insurance_policy_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
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
      integration_event_log: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string | null
          http_status: number | null
          id: string
          integration_type: string | null
          request_data: Json | null
          request_id: string | null
          response_data: Json | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          integration_type?: string | null
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          integration_type?: string | null
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_event_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_event_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      kpi_definition: {
        Row: {
          calculation_sql: string | null
          category: string | null
          created_at: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          kpi_name: string
          target_value: number | null
          team_id: string | null
          unit_of_measure: string | null
        }
        Insert: {
          calculation_sql?: string | null
          category?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          kpi_name: string
          target_value?: number | null
          team_id?: string | null
          unit_of_measure?: string | null
        }
        Update: {
          calculation_sql?: string | null
          category?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          kpi_name?: string
          target_value?: number | null
          team_id?: string | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definition_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_definition_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      kpi_snapshot: {
        Row: {
          actual_value: number | null
          created_at: string | null
          id: string
          kpi_definition_id: string | null
          period_end: string
          period_start: string
          target_value: number | null
          team_id: string
          trend: string | null
          variance: number | null
        }
        Insert: {
          actual_value?: number | null
          created_at?: string | null
          id?: string
          kpi_definition_id?: string | null
          period_end: string
          period_start: string
          target_value?: number | null
          team_id: string
          trend?: string | null
          variance?: number | null
        }
        Update: {
          actual_value?: number | null
          created_at?: string | null
          id?: string
          kpi_definition_id?: string | null
          period_end?: string
          period_start?: string
          target_value?: number | null
          team_id?: string
          trend?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshot_kpi_definition_id_fkey"
            columns: ["kpi_definition_id"]
            isOneToOne: false
            referencedRelation: "kpi_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshot_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshot_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
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
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
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
      ml_model_metrics: {
        Row: {
          created_at: string | null
          evaluation_period_end: string | null
          evaluation_period_start: string | null
          id: string
          metadata: Json | null
          metric_type: string | null
          metric_value: number | null
          model_name: string
          model_version: string | null
          sample_size: number | null
        }
        Insert: {
          created_at?: string | null
          evaluation_period_end?: string | null
          evaluation_period_start?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string | null
          metric_value?: number | null
          model_name: string
          model_version?: string | null
          sample_size?: number | null
        }
        Update: {
          created_at?: string | null
          evaluation_period_end?: string | null
          evaluation_period_start?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string | null
          metric_value?: number | null
          model_name?: string
          model_version?: string | null
          sample_size?: number | null
        }
        Relationships: []
      }
      ml_prediction: {
        Row: {
          actual_outcome: Json | null
          confidence_score: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          explanation: string | null
          feature_importance: Json | null
          id: string
          model_name: string
          model_version: string | null
          outcome_recorded: boolean | null
          prediction_timestamp: string | null
          prediction_type: string | null
          prediction_value: Json
          team_id: string
          used_in_decision: boolean | null
        }
        Insert: {
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          explanation?: string | null
          feature_importance?: Json | null
          id?: string
          model_name: string
          model_version?: string | null
          outcome_recorded?: boolean | null
          prediction_timestamp?: string | null
          prediction_type?: string | null
          prediction_value: Json
          team_id: string
          used_in_decision?: boolean | null
        }
        Update: {
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          explanation?: string | null
          feature_importance?: Json | null
          id?: string
          model_name?: string
          model_version?: string | null
          outcome_recorded?: boolean | null
          prediction_timestamp?: string | null
          prediction_type?: string | null
          prediction_value?: Json
          team_id?: string
          used_in_decision?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_prediction_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      modifier_code: {
        Row: {
          code: string
          created_at: string | null
          description: string
          modifier_type: string | null
          pricing_impact: number | null
          requires_documentation: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          modifier_type?: string | null
          pricing_impact?: number | null
          requires_documentation?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          modifier_type?: string | null
          pricing_impact?: number | null
          requires_documentation?: boolean | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          body: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          team_id: string
          team_member_id: string | null
          template_id: string | null
          type: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          team_id: string
          team_member_id?: string | null
          template_id?: string | null
          type?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          team_id?: string
          team_member_id?: string | null
          template_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "notification_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "notification_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_template"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_template: {
        Row: {
          body_template: string | null
          created_at: string | null
          event_type: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          team_id: string | null
          type: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_template_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_template_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      pa_clinical_criteria: {
        Row: {
          age_max: number | null
          age_min: number | null
          auto_approve_if_met: boolean | null
          clinical_requirements: Json | null
          code: string | null
          created_at: string | null
          criteria_name: string | null
          documentation_required: string[] | null
          effective_date: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          icd10_requirements: string[] | null
          id: string
          payer_id: number | null
          service_type: string | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          auto_approve_if_met?: boolean | null
          clinical_requirements?: Json | null
          code?: string | null
          created_at?: string | null
          criteria_name?: string | null
          documentation_required?: string[] | null
          effective_date?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          icd10_requirements?: string[] | null
          id?: string
          payer_id?: number | null
          service_type?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          auto_approve_if_met?: boolean | null
          clinical_requirements?: Json | null
          code?: string | null
          created_at?: string | null
          criteria_name?: string | null
          documentation_required?: string[] | null
          effective_date?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          icd10_requirements?: string[] | null
          id?: string
          payer_id?: number | null
          service_type?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pa_clinical_criteria_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_clinical_criteria_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      pa_requirement_rule: {
        Row: {
          auto_submit: boolean | null
          cpt_code: string | null
          created_at: string | null
          effective_date: string | null
          icd10_code: string | null
          id: string
          is_active: boolean | null
          lookback_days: number | null
          payer_id: number | null
          priority: number | null
          requires_pa: boolean | null
          rule_logic: Json | null
          team_id: string | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          auto_submit?: boolean | null
          cpt_code?: string | null
          created_at?: string | null
          effective_date?: string | null
          icd10_code?: string | null
          id?: string
          is_active?: boolean | null
          lookback_days?: number | null
          payer_id?: number | null
          priority?: number | null
          requires_pa?: boolean | null
          rule_logic?: Json | null
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_submit?: boolean | null
          cpt_code?: string | null
          created_at?: string | null
          effective_date?: string | null
          icd10_code?: string | null
          id?: string
          is_active?: boolean | null
          lookback_days?: number | null
          payer_id?: number | null
          priority?: number | null
          requires_pa?: boolean | null
          rule_logic?: Json | null
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pa_requirement_rule_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_requirement_rule_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "pa_requirement_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_requirement_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      pa_supporting_document: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_name: string | null
          file_path: string | null
          id: string
          mime_type: string | null
          prior_auth_id: string
          team_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          prior_auth_id: string
          team_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          prior_auth_id?: string
          team_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pa_supporting_document_prior_auth_id_fkey"
            columns: ["prior_auth_id"]
            isOneToOne: false
            referencedRelation: "pa_pipeline"
            referencedColumns: ["pa_id"]
          },
          {
            foreignKeyName: "pa_supporting_document_prior_auth_id_fkey"
            columns: ["prior_auth_id"]
            isOneToOne: false
            referencedRelation: "prior_auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_supporting_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_supporting_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "pa_supporting_document_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_supporting_document_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
        ]
      }
      patient: {
        Row: {
          created_at: string
          external_id: string | null
          has_verified_identity: boolean
          height: number | null
          id: number
          mrn: string | null
          profile_id: number | null
          region: string | null
          ssn_encrypted: string | null
          ssn_key_id: string | null
          status: string | null
          team_id: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          has_verified_identity?: boolean
          height?: number | null
          id?: number
          mrn?: string | null
          profile_id?: number | null
          region?: string | null
          ssn_encrypted?: string | null
          ssn_key_id?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          has_verified_identity?: boolean
          height?: number | null
          id?: number
          mrn?: string | null
          profile_id?: number | null
          region?: string | null
          ssn_encrypted?: string | null
          ssn_key_id?: string | null
          status?: string | null
          team_id?: string | null
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
          {
            foreignKeyName: "patient_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
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
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_diagnosis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnosis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      patient_document: {
        Row: {
          created_at: string | null
          document_name: string | null
          document_type: string | null
          expiration_date: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          mime_type: string | null
          patient_id: number | null
          team_id: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name?: string | null
          document_type?: string | null
          expiration_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id?: number | null
          team_id: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string | null
          document_type?: string | null
          expiration_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id?: number | null
          team_id?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_document_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_document_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "patient_document_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
        ]
      }
      patient_payment: {
        Row: {
          amount: number
          applied_to_claims: string[] | null
          created_at: string | null
          id: string
          notes: string | null
          patient_id: number | null
          payment_method: string | null
          payment_plan_id: string | null
          processed_at: string | null
          reference_number: string | null
          status: string | null
          team_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          applied_to_claims?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          payment_method?: string | null
          payment_plan_id?: string | null
          processed_at?: string | null
          reference_number?: string | null
          status?: string | null
          team_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          applied_to_claims?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: number | null
          payment_method?: string | null
          payment_plan_id?: string | null
          processed_at?: string | null
          reference_number?: string | null
          status?: string | null
          team_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_payment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_payment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_payment_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
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
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_pharmacy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_pharmacy_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
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
          patient_address: number | null
          phone: string | null
          team_id: string | null
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
          patient_address?: number | null
          phone?: string | null
          team_id?: string | null
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
          patient_address?: number | null
          phone?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_profile_patient_address_fkey"
            columns: ["patient_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_profile_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_profile_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      patient_quality_measure: {
        Row: {
          created_at: string | null
          excluded: boolean | null
          gap_in_care: boolean | null
          id: string
          in_denominator: boolean | null
          in_numerator: boolean | null
          last_service_date: string | null
          next_due_date: string | null
          patient_id: number | null
          quality_measure_id: string | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          excluded?: boolean | null
          gap_in_care?: boolean | null
          id?: string
          in_denominator?: boolean | null
          in_numerator?: boolean | null
          last_service_date?: string | null
          next_due_date?: string | null
          patient_id?: number | null
          quality_measure_id?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          excluded?: boolean | null
          gap_in_care?: boolean | null
          id?: string
          in_denominator?: boolean | null
          in_numerator?: boolean | null
          last_service_date?: string | null
          next_due_date?: string | null
          patient_id?: number | null
          quality_measure_id?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_quality_measure_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_quality_measure_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_quality_measure_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_quality_measure_quality_measure_id_fkey"
            columns: ["quality_measure_id"]
            isOneToOne: false
            referencedRelation: "quality_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_quality_measure_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_quality_measure_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      patient_statement: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          insurance_pending: number | null
          new_charges: number | null
          patient_id: number | null
          patient_responsibility: number
          payments_received: number | null
          previous_balance: number | null
          sent_at: string | null
          sent_method: string | null
          statement_date: string
          statement_number: string | null
          status: string | null
          team_id: string
          total_balance: number
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          insurance_pending?: number | null
          new_charges?: number | null
          patient_id?: number | null
          patient_responsibility: number
          payments_received?: number | null
          previous_balance?: number | null
          sent_at?: string | null
          sent_method?: string | null
          statement_date: string
          statement_number?: string | null
          status?: string | null
          team_id: string
          total_balance: number
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          insurance_pending?: number | null
          new_charges?: number | null
          patient_id?: number | null
          patient_responsibility?: number
          payments_received?: number | null
          previous_balance?: number | null
          sent_at?: string | null
          sent_method?: string | null
          statement_date?: string
          statement_number?: string | null
          status?: string | null
          team_id?: string
          total_balance?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_statement_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_statement_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_statement_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_statement_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_statement_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer: {
        Row: {
          created_at: string | null
          external_payer_id: string
          id: number
          name: string
          payer_type: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_payer_id: string
          id?: number
          name: string
          payer_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_payer_id?: string
          id?: number
          name?: string
          payer_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payer_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer_config: {
        Row: {
          auto_submit_claims: boolean | null
          auto_submit_pa: boolean | null
          config_type: string
          created_at: string | null
          eligibility_cache_hours: number | null
          id: string
          payer_id: number
          portal_config: Json | null
          special_rules: Json | null
          submission_batch_size: number | null
          submission_schedule: string | null
          team_id: string
          timely_filing_days: number | null
          updated_at: string | null
        }
        Insert: {
          auto_submit_claims?: boolean | null
          auto_submit_pa?: boolean | null
          config_type: string
          created_at?: string | null
          eligibility_cache_hours?: number | null
          id?: string
          payer_id: number
          portal_config?: Json | null
          special_rules?: Json | null
          submission_batch_size?: number | null
          submission_schedule?: string | null
          team_id: string
          timely_filing_days?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_submit_claims?: boolean | null
          auto_submit_pa?: boolean | null
          config_type?: string
          created_at?: string | null
          eligibility_cache_hours?: number | null
          id?: string
          payer_id?: number
          portal_config?: Json | null
          special_rules?: Json | null
          submission_batch_size?: number | null
          submission_schedule?: string | null
          team_id?: string
          timely_filing_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payer_config_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_config_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "payer_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer_portal_credential: {
        Row: {
          automation_enabled: boolean | null
          created_at: string | null
          id: string
          last_successful_login: string | null
          mfa_enabled: boolean | null
          password: string | null
          payer_id: number | null
          portal_url: string
          security_questions: Json | null
          team_id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          automation_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_successful_login?: string | null
          mfa_enabled?: boolean | null
          password?: string | null
          payer_id?: number | null
          portal_url: string
          security_questions?: Json | null
          team_id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          automation_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_successful_login?: string | null
          mfa_enabled?: boolean | null
          password?: string | null
          payer_id?: number | null
          portal_url?: string
          security_questions?: Json | null
          team_id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payer_portal_credential_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_portal_credential_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "payer_portal_credential_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_portal_credential_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer_response_message: {
        Row: {
          action_required: boolean | null
          code: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string | null
          message_type: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          team_id: string
        }
        Insert: {
          action_required?: boolean | null
          code?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          message_type?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          team_id: string
        }
        Update: {
          action_required?: boolean | null
          code?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          message_type?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payer_response_message_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_response_message_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "payer_response_message_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_response_message_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer_submission_config: {
        Row: {
          api_endpoint: string | null
          claim_type: string | null
          id: string
          payer_id: number | null
          portal_url: string | null
          required_attachments: string[] | null
          special_instructions: Json | null
          submission_method: string | null
        }
        Insert: {
          api_endpoint?: string | null
          claim_type?: string | null
          id?: string
          payer_id?: number | null
          portal_url?: string | null
          required_attachments?: string[] | null
          special_instructions?: Json | null
          submission_method?: string | null
        }
        Update: {
          api_endpoint?: string | null
          claim_type?: string | null
          id?: string
          payer_id?: number | null
          portal_url?: string | null
          required_attachments?: string[] | null
          special_instructions?: Json | null
          submission_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payer_submission_config_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_submission_config_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      payment_adjustment: {
        Row: {
          adjustment_type: string | null
          amount: number
          claim_id: string | null
          created_at: string | null
          id: string
          payment_detail_id: string | null
          posted_at: string | null
          posted_by: string | null
          reason_code: string | null
          reason_description: string | null
          reversed: boolean | null
          reversed_at: string | null
          team_id: string
        }
        Insert: {
          adjustment_type?: string | null
          amount: number
          claim_id?: string | null
          created_at?: string | null
          id?: string
          payment_detail_id?: string | null
          posted_at?: string | null
          posted_by?: string | null
          reason_code?: string | null
          reason_description?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          team_id: string
        }
        Update: {
          adjustment_type?: string | null
          amount?: number
          claim_id?: string | null
          created_at?: string | null
          id?: string
          payment_detail_id?: string | null
          posted_at?: string | null
          posted_by?: string | null
          reason_code?: string | null
          reason_description?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_adjustment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_adjustment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustment_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_adjustment_payment_detail_id_fkey"
            columns: ["payment_detail_id"]
            isOneToOne: false
            referencedRelation: "payment_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustment_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustment_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "payment_adjustment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payment_detail: {
        Row: {
          adjustment_codes: Json | null
          adjustment_reasons: string[] | null
          allowed_amount: number | null
          billed_amount: number | null
          claim_id: string | null
          coinsurance_amount: number | null
          copay_amount: number | null
          cpt_code: string | null
          created_at: string | null
          deductible_amount: number | null
          id: string
          paid_amount: number | null
          patient_id: number | null
          patient_responsibility: number | null
          remittance_advice_id: string | null
          service_date: string | null
          status: string | null
        }
        Insert: {
          adjustment_codes?: Json | null
          adjustment_reasons?: string[] | null
          allowed_amount?: number | null
          billed_amount?: number | null
          claim_id?: string | null
          coinsurance_amount?: number | null
          copay_amount?: number | null
          cpt_code?: string | null
          created_at?: string | null
          deductible_amount?: number | null
          id?: string
          paid_amount?: number | null
          patient_id?: number | null
          patient_responsibility?: number | null
          remittance_advice_id?: string | null
          service_date?: string | null
          status?: string | null
        }
        Update: {
          adjustment_codes?: Json | null
          adjustment_reasons?: string[] | null
          allowed_amount?: number | null
          billed_amount?: number | null
          claim_id?: string | null
          coinsurance_amount?: number | null
          copay_amount?: number | null
          cpt_code?: string | null
          created_at?: string | null
          deductible_amount?: number | null
          id?: string
          paid_amount?: number | null
          patient_id?: number | null
          patient_responsibility?: number | null
          remittance_advice_id?: string | null
          service_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_detail_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_detail_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_detail_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_detail_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_detail_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payment_detail_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_detail_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payment_detail_remittance_advice_id_fkey"
            columns: ["remittance_advice_id"]
            isOneToOne: false
            referencedRelation: "remittance_advice"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plan: {
        Row: {
          auto_charge: boolean | null
          created_at: string | null
          down_payment: number | null
          id: string
          monthly_payment: number
          next_payment_date: string | null
          number_of_payments: number
          patient_id: number | null
          payment_method_token: string | null
          payments_made: number | null
          start_date: string
          status: string | null
          team_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          auto_charge?: boolean | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          monthly_payment: number
          next_payment_date?: string | null
          number_of_payments: number
          patient_id?: number | null
          payment_method_token?: string | null
          payments_made?: number | null
          start_date: string
          status?: string | null
          team_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          auto_charge?: boolean | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          monthly_payment?: number
          next_payment_date?: string | null
          number_of_payments?: number
          patient_id?: number | null
          payment_method_token?: string | null
          payments_made?: number | null
          start_date?: string
          status?: string | null
          team_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payment_plan_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payment_plan_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payment_posting_session: {
        Row: {
          completed_at: string | null
          era_file_name: string | null
          exceptions: Json | null
          id: string
          payments_posted: number | null
          posted_by: string | null
          started_at: string | null
          team_id: string | null
          total_posted: number | null
        }
        Insert: {
          completed_at?: string | null
          era_file_name?: string | null
          exceptions?: Json | null
          id: string
          payments_posted?: number | null
          posted_by?: string | null
          started_at?: string | null
          team_id?: string | null
          total_posted?: number | null
        }
        Update: {
          completed_at?: string | null
          era_file_name?: string | null
          exceptions?: Json | null
          id?: string
          payments_posted?: number | null
          posted_by?: string | null
          started_at?: string | null
          team_id?: string | null
          total_posted?: number | null
        }
        Relationships: []
      }
      payment_reconciliation: {
        Row: {
          claim_id: string | null
          created_at: string | null
          expected_amount: number | null
          id: string
          notes: string | null
          received_amount: number | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string | null
          requires_appeal: boolean | null
          team_id: string
          variance_amount: number | null
          variance_reason: string | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          received_amount?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string | null
          requires_appeal?: boolean | null
          team_id: string
          variance_amount?: number | null
          variance_reason?: string | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          received_amount?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string | null
          requires_appeal?: boolean | null
          team_id?: string
          variance_amount?: number | null
          variance_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_reconciliation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_reconciliation_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "payment_reconciliation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payment_variance: {
        Row: {
          action_required: string | null
          claim_id: string | null
          expected_amount: number | null
          id: string
          paid_amount: number | null
          team_id: string | null
          variance_amount: number | null
          variance_reason: string | null
        }
        Insert: {
          action_required?: string | null
          claim_id?: string | null
          expected_amount?: number | null
          id?: string
          paid_amount?: number | null
          team_id?: string | null
          variance_amount?: number | null
          variance_reason?: string | null
        }
        Update: {
          action_required?: string | null
          claim_id?: string | null
          expected_amount?: number | null
          id?: string
          paid_amount?: number | null
          team_id?: string | null
          variance_amount?: number | null
          variance_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_variance_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_variance_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ar_aging_detail"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "payment_variance_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_variance_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "denial_analytics"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      phi_export_log: {
        Row: {
          entity_types: string[] | null
          export_type: string | null
          exported_at: string | null
          exported_by: string | null
          id: string
          ip_address: unknown | null
          purpose: string | null
          record_count: number | null
        }
        Insert: {
          entity_types?: string[] | null
          export_type?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          ip_address?: unknown | null
          purpose?: string | null
          record_count?: number | null
        }
        Update: {
          entity_types?: string[] | null
          export_type?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          ip_address?: unknown | null
          purpose?: string | null
          record_count?: number | null
        }
        Relationships: []
      }
      place_of_service: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          facility_pricing: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          facility_pricing?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          facility_pricing?: boolean | null
          name?: string
        }
        Relationships: []
      }
      portal_automation_task: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          executed_at: string | null
          id: string
          last_error: string | null
          payer_portal_id: string | null
          result_data: Json | null
          retry_count: number | null
          scheduled_at: string | null
          status: string | null
          task_type: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          last_error?: string | null
          payer_portal_id?: string | null
          result_data?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
          task_type?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          last_error?: string | null
          payer_portal_id?: string | null
          result_data?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
          task_type?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_automation_task_payer_portal_id_fkey"
            columns: ["payer_portal_id"]
            isOneToOne: false
            referencedRelation: "payer_portal_credential"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_automation_task_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_automation_task_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
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
          approved_at: string | null
          attempt_count: number | null
          auth_number: string | null
          auto_approved: boolean | null
          confidence: number | null
          created_at: string | null
          denied_at: string | null
          duration_days: number | null
          encounter_id: string | null
          field_confidences: Json | null
          id: string
          indication: string | null
          issues: string[] | null
          medication: string | null
          patient_id: number | null
          payer_id: number | null
          prev_therapies: string[] | null
          quantity: number | null
          status: string
          submitted_at: string | null
          suggested_fixes: Json[] | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          attempt_count?: number | null
          auth_number?: string | null
          auto_approved?: boolean | null
          confidence?: number | null
          created_at?: string | null
          denied_at?: string | null
          duration_days?: number | null
          encounter_id?: string | null
          field_confidences?: Json | null
          id: string
          indication?: string | null
          issues?: string[] | null
          medication?: string | null
          patient_id?: number | null
          payer_id?: number | null
          prev_therapies?: string[] | null
          quantity?: number | null
          status: string
          submitted_at?: string | null
          suggested_fixes?: Json[] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          attempt_count?: number | null
          auth_number?: string | null
          auto_approved?: boolean | null
          confidence?: number | null
          created_at?: string | null
          denied_at?: string | null
          duration_days?: number | null
          encounter_id?: string | null
          field_confidences?: Json | null
          id?: string
          indication?: string | null
          issues?: string[] | null
          medication?: string | null
          patient_id?: number | null
          payer_id?: number | null
          prev_therapies?: string[] | null
          quantity?: number | null
          status?: string
          submitted_at?: string | null
          suggested_fixes?: Json[] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prior_auth_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "prior_auth_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "prior_auth_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      provider_credentialing: {
        Row: {
          application_date: string | null
          approval_date: string | null
          clinician_id: number
          created_at: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          payer_id: number
          state: string
          status: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          clinician_id: number
          created_at?: string | null
          expiration_date?: string | null
          id: string
          notes?: string | null
          payer_id: number
          state: string
          status: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          clinician_id?: number
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          payer_id?: number
          state?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentialing_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_credentialing_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "provider_credentialing_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_credentialing_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "provider_credentialing_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_credentialing_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      provider_enrollment: {
        Row: {
          can_bill: boolean | null
          clinician_id: number | null
          created_at: string | null
          effective_date: string | null
          enrollment_id: string | null
          enrollment_status: string | null
          enrollment_type: string | null
          id: string
          is_par: boolean | null
          payer_id: number | null
          revalidation_date: string | null
          team_id: string
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          can_bill?: boolean | null
          clinician_id?: number | null
          created_at?: string | null
          effective_date?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          enrollment_type?: string | null
          id?: string
          is_par?: boolean | null
          payer_id?: number | null
          revalidation_date?: string | null
          team_id: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          can_bill?: boolean | null
          clinician_id?: number | null
          created_at?: string | null
          effective_date?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          enrollment_type?: string | null
          id?: string
          is_par?: boolean | null
          payer_id?: number | null
          revalidation_date?: string | null
          team_id?: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_enrollment_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_enrollment_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "provider_enrollment_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_enrollment_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "provider_enrollment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_enrollment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      provider_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          effective_date: string | null
          end_time: string
          id: string
          provider_id: number | null
          service_location_id: string | null
          slot_duration_minutes: number | null
          start_time: string
          team_id: string
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          effective_date?: string | null
          end_time: string
          id?: string
          provider_id?: number | null
          service_location_id?: string | null
          slot_duration_minutes?: number | null
          start_time: string
          team_id: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          effective_date?: string | null
          end_time?: string
          id?: string
          provider_id?: number | null
          service_location_id?: string | null
          slot_duration_minutes?: number | null
          start_time?: string
          team_id?: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_schedule_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_schedule_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "provider_schedule_service_location_id_fkey"
            columns: ["service_location_id"]
            isOneToOne: false
            referencedRelation: "service_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_schedule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_schedule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      quality_measure: {
        Row: {
          created_at: string | null
          denominator_criteria: Json | null
          description: string | null
          exclusion_criteria: Json | null
          id: string
          measure_id: string
          measure_name: string | null
          measure_type: string | null
          numerator_criteria: Json | null
          reporting_period_end: string | null
          reporting_period_start: string | null
        }
        Insert: {
          created_at?: string | null
          denominator_criteria?: Json | null
          description?: string | null
          exclusion_criteria?: Json | null
          id?: string
          measure_id: string
          measure_name?: string | null
          measure_type?: string | null
          numerator_criteria?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
        }
        Update: {
          created_at?: string | null
          denominator_criteria?: Json | null
          description?: string | null
          exclusion_criteria?: Json | null
          id?: string
          measure_id?: string
          measure_name?: string | null
          measure_type?: string | null
          numerator_criteria?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
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
      rate_limit_bucket: {
        Row: {
          bucket_type: string | null
          created_at: string | null
          id: string
          identifier: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          bucket_type?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          request_count?: number | null
          window_start: string
        }
        Update: {
          bucket_type?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      referral: {
        Row: {
          authorization_number: string | null
          created_at: string | null
          expiration_date: string | null
          id: string
          patient_id: number | null
          reason_for_referral: string | null
          referral_type: string | null
          referred_to_provider_name: string | null
          referred_to_provider_npi: string | null
          referring_provider_id: number | null
          specialty: string | null
          status: string | null
          team_id: string
          updated_at: string | null
          urgency: string | null
          visits_authorized: number | null
          visits_used: number | null
        }
        Insert: {
          authorization_number?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          patient_id?: number | null
          reason_for_referral?: string | null
          referral_type?: string | null
          referred_to_provider_name?: string | null
          referred_to_provider_npi?: string | null
          referring_provider_id?: number | null
          specialty?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
          urgency?: string | null
          visits_authorized?: number | null
          visits_used?: number | null
        }
        Update: {
          authorization_number?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          patient_id?: number | null
          reason_for_referral?: string | null
          referral_type?: string | null
          referred_to_provider_name?: string | null
          referred_to_provider_npi?: string | null
          referring_provider_id?: number | null
          specialty?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
          urgency?: string | null
          visits_authorized?: number | null
          visits_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "active_claims"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referral_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_balance_summary"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "referral_referring_provider_id_fkey"
            columns: ["referring_provider_id"]
            isOneToOne: false
            referencedRelation: "clinician"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_referring_provider_id_fkey"
            columns: ["referring_provider_id"]
            isOneToOne: false
            referencedRelation: "provider_productivity"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "referral_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      remittance_advice: {
        Row: {
          auto_posted: boolean | null
          check_number: string | null
          created_at: string | null
          discrepancies: Json | null
          era_file_path: string | null
          id: string
          parsed_data: Json | null
          payer_id: number | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          raw_era_data: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          auto_posted?: boolean | null
          check_number?: string | null
          created_at?: string | null
          discrepancies?: Json | null
          era_file_path?: string | null
          id?: string
          parsed_data?: Json | null
          payer_id?: number | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          raw_era_data?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          auto_posted?: boolean | null
          check_number?: string | null
          created_at?: string | null
          discrepancies?: Json | null
          era_file_path?: string | null
          id?: string
          parsed_data?: Json | null
          payer_id?: number | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          raw_era_data?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remittance_advice_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittance_advice_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "remittance_advice_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittance_advice_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      report_definition: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          output_format: string | null
          parameters: Json | null
          query_template: string | null
          report_type: string | null
          schedule_config: Json | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          output_format?: string | null
          parameters?: Json | null
          query_template?: string | null
          report_type?: string | null
          schedule_config?: Json | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          output_format?: string | null
          parameters?: Json | null
          query_template?: string | null
          report_type?: string | null
          schedule_config?: Json | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_definition_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_definition_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      rule_execution_log: {
        Row: {
          business_rule_id: string | null
          entity_id: string | null
          entity_type: string | null
          executed_at: string | null
          execution_details: Json | null
          execution_result: string | null
          execution_time_ms: number | null
          id: string
        }
        Insert: {
          business_rule_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          execution_details?: Json | null
          execution_result?: string | null
          execution_time_ms?: number | null
          id?: string
        }
        Update: {
          business_rule_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          execution_details?: Json | null
          execution_result?: string | null
          execution_time_ms?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_execution_log_business_rule_id_fkey"
            columns: ["business_rule_id"]
            isOneToOne: false
            referencedRelation: "business_rule"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_task: {
        Row: {
          created_at: string | null
          cron_expression: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_error: string | null
          last_run_status: string | null
          next_run_at: string | null
          parameters: Json | null
          task_name: string
          task_type: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cron_expression?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_error?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          parameters?: Json | null
          task_name: string
          task_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cron_expression?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_error?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          parameters?: Json | null
          task_name?: string
          task_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_task_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_task_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      scrubbing_result: {
        Row: {
          auto_fixable: boolean | null
          created_at: string | null
          entity_id: string
          entity_type: string
          field_path: string | null
          fixed: boolean | null
          fixed_at: string | null
          id: string
          message: string | null
          rule_name: string
          severity: string | null
          suggested_fix: Json | null
          team_id: string
        }
        Insert: {
          auto_fixable?: boolean | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          field_path?: string | null
          fixed?: boolean | null
          fixed_at?: string | null
          id?: string
          message?: string | null
          rule_name: string
          severity?: string | null
          suggested_fix?: Json | null
          team_id: string
        }
        Update: {
          auto_fixable?: boolean | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          field_path?: string | null
          fixed?: boolean | null
          fixed_at?: string | null
          id?: string
          message?: string | null
          rule_name?: string
          severity?: string | null
          suggested_fix?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrubbing_result_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrubbing_result_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          attempted_action: string | null
          blocked: boolean | null
          created_at: string | null
          error_message: string | null
          id: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          attempted_action?: string | null
          blocked?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_action?: string | null
          blocked?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_location: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          npi: string | null
          pos_code: string
          state: string | null
          tax_id: string | null
          team_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          id: string
          name: string
          npi?: string | null
          pos_code: string
          state?: string | null
          tax_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          npi?: string | null
          pos_code?: string
          state?: string | null
          tax_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_location_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_location_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      sync_job: {
        Row: {
          completed_at: string | null
          created_at: string | null
          ehr_connection_id: string | null
          entity_type: string | null
          error_log: Json | null
          id: string
          job_type: string | null
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          started_at: string | null
          status: string | null
          team_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          ehr_connection_id?: string | null
          entity_type?: string | null
          error_log?: Json | null
          id?: string
          job_type?: string | null
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string | null
          team_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          ehr_connection_id?: string | null
          entity_type?: string | null
          error_log?: Json | null
          id?: string
          job_type?: string | null
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_job_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "ehr_connection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_job_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "integration_health"
            referencedColumns: ["connection_id"]
          },
          {
            foreignKeyName: "sync_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_job_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
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
          npi: string | null
          plan_type: string | null
          settings: Json | null
          slug: string
          status: string | null
          tax_id: string | null
          trial_ends_at: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          npi?: string | null
          plan_type?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          npi?: string | null
          plan_type?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          type?: string | null
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
          team_member_id: string | null
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
          team_member_id?: string | null
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
          team_member_id?: string | null
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
          {
            foreignKeyName: "team_invitation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_invitation_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitation_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
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
          last_login_at: string | null
          mfa_enabled: boolean | null
          permissions: Json | null
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
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          permissions?: Json | null
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
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          permissions?: Json | null
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
          {
            foreignKeyName: "team_member_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          team_id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          team_id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          team_id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "team_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      trading_partner: {
        Row: {
          active: boolean | null
          connection_config: Json | null
          connection_method: string | null
          created_at: string | null
          edi_receiver_id: string | null
          edi_sender_id: string | null
          id: string
          isa_qualifier: string | null
          partner_name: string
          partner_type: string | null
          supported_transactions: string[] | null
          team_id: string
          test_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          connection_config?: Json | null
          connection_method?: string | null
          created_at?: string | null
          edi_receiver_id?: string | null
          edi_sender_id?: string | null
          id?: string
          isa_qualifier?: string | null
          partner_name: string
          partner_type?: string | null
          supported_transactions?: string[] | null
          team_id: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          connection_config?: Json | null
          connection_method?: string | null
          created_at?: string | null
          edi_receiver_id?: string | null
          edi_sender_id?: string | null
          id?: string
          isa_qualifier?: string | null
          partner_name?: string
          partner_type?: string | null
          supported_transactions?: string[] | null
          team_id?: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_partner_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trading_partner_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
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
          {
            foreignKeyName: "user_profile_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      user_session: {
        Row: {
          ended_at: string | null
          id: string
          last_activity_at: string | null
          started_at: string | null
          timeout_after_minutes: number | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          timeout_after_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          timeout_after_minutes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_config: {
        Row: {
          created_at: string | null
          ehr_connection_id: string | null
          event_type: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          retry_config: Json | null
          secret_key: string | null
          target_url: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ehr_connection_id?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          secret_key?: string | null
          target_url: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ehr_connection_id?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          secret_key?: string | null
          target_url?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_config_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "ehr_connection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_config_ehr_connection_id_fkey"
            columns: ["ehr_connection_id"]
            isOneToOne: false
            referencedRelation: "integration_health"
            referencedColumns: ["connection_id"]
          },
          {
            foreignKeyName: "webhook_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      webhook_event: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          event_type: string | null
          id: string
          next_retry_at: string | null
          payload: Json | null
          response_body: string | null
          response_status: number | null
          webhook_config_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          webhook_config_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_event_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_config"
            referencedColumns: ["id"]
          },
        ]
      }
      work_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          auto_escalate: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          priority: number | null
          queue_type: string
          sla_deadline: string | null
          started_at: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          auto_escalate?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          queue_type: string
          sla_deadline?: string | null
          started_at?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          auto_escalate?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          queue_type?: string
          sla_deadline?: string | null
          started_at?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "work_queue_summary"
            referencedColumns: ["assigned_to_id"]
          },
          {
            foreignKeyName: "work_queue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_queue_assignment_rule: {
        Row: {
          assignment_logic: string | null
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          max_items_per_user: number | null
          queue_type: string
          rule_name: string
          skill_requirements: Json | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_logic?: string | null
          conditions: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_items_per_user?: number | null
          queue_type: string
          rule_name: string
          skill_requirements?: Json | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_logic?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_items_per_user?: number | null
          queue_type?: string
          rule_name?: string
          skill_requirements?: Json | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_assignment_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queue_assignment_rule_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      workflow_execution: {
        Row: {
          actions_performed: Json | null
          automation_rule_id: string | null
          error_details: string | null
          executed_at: string | null
          execution_status: string | null
          id: string
          team_id: string
          trigger_data: Json | null
        }
        Insert: {
          actions_performed?: Json | null
          automation_rule_id?: string | null
          error_details?: string | null
          executed_at?: string | null
          execution_status?: string | null
          id?: string
          team_id: string
          trigger_data?: Json | null
        }
        Update: {
          actions_performed?: Json | null
          automation_rule_id?: string | null
          error_details?: string | null
          executed_at?: string | null
          execution_status?: string | null
          id?: string
          team_id?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      workflow_state: {
        Row: {
          created_at: string | null
          current_state: string
          entity_id: string
          entity_type: string
          id: string
          previous_state: string | null
          state_data: Json | null
          state_entered_at: string | null
          team_id: string
          transitions_history: Json[] | null
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          current_state: string
          entity_id: string
          entity_type: string
          id?: string
          previous_state?: string | null
          state_data?: Json | null
          state_entered_at?: string | null
          team_id: string
          transitions_history?: Json[] | null
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          current_state?: string
          entity_id?: string
          entity_type?: string
          id?: string
          previous_state?: string | null
          state_data?: Json | null
          state_entered_at?: string | null
          team_id?: string
          transitions_history?: Json[] | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_state_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_state_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      x12_transaction: {
        Row: {
          acknowledgment_received: boolean | null
          clearinghouse_id: string | null
          control_number: string | null
          created_at: string | null
          direction: string | null
          error_messages: Json | null
          file_path: string | null
          file_size: number | null
          id: string
          record_count: number | null
          status: string | null
          team_id: string
          transaction_type: string | null
          transmitted_at: string | null
        }
        Insert: {
          acknowledgment_received?: boolean | null
          clearinghouse_id?: string | null
          control_number?: string | null
          created_at?: string | null
          direction?: string | null
          error_messages?: Json | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          record_count?: number | null
          status?: string | null
          team_id: string
          transaction_type?: string | null
          transmitted_at?: string | null
        }
        Update: {
          acknowledgment_received?: boolean | null
          clearinghouse_id?: string | null
          control_number?: string | null
          created_at?: string | null
          direction?: string | null
          error_messages?: Json | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          record_count?: number | null
          status?: string | null
          team_id?: string
          transaction_type?: string | null
          transmitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "x12_transaction_clearinghouse_id_fkey"
            columns: ["clearinghouse_id"]
            isOneToOne: false
            referencedRelation: "clearinghouse_connection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "x12_transaction_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "x12_transaction_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
    }
    Views: {
      _internal_prior_auth_metrics: {
        Row: {
          approved: number | null
          auto_approved: number | null
          avg_confidence: number | null
          avg_turnaround_days: number | null
          team_id: string | null
          total_pas: number | null
          week: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      _internal_revenue_cycle_metrics: {
        Row: {
          avg_days_to_payment: number | null
          denied_amount: number | null
          month: string | null
          paid_claims: number | null
          team_id: string | null
          total_billed: number | null
          total_claims: number | null
          total_collected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      active_claims: {
        Row: {
          accepted_at: string | null
          attempt_count: number | null
          auto_submitted: boolean | null
          claim_number: string | null
          confidence: number | null
          cpt: string | null
          created_at: string | null
          dos: string | null
          encounter_id: string | null
          field_confidences: Json | null
          first_name: string | null
          icd10: string | null
          id: string | null
          issues: string[] | null
          last_name: string | null
          meta: Json | null
          paid_amount: number | null
          paid_at: string | null
          patient_id: number | null
          payer_id: number | null
          payer_name: string | null
          rejected_at: string | null
          status: string | null
          submitted_at: string | null
          suggested_fixes: Json[] | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer_performance"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      active_user_sessions: {
        Row: {
          email: string | null
          id: string | null
          last_activity_at: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      ar_aging_detail: {
        Row: {
          accepted_at: string | null
          aging_bucket: string | null
          balance: number | null
          claim_id: string | null
          claim_number: string | null
          days_outstanding: number | null
          paid_amount: number | null
          patient_name: string | null
          payer_name: string | null
          rejected_at: string | null
          service_date: string | null
          status: string | null
          submitted_at: string | null
          team_id: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      automation_metrics: {
        Row: {
          automation_rate: number | null
          avg_auto_claim_confidence: number | null
          avg_auto_pa_confidence: number | null
          claims_auto_submitted: number | null
          claims_manual_submitted: number | null
          date: string | null
          pas_auto_approved: number | null
          team_id: string | null
          total_transactions: number | null
        }
        Relationships: []
      }
      claim_dashboard: {
        Row: {
          avg_age_days: number | null
          claim_count: number | null
          outstanding_balance: number | null
          over_30_days: number | null
          over_60_days: number | null
          over_90_days: number | null
          status: string | null
          team_id: string | null
          total_billed: number | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      credentialing_status: {
        Row: {
          expiration_date: string | null
          first_name: string | null
          last_name: string | null
          npi_key: string | null
          payer_name: string | null
          state: string | null
          status: string | null
        }
        Relationships: []
      }
      denial_analytics: {
        Row: {
          appeal_deadline: string | null
          appealable: boolean | null
          carc_code: string | null
          claim_id: string | null
          claim_number: string | null
          days_until_deadline: number | null
          denial_date: string | null
          denial_reason: string | null
          denial_status: string | null
          denial_type: string | null
          financial_impact: number | null
          past_deadline: boolean | null
          payer_name: string | null
          preventable: boolean | null
          rarc_code: string | null
          root_cause: string | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "denial_tracking_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denial_tracking_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      financial_performance: {
        Row: {
          ar_balance: number | null
          avg_days_to_payment: number | null
          collection_rate: number | null
          collections: number | null
          denial_rate: number | null
          denials: number | null
          gross_charges: number | null
          month: string | null
          team_id: string | null
          total_claims: number | null
          total_encounters: number | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      integration_health: {
        Row: {
          connection_id: string | null
          connection_status: string | null
          ehr_system: string | null
          last_error: string | null
          last_sync_at: string | null
          recent_failures: number | null
          recent_successes: number | null
          team_name: string | null
        }
        Relationships: []
      }
      my_clerk_sync_status: {
        Row: {
          clerk_user_id: string | null
          last_synced_at: string | null
          organization_id: string | null
          sync_freshness: string | null
          sync_status: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          last_synced_at?: string | null
          organization_id?: string | null
          sync_freshness?: never
          sync_status?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          last_synced_at?: string | null
          organization_id?: string | null
          sync_freshness?: never
          sync_status?: string | null
        }
        Relationships: []
      }
      pa_pipeline: {
        Row: {
          approved_at: string | null
          auth_number: string | null
          auto_approved: boolean | null
          confidence: number | null
          days_in_review: number | null
          days_pending: number | null
          denied_at: string | null
          duration_days: number | null
          indication: string | null
          medication: string | null
          pa_id: string | null
          patient_name: string | null
          payer_name: string | null
          quantity: number | null
          status: string | null
          submitted_at: string | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_auth_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      patient_balance_summary: {
        Row: {
          current_balance: number | null
          email: string | null
          has_payment_plan: boolean | null
          last_payment_date: string | null
          last_statement_date: string | null
          open_claims: number | null
          patient_id: number | null
          patient_name: string | null
          phone: string | null
          statements_sent: number | null
          team_id: string | null
          total_paid: number | null
          total_patient_responsibility: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payer_performance: {
        Row: {
          avg_days_to_payment: number | null
          claims_in_flight: number | null
          collection_rate: number | null
          denial_rate: number | null
          denied_claims: number | null
          paid_claims: number | null
          payer_id: number | null
          payer_name: string | null
          team_id: string | null
          total_billed: number | null
          total_claims: number | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payment_posting_activity: {
        Row: {
          completed_at: string | null
          era_file_name: string | null
          exceptions: Json | null
          id: string | null
          payments_posted: number | null
          posted_by: string | null
          posted_by_email: string | null
          posted_by_name: string | null
          started_at: string | null
          team_id: string | null
          total_posted: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_member_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_variance_summary: {
        Row: {
          appeals_needed: number | null
          avg_variance: number | null
          payer_name: string | null
          total_variance: number | null
          variance_count: number | null
        }
        Relationships: []
      }
      prior_auth_metrics: {
        Row: {
          approved: number | null
          auto_approved: number | null
          avg_confidence: number | null
          avg_turnaround_days: number | null
          total_pas: number | null
          week: string | null
        }
        Relationships: []
      }
      provider_productivity: {
        Row: {
          collection_rate: number | null
          denied_claims: number | null
          month: string | null
          npi_key: string | null
          provider_id: number | null
          provider_name: string | null
          team_id: string | null
          total_charges: number | null
          total_collections: number | null
          total_encounters: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
      revenue_cycle_metrics: {
        Row: {
          avg_days_to_payment: number | null
          denied_amount: number | null
          month: string | null
          paid_claims: number | null
          total_billed: number | null
          total_claims: number | null
          total_collected: number | null
        }
        Relationships: []
      }
      team_metrics: {
        Row: {
          approved_prior_auths: number | null
          avg_automation_confidence: number | null
          denied_claims: number | null
          last_sync_date: string | null
          paid_claims: number | null
          team_id: string | null
          team_name: string | null
          total_claims: number | null
          total_prior_auths: number | null
          total_users: number | null
        }
        Relationships: []
      }
      webhook_health_monitor: {
        Row: {
          error_count: number | null
          event_count: number | null
          event_type: string | null
          hour: string | null
        }
        Relationships: []
      }
      work_queue_summary: {
        Row: {
          assigned_to_id: string | null
          assigned_to_name: string | null
          avg_age_days: number | null
          due_soon: number | null
          high_priority: number | null
          item_count: number | null
          low_priority: number | null
          medium_priority: number | null
          overdue: number | null
          queue_type: string | null
          status: string | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_metrics"
            referencedColumns: ["team_id"]
          },
        ]
      }
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: boolean
      }
      auto_post_era_payment: {
        Args: { p_remittance_id: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_contractual_adjustment: {
        Args: { p_claim_id: string }
        Returns: number
      }
      calculate_days_in_ar: {
        Args: { claim_id: string }
        Returns: number
      }
      calculate_next_retry: {
        Args: { p_attempt_number: number; p_strategy?: string }
        Returns: string
      }
      calculate_patient_balance: {
        Args: { p_patient_id: number }
        Returns: number
      }
      can_provider_bill_payer: {
        Args: { p_clinician_id: number; p_payer_id: number }
        Returns: boolean
      }
      check_drug_requires_pa: {
        Args: { p_ndc_code: string; p_payer_id: number }
        Returns: boolean
      }
      check_pa_required: {
        Args: {
          p_cpt_code: string
          p_icd10_codes: string[]
          p_payer_id: number
          p_service_date: string
        }
        Returns: {
          requires_pa: boolean
          rule_details: Json
          rule_id: string
        }[]
      }
      check_prior_auth_requirement: {
        Args: { p_ndc_code: string; p_patient_id: number }
        Returns: {
          alternatives: string[]
          criteria: Json
          requires_pa: boolean
          tier: number
        }[]
      }
      check_timely_filing: {
        Args: { p_claim_id: string }
        Returns: {
          days_remaining: number
          filing_deadline: string
          within_filing: boolean
        }[]
      }
      cleanup_expired_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_team_with_owner: {
        Args: { owner_id?: string; team_name: string; team_slug: string }
        Returns: string
      }
      end_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      flag_claims_for_followup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_ar_aging_summary: {
        Args: { p_as_of_date?: string; p_team_id: string }
        Returns: {
          bucket: string
          claim_count: number
          total_amount: number
        }[]
      }
      get_auth_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_auth_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_appointment_slots: {
        Args: { p_date: string; p_location_id?: string; p_provider_id: number }
        Returns: {
          duration_minutes: number
          location_id: string
          slot_time: string
        }[]
      }
      get_claim_age_days: {
        Args: { p_claim_id: string }
        Returns: number
      }
      get_claim_readiness_score: {
        Args: { p_claim_id: string }
        Returns: {
          blocking_issues: string[]
          readiness_score: number
          warnings: string[]
        }[]
      }
      get_current_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_scheduled_task: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          cron_expression: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_error: string | null
          last_run_status: string | null
          next_run_at: string | null
          parameters: Json | null
          task_name: string
          task_type: string | null
          team_id: string | null
          updated_at: string | null
        }
      }
      get_next_work_item: {
        Args: { user_id: string }
        Returns: string
      }
      get_patient_financial_summary: {
        Args: { p_patient_id: number }
        Returns: {
          current_balance: number
          insurance_payments: number
          last_payment_date: string
          patient_payments: number
          statements_sent: number
          total_charges: number
        }[]
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
      get_prior_auth_metrics: {
        Args: { weeks_back?: number }
        Returns: {
          approved: number
          auto_approved: number
          avg_confidence: number
          avg_turnaround_days: number
          total_pas: number
          week: string
        }[]
      }
      get_revenue_cycle_metrics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          avg_days_to_payment: number
          denied_amount: number
          month: string
          paid_claims: number
          total_billed: number
          total_claims: number
          total_collected: number
        }[]
      }
      get_security_audit_logs: {
        Args: {
          p_action?: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          attempted_action: string
          blocked: boolean
          created_at: string
          error_message: string
          id: string
          team_id: string
          user_id: string
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
      is_auth_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      log_clerk_webhook: {
        Args: { p_clerk_id: string; p_event_type: string; p_payload: Json }
        Returns: string
      }
      log_phi_export: {
        Args: {
          p_entity_types: string[]
          p_export_type: string
          p_purpose: string
          p_record_count: number
        }
        Returns: undefined
      }
      log_security_event: {
        Args:
          | { action: string; custom_team_id?: string; error_msg?: string }
          | { action: string; error_msg?: string }
        Returns: undefined
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
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_metrics_refresh: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      sync_clerk_user: {
        Args: {
          p_clerk_user_id: string
          p_organization_id: string
          p_supabase_user_id: string
          p_team_id: string
        }
        Returns: undefined
      }
      upsert_fhir_resource: {
        Args: {
          p_mapped_entity_id?: string
          p_mapped_entity_type?: string
          p_resource_data: Json
          p_resource_id: string
          p_resource_type: string
          p_team_id: string
        }
        Returns: string
      }
      validate_provider_billing: {
        Args: { p_encounter_id: string }
        Returns: {
          can_bill: boolean
          enrollment_issues: string[]
          enrollment_status: string
        }[]
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
      adjustment_type:
        | "contractual"
        | "write_off"
        | "refund"
        | "correction"
        | "transfer"
        | "reversal"
      appeal_status:
        | "preparing"
        | "ready"
        | "submitted"
        | "in_review"
        | "under_review"
        | "approved"
        | "partially_approved"
        | "denied"
        | "withdrawn"
        | "closed"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "reminder_sent"
        | "arrived"
        | "roomed"
        | "with_provider"
        | "completed"
        | "no_show"
        | "cancelled"
        | "rescheduled"
      automation_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "retrying"
        | "cancelled"
      batch_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "acknowledged"
        | "rejected"
      claim_status:
        | "draft"
        | "built"
        | "ready_to_submit"
        | "submitted"
        | "accepted_277ca"
        | "rejected_277ca"
        | "awaiting_277ca"
        | "in_review"
        | "approved"
        | "denied"
        | "partially_paid"
        | "paid"
        | "appealing"
        | "closed"
        | "void"
      communication_type:
        | "phone_inbound"
        | "phone_outbound"
        | "fax_inbound"
        | "fax_outbound"
        | "email"
        | "portal_message"
        | "sms"
        | "mail"
      denial_status:
        | "new"
        | "under_review"
        | "assigned"
        | "appealing"
        | "appealed"
        | "resolved"
        | "closed"
        | "written_off"
      document_status:
        | "uploaded"
        | "processing"
        | "verified"
        | "rejected"
        | "archived"
        | "deleted"
      document_type:
        | "insurance_card"
        | "drivers_license"
        | "medical_record"
        | "lab_result"
        | "imaging"
        | "referral"
        | "prior_auth_form"
        | "appeal_letter"
        | "eob"
        | "consent_form"
        | "financial_agreement"
        | "other"
      eligibility_check_type:
        | "standard"
        | "real_time"
        | "batch"
        | "pre_visit"
        | "pre_service"
      era_status: "pending" | "processing" | "posted" | "failed" | "partial"
      followup_reason:
        | "no_response"
        | "underpayment"
        | "denial"
        | "request_records"
      gender: "male" | "female" | "other" | "unknown" | "prefer_not_to_say"
      insurance_policy_type: "Primary" | "Secondary"
      payer_config_type:
        | "submission"
        | "eligibility"
        | "pa_submission"
        | "portal"
        | "general"
      payment_posting_status:
        | "pending"
        | "auto_posted"
        | "manual_review"
        | "posted"
        | "suspended"
        | "rejected"
      payment_status:
        | "pending"
        | "processing"
        | "processed"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "voided"
      prior_auth_status:
        | "draft"
        | "pending_info"
        | "ready_to_submit"
        | "submitted"
        | "in_review"
        | "peer_to_peer_required"
        | "approved"
        | "partially_approved"
        | "denied"
        | "expired"
        | "cancelled"
      retry_backoff_strategy: "exponential" | "linear" | "fixed"
      scrubbing_severity: "error" | "warning" | "info"
      team_status:
        | "trial"
        | "active"
        | "suspended"
        | "cancelled"
        | "pending_deletion"
      user_role:
        | "super_admin"
        | "org_admin"
        | "biller"
        | "coder"
        | "provider"
        | "nurse"
        | "front_desk"
        | "viewer"
      validation_status: "pass" | "warning" | "error" | "pending"
      visit_type:
        | "office_visit"
        | "telehealth"
        | "hospital_inpatient"
        | "hospital_outpatient"
        | "emergency"
        | "urgent_care"
        | "home_health"
        | "skilled_nursing"
        | "phone"
        | "other"
      work_queue_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "on_hold"
        | "escalated"
        | "completed"
        | "cancelled"
      x12_transaction_type:
        | "270"
        | "271"
        | "276"
        | "277"
        | "278"
        | "820"
        | "834"
        | "835"
        | "837P"
        | "837I"
        | "837D"
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
      adjustment_type: [
        "contractual",
        "write_off",
        "refund",
        "correction",
        "transfer",
        "reversal",
      ],
      appeal_status: [
        "preparing",
        "ready",
        "submitted",
        "in_review",
        "under_review",
        "approved",
        "partially_approved",
        "denied",
        "withdrawn",
        "closed",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "reminder_sent",
        "arrived",
        "roomed",
        "with_provider",
        "completed",
        "no_show",
        "cancelled",
        "rescheduled",
      ],
      automation_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "retrying",
        "cancelled",
      ],
      batch_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "acknowledged",
        "rejected",
      ],
      claim_status: [
        "draft",
        "built",
        "ready_to_submit",
        "submitted",
        "accepted_277ca",
        "rejected_277ca",
        "awaiting_277ca",
        "in_review",
        "approved",
        "denied",
        "partially_paid",
        "paid",
        "appealing",
        "closed",
        "void",
      ],
      communication_type: [
        "phone_inbound",
        "phone_outbound",
        "fax_inbound",
        "fax_outbound",
        "email",
        "portal_message",
        "sms",
        "mail",
      ],
      denial_status: [
        "new",
        "under_review",
        "assigned",
        "appealing",
        "appealed",
        "resolved",
        "closed",
        "written_off",
      ],
      document_status: [
        "uploaded",
        "processing",
        "verified",
        "rejected",
        "archived",
        "deleted",
      ],
      document_type: [
        "insurance_card",
        "drivers_license",
        "medical_record",
        "lab_result",
        "imaging",
        "referral",
        "prior_auth_form",
        "appeal_letter",
        "eob",
        "consent_form",
        "financial_agreement",
        "other",
      ],
      eligibility_check_type: [
        "standard",
        "real_time",
        "batch",
        "pre_visit",
        "pre_service",
      ],
      era_status: ["pending", "processing", "posted", "failed", "partial"],
      followup_reason: [
        "no_response",
        "underpayment",
        "denial",
        "request_records",
      ],
      gender: ["male", "female", "other", "unknown", "prefer_not_to_say"],
      insurance_policy_type: ["Primary", "Secondary"],
      payer_config_type: [
        "submission",
        "eligibility",
        "pa_submission",
        "portal",
        "general",
      ],
      payment_posting_status: [
        "pending",
        "auto_posted",
        "manual_review",
        "posted",
        "suspended",
        "rejected",
      ],
      payment_status: [
        "pending",
        "processing",
        "processed",
        "failed",
        "refunded",
        "partially_refunded",
        "voided",
      ],
      prior_auth_status: [
        "draft",
        "pending_info",
        "ready_to_submit",
        "submitted",
        "in_review",
        "peer_to_peer_required",
        "approved",
        "partially_approved",
        "denied",
        "expired",
        "cancelled",
      ],
      retry_backoff_strategy: ["exponential", "linear", "fixed"],
      scrubbing_severity: ["error", "warning", "info"],
      team_status: [
        "trial",
        "active",
        "suspended",
        "cancelled",
        "pending_deletion",
      ],
      user_role: [
        "super_admin",
        "org_admin",
        "biller",
        "coder",
        "provider",
        "nurse",
        "front_desk",
        "viewer",
      ],
      validation_status: ["pass", "warning", "error", "pending"],
      visit_type: [
        "office_visit",
        "telehealth",
        "hospital_inpatient",
        "hospital_outpatient",
        "emergency",
        "urgent_care",
        "home_health",
        "skilled_nursing",
        "phone",
        "other",
      ],
      work_queue_status: [
        "pending",
        "assigned",
        "in_progress",
        "on_hold",
        "escalated",
        "completed",
        "cancelled",
      ],
      x12_transaction_type: [
        "270",
        "271",
        "276",
        "277",
        "278",
        "820",
        "834",
        "835",
        "837P",
        "837I",
        "837D",
      ],
    },
  },
} as const
