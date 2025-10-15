CREATE TYPE "public"."access_level" AS ENUM('none', 'read', 'write', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."adjustment_code_type" AS ENUM('CARC', 'RARC', 'GROUP', 'MOA', 'MIA', 'CUSTOM', 'PAYER_SPECIFIC');--> statement-breakpoint
CREATE TYPE "public"."adjustment_reason_category" AS ENUM('Patient Responsibility', 'Coverage', 'Medical Necessity', 'Benefit Limit', 'Administrative', 'Duplicate', 'Authorization', 'COB', 'Contractual', 'Documentation', 'Eligibility', 'Timely Filing', 'Coding Error', 'Bundling', 'Appeal Rights', 'Routing', 'Informational');--> statement-breakpoint
CREATE TYPE "public"."adjustment_type" AS ENUM('contractual', 'write_off', 'refund', 'correction', 'transfer', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_category" AS ENUM('user_action', 'system_event', 'performance', 'error', 'security', 'business_metric');--> statement-breakpoint
CREATE TYPE "public"."appeal_level" AS ENUM('first_level', 'second_level', 'third_level', 'external_review');--> statement-breakpoint
CREATE TYPE "public"."appeal_status" AS ENUM('pending', 'submitted', 'in_review', 'approved', 'denied', 'withdrawn', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('active', 'inactive', 'testing', 'error');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('pending', 'posted', 'billed', 'paid', 'adjusted', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('draft', 'ready_for_submission', 'submitted', 'accepted', 'rejected', 'paid', 'denied', 'pending', 'needs_review', 'appeal_required');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('current', 'overdue', 'in_collections', 'payment_plan', 'written_off', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('email', 'phone', 'fax', 'portal', 'mail', 'sms');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('compliant', 'non_compliant', 'pending_review', 'needs_attention');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('emergency', 'family', 'friend', 'caregiver', 'legal_guardian', 'other');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'inactive', 'pending', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."credentialing_status" AS ENUM('not_started', 'in_progress', 'pending_review', 'approved', 'denied', 'expired', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."data_quality_status" AS ENUM('high', 'medium', 'low', 'critical');--> statement-breakpoint
CREATE TYPE "public"."data_source_type" AS ENUM('ehr', 'manual_entry', 'api', 'file_import', 'automated_extraction');--> statement-breakpoint
CREATE TYPE "public"."denial_category" AS ENUM('authorization', 'eligibility', 'coverage', 'medical_necessity', 'coding', 'documentation', 'duplicate', 'timely_filing', 'coordination_of_benefits');--> statement-breakpoint
CREATE TYPE "public"."denial_status" AS ENUM('new', 'under_review', 'appealed', 'resolved', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('medical_record', 'insurance_card', 'id_verification', 'prior_auth', 'appeal_document', 'correspondence', 'claim_attachment', 'other');--> statement-breakpoint
CREATE TYPE "public"."ehr_api_type" AS ENUM('fhir', 'rest', 'custom');--> statement-breakpoint
CREATE TYPE "public"."ehr_auth_method" AS ENUM('oauth2', 'api_key', 'custom', 'smart_on_fhir');--> statement-breakpoint
CREATE TYPE "public"."eligibility_check_type" AS ENUM('real_time', 'batch', 'manual');--> statement-breakpoint
CREATE TYPE "public"."eligibility_response" AS ENUM('active', 'inactive', 'terminated', 'unknown', 'error');--> statement-breakpoint
CREATE TYPE "public"."encounter_status" AS ENUM('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."era_status" AS ENUM('pending', 'processing', 'posted', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."formulary_tier" AS ENUM('tier_1', 'tier_2', 'tier_3', 'tier_4', 'specialty', 'non_formulary');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'O', 'U');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('ehr', 'clearinghouse', 'payer', 'pharmacy', 'lab', 'imaging', 'other');--> statement-breakpoint
CREATE TYPE "public"."lab_status" AS ENUM('ordered', 'collected', 'in_progress', 'completed', 'cancelled', 'resulted');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('active', 'inactive', 'expired', 'suspended', 'revoked', 'pending');--> statement-breakpoint
CREATE TYPE "public"."medication_status" AS ENUM('active', 'inactive', 'discontinued', 'completed', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('email', 'sms', 'push', 'in_app', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."patient_status" AS ENUM('active', 'inactive', 'deceased', 'merged', 'test');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire_transfer', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'posted', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."prior_auth_status" AS ENUM('pending', 'approved', 'denied', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."provider_enrollment_status" AS ENUM('pending', 'in_progress', 'approved', 'denied', 'suspended', 'terminated', 'revalidating');--> statement-breakpoint
CREATE TYPE "public"."provider_enrollment_type" AS ENUM('initial', 'revalidation', 'change_of_ownership', 'change_of_location', 'reassignment');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('pending', 'matched', 'unmatched', 'disputed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('available', 'in_use', 'maintenance', 'out_of_service', 'reserved');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('room', 'equipment', 'vehicle', 'device', 'other');--> statement-breakpoint
CREATE TYPE "public"."retry_backoff_strategy" AS ENUM('linear', 'exponential', 'fibonacci', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('regular', 'overtime', 'on_call', 'emergency', 'vacation_coverage', 'sick_coverage');--> statement-breakpoint
CREATE TYPE "public"."statement_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'disputed', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."validation_status" AS ENUM('pending', 'valid', 'invalid', 'warning', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."variance_type" AS ENUM('overpayment', 'underpayment', 'timing_difference', 'policy_change', 'coding_error', 'other');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('office_visit', 'telemedicine', 'emergency', 'inpatient', 'outpatient', 'consultation', 'procedure', 'follow_up', 'annual_physical');--> statement-breakpoint
CREATE TYPE "public"."work_queue_type" AS ENUM('claim_review', 'prior_auth', 'appeal', 'payment_posting', 'denial_management', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "adjustment_reason_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"code_type" "adjustment_code_type" NOT NULL,
	"category" "adjustment_reason_category" NOT NULL,
	"description" text NOT NULL,
	"short_description" varchar(100),
	"payer_id" uuid,
	"payer_specific_code" varchar(20),
	"financial_class" varchar(50),
	"requires_patient_notification" boolean DEFAULT false,
	"appealable" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "analytics_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_member_id" uuid,
	"event_name" varchar(100) NOT NULL,
	"category" "analytics_event_category" NOT NULL,
	"properties" json,
	"session_id" varchar(128),
	"user_agent" text,
	"ip_address" varchar(45),
	"url" text,
	"referrer" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annual_code_update" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"update_year" integer NOT NULL,
	"code_type" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'planned',
	"started_at" timestamp,
	"completed_at" timestamp,
	"total_records_processed" integer,
	"new_codes" integer,
	"updated_codes" integer,
	"deprecated_codes" integer,
	"source_file" varchar(255),
	"source_checksum" varchar(64),
	"source_url" text,
	"backup_location" text,
	"can_rollback" boolean DEFAULT true,
	"error_message" text,
	"validation_errors" jsonb,
	"initiated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"scopes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "api_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"release_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_backward_compatible" boolean DEFAULT true,
	"deprecation_date" date,
	"sunset_date" date,
	"migration_guide" text,
	"release_notes" text,
	"breaking_changes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"appeal_number" varchar(50),
	"appeal_level" "appeal_level" DEFAULT 'first_level' NOT NULL,
	"appeal_type" varchar(50),
	"appeal_date" date NOT NULL,
	"due_date" date,
	"response_date" date,
	"status" "appeal_status" DEFAULT 'pending' NOT NULL,
	"appealed_amount" numeric(10, 2) NOT NULL,
	"recovered_amount" numeric(10, 2) DEFAULT '0',
	"appeal_reason" text NOT NULL,
	"clinical_justification" text,
	"additional_documentation" text,
	"submission_method" varchar(20),
	"confirmation_number" varchar(50),
	"payer_response" text,
	"response_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"appointment_type" varchar(50),
	"location_name" text,
	"room_number" varchar(20),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"cancellation_reason" text,
	"chief_complaint" text,
	"notes" text,
	"cpt_codes" text,
	"diagnosis_codes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"old_values" json,
	"new_values" json,
	"changed_fields" text,
	"user_id" uuid,
	"user_email" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"contains_phi" boolean DEFAULT false NOT NULL,
	"access_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"automation_rule_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" json DEFAULT '{}'::json,
	"context_type" varchar(50),
	"context_id" uuid,
	"execution_id" uuid,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_retry" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"task_id" varchar(255) NOT NULL,
	"attempt_number" integer NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"backoff_strategy" "retry_backoff_strategy" DEFAULT 'exponential',
	"last_error" text,
	"metadata" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"trigger_events" text,
	"conditions" json NOT NULL,
	"actions" json NOT NULL,
	"action_order" integer DEFAULT 1,
	"priority" integer DEFAULT 100,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"timeout_seconds" integer DEFAULT 30,
	"entity_types" text,
	"payer_ids" text,
	"provider_ids" text,
	"status" "automation_status" DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_executed" timestamp,
	"execution_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"average_execution_time" integer,
	"rate_limit_per_hour" integer,
	"rate_limit_per_day" integer,
	"test_mode" boolean DEFAULT false,
	"validation_rules" json,
	"schedule_cron" varchar(100),
	"schedule_timezone" varchar(50) DEFAULT 'UTC',
	"next_execution" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "batch_job_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_job_id" uuid NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"item_id" uuid NOT NULL,
	"item_data" json,
	"status" "batch_status" DEFAULT 'pending' NOT NULL,
	"processing_order" integer NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"result" json,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"job_name" varchar(100) NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"description" text,
	"parameters" json,
	"priority" integer DEFAULT 5 NOT NULL,
	"status" "batch_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"total_items" integer DEFAULT 0 NOT NULL,
	"processed_items" integer DEFAULT 0 NOT NULL,
	"successful_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "benefits_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"insurance_policy_id" uuid NOT NULL,
	"service_category" varchar(50) NOT NULL,
	"service_type" varchar(50),
	"deductible" numeric(10, 2),
	"deductible_met" numeric(10, 2) DEFAULT '0',
	"out_of_pocket_max" numeric(10, 2),
	"out_of_pocket_met" numeric(10, 2) DEFAULT '0',
	"copay" numeric(8, 2),
	"coinsurance_patient" numeric(5, 4),
	"coinsurance_plan" numeric(5, 4),
	"visit_limit" integer,
	"visit_limit_period" varchar(20),
	"amount_limit" numeric(10, 2),
	"amount_limit_period" varchar(20),
	"prior_auth_required" boolean DEFAULT false,
	"referral_required" boolean DEFAULT false,
	"pre_approval_required" boolean DEFAULT false,
	"in_network" boolean DEFAULT true,
	"network_tier" varchar(20),
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"last_verified_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_rule_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"automation_rule_id" uuid NOT NULL,
	"business_rule_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"trigger_event" varchar(100) NOT NULL,
	"trigger_data" json,
	"trigger_timestamp" timestamp DEFAULT now() NOT NULL,
	"execution_status" varchar(20) NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"execution_time_ms" integer,
	"conditions_evaluated" json,
	"conditions_met" boolean DEFAULT false,
	"conditions_failure_reason" text,
	"actions_performed" json,
	"action_results" json,
	"result" varchar(20) NOT NULL,
	"result_message" text,
	"error_message" text,
	"impact_description" text,
	"affected_records" text,
	"retry_count" integer DEFAULT 0,
	"is_retry" boolean DEFAULT false,
	"original_execution_id" uuid,
	"input_data" json,
	"environment" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"executed_by" varchar(20) DEFAULT 'system'
);
--> statement-breakpoint
CREATE TABLE "business_rule_condition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"business_rule_id" uuid NOT NULL,
	"condition_type" varchar(50) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"operator" varchar(20) NOT NULL,
	"expected_value" text,
	"logical_operator" varchar(10) DEFAULT 'AND',
	"grouping" varchar(10),
	"is_active" boolean DEFAULT true,
	"evaluation_order" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"trigger_event" varchar(50) NOT NULL,
	"conditions" json NOT NULL,
	"actions" json NOT NULL,
	"priority" integer DEFAULT 100,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "charge_capture" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"encounter_id" uuid,
	"charge_number" varchar(50),
	"service_date" date NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"modifier_1" varchar(2),
	"modifier_2" varchar(2),
	"units" integer DEFAULT 1 NOT NULL,
	"charge_amount" numeric(10, 2) NOT NULL,
	"contracted_amount" numeric(10, 2),
	"primary_diagnosis" varchar(10),
	"diagnosis_pointer" varchar(4),
	"status" charge_status DEFAULT 'pending' NOT NULL,
	"posted_date" timestamp,
	"billed_date" timestamp,
	"is_late_charge" boolean DEFAULT false,
	"original_charge_id" uuid,
	"reason_code" varchar(10),
	"is_validated" boolean DEFAULT false,
	"validated_by" uuid,
	"validated_at" timestamp,
	"validation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "claim_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid,
	"filename" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"s3_key" varchar(255) NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claim_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"modifier_1" varchar(2),
	"modifier_2" varchar(2),
	"modifier_3" varchar(2),
	"modifier_4" varchar(2),
	"charge_amount" numeric(10, 2) NOT NULL,
	"allowed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"adjustment_amount" numeric(10, 2) DEFAULT '0',
	"service_date" date NOT NULL,
	"units" integer DEFAULT 1,
	"diagnosis_code_1" varchar(10),
	"diagnosis_code_2" varchar(10),
	"diagnosis_code_3" varchar(10),
	"diagnosis_code_4" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "claim_state_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"from_status" "claim_status",
	"to_status" "claim_status" NOT NULL,
	"change_reason" text,
	"changed_by" uuid,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_validation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"validation_type" varchar(50) NOT NULL,
	"validation_rule" text NOT NULL,
	"validation_result" varchar(20) NOT NULL,
	"error_code" varchar(20),
	"error_message" text,
	"error_severity" varchar(20),
	"can_auto_fix" boolean DEFAULT false,
	"auto_fix_applied" boolean DEFAULT false,
	"manual_review_required" boolean DEFAULT false,
	"confidence_score" numeric(5, 4),
	"status" varchar(20) DEFAULT 'pending',
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"claim_number" varchar(50),
	"control_number" varchar(50),
	"service_date" date NOT NULL,
	"service_date_to" date,
	"total_charges" numeric(10, 2) NOT NULL,
	"total_paid" numeric(10, 2) DEFAULT '0',
	"total_adjustments" numeric(10, 2) DEFAULT '0',
	"status" "claim_status" DEFAULT 'draft' NOT NULL,
	"submission_date" timestamp,
	"paid_date" timestamp,
	"clearinghouse_id" uuid,
	"batch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "clearinghouse_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clearinghouse_id" uuid NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"claim_count" integer NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submission_date" timestamp,
	"acknowledgment_date" timestamp,
	"batch_file_path" text,
	"acknowledgment_file_path" text,
	"submitted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clearinghouse_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clearinghouse_name" text NOT NULL,
	"connection_type" varchar(20) NOT NULL,
	"host_url" text,
	"username" text,
	"password" text,
	"port" integer,
	"submission_format" varchar(10) DEFAULT 'X12',
	"test_mode" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_connection_test" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "clinician" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" varchar(50),
	"npi" varchar(10),
	"license_number" varchar(50),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"suffix" varchar(10),
	"title" varchar(50),
	"department" varchar(50),
	"specialty" text,
	"credentials" text,
	"email" text,
	"phone" varchar(20),
	"hire_date" date,
	"termination_date" date,
	"employment_status" varchar(20) DEFAULT 'active',
	"can_access_phi" boolean DEFAULT false,
	"access_level" "access_level" DEFAULT 'read',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "code_crosswalk" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"icd10_code_id" uuid,
	"cpt_code_id" uuid,
	"relationship_type" varchar(50),
	"payer_specific" varchar(100),
	"effectiveness_date" date,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_update_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"code_id" uuid,
	"code_value" varchar(10),
	"field_changed" varchar(100),
	"old_value" text,
	"new_value" text,
	"change_type" varchar(20) NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"update_source" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"claim_id" uuid,
	"account_number" varchar(50),
	"original_amount" numeric(10, 2) NOT NULL,
	"current_balance" numeric(10, 2) NOT NULL,
	"status" "collection_status" DEFAULT 'current' NOT NULL,
	"days_outstanding" integer NOT NULL,
	"last_contact_date" date,
	"next_contact_date" date,
	"contact_attempts" integer DEFAULT 0,
	"assigned_collector" uuid,
	"assigned_date" timestamp,
	"is_external_collection" boolean DEFAULT false,
	"external_agency" text,
	"external_account_number" varchar(50),
	"placement_date" date,
	"resolution_date" date,
	"resolution_method" varchar(50),
	"resolution_amount" numeric(10, 2),
	"notes" text,
	"collection_history" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "communication_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"communication_type" "communication_type" NOT NULL,
	"direction" varchar(10) NOT NULL,
	"from_address" text,
	"to_address" text,
	"subject" text,
	"body" text,
	"attachments" text,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "compliance_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"compliance_tracking_id" uuid NOT NULL,
	"audit_type" varchar(50) NOT NULL,
	"audit_date" date NOT NULL,
	"auditor_name" text,
	"auditing_organization" text,
	"audit_scope" text,
	"audit_methodology" text,
	"sample_size" integer,
	"findings_count" integer DEFAULT 0,
	"major_findings" integer DEFAULT 0,
	"minor_findings" integer DEFAULT 0,
	"observations" integer DEFAULT 0,
	"overall_rating" varchar(20),
	"compliance_score" numeric(5, 4),
	"findings" text,
	"recommendations" text,
	"best_practices" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"corrective_action_plan" text,
	"corrective_action_deadline" date,
	"audit_report_path" text,
	"evidence_collected" text,
	"status" varchar(20) DEFAULT 'in_progress',
	"audit_cost" numeric(10, 2),
	"remediation_cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "compliance_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requirement_name" text NOT NULL,
	"regulatory_body" varchar(100),
	"requirement_type" varchar(50),
	"compliance_category" varchar(50),
	"description" text,
	"requirements" text,
	"frequency_required" varchar(50),
	"effective_date" date NOT NULL,
	"next_due_date" date,
	"last_completed_date" date,
	"status" "compliance_status" DEFAULT 'pending_review' NOT NULL,
	"compliance_level" numeric(5, 4),
	"responsible_party" uuid,
	"backup_responsible" uuid,
	"evidence_required" text,
	"evidence_provided" text,
	"documentation_path" text,
	"risk_level" varchar(20),
	"impact_of_non_compliance" text,
	"mitigation_steps" text,
	"monitoring_frequency" varchar(50),
	"alert_threshold" integer,
	"escalation_required" boolean DEFAULT false,
	"implementation_cost" numeric(10, 2),
	"maintenance_cost" numeric(10, 2),
	"non_compliance_penalty" numeric(10, 2),
	"training_required" boolean DEFAULT false,
	"training_frequency" varchar(50),
	"last_training_date" date,
	"next_training_date" date,
	"auditing_body" varchar(100),
	"certification_number" varchar(100),
	"deficiencies_identified" text,
	"corrective_actions" text,
	"corrective_action_deadline" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "confidence_thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"task_type" varchar(100) NOT NULL,
	"low_threshold" numeric(5, 4) NOT NULL,
	"medium_threshold" numeric(5, 4) NOT NULL,
	"high_threshold" numeric(5, 4) NOT NULL,
	"auto_process_threshold" numeric(5, 4),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracted_rate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_contract_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"modifier" varchar(5),
	"description" text,
	"contracted_amount" numeric(10, 2) NOT NULL,
	"reimbursement_rate" numeric(5, 4),
	"unit_type" varchar(20) DEFAULT 'per_service',
	"max_units" integer,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"requires_prior_auth" boolean DEFAULT false,
	"special_conditions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cpt_code_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"short_description" varchar(100) NOT NULL,
	"long_description" text NOT NULL,
	"category" varchar(50),
	"section" varchar(50),
	"subsection" varchar(50),
	"rvu_work" numeric(10, 4),
	"rvu_practice_expense" numeric(10, 4),
	"rvu_malpractice" numeric(10, 4),
	"rvu_total" numeric(10, 4),
	"bilateral_surgery" boolean DEFAULT false,
	"assistant_surgeon" boolean DEFAULT false,
	"co_surgeon" boolean DEFAULT false,
	"multiple_proc" boolean DEFAULT false,
	"global_period" varchar(10),
	"prior_auth_commonly_required" boolean DEFAULT false,
	"modifier_51_exempt" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"last_used_date" date,
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cpt_code_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"short_description" varchar(100) NOT NULL,
	"long_description" text NOT NULL,
	"category" varchar(50),
	"section" varchar(50),
	"subsection" varchar(50),
	"rvu_work" numeric(10, 4),
	"rvu_practice_expense" numeric(10, 4),
	"rvu_malpractice" numeric(10, 4),
	"rvu_total" numeric(10, 4),
	"bilateral_surgery" boolean DEFAULT false,
	"assistant_surgeon" boolean DEFAULT false,
	"co_surgeon" boolean DEFAULT false,
	"multiple_proc" boolean DEFAULT false,
	"global_period" varchar(10),
	"prior_auth_commonly_required" boolean DEFAULT false,
	"modifier_51_exempt" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"update_year" integer NOT NULL,
	"import_batch" varchar(50),
	"validation_status" varchar(20) DEFAULT 'pending',
	"validation_errors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentialing_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"application_number" varchar(50) NOT NULL,
	"application_type" varchar(50) NOT NULL,
	"application_date" date NOT NULL,
	"credentialing_organization" text NOT NULL,
	"organization_contact" text,
	"organization_phone" varchar(20),
	"organization_email" text,
	"status" "credentialing_status" DEFAULT 'not_started' NOT NULL,
	"status_date" date NOT NULL,
	"status_reason" text,
	"submission_deadline" date,
	"target_completion_date" date,
	"actual_completion_date" date,
	"requested_privileges" text,
	"granted_privileges" text,
	"denied_privileges" text,
	"primary_department" varchar(100),
	"secondary_departments" text,
	"service_lines" text,
	"board_certifications" text,
	"fellowship_training" text,
	"residency_training" text,
	"medical_education" text,
	"practice_history" text,
	"hospital_affiliations" text,
	"professional_references" text,
	"peer_references" text,
	"background_check_required" boolean DEFAULT true,
	"background_check_completed" boolean DEFAULT false,
	"background_check_date" date,
	"background_check_results" text,
	"malpractice_insurance" text,
	"dea_number" varchar(20),
	"dea_expiration_date" date,
	"quality_indicators" text,
	"patient_safety_incidents" text,
	"required_documents" text,
	"submitted_documents" text,
	"outstanding_documents" text,
	"committee_review_date" date,
	"committee_decision" varchar(50),
	"committee_comments" text,
	"application_fee" numeric(10, 2),
	"background_check_fee" numeric(10, 2),
	"total_fees" numeric(10, 2),
	"fees_paid" boolean DEFAULT false,
	"appeal_available" boolean DEFAULT true,
	"appeal_deadline" date,
	"appeal_submitted" boolean DEFAULT false,
	"notes" text,
	"next_action" text,
	"responsible_party" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "custom_field_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"custom_field_id" integer,
	"ehr_system" varchar(100) NOT NULL,
	"ehr_field_path" varchar(500) NOT NULL,
	"transformation_rules" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"custom_field_id" integer,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" integer NOT NULL,
	"value" text,
	"data_source" "data_source_type" DEFAULT 'manual_entry',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"is_required" boolean DEFAULT false,
	"default_value" text,
	"validation_rules" jsonb,
	"options" jsonb,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "database_authentication_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"attempt_id" varchar(255),
	"username" varchar(255),
	"database_name" varchar(100),
	"authentication_method" varchar(50) NOT NULL,
	"authentication_result" varchar(50) NOT NULL,
	"failure_reason" varchar(255),
	"client_ip_address" varchar(45) NOT NULL,
	"client_port" integer,
	"user_agent" text,
	"connection_protocol" varchar(20),
	"ssl_used" boolean,
	"ssl_cipher" varchar(100),
	"certificate_used" boolean,
	"certificate_subject" text,
	"session_id" varchar(255),
	"application_name" varchar(255),
	"risk_score" numeric(5, 2),
	"risk_factors" jsonb,
	"is_anomalous" boolean DEFAULT false,
	"geo_location" jsonb,
	"time_zone" varchar(50),
	"attempts_in_window" integer,
	"is_blocked" boolean DEFAULT false,
	"block_reason" varchar(255),
	"event_time" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_connection_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"connection_id" varchar(255),
	"user_id" varchar(255),
	"database_name" varchar(100),
	"application_name" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"connection_state" varchar(50),
	"authentication_method" varchar(50),
	"authentication_success" boolean,
	"authentication_error" text,
	"client_ip_address" varchar(45),
	"client_port" integer,
	"server_port" integer,
	"protocol" varchar(20) DEFAULT 'tcp',
	"session_id" varchar(255),
	"session_start_time" timestamp,
	"session_end_time" timestamp,
	"session_duration" integer,
	"connection_time" integer,
	"query_count" integer DEFAULT 0,
	"transaction_count" integer DEFAULT 0,
	"bytes_transferred" bigint DEFAULT 0,
	"pool_name" varchar(100),
	"active_connections" integer,
	"waiting_clients" integer,
	"pool_utilization" numeric(5, 2),
	"error_code" varchar(50),
	"error_message" text,
	"error_stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_query_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"query_id" varchar(255),
	"session_id" varchar(255),
	"transaction_id" varchar(255),
	"query_text" text,
	"query_hash" varchar(64),
	"query_type" varchar(50),
	"query_parameters" jsonb,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer NOT NULL,
	"planning_time" integer,
	"execution_time" integer,
	"rows_returned" bigint,
	"rows_affected" bigint,
	"blocks_read" bigint,
	"blocks_written" bigint,
	"memory_used" bigint,
	"temp_files_used" integer,
	"is_slow_query" boolean DEFAULT false,
	"complexity_score" numeric(10, 2),
	"locks_acquired" integer,
	"lock_wait_time" integer,
	"deadlock_detected" boolean DEFAULT false,
	"user_id" varchar(255),
	"database_name" varchar(100),
	"application_name" varchar(255),
	"client_ip_address" varchar(45),
	"error_occurred" boolean DEFAULT false,
	"error_code" varchar(50),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "denial_playbook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"denial_codes" text,
	"denial_categories" text,
	"payer_ids" text,
	"automatic_actions" json DEFAULT '{}'::json,
	"appeal_template" text,
	"required_documents" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 100,
	"times_used" integer DEFAULT 0,
	"success_rate" numeric(5, 4),
	"average_recovery" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "denial_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"claim_line_id" uuid,
	"denial_date" date NOT NULL,
	"denial_code" varchar(10) NOT NULL,
	"denial_reason" text NOT NULL,
	"denial_category" "denial_category" NOT NULL,
	"denied_amount" numeric(10, 2) NOT NULL,
	"status" "denial_status" DEFAULT 'new' NOT NULL,
	"is_appealable" boolean DEFAULT true,
	"appeal_deadline" date,
	"recommended_action" varchar(50),
	"resolution_date" date,
	"resolution_method" varchar(50),
	"resolution_amount" numeric(10, 2),
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid,
	"claim_id" uuid,
	"prior_auth_id" uuid,
	"appeal_id" uuid,
	"encounter_id" uuid,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"document_type" "document_type" NOT NULL,
	"description" text,
	"s3_key" text NOT NULL,
	"s3_bucket" text NOT NULL,
	"is_processed" boolean DEFAULT false,
	"ocr_text" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"uploaded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "drug_interaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"drug1_ndc_number" varchar(11) NOT NULL,
	"drug1_name" text NOT NULL,
	"drug2_ndc_number" varchar(11) NOT NULL,
	"drug2_name" text NOT NULL,
	"interaction_type" varchar(50) NOT NULL,
	"severity_level" varchar(20) NOT NULL,
	"mechanism" text,
	"clinical_effects" text NOT NULL,
	"management" text,
	"evidence_level" varchar(20),
	"references" text,
	"monitoring_required" boolean DEFAULT false,
	"monitoring_parameters" text,
	"monitoring_frequency" varchar(50),
	"age_group_restrictions" text,
	"condition_restrictions" text,
	"source" varchar(50) NOT NULL,
	"source_version" varchar(20),
	"last_updated" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ehr_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ehr_system_name" text NOT NULL,
	"version" varchar(20),
	"api_type" "ehr_api_type",
	"auth_method" "ehr_auth_method",
	"base_url" text,
	"client_id" text,
	"client_secret" text,
	"api_key" text,
	"token_url" text,
	"authorize_url" text,
	"scopes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"last_test_at" timestamp,
	"test_status" varchar(20),
	"sync_patients" boolean DEFAULT false,
	"sync_appointments" boolean DEFAULT false,
	"sync_documents" boolean DEFAULT false,
	"rate_limit_per_minute" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ehr_system" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"system_name" text NOT NULL,
	"vendor" varchar(100) NOT NULL,
	"version" varchar(50),
	"api_type" "ehr_api_type" DEFAULT 'fhir' NOT NULL,
	"base_url" text NOT NULL,
	"auth_method" "ehr_auth_method" DEFAULT 'oauth2' NOT NULL,
	"client_id" varchar(255),
	"redirect_uri" text,
	"scopes" text,
	"supported_resources" text,
	"supported_operations" text,
	"sync_enabled" boolean DEFAULT false,
	"sync_frequency" varchar(20),
	"last_sync_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "eligibility_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"insurance_policy_id" uuid NOT NULL,
	"cache_key" varchar(128) NOT NULL,
	"eligibility_data" json NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "eligibility_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "eligibility_check" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"insurance_policy_id" uuid NOT NULL,
	"check_type" "eligibility_check_type" NOT NULL,
	"service_date" date NOT NULL,
	"eligibility_status" "eligibility_response",
	"effective_date" date,
	"termination_date" date,
	"deductible" numeric(10, 2),
	"deductible_met" numeric(10, 2),
	"out_of_pocket_max" numeric(10, 2),
	"out_of_pocket_met" numeric(10, 2),
	"copay" numeric(10, 2),
	"coinsurance" numeric(5, 4),
	"raw_response" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"checked_by" uuid
);
--> statement-breakpoint
CREATE TABLE "em_time_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"service_category" varchar(50) NOT NULL,
	"min_time" integer NOT NULL,
	"max_time" integer,
	"typical_time" integer,
	"requires_counseling_coordination" boolean DEFAULT false,
	"counseling_threshold_percent" integer,
	"time_documentation_required" boolean DEFAULT true,
	"start_end_time_required" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"suffix" varchar(20),
	"relationship_to_patient" varchar(50) NOT NULL,
	"is_legal_guardian" boolean DEFAULT false,
	"is_primary_contact" boolean DEFAULT false,
	"priority" integer DEFAULT 1,
	"phone_number" varchar(20),
	"phone_type" varchar(20),
	"alternate_phone" varchar(20),
	"email" varchar(255),
	"preferred_contact_method" varchar(20),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'US',
	"can_receive_medical_info" boolean DEFAULT false,
	"can_make_decisions" boolean DEFAULT false,
	"can_pick_up_patient" boolean DEFAULT false,
	"can_visit_during_restricted" boolean DEFAULT false,
	"should_contact_in_emergency" boolean DEFAULT true,
	"availability_notes" text,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"last_verified_date" date,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "encounter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"appointment_id" uuid,
	"encounter_number" varchar(50),
	"encounter_type" "visit_type" NOT NULL,
	"encounter_date" timestamp NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration" integer,
	"status" "encounter_status" DEFAULT 'scheduled' NOT NULL,
	"location_name" text,
	"room_number" varchar(20),
	"chief_complaint" text,
	"present_illness" text,
	"clinical_notes" text,
	"assessment" text,
	"plan" text,
	"primary_diagnosis" varchar(10),
	"secondary_diagnoses" text,
	"procedure_codes" text,
	"is_chargeable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "era_line_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_detail_id" uuid NOT NULL,
	"claim_line_id" uuid,
	"line_number" integer NOT NULL,
	"service_date" date NOT NULL,
	"procedure_code" varchar(10) NOT NULL,
	"charged_amount" numeric(10, 2) NOT NULL,
	"allowed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2) NOT NULL,
	"adjustment_amount" numeric(10, 2) DEFAULT '0',
	"adjustment_codes" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_schedule_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_schedule_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"modifier" varchar(5),
	"description" text,
	"standard_fee" numeric(10, 2) NOT NULL,
	"facility_fee" numeric(10, 2),
	"work_rvu" numeric(8, 4),
	"practice_expense_rvu" numeric(8, 4),
	"malpractice_rvu" numeric(8, 4),
	"total_rvu" numeric(8, 4),
	"billable_units" integer DEFAULT 1,
	"global_period" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule_type" varchar(50) NOT NULL,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false,
	"version" varchar(20) DEFAULT '1.0',
	"base_schedule_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "fhir_resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(100) NOT NULL,
	"version" varchar(10) DEFAULT 'R4',
	"source_system" varchar(100) NOT NULL,
	"source_id" varchar(100),
	"resource_data" jsonb NOT NULL,
	"last_modified" timestamp NOT NULL,
	"sync_status" varchar(20) DEFAULT 'pending',
	"sync_error" text,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_confidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"confidence_score" numeric(5, 4) NOT NULL,
	"quality_status" "data_quality_status" NOT NULL,
	"source_reliability" numeric(5, 4),
	"validation_results" json,
	"consistency_score" numeric(5, 4),
	"completeness_score" numeric(5, 4),
	"last_validated" timestamp DEFAULT now() NOT NULL,
	"validation_method" varchar(50),
	"previous_score" numeric(5, 4),
	"score_change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_mapping_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"description" text,
	"source_system" varchar(100) NOT NULL,
	"target_system" varchar(100) NOT NULL,
	"source_entity" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"field_mappings" jsonb NOT NULL,
	"transformation_rules" jsonb,
	"validation_rules" jsonb,
	"version" varchar(20) DEFAULT '1.0',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "formulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid,
	"formulary_name" text NOT NULL,
	"description" text,
	"formulary_type" varchar(50),
	"medication_name" text NOT NULL,
	"generic_name" text,
	"ndc_number" varchar(11),
	"rxcui_code" varchar(20),
	"tier" varchar(20),
	"copay_amount" numeric(10, 2),
	"coinsurance_rate" numeric(5, 4),
	"requires_prior_auth" boolean DEFAULT false,
	"quantity_limits" integer,
	"step_therapy_required" boolean DEFAULT false,
	"age_restrictions" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"preferred_alternatives" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hot_codes_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"code_type" varchar(10) NOT NULL,
	"code_id" uuid,
	"code_value" varchar(10) NOT NULL,
	"usage_count" integer DEFAULT 0,
	"last_calculated" timestamp DEFAULT now() NOT NULL,
	"should_cache" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "icd10_code_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"icd10_code" varchar(10) NOT NULL,
	"short_description" varchar(100) NOT NULL,
	"long_description" text NOT NULL,
	"chapter" varchar(100),
	"chapter_range" varchar(20),
	"section" varchar(100),
	"category" varchar(50),
	"code_type" varchar(20),
	"laterality" varchar(20),
	"encounter" varchar(20),
	"age_group" varchar(50),
	"gender" varchar(20),
	"reporting_required" boolean DEFAULT false,
	"public_health_reporting" boolean DEFAULT false,
	"manifestation_code" boolean DEFAULT false,
	"is_billable" boolean DEFAULT true NOT NULL,
	"is_header" boolean DEFAULT false NOT NULL,
	"requires_additional_digit" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0,
	"last_used_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icd10_code_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"icd10_code" varchar(10) NOT NULL,
	"short_description" varchar(100) NOT NULL,
	"long_description" text NOT NULL,
	"chapter" varchar(100),
	"chapter_range" varchar(20),
	"section" varchar(100),
	"category" varchar(50),
	"code_type" varchar(20),
	"laterality" varchar(20),
	"encounter" varchar(20),
	"age_group" varchar(50),
	"gender" varchar(20),
	"reporting_required" boolean DEFAULT false,
	"public_health_reporting" boolean DEFAULT false,
	"manifestation_code" boolean DEFAULT false,
	"is_billable" boolean DEFAULT true,
	"is_header" boolean DEFAULT false,
	"requires_additional_digit" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"update_year" integer NOT NULL,
	"import_batch" varchar(50),
	"validation_status" varchar(20) DEFAULT 'pending',
	"validation_errors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imaging_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"encounter_id" uuid,
	"order_number" varchar(50),
	"accession_number" varchar(50),
	"study_description" text NOT NULL,
	"modality_type" varchar(20) NOT NULL,
	"body_part" varchar(50),
	"study_protocol" text,
	"cpt_code" varchar(10),
	"icd_code" varchar(10),
	"order_date" timestamp NOT NULL,
	"priority" varchar(20) DEFAULT 'routine',
	"scheduled_date" timestamp,
	"scheduled_location" text,
	"clinical_indication" text NOT NULL,
	"clinical_history" text,
	"contraindications" text,
	"special_instructions" text,
	"contrast_used" boolean DEFAULT false,
	"contrast_type" varchar(50),
	"contrast_volume" integer,
	"allergic_to_contrast" boolean DEFAULT false,
	"prior_study_date" date,
	"prior_study_location" text,
	"comparison_study_ids" text,
	"status" varchar(20) DEFAULT 'ordered' NOT NULL,
	"study_date" timestamp,
	"read_date" timestamp,
	"reported_date" timestamp,
	"reading_radiologist" uuid,
	"technologist" varchar(100),
	"equipment" varchar(100),
	"radiation_dose" numeric(10, 4),
	"image_quality" varchar(20),
	"external_facility_name" text,
	"is_external_study" boolean DEFAULT false,
	"is_billable" boolean DEFAULT true,
	"estimated_cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "insurance_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"policy_number" text NOT NULL,
	"group_number" text,
	"plan_name" text,
	"coverage_type" varchar(20),
	"effective_date" date,
	"termination_date" date,
	"subscriber_relationship" varchar(20),
	"subscriber_first_name" text,
	"subscriber_last_name" text,
	"subscriber_dob" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "integration_event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"request_data" json,
	"response_data" json,
	"error_message" text,
	"status" varchar(20) NOT NULL,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kpi_name" varchar(100) NOT NULL,
	"description" text,
	"formula" text NOT NULL,
	"unit" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"refresh_interval" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kpi_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kpi_definition_id" uuid NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"period" varchar(20) NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"calculation_duration" integer,
	"data_points" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"encounter_id" uuid,
	"order_number" varchar(50),
	"accession_number" varchar(50),
	"test_name" text NOT NULL,
	"loinc_code" varchar(20),
	"cpt_code" varchar(10),
	"test_category" varchar(50),
	"order_date" timestamp NOT NULL,
	"priority" varchar(20) DEFAULT 'routine',
	"specimen_type" varchar(50),
	"collection_date" timestamp,
	"collected_by" uuid,
	"collection_method" varchar(50),
	"collection_site" varchar(50),
	"status" "lab_status" DEFAULT 'ordered' NOT NULL,
	"result_date" timestamp,
	"reviewed_date" timestamp,
	"reviewed_by" uuid,
	"clinical_indication" text,
	"diagnosis_codes" text,
	"external_lab_name" text,
	"external_lab_id" varchar(50),
	"is_external_lab" boolean DEFAULT false,
	"is_billable" boolean DEFAULT true,
	"estimated_cost" numeric(10, 2),
	"turnaround_time" integer,
	"is_abnormal" boolean DEFAULT false,
	"is_critical" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "lab_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_order_id" uuid NOT NULL,
	"result_code" varchar(50),
	"test_name" text NOT NULL,
	"component_name" text,
	"loinc_code" varchar(20),
	"numeric_value" numeric(15, 6),
	"text_value" text,
	"unit" varchar(20),
	"reference_range_low" numeric(15, 6),
	"reference_range_high" numeric(15, 6),
	"reference_range_text" text,
	"interpretation" varchar(50),
	"is_abnormal" boolean DEFAULT false,
	"is_critical" boolean DEFAULT false,
	"is_panic" boolean DEFAULT false,
	"result_flags" text,
	"comments" text,
	"technical_notes" text,
	"instrument_id" varchar(50),
	"method_id" varchar(50),
	"rerun_count" integer DEFAULT 0,
	"resulted_at" timestamp,
	"verified_at" timestamp,
	"verified_by" uuid,
	"status" varchar(20) DEFAULT 'preliminary',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "medical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"condition_name" text NOT NULL,
	"icd10_code" varchar(10),
	"snomed_code" varchar(20),
	"onset_date" date,
	"diagnosis_date" date,
	"resolved_date" date,
	"is_active" boolean DEFAULT true,
	"severity" varchar(20),
	"symptoms" text,
	"treatment" text,
	"notes" text,
	"diagnosed_by" uuid,
	"source" varchar(50),
	"is_family_history" boolean DEFAULT false,
	"relation_to_patient" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "medication_adherence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"tracking_period_start" date NOT NULL,
	"tracking_period_end" date NOT NULL,
	"doses_scheduled" integer NOT NULL,
	"doses_taken" integer NOT NULL,
	"doses_skipped" integer DEFAULT 0,
	"adherence_rate" numeric(5, 4) NOT NULL,
	"tracking_method" varchar(50),
	"barriers" text,
	"side_effects_reported" text,
	"cost_concerns" boolean DEFAULT false,
	"interventions_provided" text,
	"assessment_date" date NOT NULL,
	"assessed_by" uuid,
	"clinical_notes" text,
	"next_assessment_date" date,
	"follow_up_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "medication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"encounter_id" uuid,
	"medication_name" text NOT NULL,
	"generic_name" text,
	"brand_name" text,
	"ndc_number" varchar(11),
	"rxcui_code" varchar(20),
	"prescription_number" varchar(50),
	"dosage" varchar(100) NOT NULL,
	"strength" varchar(50),
	"dosage_form" varchar(50),
	"route" varchar(50),
	"directions" text NOT NULL,
	"frequency" varchar(50),
	"quantity" integer,
	"days_supply" integer,
	"prescribed_date" date NOT NULL,
	"start_date" date,
	"end_date" date,
	"last_filled_date" date,
	"refills_allowed" integer DEFAULT 0,
	"refills_remaining" integer DEFAULT 0,
	"status" "medication_status" DEFAULT 'active' NOT NULL,
	"discontinued_date" date,
	"discontinued_reason" text,
	"indication" text,
	"allergies" text,
	"side_effects" text,
	"pharmacy_name" text,
	"pharmacy_phone" varchar(20),
	"pharmacy_npi" varchar(10),
	"adherence_rate" numeric(5, 4),
	"last_review_date" date,
	"next_review_date" date,
	"cost" numeric(10, 2),
	"copay" numeric(10, 2),
	"insurance_covered" boolean DEFAULT true,
	"is_high_risk" boolean DEFAULT false,
	"requires_monitoring" boolean DEFAULT false,
	"monitoring_parameters" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "ml_model_metric" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(20) NOT NULL,
	"accuracy" numeric(5, 4),
	"precision" numeric(5, 4),
	"recall" numeric(5, 4),
	"f1_score" numeric(5, 4),
	"training_data_size" integer,
	"validation_data_size" integer,
	"training_started" timestamp,
	"training_completed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_prediction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(20) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"prediction" text NOT NULL,
	"confidence" numeric(5, 4),
	"features" json,
	"actual_outcome" text,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"modifier_code" varchar(5) NOT NULL,
	"description" text NOT NULL,
	"short_description" varchar(100),
	"category" varchar(50),
	"type" varchar(30),
	"level_i_indicator" varchar(10),
	"level_ii_indicator" varchar(10),
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "notification_type" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"html_body" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_member_id" uuid NOT NULL,
	"template_id" uuid,
	"type" "notification_type" NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"recipient" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"read_at" timestamp,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"invited_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"npi" varchar(10),
	"tax_id" varchar(20),
	"email" text,
	"phone" varchar(20),
	"website" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state" varchar(2),
	"zip_code" varchar(10),
	"settings" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organization_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pa_clinical_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cpt_codes" jsonb,
	"icd_codes" jsonb,
	"drug_codes" jsonb,
	"criteria" jsonb NOT NULL,
	"payer_id" uuid,
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pa_requirement_rule" (
	"id" serial PRIMARY KEY NOT NULL,
	"payer_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"required_documents" jsonb,
	"auto_approval_criteria" jsonb,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pathology_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pathology_specimen_id" uuid NOT NULL,
	"report_number" varchar(50),
	"macroscopic_description" text,
	"microscopic_description" text NOT NULL,
	"diagnosis" text NOT NULL,
	"comment" text,
	"tumor_size" varchar(20),
	"tumor_grade" varchar(20),
	"tumor_stage" varchar(20),
	"margins_status" varchar(50),
	"lymph_node_status" varchar(50),
	"receptor_status" text,
	"molecular_markers" text,
	"turnaround_time" integer,
	"status" varchar(20) DEFAULT 'draft',
	"drafted_date" timestamp,
	"finalized_date" timestamp,
	"primary_pathologist" uuid NOT NULL,
	"reviewing_pathologist" uuid,
	"consultation_requested" boolean DEFAULT false,
	"consulting_pathologist" uuid,
	"consultation_comments" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_instructions" text,
	"has_critical_values" boolean DEFAULT false,
	"critical_values_text" text,
	"critical_values_notified" boolean DEFAULT false,
	"has_addendum" boolean DEFAULT false,
	"addendum_text" text,
	"correction_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pathology_specimen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"specimen_number" varchar(50) NOT NULL,
	"accession_number" varchar(50),
	"collection_date" timestamp NOT NULL,
	"collection_procedure" varchar(100),
	"specimen_type" varchar(50),
	"specimen_site" text NOT NULL,
	"clinical_history" text,
	"clinical_diagnosis" text,
	"gross_description" text,
	"fixation_type" varchar(50),
	"processing_date" timestamp,
	"processed_by" uuid,
	"stains_used" text,
	"special_techniques" text,
	"status" varchar(20) DEFAULT 'received',
	"adequacy_assessment" varchar(50),
	"quality_issues" text,
	"external_lab_name" text,
	"is_external_lab" boolean DEFAULT false,
	"is_billable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"contact_type" varchar(50) NOT NULL,
	"relationship_to_patient" varchar(100) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"suffix" varchar(20),
	"phone_number" varchar(20),
	"phone_type" varchar(20),
	"alternate_phone" varchar(20),
	"email" varchar(255),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'US',
	"can_receive_general_info" boolean DEFAULT false,
	"can_schedule_appointments" boolean DEFAULT false,
	"can_access_portal" boolean DEFAULT false,
	"is_primary_caregiver" boolean DEFAULT false,
	"organization" varchar(200),
	"title" varchar(100),
	"specialty" varchar(100),
	"license_number" varchar(50),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient_diagnosis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"provider_id" uuid NOT NULL,
	"diagnosis_code" varchar(10) NOT NULL,
	"diagnosis_description" text NOT NULL,
	"code_system" varchar(20) DEFAULT 'ICD10',
	"diagnosis_type" varchar(20) NOT NULL,
	"is_primary" boolean DEFAULT false,
	"diagnosis_date" date NOT NULL,
	"onset_date" date,
	"severity" varchar(20),
	"status" varchar(20) DEFAULT 'active',
	"present_on_admission" boolean,
	"clinical_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient_extension" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"ethnicity" varchar(100),
	"race" varchar(100),
	"race_secondary" varchar(100),
	"preferred_language" varchar(50),
	"interpreter_needed" boolean DEFAULT false,
	"interpreter_language" varchar(50),
	"religion" varchar(100),
	"cultural_considerations" text,
	"dietary_restrictions" text,
	"communication_preferences" text,
	"privacy_preferences" text,
	"consent_to_text" boolean DEFAULT false,
	"consent_to_email" boolean DEFAULT false,
	"consent_to_voicemail" boolean DEFAULT false,
	"mobility_assistance" text,
	"visual_assistance" text,
	"hearing_assistance" text,
	"cognitive_assistance" text,
	"employment_status" varchar(50),
	"education" varchar(50),
	"household_size" integer,
	"household_income" varchar(50),
	"transportation_challenges" boolean DEFAULT false,
	"housing_stability" varchar(50),
	"food_insecurity" boolean DEFAULT false,
	"emergency_medical_info" text,
	"safety_alerts" text,
	"advance_directives" boolean DEFAULT false,
	"advance_directives_location" text,
	"organ_donor" boolean DEFAULT false,
	"preferred_provider" uuid,
	"preferred_pharmacy" text,
	"preferred_hospital" text,
	"preferred_appointment_time" varchar(50),
	"consent_to_research" boolean DEFAULT false,
	"consent_to_marketing" boolean DEFAULT false,
	"share_data_with_partners" boolean DEFAULT false,
	"notes" text,
	"custom_fields" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"payment_plan_id" uuid,
	"payment_amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_date" date NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"confirmation_number" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "patient_quality_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"quality_measure_id" uuid NOT NULL,
	"measurement_date" date NOT NULL,
	"reporting_period" varchar(20) NOT NULL,
	"is_eligible" boolean NOT NULL,
	"eligibility_reason" text,
	"meets_numerator" boolean DEFAULT false,
	"meets_denominator" boolean DEFAULT false,
	"is_excluded" boolean DEFAULT false,
	"exclusion_reason" text,
	"clinical_data_elements" jsonb,
	"evidence_sources" jsonb,
	"risk_factors" jsonb,
	"risk_score" numeric(8, 4),
	"performance_score" numeric(5, 4),
	"improvement_opportunities" text,
	"recommended_actions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"calculated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient_statement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"statement_number" varchar(50) NOT NULL,
	"statement_date" date NOT NULL,
	"due_date" date NOT NULL,
	"previous_balance" numeric(10, 2) DEFAULT '0',
	"new_charges" numeric(10, 2) DEFAULT '0',
	"payments" numeric(10, 2) DEFAULT '0',
	"adjustments" numeric(10, 2) DEFAULT '0',
	"current_balance" numeric(10, 2) NOT NULL,
	"current" numeric(10, 2) DEFAULT '0',
	"days_30" numeric(10, 2) DEFAULT '0',
	"days_60" numeric(10, 2) DEFAULT '0',
	"days_90" numeric(10, 2) DEFAULT '0',
	"days_120_plus" numeric(10, 2) DEFAULT '0',
	"status" "statement_status" DEFAULT 'draft' NOT NULL,
	"delivery_method" varchar(20),
	"sent_date" timestamp,
	"minimum_payment" numeric(10, 2),
	"payment_options" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"mrn" varchar(50),
	"ssn_last_4" varchar(4),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"date_of_birth" date,
	"gender" varchar(1),
	"email" text,
	"phone_home" varchar(20),
	"phone_mobile" varchar(20),
	"phone_work" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payer_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"submission_method" varchar(30) NOT NULL,
	"clearinghouse_id" uuid,
	"requires_prior_auth" boolean DEFAULT false,
	"prior_auth_types" text,
	"max_claims_per_batch" integer DEFAULT 100,
	"submission_frequency" varchar(20),
	"submission_times" text,
	"follow_up_days" integer DEFAULT 30,
	"appeal_time_limit" integer DEFAULT 90,
	"second_level_appeal_time_limit" integer DEFAULT 180,
	"appeal_submission_method" varchar(30),
	"payment_method" varchar(30),
	"payment_frequency" varchar(20),
	"expected_payment_days" integer DEFAULT 30,
	"contact_name" varchar(100),
	"contact_phone" varchar(20),
	"contact_email" varchar(100),
	"submission_address" text,
	"appeal_address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payer_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"contract_number" varchar(50),
	"contract_name" text NOT NULL,
	"contract_type" varchar(50),
	"default_reimbursement_rate" numeric(5, 4),
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"termination_date" date,
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"terms" text,
	"billing_requirements" json,
	"authorization_required" boolean DEFAULT false,
	"average_payment_days" integer,
	"denial_rate" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payer_override_action" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer,
	"action_type" varchar(100) NOT NULL,
	"target_field" varchar(255),
	"new_value" text,
	"parameters" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payer_override_condition" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer,
	"field" varchar(255) NOT NULL,
	"operator" varchar(50) NOT NULL,
	"value" text,
	"logical_operator" varchar(10) DEFAULT 'AND',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payer_override_rule" (
	"id" serial PRIMARY KEY NOT NULL,
	"payer_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payer_portal_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"portal_name" varchar(100) NOT NULL,
	"portal_url" text NOT NULL,
	"portal_type" varchar(50),
	"username" varchar(100) NOT NULL,
	"encrypted_password" text NOT NULL,
	"security_questions" jsonb,
	"two_factor_secret" varchar(100),
	"session_timeout" integer DEFAULT 30,
	"last_login_at" timestamp,
	"session_token" text,
	"is_active" boolean DEFAULT true,
	"credential_status" varchar(20) DEFAULT 'active',
	"last_validated" timestamp,
	"auto_login_enabled" boolean DEFAULT false,
	"last_auto_login" timestamp,
	"login_frequency" varchar(20),
	"password_last_changed" timestamp,
	"password_expiry_date" date,
	"failed_login_attempts" integer DEFAULT 0,
	"last_failed_login" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payer_response_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"claim_id" uuid,
	"message_type" varchar(50) NOT NULL,
	"message_id" varchar(100),
	"response_code" varchar(20),
	"raw_message" text NOT NULL,
	"parsed_data" jsonb,
	"processing_status" varchar(20) DEFAULT 'pending',
	"processed_at" timestamp,
	"processing_error" text,
	"remittance_advice_id" uuid,
	"batch_id" uuid,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"message_size" integer,
	"message_format" varchar(20),
	"actions_taken" jsonb,
	"requires_manual_review" boolean DEFAULT false,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payer_submission_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"submission_method" varchar(30) NOT NULL,
	"clearinghouse_id" uuid,
	"submitter_tax_id" varchar(20),
	"submitter_npi" varchar(10),
	"receiver_id" varchar(50),
	"max_claims_per_batch" integer DEFAULT 100,
	"batch_submission_times" jsonb,
	"file_format" varchar(20),
	"file_version" varchar(10),
	"character_set" varchar(20) DEFAULT 'UTF-8',
	"portal_credential_id" uuid,
	"portal_submission_path" text,
	"pre_submission_validation" boolean DEFAULT true,
	"validation_rules" jsonb,
	"acknowledgment_required" boolean DEFAULT true,
	"acknowledgment_timeout" integer DEFAULT 72,
	"auto_process_acknowledgment" boolean DEFAULT true,
	"retry_on_failure" boolean DEFAULT true,
	"max_retry_attempts" integer DEFAULT 3,
	"retry_delay" integer DEFAULT 60,
	"track_submission_status" boolean DEFAULT true,
	"status_check_frequency" integer DEFAULT 24,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_id" varchar(50),
	"name" text NOT NULL,
	"address" text,
	"phone" varchar(20),
	"website" text,
	"supports_prior_auth" boolean DEFAULT false,
	"supports_electronic_claims" boolean DEFAULT false,
	"supports_real_time_eligibility" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "payer_payer_id_unique" UNIQUE("payer_id")
);
--> statement-breakpoint
CREATE TABLE "payment_adjustment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"payment_detail_id" uuid,
	"adjustment_type" "adjustment_type" NOT NULL,
	"adjustment_amount" numeric(10, 2) NOT NULL,
	"adjustment_code" varchar(10),
	"adjustment_description" text,
	"reason" text,
	"posted_by" uuid,
	"posted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"remittance_advice_id" uuid,
	"paid_amount" numeric(10, 2) NOT NULL,
	"allowed_amount" numeric(10, 2),
	"deductible_amount" numeric(10, 2) DEFAULT '0',
	"coinsurance_amount" numeric(10, 2) DEFAULT '0',
	"copay_amount" numeric(10, 2) DEFAULT '0',
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"check_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"monthly_payment" numeric(10, 2) NOT NULL,
	"remaining_balance" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"next_payment_date" date,
	"payment_method_token" text,
	"auto_pay_enabled" boolean DEFAULT false,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_posting_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"batch_number" varchar(50),
	"payment_id" uuid,
	"claim_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"posted_by" uuid NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'posted',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_reconciliation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"expected_amount" numeric(10, 2) NOT NULL,
	"actual_amount" numeric(10, 2) NOT NULL,
	"variance" numeric(10, 2) NOT NULL,
	"reconciliation_status" "reconciliation_status" DEFAULT 'pending' NOT NULL,
	"reconciliation_date" timestamp,
	"notes" text,
	"reconciled_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_variance" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" uuid,
	"claim_id" uuid,
	"variance_type" "variance_type" NOT NULL,
	"expected_amount" numeric(10, 2) NOT NULL,
	"actual_amount" numeric(10, 2) NOT NULL,
	"variance_amount" numeric(10, 2) NOT NULL,
	"reason" text,
	"status" varchar(50) DEFAULT 'pending',
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "place_of_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pos_code" varchar(5) NOT NULL,
	"description" text NOT NULL,
	"short_description" varchar(100),
	"category" varchar(50),
	"subcategory" varchar(50),
	"is_active" boolean DEFAULT true,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_automation_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"portal_credential_id" uuid NOT NULL,
	"task_type" varchar(50) NOT NULL,
	"task_name" varchar(100) NOT NULL,
	"description" text,
	"is_scheduled" boolean DEFAULT false,
	"schedule_expression" varchar(100),
	"next_run_time" timestamp,
	"last_run_time" timestamp,
	"task_parameters" jsonb,
	"automation_steps" jsonb,
	"status" varchar(20) DEFAULT 'active',
	"execution_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"last_execution_status" varchar(20),
	"last_execution_duration" integer,
	"last_execution_error" text,
	"last_execution_log" text,
	"average_execution_time" integer,
	"success_rate" numeric(5, 4),
	"retry_on_failure" boolean DEFAULT true,
	"max_retries" integer DEFAULT 3,
	"retry_delay" integer DEFAULT 300,
	"enable_alerts" boolean DEFAULT true,
	"alert_threshold" integer DEFAULT 3,
	"last_alert_sent" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "prior_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"auth_number" varchar(50),
	"reference_number" varchar(50),
	"requested_service" text NOT NULL,
	"cpt_codes" text,
	"diagnosis_codes" text,
	"request_date" date NOT NULL,
	"effective_date" date,
	"expiration_date" date,
	"status" "prior_auth_status" DEFAULT 'pending' NOT NULL,
	"clinical_notes" text,
	"medical_necessity" text,
	"submission_method" varchar(20),
	"approved_units" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "provider_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"credential_type" varchar(50) NOT NULL,
	"credential_name" text NOT NULL,
	"credential_number" varchar(100),
	"issuing_organization" text NOT NULL,
	"issuing_state" varchar(2),
	"issuing_country" varchar(3) DEFAULT 'USA',
	"issue_date" date,
	"effective_date" date,
	"expiration_date" date,
	"renewal_date" date,
	"status" "license_status" DEFAULT 'active' NOT NULL,
	"status_date" date NOT NULL,
	"status_reason" text,
	"specialty" text,
	"subspecialty" text,
	"practice_scope" text,
	"restrictions" text,
	"conditions" text,
	"verification_required" boolean DEFAULT true,
	"verification_status" varchar(20),
	"verification_date" date,
	"verified_by" uuid,
	"verification_source" text,
	"verification_method" varchar(50),
	"primary_source_verified" boolean DEFAULT false,
	"primary_source_date" date,
	"primary_source_contact" text,
	"cme_required" boolean DEFAULT false,
	"cme_hours_required" integer,
	"cme_hours_completed" integer,
	"next_cme_deadline" date,
	"has_disciplinary_actions" boolean DEFAULT false,
	"disciplinary_actions" text,
	"document_path" text,
	"document_expiration_date" date,
	"reminder_sent" boolean DEFAULT false,
	"reminder_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "provider_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"payer_id" uuid,
	"enrollment_type" "provider_enrollment_type" NOT NULL,
	"network_name" text,
	"plan_name" text,
	"contract_number" varchar(50),
	"enrollment_npi" varchar(10) NOT NULL,
	"medicare_id" varchar(20),
	"medicaid_id" varchar(20),
	"application_date" date NOT NULL,
	"submission_date" date,
	"application_number" varchar(50),
	"status" "provider_enrollment_status" DEFAULT 'pending' NOT NULL,
	"status_date" date NOT NULL,
	"status_reason" text,
	"effective_date" date,
	"expiration_date" date,
	"revalidation_due_date" date,
	"termination_date" date,
	"practice_locations" text,
	"specialties" text,
	"taxonomy_codes" text,
	"fee_schedule" varchar(50),
	"reimbursement_rate" numeric(5, 4),
	"required_documents" text,
	"submitted_documents" text,
	"missing_documents" text,
	"processing_timeline" text,
	"contact_person" text,
	"contact_phone" varchar(20),
	"contact_email" text,
	"quality_programs" text,
	"compliance_requirements" text,
	"application_fee" numeric(10, 2),
	"enrollment_fee" numeric(10, 2),
	"maintenance_fee" numeric(10, 2),
	"appeal_rights" boolean DEFAULT true,
	"appeal_deadline" date,
	"appeal_submitted" boolean DEFAULT false,
	"appeal_status" varchar(20),
	"notes" text,
	"internal_comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "provider_privilege" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"credentialing_application_id" uuid,
	"privilege_name" text NOT NULL,
	"privilege_code" varchar(50),
	"privilege_category" varchar(50),
	"department" varchar(100) NOT NULL,
	"service_line" varchar(100),
	"location" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"granted_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"expiration_date" date,
	"last_review_date" date,
	"next_review_date" date,
	"conditions" text,
	"restrictions" text,
	"supervision_required" boolean DEFAULT false,
	"supervising_physician" uuid,
	"minimum_case_volume" integer,
	"actual_case_volume" integer,
	"case_volume_tracking_period" varchar(20),
	"outcome_metrics" text,
	"complication_rates" text,
	"satisfaction_scores" text,
	"training_required" text,
	"training_completed" text,
	"certification_required" text,
	"certification_status" text,
	"renewal_required" boolean DEFAULT true,
	"renewal_frequency" varchar(20),
	"auto_renewal" boolean DEFAULT false,
	"renewal_criteria" text,
	"proctoring_required" boolean DEFAULT false,
	"proctoring_physician" uuid,
	"proctoring_cases" integer,
	"proctoring_completed" boolean DEFAULT false,
	"proctoring_completion_date" date,
	"privilege_fee" numeric(10, 2),
	"renewal_fee" numeric(10, 2),
	"granting_committee" text,
	"granting_rationale" text,
	"revocation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"npi" varchar(10),
	"tax_id" varchar(20),
	"medicare_id" varchar(20),
	"medicaid_id" varchar(20),
	"first_name" text,
	"last_name" text,
	"suffix" varchar(10),
	"specialty" text,
	"license_number" varchar(50),
	"license_state" varchar(2),
	"email" text,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "provider_npi_unique" UNIQUE("npi")
);
--> statement-breakpoint
CREATE TABLE "quality_measure_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"quality_measure_id" uuid NOT NULL,
	"provider_id" uuid,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"numerator" integer NOT NULL,
	"denominator" integer NOT NULL,
	"exclusions" integer DEFAULT 0,
	"performance_rate" numeric(5, 4) NOT NULL,
	"target_met" boolean DEFAULT false,
	"variance_from_target" numeric(6, 4),
	"percentile_rank" numeric(5, 4),
	"risk_adjusted_rate" numeric(5, 4),
	"risk_score" numeric(8, 4),
	"data_completeness" numeric(5, 4),
	"data_accuracy" numeric(5, 4),
	"submission_status" varchar(20) DEFAULT 'pending',
	"submission_date" timestamp,
	"submission_id" varchar(100),
	"performance_notes" text,
	"improvement_actions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"calculated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "quality_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"measure_id" varchar(50) NOT NULL,
	"measure_name" text NOT NULL,
	"measure_type" varchar(50) NOT NULL,
	"quality_program" varchar(50),
	"reporting_year" integer NOT NULL,
	"description" text,
	"numerator_description" text,
	"denominator_description" text,
	"exclusion_criteria" text,
	"target_rate" numeric(5, 4),
	"benchmark_rate" numeric(5, 4),
	"national_average" numeric(5, 4),
	"is_risk_adjusted" boolean DEFAULT false,
	"risk_adjustment_method" text,
	"reporting_frequency" varchar(20),
	"submission_deadline" date,
	"implementation_guide" text,
	"data_source" varchar(50),
	"automated_collection" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_retired" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "radiology_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imaging_order_id" uuid NOT NULL,
	"report_number" varchar(50),
	"indication" text,
	"technique" text,
	"comparison" text,
	"findings" text NOT NULL,
	"impression" text NOT NULL,
	"recommendations" text,
	"bi_rads_score" varchar(10),
	"lung_rads_score" varchar(10),
	"li_rads_score" varchar(10),
	"has_critical_findings" boolean DEFAULT false,
	"critical_findings_text" text,
	"critical_findings_notified" boolean DEFAULT false,
	"notification_date" timestamp,
	"notified_by" uuid,
	"status" varchar(20) DEFAULT 'draft',
	"drafted_date" timestamp,
	"preliminary_date" timestamp,
	"finalized_date" timestamp,
	"reading_radiologist" uuid NOT NULL,
	"attending_radiologist" uuid,
	"resident_resident" uuid,
	"is_teaching_case" boolean DEFAULT false,
	"teaching_points" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_timeframe" varchar(50),
	"follow_up_instructions" text,
	"structured_data" json,
	"limiting_factors" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"referring_provider_id" uuid NOT NULL,
	"referred_to_provider_npi" varchar(10),
	"referred_to_provider_name" text,
	"referred_to_specialty" text,
	"referral_type" varchar(50),
	"reason_for_referral" text NOT NULL,
	"urgency" varchar(20) DEFAULT 'routine',
	"authorization_required" boolean DEFAULT false,
	"authorization_number" varchar(50),
	"referral_date" date NOT NULL,
	"expiration_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"diagnosis_codes" text,
	"clinical_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "remittance_advice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"era_number" varchar(50) NOT NULL,
	"trace_number" varchar(50),
	"payment_amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method",
	"status" "era_status" DEFAULT 'pending' NOT NULL,
	"era_file_path" text,
	"raw_era_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "resource_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"resource_name" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_identifier" varchar(50),
	"department_id" uuid,
	"location_id" uuid,
	"building_floor" varchar(20),
	"schedule_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"assigned_to_id" uuid,
	"assigned_patient_id" uuid,
	"assigned_appointment_id" uuid,
	"usage_purpose" varchar(100),
	"procedure_type" varchar(100),
	"required_setup" text,
	"capacity" integer,
	"features" text,
	"restrictions" text,
	"status" "resource_status" DEFAULT 'available' NOT NULL,
	"is_maintenance_scheduled" boolean DEFAULT false,
	"maintenance_notes" text,
	"cleaning_required" boolean DEFAULT false,
	"cleaning_completed_at" timestamp,
	"setup_time" integer,
	"teardown_time" integer,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"utilization_rate" numeric(5, 2),
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" text,
	"recurring_end_date" date,
	"hourly_rate" numeric(8, 2),
	"total_cost" numeric(10, 2),
	"billable_to_patient" boolean DEFAULT false,
	"notes" text,
	"special_requirements" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "revenue_cycle_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reporting_period" date NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"days_in_ar" numeric(6, 2),
	"days_in_ar_30" numeric(6, 2),
	"days_in_ar_60" numeric(6, 2),
	"days_in_ar_90" numeric(6, 2),
	"days_in_ar_120_plus" numeric(6, 2),
	"collection_rate" numeric(5, 4),
	"net_collection_rate" numeric(5, 4),
	"gross_collection_rate" numeric(5, 4),
	"denial_rate" numeric(5, 4),
	"denial_overturn_rate" numeric(5, 4),
	"clean_claim_rate" numeric(5, 4),
	"total_charges" numeric(12, 2),
	"total_collections" numeric(12, 2),
	"total_adjustments" numeric(12, 2),
	"total_write_offs" numeric(12, 2),
	"claims_submitted" integer,
	"claims_paid" integer,
	"claims_denied" integer,
	"claims_pending" integer,
	"cost_to_collect" numeric(8, 4),
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"calculated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_condition" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"rule_type" varchar(100) NOT NULL,
	"field" varchar(255) NOT NULL,
	"operator" varchar(50) NOT NULL,
	"value" text,
	"logical_operator" varchar(10) DEFAULT 'AND',
	"group_id" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rule_execution_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"rule_type" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" integer NOT NULL,
	"executed_at" timestamp DEFAULT now(),
	"result" varchar(50) NOT NULL,
	"conditions" jsonb,
	"actions" jsonb,
	"execution_time" integer,
	"error" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "scrubbing_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"batch_job_id" uuid,
	"session_id" uuid NOT NULL,
	"scrub_type" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" varchar(100),
	"issue_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"original_value" text,
	"scrubbed_value" text,
	"rule" varchar(100),
	"confidence" numeric(5, 4),
	"status" "validation_status" DEFAULT 'pending' NOT NULL,
	"manual_review_required" boolean DEFAULT false,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"approved" boolean,
	"rejection_reason" text,
	"impact_assessment" text,
	"related_records" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "shift_change_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requesting_staff_id" uuid NOT NULL,
	"original_schedule_id" uuid NOT NULL,
	"original_shift_date" date NOT NULL,
	"original_shift_start" time NOT NULL,
	"original_shift_end" time NOT NULL,
	"change_type" varchar(30) NOT NULL,
	"request_reason" varchar(50),
	"reason_description" text,
	"target_staff_id" uuid,
	"target_schedule_id" uuid,
	"new_shift_start" time,
	"new_shift_end" time,
	"new_shift_date" date,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"urgent_request" boolean DEFAULT false,
	"notice_given_hours" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"manager_approval_required" boolean DEFAULT true,
	"manager_approved_by" uuid,
	"manager_approved_at" timestamp,
	"target_staff_approved" boolean DEFAULT false,
	"target_staff_approved_at" timestamp,
	"processed_by" uuid,
	"processed_at" timestamp,
	"processing_notes" text,
	"coverage_impact" varchar(20),
	"cost_impact" numeric(8, 2),
	"patient_care_impact" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "staff_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"schedule_date" date NOT NULL,
	"shift_start" time NOT NULL,
	"shift_end" time NOT NULL,
	"shift_type" "shift_type" DEFAULT 'regular' NOT NULL,
	"department_id" uuid,
	"location_id" uuid,
	"role_title" varchar(100),
	"specialty_required" varchar(100),
	"skills_required" text,
	"break_start_1" time,
	"break_end_1" time,
	"break_start_2" time,
	"break_end_2" time,
	"lunch_start" time,
	"lunch_end" time,
	"status" "schedule_status" DEFAULT 'scheduled' NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" text,
	"assigned_patients" text,
	"assigned_rooms" text,
	"clock_in_time" timestamp,
	"clock_out_time" timestamp,
	"actual_break_time" integer,
	"actual_lunch_time" integer,
	"overtime_hours" numeric(4, 2),
	"holiday_pay" boolean DEFAULT false,
	"shift_differential" numeric(5, 2),
	"covering_for_id" uuid,
	"substitute_id" uuid,
	"notes" text,
	"special_instructions" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "staff_time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" numeric(4, 1),
	"total_hours" numeric(5, 2),
	"is_partial_day" boolean DEFAULT false,
	"start_time" time,
	"end_time" time,
	"reason" text,
	"emergency_request" boolean DEFAULT false,
	"documentation_required" boolean DEFAULT false,
	"documentation_provided" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"approval_notes" text,
	"coverage_required" boolean DEFAULT true,
	"coverage_arranged" boolean DEFAULT false,
	"covering_staff_id" uuid,
	"coverage_notes" text,
	"balance_before_request" numeric(6, 2),
	"balance_after_request" numeric(6, 2),
	"paid_time_off" boolean DEFAULT true,
	"payroll_processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "suggested_fix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"issue_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"description" text NOT NULL,
	"current_value" text,
	"suggested_value" text NOT NULL,
	"confidence" numeric(5, 4),
	"source" varchar(50) NOT NULL,
	"source_details" text,
	"status" "validation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"applied_by" uuid,
	"applied_at" timestamp,
	"rejected_reason" text,
	"estimated_impact" varchar(50),
	"actual_impact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sync_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ehr_system_id" uuid NOT NULL,
	"job_name" varchar(100) NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"sync_frequency" varchar(20),
	"sync_schedule" varchar(100),
	"entity_type" varchar(50) NOT NULL,
	"field_mapping_template_id" uuid,
	"sync_filters" jsonb,
	"data_range" jsonb,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"last_sync_duration" integer,
	"total_records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_skipped" integer DEFAULT 0,
	"records_errored" integer DEFAULT 0,
	"last_sync_error" text,
	"error_count" integer DEFAULT 0,
	"consecutive_errors" integer DEFAULT 0,
	"rate_limit_per_minute" integer DEFAULT 60,
	"batch_size" integer DEFAULT 100,
	"enable_alerts_on_failure" boolean DEFAULT true,
	"alert_after_consecutive_failures" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"setting_type" varchar(20) NOT NULL,
	"scope" varchar(20) DEFAULT 'organization',
	"user_id" uuid,
	"description" text,
	"is_readonly" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" "access_level" DEFAULT 'read' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trading_partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"partner_name" varchar(100) NOT NULL,
	"partner_type" varchar(50) NOT NULL,
	"business_type" varchar(50),
	"edi_id" varchar(50),
	"isa_sender_id" varchar(15),
	"isa_receiver_id" varchar(15),
	"gs_application_sender_id" varchar(15),
	"gs_application_receiver_id" varchar(15),
	"contact_name" varchar(100),
	"contact_email" varchar(100),
	"contact_phone" varchar(20),
	"technical_contact_name" varchar(100),
	"technical_contact_email" varchar(100),
	"technical_contact_phone" varchar(20),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'US',
	"preferred_communication_method" varchar(20),
	"connection_type" varchar(20),
	"supported_transactions" jsonb,
	"testing_capabilities" jsonb,
	"production_capabilities" jsonb,
	"hipaa_compliant" boolean DEFAULT true,
	"certifications" jsonb,
	"compliance_notes" text,
	"sla_document_path" text,
	"response_time_guarantee" integer,
	"uptime_guarantee" numeric(5, 4),
	"support_hours" varchar(100),
	"fee_structure" jsonb,
	"contract_start_date" date,
	"contract_end_date" date,
	"auto_renewal" boolean DEFAULT false,
	"partnership_status" varchar(20) DEFAULT 'active',
	"relationship_start_date" date,
	"total_transactions_processed" integer DEFAULT 0,
	"average_response_time" integer,
	"last_activity_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "webhook_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text,
	"events" text NOT NULL,
	"retry_count" integer DEFAULT 3,
	"timeout_seconds" integer DEFAULT 30,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_delivery" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_config_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" json NOT NULL,
	"http_status" integer,
	"response_body" text,
	"response_headers" text,
	"attempt_count" integer DEFAULT 1,
	"delivered_at" timestamp,
	"next_retry_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"completion_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "workflow_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_name" varchar(100) NOT NULL,
	"workflow_version" varchar(20) DEFAULT '1.0',
	"trigger_type" varchar(50) NOT NULL,
	"triggered_by" uuid,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"status" "workflow_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"result" json,
	"error_message" text,
	"steps_completed" integer DEFAULT 0,
	"total_steps" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_type" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" integer NOT NULL,
	"current_state" varchar(100) NOT NULL,
	"previous_state" varchar(100),
	"state_data" jsonb,
	"transitions" jsonb,
	"assigned_to" uuid,
	"due_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "write_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid,
	"claim_line_id" uuid,
	"patient_id" uuid NOT NULL,
	"charge_id" uuid,
	"write_off_type" "adjustment_type" NOT NULL,
	"write_off_amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"reason_code" varchar(10),
	"category" varchar(50),
	"is_contractual" boolean DEFAULT false,
	"is_bad_debt" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp,
	"approval_reason" text,
	"posted_date" date NOT NULL,
	"reversal_date" date,
	"is_reversed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustment_reason_code" ADD CONSTRAINT "adjustment_reason_code_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustment_reason_code" ADD CONSTRAINT "adjustment_reason_code_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustment_reason_code" ADD CONSTRAINT "adjustment_reason_code_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_team_member_id_team_member_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_code_update" ADD CONSTRAINT "annual_code_update_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_code_update" ADD CONSTRAINT "annual_code_update_initiated_by_team_member_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_version" ADD CONSTRAINT "api_version_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_team_member_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_event" ADD CONSTRAINT "automation_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_event" ADD CONSTRAINT "automation_event_automation_rule_id_automation_rule_id_fk" FOREIGN KEY ("automation_rule_id") REFERENCES "public"."automation_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rule" ADD CONSTRAINT "automation_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rule" ADD CONSTRAINT "automation_rule_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rule" ADD CONSTRAINT "automation_rule_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_item" ADD CONSTRAINT "batch_job_item_batch_job_id_batch_job_id_fk" FOREIGN KEY ("batch_job_id") REFERENCES "public"."batch_job"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job" ADD CONSTRAINT "batch_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job" ADD CONSTRAINT "batch_job_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job" ADD CONSTRAINT "batch_job_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefits_coverage" ADD CONSTRAINT "benefits_coverage_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefits_coverage" ADD CONSTRAINT "benefits_coverage_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefits_coverage" ADD CONSTRAINT "benefits_coverage_insurance_policy_id_insurance_policy_id_fk" FOREIGN KEY ("insurance_policy_id") REFERENCES "public"."insurance_policy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_action" ADD CONSTRAINT "business_rule_action_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_action" ADD CONSTRAINT "business_rule_action_automation_rule_id_automation_rule_id_fk" FOREIGN KEY ("automation_rule_id") REFERENCES "public"."automation_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_action" ADD CONSTRAINT "business_rule_action_business_rule_id_business_rule_id_fk" FOREIGN KEY ("business_rule_id") REFERENCES "public"."business_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_action" ADD CONSTRAINT "business_rule_action_original_execution_id_business_rule_action_id_fk" FOREIGN KEY ("original_execution_id") REFERENCES "public"."business_rule_action"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_condition" ADD CONSTRAINT "business_rule_condition_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule_condition" ADD CONSTRAINT "business_rule_condition_business_rule_id_business_rule_id_fk" FOREIGN KEY ("business_rule_id") REFERENCES "public"."business_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule" ADD CONSTRAINT "business_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule" ADD CONSTRAINT "business_rule_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rule" ADD CONSTRAINT "business_rule_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_original_charge_id_charge_capture_id_fk" FOREIGN KEY ("original_charge_id") REFERENCES "public"."charge_capture"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_validated_by_team_member_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge_capture" ADD CONSTRAINT "charge_capture_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_attachment" ADD CONSTRAINT "claim_attachment_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_attachment" ADD CONSTRAINT "claim_attachment_uploaded_by_team_member_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_line" ADD CONSTRAINT "claim_line_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_state_history" ADD CONSTRAINT "claim_state_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_state_history" ADD CONSTRAINT "claim_state_history_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_state_history" ADD CONSTRAINT "claim_state_history_changed_by_team_member_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_validation" ADD CONSTRAINT "claim_validation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_validation" ADD CONSTRAINT "claim_validation_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_validation" ADD CONSTRAINT "claim_validation_resolved_by_team_member_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearinghouse_batch" ADD CONSTRAINT "clearinghouse_batch_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearinghouse_batch" ADD CONSTRAINT "clearinghouse_batch_clearinghouse_id_clearinghouse_connection_id_fk" FOREIGN KEY ("clearinghouse_id") REFERENCES "public"."clearinghouse_connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearinghouse_batch" ADD CONSTRAINT "clearinghouse_batch_submitted_by_team_member_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearinghouse_connection" ADD CONSTRAINT "clearinghouse_connection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinician" ADD CONSTRAINT "clinician_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_crosswalk" ADD CONSTRAINT "code_crosswalk_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_crosswalk" ADD CONSTRAINT "code_crosswalk_icd10_code_id_icd10_code_master_id_fk" FOREIGN KEY ("icd10_code_id") REFERENCES "public"."icd10_code_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_crosswalk" ADD CONSTRAINT "code_crosswalk_cpt_code_id_cpt_code_master_id_fk" FOREIGN KEY ("cpt_code_id") REFERENCES "public"."cpt_code_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_update_history" ADD CONSTRAINT "code_update_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_update_history" ADD CONSTRAINT "code_update_history_changed_by_team_member_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_assigned_collector_team_member_id_fk" FOREIGN KEY ("assigned_collector") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audit" ADD CONSTRAINT "compliance_audit_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audit" ADD CONSTRAINT "compliance_audit_compliance_tracking_id_compliance_tracking_id_fk" FOREIGN KEY ("compliance_tracking_id") REFERENCES "public"."compliance_tracking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audit" ADD CONSTRAINT "compliance_audit_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tracking" ADD CONSTRAINT "compliance_tracking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tracking" ADD CONSTRAINT "compliance_tracking_responsible_party_team_member_id_fk" FOREIGN KEY ("responsible_party") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tracking" ADD CONSTRAINT "compliance_tracking_backup_responsible_team_member_id_fk" FOREIGN KEY ("backup_responsible") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tracking" ADD CONSTRAINT "compliance_tracking_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tracking" ADD CONSTRAINT "compliance_tracking_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confidence_thresholds" ADD CONSTRAINT "confidence_thresholds_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracted_rate" ADD CONSTRAINT "contracted_rate_payer_contract_id_payer_contract_id_fk" FOREIGN KEY ("payer_contract_id") REFERENCES "public"."payer_contract"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpt_code_master" ADD CONSTRAINT "cpt_code_master_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpt_code_staging" ADD CONSTRAINT "cpt_code_staging_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialing_application" ADD CONSTRAINT "credentialing_application_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialing_application" ADD CONSTRAINT "credentialing_application_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialing_application" ADD CONSTRAINT "credentialing_application_responsible_party_team_member_id_fk" FOREIGN KEY ("responsible_party") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialing_application" ADD CONSTRAINT "credentialing_application_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentialing_application" ADD CONSTRAINT "credentialing_application_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_mapping" ADD CONSTRAINT "custom_field_mapping_custom_field_id_custom_field_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_custom_field_id_custom_field_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field" ADD CONSTRAINT "custom_field_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_authentication_log" ADD CONSTRAINT "database_authentication_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_connection_log" ADD CONSTRAINT "database_connection_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_query_log" ADD CONSTRAINT "database_query_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_playbook" ADD CONSTRAINT "denial_playbook_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_playbook" ADD CONSTRAINT "denial_playbook_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_playbook" ADD CONSTRAINT "denial_playbook_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_tracking" ADD CONSTRAINT "denial_tracking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_tracking" ADD CONSTRAINT "denial_tracking_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_tracking" ADD CONSTRAINT "denial_tracking_claim_line_id_claim_line_id_fk" FOREIGN KEY ("claim_line_id") REFERENCES "public"."claim_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_tracking" ADD CONSTRAINT "denial_tracking_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_tracking" ADD CONSTRAINT "denial_tracking_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_prior_auth_id_prior_auth_id_fk" FOREIGN KEY ("prior_auth_id") REFERENCES "public"."prior_auth"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_appeal_id_appeal_id_fk" FOREIGN KEY ("appeal_id") REFERENCES "public"."appeal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_team_member_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_interaction" ADD CONSTRAINT "drug_interaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehr_connection" ADD CONSTRAINT "ehr_connection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehr_system" ADD CONSTRAINT "ehr_system_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehr_system" ADD CONSTRAINT "ehr_system_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_cache" ADD CONSTRAINT "eligibility_cache_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_cache" ADD CONSTRAINT "eligibility_cache_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_cache" ADD CONSTRAINT "eligibility_cache_insurance_policy_id_insurance_policy_id_fk" FOREIGN KEY ("insurance_policy_id") REFERENCES "public"."insurance_policy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_check" ADD CONSTRAINT "eligibility_check_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_check" ADD CONSTRAINT "eligibility_check_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_check" ADD CONSTRAINT "eligibility_check_insurance_policy_id_insurance_policy_id_fk" FOREIGN KEY ("insurance_policy_id") REFERENCES "public"."insurance_policy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_check" ADD CONSTRAINT "eligibility_check_checked_by_team_member_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "em_time_rule" ADD CONSTRAINT "em_time_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_verified_by_team_member_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "era_line_detail" ADD CONSTRAINT "era_line_detail_payment_detail_id_payment_detail_id_fk" FOREIGN KEY ("payment_detail_id") REFERENCES "public"."payment_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "era_line_detail" ADD CONSTRAINT "era_line_detail_claim_line_id_claim_line_id_fk" FOREIGN KEY ("claim_line_id") REFERENCES "public"."claim_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedule_item" ADD CONSTRAINT "fee_schedule_item_fee_schedule_id_fee_schedule_id_fk" FOREIGN KEY ("fee_schedule_id") REFERENCES "public"."fee_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedule" ADD CONSTRAINT "fee_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedule" ADD CONSTRAINT "fee_schedule_base_schedule_id_fee_schedule_id_fk" FOREIGN KEY ("base_schedule_id") REFERENCES "public"."fee_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedule" ADD CONSTRAINT "fee_schedule_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedule" ADD CONSTRAINT "fee_schedule_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_resource" ADD CONSTRAINT "fhir_resource_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_confidence" ADD CONSTRAINT "field_confidence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_mapping_template" ADD CONSTRAINT "field_mapping_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_mapping_template" ADD CONSTRAINT "field_mapping_template_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulary" ADD CONSTRAINT "formulary_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulary" ADD CONSTRAINT "formulary_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hot_codes_cache" ADD CONSTRAINT "hot_codes_cache_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icd10_code_master" ADD CONSTRAINT "icd10_code_master_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icd10_code_staging" ADD CONSTRAINT "icd10_code_staging_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_reading_radiologist_provider_id_fk" FOREIGN KEY ("reading_radiologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_order" ADD CONSTRAINT "imaging_order_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policy" ADD CONSTRAINT "insurance_policy_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policy" ADD CONSTRAINT "insurance_policy_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_event_log" ADD CONSTRAINT "integration_event_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_definition" ADD CONSTRAINT "kpi_definition_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_snapshot" ADD CONSTRAINT "kpi_snapshot_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_snapshot" ADD CONSTRAINT "kpi_snapshot_kpi_definition_id_kpi_definition_id_fk" FOREIGN KEY ("kpi_definition_id") REFERENCES "public"."kpi_definition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_collected_by_team_member_id_fk" FOREIGN KEY ("collected_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_reviewed_by_provider_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order" ADD CONSTRAINT "lab_order_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_lab_order_id_lab_order_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_verified_by_team_member_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_diagnosed_by_provider_id_fk" FOREIGN KEY ("diagnosed_by") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_adherence" ADD CONSTRAINT "medication_adherence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_adherence" ADD CONSTRAINT "medication_adherence_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_adherence" ADD CONSTRAINT "medication_adherence_medication_id_medication_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_adherence" ADD CONSTRAINT "medication_adherence_assessed_by_team_member_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_model_metric" ADD CONSTRAINT "ml_model_metric_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_prediction" ADD CONSTRAINT "ml_prediction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_code" ADD CONSTRAINT "modifier_code_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_template" ADD CONSTRAINT "notification_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_team_member_id_team_member_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_template_id_notification_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_invited_by_team_member_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_clinical_criteria" ADD CONSTRAINT "pa_clinical_criteria_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_requirement_rule" ADD CONSTRAINT "pa_requirement_rule_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_report" ADD CONSTRAINT "pathology_report_pathology_specimen_id_pathology_specimen_id_fk" FOREIGN KEY ("pathology_specimen_id") REFERENCES "public"."pathology_specimen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_report" ADD CONSTRAINT "pathology_report_primary_pathologist_provider_id_fk" FOREIGN KEY ("primary_pathologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_report" ADD CONSTRAINT "pathology_report_reviewing_pathologist_provider_id_fk" FOREIGN KEY ("reviewing_pathologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_report" ADD CONSTRAINT "pathology_report_consulting_pathologist_provider_id_fk" FOREIGN KEY ("consulting_pathologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_processed_by_team_member_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathology_specimen" ADD CONSTRAINT "pathology_specimen_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact" ADD CONSTRAINT "patient_contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact" ADD CONSTRAINT "patient_contact_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact" ADD CONSTRAINT "patient_contact_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact" ADD CONSTRAINT "patient_contact_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_extension" ADD CONSTRAINT "patient_extension_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_extension" ADD CONSTRAINT "patient_extension_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_extension" ADD CONSTRAINT "patient_extension_preferred_provider_provider_id_fk" FOREIGN KEY ("preferred_provider") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_extension" ADD CONSTRAINT "patient_extension_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_extension" ADD CONSTRAINT "patient_extension_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_payment" ADD CONSTRAINT "patient_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_payment" ADD CONSTRAINT "patient_payment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_payment" ADD CONSTRAINT "patient_payment_payment_plan_id_payment_plan_id_fk" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_quality_measure" ADD CONSTRAINT "patient_quality_measure_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_quality_measure" ADD CONSTRAINT "patient_quality_measure_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_quality_measure" ADD CONSTRAINT "patient_quality_measure_quality_measure_id_quality_measure_id_fk" FOREIGN KEY ("quality_measure_id") REFERENCES "public"."quality_measure"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_quality_measure" ADD CONSTRAINT "patient_quality_measure_calculated_by_team_member_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_statement" ADD CONSTRAINT "patient_statement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_statement" ADD CONSTRAINT "patient_statement_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_statement" ADD CONSTRAINT "patient_statement_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_config" ADD CONSTRAINT "payer_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_config" ADD CONSTRAINT "payer_config_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_config" ADD CONSTRAINT "payer_config_clearinghouse_id_clearinghouse_connection_id_fk" FOREIGN KEY ("clearinghouse_id") REFERENCES "public"."clearinghouse_connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_config" ADD CONSTRAINT "payer_config_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_contract" ADD CONSTRAINT "payer_contract_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_contract" ADD CONSTRAINT "payer_contract_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_contract" ADD CONSTRAINT "payer_contract_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_contract" ADD CONSTRAINT "payer_contract_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_override_action" ADD CONSTRAINT "payer_override_action_rule_id_payer_override_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."payer_override_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_override_condition" ADD CONSTRAINT "payer_override_condition_rule_id_payer_override_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."payer_override_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_override_rule" ADD CONSTRAINT "payer_override_rule_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_portal_credential" ADD CONSTRAINT "payer_portal_credential_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_portal_credential" ADD CONSTRAINT "payer_portal_credential_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_portal_credential" ADD CONSTRAINT "payer_portal_credential_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_response_message" ADD CONSTRAINT "payer_response_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_response_message" ADD CONSTRAINT "payer_response_message_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_response_message" ADD CONSTRAINT "payer_response_message_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_response_message" ADD CONSTRAINT "payer_response_message_remittance_advice_id_remittance_advice_id_fk" FOREIGN KEY ("remittance_advice_id") REFERENCES "public"."remittance_advice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_response_message" ADD CONSTRAINT "payer_response_message_reviewed_by_team_member_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_submission_config" ADD CONSTRAINT "payer_submission_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_submission_config" ADD CONSTRAINT "payer_submission_config_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_submission_config" ADD CONSTRAINT "payer_submission_config_clearinghouse_id_clearinghouse_connection_id_fk" FOREIGN KEY ("clearinghouse_id") REFERENCES "public"."clearinghouse_connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_submission_config" ADD CONSTRAINT "payer_submission_config_portal_credential_id_payer_portal_credential_id_fk" FOREIGN KEY ("portal_credential_id") REFERENCES "public"."payer_portal_credential"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payer_submission_config" ADD CONSTRAINT "payer_submission_config_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_payment_detail_id_payment_detail_id_fk" FOREIGN KEY ("payment_detail_id") REFERENCES "public"."payment_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_adjustment" ADD CONSTRAINT "payment_adjustment_posted_by_team_member_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_detail" ADD CONSTRAINT "payment_detail_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_detail" ADD CONSTRAINT "payment_detail_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_detail" ADD CONSTRAINT "payment_detail_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_detail" ADD CONSTRAINT "payment_detail_remittance_advice_id_remittance_advice_id_fk" FOREIGN KEY ("remittance_advice_id") REFERENCES "public"."remittance_advice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan" ADD CONSTRAINT "payment_plan_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan" ADD CONSTRAINT "payment_plan_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_posting_activity" ADD CONSTRAINT "payment_posting_activity_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_posting_activity" ADD CONSTRAINT "payment_posting_activity_payment_id_payment_detail_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_posting_activity" ADD CONSTRAINT "payment_posting_activity_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_posting_activity" ADD CONSTRAINT "payment_posting_activity_posted_by_team_member_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_reconciled_by_team_member_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_variance" ADD CONSTRAINT "payment_variance_payment_id_payment_detail_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_variance" ADD CONSTRAINT "payment_variance_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_variance" ADD CONSTRAINT "payment_variance_resolved_by_team_member_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_of_service" ADD CONSTRAINT "place_of_service_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_automation_task" ADD CONSTRAINT "portal_automation_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_automation_task" ADD CONSTRAINT "portal_automation_task_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_automation_task" ADD CONSTRAINT "portal_automation_task_portal_credential_id_payer_portal_credential_id_fk" FOREIGN KEY ("portal_credential_id") REFERENCES "public"."payer_portal_credential"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_automation_task" ADD CONSTRAINT "portal_automation_task_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prior_auth" ADD CONSTRAINT "prior_auth_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_verified_by_team_member_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credential" ADD CONSTRAINT "provider_credential_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_enrollment" ADD CONSTRAINT "provider_enrollment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_enrollment" ADD CONSTRAINT "provider_enrollment_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_enrollment" ADD CONSTRAINT "provider_enrollment_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_enrollment" ADD CONSTRAINT "provider_enrollment_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_enrollment" ADD CONSTRAINT "provider_enrollment_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_credentialing_application_id_credentialing_application_id_fk" FOREIGN KEY ("credentialing_application_id") REFERENCES "public"."credentialing_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_supervising_physician_provider_id_fk" FOREIGN KEY ("supervising_physician") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_proctoring_physician_provider_id_fk" FOREIGN KEY ("proctoring_physician") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_privilege" ADD CONSTRAINT "provider_privilege_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider" ADD CONSTRAINT "provider_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure_performance" ADD CONSTRAINT "quality_measure_performance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure_performance" ADD CONSTRAINT "quality_measure_performance_quality_measure_id_quality_measure_id_fk" FOREIGN KEY ("quality_measure_id") REFERENCES "public"."quality_measure"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure_performance" ADD CONSTRAINT "quality_measure_performance_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure_performance" ADD CONSTRAINT "quality_measure_performance_calculated_by_team_member_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure" ADD CONSTRAINT "quality_measure_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure" ADD CONSTRAINT "quality_measure_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measure" ADD CONSTRAINT "quality_measure_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radiology_report" ADD CONSTRAINT "radiology_report_imaging_order_id_imaging_order_id_fk" FOREIGN KEY ("imaging_order_id") REFERENCES "public"."imaging_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radiology_report" ADD CONSTRAINT "radiology_report_notified_by_team_member_id_fk" FOREIGN KEY ("notified_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radiology_report" ADD CONSTRAINT "radiology_report_reading_radiologist_provider_id_fk" FOREIGN KEY ("reading_radiologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radiology_report" ADD CONSTRAINT "radiology_report_attending_radiologist_provider_id_fk" FOREIGN KEY ("attending_radiologist") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radiology_report" ADD CONSTRAINT "radiology_report_resident_resident_provider_id_fk" FOREIGN KEY ("resident_resident") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referring_provider_id_provider_id_fk" FOREIGN KEY ("referring_provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_advice" ADD CONSTRAINT "remittance_advice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_advice" ADD CONSTRAINT "remittance_advice_payer_id_payer_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_assigned_to_id_team_member_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_assigned_patient_id_patient_id_fk" FOREIGN KEY ("assigned_patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_assigned_appointment_id_appointment_id_fk" FOREIGN KEY ("assigned_appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_approved_by_team_member_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_schedule" ADD CONSTRAINT "resource_schedule_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_cycle_metrics" ADD CONSTRAINT "revenue_cycle_metrics_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_cycle_metrics" ADD CONSTRAINT "revenue_cycle_metrics_calculated_by_team_member_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrubbing_result" ADD CONSTRAINT "scrubbing_result_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrubbing_result" ADD CONSTRAINT "scrubbing_result_batch_job_id_batch_job_id_fk" FOREIGN KEY ("batch_job_id") REFERENCES "public"."batch_job"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrubbing_result" ADD CONSTRAINT "scrubbing_result_reviewed_by_team_member_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrubbing_result" ADD CONSTRAINT "scrubbing_result_processed_by_team_member_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_requesting_staff_id_team_member_id_fk" FOREIGN KEY ("requesting_staff_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_original_schedule_id_staff_schedule_id_fk" FOREIGN KEY ("original_schedule_id") REFERENCES "public"."staff_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_target_staff_id_team_member_id_fk" FOREIGN KEY ("target_staff_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_target_schedule_id_staff_schedule_id_fk" FOREIGN KEY ("target_schedule_id") REFERENCES "public"."staff_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_manager_approved_by_team_member_id_fk" FOREIGN KEY ("manager_approved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_request" ADD CONSTRAINT "shift_change_request_processed_by_team_member_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_staff_member_id_team_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_covering_for_id_team_member_id_fk" FOREIGN KEY ("covering_for_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_substitute_id_team_member_id_fk" FOREIGN KEY ("substitute_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_approved_by_team_member_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staff_member_id_team_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_reviewed_by_team_member_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_covering_staff_id_team_member_id_fk" FOREIGN KEY ("covering_staff_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_fix" ADD CONSTRAINT "suggested_fix_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_fix" ADD CONSTRAINT "suggested_fix_reviewed_by_team_member_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_fix" ADD CONSTRAINT "suggested_fix_applied_by_team_member_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_ehr_system_id_ehr_system_id_fk" FOREIGN KEY ("ehr_system_id") REFERENCES "public"."ehr_system"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_field_mapping_template_id_field_mapping_template_id_fk" FOREIGN KEY ("field_mapping_template_id") REFERENCES "public"."field_mapping_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job" ADD CONSTRAINT "sync_job_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_user_id_team_member_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_partner" ADD CONSTRAINT "trading_partner_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_partner" ADD CONSTRAINT "trading_partner_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_config" ADD CONSTRAINT "webhook_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_config_id_webhook_config_id_fk" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_queue" ADD CONSTRAINT "work_queue_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_queue" ADD CONSTRAINT "work_queue_assigned_to_team_member_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_queue" ADD CONSTRAINT "work_queue_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_triggered_by_team_member_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_state" ADD CONSTRAINT "workflow_state_assigned_to_team_member_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_claim_line_id_claim_line_id_fk" FOREIGN KEY ("claim_line_id") REFERENCES "public"."claim_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_charge_id_charge_capture_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charge_capture"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_approved_by_team_member_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_off" ADD CONSTRAINT "write_off_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_patient_idx" ON "address" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "address_primary_idx" ON "address" USING btree ("patient_id","is_primary");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_org_idx" ON "adjustment_reason_code" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_code_idx" ON "adjustment_reason_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_type_idx" ON "adjustment_reason_code" USING btree ("code_type");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_category_idx" ON "adjustment_reason_code" USING btree ("category");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_payer_idx" ON "adjustment_reason_code" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "adjustment_reason_code_active_idx" ON "adjustment_reason_code" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "analytics_event_org_idx" ON "analytics_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "analytics_event_member_idx" ON "analytics_event" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "analytics_event_event_idx" ON "analytics_event" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_event_category_idx" ON "analytics_event" USING btree ("category");--> statement-breakpoint
CREATE INDEX "analytics_event_timestamp_idx" ON "analytics_event" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "annual_code_update_org_idx" ON "annual_code_update" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "annual_code_update_year_type_idx" ON "annual_code_update" USING btree ("update_year","code_type");--> statement-breakpoint
CREATE INDEX "annual_code_update_status_idx" ON "annual_code_update" USING btree ("status");--> statement-breakpoint
CREATE INDEX "annual_code_update_initiated_by_idx" ON "annual_code_update" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "api_key_org_idx" ON "api_key" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_key_key_prefix_idx" ON "api_key" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_key_active_idx" ON "api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_key_expires_at_idx" ON "api_key" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "api_version_org_idx" ON "api_version" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_version_service_idx" ON "api_version" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "api_version_version_idx" ON "api_version" USING btree ("version");--> statement-breakpoint
CREATE INDEX "api_version_status_idx" ON "api_version" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appeal_org_idx" ON "appeal" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "appeal_claim_idx" ON "appeal" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "appeal_patient_idx" ON "appeal" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appeal_payer_idx" ON "appeal" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "appeal_status_idx" ON "appeal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appeal_level_idx" ON "appeal" USING btree ("appeal_level");--> statement-breakpoint
CREATE INDEX "appeal_appeal_date_idx" ON "appeal" USING btree ("appeal_date");--> statement-breakpoint
CREATE INDEX "appeal_due_date_idx" ON "appeal" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "appointment_org_idx" ON "appointment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "appointment_patient_idx" ON "appointment" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointment_provider_idx" ON "appointment" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "appointment_date_idx" ON "appointment" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "appointment_status_idx" ON "appointment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_log_org_idx" ON "audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_phi_idx" ON "audit_log" USING btree ("contains_phi");--> statement-breakpoint
CREATE INDEX "automation_event_org_idx" ON "automation_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "automation_event_rule_idx" ON "automation_event" USING btree ("automation_rule_id");--> statement-breakpoint
CREATE INDEX "automation_event_context_idx" ON "automation_event" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE INDEX "automation_event_execution_idx" ON "automation_event" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "automation_event_status_idx" ON "automation_event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_event_started_at_idx" ON "automation_event" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "automation_rule_org_idx" ON "automation_rule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "automation_rule_status_idx" ON "automation_rule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_rule_category_idx" ON "automation_rule" USING btree ("category");--> statement-breakpoint
CREATE INDEX "automation_rule_rule_type_idx" ON "automation_rule" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "automation_rule_active_idx" ON "automation_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "automation_rule_priority_idx" ON "automation_rule" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "automation_rule_last_executed_idx" ON "automation_rule" USING btree ("last_executed");--> statement-breakpoint
CREATE INDEX "automation_rule_next_execution_idx" ON "automation_rule" USING btree ("next_execution");--> statement-breakpoint
CREATE INDEX "automation_rule_test_mode_idx" ON "automation_rule" USING btree ("test_mode");--> statement-breakpoint
CREATE INDEX "batch_job_item_batch_job_idx" ON "batch_job_item" USING btree ("batch_job_id");--> statement-breakpoint
CREATE INDEX "batch_job_item_status_idx" ON "batch_job_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "batch_job_item_item_type_idx" ON "batch_job_item" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "batch_job_item_item_id_idx" ON "batch_job_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "batch_job_item_processing_order_idx" ON "batch_job_item" USING btree ("processing_order");--> statement-breakpoint
CREATE INDEX "batch_job_org_idx" ON "batch_job" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "batch_job_status_idx" ON "batch_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "batch_job_job_type_idx" ON "batch_job" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "batch_job_scheduled_at_idx" ON "batch_job" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "batch_job_created_at_idx" ON "batch_job" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "benefits_coverage_org_idx" ON "benefits_coverage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "benefits_coverage_patient_idx" ON "benefits_coverage" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "benefits_coverage_insurance_idx" ON "benefits_coverage" USING btree ("insurance_policy_id");--> statement-breakpoint
CREATE INDEX "benefits_coverage_service_category_idx" ON "benefits_coverage" USING btree ("service_category");--> statement-breakpoint
CREATE INDEX "benefits_coverage_active_idx" ON "benefits_coverage" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "business_rule_action_org_idx" ON "business_rule_action" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "business_rule_action_automation_rule_idx" ON "business_rule_action" USING btree ("automation_rule_id");--> statement-breakpoint
CREATE INDEX "business_rule_action_business_rule_idx" ON "business_rule_action" USING btree ("business_rule_id");--> statement-breakpoint
CREATE INDEX "business_rule_action_entity_idx" ON "business_rule_action" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "business_rule_action_status_idx" ON "business_rule_action" USING btree ("execution_status");--> statement-breakpoint
CREATE INDEX "business_rule_action_result_idx" ON "business_rule_action" USING btree ("result");--> statement-breakpoint
CREATE INDEX "business_rule_action_trigger_event_idx" ON "business_rule_action" USING btree ("trigger_event");--> statement-breakpoint
CREATE INDEX "business_rule_action_trigger_timestamp_idx" ON "business_rule_action" USING btree ("trigger_timestamp");--> statement-breakpoint
CREATE INDEX "business_rule_action_conditions_met_idx" ON "business_rule_action" USING btree ("conditions_met");--> statement-breakpoint
CREATE INDEX "business_rule_action_is_retry_idx" ON "business_rule_action" USING btree ("is_retry");--> statement-breakpoint
CREATE INDEX "business_rule_action_environment_idx" ON "business_rule_action" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "business_rule_action_created_at_idx" ON "business_rule_action" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_rule_condition_org_idx" ON "business_rule_condition" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "business_rule_condition_rule_idx" ON "business_rule_condition" USING btree ("business_rule_id");--> statement-breakpoint
CREATE INDEX "business_rule_condition_field_idx" ON "business_rule_condition" USING btree ("field_name");--> statement-breakpoint
CREATE INDEX "business_rule_condition_active_idx" ON "business_rule_condition" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "business_rule_org_idx" ON "business_rule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "business_rule_category_idx" ON "business_rule" USING btree ("category");--> statement-breakpoint
CREATE INDEX "business_rule_trigger_idx" ON "business_rule" USING btree ("trigger_event");--> statement-breakpoint
CREATE INDEX "business_rule_active_idx" ON "business_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "charge_capture_org_idx" ON "charge_capture" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "charge_capture_patient_idx" ON "charge_capture" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "charge_capture_provider_idx" ON "charge_capture" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "charge_capture_encounter_idx" ON "charge_capture" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "charge_capture_status_idx" ON "charge_capture" USING btree ("status");--> statement-breakpoint
CREATE INDEX "charge_capture_service_date_idx" ON "charge_capture" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "charge_capture_cpt_code_idx" ON "charge_capture" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "charge_capture_charge_number_idx" ON "charge_capture" USING btree ("charge_number");--> statement-breakpoint
CREATE INDEX "charge_capture_validated_idx" ON "charge_capture" USING btree ("is_validated");--> statement-breakpoint
CREATE INDEX "claim_line_claim_idx" ON "claim_line" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_line_cpt_idx" ON "claim_line" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "claim_line_service_date_idx" ON "claim_line" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "claim_state_history_org_idx" ON "claim_state_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "claim_state_history_claim_idx" ON "claim_state_history" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_state_history_to_status_idx" ON "claim_state_history" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "claim_state_history_change_date_idx" ON "claim_state_history" USING btree ("change_date");--> statement-breakpoint
CREATE INDEX "claim_validation_org_idx" ON "claim_validation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "claim_validation_claim_idx" ON "claim_validation" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_validation_type_idx" ON "claim_validation" USING btree ("validation_type");--> statement-breakpoint
CREATE INDEX "claim_validation_result_idx" ON "claim_validation" USING btree ("validation_result");--> statement-breakpoint
CREATE INDEX "claim_validation_status_idx" ON "claim_validation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claim_org_idx" ON "claim" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "claim_patient_idx" ON "claim" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "claim_provider_idx" ON "claim" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "claim_payer_idx" ON "claim" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "claim_status_idx" ON "claim" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claim_service_date_idx" ON "claim" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "claim_claim_number_idx" ON "claim" USING btree ("claim_number");--> statement-breakpoint
CREATE INDEX "clearinghouse_batch_org_idx" ON "clearinghouse_batch" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clearinghouse_batch_clearinghouse_idx" ON "clearinghouse_batch" USING btree ("clearinghouse_id");--> statement-breakpoint
CREATE INDEX "clearinghouse_batch_batch_number_idx" ON "clearinghouse_batch" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "clearinghouse_batch_status_idx" ON "clearinghouse_batch" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clearinghouse_batch_submission_date_idx" ON "clearinghouse_batch" USING btree ("submission_date");--> statement-breakpoint
CREATE INDEX "clearinghouse_connection_org_idx" ON "clearinghouse_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clearinghouse_connection_name_idx" ON "clearinghouse_connection" USING btree ("clearinghouse_name");--> statement-breakpoint
CREATE INDEX "clearinghouse_connection_active_idx" ON "clearinghouse_connection" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "clinician_org_idx" ON "clinician" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clinician_employee_id_idx" ON "clinician" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "clinician_npi_idx" ON "clinician" USING btree ("npi");--> statement-breakpoint
CREATE INDEX "clinician_name_idx" ON "clinician" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "clinician_active_idx" ON "clinician" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "clinician_department_idx" ON "clinician" USING btree ("department");--> statement-breakpoint
CREATE INDEX "code_crosswalk_org_idx" ON "code_crosswalk" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "code_crosswalk_icd10_idx" ON "code_crosswalk" USING btree ("icd10_code_id");--> statement-breakpoint
CREATE INDEX "code_crosswalk_cpt_idx" ON "code_crosswalk" USING btree ("cpt_code_id");--> statement-breakpoint
CREATE INDEX "code_crosswalk_relationship_idx" ON "code_crosswalk" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "code_update_history_org_idx" ON "code_update_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "code_update_history_table_idx" ON "code_update_history" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "code_update_history_code_idx" ON "code_update_history" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "code_update_history_changed_by_idx" ON "code_update_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "code_update_history_changed_at_idx" ON "code_update_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "collection_org_idx" ON "collection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "collection_patient_idx" ON "collection" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "collection_status_idx" ON "collection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "collection_days_outstanding_idx" ON "collection" USING btree ("days_outstanding");--> statement-breakpoint
CREATE INDEX "collection_assigned_collector_idx" ON "collection" USING btree ("assigned_collector");--> statement-breakpoint
CREATE INDEX "collection_next_contact_date_idx" ON "collection" USING btree ("next_contact_date");--> statement-breakpoint
CREATE INDEX "collection_account_number_idx" ON "collection" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "communication_log_org_idx" ON "communication_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "communication_log_type_idx" ON "communication_log" USING btree ("communication_type");--> statement-breakpoint
CREATE INDEX "communication_log_direction_idx" ON "communication_log" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "communication_log_status_idx" ON "communication_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "communication_log_entity_idx" ON "communication_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "communication_log_created_at_idx" ON "communication_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "compliance_audit_org_idx" ON "compliance_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_audit_compliance_tracking_idx" ON "compliance_audit" USING btree ("compliance_tracking_id");--> statement-breakpoint
CREATE INDEX "compliance_audit_audit_type_idx" ON "compliance_audit" USING btree ("audit_type");--> statement-breakpoint
CREATE INDEX "compliance_audit_audit_date_idx" ON "compliance_audit" USING btree ("audit_date");--> statement-breakpoint
CREATE INDEX "compliance_audit_status_idx" ON "compliance_audit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_audit_overall_rating_idx" ON "compliance_audit" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "compliance_audit_follow_up_required_idx" ON "compliance_audit" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "compliance_audit_follow_up_date_idx" ON "compliance_audit" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "compliance_tracking_org_idx" ON "compliance_tracking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_tracking_requirement_name_idx" ON "compliance_tracking" USING btree ("requirement_name");--> statement-breakpoint
CREATE INDEX "compliance_tracking_regulatory_body_idx" ON "compliance_tracking" USING btree ("regulatory_body");--> statement-breakpoint
CREATE INDEX "compliance_tracking_requirement_type_idx" ON "compliance_tracking" USING btree ("requirement_type");--> statement-breakpoint
CREATE INDEX "compliance_tracking_status_idx" ON "compliance_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_tracking_next_due_date_idx" ON "compliance_tracking" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "compliance_tracking_responsible_party_idx" ON "compliance_tracking" USING btree ("responsible_party");--> statement-breakpoint
CREATE INDEX "compliance_tracking_risk_level_idx" ON "compliance_tracking" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "compliance_tracking_compliance_level_idx" ON "compliance_tracking" USING btree ("compliance_level");--> statement-breakpoint
CREATE INDEX "contracted_rate_contract_idx" ON "contracted_rate" USING btree ("payer_contract_id");--> statement-breakpoint
CREATE INDEX "contracted_rate_cpt_idx" ON "contracted_rate" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "contracted_rate_effective_date_idx" ON "contracted_rate" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "contracted_rate_cpt_contract_idx" ON "contracted_rate" USING btree ("cpt_code","payer_contract_id");--> statement-breakpoint
CREATE INDEX "cpt_code_master_org_idx" ON "cpt_code_master" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cpt_code_master_cpt_code_idx" ON "cpt_code_master" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "cpt_code_master_category_idx" ON "cpt_code_master" USING btree ("category");--> statement-breakpoint
CREATE INDEX "cpt_code_master_active_idx" ON "cpt_code_master" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cpt_code_master_rvu_idx" ON "cpt_code_master" USING btree ("rvu_total");--> statement-breakpoint
CREATE INDEX "cpt_code_master_prior_auth_idx" ON "cpt_code_master" USING btree ("prior_auth_commonly_required");--> statement-breakpoint
CREATE INDEX "cpt_code_master_hot_codes_idx" ON "cpt_code_master" USING btree ("usage_count","cpt_code");--> statement-breakpoint
CREATE INDEX "cpt_code_master_global_period_idx" ON "cpt_code_master" USING btree ("global_period");--> statement-breakpoint
CREATE INDEX "cpt_code_master_usage_tracking_idx" ON "cpt_code_master" USING btree ("usage_count","last_used_date");--> statement-breakpoint
CREATE INDEX "cpt_code_staging_org_idx" ON "cpt_code_staging" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cpt_code_staging_cpt_code_idx" ON "cpt_code_staging" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "cpt_code_staging_update_year_idx" ON "cpt_code_staging" USING btree ("update_year");--> statement-breakpoint
CREATE INDEX "cpt_code_staging_batch_idx" ON "cpt_code_staging" USING btree ("import_batch");--> statement-breakpoint
CREATE INDEX "cpt_code_staging_validation_idx" ON "cpt_code_staging" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "credentialing_application_org_idx" ON "credentialing_application" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credentialing_application_provider_idx" ON "credentialing_application" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "credentialing_application_application_number_idx" ON "credentialing_application" USING btree ("application_number");--> statement-breakpoint
CREATE INDEX "credentialing_application_status_idx" ON "credentialing_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credentialing_application_application_type_idx" ON "credentialing_application" USING btree ("application_type");--> statement-breakpoint
CREATE INDEX "credentialing_application_application_date_idx" ON "credentialing_application" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "credentialing_application_submission_deadline_idx" ON "credentialing_application" USING btree ("submission_deadline");--> statement-breakpoint
CREATE INDEX "credentialing_application_target_completion_date_idx" ON "credentialing_application" USING btree ("target_completion_date");--> statement-breakpoint
CREATE INDEX "credentialing_application_credentialing_organization_idx" ON "credentialing_application" USING btree ("credentialing_organization");--> statement-breakpoint
CREATE INDEX "credentialing_application_responsible_party_idx" ON "credentialing_application" USING btree ("responsible_party");--> statement-breakpoint
CREATE INDEX "credentialing_application_committee_review_date_idx" ON "credentialing_application" USING btree ("committee_review_date");--> statement-breakpoint
CREATE INDEX "db_auth_log_org_idx" ON "database_authentication_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "db_auth_log_username_idx" ON "database_authentication_log" USING btree ("username");--> statement-breakpoint
CREATE INDEX "db_auth_log_client_ip_idx" ON "database_authentication_log" USING btree ("client_ip_address");--> statement-breakpoint
CREATE INDEX "db_auth_log_result_idx" ON "database_authentication_log" USING btree ("authentication_result");--> statement-breakpoint
CREATE INDEX "db_auth_log_event_time_idx" ON "database_authentication_log" USING btree ("event_time");--> statement-breakpoint
CREATE INDEX "db_auth_log_risk_score_idx" ON "database_authentication_log" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "db_auth_log_anomalous_idx" ON "database_authentication_log" USING btree ("is_anomalous");--> statement-breakpoint
CREATE INDEX "db_auth_log_blocked_idx" ON "database_authentication_log" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX "db_auth_log_session_idx" ON "database_authentication_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "db_auth_log_method_idx" ON "database_authentication_log" USING btree ("authentication_method");--> statement-breakpoint
CREATE INDEX "db_connection_log_org_idx" ON "database_connection_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "db_connection_log_user_idx" ON "database_connection_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "db_connection_log_event_type_idx" ON "database_connection_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "db_connection_log_client_ip_idx" ON "database_connection_log" USING btree ("client_ip_address");--> statement-breakpoint
CREATE INDEX "db_connection_log_session_idx" ON "database_connection_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "db_connection_log_created_at_idx" ON "database_connection_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "db_connection_log_auth_success_idx" ON "database_connection_log" USING btree ("authentication_success");--> statement-breakpoint
CREATE INDEX "db_connection_log_connection_state_idx" ON "database_connection_log" USING btree ("connection_state");--> statement-breakpoint
CREATE INDEX "db_query_log_org_idx" ON "database_query_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "db_query_log_session_idx" ON "database_query_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "db_query_log_query_type_idx" ON "database_query_log" USING btree ("query_type");--> statement-breakpoint
CREATE INDEX "db_query_log_duration_idx" ON "database_query_log" USING btree ("duration");--> statement-breakpoint
CREATE INDEX "db_query_log_start_time_idx" ON "database_query_log" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "db_query_log_slow_query_idx" ON "database_query_log" USING btree ("is_slow_query");--> statement-breakpoint
CREATE INDEX "db_query_log_error_idx" ON "database_query_log" USING btree ("error_occurred");--> statement-breakpoint
CREATE INDEX "db_query_log_user_idx" ON "database_query_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "db_query_log_client_ip_idx" ON "database_query_log" USING btree ("client_ip_address");--> statement-breakpoint
CREATE INDEX "db_query_log_query_hash_idx" ON "database_query_log" USING btree ("query_hash");--> statement-breakpoint
CREATE INDEX "denial_playbook_org_idx" ON "denial_playbook" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "denial_playbook_active_idx" ON "denial_playbook" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "denial_playbook_priority_idx" ON "denial_playbook" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "denial_playbook_name_idx" ON "denial_playbook" USING btree ("name");--> statement-breakpoint
CREATE INDEX "denial_tracking_org_idx" ON "denial_tracking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "denial_tracking_claim_idx" ON "denial_tracking" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "denial_tracking_claim_line_idx" ON "denial_tracking" USING btree ("claim_line_id");--> statement-breakpoint
CREATE INDEX "denial_tracking_status_idx" ON "denial_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "denial_tracking_category_idx" ON "denial_tracking" USING btree ("denial_category");--> statement-breakpoint
CREATE INDEX "denial_tracking_denial_date_idx" ON "denial_tracking" USING btree ("denial_date");--> statement-breakpoint
CREATE INDEX "denial_tracking_appeal_deadline_idx" ON "denial_tracking" USING btree ("appeal_deadline");--> statement-breakpoint
CREATE INDEX "denial_tracking_is_appealable_idx" ON "denial_tracking" USING btree ("is_appealable");--> statement-breakpoint
CREATE INDEX "document_org_idx" ON "document" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_patient_idx" ON "document" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "document_claim_idx" ON "document" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "document_type_idx" ON "document" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "document_s3_key_idx" ON "document" USING btree ("s3_key");--> statement-breakpoint
CREATE INDEX "drug_interaction_org_idx" ON "drug_interaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drug_interaction_drug1_idx" ON "drug_interaction" USING btree ("drug1_ndc_number");--> statement-breakpoint
CREATE INDEX "drug_interaction_drug2_idx" ON "drug_interaction" USING btree ("drug2_ndc_number");--> statement-breakpoint
CREATE INDEX "drug_interaction_drugs_idx" ON "drug_interaction" USING btree ("drug1_ndc_number","drug2_ndc_number");--> statement-breakpoint
CREATE INDEX "drug_interaction_severity_idx" ON "drug_interaction" USING btree ("severity_level");--> statement-breakpoint
CREATE INDEX "drug_interaction_type_idx" ON "drug_interaction" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "drug_interaction_active_idx" ON "drug_interaction" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "drug_interaction_evidence_level_idx" ON "drug_interaction" USING btree ("evidence_level");--> statement-breakpoint
CREATE INDEX "ehr_connection_org_idx" ON "ehr_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ehr_connection_system_name_idx" ON "ehr_connection" USING btree ("ehr_system_name");--> statement-breakpoint
CREATE INDEX "ehr_connection_active_idx" ON "ehr_connection" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ehr_connection_last_sync_idx" ON "ehr_connection" USING btree ("last_sync_at");--> statement-breakpoint
CREATE INDEX "ehr_system_org_idx" ON "ehr_system" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ehr_system_vendor_idx" ON "ehr_system" USING btree ("vendor");--> statement-breakpoint
CREATE INDEX "ehr_system_active_idx" ON "ehr_system" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "eligibility_cache_org_idx" ON "eligibility_cache" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "eligibility_cache_patient_idx" ON "eligibility_cache" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "eligibility_cache_policy_idx" ON "eligibility_cache" USING btree ("insurance_policy_id");--> statement-breakpoint
CREATE INDEX "eligibility_cache_cache_key_idx" ON "eligibility_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "eligibility_cache_expires_at_idx" ON "eligibility_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "eligibility_check_org_idx" ON "eligibility_check" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "eligibility_check_patient_idx" ON "eligibility_check" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "eligibility_check_policy_idx" ON "eligibility_check" USING btree ("insurance_policy_id");--> statement-breakpoint
CREATE INDEX "eligibility_check_status_idx" ON "eligibility_check" USING btree ("eligibility_status");--> statement-breakpoint
CREATE INDEX "eligibility_check_service_date_idx" ON "eligibility_check" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "em_time_rule_org_idx" ON "em_time_rule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "em_time_rule_cpt_code_idx" ON "em_time_rule" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "em_time_rule_service_category_idx" ON "em_time_rule" USING btree ("service_category");--> statement-breakpoint
CREATE INDEX "em_time_rule_active_idx" ON "em_time_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "emergency_contact_org_idx" ON "emergency_contact" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "emergency_contact_patient_idx" ON "emergency_contact" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "emergency_contact_is_primary_contact_idx" ON "emergency_contact" USING btree ("is_primary_contact");--> statement-breakpoint
CREATE INDEX "emergency_contact_priority_idx" ON "emergency_contact" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "emergency_contact_should_contact_in_emergency_idx" ON "emergency_contact" USING btree ("should_contact_in_emergency");--> statement-breakpoint
CREATE INDEX "emergency_contact_is_active_idx" ON "emergency_contact" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "emergency_contact_last_verified_date_idx" ON "emergency_contact" USING btree ("last_verified_date");--> statement-breakpoint
CREATE INDEX "encounter_org_idx" ON "encounter" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "encounter_patient_idx" ON "encounter" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "encounter_provider_idx" ON "encounter" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "encounter_appointment_idx" ON "encounter" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "encounter_status_idx" ON "encounter" USING btree ("status");--> statement-breakpoint
CREATE INDEX "encounter_date_idx" ON "encounter" USING btree ("encounter_date");--> statement-breakpoint
CREATE INDEX "encounter_encounter_number_idx" ON "encounter" USING btree ("encounter_number");--> statement-breakpoint
CREATE INDEX "era_line_detail_payment_detail_idx" ON "era_line_detail" USING btree ("payment_detail_id");--> statement-breakpoint
CREATE INDEX "era_line_detail_claim_line_idx" ON "era_line_detail" USING btree ("claim_line_id");--> statement-breakpoint
CREATE INDEX "era_line_detail_service_date_idx" ON "era_line_detail" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "fee_schedule_item_schedule_idx" ON "fee_schedule_item" USING btree ("fee_schedule_id");--> statement-breakpoint
CREATE INDEX "fee_schedule_item_cpt_idx" ON "fee_schedule_item" USING btree ("cpt_code");--> statement-breakpoint
CREATE INDEX "fee_schedule_item_schedule_cpt_idx" ON "fee_schedule_item" USING btree ("fee_schedule_id","cpt_code");--> statement-breakpoint
CREATE INDEX "fee_schedule_org_idx" ON "fee_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "fee_schedule_name_idx" ON "fee_schedule" USING btree ("name");--> statement-breakpoint
CREATE INDEX "fee_schedule_active_idx" ON "fee_schedule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "fee_schedule_default_idx" ON "fee_schedule" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "fee_schedule_effective_date_idx" ON "fee_schedule" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "fhir_resource_org_idx" ON "fhir_resource" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "fhir_resource_type_idx" ON "fhir_resource" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "fhir_resource_id_idx" ON "fhir_resource" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "fhir_resource_source_system_idx" ON "fhir_resource" USING btree ("source_system");--> statement-breakpoint
CREATE INDEX "fhir_resource_sync_status_idx" ON "fhir_resource" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "fhir_resource_last_modified_idx" ON "fhir_resource" USING btree ("last_modified");--> statement-breakpoint
CREATE INDEX "field_confidence_org_idx" ON "field_confidence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "field_confidence_entity_idx" ON "field_confidence" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "field_confidence_field_name_idx" ON "field_confidence" USING btree ("field_name");--> statement-breakpoint
CREATE INDEX "field_confidence_confidence_score_idx" ON "field_confidence" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "field_confidence_quality_status_idx" ON "field_confidence" USING btree ("quality_status");--> statement-breakpoint
CREATE INDEX "field_confidence_last_validated_idx" ON "field_confidence" USING btree ("last_validated");--> statement-breakpoint
CREATE INDEX "field_mapping_template_org_idx" ON "field_mapping_template" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "field_mapping_template_name_idx" ON "field_mapping_template" USING btree ("template_name");--> statement-breakpoint
CREATE INDEX "field_mapping_template_source_system_idx" ON "field_mapping_template" USING btree ("source_system");--> statement-breakpoint
CREATE INDEX "field_mapping_template_target_system_idx" ON "field_mapping_template" USING btree ("target_system");--> statement-breakpoint
CREATE INDEX "field_mapping_template_active_idx" ON "field_mapping_template" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "formulary_org_idx" ON "formulary" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "formulary_payer_idx" ON "formulary" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "formulary_medication_name_idx" ON "formulary" USING btree ("medication_name");--> statement-breakpoint
CREATE INDEX "formulary_ndc_number_idx" ON "formulary" USING btree ("ndc_number");--> statement-breakpoint
CREATE INDEX "formulary_status_idx" ON "formulary" USING btree ("status");--> statement-breakpoint
CREATE INDEX "formulary_tier_idx" ON "formulary" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "formulary_effective_date_idx" ON "formulary" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "formulary_prior_auth_idx" ON "formulary" USING btree ("requires_prior_auth");--> statement-breakpoint
CREATE INDEX "hot_codes_cache_org_idx" ON "hot_codes_cache" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "hot_codes_cache_code_type_idx" ON "hot_codes_cache" USING btree ("code_type");--> statement-breakpoint
CREATE INDEX "hot_codes_cache_code_idx" ON "hot_codes_cache" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "hot_codes_cache_usage_idx" ON "hot_codes_cache" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "hot_codes_cache_should_cache_idx" ON "hot_codes_cache" USING btree ("should_cache");--> statement-breakpoint
CREATE INDEX "icd10_code_master_org_idx" ON "icd10_code_master" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "icd10_code_master_icd10_code_idx" ON "icd10_code_master" USING btree ("icd10_code");--> statement-breakpoint
CREATE INDEX "icd10_code_master_chapter_idx" ON "icd10_code_master" USING btree ("chapter");--> statement-breakpoint
CREATE INDEX "icd10_code_master_category_idx" ON "icd10_code_master" USING btree ("category");--> statement-breakpoint
CREATE INDEX "icd10_code_master_code_type_idx" ON "icd10_code_master" USING btree ("code_type");--> statement-breakpoint
CREATE INDEX "icd10_code_master_active_idx" ON "icd10_code_master" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "icd10_code_master_billable_active_idx" ON "icd10_code_master" USING btree ("icd10_code") WHERE "icd10_code_master"."is_billable" = true AND "icd10_code_master"."is_active" = true;--> statement-breakpoint
CREATE INDEX "icd10_code_master_hot_codes_idx" ON "icd10_code_master" USING btree ("icd10_code","short_description") WHERE "icd10_code_master"."usage_count" > 100;--> statement-breakpoint
CREATE INDEX "icd10_code_master_composite_idx" ON "icd10_code_master" USING btree ("icd10_code","short_description","category","is_billable") WHERE "icd10_code_master"."is_active" = true;--> statement-breakpoint
CREATE INDEX "icd10_code_master_usage_tracking_idx" ON "icd10_code_master" USING btree ("usage_count","last_used_date");--> statement-breakpoint
CREATE INDEX "icd10_code_staging_org_idx" ON "icd10_code_staging" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "icd10_code_staging_icd10_code_idx" ON "icd10_code_staging" USING btree ("icd10_code");--> statement-breakpoint
CREATE INDEX "icd10_code_staging_update_year_idx" ON "icd10_code_staging" USING btree ("update_year");--> statement-breakpoint
CREATE INDEX "icd10_code_staging_batch_idx" ON "icd10_code_staging" USING btree ("import_batch");--> statement-breakpoint
CREATE INDEX "icd10_code_staging_validation_idx" ON "icd10_code_staging" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "imaging_order_org_idx" ON "imaging_order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "imaging_order_patient_idx" ON "imaging_order" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "imaging_order_provider_idx" ON "imaging_order" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "imaging_order_encounter_idx" ON "imaging_order" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "imaging_order_status_idx" ON "imaging_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "imaging_order_order_number_idx" ON "imaging_order" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "imaging_order_accession_number_idx" ON "imaging_order" USING btree ("accession_number");--> statement-breakpoint
CREATE INDEX "imaging_order_order_date_idx" ON "imaging_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "imaging_order_modality_type_idx" ON "imaging_order" USING btree ("modality_type");--> statement-breakpoint
CREATE INDEX "imaging_order_body_part_idx" ON "imaging_order" USING btree ("body_part");--> statement-breakpoint
CREATE INDEX "imaging_order_priority_idx" ON "imaging_order" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "imaging_order_scheduled_date_idx" ON "imaging_order" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "imaging_order_study_date_idx" ON "imaging_order" USING btree ("study_date");--> statement-breakpoint
CREATE INDEX "imaging_order_reading_radiologist_idx" ON "imaging_order" USING btree ("reading_radiologist");--> statement-breakpoint
CREATE INDEX "insurance_policy_patient_idx" ON "insurance_policy" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "insurance_policy_payer_idx" ON "insurance_policy" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "insurance_policy_policy_idx" ON "insurance_policy" USING btree ("policy_number");--> statement-breakpoint
CREATE INDEX "integration_event_log_org_idx" ON "integration_event_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integration_event_log_integration_type_idx" ON "integration_event_log" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX "integration_event_log_status_idx" ON "integration_event_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "integration_event_log_event_name_idx" ON "integration_event_log" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "integration_event_log_created_at_idx" ON "integration_event_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "kpi_definition_org_idx" ON "kpi_definition" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "kpi_definition_name_idx" ON "kpi_definition" USING btree ("kpi_name");--> statement-breakpoint
CREATE INDEX "kpi_definition_active_idx" ON "kpi_definition" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "kpi_snapshot_org_idx" ON "kpi_snapshot" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "kpi_snapshot_kpi_idx" ON "kpi_snapshot" USING btree ("kpi_definition_id");--> statement-breakpoint
CREATE INDEX "kpi_snapshot_period_idx" ON "kpi_snapshot" USING btree ("period");--> statement-breakpoint
CREATE INDEX "kpi_snapshot_snapshot_date_idx" ON "kpi_snapshot" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "lab_order_org_idx" ON "lab_order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lab_order_patient_idx" ON "lab_order" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_order_provider_idx" ON "lab_order" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "lab_order_encounter_idx" ON "lab_order" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "lab_order_status_idx" ON "lab_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_order_order_number_idx" ON "lab_order" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "lab_order_accession_number_idx" ON "lab_order" USING btree ("accession_number");--> statement-breakpoint
CREATE INDEX "lab_order_order_date_idx" ON "lab_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "lab_order_test_name_idx" ON "lab_order" USING btree ("test_name");--> statement-breakpoint
CREATE INDEX "lab_order_test_category_idx" ON "lab_order" USING btree ("test_category");--> statement-breakpoint
CREATE INDEX "lab_order_priority_idx" ON "lab_order" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "lab_order_collection_date_idx" ON "lab_order" USING btree ("collection_date");--> statement-breakpoint
CREATE INDEX "lab_order_result_date_idx" ON "lab_order" USING btree ("result_date");--> statement-breakpoint
CREATE INDEX "lab_order_is_abnormal_idx" ON "lab_order" USING btree ("is_abnormal");--> statement-breakpoint
CREATE INDEX "lab_order_is_critical_idx" ON "lab_order" USING btree ("is_critical");--> statement-breakpoint
CREATE INDEX "lab_result_lab_order_idx" ON "lab_result" USING btree ("lab_order_id");--> statement-breakpoint
CREATE INDEX "lab_result_test_name_idx" ON "lab_result" USING btree ("test_name");--> statement-breakpoint
CREATE INDEX "lab_result_component_name_idx" ON "lab_result" USING btree ("component_name");--> statement-breakpoint
CREATE INDEX "lab_result_loinc_code_idx" ON "lab_result" USING btree ("loinc_code");--> statement-breakpoint
CREATE INDEX "lab_result_is_abnormal_idx" ON "lab_result" USING btree ("is_abnormal");--> statement-breakpoint
CREATE INDEX "lab_result_is_critical_idx" ON "lab_result" USING btree ("is_critical");--> statement-breakpoint
CREATE INDEX "lab_result_is_panic_idx" ON "lab_result" USING btree ("is_panic");--> statement-breakpoint
CREATE INDEX "lab_result_status_idx" ON "lab_result" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_result_resulted_at_idx" ON "lab_result" USING btree ("resulted_at");--> statement-breakpoint
CREATE INDEX "lab_result_interpretation_idx" ON "lab_result" USING btree ("interpretation");--> statement-breakpoint
CREATE INDEX "medical_history_org_idx" ON "medical_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "medical_history_patient_idx" ON "medical_history" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medical_history_active_idx" ON "medical_history" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "medical_history_condition_idx" ON "medical_history" USING btree ("condition_name");--> statement-breakpoint
CREATE INDEX "medical_history_icd10_idx" ON "medical_history" USING btree ("icd10_code");--> statement-breakpoint
CREATE INDEX "medical_history_onset_date_idx" ON "medical_history" USING btree ("onset_date");--> statement-breakpoint
CREATE INDEX "medical_history_diagnosed_by_idx" ON "medical_history" USING btree ("diagnosed_by");--> statement-breakpoint
CREATE INDEX "medication_adherence_org_idx" ON "medication_adherence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "medication_adherence_patient_idx" ON "medication_adherence" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medication_adherence_medication_idx" ON "medication_adherence" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "medication_adherence_tracking_period_idx" ON "medication_adherence" USING btree ("tracking_period_start","tracking_period_end");--> statement-breakpoint
CREATE INDEX "medication_adherence_adherence_rate_idx" ON "medication_adherence" USING btree ("adherence_rate");--> statement-breakpoint
CREATE INDEX "medication_adherence_assessment_date_idx" ON "medication_adherence" USING btree ("assessment_date");--> statement-breakpoint
CREATE INDEX "medication_adherence_next_assessment_idx" ON "medication_adherence" USING btree ("next_assessment_date");--> statement-breakpoint
CREATE INDEX "medication_adherence_follow_up_idx" ON "medication_adherence" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "medication_org_idx" ON "medication" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "medication_patient_idx" ON "medication" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medication_provider_idx" ON "medication" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "medication_encounter_idx" ON "medication" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "medication_status_idx" ON "medication" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medication_prescription_number_idx" ON "medication" USING btree ("prescription_number");--> statement-breakpoint
CREATE INDEX "medication_medication_name_idx" ON "medication" USING btree ("medication_name");--> statement-breakpoint
CREATE INDEX "medication_ndc_number_idx" ON "medication" USING btree ("ndc_number");--> statement-breakpoint
CREATE INDEX "medication_prescribed_date_idx" ON "medication" USING btree ("prescribed_date");--> statement-breakpoint
CREATE INDEX "medication_end_date_idx" ON "medication" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "medication_is_high_risk_idx" ON "medication" USING btree ("is_high_risk");--> statement-breakpoint
CREATE INDEX "medication_next_review_date_idx" ON "medication" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "ml_model_metric_org_idx" ON "ml_model_metric" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ml_model_metric_model_idx" ON "ml_model_metric" USING btree ("model_name","model_version");--> statement-breakpoint
CREATE INDEX "ml_model_metric_training_date_idx" ON "ml_model_metric" USING btree ("training_completed");--> statement-breakpoint
CREATE INDEX "ml_prediction_org_idx" ON "ml_prediction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ml_prediction_model_idx" ON "ml_prediction" USING btree ("model_name","model_version");--> statement-breakpoint
CREATE INDEX "ml_prediction_entity_idx" ON "ml_prediction" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ml_prediction_confidence_idx" ON "ml_prediction" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "ml_prediction_created_at_idx" ON "ml_prediction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "modifier_code_org_idx" ON "modifier_code" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "modifier_code_modifier_code_idx" ON "modifier_code" USING btree ("modifier_code");--> statement-breakpoint
CREATE INDEX "modifier_code_category_idx" ON "modifier_code" USING btree ("category");--> statement-breakpoint
CREATE INDEX "modifier_code_active_idx" ON "modifier_code" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notification_template_org_idx" ON "notification_template" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notification_template_type_idx" ON "notification_template" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_template_active_idx" ON "notification_template" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notification_org_idx" ON "notification" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notification_member_idx" ON "notification" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_unread_idx" ON "notification" USING btree ("team_member_id","is_read");--> statement-breakpoint
CREATE INDEX "notification_entity_idx" ON "notification" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "org_invitation_org_idx" ON "organization_invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_invitation_email_idx" ON "organization_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "org_invitation_token_idx" ON "organization_invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "org_invitation_status_idx" ON "organization_invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organization_clerk_org_id_idx" ON "organization" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pathology_report_pathology_specimen_idx" ON "pathology_report" USING btree ("pathology_specimen_id");--> statement-breakpoint
CREATE INDEX "pathology_report_report_number_idx" ON "pathology_report" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "pathology_report_status_idx" ON "pathology_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pathology_report_primary_pathologist_idx" ON "pathology_report" USING btree ("primary_pathologist");--> statement-breakpoint
CREATE INDEX "pathology_report_reviewing_pathologist_idx" ON "pathology_report" USING btree ("reviewing_pathologist");--> statement-breakpoint
CREATE INDEX "pathology_report_finalized_date_idx" ON "pathology_report" USING btree ("finalized_date");--> statement-breakpoint
CREATE INDEX "pathology_report_has_critical_values_idx" ON "pathology_report" USING btree ("has_critical_values");--> statement-breakpoint
CREATE INDEX "pathology_report_follow_up_required_idx" ON "pathology_report" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "pathology_report_consultation_requested_idx" ON "pathology_report" USING btree ("consultation_requested");--> statement-breakpoint
CREATE INDEX "pathology_specimen_org_idx" ON "pathology_specimen" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pathology_specimen_patient_idx" ON "pathology_specimen" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "pathology_specimen_provider_idx" ON "pathology_specimen" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "pathology_specimen_specimen_number_idx" ON "pathology_specimen" USING btree ("specimen_number");--> statement-breakpoint
CREATE INDEX "pathology_specimen_accession_number_idx" ON "pathology_specimen" USING btree ("accession_number");--> statement-breakpoint
CREATE INDEX "pathology_specimen_collection_date_idx" ON "pathology_specimen" USING btree ("collection_date");--> statement-breakpoint
CREATE INDEX "pathology_specimen_specimen_type_idx" ON "pathology_specimen" USING btree ("specimen_type");--> statement-breakpoint
CREATE INDEX "pathology_specimen_status_idx" ON "pathology_specimen" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pathology_specimen_collection_procedure_idx" ON "pathology_specimen" USING btree ("collection_procedure");--> statement-breakpoint
CREATE INDEX "patient_contact_org_idx" ON "patient_contact" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_contact_patient_idx" ON "patient_contact" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_contact_contact_type_idx" ON "patient_contact" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX "patient_contact_is_primary_caregiver_idx" ON "patient_contact" USING btree ("is_primary_caregiver");--> statement-breakpoint
CREATE INDEX "patient_contact_is_active_idx" ON "patient_contact" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "patient_contact_organization_idx" ON "patient_contact" USING btree ("organization");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_org_idx" ON "patient_diagnosis" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_patient_idx" ON "patient_diagnosis" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_encounter_idx" ON "patient_diagnosis" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_provider_idx" ON "patient_diagnosis" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_diagnosis_code_idx" ON "patient_diagnosis" USING btree ("diagnosis_code");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_is_primary_idx" ON "patient_diagnosis" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_diagnosis_date_idx" ON "patient_diagnosis" USING btree ("diagnosis_date");--> statement-breakpoint
CREATE INDEX "patient_diagnosis_status_idx" ON "patient_diagnosis" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_extension_org_idx" ON "patient_extension" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_extension_patient_idx" ON "patient_extension" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_extension_preferred_language_idx" ON "patient_extension" USING btree ("preferred_language");--> statement-breakpoint
CREATE INDEX "patient_extension_interpreter_needed_idx" ON "patient_extension" USING btree ("interpreter_needed");--> statement-breakpoint
CREATE INDEX "patient_extension_employment_status_idx" ON "patient_extension" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "patient_extension_transportation_challenges_idx" ON "patient_extension" USING btree ("transportation_challenges");--> statement-breakpoint
CREATE INDEX "patient_extension_food_insecurity_idx" ON "patient_extension" USING btree ("food_insecurity");--> statement-breakpoint
CREATE INDEX "patient_extension_preferred_provider_idx" ON "patient_extension" USING btree ("preferred_provider");--> statement-breakpoint
CREATE INDEX "patient_extension_consent_to_research_idx" ON "patient_extension" USING btree ("consent_to_research");--> statement-breakpoint
CREATE INDEX "patient_payment_org_idx" ON "patient_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_payment_patient_idx" ON "patient_payment" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_payment_payment_plan_idx" ON "patient_payment" USING btree ("payment_plan_id");--> statement-breakpoint
CREATE INDEX "patient_payment_status_idx" ON "patient_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_payment_payment_date_idx" ON "patient_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_org_idx" ON "patient_quality_measure" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_patient_idx" ON "patient_quality_measure" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_quality_measure_idx" ON "patient_quality_measure" USING btree ("quality_measure_id");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_measurement_date_idx" ON "patient_quality_measure" USING btree ("measurement_date");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_reporting_period_idx" ON "patient_quality_measure" USING btree ("reporting_period");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_is_eligible_idx" ON "patient_quality_measure" USING btree ("is_eligible");--> statement-breakpoint
CREATE INDEX "patient_quality_measure_meets_numerator_idx" ON "patient_quality_measure" USING btree ("meets_numerator");--> statement-breakpoint
CREATE INDEX "patient_statement_org_idx" ON "patient_statement" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_statement_patient_idx" ON "patient_statement" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_statement_status_idx" ON "patient_statement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_statement_statement_date_idx" ON "patient_statement" USING btree ("statement_date");--> statement-breakpoint
CREATE INDEX "patient_statement_due_date_idx" ON "patient_statement" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "patient_statement_statement_number_idx" ON "patient_statement" USING btree ("statement_number");--> statement-breakpoint
CREATE INDEX "patient_org_idx" ON "patient" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_mrn_idx" ON "patient" USING btree ("organization_id","mrn");--> statement-breakpoint
CREATE INDEX "patient_name_idx" ON "patient" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "patient_dob_idx" ON "patient" USING btree ("date_of_birth");--> statement-breakpoint
CREATE INDEX "payer_config_org_idx" ON "payer_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payer_config_payer_idx" ON "payer_config" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_config_submission_method_idx" ON "payer_config" USING btree ("submission_method");--> statement-breakpoint
CREATE INDEX "payer_config_active_idx" ON "payer_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payer_contract_org_idx" ON "payer_contract" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payer_contract_payer_idx" ON "payer_contract" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_contract_status_idx" ON "payer_contract" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payer_contract_effective_date_idx" ON "payer_contract" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "payer_contract_expiration_date_idx" ON "payer_contract" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "payer_contract_contract_number_idx" ON "payer_contract" USING btree ("contract_number");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_org_idx" ON "payer_portal_credential" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_payer_idx" ON "payer_portal_credential" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_portal_name_idx" ON "payer_portal_credential" USING btree ("portal_name");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_username_idx" ON "payer_portal_credential" USING btree ("username");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_active_idx" ON "payer_portal_credential" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payer_portal_credential_status_idx" ON "payer_portal_credential" USING btree ("credential_status");--> statement-breakpoint
CREATE INDEX "payer_response_message_org_idx" ON "payer_response_message" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payer_response_message_payer_idx" ON "payer_response_message" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_response_message_claim_idx" ON "payer_response_message" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "payer_response_message_type_idx" ON "payer_response_message" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "payer_response_message_processing_status_idx" ON "payer_response_message" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "payer_response_message_received_at_idx" ON "payer_response_message" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "payer_response_message_requires_manual_review_idx" ON "payer_response_message" USING btree ("requires_manual_review");--> statement-breakpoint
CREATE INDEX "payer_submission_config_org_idx" ON "payer_submission_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payer_submission_config_payer_idx" ON "payer_submission_config" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_submission_config_submission_method_idx" ON "payer_submission_config" USING btree ("submission_method");--> statement-breakpoint
CREATE INDEX "payer_submission_config_clearinghouse_idx" ON "payer_submission_config" USING btree ("clearinghouse_id");--> statement-breakpoint
CREATE INDEX "payer_submission_config_active_idx" ON "payer_submission_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payer_payer_id_idx" ON "payer" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payer_name_idx" ON "payer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "payment_adjustment_org_idx" ON "payment_adjustment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_adjustment_claim_idx" ON "payment_adjustment" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "payment_adjustment_payment_detail_idx" ON "payment_adjustment" USING btree ("payment_detail_id");--> statement-breakpoint
CREATE INDEX "payment_adjustment_type_idx" ON "payment_adjustment" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "payment_adjustment_posted_by_idx" ON "payment_adjustment" USING btree ("posted_by");--> statement-breakpoint
CREATE INDEX "payment_detail_org_idx" ON "payment_detail" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_detail_claim_idx" ON "payment_detail" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "payment_detail_patient_idx" ON "payment_detail" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "payment_detail_remittance_idx" ON "payment_detail" USING btree ("remittance_advice_id");--> statement-breakpoint
CREATE INDEX "payment_detail_status_idx" ON "payment_detail" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_plan_org_idx" ON "payment_plan" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_plan_patient_idx" ON "payment_plan" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "payment_plan_status_idx" ON "payment_plan" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_plan_next_payment_idx" ON "payment_plan" USING btree ("next_payment_date");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_org_idx" ON "payment_posting_activity" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_session_idx" ON "payment_posting_activity" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_payment_idx" ON "payment_posting_activity" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_claim_idx" ON "payment_posting_activity" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_activity_type_idx" ON "payment_posting_activity" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "payment_posting_activity_posted_at_idx" ON "payment_posting_activity" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "payment_reconciliation_org_idx" ON "payment_reconciliation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_reconciliation_claim_idx" ON "payment_reconciliation" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "payment_reconciliation_status_idx" ON "payment_reconciliation" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "payment_reconciliation_date_idx" ON "payment_reconciliation" USING btree ("reconciliation_date");--> statement-breakpoint
CREATE INDEX "place_of_service_org_idx" ON "place_of_service" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "place_of_service_pos_code_idx" ON "place_of_service" USING btree ("pos_code");--> statement-breakpoint
CREATE INDEX "place_of_service_active_idx" ON "place_of_service" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "portal_automation_task_org_idx" ON "portal_automation_task" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "portal_automation_task_payer_idx" ON "portal_automation_task" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "portal_automation_task_portal_credential_idx" ON "portal_automation_task" USING btree ("portal_credential_id");--> statement-breakpoint
CREATE INDEX "portal_automation_task_type_idx" ON "portal_automation_task" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "portal_automation_task_status_idx" ON "portal_automation_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_automation_task_next_run_time_idx" ON "portal_automation_task" USING btree ("next_run_time");--> statement-breakpoint
CREATE INDEX "portal_automation_task_is_scheduled_idx" ON "portal_automation_task" USING btree ("is_scheduled");--> statement-breakpoint
CREATE INDEX "prior_auth_org_idx" ON "prior_auth" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "prior_auth_patient_idx" ON "prior_auth" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "prior_auth_provider_idx" ON "prior_auth" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "prior_auth_payer_idx" ON "prior_auth" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "prior_auth_status_idx" ON "prior_auth" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prior_auth_auth_number_idx" ON "prior_auth" USING btree ("auth_number");--> statement-breakpoint
CREATE INDEX "prior_auth_expiration_idx" ON "prior_auth" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "provider_credential_org_idx" ON "provider_credential" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "provider_credential_provider_idx" ON "provider_credential" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_credential_credential_type_idx" ON "provider_credential" USING btree ("credential_type");--> statement-breakpoint
CREATE INDEX "provider_credential_credential_number_idx" ON "provider_credential" USING btree ("credential_number");--> statement-breakpoint
CREATE INDEX "provider_credential_status_idx" ON "provider_credential" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_credential_expiration_date_idx" ON "provider_credential" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "provider_credential_renewal_date_idx" ON "provider_credential" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "provider_credential_verification_status_idx" ON "provider_credential" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "provider_credential_primary_source_verified_idx" ON "provider_credential" USING btree ("primary_source_verified");--> statement-breakpoint
CREATE INDEX "provider_credential_has_disciplinary_actions_idx" ON "provider_credential" USING btree ("has_disciplinary_actions");--> statement-breakpoint
CREATE INDEX "provider_credential_issuing_organization_idx" ON "provider_credential" USING btree ("issuing_organization");--> statement-breakpoint
CREATE INDEX "provider_enrollment_org_idx" ON "provider_enrollment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "provider_enrollment_provider_idx" ON "provider_enrollment" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_enrollment_payer_idx" ON "provider_enrollment" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "provider_enrollment_status_idx" ON "provider_enrollment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_enrollment_enrollment_type_idx" ON "provider_enrollment" USING btree ("enrollment_type");--> statement-breakpoint
CREATE INDEX "provider_enrollment_enrollment_npi_idx" ON "provider_enrollment" USING btree ("enrollment_npi");--> statement-breakpoint
CREATE INDEX "provider_enrollment_application_date_idx" ON "provider_enrollment" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "provider_enrollment_effective_date_idx" ON "provider_enrollment" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "provider_enrollment_expiration_date_idx" ON "provider_enrollment" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "provider_enrollment_revalidation_due_date_idx" ON "provider_enrollment" USING btree ("revalidation_due_date");--> statement-breakpoint
CREATE INDEX "provider_enrollment_application_number_idx" ON "provider_enrollment" USING btree ("application_number");--> statement-breakpoint
CREATE INDEX "provider_privilege_org_idx" ON "provider_privilege" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "provider_privilege_provider_idx" ON "provider_privilege" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_privilege_credentialing_application_idx" ON "provider_privilege" USING btree ("credentialing_application_id");--> statement-breakpoint
CREATE INDEX "provider_privilege_privilege_name_idx" ON "provider_privilege" USING btree ("privilege_name");--> statement-breakpoint
CREATE INDEX "provider_privilege_privilege_code_idx" ON "provider_privilege" USING btree ("privilege_code");--> statement-breakpoint
CREATE INDEX "provider_privilege_status_idx" ON "provider_privilege" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_privilege_department_idx" ON "provider_privilege" USING btree ("department");--> statement-breakpoint
CREATE INDEX "provider_privilege_granted_date_idx" ON "provider_privilege" USING btree ("granted_date");--> statement-breakpoint
CREATE INDEX "provider_privilege_expiration_date_idx" ON "provider_privilege" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "provider_privilege_next_review_date_idx" ON "provider_privilege" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "provider_privilege_supervising_physician_idx" ON "provider_privilege" USING btree ("supervising_physician");--> statement-breakpoint
CREATE INDEX "provider_org_idx" ON "provider" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "provider_npi_idx" ON "provider" USING btree ("npi");--> statement-breakpoint
CREATE INDEX "provider_name_idx" ON "provider" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_org_idx" ON "quality_measure_performance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_quality_measure_idx" ON "quality_measure_performance" USING btree ("quality_measure_id");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_provider_idx" ON "quality_measure_performance" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_reporting_period_idx" ON "quality_measure_performance" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_performance_rate_idx" ON "quality_measure_performance" USING btree ("performance_rate");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_target_met_idx" ON "quality_measure_performance" USING btree ("target_met");--> statement-breakpoint
CREATE INDEX "quality_measure_performance_submission_status_idx" ON "quality_measure_performance" USING btree ("submission_status");--> statement-breakpoint
CREATE INDEX "quality_measure_org_idx" ON "quality_measure" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "quality_measure_measure_id_idx" ON "quality_measure" USING btree ("measure_id");--> statement-breakpoint
CREATE INDEX "quality_measure_measure_type_idx" ON "quality_measure" USING btree ("measure_type");--> statement-breakpoint
CREATE INDEX "quality_measure_quality_program_idx" ON "quality_measure" USING btree ("quality_program");--> statement-breakpoint
CREATE INDEX "quality_measure_reporting_year_idx" ON "quality_measure" USING btree ("reporting_year");--> statement-breakpoint
CREATE INDEX "quality_measure_is_active_idx" ON "quality_measure" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "quality_measure_submission_deadline_idx" ON "quality_measure" USING btree ("submission_deadline");--> statement-breakpoint
CREATE INDEX "radiology_report_imaging_order_idx" ON "radiology_report" USING btree ("imaging_order_id");--> statement-breakpoint
CREATE INDEX "radiology_report_report_number_idx" ON "radiology_report" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "radiology_report_status_idx" ON "radiology_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "radiology_report_reading_radiologist_idx" ON "radiology_report" USING btree ("reading_radiologist");--> statement-breakpoint
CREATE INDEX "radiology_report_attending_radiologist_idx" ON "radiology_report" USING btree ("attending_radiologist");--> statement-breakpoint
CREATE INDEX "radiology_report_has_critical_findings_idx" ON "radiology_report" USING btree ("has_critical_findings");--> statement-breakpoint
CREATE INDEX "radiology_report_critical_findings_notified_idx" ON "radiology_report" USING btree ("critical_findings_notified");--> statement-breakpoint
CREATE INDEX "radiology_report_follow_up_required_idx" ON "radiology_report" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "radiology_report_finalized_date_idx" ON "radiology_report" USING btree ("finalized_date");--> statement-breakpoint
CREATE INDEX "radiology_report_is_teaching_case_idx" ON "radiology_report" USING btree ("is_teaching_case");--> statement-breakpoint
CREATE INDEX "referral_org_idx" ON "referral" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "referral_patient_idx" ON "referral" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "referral_referring_provider_idx" ON "referral" USING btree ("referring_provider_id");--> statement-breakpoint
CREATE INDEX "referral_status_idx" ON "referral" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_referral_date_idx" ON "referral" USING btree ("referral_date");--> statement-breakpoint
CREATE INDEX "referral_expiration_idx" ON "referral" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "remittance_advice_org_idx" ON "remittance_advice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "remittance_advice_payer_idx" ON "remittance_advice" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "remittance_advice_era_number_idx" ON "remittance_advice" USING btree ("era_number");--> statement-breakpoint
CREATE INDEX "remittance_advice_status_idx" ON "remittance_advice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "remittance_advice_payment_date_idx" ON "remittance_advice" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "resource_schedule_org_idx" ON "resource_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "resource_schedule_resource_type_idx" ON "resource_schedule" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "resource_schedule_identifier_idx" ON "resource_schedule" USING btree ("resource_identifier");--> statement-breakpoint
CREATE INDEX "resource_schedule_date_idx" ON "resource_schedule" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "resource_schedule_status_idx" ON "resource_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resource_schedule_assigned_to_idx" ON "resource_schedule" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "resource_schedule_assigned_patient_idx" ON "resource_schedule" USING btree ("assigned_patient_id");--> statement-breakpoint
CREATE INDEX "resource_schedule_department_idx" ON "resource_schedule" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "resource_schedule_usage_purpose_idx" ON "resource_schedule" USING btree ("usage_purpose");--> statement-breakpoint
CREATE INDEX "resource_schedule_recurring_idx" ON "resource_schedule" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "revenue_cycle_metrics_org_idx" ON "revenue_cycle_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "revenue_cycle_metrics_reporting_period_idx" ON "revenue_cycle_metrics" USING btree ("reporting_period");--> statement-breakpoint
CREATE INDEX "revenue_cycle_metrics_period_type_idx" ON "revenue_cycle_metrics" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "revenue_cycle_metrics_calculated_at_idx" ON "revenue_cycle_metrics" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "scrubbing_result_org_idx" ON "scrubbing_result" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "scrubbing_result_batch_job_idx" ON "scrubbing_result" USING btree ("batch_job_id");--> statement-breakpoint
CREATE INDEX "scrubbing_result_session_idx" ON "scrubbing_result" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "scrubbing_result_entity_idx" ON "scrubbing_result" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "scrubbing_result_status_idx" ON "scrubbing_result" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scrubbing_result_scrub_type_idx" ON "scrubbing_result" USING btree ("scrub_type");--> statement-breakpoint
CREATE INDEX "scrubbing_result_severity_idx" ON "scrubbing_result" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "scrubbing_result_manual_review_idx" ON "scrubbing_result" USING btree ("manual_review_required");--> statement-breakpoint
CREATE INDEX "scrubbing_result_created_at_idx" ON "scrubbing_result" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shift_change_request_org_idx" ON "shift_change_request" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "shift_change_request_requesting_staff_idx" ON "shift_change_request" USING btree ("requesting_staff_id");--> statement-breakpoint
CREATE INDEX "shift_change_request_original_schedule_idx" ON "shift_change_request" USING btree ("original_schedule_id");--> statement-breakpoint
CREATE INDEX "shift_change_request_change_type_idx" ON "shift_change_request" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "shift_change_request_status_idx" ON "shift_change_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shift_change_request_target_staff_idx" ON "shift_change_request" USING btree ("target_staff_id");--> statement-breakpoint
CREATE INDEX "shift_change_request_requested_at_idx" ON "shift_change_request" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "shift_change_request_urgent_idx" ON "shift_change_request" USING btree ("urgent_request");--> statement-breakpoint
CREATE INDEX "staff_schedule_org_idx" ON "staff_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "staff_schedule_staff_member_idx" ON "staff_schedule" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "staff_schedule_date_idx" ON "staff_schedule" USING btree ("schedule_date");--> statement-breakpoint
CREATE INDEX "staff_schedule_status_idx" ON "staff_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_schedule_shift_type_idx" ON "staff_schedule" USING btree ("shift_type");--> statement-breakpoint
CREATE INDEX "staff_schedule_department_idx" ON "staff_schedule" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "staff_schedule_covering_for_idx" ON "staff_schedule" USING btree ("covering_for_id");--> statement-breakpoint
CREATE INDEX "staff_schedule_clock_in_idx" ON "staff_schedule" USING btree ("clock_in_time");--> statement-breakpoint
CREATE INDEX "staff_schedule_recurring_idx" ON "staff_schedule" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "staff_time_off_org_idx" ON "staff_time_off" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "staff_time_off_staff_member_idx" ON "staff_time_off" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "staff_time_off_request_type_idx" ON "staff_time_off" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "staff_time_off_status_idx" ON "staff_time_off" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_time_off_start_date_idx" ON "staff_time_off" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "staff_time_off_emergency_idx" ON "staff_time_off" USING btree ("emergency_request");--> statement-breakpoint
CREATE INDEX "staff_time_off_covering_staff_idx" ON "staff_time_off" USING btree ("covering_staff_id");--> statement-breakpoint
CREATE INDEX "staff_time_off_requested_at_idx" ON "staff_time_off" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "suggested_fix_org_idx" ON "suggested_fix" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "suggested_fix_entity_idx" ON "suggested_fix" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "suggested_fix_status_idx" ON "suggested_fix" USING btree ("status");--> statement-breakpoint
CREATE INDEX "suggested_fix_severity_idx" ON "suggested_fix" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "suggested_fix_field_name_idx" ON "suggested_fix" USING btree ("field_name");--> statement-breakpoint
CREATE INDEX "suggested_fix_source_idx" ON "suggested_fix" USING btree ("source");--> statement-breakpoint
CREATE INDEX "suggested_fix_confidence_idx" ON "suggested_fix" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "suggested_fix_created_at_idx" ON "suggested_fix" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_job_org_idx" ON "sync_job" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sync_job_ehr_system_idx" ON "sync_job" USING btree ("ehr_system_id");--> statement-breakpoint
CREATE INDEX "sync_job_type_idx" ON "sync_job" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "sync_job_entity_type_idx" ON "sync_job" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "sync_job_status_idx" ON "sync_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_job_active_idx" ON "sync_job" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sync_job_next_sync_at_idx" ON "sync_job" USING btree ("next_sync_at");--> statement-breakpoint
CREATE INDEX "system_settings_org_idx" ON "system_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "system_settings_key_idx" ON "system_settings" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "system_settings_scope_idx" ON "system_settings" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "system_settings_user_idx" ON "system_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_settings_unique_org_key" ON "system_settings" USING btree ("organization_id","setting_key","user_id");--> statement-breakpoint
CREATE INDEX "team_member_org_user_idx" ON "team_member" USING btree ("organization_id","clerk_user_id");--> statement-breakpoint
CREATE INDEX "team_member_clerk_user_idx" ON "team_member" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "trading_partner_org_idx" ON "trading_partner" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trading_partner_name_idx" ON "trading_partner" USING btree ("partner_name");--> statement-breakpoint
CREATE INDEX "trading_partner_type_idx" ON "trading_partner" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "trading_partner_edi_id_idx" ON "trading_partner" USING btree ("edi_id");--> statement-breakpoint
CREATE INDEX "trading_partner_status_idx" ON "trading_partner" USING btree ("partnership_status");--> statement-breakpoint
CREATE INDEX "trading_partner_isa_sender_id_idx" ON "trading_partner" USING btree ("isa_sender_id");--> statement-breakpoint
CREATE INDEX "trading_partner_isa_receiver_id_idx" ON "trading_partner" USING btree ("isa_receiver_id");--> statement-breakpoint
CREATE INDEX "webhook_config_org_idx" ON "webhook_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhook_config_active_idx" ON "webhook_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhook_config_url_idx" ON "webhook_config" USING btree ("url");--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhook_config_idx" ON "webhook_delivery" USING btree ("webhook_config_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_status_idx" ON "webhook_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_type_idx" ON "webhook_delivery" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_delivery_next_retry_idx" ON "webhook_delivery" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_created_at_idx" ON "webhook_delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "work_queue_org_idx" ON "work_queue" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "work_queue_assignee_idx" ON "work_queue" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "work_queue_status_idx" ON "work_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_queue_priority_idx" ON "work_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "work_queue_entity_idx" ON "work_queue" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "work_queue_due_date_idx" ON "work_queue" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "workflow_execution_org_idx" ON "workflow_execution" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_workflow_idx" ON "workflow_execution" USING btree ("workflow_name");--> statement-breakpoint
CREATE INDEX "workflow_execution_status_idx" ON "workflow_execution" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_execution_entity_idx" ON "workflow_execution" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_started_at_idx" ON "workflow_execution" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "write_off_org_idx" ON "write_off" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "write_off_claim_idx" ON "write_off" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "write_off_patient_idx" ON "write_off" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "write_off_type_idx" ON "write_off" USING btree ("write_off_type");--> statement-breakpoint
CREATE INDEX "write_off_category_idx" ON "write_off" USING btree ("category");--> statement-breakpoint
CREATE INDEX "write_off_posted_date_idx" ON "write_off" USING btree ("posted_date");--> statement-breakpoint
CREATE INDEX "write_off_approved_by_idx" ON "write_off" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "write_off_is_reversed_idx" ON "write_off" USING btree ("is_reversed");