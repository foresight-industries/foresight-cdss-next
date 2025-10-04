SET
statement_timeout = 0;
SET
lock_timeout = 0;
SET
idle_in_transaction_session_timeout = 0;
SET
client_encoding = 'UTF8';
SET
standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET
check_function_bodies = false;
SET
xmloption = content;
SET
client_min_messages = warning;
SET
row_security = off;


CREATE
EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE
EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "pgsodium";






COMMENT
ON SCHEMA "public" IS 'standard public schema';



CREATE
EXTENSION IF NOT EXISTS "pg_repack" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "btree_gin" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "insert_username" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE
EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE
EXTENSION IF NOT EXISTS "pgaudit" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";






CREATE
EXTENSION IF NOT EXISTS "pgtap" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE
EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE
EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE
EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";



CREATE TYPE "public"."adjustment_type" AS ENUM (
    'contractual',
    'write_off',
    'refund',
    'correction',
    'transfer',
    'reversal'
);


ALTER TYPE "public"."adjustment_type" OWNER TO "postgres";


CREATE TYPE "public"."appeal_status" AS ENUM (
    'preparing',
    'ready',
    'submitted',
    'in_review',
    'under_review',
    'approved',
    'partially_approved',
    'denied',
    'withdrawn',
    'closed'
);


ALTER TYPE "public"."appeal_status" OWNER TO "postgres";


CREATE TYPE "public"."appointment_status" AS ENUM (
    'scheduled',
    'confirmed',
    'reminder_sent',
    'arrived',
    'roomed',
    'with_provider',
    'completed',
    'no_show',
    'cancelled',
    'rescheduled'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."automation_status" AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'retrying',
    'cancelled'
);


ALTER TYPE "public"."automation_status" OWNER TO "postgres";


CREATE TYPE "public"."batch_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'acknowledged',
    'rejected'
);


ALTER TYPE "public"."batch_status" OWNER TO "postgres";


CREATE TYPE "public"."claim_status" AS ENUM (
    'draft',
    'built',
    'ready_to_submit',
    'submitted',
    'accepted_277ca',
    'rejected_277ca',
    'awaiting_277ca',
    'in_review',
    'approved',
    'denied',
    'partially_paid',
    'paid',
    'appealing',
    'closed',
    'void'
);


ALTER TYPE "public"."claim_status" OWNER TO "postgres";


COMMENT
ON TYPE "public"."claim_status" IS 'Standardized claim lifecycle statuses';



CREATE TYPE "public"."communication_type" AS ENUM (
    'phone_inbound',
    'phone_outbound',
    'fax_inbound',
    'fax_outbound',
    'email',
    'portal_message',
    'sms',
    'mail'
);


ALTER TYPE "public"."communication_type" OWNER TO "postgres";


CREATE TYPE "public"."denial_status" AS ENUM (
    'new',
    'under_review',
    'assigned',
    'appealing',
    'appealed',
    'resolved',
    'closed',
    'written_off'
);


ALTER TYPE "public"."denial_status" OWNER TO "postgres";


CREATE TYPE "public"."document_status" AS ENUM (
    'uploaded',
    'processing',
    'verified',
    'rejected',
    'archived',
    'deleted'
);


ALTER TYPE "public"."document_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'insurance_card',
    'drivers_license',
    'medical_record',
    'lab_result',
    'imaging',
    'referral',
    'prior_auth_form',
    'appeal_letter',
    'eob',
    'consent_form',
    'financial_agreement',
    'other'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."eligibility_check_type" AS ENUM (
    'standard',
    'real_time',
    'batch',
    'pre_visit',
    'pre_service'
);


ALTER TYPE "public"."eligibility_check_type" OWNER TO "postgres";


CREATE TYPE "public"."era_status" AS ENUM (
    'pending',
    'processing',
    'posted',
    'failed',
    'partial'
);


ALTER TYPE "public"."era_status" OWNER TO "postgres";


CREATE TYPE "public"."followup_reason" AS ENUM (
    'no_response',
    'underpayment',
    'denial',
    'request_records'
);


ALTER TYPE "public"."followup_reason" OWNER TO "postgres";


CREATE TYPE "public"."gender" AS ENUM (
    'male',
    'female',
    'other',
    'unknown',
    'prefer_not_to_say'
);


ALTER TYPE "public"."gender" OWNER TO "postgres";


CREATE TYPE "public"."insurance_policy_type" AS ENUM (
    'Primary',
    'Secondary'
);


ALTER TYPE "public"."insurance_policy_type" OWNER TO "postgres";


CREATE TYPE "public"."payer_config_type" AS ENUM (
    'submission',
    'eligibility',
    'pa_submission',
    'portal',
    'general'
);


ALTER TYPE "public"."payer_config_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_posting_status" AS ENUM (
    'pending',
    'auto_posted',
    'manual_review',
    'posted',
    'suspended',
    'rejected'
);


ALTER TYPE "public"."payment_posting_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'processing',
    'processed',
    'failed',
    'refunded',
    'partially_refunded',
    'voided'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."prior_auth_status" AS ENUM (
    'draft',
    'pending_info',
    'ready_to_submit',
    'submitted',
    'in_review',
    'peer_to_peer_required',
    'approved',
    'partially_approved',
    'denied',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."prior_auth_status" OWNER TO "postgres";


COMMENT
ON TYPE "public"."prior_auth_status" IS 'Standardized prior authorization statuses';



CREATE TYPE "public"."retry_backoff_strategy" AS ENUM (
    'exponential',
    'linear',
    'fixed'
);


ALTER TYPE "public"."retry_backoff_strategy" OWNER TO "postgres";


CREATE TYPE "public"."scrubbing_severity" AS ENUM (
    'error',
    'warning',
    'info'
);


ALTER TYPE "public"."scrubbing_severity" OWNER TO "postgres";


CREATE TYPE "public"."team_status" AS ENUM (
    'trial',
    'active',
    'suspended',
    'cancelled',
    'pending_deletion'
);


ALTER TYPE "public"."team_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'org_admin',
    'biller',
    'coder',
    'provider',
    'nurse',
    'front_desk',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."validation_status" AS ENUM (
    'pass',
    'warning',
    'error',
    'pending'
);


ALTER TYPE "public"."validation_status" OWNER TO "postgres";


CREATE TYPE "public"."visit_type" AS ENUM (
    'office_visit',
    'telehealth',
    'hospital_inpatient',
    'hospital_outpatient',
    'emergency',
    'urgent_care',
    'home_health',
    'skilled_nursing',
    'phone',
    'other'
);


ALTER TYPE "public"."visit_type" OWNER TO "postgres";


CREATE TYPE "public"."work_queue_status" AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'on_hold',
    'escalated',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."work_queue_status" OWNER TO "postgres";


CREATE TYPE "public"."x12_transaction_type" AS ENUM (
    '270',
    '271',
    '276',
    '277',
    '278',
    '820',
    '834',
    '835',
    '837P',
    '837I',
    '837D'
);


ALTER TYPE "public"."x12_transaction_type" OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."accept_team_invitation"("invitation_token" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
invitation_record team_invitation%ROWTYPE;
    user_email
TEXT;
BEGIN
    -- Get current user email
SELECT email
INTO user_email
FROM auth.users
WHERE id = auth.uid();

-- Find valid invitation
SELECT *
INTO invitation_record
FROM team_invitation
WHERE token = invitation_token
  AND email = user_email
  AND expires_at > NOW()
  AND accepted_at IS NULL;

IF
NOT FOUND THEN
      RETURN FALSE;
END IF;

    -- Create team membership
INSERT INTO team_member (team_id, user_id, role, status, invited_by, invited_at, joined_at)
VALUES (invitation_record.team_id,
        auth.uid(),
        invitation_record.role,
        'active',
        invitation_record.invited_by,
        invitation_record.created_at,
        NOW());

-- Mark invitation as accepted
UPDATE team_invitation
SET accepted_at = NOW()
WHERE id = invitation_record.id;

-- Update user's current team if they don't have one
UPDATE user_profile
SET current_team_id = invitation_record.team_id
WHERE id = auth.uid()
  AND current_team_id IS NULL;

RETURN TRUE;
END;
  $$;


ALTER FUNCTION "public"."accept_team_invitation"("invitation_token" "text") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."audit_credit_refunds"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF
TG_OP = 'UPDATE' AND OLD.status != 'refunded' AND NEW.status = 'refunded' THEN
        INSERT INTO audit_log (
            team_id,
            team_member_id,
            action,
            entity_type,
            entity_id,
            new_values
        ) VALUES (
            NEW.team_id,
            auth.uid(),
            'credit_balance_refunded',
            'credit_balance',
            NEW.id::VARCHAR,
            jsonb_build_object(
                'amount', NEW.amount,
                'refund_method', NEW.refund_method,
                'refund_date', NEW.refund_date
            )
        );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_credit_refunds"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."audit_formulary_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF
TG_OP = 'UPDATE' AND OLD.requires_prior_auth != NEW.requires_prior_auth THEN
        INSERT INTO audit_log (
            team_id,
            team_member_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            public.get_auth_team_id(),
            auth.uid(),
            'formulary_pa_requirement_change',
            'drug_formulary',
            NEW.id::VARCHAR,
            jsonb_build_object('requires_prior_auth', OLD.requires_prior_auth),
            jsonb_build_object('requires_prior_auth', NEW.requires_prior_auth)
        );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_formulary_changes"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."audit_payment_plan_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF
TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO audit_log (
            team_id,
            team_member_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            NEW.team_id,
            auth.uid(),
            'payment_plan_status_change',
            'payment_plan',
            NEW.id::VARCHAR,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status)
        );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_payment_plan_changes"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."audit_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
INSERT INTO audit_log (team_id,
                       action,
                       entity_type,
                       entity_id,
                       team_member_id,
                       old_values,
                       new_values,
                       metadata)
VALUES (COALESCE(NEW.team_id, OLD.team_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        current_setting('app.current_user_id', true)::uuid,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        jsonb_build_object('timestamp', NOW(), 'operation', TG_OP));

RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_sensitive_changes"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."audit_trigger_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
record_data JSONB;
  record_id
TEXT;
  team_id_value
UUID;
BEGIN
  -- Get the record data
  IF
TG_OP = 'DELETE' THEN
    record_data := to_jsonb(OLD);
ELSE
    record_data := to_jsonb(NEW);
END IF;

  -- Extract ID (handle different ID field names)
  record_id
:= COALESCE(
    record_data->>'id',
    record_data->>'claim_id',
    (record_data->>'patient_id')::TEXT
  );

  -- Extract team_id if it exists (handle UUID type)
  IF
record_data ? 'team_id' AND record_data->>'team_id' IS NOT NULL THEN
    team_id_value := (record_data->>'team_id')::UUID;
END IF;

  -- Insert audit record
INSERT INTO audit_log (table_name,
                       operation,
                       team_id,
                       record_id,
                       old_data,
                       new_data)
VALUES (TG_TABLE_NAME,
        TG_OP,
        team_id_value,
        record_id,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END);

IF
TG_OP = 'DELETE' THEN
    RETURN OLD;
ELSE
    RETURN NEW;
END IF;
END;
$$;


ALTER FUNCTION "public"."audit_trigger_function"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."auto_post_era_payment"("p_remittance_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_result JSONB;
    v_posted_count
INTEGER := 0;
    v_review_count
INTEGER := 0;
BEGIN
WITH posted AS (
UPDATE payment_detail pd
SET status = 'posted'
WHERE pd.remittance_advice_id = p_remittance_id
  AND pd.status = 'pending'
  AND ABS(COALESCE(pd.paid_amount, 0) - COALESCE(pd.allowed_amount, 0)) < 0.01 RETURNING pd.id
    )
SELECT COUNT(*)
INTO v_posted_count
FROM posted;

WITH flagged AS (
UPDATE payment_detail pd
SET status = 'manual_review'
WHERE pd.remittance_advice_id = p_remittance_id
  AND pd.status = 'pending'
  AND ABS(COALESCE(pd.paid_amount, 0) - COALESCE(pd.allowed_amount, 0)) >= 0.01 RETURNING pd.id
    )
SELECT COUNT(*)
INTO v_review_count
FROM flagged;

v_result
:= jsonb_build_object(
        'auto_posted', v_posted_count,
        'manual_review', v_review_count,
        'processed_at', NOW()
    );

RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."auto_post_era_payment"("p_remittance_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."calculate_contractual_adjustment"("p_claim_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
billed DECIMAL;
  allowed
DECIMAL;
BEGIN
SELECT c.total_amount, fs.allowed_amount
INTO billed, allowed
FROM claim c
       JOIN fee_schedule fs ON fs.cpt_code = (SELECT cpt_code
                                              FROM claim_line
                                              WHERE claim_id = c.id LIMIT 1
  )
WHERE c.id = p_claim_id;

RETURN billed - allowed;
END;
$$;


ALTER FUNCTION "public"."calculate_contractual_adjustment"("p_claim_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."calculate_days_in_ar"("claim_id" character varying) RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
days_ar INTEGER;
BEGIN
SELECT CASE
         WHEN c.paid_at IS NOT NULL THEN
           DATE_PART('day', c.paid_at - c.submitted_at)
         ELSE
           DATE_PART('day', NOW() - c.submitted_at)
         END
INTO days_ar
FROM claim c
WHERE c.id = claim_id;

RETURN COALESCE(days_ar, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_days_in_ar"("claim_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."calculate_next_retry"("p_attempt_number" integer, "p_strategy" character varying DEFAULT 'exponential'::character varying) RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_minutes INTEGER;
BEGIN
    IF
p_strategy = 'exponential' THEN
        v_minutes := LEAST(POWER(2, p_attempt_number) * 5, 1440);
    ELSIF
p_strategy = 'linear' THEN
        v_minutes := p_attempt_number * 15;
ELSE
        v_minutes := 30;
END IF;

RETURN NOW() + (v_minutes || ' minutes')::INTERVAL;
END;
$$;


ALTER FUNCTION "public"."calculate_next_retry"("p_attempt_number" integer, "p_strategy" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."calculate_patient_balance"("p_patient_id" integer) RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
v_balance DECIMAL;
BEGIN
SELECT COALESCE(SUM(
                  CASE
                    WHEN pd.patient_responsibility IS NOT NULL THEN pd.patient_responsibility
                    ELSE 0
                    END
                ), 0) -
       COALESCE((SELECT SUM(amount)
                 FROM patient_payment
                 WHERE patient_id = p_patient_id
                   AND status = 'processed'), 0)
INTO v_balance
FROM payment_detail pd
       JOIN claim c ON pd.claim_id = c.id
WHERE pd.patient_id = p_patient_id;

RETURN v_balance;
END;
$$;


ALTER FUNCTION "public"."calculate_patient_balance"("p_patient_id" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."calculate_variance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.variance_amount
= NEW.expected_amount - NEW.paid_amount;

  -- Auto-set action based on variance
  IF
NEW.variance_amount > 0 THEN
    IF NEW.variance_amount > 1000 THEN
      NEW.action_required = 'appeal';
    ELSIF
NEW.variance_amount > 100 THEN
      NEW.action_required = 'review';
ELSE
      NEW.action_required = 'write_off';
END IF;
END IF;

RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_variance"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."can_provider_bill_payer"("p_clinician_id" integer, "p_payer_id" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_can_bill BOOLEAN;
BEGIN
SELECT can_bill
INTO v_can_bill
FROM provider_enrollment
WHERE clinician_id = p_clinician_id
  AND payer_id = p_payer_id
  AND enrollment_status = 'approved'
  AND can_bill = TRUE
  AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
  AND (termination_date IS NULL OR termination_date >= CURRENT_DATE) LIMIT 1;

RETURN COALESCE(v_can_bill, FALSE);
END;
$$;


ALTER FUNCTION "public"."can_provider_bill_payer"("p_clinician_id" integer, "p_payer_id" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_appointment_eligibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- When appointment status changes to 'arrived', trigger eligibility check
    IF
NEW.status = 'arrived' AND OLD.status != 'arrived' THEN
        INSERT INTO eligibility_check (
            team_id,
            patient_id,
            insurance_policy_id,
            check_type,
            status
        )
SELECT NEW.team_id,
       NEW.patient_id,
       ip.id,
       'real_time',
       'pending'
FROM insurance_policy ip
WHERE ip.patient_id = NEW.patient_id
  AND ip.effective_date <= CURRENT_DATE
  AND (ip.termination_date IS NULL OR ip.termination_date >= CURRENT_DATE) LIMIT 1;
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_appointment_eligibility"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_drug_requires_pa"("p_payer_id" integer, "p_ndc_code" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_requires_pa BOOLEAN;
BEGIN
SELECT requires_prior_auth
INTO v_requires_pa
FROM drug_formulary
WHERE payer_id = p_payer_id
  AND ndc_code = p_ndc_code
  AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
  AND (termination_date IS NULL OR termination_date >= CURRENT_DATE) LIMIT 1;

RETURN COALESCE(v_requires_pa, FALSE);
END;
$$;


ALTER FUNCTION "public"."check_drug_requires_pa"("p_payer_id" integer, "p_ndc_code" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_era_not_duplicate"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF
EXISTS (
    SELECT 1 FROM payment_posting_session
    WHERE era_file_name = NEW.era_file_name
    AND team_id = NEW.team_id
    AND completed_at IS NOT NULL  -- Successfully completed
  ) THEN
    RAISE EXCEPTION 'ERA file % has already been processed', NEW.era_file_name;
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_era_not_duplicate"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_pa_required"("p_payer_id" integer, "p_cpt_code" character varying, "p_icd10_codes" character varying[], "p_service_date" "date") RETURNS TABLE("requires_pa" boolean, "rule_id" "uuid", "rule_details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY
SELECT pr.requires_pa,
       pr.id,
       jsonb_build_object(
         'auto_submit', pr.auto_submit,
         'lookback_days', pr.lookback_days,
         'priority', pr.priority
       )
FROM pa_requirement_rule pr
WHERE pr.payer_id = p_payer_id
  AND pr.cpt_code = p_cpt_code
  AND (pr.icd10_code IS NULL OR pr.icd10_code = ANY (p_icd10_codes))
  AND pr.is_active = true
  AND (pr.effective_date IS NULL OR pr.effective_date <= p_service_date)
  AND (pr.termination_date IS NULL OR pr.termination_date > p_service_date)
ORDER BY pr.priority DESC LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."check_pa_required"("p_payer_id" integer, "p_cpt_code" character varying, "p_icd10_codes" character varying [], "p_service_date" "date") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_prior_auth_requirement"("p_patient_id" integer, "p_ndc_code" character varying) RETURNS TABLE("requires_pa" boolean, "tier" integer, "criteria" "jsonb", "alternatives" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
v_payer_id INTEGER;
BEGIN
    -- Get patient's primary insurance payer
SELECT ip.payer_id
INTO v_payer_id
FROM insurance_policy ip
       JOIN patient p ON ip.patient_id = p.id
WHERE p.id = p_patient_id
  AND p.team_id = public.get_auth_team_id()
  AND ip.effective_date <= CURRENT_DATE
  AND (ip.termination_date IS NULL OR ip.termination_date >= CURRENT_DATE)
ORDER BY ip.created_at DESC LIMIT 1;

IF
v_payer_id IS NULL THEN
        RAISE EXCEPTION 'No active insurance found for patient';
END IF;

RETURN QUERY
SELECT df.requires_prior_auth,
       df.tier,
       df.pa_criteria,
       df.preferred_alternatives
FROM drug_formulary df
WHERE df.payer_id = v_payer_id
  AND df.ndc_code = p_ndc_code
  AND (df.effective_date IS NULL OR df.effective_date <= CURRENT_DATE)
  AND (df.termination_date IS NULL OR df.termination_date >= CURRENT_DATE) LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."check_prior_auth_requirement"("p_patient_id" integer, "p_ndc_code" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."check_timely_filing"("p_claim_id" character varying) RETURNS TABLE("within_filing" boolean, "days_remaining" integer, "filing_deadline" "date")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_dos DATE;
    v_payer_id
INTEGER;
    v_filing_days
INTEGER;
    v_deadline
DATE;
BEGIN
SELECT e.dos, c.payer_id
INTO v_dos, v_payer_id
FROM claim c
       JOIN encounter e ON c.encounter_id = e.id
WHERE c.id = p_claim_id;

SELECT COALESCE(pc.timely_filing_days, 365)
INTO v_filing_days
FROM payer_config pc
WHERE pc.payer_id = v_payer_id
  AND pc.config_type = 'submission' LIMIT 1;

v_deadline
:= v_dos + v_filing_days;

RETURN QUERY SELECT
        CURRENT_DATE <= v_deadline,
        EXTRACT(DAY FROM v_deadline - CURRENT_DATE)::INTEGER,
        v_deadline;
END;
$$;


ALTER FUNCTION "public"."check_timely_filing"("p_claim_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."cleanup_expired_alerts"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
expired_count INTEGER;
BEGIN
UPDATE public.alerts
SET status     = 'expired',
    updated_at = NOW()
WHERE expires_at IS NOT NULL
  AND expires_at <= NOW()
  AND status = 'active';

GET DIAGNOSTICS expired_count = ROW_COUNT;
RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_alerts"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
v_deleted INTEGER;
BEGIN
DELETE
FROM eligibility_cache
WHERE expires_at < NOW();

GET DIAGNOSTICS v_deleted = ROW_COUNT;
RETURN v_deleted;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."create_claim_lines"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
INSERT INTO claim_line (team_id,
                        claim_id,
                        line_number,
                        service_date,
                        cpt_code,
                        modifiers,
                        units,
                        charge_amount,
                        place_of_service,
                        status)
SELECT NEW.team_id,
       NEW.id,
       1,
       e.dos,
       e.cpt,
       e.modifiers,
       e.units,
       NEW.total_amount,
       e.pos,
       'pending'
FROM encounter e
WHERE e.id = NEW.encounter_id;

RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_claim_lines"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."create_denial_work_queue"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF
NEW.status = 'denied' AND (OLD.status IS NULL OR OLD.status != 'denied') THEN
        INSERT INTO work_queue (
            team_id,
            queue_type,
            priority,
            status,
            entity_type,
            entity_id,
            title,
            description,
            due_date,
            sla_deadline
        ) VALUES (
            NEW.team_id,
            'denial_review',
            CASE
                WHEN NEW.total_amount > 1000 THEN 90
                WHEN NEW.total_amount > 500 THEN 70
                ELSE 50
            END,
            'pending',
            'claim',
            NEW.id,
            'Review Denied Claim: ' || COALESCE(NEW.claim_number, NEW.id),
            'Claim denied - requires review and potential appeal',
            NOW() + INTERVAL '3 days',
            NOW() + INTERVAL '5 days'
        );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_denial_work_queue"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."create_team_with_owner"("team_name" "text", "team_slug" "text", "owner_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
new_team_id UUID;
BEGIN
    -- Insert the team
INSERT INTO team (name, slug)
VALUES (team_name, team_slug) RETURNING id
INTO new_team_id;

-- Add the creator as owner
INSERT INTO team_member (team_id, user_id, role, status, joined_at)
VALUES (new_team_id, owner_id, 'owner', 'active', NOW());

-- Update user's current team
UPDATE user_profile
SET current_team_id = new_team_id
WHERE id = owner_id;

RETURN new_team_id;
END;
  $$;


ALTER FUNCTION "public"."create_team_with_owner"("team_name" "text", "team_slug" "text", "owner_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."end_stale_sessions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
UPDATE user_session
SET ended_at = NOW()
WHERE ended_at IS NULL
  AND last_activity_at < NOW() - (timeout_after_minutes || ' minutes')::INTERVAL;
END;
$$;


ALTER FUNCTION "public"."end_stale_sessions"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."flag_claims_for_followup"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Use Supabase Queue instead of inserting into table
  PERFORM
net.http_post(
    url := 'https://yourproject.supabase.co/functions/v1/queue-followup',
    body := jsonb_build_object(
      'claim_ids', array_agg(id)
    )
  )
  FROM claim
  WHERE status = 'submitted'
  AND submitted_at < NOW() - INTERVAL '14 days';
END;
$$;


ALTER FUNCTION "public"."flag_claims_for_followup"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_ar_aging_summary"("p_team_id" "uuid", "p_as_of_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("bucket" character varying, "claim_count" bigint, "total_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY
SELECT CASE
         WHEN age_days <= 30 THEN '0-30'
         WHEN age_days <= 60 THEN '31-60'
         WHEN age_days <= 90 THEN '61-90'
         WHEN age_days <= 120 THEN '91-120'
         ELSE '120+'
         END as bucket,
       COUNT(*)::BIGINT as claim_count, SUM(c.total_amount - COALESCE(c.paid_amount, 0)) as total_amount
FROM claim c
       JOIN encounter e ON c.encounter_id = e.id
       CROSS JOIN LATERAL (
  SELECT EXTRACT(DAY FROM p_as_of_date - e.dos) ::INTEGER as age_days
    ) ages
WHERE c.team_id = p_team_id
  AND c.status NOT IN ('paid', 'void', 'denied')
GROUP BY bucket
ORDER BY bucket;
END;
$$;


ALTER FUNCTION "public"."get_ar_aging_summary"("p_team_id" "uuid", "p_as_of_date" "date") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_auth_team_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
RETURN COALESCE(
  auth.jwt() ->>'team_id',
        (SELECT team_id FROM public.team_member WHERE user_id = auth.uid() LIMIT 1)
    )::UUID;
END;
$$;


ALTER FUNCTION "public"."get_auth_team_id"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_auth_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
RETURN COALESCE(
  auth.jwt() ->>'role',
        (SELECT role FROM public.team_member
         WHERE user_id = auth.uid()
         AND team_id = public.get_auth_team_id()
         LIMIT 1)
    );
END;
$$;


ALTER FUNCTION "public"."get_auth_user_role"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_available_appointment_slots"("p_provider_id" integer, "p_date" "date", "p_location_id" character varying DEFAULT NULL::character varying) RETURNS TABLE("slot_time" time without time zone, "duration_minutes" integer, "location_id" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Verify provider belongs to user's team
    IF
NOT EXISTS (
        SELECT 1 FROM clinician
        WHERE id = p_provider_id
        AND team_id = public.get_auth_team_id()
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to provider schedule';
END IF;

RETURN QUERY WITH schedule_slots AS (
        SELECT
            ps.start_time + (interval '1 minute' * generate_series(0,
                EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))::INTEGER / 60 / ps.slot_duration_minutes - 1
            ) * ps.slot_duration_minutes) as slot_time,
            ps.slot_duration_minutes,
            ps.service_location_id
        FROM provider_schedule ps
        WHERE ps.provider_id = p_provider_id
        AND ps.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
        AND ps.team_id = public.get_auth_team_id()
        AND (ps.effective_date IS NULL OR ps.effective_date <= p_date)
        AND (ps.termination_date IS NULL OR ps.termination_date >= p_date)
        AND (p_location_id IS NULL OR ps.service_location_id = p_location_id)
    ),
    booked_slots AS (
        SELECT scheduled_time
        FROM appointment
        WHERE provider_id = p_provider_id
        AND scheduled_date = p_date
        AND status NOT IN ('cancelled', 'no_show')
        AND team_id = public.get_auth_team_id()
    )
SELECT ss.slot_time,
       ss.slot_duration_minutes,
       ss.service_location_id
FROM schedule_slots ss
WHERE NOT EXISTS (SELECT 1
                  FROM booked_slots bs
                  WHERE bs.scheduled_time = ss.slot_time)
ORDER BY ss.slot_time;
END;
$$;


ALTER FUNCTION "public"."get_available_appointment_slots"("p_provider_id" integer, "p_date" "date", "p_location_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_claim_age_days"("p_claim_id" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_dos DATE;
    v_age
INTEGER;
BEGIN
SELECT e.dos
INTO v_dos
FROM claim c
       JOIN encounter e ON c.encounter_id = e.id
WHERE c.id = p_claim_id;

v_age
:= EXTRACT(DAY FROM NOW() - v_dos);
RETURN v_age;
END;
$$;


ALTER FUNCTION "public"."get_claim_age_days"("p_claim_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_claim_readiness_score"("p_claim_id" character varying) RETURNS TABLE("readiness_score" integer, "blocking_issues" "text"[], "warnings" "text"[])
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_score INTEGER := 100;
    v_blocking
TEXT[] := ARRAY[]::TEXT[];
    v_warnings
TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check validation
    IF
EXISTS (
        SELECT 1 FROM claim_validation
        WHERE claim_id = p_claim_id
        AND overall_status = 'error'
        ORDER BY validation_run_at DESC LIMIT 1
    ) THEN
        v_score := v_score - 50;
        v_blocking
:= array_append(v_blocking, 'Validation errors present');
END IF;

    -- Check timely filing
    IF
NOT (SELECT within_filing FROM check_timely_filing(p_claim_id)) THEN
        v_score := v_score - 100;
        v_blocking
:= array_append(v_blocking, 'Outside timely filing window');
END IF;

    -- Check scrubbing results
    IF
EXISTS (
        SELECT 1 FROM scrubbing_result
        WHERE entity_id = p_claim_id
        AND entity_type = 'claim'
        AND severity = 'error'
        AND fixed = false
    ) THEN
        v_score := v_score - 30;
        v_warnings
:= array_append(v_warnings, 'Unresolved scrubbing errors');
END IF;

RETURN QUERY SELECT
        GREATEST(v_score, 0),
        v_blocking,
        v_warnings;
END;
$$;


ALTER FUNCTION "public"."get_claim_readiness_score"("p_claim_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_current_team_id"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN current_setting('app.current_team_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_current_team_id"() OWNER TO "postgres";

SET
default_tablespace = '';

SET
default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."scheduled_task"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "task_name" character varying
(
  255
) NOT NULL,
  "task_type" character varying
(
  50
),
  "cron_expression" character varying
(
  100
),
  "parameters" "jsonb",
  "is_active" boolean DEFAULT true,
  "last_run_at" timestamp with time zone,
  "next_run_at" timestamp with time zone,
                            "last_run_status" character varying (50),
  "last_run_error" "text",
  "created_at" timestamp
                          with time zone DEFAULT "now"(),
  "updated_at" timestamp
                          with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."scheduled_task" OWNER TO "postgres";


COMMENT
ON TABLE "public"."scheduled_task" IS 'Cron-like task scheduler for automation';



CREATE
OR REPLACE FUNCTION "public"."get_next_scheduled_task"() RETURNS "public"."scheduled_task"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_task scheduled_task%ROWTYPE;
BEGIN
SELECT *
INTO v_task
FROM scheduled_task
WHERE is_active = TRUE
  AND next_run_at <= NOW()
ORDER BY next_run_at ASC LIMIT 1
    FOR
UPDATE SKIP LOCKED;

RETURN v_task;
END;
$$;


ALTER FUNCTION "public"."get_next_scheduled_task"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_next_work_item"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
next_item_id UUID;
BEGIN
    -- Find highest priority unassigned item
SELECT id
INTO next_item_id
FROM work_queue
WHERE team_id = public.get_auth_team_id()
  AND status = 'pending'
  AND (assigned_to IS NULL OR assigned_to = user_id)
ORDER BY priority DESC, created_at ASC LIMIT 1
    FOR
UPDATE SKIP LOCKED;

-- Assign to user if found
IF
next_item_id IS NOT NULL THEN
UPDATE work_queue
SET assigned_to = user_id,
    assigned_at = NOW(),
    status      = 'assigned'
WHERE id = next_item_id;
END IF;

RETURN next_item_id;
END;
$$;


ALTER FUNCTION "public"."get_next_work_item"("user_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_patient_financial_summary"("p_patient_id" integer) RETURNS TABLE("total_charges" numeric, "insurance_payments" numeric, "patient_payments" numeric, "current_balance" numeric, "statements_sent" integer, "last_payment_date" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Verify the patient belongs to the user's team
    IF
NOT EXISTS (
        SELECT 1 FROM patient
        WHERE id = p_patient_id
        AND team_id = public.get_auth_team_id()
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to patient data';
END IF;

    -- Only billers and above can access financial data
    IF
public.get_auth_user_role() NOT IN ('super_admin', 'org_admin', 'biller') THEN
        RAISE EXCEPTION 'Insufficient permissions to view financial data';
END IF;

RETURN QUERY
SELECT COALESCE(SUM(c.total_amount), 0)             as total_charges,
       COALESCE(SUM(c.paid_amount), 0)              as insurance_payments,
       COALESCE((SELECT SUM(amount)
                 FROM patient_payment pp
                 WHERE pp.patient_id = p_patient_id
                   AND pp.status = 'processed'), 0) as patient_payments,
       calculate_patient_balance(p_patient_id)      as current_balance,
       COUNT(DISTINCT ps.id)::INTEGER as statements_sent, MAX(pp.processed_at) ::DATE as last_payment_date
FROM claim c
       LEFT JOIN patient_statement ps ON ps.patient_id = p_patient_id
       LEFT JOIN patient_payment pp ON pp.patient_id = p_patient_id
WHERE c.team_id = public.get_auth_team_id()
  AND EXISTS (SELECT 1
              FROM encounter e
              WHERE e.id = c.encounter_id
                AND e.patient_id = p_patient_id);
END;
$$;


ALTER FUNCTION "public"."get_patient_financial_summary"("p_patient_id" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_patients_for_clinical_engine"() RETURNS TABLE("patient_id" "text", "first_name" "text", "last_name" "text", "encounter_uuid" "uuid", "encounter_id" "text", "transcript" "text", "transcript_length" integer, "diff_dx_count" bigint, "conditions_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY
SELECT DISTINCT p.patient_id,
                p.first_name,
                p.last_name,
                e.id                                                                          as encounter_uuid,
                e.encounter_id,
                e.transcript, -- Ensure transcript is selected
                length(e.transcript)                                                          as transcript_length,
                (SELECT COUNT(*) FROM differential_diagnoses dd WHERE dd.encounter_id = e.id) as diff_dx_count,
                (SELECT COUNT(*) FROM conditions c WHERE c.encounter_id = e.id)               as conditions_count
FROM patients p
       JOIN encounters e ON p.id = e.patient_supabase_id
WHERE e.transcript IS NOT NULL
  AND length(e.transcript) > 100
  AND (
  (SELECT COUNT(*) FROM differential_diagnoses dd WHERE dd.encounter_id = e.id) < 3
    OR (SELECT COUNT(*) FROM conditions c WHERE c.encounter_id = e.id AND c.category = 'encounter-diagnosis') = 0
  )
ORDER BY p.patient_id, e.encounter_id;
END;
$$;


ALTER FUNCTION "public"."get_patients_for_clinical_engine"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_prior_auth_metrics"("weeks_back" integer DEFAULT 12) RETURNS TABLE("week" timestamp with time zone, "total_pas" bigint, "approved" bigint, "auto_approved" bigint, "avg_confidence" numeric, "avg_turnaround_days" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only return data for the authenticated user's team
    IF
public.get_auth_team_id() IS NULL THEN
        RAISE EXCEPTION 'No team context available';
END IF;

RETURN QUERY
SELECT pam.week,
       pam.total_pas,
       pam.approved,
       pam.auto_approved,
       pam.avg_confidence,
       pam.avg_turnaround_days
FROM _internal_prior_auth_metrics pam
WHERE pam.team_id = public.get_auth_team_id()
  AND pam.week >= NOW() - INTERVAL '1 week' * weeks_back
ORDER BY pam.week DESC;
END;
$$;


ALTER FUNCTION "public"."get_prior_auth_metrics"("weeks_back" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_revenue_cycle_metrics"("start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("month" timestamp with time zone, "total_claims" bigint, "paid_claims" bigint, "total_billed" numeric, "total_collected" numeric, "avg_days_to_payment" numeric, "denied_amount" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only return data for the authenticated user's team
    IF
public.get_auth_team_id() IS NULL THEN
        RAISE EXCEPTION 'No team context available';
END IF;

RETURN QUERY
SELECT rcm.month,
       rcm.total_claims,
       rcm.paid_claims,
       rcm.total_billed,
       rcm.total_collected,
       rcm.avg_days_to_payment,
       rcm.denied_amount
FROM _internal_revenue_cycle_metrics rcm
WHERE rcm.team_id = public.get_auth_team_id()
  AND (start_date IS NULL OR rcm.month >= start_date)
  AND (end_date IS NULL OR rcm.month <= end_date)
ORDER BY rcm.month DESC;
END;
$$;


ALTER FUNCTION "public"."get_revenue_cycle_metrics"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_security_audit_logs"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_action" character varying DEFAULT NULL::character varying, "p_start_date" timestamp with time zone DEFAULT ("now"() - '30 days'::interval), "p_end_date" timestamp with time zone DEFAULT "now"(), "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "user_id" "uuid", "team_id" "uuid", "attempted_action" character varying, "blocked" boolean, "error_message" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if user is admin
    IF
NOT public.is_auth_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can view security audit logs';
END IF;

RETURN QUERY
SELECT sal.id,
       sal.user_id,
       sal.team_id,
       sal.attempted_action,
       sal.blocked,
       sal.error_message,
       sal.created_at
FROM security_audit_log sal
WHERE
  -- Filter by team (org admins only see their team)
  (public.get_auth_user_role() = 'super_admin' OR sal.team_id = public.get_auth_team_id())
  -- Apply optional filters
  AND (p_user_id IS NULL OR sal.user_id = p_user_id)
  AND (p_action IS NULL OR sal.attempted_action ILIKE '%' || p_action || '%')
  AND sal.created_at >= p_start_date
  AND sal.created_at <= p_end_date
ORDER BY sal.created_at DESC LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_security_audit_logs"("p_user_id" "uuid", "p_action" character varying, "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
RETURN (SELECT role
        FROM user_profile
        WHERE id = user_id);
END;
  $$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
INSERT INTO public.user_profile (id,
                                 email,
                                 first_name,
                                 last_name,
                                 role)
VALUES (NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data ->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data ->>'role', 'user'));
RETURN NEW;
END;
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at
= timezone('utc'::text, now());
return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."increment_retry_attempt"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.attempt_number
:= OLD.attempt_number + 1;
    NEW.last_attempt_at
:= NOW();
    NEW.next_retry_at
:= calculate_next_retry(NEW.attempt_number, NEW.backoff_strategy);

    IF
NEW.attempt_number >= NEW.max_attempts THEN
        NEW.status := 'failed';
END IF;

RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_retry_attempt"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."is_auth_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
RETURN public.get_auth_user_role() IN ('super_admin', 'org_admin');
END;
$$;


ALTER FUNCTION "public"."is_auth_admin"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."log_clerk_webhook"("p_event_type" "text", "p_clerk_id" "text", "p_payload" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
v_log_id UUID;
BEGIN
INSERT INTO clerk_webhook_log (event_type,
                               clerk_id,
                               payload,
                               processed_at)
VALUES (p_event_type,
        p_clerk_id,
        p_payload,
        NOW()) RETURNING id
INTO v_log_id;

RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_clerk_webhook"("p_event_type" "text", "p_clerk_id" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."log_phi_export"("p_export_type" "text", "p_record_count" integer, "p_entity_types" "text"[], "p_purpose" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
INSERT INTO phi_export_log (exported_by,
                            export_type,
                            record_count,
                            entity_types,
                            purpose,
                            ip_address,
                            exported_at)
VALUES (auth.uid(),
        p_export_type,
        p_record_count,
        p_entity_types,
        p_purpose,
        inet_client_addr(),
        NOW());
END;
$$;


ALTER FUNCTION "public"."log_phi_export"("p_export_type" "text", "p_record_count" integer, "p_entity_types" "text"[], "p_purpose" "text") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
INSERT INTO security_audit_log (user_id, team_id, attempted_action, error_message)
VALUES (auth.uid(), public.get_auth_team_id(), action, error_msg);
END;
$$;


ALTER FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text" DEFAULT NULL::"text", "custom_team_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
v_team_id UUID;
BEGIN
    -- Use provided team_id or get from context
    v_team_id
:= COALESCE(custom_team_id, public.get_auth_team_id());

    -- Insert the security event
INSERT INTO security_audit_log (user_id,
                                team_id,
                                attempted_action,
                                error_message,
                                blocked)
VALUES (auth.uid(),
        v_team_id,
         action,
        error_msg,
        (error_msg IS NOT NULL) -- If there's an error, it was blocked
       );
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail to avoid breaking the calling function
        -- In production, you might want to log this elsewhere
        NULL;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text", "custom_team_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."match_guidelines"("query_embedding" "public"."vector", "match_count" integer DEFAULT 5, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "sql"
    AS $$
SELECT guideline_vectors.id,
       guideline_vectors.content,
       guideline_vectors.metadata,
       1 - (guideline_vectors.embedding <=> query_embedding) AS similarity
FROM guideline_vectors
WHERE CASE
        WHEN filter = '{}' THEN TRUE
        ELSE guideline_vectors.metadata @ > filter
        END
ORDER BY guideline_vectors.embedding <=> query_embedding
    LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_guidelines"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."migrate_patient_alerts_to_unified_system"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
patient_record RECORD;
    alert_record
RECORD;
    alerts_data
JSONB;
    migrated_count
INTEGER := 0;
BEGIN
    -- Loop through all patients with alerts
FOR patient_record IN
SELECT id, patient_id, alerts
FROM public.patients
WHERE alerts IS NOT NULL
  AND alerts != 'null'::jsonb AND alerts != '[]'::jsonb
    LOOP
        alerts_data := patient_record.alerts;

IF
jsonb_typeof(alerts_data) = 'array' THEN
            FOR alert_record IN
SELECT *
FROM jsonb_array_elements(alerts_data) LOOP
  INSERT
INTO public.alerts (patient_id,
                    alert_type,
                    severity,
                    category,
                    title,
                    message,
                    suggestion,
                    confidence_score,
                    legacy_alert_data,
                    migrated_from_patient_alerts,
                    created_at)
VALUES (
  patient_record.id, COALESCE ((alert_record.value->>'type')::TEXT, 'COMPLEX_CONDITION'), COALESCE ((alert_record.value->>'severity')::TEXT, 'INFO'), 'complex_case', COALESCE ((alert_record.value->>'type')::TEXT, 'Complex Case Alert'), COALESCE ((alert_record.value->>'msg')::TEXT, 'Complex case alert migrated from legacy system'), COALESCE (
  CASE
  WHEN (alert_record.value->>'suggestedActions') IS NOT NULL
  THEN array_to_string(
  ARRAY(SELECT jsonb_array_elements_text(alert_record.value->'suggestedActions')), '; '
  )
  ELSE NULL
  END
  ), COALESCE ((alert_record.value->>'confidence'):: NUMERIC, (alert_record.value->>'likelihood'):: NUMERIC, 0.5), alert_record.value, true, COALESCE (
  (alert_record.value->>'createdAt')::TIMESTAMPTZ, (alert_record.value->>'date')::TIMESTAMPTZ, NOW()
  )
  );
migrated_count
:= migrated_count + 1;
END LOOP;
END IF;
END LOOP;

RETURN migrated_count;
END;
$$;


ALTER FUNCTION "public"."migrate_patient_alerts_to_unified_system"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."prevent_duplicate_claim"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF
EXISTS (
    SELECT 1 FROM claim
    WHERE encounter_id = NEW.encounter_id
    AND status != 'void'
  ) THEN
    RAISE EXCEPTION 'Claim already exists for this encounter';
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_duplicate_claim"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."refresh_materialized_views"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    REFRESH
MATERIALIZED VIEW CONCURRENTLY _internal_revenue_cycle_metrics;
    REFRESH
MATERIALIZED VIEW CONCURRENTLY _internal_prior_auth_metrics;
END;
$$;


ALTER FUNCTION "public"."refresh_materialized_views"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."schedule_metrics_refresh"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This would be called by a cron job or Supabase Edge Function
    PERFORM
refresh_materialized_views();
END;
$$;


ALTER FUNCTION "public"."schedule_metrics_refresh"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."search_guidelines_text"("search_query" "text", "match_count" integer DEFAULT 10) RETURNS TABLE("id" bigint, "title" "text", "content" "text", "source" "text", "specialty" "text", "similarity" double precision)
    LANGUAGE "sql"
    AS $$
SELECT guidelines_docs.id,
       guidelines_docs.title, left (guidelines_docs.content, 500) as content, -- First 500 chars for preview
  guidelines_docs.source, guidelines_docs.specialty, similarity(guidelines_docs.title || ' ' || guidelines_docs.content, search_query) as similarity
FROM guidelines_docs
WHERE
  guidelines_docs.title ILIKE '%' || search_query || '%'
   OR guidelines_docs.content ILIKE '%' || search_query || '%'
ORDER BY similarity DESC, guidelines_docs.title
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."search_guidelines_text"("search_query" "text", "match_count" integer) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."sync_clerk_user"("p_clerk_user_id" "text", "p_supabase_user_id" "uuid", "p_organization_id" "text", "p_team_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
INSERT INTO clerk_user_sync (clerk_user_id,
                             supabase_user_id,
                             organization_id,
                             team_id,
                             sync_status,
                             last_synced_at)
VALUES (p_clerk_user_id,
        p_supabase_user_id,
        p_organization_id,
        p_team_id,
        'active',
        NOW()) ON CONFLICT (clerk_user_id)
  DO
UPDATE SET
  supabase_user_id = EXCLUDED.supabase_user_id,
  organization_id = EXCLUDED.organization_id,
  team_id = EXCLUDED.team_id,
  sync_status = 'active',
  last_synced_at = NOW(),
  metadata = COALESCE (clerk_user_sync.metadata, '{}'::jsonb) ||
  jsonb_build_object('updated_at', NOW());
END;
$$;


ALTER FUNCTION "public"."sync_clerk_user"("p_clerk_user_id" "text", "p_supabase_user_id" "uuid", "p_organization_id" "text", "p_team_id" "uuid") OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."track_workflow_state"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_entity_type VARCHAR;
    v_workflow_type
VARCHAR;
BEGIN
    v_entity_type
:= TG_TABLE_NAME;

    IF
v_entity_type = 'claim' THEN
        v_workflow_type := 'claim_lifecycle';
    ELSIF
v_entity_type = 'prior_auth' THEN
        v_workflow_type := 'pa_lifecycle';
ELSE
        RETURN NEW;
END IF;

INSERT INTO workflow_state (team_id,
                            entity_type,
                            entity_id,
                            workflow_type,
                            current_state,
                            previous_state,
                            state_data)
VALUES (NEW.team_id,
        v_entity_type,
        NEW.id,
        v_workflow_type,
        NEW.status,
        OLD.status,
        jsonb_build_object(
          'changed_at', NOW(),
          'changed_by', current_setting('app.current_user_id', true)
        )) ON CONFLICT (entity_type, entity_id)
    DO
UPDATE SET
  previous_state = workflow_state.current_state,
  current_state = EXCLUDED.current_state,
  state_entered_at = NOW(),
  transitions_history = COALESCE (workflow_state.transitions_history, ARRAY[]::jsonb[]) ||
  jsonb_build_object(
  'from', workflow_state.current_state,
  'to', EXCLUDED.current_state,
  'at', NOW()
  )::jsonb;

RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_workflow_state"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at
= now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at
= NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."upsert_fhir_resource"("p_team_id" "uuid", "p_resource_type" character varying, "p_resource_id" character varying, "p_resource_data" "jsonb", "p_mapped_entity_type" character varying DEFAULT NULL::character varying, "p_mapped_entity_id" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_id UUID;
BEGIN
INSERT INTO fhir_resource (team_id, resource_type, resource_id,
                           resource_data, mapped_entity_type, mapped_entity_id,
                           last_updated)
VALUES (p_team_id, p_resource_type, p_resource_id,
        p_resource_data, p_mapped_entity_type, p_mapped_entity_id,
        NOW()) ON CONFLICT (team_id, resource_type, resource_id)
    DO
UPDATE SET
  resource_data = EXCLUDED.resource_data,
  mapped_entity_type = EXCLUDED.mapped_entity_type,
  mapped_entity_id = EXCLUDED.mapped_entity_id,
  last_updated = NOW()
  RETURNING id
INTO v_id;

RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."upsert_fhir_resource"("p_team_id" "uuid", "p_resource_type" character varying, "p_resource_id" character varying, "p_resource_data" "jsonb", "p_mapped_entity_type" character varying, "p_mapped_entity_id" character varying) OWNER TO "postgres";


CREATE
OR REPLACE FUNCTION "public"."validate_provider_billing"("p_encounter_id" character varying) RETURNS TABLE("can_bill" boolean, "enrollment_status" character varying, "enrollment_issues" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
v_team_id UUID;
    v_clinician_id
INTEGER;
    v_payer_ids
INTEGER[];
BEGIN
    -- Get encounter details
SELECT e.team_id,
       e.rendering_clinician_id,
       ARRAY_AGG(DISTINCT ip.payer_id)
INTO v_team_id, v_clinician_id, v_payer_ids
FROM encounter e
       JOIN patient p ON e.patient_id = p.id
       JOIN insurance_policy ip ON ip.patient_id = p.id
WHERE e.id = p_encounter_id
  AND e.team_id = public.get_auth_team_id()
GROUP BY e.team_id, e.rendering_clinician_id;

IF
v_clinician_id IS NULL THEN
        RAISE EXCEPTION 'Encounter not found or access denied';
END IF;

RETURN QUERY WITH enrollment_check AS (
        SELECT
            pe.payer_id,
            pe.enrollment_status,
            pe.can_bill,
            CASE
                WHEN pe.enrollment_status IS NULL THEN 'Not enrolled with payer'
                WHEN pe.enrollment_status != 'approved' THEN 'Enrollment ' || pe.enrollment_status
                WHEN NOT pe.can_bill THEN 'Billing suspended'
                WHEN pe.termination_date < CURRENT_DATE THEN 'Enrollment terminated'
                ELSE NULL
            END as issue
        FROM unnest(v_payer_ids) AS payer_id
        LEFT JOIN provider_enrollment pe
            ON pe.clinician_id = v_clinician_id
            AND pe.payer_id = payer_id
    )
SELECT BOOL_AND(COALESCE(can_bill, FALSE)),
       STRING_AGG(DISTINCT enrollment_status, ', '),
       ARRAY_AGG(issue) FILTER (WHERE issue IS NOT NULL)
FROM enrollment_check;
END;
$$;


ALTER FUNCTION "public"."validate_provider_billing"("p_encounter_id" character varying) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prior_auth"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "team_id" "uuid",
  "patient_id" integer,
  "encounter_id" character varying
(
  50
),
  "payer_id" integer,
  "status" character varying
(
  50
) NOT NULL,
  "medication" character varying
(
  255
),
  "indication" character varying
(
  255
),
  "quantity" integer,
  "duration_days" integer,
  "prev_therapies" "text"[],
  "confidence" numeric
(
  3,
  2
),
  "field_confidences" "jsonb",
  "issues" "text"[],
  "suggested_fixes" "jsonb"[],
  "attempt_count" integer DEFAULT 0,
  "auto_approved" boolean DEFAULT false,
  "submitted_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "denied_at" timestamp with time zone,
                          "auth_number" character varying (100),
  "created_at" timestamp
                        with time zone DEFAULT "now"(),
  "updated_at" timestamp
                        with time zone DEFAULT "now"(),
  CONSTRAINT "prior_auth_confidence_check" CHECK
(
  (
  (
  "confidence"
  >=
(
  0
):: numeric) AND
(
  "confidence"
  <=
(
  1
):: numeric)))
  );


ALTER TABLE "public"."prior_auth" OWNER TO "postgres";


COMMENT
ON TABLE "public"."prior_auth" IS 'Prior authorization requests (formerly EPA tasks)';



CREATE
MATERIALIZED VIEW "public"."_internal_prior_auth_metrics" AS
SELECT "team_id",
       "date_trunc"('week'::"text", "submitted_at")                                                        AS "week",
       "count"(*)                                                                                          AS "total_pas",
       "count"(*)                                                                                             FILTER (WHERE (("status")::"text" = 'approved'::"text")) AS "approved", "count"(*) FILTER (WHERE ("auto_approved" = true)) AS "auto_approved", "avg"("confidence") AS "avg_confidence",
       "avg"("date_part"('day'::"text",
                         (COALESCE("approved_at", "denied_at", "now"()) - "submitted_at")))                AS "avg_turnaround_days"
FROM "public"."prior_auth"
WHERE ("submitted_at" >= ("now"() - '3 mons'::interval))
GROUP BY "team_id", ("date_trunc"('week'::"text", "submitted_at")) WITH NO DATA;


ALTER
MATERIALIZED VIEW "public"."_internal_prior_auth_metrics" OWNER TO "postgres";


COMMENT
ON MATERIALIZED VIEW "public"."_internal_prior_auth_metrics" IS 'INTERNAL: Do not access directly. Use prior_auth_metrics view or get_prior_auth_metrics() function';



CREATE TABLE IF NOT EXISTS "public"."claim"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "encounter_id" character varying
(
  50
) NOT NULL,
  "payer_id" integer NOT NULL,
  "status" character varying
(
  50
) NOT NULL,
  "claim_number" character varying
(
  100
),
  "total_amount" numeric
(
  10,
  2
) NOT NULL,
  "confidence" numeric
(
  3,
  2
),
  "field_confidences" "jsonb",
  "issues" "text"[],
  "suggested_fixes" "jsonb"[],
  "attempt_count" integer DEFAULT 0,
  "auto_submitted" boolean DEFAULT false,
  "submitted_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "paid_at" timestamp with time zone,
                        "paid_amount" numeric (10,2),
  "meta" "jsonb",
  "created_at" timestamp
                      with time zone DEFAULT "now"(),
  "updated_at" timestamp
                      with time zone DEFAULT "now"(),
  "team_id" "uuid",
  CONSTRAINT "claim_confidence_check" CHECK
(
  (
  (
  "confidence"
  >=
(
  0
):: numeric) AND
(
  "confidence"
  <=
(
  1
):: numeric)))
  );


ALTER TABLE "public"."claim" OWNER TO "postgres";


COMMENT
ON TABLE "public"."claim" IS 'Insurance claims with automation confidence scores';



COMMENT
ON COLUMN "public"."claim"."confidence" IS 'Overall confidence score for auto-submission (0-1)';



COMMENT
ON COLUMN "public"."claim"."field_confidences" IS 'Individual field confidence scores as JSON';



CREATE
MATERIALIZED VIEW "public"."_internal_revenue_cycle_metrics" AS
SELECT "team_id",
       "date_trunc"('month'::"text", "submitted_at")                                      AS "month",
       "count"(*)                                                                         AS "total_claims",
       "count"(*)                                                                            FILTER (WHERE (("status")::"text" = 'paid'::"text")) AS "paid_claims", "sum"("total_amount") AS "total_billed",
       "sum"("paid_amount")                                                               AS "total_collected",
       "avg"("date_part"('day'::"text", (COALESCE("paid_at", "now"()) - "submitted_at"))) AS "avg_days_to_payment",
       "sum"("total_amount")                                                                 FILTER (WHERE (("status")::"text" = ANY ((ARRAY['denied'::character varying, 'rejected_277ca'::character varying])::"text"[]))) AS "denied_amount"
FROM "public"."claim"
WHERE ("submitted_at" >= ("now"() - '1 year'::interval))
GROUP BY "team_id", ("date_trunc"('month'::"text", "submitted_at")) WITH NO DATA;


ALTER
MATERIALIZED VIEW "public"."_internal_revenue_cycle_metrics" OWNER TO "postgres";


COMMENT
ON MATERIALIZED VIEW "public"."_internal_revenue_cycle_metrics" IS 'INTERNAL: Do not access directly. Use revenue_cycle_metrics view or get_revenue_cycle_metrics() function';



CREATE TABLE IF NOT EXISTS "public"."encounter"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "patient_id" integer NOT NULL,
  "appointment_id" character varying
(
  50
),
  "visit_type" character varying
(
  50
),
  "pos" character varying
(
  2
) NOT NULL,
  "dos" "date" NOT NULL,
  "rendering_clinician_id" integer NOT NULL,
  "service_location_id" character varying
(
  50
),
  "cpt" character varying
(
  10
) NOT NULL,
  "icd10" character varying
(
  10
) NOT NULL,
  "modifiers" character varying [],
  "units" integer DEFAULT 1,
  "duration_minutes" integer,
  "notes" "text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "team_id" "uuid"
  );


ALTER TABLE "public"."encounter" OWNER TO "postgres";


COMMENT
ON TABLE "public"."encounter" IS 'Medical visits and appointments with associated clinical data';



CREATE TABLE IF NOT EXISTS "public"."patient"
(
  "id"
  bigint
  NOT
  NULL,
  "external_id"
  "text",
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "region" "text",
  "has_verified_identity" boolean DEFAULT false NOT NULL,
  "height" integer,
  "weight" integer,
  "profile_id" bigint,
  "mrn" character varying,
  "status" character varying DEFAULT 'active':: character varying,
  "team_id" "uuid",
  "ssn_encrypted" "text",
  "ssn_key_id" "uuid"
  );


ALTER TABLE "public"."patient" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_profile"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"(),
  "first_name" "text",
  "last_name" "text",
  "birth_date" "date",
  "gender" "text",
  "email" "text",
  "phone" "text",
  "patient_address" bigint,
  "team_id" "uuid"
  );


ALTER TABLE "public"."patient_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  "name" "text" NOT NULL,
  "external_payer_id" "text" NOT NULL,
  "payer_type" character varying,
  "team_id" "uuid"
  );


ALTER TABLE "public"."payer" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."active_claims" WITH ("security_invoker"='on') AS
SELECT "c"."id",
       "c"."encounter_id",
       "c"."payer_id",
       "c"."status",
       "c"."claim_number",
       "c"."total_amount",
       "c"."confidence",
       "c"."field_confidences",
       "c"."issues",
       "c"."suggested_fixes",
       "c"."attempt_count",
       "c"."auto_submitted",
       "c"."submitted_at",
       "c"."accepted_at",
       "c"."rejected_at",
       "c"."paid_at",
       "c"."paid_amount",
       "c"."meta",
       "c"."created_at",
       "c"."updated_at",
       "e"."dos",
       "e"."cpt",
       "e"."icd10",
       "p"."name" AS "payer_name",
       "pat"."id" AS "patient_id",
       "pp"."first_name",
       "pp"."last_name"
FROM (((("public"."claim" "c"
  JOIN "public"."encounter" "e" ON ((("c"."encounter_id")::"text" = ("e" . "id")::"text")))
  JOIN "public"."payer" "p" ON (("c"."payer_id" = "p"."id")))
       JOIN "public"."patient" "pat" ON (("e"."patient_id" = "pat"."id")))
     JOIN "public"."patient_profile" "pp"
ON (("pat"."profile_id" = "pp"."id")))
WHERE (("c"."status")::"text" <> ALL (ARRAY[('paid':: character varying)::"text"
    , ('denied':: character varying)::"text"
    , ('closed':: character varying)::"text"]));


ALTER
VIEW "public"."active_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profile"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp
                         with time zone DEFAULT "now"() NOT NULL,
  "role" "public"."user_role" DEFAULT 'biller'::"public"."user_role" NOT NULL,
  "department" "text",
  "email" "text",
  "first_name" "text",
  "last_name" "text",
  "job_title" "text",
  "phone" "text",
  "location" "text",
  "timezone" "text",
  "avatar_url" "text",
  "bio" "text",
  "current_team_id" "uuid",
  "onboarded_at" timestamp
                         with time zone
                           );


ALTER TABLE "public"."user_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_session"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "user_id" "uuid",
  "started_at" timestamp with time zone DEFAULT "now"(),
  "last_activity_at" timestamp
                         with time zone DEFAULT "now"(),
  "ended_at" timestamp
                         with time zone,
                           "timeout_after_minutes" integer DEFAULT 15
                           );


ALTER TABLE "public"."user_session" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."active_user_sessions" WITH ("security_invoker"='on') AS
SELECT "us"."id",
       "us"."user_id",
       "up"."email",
       (("up"."first_name" || ' '::"text") || "up"."last_name") AS "user_name",
       "us"."started_at",
       "us"."last_activity_at",
       CASE
         WHEN ("us"."last_activity_at" > ("now"() - '00:05:00'::interval)) THEN 'active'::"text"
         WHEN ("us"."last_activity_at" > ("now"() - '00:15:00'::interval)) THEN 'idle'::"text"
         ELSE 'inactive'::"text"
         END                                                    AS "status"
FROM ("public"."user_session" "us"
  JOIN "public"."user_profile" "up" ON (("us"."user_id" = "up"."id")))
WHERE ("us"."ended_at" IS NULL);


ALTER
VIEW "public"."active_user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."address"
(
  "patient_id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  "address_line_1" "text" NOT NULL,
  "address_line_2" "text",
  "city" "text" NOT NULL,
  "state" "text" NOT NULL,
  "zip_code" "text" NOT NULL,
  "updated_address" boolean DEFAULT false NOT NULL,
  "updated_address_at" timestamp
                         with time zone,
                           "verified_address" boolean DEFAULT true NOT NULL
                           );


ALTER TABLE "public"."address" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."adjustment_reason_code"
(
  "code"
  character
  varying
(
  10
) NOT NULL,
  "code_type" character varying
(
  10
) NOT NULL,
  "description" "text" NOT NULL,
  "category" character varying
(
  50
),
  "action_required" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "adjustment_reason_code_code_type_check" CHECK
(
  (
(
  "code_type"
)::"text" = ANY
(
  (
  ARRAY
[
  'CARC'
  :
  :
  character
  varying,
  'RARC'
  :
  :
  character
  varying]
)::"text"[])))
  );


ALTER TABLE "public"."adjustment_reason_code" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_event"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "team_member_id" "uuid",
  "event_name" character varying
(
  100
) NOT NULL,
  "event_category" character varying
(
  50
),
  "event_data" "jsonb",
  "session_id" character varying
(
  100
),
  "ip_address" "inet",
  "user_agent" "text",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."analytics_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_key"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "name" character varying
(
  255
),
  "key_hash" "text" NOT NULL,
  "key_prefix" character varying
(
  20
),
  "scopes" "jsonb",
  "rate_limit" integer DEFAULT 1000,
  "last_used_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "is_active" boolean DEFAULT true,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."api_key" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_version"
(
  "version"
  character
  varying
(
  20
) NOT NULL,
  "release_date" "date" NOT NULL,
  "deprecated_at" timestamp with time zone,
  "sunset_at" timestamp with time zone,
  "changes" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."api_version" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appeal"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "denial_tracking_id" "uuid",
  "claim_id" character varying
(
  50
),
  "appeal_level" integer DEFAULT 1,
  "appeal_type" character varying
(
  50
),
  "status" character varying
(
  50
) DEFAULT 'preparing':: character varying,
  "submission_date" "date",
  "response_due_date" "date",
  "decision_date" "date",
  "decision" character varying
(
  50
),
  "recovered_amount" numeric
(
  10,
  2
),
  "appeal_letter_path" "text",
  "supporting_docs" "jsonb",
  "notes" "text",
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."appeal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "provider_id" integer,
  "service_location_id" character varying
(
  50
),
  "appointment_type" character varying
(
  100
),
  "scheduled_date" "date" NOT NULL,
  "scheduled_time" time without time zone NOT NULL,
  "duration_minutes" integer DEFAULT 15,
  "status" character varying
(
  50
) DEFAULT 'scheduled':: character varying,
  "confirmation_sent_at" timestamp with time zone,
  "reminder_sent_at" timestamp with time zone,
  "checked_in_at" timestamp
                        with time zone,
                          "encounter_created" boolean DEFAULT false,
                          "encounter_id" character varying (50),
  "notes" "text",
  "created_at" timestamp
                        with time zone DEFAULT "now"(),
  "updated_at" timestamp
                        with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."appointment" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."ar_aging_detail" WITH ("security_invoker"='on') AS
SELECT "c"."team_id",
       "c"."id"                                                         AS "claim_id",
       "c"."claim_number",
       "e"."dos"                                                        AS "service_date",
       "p"."name"                                                       AS "payer_name",
       (("pt"."first_name" || ' '::"text") || "pt"."last_name")         AS "patient_name",
       "c"."total_amount",
       COALESCE("c"."paid_amount", (0)::numeric)                        AS "paid_amount",
       ("c"."total_amount" - COALESCE("c"."paid_amount", (0)::numeric)) AS "balance",
       (CURRENT_DATE - "e"."dos")                                       AS "days_outstanding",
       CASE
         WHEN ((CURRENT_DATE - "e"."dos") <= 30) THEN '0-30'::"text"
         WHEN ((CURRENT_DATE - "e"."dos") <= 60) THEN '31-60'::"text"
         WHEN ((CURRENT_DATE - "e"."dos") <= 90) THEN '61-90'::"text"
         WHEN ((CURRENT_DATE - "e"."dos") <= 120) THEN '91-120'::"text"
         ELSE '120+'::"text"
         END                                                            AS "aging_bucket",
       "c"."status",
       "c"."submitted_at",
       "c"."rejected_at",
       "c"."accepted_at"
FROM (((("public"."claim" "c"
  JOIN "public"."encounter" "e" ON ((("c"."encounter_id")::"text" = ("e" . "id")::"text")))
  JOIN "public"."payer" "p" ON (("c"."payer_id" = "p"."id")))
       JOIN "public"."patient" "pat" ON (("e"."patient_id" = "pat"."id")))
     JOIN "public"."patient_profile" "pt"
ON (("pat"."profile_id" = "pt"."id")))
WHERE ((("c"."status")::"text" <> ALL ((ARRAY['paid':: character varying
    , 'void':: character varying
    , 'denied':: character varying])::"text"[]))
  AND (("c"."total_amount" - COALESCE ("c"."paid_amount"
    , (0):: numeric))
    > (0):: numeric));


ALTER
VIEW "public"."ar_aging_detail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "table_name" "text" NOT NULL,
  "operation" "text" NOT NULL,
  "auth_uid" "uuid" DEFAULT "auth"."uid"
(
),
  "team_id" "uuid",
  "record_id" "text",
  "old_data" "jsonb",
  "new_data" "jsonb"
  );


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_event"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "case_id" character varying
(
  100
) NOT NULL,
  "case_type" character varying
(
  50
) NOT NULL,
  "event_type" character varying
(
  100
) NOT NULL,
  "status" character varying
(
  50
) NOT NULL,
  "confidence" numeric
(
  3,
  2
),
  "details" "jsonb",
  "error_message" "text",
  "timestamp" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "team_id" "uuid",
  CONSTRAINT "automation_event_confidence_check" CHECK
(
  (
  (
  "confidence"
  >=
(
  0
):: numeric) AND
(
  "confidence"
  <=
(
  1
):: numeric)))
  );


ALTER TABLE "public"."automation_event" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."automation_metrics" WITH ("security_invoker"='on') AS
SELECT "team_id",
       "date_trunc"('day'::"text", "created_at")                                                                                                                           AS "date",
       "count"(*)                                                                                                                                                             FILTER (WHERE ("auto_submitted" = true)) AS "claims_auto_submitted", "count"(*) FILTER (WHERE ("auto_submitted" = false)) AS "claims_manual_submitted", "avg"("confidence") FILTER (WHERE ("auto_submitted" = true)) AS "avg_auto_claim_confidence", "count"(*) FILTER (WHERE ("auto_approved" = true)) AS "pas_auto_approved", "avg"("confidence") FILTER (WHERE ("auto_approved" = true)) AS "avg_auto_pa_confidence", "count"(*) AS "total_transactions",
       "round"(((("count"(*) FILTER (WHERE (("auto_submitted" = true) OR ("auto_approved" = true)))):: numeric / (NULLIF ("count"(*), 0)):: numeric) * (100)::numeric), 2) AS "automation_rate"
FROM (SELECT "claim"."team_id",
             "claim"."created_at",
             "claim"."auto_submitted",
             NULL::boolean AS "auto_approved", "claim"."confidence"
      FROM "public"."claim"
      UNION ALL
      SELECT "prior_auth"."team_id",
             "prior_auth"."created_at",
             NULL::boolean, "prior_auth"."auto_approved",
             "prior_auth"."confidence"
      FROM "public"."prior_auth") "combined"
GROUP BY "team_id", ("date_trunc"('day'::"text", "created_at"));


ALTER
VIEW "public"."automation_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_retry"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "automation_type" character varying NOT NULL,
  "entity_type" character varying NOT NULL,
  "entity_id" character varying NOT NULL,
  "attempt_number" integer DEFAULT 1,
  "max_attempts" integer DEFAULT 5,
  "last_error" "text",
  "last_attempt_at" timestamp with time zone,
  "next_retry_at" timestamp with time zone,
  "backoff_strategy" character varying DEFAULT 'exponential':: character varying,
  "status" character varying DEFAULT 'pending':: character varying,
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "chk_retry_attempts" CHECK
(
  (
(
  "attempt_number" >
  0
) AND
(
  "max_attempts" >
  0
) AND
(
  "attempt_number"
  <=
(
  "max_attempts"
  +
  1
))))
  );


ALTER TABLE "public"."automation_retry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "name" character varying
(
  255
) NOT NULL,
  "description" "text",
  "trigger_type" character varying
(
  50
),
  "trigger_config" "jsonb",
  "conditions" "jsonb",
  "actions" "jsonb",
  "priority" integer DEFAULT 50,
  "is_active" boolean DEFAULT true,
  "last_triggered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."automation_rule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."batch_job"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "job_type" character varying
(
  50
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "total_items" integer,
  "processed_items" integer DEFAULT 0,
  "successful_items" integer DEFAULT 0,
  "failed_items" integer DEFAULT 0,
  "parameters" "jsonb",
  "error_log" "jsonb",
  "scheduled_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."batch_job" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."batch_job_item"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "batch_job_id" "uuid" NOT NULL,
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "processing_result" "jsonb",
  "error_message" "text",
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."batch_job_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benefits_coverage"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_id" integer,
  "plan_name" character varying
(
  255
),
  "cpt_code" character varying
(
  10
),
  "requires_prior_auth" boolean DEFAULT false,
  "covered" boolean DEFAULT true,
  "copay_amount" numeric
(
  10,
  2
),
  "coinsurance_percent" numeric
(
  5,
  2
),
  "deductible_applies" boolean DEFAULT true,
  "max_units" integer,
  "frequency_limit" character varying
(
  100
),
  "notes" "text",
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."benefits_coverage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_rule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "rule_category" character varying
(
  50
),
  "rule_name" character varying
(
  255
) NOT NULL,
  "description" "text",
  "rule_logic" "jsonb" NOT NULL,
  "priority" integer DEFAULT 50,
  "is_active" boolean DEFAULT true,
  "applies_to_payers" integer [],
  "applies_to_cpts" character varying
(
  10
)[],
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."business_rule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_attachment"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying
(
  50
),
  "attachment_type" character varying
(
  50
),
  "file_path" "text",
  "file_size" integer,
  "page_count" integer,
  "attachment_control_number" character varying
(
  50
),
  "sent_method" character varying
(
  50
),
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."claim_attachment" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."claim_dashboard" WITH ("security_invoker"='on') AS
SELECT "c"."team_id",
       "c"."status",
       "count"(*)                                                                 AS "claim_count",
       "sum"("c"."total_amount")                                                  AS "total_billed",
       "sum"("c"."paid_amount")                                                   AS "total_paid",
       "sum"(("c"."total_amount" - COALESCE("c"."paid_amount", (0)::numeric)))    AS "outstanding_balance",
       "avg"(EXTRACT(day FROM ("now"() - ("e"."dos")::timestamp with time zone))) AS "avg_age_days",
       "count"(*)                                                                    FILTER (WHERE (EXTRACT(day FROM ("now"() - ("e"."dos")::timestamp with time zone)) > (30)::numeric)) AS "over_30_days", "count"(*) FILTER (WHERE (EXTRACT(day FROM ("now"() - ("e"."dos")::timestamp with time zone)) > (60)::numeric)) AS "over_60_days", "count"(*) FILTER (WHERE (EXTRACT(day FROM ("now"() - ("e"."dos")::timestamp with time zone)) > (90)::numeric)) AS "over_90_days"
FROM ("public"."claim" "c"
  JOIN "public"."encounter" "e" ON ((("c"."encounter_id")::"text" = ("e" . "id")::"text")))
GROUP BY "c"."team_id", "c"."status";


ALTER
VIEW "public"."claim_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_line"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying NOT NULL,
  "line_number" integer NOT NULL,
  "service_date" "date" NOT NULL,
  "cpt_code" character varying NOT NULL,
  "modifiers" character varying [],
  "units" integer DEFAULT 1,
  "charge_amount" numeric NOT NULL,
  "allowed_amount" numeric,
  "paid_amount" numeric,
  "adjustment_amount" numeric,
  "patient_responsibility" numeric,
  "place_of_service" character varying,
  "diagnosis_pointers" integer [],
  "revenue_code" character varying,
  "status" character varying,
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "chk_claim_line_amounts" CHECK
(
  (
  (
  "charge_amount"
  >=
(
  0
):: numeric) AND
(
  COALESCE (
  "paid_amount",
(
  0
):: numeric) >=
(
  0
):: numeric)))
  );


ALTER TABLE "public"."claim_line" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_state_history"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "claim_id" character varying
(
  50
) NOT NULL,
  "state" character varying
(
  50
) NOT NULL,
  "actor" character varying
(
  50
) NOT NULL,
  "at" timestamp with time zone NOT NULL,
  "details" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."claim_state_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_submission_batch"
(
  "id"
  "uuid"
  NOT
  NULL,
  "batch_control_number"
  "text",
  "clearinghouse_id"
  "uuid",
  "file_name"
  "text",
  "claim_count"
  integer,
  "total_amount"
  numeric,
  "status"
  "text",
  "submitted_at"
  timestamp
  with
  time
  zone,
  "response_file"
  "text",
  "team_id"
  "uuid"
);


ALTER TABLE "public"."claim_submission_batch" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_validation"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying NOT NULL,
  "validation_run_at" timestamp with time zone DEFAULT "now"(),
  "overall_status" character varying,
  "rules_evaluated" "jsonb",
  "errors" "jsonb",
  "warnings" "jsonb",
  "auto_fixed" "jsonb",
  "confidence_score" numeric,
  "created_at" timestamp
                                with time zone DEFAULT "now"(),
  CONSTRAINT "claim_validation_confidence_score_check" CHECK
(
  (
  (
  "confidence_score"
  >=
(
  0
):: numeric) AND
(
  "confidence_score"
  <=
(
  1
):: numeric)))
  );


ALTER TABLE "public"."claim_validation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearinghouse_batch"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "clearinghouse_id" "uuid",
  "batch_number" character varying,
  "transaction_type" character varying,
  "file_path" "text",
  "total_claims" integer,
  "total_amount" numeric,
  "status" character varying DEFAULT 'pending':: character varying,
  "submitted_at" timestamp with time zone,
  "acknowledged_at" timestamp with time zone,
  "acknowledgment_data" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."clearinghouse_batch" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearinghouse_connection"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "clearinghouse_name" character varying
(
  100
),
  "connection_type" character varying
(
  50
),
  "credentials" "jsonb",
  "endpoint_urls" "jsonb",
  "supported_transactions" character varying
(
  10
)[],
  "is_active" boolean DEFAULT true,
  "test_mode" boolean DEFAULT false,
  "last_connection_test" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."clearinghouse_connection" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clerk_user_sync"
(
  "clerk_user_id"
  "text"
  NOT
  NULL,
  "supabase_user_id"
  "uuid",
  "organization_id"
  "text",
  "team_id"
  "uuid",
  "sync_status"
  "text",
  "last_synced_at"
  timestamp
  with
  time
  zone,
  "metadata"
  "jsonb"
);


ALTER TABLE "public"."clerk_user_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clerk_webhook_log"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "event_type" "text",
  "clerk_id" "text",
  "payload" "jsonb",
  "processed_at" timestamp with time zone,
                             "error_message" "text"
                             );


ALTER TABLE "public"."clerk_webhook_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinician"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
                           "npi_key" "text" NOT NULL,
                           "first_name" "text",
                           "last_name" "text",
                           "specialty" character varying,
                           "license_number" character varying,
                           "license_state" character varying,
                           "team_id" "uuid"
                           );


ALTER TABLE "public"."clinician" OWNER TO "postgres";


ALTER TABLE "public"."clinician" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."clinician_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."clinician_note"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "patient_id" bigint,
  "clinician_id" bigint,
  "signed" boolean,
  "note" "text",
  "amended" boolean,
  "version" bigint DEFAULT '0'::bigint
  );


ALTER TABLE "public"."clinician_note" OWNER TO "postgres";


ALTER TABLE "public"."clinician_note" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."clinician_note_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."collection_account"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "total_balance" numeric
(
  10,
  2
) NOT NULL,
  "original_balance" numeric
(
  10,
  2
) NOT NULL,
  "agency_name" character varying
(
  255
),
  "sent_to_collections_date" "date",
  "status" character varying
(
  50
) DEFAULT 'active':: character varying,
  "last_activity_date" "date",
  "notes" "text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."collection_account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_log"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "communication_type" character varying
(
  50
),
  "direction" character varying
(
  10
),
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "contact_type" character varying
(
  50
),
  "contact_name" character varying
(
  255
),
  "contact_details" "jsonb",
  "subject" "text",
  "content" "text",
  "attachments" "jsonb",
  "outcome" character varying
(
  100
),
  "follow_up_required" boolean DEFAULT false,
  "follow_up_date" "date",
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."communication_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cpt_code_master"
(
  "code"
  character
  varying
(
  10
) NOT NULL,
  "description" "text" NOT NULL,
  "category" character varying
(
  100
),
  "rvu_work" numeric
(
  6,
  2
),
  "rvu_practice_expense" numeric
(
  6,
  2
),
  "rvu_malpractice" numeric
(
  6,
  2
),
  "is_telemedicine_eligible" boolean DEFAULT false,
  "requires_modifier" boolean DEFAULT false,
  "typical_modifiers" character varying
(
  5
)[],
  "global_period_days" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."cpt_code_master" OWNER TO "postgres";


COMMENT
ON TABLE "public"."cpt_code_master" IS 'CPT code reference with billing rules and RVU values';



CREATE TABLE IF NOT EXISTS "public"."provider_credentialing"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "clinician_id" integer NOT NULL,
  "payer_id" integer NOT NULL,
  "state" character varying
(
  2
) NOT NULL,
  "status" character varying
(
  50
) NOT NULL,
  "notes" "text",
  "application_date" "date",
  "approval_date" "date",
  "expiration_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "team_id" "uuid"
  );


ALTER TABLE "public"."provider_credentialing" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."credentialing_status" WITH ("security_invoker"='on') AS
SELECT "cl"."npi_key",
       "cl"."first_name",
       "cl"."last_name",
       "p"."name" AS "payer_name",
       "pc"."state",
       "pc"."status",
       "pc"."expiration_date"
FROM (("public"."provider_credentialing" "pc"
  JOIN "public"."clinician" "cl" ON (("pc"."clinician_id" = "cl"."id")))
  JOIN "public"."payer" "p" ON (("pc"."payer_id" = "p"."id")));


ALTER
VIEW "public"."credentialing_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_balance"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "payer_id" integer,
  "amount" numeric
(
  10,
  2
) NOT NULL,
  "reason" character varying
(
  100
),
  "source_claim_id" character varying
(
  50
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "refund_method" character varying
(
  50
),
  "refund_date" "date",
  "refund_check_number" character varying
(
  50
),
  "notes" "text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."credit_balance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_field"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "entity_type" character varying
(
  50
) NOT NULL,
  "field_name" character varying
(
  100
) NOT NULL,
  "field_label" character varying
(
  255
),
  "field_type" character varying
(
  50
),
  "field_config" "jsonb",
  "is_required" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "display_order" integer,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."custom_field" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_field_mapping"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "ehr_connection_id" "uuid",
  "entity_type" character varying
(
  50
) NOT NULL,
  "source_path" "text" NOT NULL,
  "target_table" character varying
(
  100
),
  "target_column" character varying
(
  100
),
  "transformation_rules" "jsonb",
  "validation_rules" "jsonb",
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."custom_field_mapping" OWNER TO "postgres";


COMMENT
ON COLUMN "public"."custom_field_mapping"."transformation_rules" IS 'JSONPath transformations for non-standard data';



CREATE TABLE IF NOT EXISTS "public"."custom_field_value"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "custom_field_id" "uuid" NOT NULL,
  "entity_id" character varying
(
  100
) NOT NULL,
  "value_text" "text",
  "value_number" numeric,
  "value_date" "date",
  "value_boolean" boolean,
  "value_json" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."custom_field_value" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_metrics"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "metric_name" "text" NOT NULL,
  "metric_value" "jsonb" NOT NULL,
  "calculated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
  );


ALTER TABLE "public"."dashboard_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."denial_tracking"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying
(
  50
),
  "denial_date" "date" NOT NULL,
  "denial_type" character varying
(
  50
),
  "carc_code" character varying
(
  10
),
  "rarc_code" character varying
(
  10
),
  "denial_reason" "text",
  "financial_impact" numeric
(
  10,
  2
),
  "appealable" boolean DEFAULT true,
  "appeal_deadline" "date",
  "status" character varying
(
  50
) DEFAULT 'new':: character varying,
  "assigned_to" "uuid",
  "root_cause" character varying
(
  100
),
  "preventable" boolean,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."denial_tracking" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."denial_analytics" WITH ("security_invoker"='on') AS
SELECT "dt"."team_id",
       "p"."name"                              AS "payer_name",
       "c"."id"                                AS "claim_id",
       "c"."claim_number",
       "dt"."denial_date",
       "dt"."denial_type",
       "dt"."carc_code",
       "dt"."rarc_code",
       "arc"."description"                     AS "denial_reason",
       "dt"."financial_impact",
       "dt"."appealable",
       "dt"."preventable",
       "dt"."root_cause",
       "dt"."status"                           AS "denial_status",
       "dt"."appeal_deadline",
       CASE
         WHEN ("dt"."appeal_deadline" < CURRENT_DATE) THEN true
         ELSE false
         END                                   AS "past_deadline",
       ("dt"."appeal_deadline" - CURRENT_DATE) AS "days_until_deadline"
FROM ((("public"."denial_tracking" "dt"
  JOIN "public"."claim" "c" ON ((("dt"."claim_id")::"text" = ("c" . "id")::"text")))
       JOIN "public"."payer" "p" ON (("c"."payer_id" = "p"."id")))
     LEFT JOIN "public"."adjustment_reason_code" "arc"
ON ((("dt"."carc_code")::"text" = ("arc"."code")::"text")))
WHERE (("dt"."status")::"text" <> 'closed'::"text");


ALTER
VIEW "public"."denial_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."denial_playbook"
(
  "id"
  integer
  NOT
  NULL,
  "code"
  character
  varying
(
  50
) NOT NULL,
  "title" character varying
(
  255
) NOT NULL,
  "fix" "jsonb" NOT NULL,
  "enabled" boolean DEFAULT true,
  "notes" "text",
  "success_rate" numeric
(
  3,
  2
),
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "team_id" "uuid"
  );


ALTER TABLE "public"."denial_playbook" OWNER TO "postgres";


COMMENT
ON TABLE "public"."denial_playbook" IS 'Rules and fixes for handling claim denials automatically';



CREATE SEQUENCE IF NOT EXISTS "public"."denial_playbook_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."denial_playbook_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."denial_playbook_id_seq" OWNED BY "public"."denial_playbook"."id";



CREATE TABLE IF NOT EXISTS "public"."document"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "document_type" character varying
(
  50
),
  "file_name" character varying
(
  255
),
  "file_size" integer,
  "mime_type" character varying
(
  100
),
  "storage_path" "text",
  "metadata" "jsonb",
  "uploaded_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."document" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_template"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "template_type" character varying
(
  50
),
  "name" character varying
(
  255
) NOT NULL,
  "description" "text",
  "template_content" "text",
  "variables" "jsonb",
  "payer_specific" boolean DEFAULT false,
  "payer_id" integer,
  "version" integer DEFAULT 1,
  "is_active" boolean DEFAULT true,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."document_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dosage"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "dosage" "text" NOT NULL
  );


ALTER TABLE "public"."dosage" OWNER TO "postgres";


ALTER TABLE "public"."dosage" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."dosage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."drug_formulary"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "payer_id" integer,
  "ndc_code" character varying
(
  11
),
  "drug_name" character varying
(
  255
) NOT NULL,
  "generic_name" character varying
(
  255
),
  "therapeutic_class" character varying
(
  100
),
  "tier" integer,
  "requires_prior_auth" boolean DEFAULT false,
  "step_therapy_required" boolean DEFAULT false,
  "quantity_limit" integer,
  "quantity_days" integer,
  "preferred_alternatives" "text"[],
  "pa_criteria" "jsonb",
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."drug_formulary" OWNER TO "postgres";


COMMENT
ON TABLE "public"."drug_formulary" IS 'Payer-specific drug coverage and PA requirements';



CREATE TABLE IF NOT EXISTS "public"."ehr_connection"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "ehr_system_id" "uuid" NOT NULL,
  "connection_name" character varying
(
  255
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "environment" character varying
(
  20
) DEFAULT 'production':: character varying,
  "base_url" "text",
  "auth_config" "jsonb",
  "custom_headers" "jsonb",
  "sync_config" "jsonb",
  "last_sync_at" timestamp with time zone,
  "last_error" "text",
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."ehr_connection" OWNER TO "postgres";


COMMENT
ON TABLE "public"."ehr_connection" IS 'Connections between teams and their EHR systems';



CREATE TABLE IF NOT EXISTS "public"."ehr_system"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "name" character varying
(
  100
) NOT NULL,
  "display_name" character varying
(
  255
),
  "api_type" character varying
(
  50
),
  "fhir_version" character varying
(
  20
),
  "capabilities" "jsonb",
  "auth_method" character varying
(
  50
),
  "base_urls" "jsonb",
  "rate_limits" "jsonb",
  "documentation_url" "text",
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."ehr_system" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."eligibility_cache"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "insurance_policy_id" integer,
  "cache_key" character varying
(
  255
),
  "response_data" "jsonb",
  "is_eligible" boolean,
  "copay" numeric
(
  10,
  2
),
  "deductible_remaining" numeric
(
  10,
  2
),
  "out_of_pocket_remaining" numeric
(
  10,
  2
),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."eligibility_cache" OWNER TO "postgres";


COMMENT
ON TABLE "public"."eligibility_cache" IS 'Cached eligibility responses to reduce API calls';



CREATE TABLE IF NOT EXISTS "public"."eligibility_check"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "insurance_policy_id" integer,
  "check_type" character varying
(
  50
),
  "status" character varying
(
  50
) NOT NULL,
  "request_data" "jsonb" NOT NULL,
  "response_data" "jsonb",
  "eligibility_status" character varying
(
  50
),
  "coverage_details" "jsonb",
  "effective_date" "date",
  "termination_date" "date",
  "last_verified_at" timestamp with time zone,
  "error_message" "text",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."eligibility_check" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."era_line_detail"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "payment_detail_id" "uuid" NOT NULL,
  "claim_line_id" "uuid",
  "service_date" "date",
  "procedure_code" character varying,
  "billed_amount" numeric,
  "allowed_amount" numeric,
  "deductible" numeric,
  "coinsurance" numeric,
  "copay" numeric,
  "paid_amount" numeric,
  "adjustment_group_code" character varying,
  "adjustment_reason_codes" character varying [],
  "adjustment_amounts" numeric [],
  "remark_codes" character varying [],
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."era_line_detail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."failed_job"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "job_type" character varying
(
  100
),
  "payload" "jsonb",
  "error_message" "text",
  "error_trace" "text",
  "retry_count" integer DEFAULT 0,
  "max_retries" integer DEFAULT 3,
  "next_retry_at" timestamp with time zone,
  "failed_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."failed_job" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fee_schedule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_id" integer,
  "contract_name" character varying
(
  255
),
  "cpt_code" character varying
(
  10
) NOT NULL,
  "modifier" character varying
(
  5
),
  "allowed_amount" numeric
(
  10,
  2
),
  "percentage_of_billed" numeric
(
  5,
  2
),
  "effective_date" "date" NOT NULL,
  "termination_date" "date",
  "facility_rate" numeric
(
  10,
  2
),
  "non_facility_rate" numeric
(
  10,
  2
),
  "notes" "text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."fee_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fhir_resource"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "resource_type" character varying
(
  50
) NOT NULL,
  "resource_id" character varying
(
  255
) NOT NULL,
  "version_id" character varying
(
  50
),
  "resource_data" "jsonb" NOT NULL,
  "mapped_entity_type" character varying
(
  50
),
  "mapped_entity_id" character varying
(
  100
),
  "source_system" character varying
(
  100
),
  "last_updated" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."fhir_resource" OWNER TO "postgres";


COMMENT
ON TABLE "public"."fhir_resource" IS 'Generic storage for FHIR resources from any EHR';



CREATE TABLE IF NOT EXISTS "public"."field_mapping_template"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "name" character varying
(
  255
) NOT NULL,
  "ehr_system_id" "uuid",
  "entity_type" character varying
(
  50
),
  "mappings" "jsonb" NOT NULL,
  "transformations" "jsonb",
  "is_default" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."field_mapping_template" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."financial_performance" WITH ("security_invoker"='on') AS
SELECT "e"."team_id",
       "date_trunc"('month'::"text", ("e"."dos"):: timestamp with time zone) AS "month",
       "count"(DISTINCT "e"."id")                                            AS "total_encounters",
       "count"(DISTINCT "c"."id")                                            AS "total_claims",
       "sum"("c"."total_amount")                                             AS "gross_charges",
       "sum"("c"."paid_amount")                                              AS "collections",
       "sum"(("c"."total_amount" - COALESCE("c"."paid_amount", (0)::numeric)))  FILTER (WHERE (("c"."status")::"text" <> ALL ((ARRAY['paid'::character varying, 'void'::character varying])::"text"[]))) AS "ar_balance", "round"((
  ("sum"("c"."paid_amount") / NULLIF("sum"("c"."total_amount"), (0)::numeric)) *
  (100):: numeric), 2) AS "collection_rate",
       "count"(*)                                                               FILTER (WHERE (("c"."status")::"text" = 'denied'::"text")) AS "denials", "round"(((("count"(*) FILTER (WHERE (("c"."status")::"text" = 'denied'::"text"))):: numeric / (NULLIF ("count"(*), 0)):: numeric) * (100)::numeric), 2) AS "denial_rate",
       "avg"(EXTRACT(day FROM ("c"."paid_at" - "c"."submitted_at")))            FILTER (WHERE ("c"."paid_at" IS NOT NULL)) AS "avg_days_to_payment"
FROM ("public"."encounter" "e"
  LEFT JOIN "public"."claim" "c" ON ((("e"."id")::"text" = ("c" . "encounter_id")::"text")))
GROUP BY "e"."team_id", ("date_trunc"('month'::"text", ("e"."dos"):: timestamp with time zone));


ALTER
VIEW "public"."financial_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_document"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "template_id" "uuid",
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "merge_data" "jsonb",
  "generated_content" "text",
  "file_path" "text",
  "status" character varying
(
  50
),
  "sent_to" "text",
  "sent_at" timestamp with time zone,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."generated_document" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_report"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "report_definition_id" "uuid",
  "generated_by" "uuid",
  "status" character varying
(
  50
),
  "file_path" "text",
  "parameters_used" "jsonb",
  "row_count" integer,
  "generated_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."generated_report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."icd10_code_master"
(
  "code"
  character
  varying
(
  10
) NOT NULL,
  "description" "text" NOT NULL,
  "category" character varying
(
  100
),
  "is_billable" boolean DEFAULT true,
  "requires_additional_digit" boolean DEFAULT false,
  "parent_code" character varying
(
  10
),
  "is_active" boolean DEFAULT true,
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."icd10_code_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_policy"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  "member_id" "text" NOT NULL,
  "policyholder_first_name" "text" NOT NULL,
  "policyholder_last_name" "text" NOT NULL,
  "payer_id" bigint NOT NULL,
  "patient_id" bigint NOT NULL,
  "plan_name" "text",
  "plan_type" "text",
  "plan_status" "text",
  "member_obligation" smallint,
  "is_dependent" boolean NOT NULL,
  "out_of_network" boolean DEFAULT false,
  "canvas_coverage_id" "text",
  "policy_type" "public"."insurance_policy_type" DEFAULT 'Primary'::"public"."insurance_policy_type" NOT NULL,
  "team_id" "uuid",
  "effective_date" "date",
  "termination_date" "date",
  "group_number" character varying
  );


ALTER TABLE "public"."insurance_policy" OWNER TO "postgres";


ALTER TABLE "public"."insurance_policy" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."insurance_policy_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."intake"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"(),
  "response" "jsonb",
  "patient_id" bigint,
  "questionnaire_name" "text"
  );


ALTER TABLE "public"."intake" OWNER TO "postgres";


ALTER TABLE "public"."intake" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."intake_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integration_event_log"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "integration_type" character varying
(
  50
),
  "event_type" character varying
(
  100
),
  "request_id" character varying
(
  100
),
  "request_data" "jsonb",
  "response_data" "jsonb",
  "http_status" integer,
  "error_message" "text",
  "duration_ms" integer,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."integration_event_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_job"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "ehr_connection_id" "uuid",
  "job_type" character varying
(
  50
),
  "entity_type" character varying
(
  50
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "records_processed" integer DEFAULT 0,
  "records_failed" integer DEFAULT 0,
  "error_log" "jsonb",
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."sync_job" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "name" "text" NOT NULL,
  "slug" "text" NOT NULL,
  "description" "text",
  "logo_url" "text",
  "settings" "jsonb" DEFAULT '{}'::"jsonb",
  "plan_type" "text" DEFAULT 'basic'::"text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "tax_id" character varying,
  "npi" character varying,
  "status" character varying DEFAULT 'active':: character varying,
  "type" character varying,
  "trial_ends_at" timestamp
                         with time zone,
                           CONSTRAINT "team_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['basic'::"text", 'pro'::"text", 'enterprise'::"text"])))
  );


ALTER TABLE "public"."team" OWNER TO "postgres";


COMMENT
ON TABLE "public"."team" IS 'Healthcare organizations/practices using the platform';



CREATE
OR REPLACE VIEW "public"."integration_health" WITH ("security_invoker"='on') AS
SELECT "ec"."id"     AS   "connection_id",
       "t"."name"    AS   "team_name",
       "es"."name"   AS   "ehr_system",
       "ec"."status" AS   "connection_status",
       "ec"."last_sync_at",
       "ec"."last_error",
       "count"("sj"."id") FILTER (WHERE ((("sj"."status")::"text" = 'failed'::"text") AND ("sj"."created_at" > ("now"() - '24:00:00'::interval)))) AS "recent_failures", "count"("sj"."id") FILTER (WHERE ((("sj"."status")::"text" = 'completed'::"text") AND ("sj"."created_at" > ("now"() - '24:00:00'::interval)))) AS "recent_successes"
FROM ((("public"."ehr_connection" "ec"
  JOIN "public"."team" "t" ON (("ec"."team_id" = "t"."id")))
  JOIN "public"."ehr_system" "es" ON (("ec"."ehr_system_id" = "es"."id")))
  LEFT JOIN "public"."sync_job" "sj" ON (("sj"."ehr_connection_id" = "ec"."id")))
GROUP BY "ec"."id", "t"."name", "es"."name", "ec"."status", "ec"."last_sync_at", "ec"."last_error";


ALTER
VIEW "public"."integration_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_definition"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "kpi_name" character varying
(
  255
) NOT NULL,
  "category" character varying
(
  50
),
  "calculation_sql" "text",
  "target_value" numeric
(
  10,
  2
),
  "unit_of_measure" character varying
(
  50
),
  "frequency" character varying
(
  20
),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."kpi_definition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_snapshot"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "kpi_definition_id" "uuid",
  "period_start" "date" NOT NULL,
  "period_end" "date" NOT NULL,
  "actual_value" numeric
(
  10,
  2
),
  "target_value" numeric
(
  10,
  2
),
  "variance" numeric
(
  10,
  2
),
  "trend" character varying
(
  20
),
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."kpi_snapshot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_history"
(
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "patient_id" bigint NOT NULL,
  "allergies" "text",
  "medical_conditions" "text",
  "current_medications" "text"
  );


ALTER TABLE "public"."medical_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "name" "text",
  "display_name" "text",
  "type" "text"
  );


ALTER TABLE "public"."medication" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication_dosage"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "medication_id" bigint,
  "dosage_id" bigint,
  "active" boolean,
  "national_drug_code" "text",
  "dosespot_ndc" "text",
  "designator_id" "text",
  "aps_drug_id" bigint
  );


ALTER TABLE "public"."medication_dosage" OWNER TO "postgres";


ALTER TABLE "public"."medication_dosage" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."medication_dosage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."medication" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."medication_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."medication_quantity"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "medication_dosage_id" bigint,
  "quantity_id" bigint,
  "active" boolean,
  "price" numeric
  );


ALTER TABLE "public"."medication_quantity" OWNER TO "postgres";


ALTER TABLE "public"."medication_quantity" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."medication_quantity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ml_model_metrics"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "model_name" character varying
(
  100
) NOT NULL,
  "model_version" character varying
(
  50
),
  "metric_type" character varying
(
  50
),
  "metric_value" numeric
(
  10,
  4
),
  "evaluation_period_start" "date",
  "evaluation_period_end" "date",
  "sample_size" integer,
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."ml_model_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ml_prediction"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "model_name" character varying
(
  100
) NOT NULL,
  "model_version" character varying
(
  50
),
  "entity_type" character varying
(
  50
) NOT NULL,
  "entity_id" character varying
(
  100
) NOT NULL,
  "prediction_type" character varying
(
  50
),
  "prediction_value" "jsonb" NOT NULL,
  "confidence_score" numeric
(
  3,
  2
),
  "feature_importance" "jsonb",
  "explanation" "text",
  "prediction_timestamp" timestamp with time zone DEFAULT "now"(),
  "used_in_decision" boolean DEFAULT false,
  "outcome_recorded" boolean DEFAULT false,
  "actual_outcome" "jsonb",
  "created_at" timestamp
                                   with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."ml_prediction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modifier_code"
(
  "code"
  character
  varying
(
  5
) NOT NULL,
  "description" "text" NOT NULL,
  "pricing_impact" numeric
(
  5,
  2
) DEFAULT 0,
  "requires_documentation" boolean DEFAULT false,
  "modifier_type" character varying
(
  20
),
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."modifier_code" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."my_clerk_sync_status" WITH ("security_invoker"='on') AS
SELECT "clerk_user_id",
       "organization_id",
       "sync_status",
       "last_synced_at",
       CASE
         WHEN ("last_synced_at" > ("now"() - '01:00:00'::interval)) THEN 'current'::"text"
         WHEN ("last_synced_at" > ("now"() - '1 day'::interval)) THEN 'recent'::"text"
         ELSE 'stale'::"text"
         END AS "sync_freshness"
FROM "public"."clerk_user_sync"
WHERE ("supabase_user_id" = "auth"."uid"());


ALTER
VIEW "public"."my_clerk_sync_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "team_member_id" "uuid",
  "template_id" "uuid",
  "type" character varying
(
  50
),
  "recipient" "text",
  "subject" "text",
  "body" "text",
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "sent_at" timestamp with time zone,
  "error_message" "text",
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."notification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_template"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "name" character varying
(
  255
) NOT NULL,
  "type" character varying
(
  50
),
  "event_type" character varying
(
  100
),
  "subject" "text",
  "body_template" "text",
  "variables" "jsonb",
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."notification_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pa_clinical_criteria"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "payer_id" integer,
  "service_type" character varying
(
  50
),
  "code" character varying
(
  20
),
  "criteria_name" character varying
(
  255
),
  "icd10_requirements" character varying
(
  10
)[],
  "age_min" integer,
  "age_max" integer,
  "gender" "public"."gender",
  "clinical_requirements" "jsonb",
  "documentation_required" "text"[],
  "auto_approve_if_met" boolean DEFAULT false,
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."pa_clinical_criteria" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."pa_pipeline" WITH ("security_invoker"='on') AS
SELECT "pa"."team_id",
       "pa"."id"                                                AS "pa_id",
       "pa"."status",
       "p"."name"                                               AS "payer_name",
       (("pt"."first_name" || ' '::"text") || "pt"."last_name") AS "patient_name",
       "pa"."medication",
       "pa"."indication",
       "pa"."quantity",
       "pa"."duration_days",
       "pa"."submitted_at",
       "pa"."approved_at",
       "pa"."denied_at",
       "pa"."auth_number",
       "pa"."confidence",
       "pa"."auto_approved",
       (CURRENT_DATE - ("pa"."created_at")::"date")             AS "days_pending",
       CASE
         WHEN (("pa"."status")::"text" = 'submitted'::"text") THEN (CURRENT_DATE - ("pa"."submitted_at")::"date")
            ELSE NULL::integer
END
AS "days_in_review"
   FROM ((("public"."prior_auth" "pa"
     JOIN "public"."patient" "pat" ON (("pa"."patient_id" = "pat"."id")))
     JOIN "public"."patient_profile" "pt" ON (("pat"."profile_id" = "pt"."id")))
     LEFT JOIN "public"."payer" "p" ON (("pa"."payer_id" = "p"."id")))
  WHERE (("pa"."status")::"text" <> ALL ((ARRAY['approved'::character varying, 'denied'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[]));


ALTER
VIEW "public"."pa_pipeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pa_requirement_rule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "payer_id" integer,
  "cpt_code" character varying,
  "icd10_code" character varying,
  "requires_pa" boolean DEFAULT true,
  "lookback_days" integer,
  "auto_submit" boolean DEFAULT false,
  "rule_logic" "jsonb",
  "effective_date" "date",
  "termination_date" "date",
  "priority" integer DEFAULT 50,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  CONSTRAINT "chk_pa_rule_dates" CHECK
(
  (
(
  "termination_date"
  IS
  NULL
) OR
(
  "effective_date"
  IS
  NULL
) OR
(
  "termination_date" >
  "effective_date"
)))
  );


ALTER TABLE "public"."pa_requirement_rule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pa_supporting_document"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "prior_auth_id" character varying NOT NULL,
  "document_type" character varying,
  "file_path" "text",
  "file_name" character varying,
  "mime_type" character varying,
  "uploaded_at" timestamp with time zone DEFAULT "now"(),
  "uploaded_by" "uuid",
  "created_at" timestamp
                          with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."pa_supporting_document" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_payment"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "payment_plan_id" "uuid",
  "amount" numeric
(
  10,
  2
) NOT NULL,
  "payment_method" character varying
(
  50
),
  "transaction_id" character varying
(
  100
),
  "reference_number" character varying
(
  100
),
  "applied_to_claims" character varying
(
  50
)[],
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "processed_at" timestamp with time zone,
  "notes" "text",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."patient_payment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_statement"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "statement_date" "date" NOT NULL,
  "due_date" "date",
  "total_balance" numeric
(
  10,
  2
) NOT NULL,
  "insurance_pending" numeric
(
  10,
  2
) DEFAULT 0,
  "patient_responsibility" numeric
(
  10,
  2
) NOT NULL,
  "previous_balance" numeric
(
  10,
  2
) DEFAULT 0,
  "payments_received" numeric
(
  10,
  2
) DEFAULT 0,
  "new_charges" numeric
(
  10,
  2
) DEFAULT 0,
  "statement_number" character varying
(
  50
),
  "sent_method" character varying
(
  50
),
  "sent_at" timestamp with time zone,
  "viewed_at" timestamp with time zone,
                          "status" character varying (50) DEFAULT 'pending':: character varying,
  "created_at" timestamp
                        with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."patient_statement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_detail"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "remittance_advice_id" "uuid",
  "claim_id" character varying
(
  50
),
  "patient_id" integer,
  "service_date" "date",
  "cpt_code" character varying
(
  10
),
  "billed_amount" numeric
(
  10,
  2
),
  "allowed_amount" numeric
(
  10,
  2
),
  "paid_amount" numeric
(
  10,
  2
),
  "patient_responsibility" numeric
(
  10,
  2
),
  "deductible_amount" numeric
(
  10,
  2
),
  "coinsurance_amount" numeric
(
  10,
  2
),
  "copay_amount" numeric
(
  10,
  2
),
  "adjustment_codes" "jsonb",
  "adjustment_reasons" "text"[],
  "status" character varying
(
  50
),
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."payment_detail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_plan"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "total_amount" numeric
(
  10,
  2
) NOT NULL,
  "down_payment" numeric
(
  10,
  2
) DEFAULT 0,
  "monthly_payment" numeric
(
  10,
  2
) NOT NULL,
  "number_of_payments" integer NOT NULL,
  "payments_made" integer DEFAULT 0,
  "start_date" "date" NOT NULL,
  "next_payment_date" "date",
  "status" character varying
(
  50
) DEFAULT 'active':: character varying,
  "auto_charge" boolean DEFAULT false,
  "payment_method_token" "text",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."payment_plan" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."patient_balance_summary" WITH ("security_invoker"='on') AS
SELECT "pat"."team_id",
       "pat"."id"                                                                                           AS "patient_id",
       (("pp"."first_name" || ' '::"text") || "pp"."last_name")                                             AS "patient_name",
       "pp"."email",
       "pp"."phone",
       "count"(DISTINCT "c"."id")                                                                           AS "open_claims",
       "sum"("pd"."patient_responsibility")                                                                 AS "total_patient_responsibility",
       "sum"("pay"."amount")                                                                                   FILTER (WHERE (("pay"."status")::"text" = 'processed'::"text")) AS "total_paid", (
  "sum"("pd"."patient_responsibility") -
  COALESCE("sum"("pay"."amount") FILTER(WHERE (("pay"."status")::"text" = 'processed'::"text")), (0)::numeric)) AS "current_balance",
       "max"("ps"."statement_date")                                                                         AS "last_statement_date",
       "count"("ps"."id")                                                                                   AS "statements_sent",
       "max"("pay"."processed_at")                                                                          AS "last_payment_date",
       (EXISTS (SELECT 1
                FROM "public"."payment_plan" "pl"
                WHERE (("pl"."patient_id" = "pat"."id") AND (("pl"."status")::"text" = 'active'::"text")))) AS "has_payment_plan"
FROM (((((("public"."patient" "pat"
  JOIN "public"."patient_profile" "pp" ON (("pat"."profile_id" = "pp"."id")))
  LEFT JOIN "public"."encounter" "e" ON (("pat"."id" = "e"."patient_id")))
  LEFT JOIN "public"."claim" "c"
         ON (((("e"."id")::"text" = ("c" . "encounter_id")::"text") AND (("c"."status")::"text" <> ALL ((ARRAY['void'::character varying, 'denied'::character varying])::"text"[])))))
       LEFT JOIN "public"."payment_detail" "pd" ON ((("c"."id")::"text" = ("pd"."claim_id")::"text")))
  LEFT JOIN "public"."patient_payment" "pay"
ON (("pat"."id" = "pay"."patient_id")))
  LEFT JOIN "public"."patient_statement" "ps" ON (("pat"."id" = "ps"."patient_id")))
GROUP BY "pat"."team_id", "pat"."id", "pp"."first_name", "pp"."last_name", "pp"."email", "pp"."phone"
HAVING (("sum"("pd"."patient_responsibility") - COALESCE ("sum"("pay"."amount") FILTER (WHERE (("pay"."status")::"text" = 'processed'::"text"))
     , (0):: numeric))
     > (0):: numeric);


ALTER
VIEW "public"."patient_balance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_diagnosis"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "patient_id" bigint,
  "name" "text",
  "ICD_10" "text",
  "condition_external_id" "text",
  "status" "text"
  );


ALTER TABLE "public"."patient_diagnosis" OWNER TO "postgres";


ALTER TABLE "public"."patient_diagnosis" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."patient_diagnosis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."patient_document"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "document_type" character varying
(
  50
),
  "document_name" character varying
(
  255
),
  "file_path" "text",
  "file_size" integer,
  "mime_type" character varying
(
  100
),
  "expiration_date" "date",
  "is_active" boolean DEFAULT true,
  "verified" boolean DEFAULT false,
  "verified_by" "uuid",
  "verified_at" timestamp with time zone,
  "metadata" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."patient_document" OWNER TO "postgres";


ALTER TABLE "public"."patient" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."patient_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."patient_pharmacy"
(
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
),
  "patient_id" bigint NOT NULL,
  "pharmacy" "text",
  "name" "text",
  "dosespot_pharmacy_id" bigint
  );


ALTER TABLE "public"."patient_pharmacy" OWNER TO "postgres";


ALTER TABLE "public"."patient_profile" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."patient_profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."patient_quality_measure"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "quality_measure_id" "uuid",
  "reporting_period_start" "date",
  "reporting_period_end" "date",
  "in_denominator" boolean DEFAULT false,
  "in_numerator" boolean DEFAULT false,
  "excluded" boolean DEFAULT false,
  "gap_in_care" boolean DEFAULT false,
  "last_service_date" "date",
  "next_due_date" "date",
  "status" character varying
(
  50
),
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."patient_quality_measure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer_config"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_id" integer NOT NULL,
  "config_type" character varying NOT NULL,
  "timely_filing_days" integer,
  "auto_submit_claims" boolean DEFAULT false,
  "auto_submit_pa" boolean DEFAULT false,
  "eligibility_cache_hours" integer DEFAULT 72,
  "submission_batch_size" integer,
  "submission_schedule" character varying,
  "special_rules" "jsonb",
  "portal_config" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  CONSTRAINT "chk_timely_filing_days" CHECK
(
  (
(
  "timely_filing_days"
  IS
  NULL
) OR
(
  "timely_filing_days" >
  0
)))
  );


ALTER TABLE "public"."payer_config" OWNER TO "postgres";


ALTER TABLE "public"."payer" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."payer_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE
OR REPLACE VIEW "public"."payer_performance" WITH ("security_invoker"='on') AS
SELECT "c"."team_id",
       "p"."id"                                                                                                     AS "payer_id",
       "p"."name"                                                                                                   AS "payer_name",
       "count"(*)                                                                                                   AS "total_claims",
       "count"(*)                                                                                                      FILTER (WHERE (("c"."status")::"text" = 'paid'::"text")) AS "paid_claims", "count"(*) FILTER (WHERE (("c"."status")::"text" = 'denied'::"text")) AS "denied_claims", "round"(((("count"(*) FILTER (WHERE (("c"."status")::"text" = 'denied'::"text"))):: numeric / (NULLIF ("count"(*), 0)):: numeric) * (100)::numeric), 2) AS "denial_rate",
       "sum"("c"."total_amount")                                                                                    AS "total_billed",
       "sum"("c"."paid_amount")                                                                                     AS "total_paid",
       "round"((("sum"("c"."paid_amount") / NULLIF("sum"("c"."total_amount"), (0)::numeric)) *
                (100):: numeric), 2)                                                                                AS "collection_rate",
       "avg"(EXTRACT(day FROM ("c"."paid_at" - "c"."submitted_at")))                                                   FILTER (WHERE ("c"."paid_at" IS NOT NULL)) AS "avg_days_to_payment", "count"(*) FILTER (WHERE (("c"."status")::"text" = ANY ((ARRAY['submitted'::character varying, 'in_review'::character varying])::"text"[]))) AS "claims_in_flight"
FROM ("public"."claim" "c"
  JOIN "public"."payer" "p" ON (("c"."payer_id" = "p"."id")))
GROUP BY "c"."team_id", "p"."id", "p"."name";


ALTER
VIEW "public"."payer_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer_portal_credential"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_id" integer,
  "portal_url" "text" NOT NULL,
  "username" "text",
  "password" "text",
  "security_questions" "jsonb",
  "mfa_enabled" boolean DEFAULT false,
  "last_successful_login" timestamp with time zone,
  "automation_enabled" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."payer_portal_credential" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer_response_message"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "message_type" character varying
(
  50
),
  "code" character varying
(
  20
),
  "message" "text",
  "action_required" boolean DEFAULT false,
  "resolved" boolean DEFAULT false,
  "resolved_by" "uuid",
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."payer_response_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payer_submission_config"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "payer_id" integer,
  "claim_type" "text",
  "required_attachments" "text"[],
  "submission_method" "text",
  "portal_url" "text",
  "api_endpoint" "text",
  "special_instructions" "jsonb"
  );


ALTER TABLE "public"."payer_submission_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_adjustment"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying,
  "payment_detail_id" "uuid",
  "adjustment_type" character varying,
  "amount" numeric NOT NULL,
  "reason_code" character varying,
  "reason_description" "text",
  "posted_by" "uuid",
  "posted_at" timestamp with time zone DEFAULT "now"(),
  "reversed" boolean DEFAULT false,
  "reversed_at" timestamp with time zone,
  "created_at" timestamp
                        with time zone DEFAULT "now"(),
  CONSTRAINT "chk_payment_adjustment_amount" CHECK
(
  (
  "amount"
  <>
(
  0
):: numeric))
  );


ALTER TABLE "public"."payment_adjustment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_posting_session"
(
  "id"
  "uuid"
  NOT
  NULL,
  "started_at"
  timestamp
  with
  time
  zone,
  "completed_at"
  timestamp
  with
  time
  zone,
  "posted_by"
  "uuid",
  "era_file_name"
  "text",
  "payments_posted"
  integer,
  "total_posted"
  numeric,
  "exceptions"
  "jsonb",
  "team_id"
  "uuid"
);


ALTER TABLE "public"."payment_posting_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_member"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "team_id" "uuid",
  "user_id" "uuid",
  "role" "text" DEFAULT 'member'::"text" NOT NULL,
  "status" "text" DEFAULT 'active'::"text" NOT NULL,
  "invited_by" "uuid",
  "invited_at" timestamp with time zone DEFAULT "now"(),
  "joined_at" timestamp with time zone,
  "created_at" timestamp
                         with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "permissions" "jsonb" DEFAULT '{}'::"jsonb",
  "last_login_at" timestamp
                         with time zone,
                           "mfa_enabled" boolean DEFAULT false,
                           CONSTRAINT "team_member_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'coordinator'::"text", 'reviewer'::"text", 'member'::"text"]))),
  CONSTRAINT "team_member_status_check" CHECK
(
  (
  "status" =
  ANY (
  ARRAY
[
  'active'
  :
  :
  "text",
  'pending'
  :
  :
  "text",
  'suspended'
  :
  :
  "text"]
)))
  );


ALTER TABLE "public"."team_member" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."payment_posting_activity" WITH ("security_invoker"='on') AS
SELECT "ps"."id",
       "ps"."started_at",
       "ps"."completed_at",
       "ps"."posted_by",
       "ps"."era_file_name",
       "ps"."payments_posted",
       "ps"."total_posted",
       "ps"."exceptions",
       "ps"."team_id",
       "tm"."user_id",
       "up"."email"                                             AS "posted_by_email",
       (("up"."first_name" || ' '::"text") || "up"."last_name") AS "posted_by_name"
FROM (("public"."payment_posting_session" "ps"
  JOIN "public"."team_member" "tm" ON (("tm"."user_id" = "ps"."posted_by")))
  LEFT JOIN "public"."user_profile" "up" ON (("up"."id" = "ps"."posted_by")));


ALTER
VIEW "public"."payment_posting_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_reconciliation"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "claim_id" character varying
(
  50
),
  "expected_amount" numeric
(
  10,
  2
),
  "received_amount" numeric
(
  10,
  2
),
  "variance_amount" numeric
(
  10,
  2
),
  "variance_reason" character varying
(
  100
),
  "reconciliation_status" character varying
(
  50
),
  "requires_appeal" boolean DEFAULT false,
  "notes" "text",
  "reconciled_by" "uuid",
  "reconciled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."payment_reconciliation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_variance"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "claim_id" character varying,
  "expected_amount" numeric,
  "paid_amount" numeric,
  "variance_amount" numeric,
  "variance_reason" "text",
  "action_required" "text",
  "team_id" "uuid"
  );


ALTER TABLE "public"."payment_variance" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."payment_variance_summary" WITH ("security_invoker"='on') AS
SELECT "p"."name"                    AS "payer_name",
       "count"("pv"."id")            AS "variance_count",
       "sum"("pv"."variance_amount") AS "total_variance",
       "avg"("pv"."variance_amount") AS "avg_variance",
       "sum"(
         CASE
           WHEN ("pv"."action_required" = 'appeal'::"text") THEN 1
           ELSE 0
           END)                      AS "appeals_needed"
FROM (("public"."payment_variance" "pv"
  JOIN "public"."claim" "c" ON ((("pv"."claim_id")::"text" = ("c" . "id")::"text")))
     JOIN "public"."payer" "p"
ON (("c"."payer_id" = "p"."id")))
GROUP BY "p"."id", "p"."name";


ALTER
VIEW "public"."payment_variance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phi_export_log"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "exported_at" timestamp with time zone DEFAULT "now"(),
  "exported_by" "uuid",
  "export_type" "text",
  "record_count" integer,
  "entity_types" "text"[],
  "purpose" "text",
  "ip_address" "inet"
  );


ALTER TABLE "public"."phi_export_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."place_of_service"
(
  "code"
  character
  varying
(
  2
) NOT NULL,
  "name" character varying
(
  100
) NOT NULL,
  "description" "text",
  "facility_pricing" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."place_of_service" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_automation_task"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_portal_id" "uuid",
  "task_type" character varying
(
  50
),
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "retry_count" integer DEFAULT 0,
  "last_error" "text",
  "result_data" "jsonb",
  "scheduled_at" timestamp with time zone,
  "executed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."portal_automation_task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "patient_id" bigint,
  "clinician_id" bigint,
  "status" "text",
  "dispense_quantity" numeric,
  "duration_in_days" bigint,
  "unit" "text",
  "pharmacy" "text",
  "dosage_instructions" "text",
  "medication" "text",
  "note" "text",
  "medication_id" "text",
  "national_drug_code" "text",
  "dosespot_prescription_id" bigint,
  "dosespot_prescription_status" "text",
  "order_name" "text",
  "is_injectable" boolean,
  "expires_on" "date"
  );


ALTER TABLE "public"."prescription" OWNER TO "postgres";


ALTER TABLE "public"."prescription" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."prescription_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."prescription_request"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "patient_id" bigint,
  "clinician_id" bigint,
  "status" "text",
  "region" "text",
  "medication_quantity_id" bigint,
  "note" "text",
  "specific_medication" "text",
  "is_adjustment" boolean,
  "dosespot_prescription_id" bigint,
  "type" "text",
  "quantity" smallint,
  "number_of_month_requested" smallint
  );


ALTER TABLE "public"."prescription_request" OWNER TO "postgres";


ALTER TABLE "public"."prescription_request" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."prescription_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE
OR REPLACE VIEW "public"."prior_auth_metrics" WITH ("security_invoker"='on') AS
SELECT "week",
       "total_pas",
       "approved",
       "auto_approved",
       "avg_confidence",
       "avg_turnaround_days"
FROM "public"."_internal_prior_auth_metrics"
WHERE ("team_id" = "public"."get_auth_team_id"());


ALTER
VIEW "public"."prior_auth_metrics" OWNER TO "postgres";


COMMENT
ON VIEW "public"."prior_auth_metrics" IS 'Secure view that automatically filters by current team. Safe for direct access.';



CREATE TABLE IF NOT EXISTS "public"."provider_enrollment"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "clinician_id" integer,
  "payer_id" integer,
  "enrollment_type" character varying
(
  50
),
  "enrollment_status" character varying
(
  50
),
  "effective_date" "date",
  "termination_date" "date",
  "revalidation_date" "date",
  "enrollment_id" character varying
(
  100
),
  "is_par" boolean DEFAULT true,
  "can_bill" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."provider_enrollment" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."provider_productivity" WITH ("security_invoker"='on') AS
SELECT "e"."team_id",
       "cl"."id"                                                                                                    AS "provider_id",
       (("cl"."first_name" || ' '::"text") || "cl"."last_name")                                                     AS "provider_name",
       "cl"."npi_key",
       "count"(DISTINCT "e"."id")                                                                                   AS "total_encounters",
       "count"(DISTINCT "e"."patient_id")                                                                           AS "unique_patients",
       "sum"("c"."total_amount")                                                                                    AS "total_charges",
       "sum"("c"."paid_amount")                                                                                     AS "total_collections",
       "round"((("sum"("c"."paid_amount") / NULLIF("sum"("c"."total_amount"), (0)::numeric)) *
                (100):: numeric), 2)                                                                                AS "collection_rate",
       "count"(*)                                                                                                      FILTER (WHERE (("c"."status")::"text" = 'denied'::"text")) AS "denied_claims", "date_trunc"('month'::"text", ("e"."dos"):: timestamp with time zone) AS "month"
FROM (("public"."encounter" "e"
  JOIN "public"."clinician" "cl" ON (("e"."rendering_clinician_id" = "cl"."id")))
  LEFT JOIN "public"."claim" "c" ON ((("e"."id")::"text" = ("c" . "encounter_id")::"text")))
GROUP BY "e"."team_id", "cl"."id", "cl"."first_name", "cl"."last_name", "cl"."npi_key", ("date_trunc"('month'::"text", ("e"."dos"):: timestamp with time zone));


ALTER
VIEW "public"."provider_productivity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_schedule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "provider_id" integer,
  "service_location_id" character varying
(
  50
),
  "day_of_week" integer,
  "start_time" time without time zone NOT NULL,
  "end_time" time
                    without time zone NOT NULL,
  "slot_duration_minutes" integer DEFAULT 15,
  "effective_date" "date",
  "termination_date" "date",
  "created_at" timestamp
                    with time zone DEFAULT "now"(),
  "updated_at" timestamp
                    with time zone DEFAULT "now"(),
  CONSTRAINT "provider_schedule_day_of_week_check" CHECK
(
  (
(
  "day_of_week"
  >=
  0
) AND
(
  "day_of_week"
  <=
  6
)))
  );


ALTER TABLE "public"."provider_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quality_measure"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "measure_id" character varying
(
  50
) NOT NULL,
  "measure_name" character varying
(
  255
),
  "measure_type" character varying
(
  50
),
  "description" "text",
  "numerator_criteria" "jsonb",
  "denominator_criteria" "jsonb",
  "exclusion_criteria" "jsonb",
  "reporting_period_start" "date",
  "reporting_period_end" "date",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."quality_measure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantity"
(
  "id"
  bigint
  NOT
  NULL,
  "created_at"
  timestamp
  with
  time
  zone
  DEFAULT
  "now"
(
) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "quantity" numeric NOT NULL
  );


ALTER TABLE "public"."quantity" OWNER TO "postgres";


ALTER TABLE "public"."quantity" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."quantity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rate_limit_bucket"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "identifier" character varying
(
  255
) NOT NULL,
  "bucket_type" character varying
(
  50
),
  "window_start" timestamp with time zone NOT NULL,
  "request_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."rate_limit_bucket" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "patient_id" integer,
  "referring_provider_id" integer,
  "referred_to_provider_npi" character varying
(
  10
),
  "referred_to_provider_name" character varying
(
  255
),
  "referral_type" character varying
(
  50
),
  "specialty" character varying
(
  100
),
  "reason_for_referral" "text",
  "urgency" character varying
(
  50
),
  "authorization_number" character varying
(
  100
),
  "expiration_date" "date",
  "visits_authorized" integer,
  "visits_used" integer DEFAULT 0,
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."referral" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."remittance_advice"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "payer_id" integer,
  "check_number" character varying
(
  50
),
  "payment_date" "date" NOT NULL,
  "payment_amount" numeric
(
  10,
  2
) NOT NULL,
  "payment_method" character varying
(
  50
),
  "era_file_path" "text",
  "raw_era_data" "text",
  "parsed_data" "jsonb",
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "auto_posted" boolean DEFAULT false,
  "discrepancies" "jsonb",
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."remittance_advice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_definition"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid",
  "name" character varying
(
  255
) NOT NULL,
  "description" "text",
  "report_type" character varying
(
  50
),
  "query_template" "text",
  "parameters" "jsonb",
  "schedule_config" "jsonb",
  "output_format" character varying
(
  20
),
  "is_public" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."report_definition" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."revenue_cycle_metrics" WITH ("security_invoker"='on') AS
SELECT "month",
       "total_claims",
       "paid_claims",
       "total_billed",
       "total_collected",
       "avg_days_to_payment",
       "denied_amount"
FROM "public"."_internal_revenue_cycle_metrics"
WHERE ("team_id" = "public"."get_auth_team_id"());


ALTER
VIEW "public"."revenue_cycle_metrics" OWNER TO "postgres";


COMMENT
ON VIEW "public"."revenue_cycle_metrics" IS 'Secure view that automatically filters by current team. Safe for direct access.';



CREATE TABLE IF NOT EXISTS "public"."rule_execution_log"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "business_rule_id" "uuid",
  "entity_type" character varying
(
  50
),
  "entity_id" character varying
(
  100
),
  "execution_result" character varying
(
  50
),
  "execution_details" "jsonb",
  "execution_time_ms" integer,
  "executed_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."rule_execution_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scrubbing_result"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "entity_type" character varying NOT NULL,
  "entity_id" character varying NOT NULL,
  "rule_name" character varying NOT NULL,
  "severity" character varying,
  "message" "text",
  "field_path" character varying,
  "suggested_fix" "jsonb",
  "auto_fixable" boolean DEFAULT false,
  "fixed" boolean DEFAULT false,
  "fixed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."scrubbing_result" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "user_id" "uuid",
  "team_id" "uuid",
  "attempted_action" character varying
(
  100
),
  "blocked" boolean DEFAULT true,
  "error_message" "text",
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


COMMENT
ON TABLE "public"."security_audit_log" IS 'Immutable security audit log. Only admins can read, no one can update/delete. Tracks security events and access attempts.';



CREATE TABLE IF NOT EXISTS "public"."service_location"
(
  "id"
  character
  varying
(
  50
) NOT NULL,
  "name" character varying
(
  255
) NOT NULL,
  "pos_code" character varying
(
  2
) NOT NULL,
  "address_line1" character varying
(
  255
),
  "address_line2" character varying
(
  255
),
  "city" character varying
(
  100
),
  "state" character varying
(
  2
),
  "zip_code" character varying
(
  10
),
  "npi" character varying
(
  10
),
  "tax_id" character varying
(
  20
),
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"(),
  "team_id" "uuid"
  );


ALTER TABLE "public"."service_location" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings"
(
  "key"
  character
  varying
(
  100
) NOT NULL,
  "value" "jsonb" NOT NULL,
  "description" "text",
  "updated_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_invitation"
(
  "id"
  "uuid"
  DEFAULT
  "gen_random_uuid"
(
) NOT NULL,
  "team_id" "uuid",
  "email" "text" NOT NULL,
  "role" "text" DEFAULT 'member'::"text" NOT NULL,
  "invited_by" "uuid",
  "token" "text" DEFAULT "encode"
(
  "extensions"
  .
  "gen_random_bytes"
(
  32
), 'hex'::"text") NOT NULL,
  "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days':: interval),
  "accepted_at" timestamp with time zone,
  "created_at" timestamp
                         with time zone DEFAULT "now"(),
  "team_member_id" "uuid",
  CONSTRAINT "team_invitation_role_check" CHECK
(
  (
  "role" =
  ANY (
  ARRAY
[
  'admin'
  :
  :
  "text",
  'coordinator'
  :
  :
  "text",
  'reviewer'
  :
  :
  "text",
  'member'
  :
  :
  "text"]
)))
  );


ALTER TABLE "public"."team_invitation" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."team_metrics" WITH ("security_invoker"='on') AS
SELECT "t"."id"                    AS "team_id",
       "t"."name"                  AS "team_name",
       "count"(DISTINCT "c"."id")  AS "total_claims",
       "count"(DISTINCT "c"."id")     FILTER (WHERE (("c"."status")::"text" = 'paid'::"text")) AS "paid_claims", "count"(DISTINCT "c"."id") FILTER (WHERE (("c"."status")::"text" = ANY (ARRAY[('rejected_277ca'::character varying)::"text", ('denied'::character varying)::"text"]))) AS "denied_claims", "count"(DISTINCT "pa"."id") AS "total_prior_auths",
       "count"(DISTINCT "pa"."id")    FILTER (WHERE (("pa"."status")::"text" = 'approved'::"text")) AS "approved_prior_auths", "avg"("c"."confidence") AS "avg_automation_confidence",
       "count"(DISTINCT "tm"."id") AS "total_users",
       "max"("sj"."completed_at")  AS "last_sync_date"
FROM (((("public"."team" "t"
  LEFT JOIN "public"."team_member" "tm" ON (("t"."id" = "tm"."team_id")))
  LEFT JOIN "public"."claim" "c" ON (("c"."team_id" = "t"."id")))
  LEFT JOIN "public"."prior_auth" "pa" ON (("pa"."team_id" = "t"."id")))
  LEFT JOIN "public"."sync_job" "sj"
      ON ((("sj"."team_id" = "t"."id") AND (("sj"."status")::"text" = 'completed'::"text"))))
GROUP BY "t"."id", "t"."name";


ALTER
VIEW "public"."team_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_settings"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "key" character varying
(
  100
) NOT NULL,
  "value" "jsonb" NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."team_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_partner"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "partner_name" character varying
(
  255
) NOT NULL,
  "partner_type" character varying
(
  50
),
  "edi_sender_id" character varying
(
  50
),
  "edi_receiver_id" character varying
(
  50
),
  "isa_qualifier" character varying
(
  2
),
  "test_mode" boolean DEFAULT false,
  "supported_transactions" character varying
(
  10
)[],
  "connection_method" character varying
(
  50
),
  "connection_config" "jsonb",
  "active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."trading_partner" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_config"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "ehr_connection_id" "uuid",
  "event_type" character varying
(
  100
),
  "target_url" "text" NOT NULL,
  "secret_key" "text",
  "headers" "jsonb",
  "retry_config" "jsonb",
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."webhook_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_event"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "webhook_config_id" "uuid",
  "event_type" character varying
(
  100
),
  "payload" "jsonb",
  "response_status" integer,
  "response_body" "text",
  "attempt_count" integer DEFAULT 1,
  "next_retry_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."webhook_event" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."webhook_health_monitor" WITH ("security_invoker"='on') AS
SELECT "date_trunc"('hour'::"text", "processed_at") AS "hour",
       "event_type",
       "count"(*)                                   AS "event_count",
       "count"(
         CASE
           WHEN ("error_message" IS NOT NULL) THEN 1
           ELSE NULL:: integer
         END)                                       AS "error_count"
FROM "public"."clerk_webhook_log"
WHERE ("processed_at" > ("now"() - '7 days'::interval))
GROUP BY ("date_trunc"('hour'::"text", "processed_at")), "event_type"
ORDER BY ("date_trunc"('hour'::"text", "processed_at")) DESC, "event_type";


ALTER
VIEW "public"."webhook_health_monitor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_queue"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "queue_type" character varying
(
  50
) NOT NULL,
  "priority" integer DEFAULT 50,
  "status" character varying
(
  50
) DEFAULT 'pending':: character varying,
  "entity_type" character varying
(
  50
) NOT NULL,
  "entity_id" character varying
(
  100
) NOT NULL,
  "assigned_to" "uuid",
  "title" "text" NOT NULL,
  "description" "text",
  "due_date" timestamp with time zone,
  "sla_deadline" timestamp with time zone,
  "auto_escalate" boolean DEFAULT false,
  "metadata" "jsonb",
  "assigned_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."work_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_queue_assignment_rule"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "queue_type" character varying
(
  50
) NOT NULL,
  "rule_name" character varying
(
  255
) NOT NULL,
  "conditions" "jsonb" NOT NULL,
  "assignment_logic" character varying
(
  50
),
  "skill_requirements" "jsonb",
  "max_items_per_user" integer,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp
                         with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."work_queue_assignment_rule" OWNER TO "postgres";


CREATE
OR REPLACE VIEW "public"."work_queue_summary" WITH ("security_invoker"='on') AS
SELECT "wq"."team_id",
       "wq"."queue_type",
       "wq"."status",
       "count"(*)                                               AS "item_count",
       "count"(*)                                                  FILTER (WHERE ("wq"."priority" >= 80)) AS "high_priority", "count"(*) FILTER (WHERE (("wq"."priority" >= 50) AND ("wq"."priority" < 80))) AS "medium_priority", "count"(*) FILTER (WHERE ("wq"."priority" < 50)) AS "low_priority", "count"(*) FILTER (WHERE ("wq"."sla_deadline" < "now"())) AS "overdue", "count"(*) FILTER (WHERE (("wq"."sla_deadline" < ("now"() + '24:00:00'::interval)) AND ("wq"."sla_deadline" >= "now"()))) AS "due_soon", "avg"(EXTRACT(day FROM ("now"() - "wq"."created_at"))) AS "avg_age_days",
       "tm"."id"                                                AS "assigned_to_id",
       (("up"."first_name" || ' '::"text") || "up"."last_name") AS "assigned_to_name"
FROM (("public"."work_queue" "wq"
  LEFT JOIN "public"."team_member" "tm" ON (("wq"."assigned_to" = "tm"."id")))
  LEFT JOIN "public"."user_profile" "up" ON (("tm"."user_id" = "up"."id")))
GROUP BY "wq"."team_id", "wq"."queue_type", "wq"."status", "tm"."id", "up"."first_name", "up"."last_name";


ALTER
VIEW "public"."work_queue_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_execution"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "automation_rule_id" "uuid",
  "trigger_data" "jsonb",
  "execution_status" character varying
(
  50
),
  "actions_performed" "jsonb",
  "error_details" "text",
  "executed_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."workflow_execution" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_state"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "entity_type" character varying NOT NULL,
  "entity_id" character varying NOT NULL,
  "workflow_type" character varying NOT NULL,
  "current_state" character varying NOT NULL,
  "previous_state" character varying,
  "state_entered_at" timestamp with time zone DEFAULT "now"(),
  "state_data" "jsonb",
  "transitions_history" "jsonb"[],
  "created_at" timestamp
                               with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."workflow_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."x12_transaction"
(
  "id"
  "uuid"
  DEFAULT
  "extensions"
  .
  "uuid_generate_v4"
(
) NOT NULL,
  "team_id" "uuid" NOT NULL,
  "clearinghouse_id" "uuid",
  "transaction_type" character varying
(
  10
),
  "direction" character varying
(
  10
),
  "control_number" character varying
(
  50
),
  "file_path" "text",
  "file_size" integer,
  "record_count" integer,
  "status" character varying
(
  50
),
  "acknowledgment_received" boolean DEFAULT false,
  "error_messages" "jsonb",
  "transmitted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"()
  );


ALTER TABLE "public"."x12_transaction" OWNER TO "postgres";


ALTER TABLE ONLY "public"."denial_playbook" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."denial_playbook_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."address"
  ADD CONSTRAINT "address_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."adjustment_reason_code"
  ADD CONSTRAINT "adjustment_reason_code_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."analytics_event"
  ADD CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_key"
  ADD CONSTRAINT "api_key_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_version"
  ADD CONSTRAINT "api_version_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."appeal"
  ADD CONSTRAINT "appeal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
  ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_event"
  ADD CONSTRAINT "automation_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_retry"
  ADD CONSTRAINT "automation_retry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rule"
  ADD CONSTRAINT "automation_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."batch_job_item"
  ADD CONSTRAINT "batch_job_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."batch_job"
  ADD CONSTRAINT "batch_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benefits_coverage"
  ADD CONSTRAINT "benefits_coverage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_rule"
  ADD CONSTRAINT "business_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_attachment"
  ADD CONSTRAINT "claim_attachment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim"
  ADD CONSTRAINT "claim_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claim_line"
  ADD CONSTRAINT "claim_line_claim_id_line_number_key" UNIQUE ("claim_id", "line_number");



ALTER TABLE ONLY "public"."claim_line"
  ADD CONSTRAINT "claim_line_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim"
  ADD CONSTRAINT "claim_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_state_history"
  ADD CONSTRAINT "claim_state_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_submission_batch"
  ADD CONSTRAINT "claim_submission_batch_batch_control_number_key" UNIQUE ("batch_control_number");



ALTER TABLE ONLY "public"."claim_submission_batch"
  ADD CONSTRAINT "claim_submission_batch_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_validation"
  ADD CONSTRAINT "claim_validation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearinghouse_batch"
  ADD CONSTRAINT "clearinghouse_batch_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearinghouse_connection"
  ADD CONSTRAINT "clearinghouse_connection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clerk_user_sync"
  ADD CONSTRAINT "clerk_user_sync_pkey" PRIMARY KEY ("clerk_user_id");



ALTER TABLE ONLY "public"."clerk_webhook_log"
  ADD CONSTRAINT "clerk_webhook_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinician_note"
  ADD CONSTRAINT "clinician_note_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinician"
  ADD CONSTRAINT "clinician_npi_key_key" UNIQUE ("npi_key");



ALTER TABLE ONLY "public"."clinician"
  ADD CONSTRAINT "clinician_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collection_account"
  ADD CONSTRAINT "collection_account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_log"
  ADD CONSTRAINT "communication_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cpt_code_master"
  ADD CONSTRAINT "cpt_code_master_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."credit_balance"
  ADD CONSTRAINT "credit_balance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_field_mapping"
  ADD CONSTRAINT "custom_field_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_field"
  ADD CONSTRAINT "custom_field_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_field_value"
  ADD CONSTRAINT "custom_field_value_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_metrics"
  ADD CONSTRAINT "dashboard_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."denial_playbook"
  ADD CONSTRAINT "denial_playbook_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."denial_tracking"
  ADD CONSTRAINT "denial_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document"
  ADD CONSTRAINT "document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_template"
  ADD CONSTRAINT "document_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dosage"
  ADD CONSTRAINT "dosage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drug_formulary"
  ADD CONSTRAINT "drug_formulary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ehr_connection"
  ADD CONSTRAINT "ehr_connection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ehr_system"
  ADD CONSTRAINT "ehr_system_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eligibility_cache"
  ADD CONSTRAINT "eligibility_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."eligibility_cache"
  ADD CONSTRAINT "eligibility_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eligibility_check"
  ADD CONSTRAINT "eligibility_check_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encounter"
  ADD CONSTRAINT "encounter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."era_line_detail"
  ADD CONSTRAINT "era_line_detail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."failed_job"
  ADD CONSTRAINT "failed_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fee_schedule"
  ADD CONSTRAINT "fee_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_resource"
  ADD CONSTRAINT "fhir_resource_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_mapping_template"
  ADD CONSTRAINT "field_mapping_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_document"
  ADD CONSTRAINT "generated_document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_report"
  ADD CONSTRAINT "generated_report_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."icd10_code_master"
  ADD CONSTRAINT "icd10_code_master_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."insurance_policy"
  ADD CONSTRAINT "insurance_policy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intake"
  ADD CONSTRAINT "intake_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_event_log"
  ADD CONSTRAINT "integration_event_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_definition"
  ADD CONSTRAINT "kpi_definition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_snapshot"
  ADD CONSTRAINT "kpi_snapshot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_dosage"
  ADD CONSTRAINT "medication_dosage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_history"
  ADD CONSTRAINT "medication_history_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."medication"
  ADD CONSTRAINT "medication_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_quantity"
  ADD CONSTRAINT "medication_quantity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_model_metrics"
  ADD CONSTRAINT "ml_model_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_prediction"
  ADD CONSTRAINT "ml_prediction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modifier_code"
  ADD CONSTRAINT "modifier_code_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."notification"
  ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_template"
  ADD CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pa_clinical_criteria"
  ADD CONSTRAINT "pa_clinical_criteria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pa_requirement_rule"
  ADD CONSTRAINT "pa_requirement_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pa_supporting_document"
  ADD CONSTRAINT "pa_supporting_document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_diagnosis"
  ADD CONSTRAINT "patient_diagnosis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_document"
  ADD CONSTRAINT "patient_document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_payment"
  ADD CONSTRAINT "patient_payment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_pharmacy"
  ADD CONSTRAINT "patient_pharmacy_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."patient"
  ADD CONSTRAINT "patient_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_profile"
  ADD CONSTRAINT "patient_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_quality_measure"
  ADD CONSTRAINT "patient_quality_measure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_statement"
  ADD CONSTRAINT "patient_statement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_statement"
  ADD CONSTRAINT "patient_statement_statement_number_key" UNIQUE ("statement_number");



ALTER TABLE ONLY "public"."payer_config"
  ADD CONSTRAINT "payer_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payer_config"
  ADD CONSTRAINT "payer_config_team_id_payer_id_config_type_key" UNIQUE ("team_id", "payer_id", "config_type");



ALTER TABLE ONLY "public"."payer"
  ADD CONSTRAINT "payer_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payer_portal_credential"
  ADD CONSTRAINT "payer_portal_credential_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payer_response_message"
  ADD CONSTRAINT "payer_response_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payer_submission_config"
  ADD CONSTRAINT "payer_submission_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_adjustment"
  ADD CONSTRAINT "payment_adjustment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_detail"
  ADD CONSTRAINT "payment_detail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_plan"
  ADD CONSTRAINT "payment_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_posting_session"
  ADD CONSTRAINT "payment_posting_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_reconciliation"
  ADD CONSTRAINT "payment_reconciliation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_variance"
  ADD CONSTRAINT "payment_variance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phi_export_log"
  ADD CONSTRAINT "phi_export_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."place_of_service"
  ADD CONSTRAINT "place_of_service_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."portal_automation_task"
  ADD CONSTRAINT "portal_automation_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription"
  ADD CONSTRAINT "prescription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_request"
  ADD CONSTRAINT "prescription_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prior_auth"
  ADD CONSTRAINT "prior_auth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_credentialing"
  ADD CONSTRAINT "provider_credentialing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_enrollment"
  ADD CONSTRAINT "provider_enrollment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_schedule"
  ADD CONSTRAINT "provider_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quality_measure"
  ADD CONSTRAINT "quality_measure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantity"
  ADD CONSTRAINT "quantity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_bucket"
  ADD CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral"
  ADD CONSTRAINT "referral_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."remittance_advice"
  ADD CONSTRAINT "remittance_advice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_definition"
  ADD CONSTRAINT "report_definition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rule_execution_log"
  ADD CONSTRAINT "rule_execution_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_task"
  ADD CONSTRAINT "scheduled_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scrubbing_result"
  ADD CONSTRAINT "scrubbing_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
  ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_location"
  ADD CONSTRAINT "service_location_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_job"
  ADD CONSTRAINT "sync_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
  ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_team_id_email_key" UNIQUE ("team_id", "email");



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "team_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "team_member_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."team"
  ADD CONSTRAINT "team_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_settings"
  ADD CONSTRAINT "team_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team"
  ADD CONSTRAINT "team_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."trading_partner"
  ADD CONSTRAINT "trading_partner_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profile"
  ADD CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_session"
  ADD CONSTRAINT "user_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_config"
  ADD CONSTRAINT "webhook_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_event"
  ADD CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_queue_assignment_rule"
  ADD CONSTRAINT "work_queue_assignment_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_queue"
  ADD CONSTRAINT "work_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_execution"
  ADD CONSTRAINT "workflow_execution_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_state"
  ADD CONSTRAINT "workflow_state_entity_type_entity_id_key" UNIQUE ("entity_type", "entity_id");



ALTER TABLE ONLY "public"."workflow_state"
  ADD CONSTRAINT "workflow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."x12_transaction"
  ADD CONSTRAINT "x12_transaction_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_analytics_event_created" ON "public"."analytics_event" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_event_data" ON "public"."analytics_event" USING "gin" ("event_data");



CREATE INDEX "idx_analytics_event_name" ON "public"."analytics_event" USING "btree" ("event_name");



CREATE INDEX "idx_analytics_event_team" ON "public"."analytics_event" USING "btree" ("team_id");



CREATE INDEX "idx_api_key_prefix" ON "public"."api_key" USING "btree" ("key_prefix");



CREATE INDEX "idx_api_key_team" ON "public"."api_key" USING "btree" ("team_id");



CREATE INDEX "idx_appeal_claim" ON "public"."appeal" USING "btree" ("claim_id");



CREATE INDEX "idx_appeal_team_status" ON "public"."appeal" USING "btree" ("team_id", "status");



CREATE INDEX "idx_appointment_date" ON "public"."appointment" USING "btree" ("scheduled_date", "scheduled_time");



CREATE INDEX "idx_appointment_patient" ON "public"."appointment" USING "btree" ("patient_id");



CREATE INDEX "idx_appointment_provider" ON "public"."appointment" USING "btree" ("provider_id");



CREATE INDEX "idx_appointment_status" ON "public"."appointment" USING "btree" ("status");



CREATE INDEX "idx_appointment_upcoming" ON "public"."appointment" USING "btree" ("scheduled_date", "scheduled_time") WHERE (("status")::"text" = 'scheduled'::"text");



CREATE INDEX "idx_audit_log_auth_uid" ON "public"."audit_log" USING "btree" ("auth_uid");



CREATE INDEX "idx_audit_log_created_at" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_table_name" ON "public"."audit_log" USING "btree" ("table_name");



CREATE INDEX "idx_audit_log_team_id" ON "public"."audit_log" USING "btree" ("team_id");



CREATE INDEX "idx_automation_event_case" ON "public"."automation_event" USING "btree" ("case_id");



CREATE INDEX "idx_automation_event_team" ON "public"."automation_event" USING "btree" ("team_id");



CREATE INDEX "idx_automation_event_timestamp" ON "public"."automation_event" USING "btree" ("timestamp");



CREATE INDEX "idx_automation_event_type" ON "public"."automation_event" USING "btree" ("event_type");



CREATE INDEX "idx_automation_retry_entity" ON "public"."automation_retry" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_automation_retry_next" ON "public"."automation_retry" USING "btree" ("next_retry_at", "status") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_automation_rule_active" ON "public"."automation_rule" USING "btree" ("is_active");



CREATE INDEX "idx_automation_rule_conditions" ON "public"."automation_rule" USING "gin" ("conditions");



CREATE INDEX "idx_automation_rule_team" ON "public"."automation_rule" USING "btree" ("team_id");



CREATE INDEX "idx_batch_job_item_batch" ON "public"."batch_job_item" USING "btree" ("batch_job_id");



CREATE INDEX "idx_batch_job_item_entity" ON "public"."batch_job_item" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_batch_job_scheduled" ON "public"."batch_job" USING "btree" ("scheduled_at");



CREATE INDEX "idx_batch_job_team_status" ON "public"."batch_job" USING "btree" ("team_id", "status");



CREATE INDEX "idx_benefits_coverage_payer_cpt" ON "public"."benefits_coverage" USING "btree" ("payer_id", "cpt_code");



CREATE INDEX "idx_business_rule_active" ON "public"."business_rule" USING "btree" ("is_active");



CREATE INDEX "idx_business_rule_category" ON "public"."business_rule" USING "btree" ("rule_category");



CREATE INDEX "idx_claim_attachment_claim" ON "public"."claim_attachment" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_automation" ON "public"."claim" USING "btree" ("team_id", "status", "confidence" DESC) WHERE (("status")::"text" = ANY ((ARRAY['built':: character varying, 'ready_to_submit':: character varying])::"text"[]));



CREATE INDEX "idx_claim_claim_number" ON "public"."claim" USING "btree" ("claim_number");



CREATE INDEX "idx_claim_encounter" ON "public"."claim" USING "btree" ("encounter_id");



CREATE INDEX "idx_claim_line_claim" ON "public"."claim_line" USING "btree" ("claim_id", "line_number");



CREATE INDEX "idx_claim_line_team" ON "public"."claim_line" USING "btree" ("team_id");



CREATE INDEX "idx_claim_payer" ON "public"."claim" USING "btree" ("payer_id");



CREATE INDEX "idx_claim_pending" ON "public"."claim" USING "btree" ("team_id") WHERE (("status")::"text" = ANY (ARRAY[('built':: character varying)::"text", ('submitted':: character varying)::"text", ('awaiting_277ca':: character varying)::"text"]));



CREATE INDEX "idx_claim_state_history_at" ON "public"."claim_state_history" USING "btree" ("at");



CREATE INDEX "idx_claim_state_history_claim" ON "public"."claim_state_history" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_status" ON "public"."claim" USING "btree" ("status");



CREATE INDEX "idx_claim_status_team" ON "public"."claim" USING "btree" ("status", "team_id") WHERE (("status")::"text" = ANY ((ARRAY['ready_to_submit':: character varying, 'submitted':: character varying])::"text"[]));



CREATE INDEX "idx_claim_submitted_at" ON "public"."claim" USING "btree" ("submitted_at");



CREATE INDEX "idx_claim_team" ON "public"."claim" USING "btree" ("team_id");



CREATE INDEX "idx_claim_team_status_dos" ON "public"."claim" USING "btree" ("team_id", "status", "encounter_id");



CREATE INDEX "idx_claim_validation_claim" ON "public"."claim_validation" USING "btree" ("claim_id", "validation_run_at" DESC);



CREATE INDEX "idx_claim_validation_status" ON "public"."claim_validation" USING "btree" ("overall_status", "team_id");



CREATE INDEX "idx_clearinghouse_batch_clearinghouse" ON "public"."clearinghouse_batch" USING "btree" ("clearinghouse_id");



CREATE INDEX "idx_clinician_npi" ON "public"."clinician" USING "btree" ("npi_key");



CREATE INDEX "idx_clinician_team" ON "public"."clinician" USING "btree" ("team_id");



CREATE INDEX "idx_communication_log_entity" ON "public"."communication_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_communication_log_team_type" ON "public"."communication_log" USING "btree" ("team_id", "communication_type");



CREATE INDEX "idx_cpt_code_master_active" ON "public"."cpt_code_master" USING "btree" ("code") WHERE ("is_active" = true);



CREATE INDEX "idx_credit_balance_patient" ON "public"."credit_balance" USING "btree" ("patient_id");



CREATE INDEX "idx_credit_balance_status" ON "public"."credit_balance" USING "btree" ("status");



CREATE INDEX "idx_custom_field_mapping_entity" ON "public"."custom_field_mapping" USING "btree" ("entity_type");



CREATE INDEX "idx_custom_field_mapping_team" ON "public"."custom_field_mapping" USING "btree" ("team_id");



CREATE INDEX "idx_custom_field_mapping_transform" ON "public"."custom_field_mapping" USING "gin" ("transformation_rules");



CREATE UNIQUE INDEX "idx_custom_field_unique" ON "public"."custom_field" USING "btree" ("team_id", "entity_type", "field_name");



CREATE INDEX "idx_custom_field_value_entity" ON "public"."custom_field_value" USING "btree" ("entity_id");



CREATE INDEX "idx_custom_field_value_field" ON "public"."custom_field_value" USING "btree" ("custom_field_id");



CREATE UNIQUE INDEX "idx_denial_playbook_code" ON "public"."denial_playbook" USING "btree" ("code");



CREATE INDEX "idx_denial_playbook_team" ON "public"."denial_playbook" USING "btree" ("team_id");



CREATE INDEX "idx_denial_tracking_claim" ON "public"."denial_tracking" USING "btree" ("claim_id");



CREATE INDEX "idx_denial_tracking_deadline" ON "public"."denial_tracking" USING "btree" ("appeal_deadline");



CREATE INDEX "idx_denial_tracking_financial" ON "public"."denial_tracking" USING "btree" ("team_id", "financial_impact" DESC);



CREATE INDEX "idx_denial_tracking_team" ON "public"."denial_tracking" USING "btree" ("team_id", "status", "denial_date" DESC);



CREATE INDEX "idx_denial_tracking_team_status" ON "public"."denial_tracking" USING "btree" ("team_id", "status");



CREATE INDEX "idx_document_entity" ON "public"."document" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_document_team" ON "public"."document" USING "btree" ("team_id");



CREATE INDEX "idx_document_template_team" ON "public"."document_template" USING "btree" ("team_id");



CREATE INDEX "idx_document_template_type" ON "public"."document_template" USING "btree" ("template_type");



CREATE INDEX "idx_drug_formulary_ndc" ON "public"."drug_formulary" USING "btree" ("ndc_code");



CREATE INDEX "idx_drug_formulary_pa" ON "public"."drug_formulary" USING "btree" ("requires_prior_auth") WHERE ("requires_prior_auth" = true);



CREATE INDEX "idx_drug_formulary_payer" ON "public"."drug_formulary" USING "btree" ("payer_id");



CREATE INDEX "idx_ehr_connection_status" ON "public"."ehr_connection" USING "btree" ("status");



CREATE INDEX "idx_ehr_connection_team" ON "public"."ehr_connection" USING "btree" ("team_id");



CREATE INDEX "idx_eligibility_cache_expires" ON "public"."eligibility_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_eligibility_cache_key" ON "public"."eligibility_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_eligibility_check_patient" ON "public"."eligibility_check" USING "btree" ("patient_id");



CREATE INDEX "idx_eligibility_check_status" ON "public"."eligibility_check" USING "btree" ("status");



CREATE INDEX "idx_eligibility_check_team" ON "public"."eligibility_check" USING "btree" ("team_id");



CREATE INDEX "idx_eligibility_check_verified" ON "public"."eligibility_check" USING "btree" ("last_verified_at");



CREATE INDEX "idx_encounter_clinician" ON "public"."encounter" USING "btree" ("rendering_clinician_id");



CREATE INDEX "idx_encounter_dos" ON "public"."encounter" USING "btree" ("dos");



CREATE INDEX "idx_encounter_patient" ON "public"."encounter" USING "btree" ("patient_id");



CREATE INDEX "idx_encounter_team" ON "public"."encounter" USING "btree" ("team_id");



CREATE INDEX "idx_failed_job_retry" ON "public"."failed_job" USING "btree" ("next_retry_at");



CREATE INDEX "idx_failed_job_team" ON "public"."failed_job" USING "btree" ("team_id");



CREATE INDEX "idx_fee_schedule_payer_cpt" ON "public"."fee_schedule" USING "btree" ("payer_id", "cpt_code", "effective_date");



CREATE INDEX "idx_fee_schedule_team" ON "public"."fee_schedule" USING "btree" ("team_id");



CREATE INDEX "idx_fhir_resource_data" ON "public"."fhir_resource" USING "gin" ("resource_data");



CREATE INDEX "idx_fhir_resource_mapped" ON "public"."fhir_resource" USING "btree" ("mapped_entity_type", "mapped_entity_id");



CREATE INDEX "idx_fhir_resource_team" ON "public"."fhir_resource" USING "btree" ("team_id");



CREATE INDEX "idx_fhir_resource_type" ON "public"."fhir_resource" USING "btree" ("resource_type");



CREATE UNIQUE INDEX "idx_fhir_resource_unique" ON "public"."fhir_resource" USING "btree" ("team_id", "resource_type", "resource_id");



CREATE INDEX "idx_icd10_code_master_active" ON "public"."icd10_code_master" USING "btree" ("code") WHERE ("is_active" = true);



CREATE INDEX "idx_icd10_code_master_parent" ON "public"."icd10_code_master" USING "btree" ("parent_code");



CREATE INDEX "idx_insurance_policy_patient" ON "public"."insurance_policy" USING "btree" ("patient_id");



CREATE INDEX "idx_insurance_policy_team" ON "public"."insurance_policy" USING "btree" ("team_id");



CREATE INDEX "idx_integration_event_error" ON "public"."integration_event_log" USING "btree" ("team_id", "created_at") WHERE ("error_message" IS NOT NULL);



CREATE INDEX "idx_integration_event_team_created" ON "public"."integration_event_log" USING "btree" ("team_id", "created_at" DESC);



CREATE INDEX "idx_internal_prior_auth_metrics" ON "public"."_internal_prior_auth_metrics" USING "btree" ("team_id", "week");



CREATE INDEX "idx_internal_revenue_cycle_metrics" ON "public"."_internal_revenue_cycle_metrics" USING "btree" ("team_id", "month");



CREATE INDEX "idx_kpi_snapshot_definition" ON "public"."kpi_snapshot" USING "btree" ("kpi_definition_id");



CREATE INDEX "idx_kpi_snapshot_team_period" ON "public"."kpi_snapshot" USING "btree" ("team_id", "period_start");



CREATE INDEX "idx_ml_prediction_entity" ON "public"."ml_prediction" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_ml_prediction_team_type" ON "public"."ml_prediction" USING "btree" ("team_id", "prediction_type");



CREATE INDEX "idx_ml_prediction_timestamp" ON "public"."ml_prediction" USING "btree" ("prediction_timestamp");



CREATE INDEX "idx_notification_status" ON "public"."notification" USING "btree" ("status");



CREATE INDEX "idx_notification_team" ON "public"."notification" USING "btree" ("team_id");



CREATE INDEX "idx_notification_unsent" ON "public"."notification" USING "btree" ("team_id") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_pa_automation" ON "public"."prior_auth" USING "btree" ("team_id", "status", "confidence" DESC) WHERE (("status")::"text" = ANY ((ARRAY['draft':: character varying, 'ready_to_submit':: character varying])::"text"[]));



CREATE INDEX "idx_pa_criteria_payer_code" ON "public"."pa_clinical_criteria" USING "btree" ("payer_id", "code");



CREATE INDEX "idx_pa_payer" ON "public"."prior_auth" USING "btree" ("payer_id", "status");



CREATE INDEX "idx_pa_requirement_payer_cpt" ON "public"."pa_requirement_rule" USING "btree" ("payer_id", "cpt_code", "is_active");



CREATE INDEX "idx_pa_status_team" ON "public"."prior_auth" USING "btree" ("status", "team_id");



CREATE INDEX "idx_pa_supporting_doc_pa" ON "public"."pa_supporting_document" USING "btree" ("prior_auth_id");



CREATE INDEX "idx_patient_document_patient" ON "public"."patient_document" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_document_type" ON "public"."patient_document" USING "btree" ("document_type");



CREATE INDEX "idx_patient_payment_patient" ON "public"."patient_payment" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_payment_status" ON "public"."patient_payment" USING "btree" ("status");



CREATE INDEX "idx_patient_profile" ON "public"."patient" USING "btree" ("profile_id");



CREATE INDEX "idx_patient_profile_name" ON "public"."patient_profile" USING "btree" ("last_name", "first_name");



CREATE INDEX "idx_patient_profile_team" ON "public"."patient_profile" USING "btree" ("team_id");



CREATE INDEX "idx_patient_quality_measure_gap" ON "public"."patient_quality_measure" USING "btree" ("gap_in_care");



CREATE INDEX "idx_patient_quality_measure_patient" ON "public"."patient_quality_measure" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_statement_balance" ON "public"."patient_statement" USING "btree" ("patient_responsibility") WHERE ("patient_responsibility" > (0):: numeric);



CREATE INDEX "idx_patient_statement_patient" ON "public"."patient_statement" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_statement_status" ON "public"."patient_statement" USING "btree" ("status");



CREATE INDEX "idx_patient_team" ON "public"."patient" USING "btree" ("team_id");



CREATE INDEX "idx_payer_config_payer" ON "public"."payer_config" USING "btree" ("payer_id");



CREATE INDEX "idx_payer_external_id" ON "public"."payer" USING "btree" ("external_payer_id");



CREATE INDEX "idx_payer_response_entity" ON "public"."payer_response_message" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_payer_response_unresolved" ON "public"."payer_response_message" USING "btree" ("team_id", "resolved") WHERE ("resolved" = false);



CREATE INDEX "idx_payer_team" ON "public"."payer" USING "btree" ("team_id");



CREATE INDEX "idx_payment_adjustment_claim" ON "public"."payment_adjustment" USING "btree" ("claim_id");



CREATE INDEX "idx_payment_adjustment_detail" ON "public"."payment_adjustment" USING "btree" ("payment_detail_id");



CREATE INDEX "idx_payment_adjustment_team" ON "public"."payment_adjustment" USING "btree" ("team_id");



CREATE INDEX "idx_payment_detail_claim" ON "public"."payment_detail" USING "btree" ("claim_id");



CREATE INDEX "idx_payment_detail_remittance" ON "public"."payment_detail" USING "btree" ("remittance_advice_id");



CREATE INDEX "idx_payment_detail_status" ON "public"."payment_detail" USING "btree" ("status") WHERE (("status")::"text" = ANY ((ARRAY['pending':: character varying, 'manual_review':: character varying])::"text"[]));



CREATE INDEX "idx_payment_plan_active" ON "public"."payment_plan" USING "btree" ("team_id", "status") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_portal_automation_task_status" ON "public"."portal_automation_task" USING "btree" ("status", "scheduled_at");



CREATE INDEX "idx_prior_auth_patient" ON "public"."prior_auth" USING "btree" ("patient_id");



CREATE INDEX "idx_prior_auth_status" ON "public"."prior_auth" USING "btree" ("status");



CREATE INDEX "idx_prior_auth_team" ON "public"."prior_auth" USING "btree" ("team_id");



CREATE INDEX "idx_prior_auth_team_status_submitted" ON "public"."prior_auth" USING "btree" ("team_id", "status", "submitted_at");



CREATE INDEX "idx_provider_credentialing_clinician" ON "public"."provider_credentialing" USING "btree" ("clinician_id");



CREATE INDEX "idx_provider_credentialing_payer" ON "public"."provider_credentialing" USING "btree" ("payer_id");



CREATE INDEX "idx_provider_credentialing_status" ON "public"."provider_credentialing" USING "btree" ("status");



CREATE INDEX "idx_provider_credentialing_team" ON "public"."provider_credentialing" USING "btree" ("team_id");



CREATE UNIQUE INDEX "idx_provider_credentialing_unique" ON "public"."provider_credentialing" USING "btree" ("clinician_id", "payer_id", "state");



CREATE UNIQUE INDEX "idx_provider_enrollment_unique" ON "public"."provider_enrollment" USING "btree" ("clinician_id", "payer_id");



CREATE UNIQUE INDEX "idx_rate_limit_unique" ON "public"."rate_limit_bucket" USING "btree" ("identifier", "bucket_type", "window_start");



CREATE INDEX "idx_referral_expiring" ON "public"."referral" USING "btree" ("expiration_date") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_referral_patient" ON "public"."referral" USING "btree" ("patient_id");



CREATE INDEX "idx_referral_status" ON "public"."referral" USING "btree" ("status");



CREATE INDEX "idx_rule_execution_entity" ON "public"."rule_execution_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_rule_execution_rule" ON "public"."rule_execution_log" USING "btree" ("business_rule_id");



CREATE INDEX "idx_scheduled_task_next_run" ON "public"."scheduled_task" USING "btree" ("next_run_at") WHERE ("is_active" = true);



CREATE INDEX "idx_scrubbing_result_entity" ON "public"."scrubbing_result" USING "btree" ("entity_type", "entity_id", "fixed");



CREATE INDEX "idx_security_audit_log_action" ON "public"."security_audit_log" USING "btree" ("attempted_action", "created_at" DESC);



CREATE INDEX "idx_security_audit_log_team" ON "public"."security_audit_log" USING "btree" ("team_id", "created_at" DESC);



CREATE INDEX "idx_security_audit_log_user" ON "public"."security_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_service_location_npi" ON "public"."service_location" USING "btree" ("npi");



CREATE INDEX "idx_service_location_team" ON "public"."service_location" USING "btree" ("team_id");



CREATE INDEX "idx_sync_job_created" ON "public"."sync_job" USING "btree" ("created_at");



CREATE INDEX "idx_sync_job_recent" ON "public"."sync_job" USING "btree" ("team_id", "created_at" DESC);



CREATE INDEX "idx_sync_job_status" ON "public"."sync_job" USING "btree" ("status");



CREATE INDEX "idx_sync_job_team" ON "public"."sync_job" USING "btree" ("team_id");



CREATE INDEX "idx_team_member_team" ON "public"."team_member" USING "btree" ("team_id");



CREATE INDEX "idx_team_member_user" ON "public"."team_member" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_team_settings_unique" ON "public"."team_settings" USING "btree" ("team_id", "key");



CREATE INDEX "idx_team_slug" ON "public"."team" USING "btree" ("slug");



CREATE INDEX "idx_team_status" ON "public"."team" USING "btree" ("status");



CREATE INDEX "idx_webhook_event_config" ON "public"."webhook_event" USING "btree" ("webhook_config_id");



CREATE INDEX "idx_webhook_event_status" ON "public"."webhook_event" USING "btree" ("response_status");



CREATE INDEX "idx_work_queue_assigned" ON "public"."work_queue" USING "btree" ("assigned_to", "status");



CREATE INDEX "idx_work_queue_automation" ON "public"."work_queue" USING "btree" ("team_id", "status", "priority" DESC, "due_date") WHERE (("status")::"text" = ANY ((ARRAY['pending':: character varying, 'assigned':: character varying])::"text"[]));



CREATE INDEX "idx_work_queue_due" ON "public"."work_queue" USING "btree" ("due_date");



CREATE INDEX "idx_work_queue_entity" ON "public"."work_queue" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_work_queue_sla" ON "public"."work_queue" USING "btree" ("sla_deadline", "status") WHERE (("status")::"text" <> ALL ((ARRAY['completed':: character varying, 'cancelled':: character varying])::"text"[]));



CREATE INDEX "idx_work_queue_team_status" ON "public"."work_queue" USING "btree" ("team_id", "status");



CREATE INDEX "idx_work_queue_team_type" ON "public"."work_queue" USING "btree" ("team_id", "queue_type", "status");



CREATE INDEX "idx_workflow_state_current" ON "public"."workflow_state" USING "btree" ("workflow_type", "current_state");



CREATE INDEX "idx_workflow_state_entity" ON "public"."workflow_state" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_x12_transaction_control" ON "public"."x12_transaction" USING "btree" ("control_number");



CREATE INDEX "idx_x12_transaction_type" ON "public"."x12_transaction" USING "btree" ("transaction_type");



CREATE INDEX "insurance_policy_patient_id_idx" ON "public"."insurance_policy" USING "btree" ("patient_id");



CREATE INDEX "patient_diagnosis_patient_id_idx" ON "public"."patient_diagnosis" USING "btree" ("patient_id");



CREATE
OR REPLACE TRIGGER "audit_claim_changes" AFTER INSERT OR DELETE
OR UPDATE ON "public"."claim" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE
OR REPLACE TRIGGER "audit_encounter_changes" AFTER INSERT OR DELETE
OR UPDATE ON "public"."encounter" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE
OR REPLACE TRIGGER "audit_patient_changes" AFTER INSERT OR DELETE
OR UPDATE ON "public"."patient" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE
OR REPLACE TRIGGER "calculate_variance_trigger" BEFORE INSERT OR
UPDATE ON "public"."payment_variance" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_variance"();



CREATE
OR REPLACE TRIGGER "prevent_duplicate_claim_trigger" BEFORE INSERT ON "public"."claim" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_duplicate_claim"();



CREATE
OR REPLACE TRIGGER "prevent_duplicate_era" BEFORE INSERT ON "public"."payment_posting_session" FOR EACH ROW EXECUTE FUNCTION "public"."check_era_not_duplicate"();



CREATE
OR REPLACE TRIGGER "trg_audit_payer_config" AFTER INSERT OR DELETE
OR UPDATE ON "public"."payer_config" FOR EACH ROW EXECUTE FUNCTION "public"."audit_sensitive_changes"();



CREATE
OR REPLACE TRIGGER "trg_audit_payment_adjustment" AFTER INSERT OR DELETE
OR UPDATE ON "public"."payment_adjustment" FOR EACH ROW EXECUTE FUNCTION "public"."audit_sensitive_changes"();



CREATE
OR REPLACE TRIGGER "trg_create_claim_lines" AFTER INSERT ON "public"."claim" FOR EACH ROW EXECUTE FUNCTION "public"."create_claim_lines"();



CREATE
OR REPLACE TRIGGER "trg_denial_work_queue" AFTER
UPDATE ON "public"."claim" FOR EACH ROW WHEN ((("old"."status")::"text" IS DISTINCT FROM ("new"."status")::"text")) EXECUTE FUNCTION "public"."create_denial_work_queue"();



CREATE
OR REPLACE TRIGGER "trg_increment_retry" BEFORE
UPDATE ON "public"."automation_retry" FOR EACH ROW WHEN ((("new"."status")::"text" = 'retrying'::"text")) EXECUTE FUNCTION "public"."increment_retry_attempt"();



CREATE
OR REPLACE TRIGGER "trg_track_claim_state" AFTER
UPDATE ON "public"."claim" FOR EACH ROW WHEN ((("old"."status")::"text" IS DISTINCT FROM ("new"."status")::"text")) EXECUTE FUNCTION "public"."track_workflow_state"();



CREATE
OR REPLACE TRIGGER "trg_track_pa_state" AFTER
UPDATE ON "public"."prior_auth" FOR EACH ROW WHEN ((("old"."status")::"text" IS DISTINCT FROM ("new"."status")::"text")) EXECUTE FUNCTION "public"."track_workflow_state"();



CREATE
OR REPLACE TRIGGER "trg_update_pa_requirement_timestamp" BEFORE
UPDATE ON "public"."pa_requirement_rule" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "trg_update_payer_config_timestamp" BEFORE
UPDATE ON "public"."payer_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "trigger_appointment_eligibility" BEFORE
UPDATE ON "public"."appointment" FOR EACH ROW EXECUTE FUNCTION "public"."check_appointment_eligibility"();



CREATE
OR REPLACE TRIGGER "trigger_audit_credit_refunds" AFTER
UPDATE ON "public"."credit_balance" FOR EACH ROW EXECUTE FUNCTION "public"."audit_credit_refunds"();



CREATE
OR REPLACE TRIGGER "trigger_audit_formulary" AFTER
UPDATE ON "public"."drug_formulary" FOR EACH ROW EXECUTE FUNCTION "public"."audit_formulary_changes"();



CREATE
OR REPLACE TRIGGER "trigger_audit_payment_plan" AFTER
UPDATE ON "public"."payment_plan" FOR EACH ROW EXECUTE FUNCTION "public"."audit_payment_plan_changes"();



CREATE
OR REPLACE TRIGGER "update_address_updated_at" BEFORE
UPDATE ON "public"."address" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_automation_rule_updated_at" BEFORE
UPDATE ON "public"."automation_rule" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_claim_updated_at" BEFORE
UPDATE ON "public"."claim" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_clinician_note_updated_at" BEFORE
UPDATE ON "public"."clinician_note" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_clinician_updated_at" BEFORE
UPDATE ON "public"."clinician" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_custom_field_mapping_updated_at" BEFORE
UPDATE ON "public"."custom_field_mapping" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_custom_field_updated_at" BEFORE
UPDATE ON "public"."custom_field" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_custom_field_value_updated_at" BEFORE
UPDATE ON "public"."custom_field_value" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_denial_playbook_updated_at" BEFORE
UPDATE ON "public"."denial_playbook" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_dosage_updated_at" BEFORE
UPDATE ON "public"."dosage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_ehr_connection_updated_at" BEFORE
UPDATE ON "public"."ehr_connection" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_ehr_system_updated_at" BEFORE
UPDATE ON "public"."ehr_system" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_encounter_updated_at" BEFORE
UPDATE ON "public"."encounter" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_field_mapping_template_updated_at" BEFORE
UPDATE ON "public"."field_mapping_template" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_insurance_policy_updated_at" BEFORE
UPDATE ON "public"."insurance_policy" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_intake_updated_at" BEFORE
UPDATE ON "public"."intake" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_medication_dosage_updated_at" BEFORE
UPDATE ON "public"."medication_dosage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_medication_quantity_updated_at" BEFORE
UPDATE ON "public"."medication_quantity" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_medication_updated_at" BEFORE
UPDATE ON "public"."medication" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_notification_template_updated_at" BEFORE
UPDATE ON "public"."notification_template" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_patient_profile_updated_at" BEFORE
UPDATE ON "public"."patient_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_patient_updated_at" BEFORE
UPDATE ON "public"."patient" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_payer_updated_at" BEFORE
UPDATE ON "public"."payer" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_prescription_request_updated_at" BEFORE
UPDATE ON "public"."prescription_request" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_prescription_updated_at" BEFORE
UPDATE ON "public"."prescription" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_prior_auth_updated_at" BEFORE
UPDATE ON "public"."prior_auth" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_provider_credentialing_updated_at" BEFORE
UPDATE ON "public"."provider_credentialing" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_quantity_updated_at" BEFORE
UPDATE ON "public"."quantity" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_report_definition_updated_at" BEFORE
UPDATE ON "public"."report_definition" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_service_location_updated_at" BEFORE
UPDATE ON "public"."service_location" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE
UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_team_member_updated_at" BEFORE
UPDATE ON "public"."team_member" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_team_settings_updated_at" BEFORE
UPDATE ON "public"."team_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_team_updated_at" BEFORE
UPDATE ON "public"."team" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_user_profile_updated_at" BEFORE
UPDATE ON "public"."user_profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE
OR REPLACE TRIGGER "update_webhook_config_updated_at" BEFORE
UPDATE ON "public"."webhook_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."address"
  ADD CONSTRAINT "address_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."analytics_event"
  ADD CONSTRAINT "analytics_event_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."analytics_event"
  ADD CONSTRAINT "analytics_event_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."api_key"
  ADD CONSTRAINT "api_key_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."api_key"
  ADD CONSTRAINT "api_key_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."appeal"
  ADD CONSTRAINT "appeal_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."appeal"
  ADD CONSTRAINT "appeal_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."appeal"
  ADD CONSTRAINT "appeal_denial_tracking_id_fkey" FOREIGN KEY ("denial_tracking_id") REFERENCES "public"."denial_tracking"("id");



ALTER TABLE ONLY "public"."appeal"
  ADD CONSTRAINT "appeal_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id");



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."clinician"("id");



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_service_location_id_fkey" FOREIGN KEY ("service_location_id") REFERENCES "public"."service_location"("id");



ALTER TABLE ONLY "public"."appointment"
  ADD CONSTRAINT "appointment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."automation_event"
  ADD CONSTRAINT "automation_event_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_retry"
  ADD CONSTRAINT "automation_retry_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."automation_rule"
  ADD CONSTRAINT "automation_rule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."batch_job"
  ADD CONSTRAINT "batch_job_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."batch_job_item"
  ADD CONSTRAINT "batch_job_item_batch_job_id_fkey" FOREIGN KEY ("batch_job_id") REFERENCES "public"."batch_job"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."batch_job"
  ADD CONSTRAINT "batch_job_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."benefits_coverage"
  ADD CONSTRAINT "benefits_coverage_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."benefits_coverage"
  ADD CONSTRAINT "benefits_coverage_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."business_rule"
  ADD CONSTRAINT "business_rule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim_attachment"
  ADD CONSTRAINT "claim_attachment_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."claim_attachment"
  ADD CONSTRAINT "claim_attachment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim"
  ADD CONSTRAINT "claim_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."claim_line"
  ADD CONSTRAINT "claim_line_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim_line"
  ADD CONSTRAINT "claim_line_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim"
  ADD CONSTRAINT "claim_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."claim_state_history"
  ADD CONSTRAINT "claim_state_history_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim"
  ADD CONSTRAINT "claim_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_validation"
  ADD CONSTRAINT "claim_validation_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."claim_validation"
  ADD CONSTRAINT "claim_validation_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."clearinghouse_batch"
  ADD CONSTRAINT "clearinghouse_batch_clearinghouse_id_fkey" FOREIGN KEY ("clearinghouse_id") REFERENCES "public"."clearinghouse_connection"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."clearinghouse_batch"
  ADD CONSTRAINT "clearinghouse_batch_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."clearinghouse_connection"
  ADD CONSTRAINT "clearinghouse_connection_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."clerk_user_sync"
  ADD CONSTRAINT "clerk_user_sync_supabase_user_id_fkey" FOREIGN KEY ("supabase_user_id") REFERENCES "public"."user_profile"("id");



ALTER TABLE ONLY "public"."clerk_user_sync"
  ADD CONSTRAINT "clerk_user_sync_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id");



ALTER TABLE ONLY "public"."clinician"
  ADD CONSTRAINT "clinician_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_account"
  ADD CONSTRAINT "collection_account_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."collection_account"
  ADD CONSTRAINT "collection_account_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."communication_log"
  ADD CONSTRAINT "communication_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."communication_log"
  ADD CONSTRAINT "communication_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."credit_balance"
  ADD CONSTRAINT "credit_balance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."credit_balance"
  ADD CONSTRAINT "credit_balance_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."credit_balance"
  ADD CONSTRAINT "credit_balance_source_claim_id_fkey" FOREIGN KEY ("source_claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."credit_balance"
  ADD CONSTRAINT "credit_balance_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."custom_field_mapping"
  ADD CONSTRAINT "custom_field_mapping_ehr_connection_id_fkey" FOREIGN KEY ("ehr_connection_id") REFERENCES "public"."ehr_connection"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."custom_field_mapping"
  ADD CONSTRAINT "custom_field_mapping_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."custom_field"
  ADD CONSTRAINT "custom_field_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."custom_field_value"
  ADD CONSTRAINT "custom_field_value_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."denial_playbook"
  ADD CONSTRAINT "denial_playbook_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."denial_tracking"
  ADD CONSTRAINT "denial_tracking_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."denial_tracking"
  ADD CONSTRAINT "denial_tracking_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."denial_tracking"
  ADD CONSTRAINT "denial_tracking_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."document"
  ADD CONSTRAINT "document_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."document_template"
  ADD CONSTRAINT "document_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."document_template"
  ADD CONSTRAINT "document_template_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."document_template"
  ADD CONSTRAINT "document_template_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."document"
  ADD CONSTRAINT "document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."drug_formulary"
  ADD CONSTRAINT "drug_formulary_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."ehr_connection"
  ADD CONSTRAINT "ehr_connection_ehr_system_id_fkey" FOREIGN KEY ("ehr_system_id") REFERENCES "public"."ehr_system"("id");



ALTER TABLE ONLY "public"."ehr_connection"
  ADD CONSTRAINT "ehr_connection_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."eligibility_cache"
  ADD CONSTRAINT "eligibility_cache_insurance_policy_id_fkey" FOREIGN KEY ("insurance_policy_id") REFERENCES "public"."insurance_policy"("id");



ALTER TABLE ONLY "public"."eligibility_cache"
  ADD CONSTRAINT "eligibility_cache_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."eligibility_cache"
  ADD CONSTRAINT "eligibility_cache_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."eligibility_check"
  ADD CONSTRAINT "eligibility_check_insurance_policy_id_fkey" FOREIGN KEY ("insurance_policy_id") REFERENCES "public"."insurance_policy"("id");



ALTER TABLE ONLY "public"."eligibility_check"
  ADD CONSTRAINT "eligibility_check_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."eligibility_check"
  ADD CONSTRAINT "eligibility_check_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."encounter"
  ADD CONSTRAINT "encounter_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."encounter"
  ADD CONSTRAINT "encounter_rendering_clinician_id_fkey" FOREIGN KEY ("rendering_clinician_id") REFERENCES "public"."clinician"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."encounter"
  ADD CONSTRAINT "encounter_service_location_id_fkey" FOREIGN KEY ("service_location_id") REFERENCES "public"."service_location"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."encounter"
  ADD CONSTRAINT "encounter_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."era_line_detail"
  ADD CONSTRAINT "era_line_detail_claim_line_id_fkey" FOREIGN KEY ("claim_line_id") REFERENCES "public"."claim_line"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."era_line_detail"
  ADD CONSTRAINT "era_line_detail_payment_detail_id_fkey" FOREIGN KEY ("payment_detail_id") REFERENCES "public"."payment_detail"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."failed_job"
  ADD CONSTRAINT "failed_job_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."fee_schedule"
  ADD CONSTRAINT "fee_schedule_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."fee_schedule"
  ADD CONSTRAINT "fee_schedule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."fhir_resource"
  ADD CONSTRAINT "fhir_resource_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."field_mapping_template"
  ADD CONSTRAINT "field_mapping_template_ehr_system_id_fkey" FOREIGN KEY ("ehr_system_id") REFERENCES "public"."ehr_system"("id");



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "fk_team_member_user_profile" FOREIGN KEY ("user_id") REFERENCES "public"."user_profile"("id");



ALTER TABLE ONLY "public"."generated_document"
  ADD CONSTRAINT "generated_document_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."generated_document"
  ADD CONSTRAINT "generated_document_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."generated_document"
  ADD CONSTRAINT "generated_document_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."document_template"("id");



ALTER TABLE ONLY "public"."generated_report"
  ADD CONSTRAINT "generated_report_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."generated_report"
  ADD CONSTRAINT "generated_report_report_definition_id_fkey" FOREIGN KEY ("report_definition_id") REFERENCES "public"."report_definition"("id");



ALTER TABLE ONLY "public"."generated_report"
  ADD CONSTRAINT "generated_report_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."insurance_policy"
  ADD CONSTRAINT "insurance_policy_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."insurance_policy"
  ADD CONSTRAINT "insurance_policy_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."insurance_policy"
  ADD CONSTRAINT "insurance_policy_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_event_log"
  ADD CONSTRAINT "integration_event_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."kpi_definition"
  ADD CONSTRAINT "kpi_definition_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."kpi_snapshot"
  ADD CONSTRAINT "kpi_snapshot_kpi_definition_id_fkey" FOREIGN KEY ("kpi_definition_id") REFERENCES "public"."kpi_definition"("id");



ALTER TABLE ONLY "public"."kpi_snapshot"
  ADD CONSTRAINT "kpi_snapshot_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."medical_history"
  ADD CONSTRAINT "medical_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."ml_prediction"
  ADD CONSTRAINT "ml_prediction_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."notification"
  ADD CONSTRAINT "notification_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."notification"
  ADD CONSTRAINT "notification_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."notification"
  ADD CONSTRAINT "notification_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_template"("id");



ALTER TABLE ONLY "public"."notification_template"
  ADD CONSTRAINT "notification_template_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."pa_clinical_criteria"
  ADD CONSTRAINT "pa_clinical_criteria_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."pa_requirement_rule"
  ADD CONSTRAINT "pa_requirement_rule_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."pa_requirement_rule"
  ADD CONSTRAINT "pa_requirement_rule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."pa_supporting_document"
  ADD CONSTRAINT "pa_supporting_document_prior_auth_id_fkey" FOREIGN KEY ("prior_auth_id") REFERENCES "public"."prior_auth"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."pa_supporting_document"
  ADD CONSTRAINT "pa_supporting_document_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."pa_supporting_document"
  ADD CONSTRAINT "pa_supporting_document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."team_member"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."patient_diagnosis"
  ADD CONSTRAINT "patient_diagnosis_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient_document"
  ADD CONSTRAINT "patient_document_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient_document"
  ADD CONSTRAINT "patient_document_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."patient_document"
  ADD CONSTRAINT "patient_document_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."patient_payment"
  ADD CONSTRAINT "patient_payment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient_payment"
  ADD CONSTRAINT "patient_payment_payment_plan_id_fkey" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."payment_plan"("id");



ALTER TABLE ONLY "public"."patient_payment"
  ADD CONSTRAINT "patient_payment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."patient_pharmacy"
  ADD CONSTRAINT "patient_pharmacy_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient"
  ADD CONSTRAINT "patient_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."patient_profile"("id") ON
UPDATE CASCADE
ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."patient_profile"
  ADD CONSTRAINT "patient_profile_patient_address_fkey" FOREIGN KEY ("patient_address") REFERENCES "public"."address"("patient_id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_profile"
  ADD CONSTRAINT "patient_profile_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_quality_measure"
  ADD CONSTRAINT "patient_quality_measure_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient_quality_measure"
  ADD CONSTRAINT "patient_quality_measure_quality_measure_id_fkey" FOREIGN KEY ("quality_measure_id") REFERENCES "public"."quality_measure"("id");



ALTER TABLE ONLY "public"."patient_quality_measure"
  ADD CONSTRAINT "patient_quality_measure_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."patient_statement"
  ADD CONSTRAINT "patient_statement_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."patient_statement"
  ADD CONSTRAINT "patient_statement_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."patient"
  ADD CONSTRAINT "patient_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."payer_config"
  ADD CONSTRAINT "payer_config_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payer_config"
  ADD CONSTRAINT "payer_config_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payer_portal_credential"
  ADD CONSTRAINT "payer_portal_credential_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."payer_portal_credential"
  ADD CONSTRAINT "payer_portal_credential_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payer_response_message"
  ADD CONSTRAINT "payer_response_message_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."payer_response_message"
  ADD CONSTRAINT "payer_response_message_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payer_submission_config"
  ADD CONSTRAINT "payer_submission_config_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."payer"
  ADD CONSTRAINT "payer_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_adjustment"
  ADD CONSTRAINT "payment_adjustment_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."payment_adjustment"
  ADD CONSTRAINT "payment_adjustment_payment_detail_id_fkey" FOREIGN KEY ("payment_detail_id") REFERENCES "public"."payment_detail"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."payment_adjustment"
  ADD CONSTRAINT "payment_adjustment_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."team_member"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."payment_adjustment"
  ADD CONSTRAINT "payment_adjustment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payment_detail"
  ADD CONSTRAINT "payment_detail_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."payment_detail"
  ADD CONSTRAINT "payment_detail_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."payment_detail"
  ADD CONSTRAINT "payment_detail_remittance_advice_id_fkey" FOREIGN KEY ("remittance_advice_id") REFERENCES "public"."remittance_advice"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payment_plan"
  ADD CONSTRAINT "payment_plan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."payment_plan"
  ADD CONSTRAINT "payment_plan_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payment_reconciliation"
  ADD CONSTRAINT "payment_reconciliation_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."payment_reconciliation"
  ADD CONSTRAINT "payment_reconciliation_reconciled_by_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."payment_reconciliation"
  ADD CONSTRAINT "payment_reconciliation_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."payment_variance"
  ADD CONSTRAINT "payment_variance_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id");



ALTER TABLE ONLY "public"."portal_automation_task"
  ADD CONSTRAINT "portal_automation_task_payer_portal_id_fkey" FOREIGN KEY ("payer_portal_id") REFERENCES "public"."payer_portal_credential"("id");



ALTER TABLE ONLY "public"."portal_automation_task"
  ADD CONSTRAINT "portal_automation_task_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."prior_auth"
  ADD CONSTRAINT "prior_auth_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."prior_auth"
  ADD CONSTRAINT "prior_auth_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."prior_auth"
  ADD CONSTRAINT "prior_auth_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON
DELETE
RESTRICT;



ALTER TABLE ONLY "public"."prior_auth"
  ADD CONSTRAINT "prior_auth_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."provider_credentialing"
  ADD CONSTRAINT "provider_credentialing_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "public"."clinician"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."provider_credentialing"
  ADD CONSTRAINT "provider_credentialing_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."provider_credentialing"
  ADD CONSTRAINT "provider_credentialing_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_enrollment"
  ADD CONSTRAINT "provider_enrollment_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "public"."clinician"("id");



ALTER TABLE ONLY "public"."provider_enrollment"
  ADD CONSTRAINT "provider_enrollment_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."provider_enrollment"
  ADD CONSTRAINT "provider_enrollment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."provider_schedule"
  ADD CONSTRAINT "provider_schedule_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."clinician"("id");



ALTER TABLE ONLY "public"."provider_schedule"
  ADD CONSTRAINT "provider_schedule_service_location_id_fkey" FOREIGN KEY ("service_location_id") REFERENCES "public"."service_location"("id");



ALTER TABLE ONLY "public"."provider_schedule"
  ADD CONSTRAINT "provider_schedule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."referral"
  ADD CONSTRAINT "referral_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id");



ALTER TABLE ONLY "public"."referral"
  ADD CONSTRAINT "referral_referring_provider_id_fkey" FOREIGN KEY ("referring_provider_id") REFERENCES "public"."clinician"("id");



ALTER TABLE ONLY "public"."referral"
  ADD CONSTRAINT "referral_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."remittance_advice"
  ADD CONSTRAINT "remittance_advice_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."payer"("id");



ALTER TABLE ONLY "public"."remittance_advice"
  ADD CONSTRAINT "remittance_advice_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."report_definition"
  ADD CONSTRAINT "report_definition_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."rule_execution_log"
  ADD CONSTRAINT "rule_execution_log_business_rule_id_fkey" FOREIGN KEY ("business_rule_id") REFERENCES "public"."business_rule"("id");



ALTER TABLE ONLY "public"."scheduled_task"
  ADD CONSTRAINT "scheduled_task_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."scrubbing_result"
  ADD CONSTRAINT "scrubbing_result_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."service_location"
  ADD CONSTRAINT "service_location_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_job"
  ADD CONSTRAINT "sync_job_ehr_connection_id_fkey" FOREIGN KEY ("ehr_connection_id") REFERENCES "public"."ehr_connection"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."sync_job"
  ADD CONSTRAINT "sync_job_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."team_invitation"
  ADD CONSTRAINT "team_invitation_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON
UPDATE CASCADE
ON
DELETE CASCADE;



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "team_member_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."team_member"
  ADD CONSTRAINT "team_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."team_settings"
  ADD CONSTRAINT "team_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."trading_partner"
  ADD CONSTRAINT "trading_partner_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."user_profile"
  ADD CONSTRAINT "user_profile_current_team_id_fkey" FOREIGN KEY ("current_team_id") REFERENCES "public"."team"("id");



ALTER TABLE ONLY "public"."user_profile"
  ADD CONSTRAINT "user_profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON
UPDATE CASCADE
ON
DELETE
SET NULL;



ALTER TABLE ONLY "public"."webhook_config"
  ADD CONSTRAINT "webhook_config_ehr_connection_id_fkey" FOREIGN KEY ("ehr_connection_id") REFERENCES "public"."ehr_connection"("id");



ALTER TABLE ONLY "public"."webhook_config"
  ADD CONSTRAINT "webhook_config_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."webhook_event"
  ADD CONSTRAINT "webhook_event_webhook_config_id_fkey" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_config"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."work_queue"
  ADD CONSTRAINT "work_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."team_member"("id");



ALTER TABLE ONLY "public"."work_queue_assignment_rule"
  ADD CONSTRAINT "work_queue_assignment_rule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."work_queue"
  ADD CONSTRAINT "work_queue_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."workflow_execution"
  ADD CONSTRAINT "workflow_execution_automation_rule_id_fkey" FOREIGN KEY ("automation_rule_id") REFERENCES "public"."automation_rule"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."workflow_execution"
  ADD CONSTRAINT "workflow_execution_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."workflow_state"
  ADD CONSTRAINT "workflow_state_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



ALTER TABLE ONLY "public"."x12_transaction"
  ADD CONSTRAINT "x12_transaction_clearinghouse_id_fkey" FOREIGN KEY ("clearinghouse_id") REFERENCES "public"."clearinghouse_connection"("id");



ALTER TABLE ONLY "public"."x12_transaction"
  ADD CONSTRAINT "x12_transaction_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON
DELETE
CASCADE;



CREATE
POLICY "Admins can create payer configs" ON "public"."payer_submission_config" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['org_admin'::"text", 'super_admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Admins can delete work queue items" ON "public"."work_queue" FOR DELETE
TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "Admins can manage API keys" ON "public"."api_key" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage EHR connections" ON "public"."ehr_connection" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage KPI definitions" ON "public"."kpi_definition" TO "authenticated" USING (((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)) AND "public"."is_auth_admin"())) WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Admins can manage PA rules" ON "public"."pa_requirement_rule" TO "authenticated" USING ((("team_id" = "public"."get_current_team_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."user_profile"
  WHERE (("user_profile"."id" = "auth"."uid"()) AND (("user_profile"."role")::"text" = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text"])))))));



CREATE
POLICY "Admins can manage assignment rules" ON "public"."work_queue_assignment_rule" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage automation rules" ON "public"."automation_rule" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage business rules" ON "public"."business_rule" TO "authenticated" USING (((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)) AND "public"."is_auth_admin"())) WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Admins can manage clearinghouse connections" ON "public"."clearinghouse_connection" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage clinicians" ON "public"."clinician" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage credentialing" ON "public"."provider_credentialing" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage custom fields" ON "public"."custom_field" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage custom mappings" ON "public"."custom_field_mapping" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage formularies" ON "public"."drug_formulary" TO "authenticated" USING ("public"."is_auth_admin"()) WITH CHECK (true);



CREATE
POLICY "Admins can manage notification templates" ON "public"."notification_template" TO "authenticated" USING (((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)) AND "public"."is_auth_admin"())) WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Admins can manage payer configs" ON "public"."payer_config" TO "authenticated" USING ((("team_id" = "public"."get_current_team_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."user_profile"
  WHERE (("user_profile"."id" = "auth"."uid"()) AND (("user_profile"."role")::"text" = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text"])))))));



CREATE
POLICY "Admins can manage portal credentials" ON "public"."payer_portal_credential" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage provider enrollments" ON "public"."provider_enrollment" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage provider schedules" ON "public"."provider_schedule" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage report definitions" ON "public"."report_definition" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage scheduled tasks" ON "public"."scheduled_task" TO "authenticated" USING (((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)) AND "public"."is_auth_admin"())) WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Admins can manage service locations" ON "public"."service_location" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage team settings" ON "public"."team_settings" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage templates" ON "public"."document_template" TO "authenticated" USING (((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)) AND "public"."is_auth_admin"())) WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Admins can manage trading partners" ON "public"."trading_partner" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can manage webhooks" ON "public"."webhook_config" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Admins can update payer configs" ON "public"."payer_submission_config" FOR
UPDATE USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['org_admin'::"text", 'super_admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Admins can view all profiles" ON "public"."user_profile" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."user_profile" "user_profile_1"
  WHERE (("user_profile_1"."id" = "auth"."uid"()) AND ("user_profile_1"."role" = 'super_admin'::"public"."user_role")))));



CREATE
POLICY "Admins can view integration logs" ON "public"."integration_event_log" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "Admins can view portal credentials" ON "public"."payer_portal_credential" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "All users can view payer configs" ON "public"."payer_submission_config" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Allow admins to manage API versions" ON "public"."api_version" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profile"
  WHERE (("user_profile"."id" = "auth"."uid"()) AND (("user_profile"."role")::"text" = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profile"
  WHERE (("user_profile"."id" = "auth"."uid"()) AND (("user_profile"."role")::"text" = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text"]))))));



CREATE
POLICY "Allow authenticated users to read API versions" ON "public"."api_version" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Allow service role to delete API versions" ON "public"."api_version" FOR DELETE
TO "service_role" USING (true);



CREATE
POLICY "Allow service role to insert API versions" ON "public"."api_version" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE
POLICY "Allow service role to update API versions" ON "public"."api_version" FOR
UPDATE TO "service_role" USING (true)
WITH CHECK (true);



CREATE
POLICY "Anyone can view EHR systems" ON "public"."ehr_system" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view active CPT codes" ON "public"."cpt_code_master" FOR
SELECT TO "authenticated" USING (("is_active" = true));



CREATE
POLICY "Anyone can view active ICD-10 codes" ON "public"."icd10_code_master" FOR
SELECT TO "authenticated" USING (("is_active" = true));



CREATE
POLICY "Anyone can view adjustment reason codes" ON "public"."adjustment_reason_code" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view field mapping templates" ON "public"."field_mapping_template" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view model metrics" ON "public"."ml_model_metrics" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view modifier codes" ON "public"."modifier_code" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view place of service codes" ON "public"."place_of_service" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Anyone can view quality measure definitions" ON "public"."quality_measure" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Assigned users and admins can update work items" ON "public"."work_queue" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("assigned_to" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Authorized users can create claim batches" ON "public"."claim_submission_batch" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "team_member"."team_id"
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text") AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"]))))));



CREATE
POLICY "Authorized users can create payment sessions" ON "public"."payment_posting_session" FOR INSERT WITH CHECK ((("team_id" IN ( SELECT "team_member"."team_id"
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text") AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"]))))) AND ("posted_by" = "auth"."uid"())));



CREATE
POLICY "Billers and above can create eligibility checks" ON "public"."eligibility_check" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))));



CREATE
POLICY "Billers and above can manage insurance" ON "public"."insurance_policy" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers and admins can create batch jobs" ON "public"."batch_job" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"]))));



CREATE
POLICY "Billers and admins can manage fee schedules" ON "public"."fee_schedule" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers and admins can manage payers" ON "public"."payer" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers and admins can view collections" ON "public"."collection_account" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"]))));



CREATE
POLICY "Billers can create portal tasks" ON "public"."portal_automation_task" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"]))));



CREATE
POLICY "Billers can create variance records" ON "public"."payment_variance" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "team_member"."team_id"
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Billers can manage X12 transactions" ON "public"."x12_transaction" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage appeals" ON "public"."appeal" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage benefits coverage" ON "public"."benefits_coverage" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage claim attachments" ON "public"."claim_attachment" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage claims" ON "public"."claim" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage denial playbooks" ON "public"."denial_playbook" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage denials" ON "public"."denial_tracking" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage patient payments" ON "public"."patient_payment" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage payer messages" ON "public"."payer_response_message" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage payment details" ON "public"."payment_detail" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."remittance_advice" "ra"
  WHERE (("ra"."id" = "payment_detail"."remittance_advice_id") AND ("ra"."team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."remittance_advice" "ra"
  WHERE (("ra"."id" = "payment_detail"."remittance_advice_id") AND ("ra"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Billers can manage payment plans" ON "public"."payment_plan" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage reconciliation" ON "public"."payment_reconciliation" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage remittances" ON "public"."remittance_advice" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can manage statements" ON "public"."patient_statement" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Billers can update variance actions" ON "public"."payment_variance" FOR
UPDATE USING (("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))))
WITH CHECK (("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Billers can view credit balances" ON "public"."credit_balance" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text"]))));



CREATE
POLICY "Communication creators and admins can update" ON "public"."communication_log" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("created_by" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Document creators and admins can update" ON "public"."generated_document" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("created_by" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Document owners and admins can delete" ON "public"."document" FOR DELETE
TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("uploaded_by" = "auth"."uid"()) OR "public"."is_auth_admin"())));



CREATE
POLICY "Document owners and admins can update" ON "public"."document" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("uploaded_by" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Everyone can view system settings" ON "public"."system_settings" FOR
SELECT TO "authenticated" USING (true);



CREATE
POLICY "Job creators and admins can update batch jobs" ON "public"."batch_job" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("created_by" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "No client inserts to PHI export log" ON "public"."phi_export_log" FOR INSERT WITH CHECK (false);



CREATE
POLICY "No client inserts to clerk sync" ON "public"."clerk_user_sync" FOR INSERT WITH CHECK (false);



CREATE
POLICY "No client inserts to webhook log" ON "public"."clerk_webhook_log" FOR INSERT WITH CHECK (false);



CREATE
POLICY "No client updates to clerk sync" ON "public"."clerk_user_sync" FOR
UPDATE USING (false);



CREATE
POLICY "No deletion of PHI export logs" ON "public"."phi_export_log" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of claim batches" ON "public"."claim_submission_batch" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of clerk sync records" ON "public"."clerk_user_sync" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of payment sessions" ON "public"."payment_posting_session" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of payment variances" ON "public"."payment_variance" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of sessions" ON "public"."user_session" FOR DELETE
USING (false);



CREATE
POLICY "No deletion of webhook logs" ON "public"."clerk_webhook_log" FOR DELETE
USING (false);



CREATE
POLICY "No updates to PHI export log" ON "public"."phi_export_log" FOR
UPDATE USING (false);



CREATE
POLICY "No updates to webhook log" ON "public"."clerk_webhook_log" FOR
UPDATE USING (false);



CREATE
POLICY "Only admins can delete appointments" ON "public"."appointment" FOR DELETE
TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "Only admins can delete patient documents" ON "public"."patient_document" FOR DELETE
TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "Only admins can manage collections" ON "public"."collection_account" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Only admins can manage credit balances" ON "public"."credit_balance" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Only admins can view security audit logs" ON "public"."security_audit_log" FOR
SELECT TO "authenticated" USING ((("public"."get_auth_user_role"() = 'super_admin'::"text") OR ("public"."is_auth_admin"() AND ("team_id" = "public"."get_auth_team_id"()))));



CREATE
POLICY "Only super admins can insert teams" ON "public"."team" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Only super admins can manage EHR systems" ON "public"."ehr_system" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Only super admins can manage quality measures" ON "public"."quality_measure" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Only super admins can manage system settings" ON "public"."system_settings" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Org admins can view team PHI exports" ON "public"."phi_export_log" FOR
SELECT USING (("exported_by" IN ( SELECT "tm2"."user_id"
  FROM ("public"."team_member" "tm1"
  JOIN "public"."team_member" "tm2" ON (("tm1"."team_id" = "tm2"."team_id")))
  WHERE (("tm1"."user_id" = "auth"."uid"()) AND ("tm1"."role" = 'org_admin'::"text") AND ("tm1"."status" = 'active'::"text")))));



CREATE
POLICY "Providers and above can create patients" ON "public"."patient_profile" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))));



CREATE
POLICY "Providers and above can manage patients" ON "public"."patient" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and above can update patients" ON "public"."patient_profile" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and billers can manage prior auths" ON "public"."prior_auth" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and billers can update encounters" ON "public"."encounter" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and billers can update referrals" ON "public"."referral" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and staff can create appointments" ON "public"."appointment" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))));



CREATE
POLICY "Providers and staff can update appointments" ON "public"."appointment" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and staff can update documents" ON "public"."patient_document" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Providers and staff can upload documents" ON "public"."patient_document" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'biller'::"text", 'provider'::"text"]))));



CREATE
POLICY "Providers can create encounters" ON "public"."encounter" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'provider'::"text"]))));



CREATE
POLICY "Providers can create referrals" ON "public"."referral" FOR INSERT TO "authenticated" WITH CHECK ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'provider'::"text"]))));



CREATE
POLICY "Providers can manage patient quality measures" ON "public"."patient_quality_measure" TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND ("public"."get_auth_user_role"() = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'provider'::"text"])))) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Service role bypass for address" ON "public"."address" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for adjustment_reason_code" ON "public"."adjustment_reason_code" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for analytics_event" ON "public"."analytics_event" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for api_key" ON "public"."api_key" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for appeal" ON "public"."appeal" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for appointment" ON "public"."appointment" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for automation_event" ON "public"."automation_event" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for automation_rule" ON "public"."automation_rule" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for batch_job" ON "public"."batch_job" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for batch_job_item" ON "public"."batch_job_item" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for benefits_coverage" ON "public"."benefits_coverage" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for business_rule" ON "public"."business_rule" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for claim" ON "public"."claim" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for claim_attachment" ON "public"."claim_attachment" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for claim_state_history" ON "public"."claim_state_history" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for clearinghouse_connection" ON "public"."clearinghouse_connection" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for clinician" ON "public"."clinician" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for clinician_note" ON "public"."clinician_note" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for collection_account" ON "public"."collection_account" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for communication_log" ON "public"."communication_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for cpt_code_master" ON "public"."cpt_code_master" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for credit_balance" ON "public"."credit_balance" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for custom_field" ON "public"."custom_field" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for custom_field_mapping" ON "public"."custom_field_mapping" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for custom_field_value" ON "public"."custom_field_value" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for dashboard_metrics" ON "public"."dashboard_metrics" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for denial_playbook" ON "public"."denial_playbook" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for denial_tracking" ON "public"."denial_tracking" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for document" ON "public"."document" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for document_template" ON "public"."document_template" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for dosage" ON "public"."dosage" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for drug_formulary" ON "public"."drug_formulary" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for ehr_connection" ON "public"."ehr_connection" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for ehr_system" ON "public"."ehr_system" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for eligibility_cache" ON "public"."eligibility_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for eligibility_check" ON "public"."eligibility_check" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for encounter" ON "public"."encounter" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for failed_job" ON "public"."failed_job" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for fee_schedule" ON "public"."fee_schedule" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for fhir_resource" ON "public"."fhir_resource" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for field_mapping_template" ON "public"."field_mapping_template" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for generated_document" ON "public"."generated_document" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for generated_report" ON "public"."generated_report" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for icd10_code_master" ON "public"."icd10_code_master" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for insurance_policy" ON "public"."insurance_policy" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for intake" ON "public"."intake" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for integration_event_log" ON "public"."integration_event_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for kpi_definition" ON "public"."kpi_definition" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for kpi_snapshot" ON "public"."kpi_snapshot" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for medical_history" ON "public"."medical_history" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for medication" ON "public"."medication" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for medication_dosage" ON "public"."medication_dosage" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for medication_quantity" ON "public"."medication_quantity" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for ml_model_metrics" ON "public"."ml_model_metrics" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for ml_prediction" ON "public"."ml_prediction" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for modifier_code" ON "public"."modifier_code" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for notification" ON "public"."notification" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for notification_template" ON "public"."notification_template" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for pa_clinical_criteria" ON "public"."pa_clinical_criteria" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient" ON "public"."patient" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_diagnosis" ON "public"."patient_diagnosis" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_document" ON "public"."patient_document" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_payment" ON "public"."patient_payment" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_pharmacy" ON "public"."patient_pharmacy" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_profile" ON "public"."patient_profile" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_quality_measure" ON "public"."patient_quality_measure" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for patient_statement" ON "public"."patient_statement" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payer" ON "public"."payer" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payer_portal_credential" ON "public"."payer_portal_credential" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payer_response_message" ON "public"."payer_response_message" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payment_detail" ON "public"."payment_detail" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payment_plan" ON "public"."payment_plan" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for payment_reconciliation" ON "public"."payment_reconciliation" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for place_of_service" ON "public"."place_of_service" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for portal_automation_task" ON "public"."portal_automation_task" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for prescription" ON "public"."prescription" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for prescription_request" ON "public"."prescription_request" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for prior_auth" ON "public"."prior_auth" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for provider_credentialing" ON "public"."provider_credentialing" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for provider_enrollment" ON "public"."provider_enrollment" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for provider_schedule" ON "public"."provider_schedule" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for quality_measure" ON "public"."quality_measure" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for quantity" ON "public"."quantity" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for rate_limit_bucket" ON "public"."rate_limit_bucket" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for referral" ON "public"."referral" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for remittance_advice" ON "public"."remittance_advice" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for report_definition" ON "public"."report_definition" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for rule_execution_log" ON "public"."rule_execution_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for scheduled_task" ON "public"."scheduled_task" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for security_audit_log" ON "public"."security_audit_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for service_location" ON "public"."service_location" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for sync_job" ON "public"."sync_job" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for system_settings" ON "public"."system_settings" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for team" ON "public"."team" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for team_invitation" ON "public"."team_invitation" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for team_member" ON "public"."team_member" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for team_settings" ON "public"."team_settings" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for trading_partner" ON "public"."trading_partner" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for user_profile" ON "public"."user_profile" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for webhook_config" ON "public"."webhook_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for webhook_event" ON "public"."webhook_event" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for work_queue" ON "public"."work_queue" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for work_queue_assignment_rule" ON "public"."work_queue_assignment_rule" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for workflow_execution" ON "public"."workflow_execution" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Service role bypass for x12_transaction" ON "public"."x12_transaction" TO "service_role" USING (true) WITH CHECK (true);



CREATE
POLICY "Super admins can delete payer configs" ON "public"."payer_submission_config" FOR DELETE
USING ((EXISTS ( SELECT 1
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = 'super_admin'::"text") AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Super admins can manage CPT codes" ON "public"."cpt_code_master" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage ICD-10 codes" ON "public"."icd10_code_master" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage PA criteria" ON "public"."pa_clinical_criteria" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (true);



CREATE
POLICY "Super admins can manage adjustment reason codes" ON "public"."adjustment_reason_code" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage model metrics" ON "public"."ml_model_metrics" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage modifier codes" ON "public"."modifier_code" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage place of service codes" ON "public"."place_of_service" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can manage templates" ON "public"."field_mapping_template" TO "authenticated" USING (("public"."get_auth_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_auth_user_role"() = 'super_admin'::"text"));



CREATE
POLICY "Super admins can view PHI export logs" ON "public"."phi_export_log" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = 'super_admin'::"text") AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Super admins can view all sessions" ON "public"."user_session" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = 'super_admin'::"text") AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Super admins can view all sync records" ON "public"."clerk_user_sync" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = 'super_admin'::"text") AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Super admins can view webhook logs" ON "public"."clerk_webhook_log" FOR
SELECT USING ((EXISTS ( SELECT 1
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = 'super_admin'::"text") AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "System can create KPI snapshots" ON "public"."kpi_snapshot" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create analytics events" ON "public"."analytics_event" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create audit logs" ON "public"."security_audit_log" FOR INSERT TO "authenticated" WITH CHECK (((("user_id" IS NULL) OR ("user_id" = "auth"."uid"())) AND (("team_id" IS NULL) OR ("team_id" = "public"."get_auth_team_id"()))));



CREATE
POLICY "System can create automation events" ON "public"."automation_event" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create integration logs" ON "public"."integration_event_log" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create notifications" ON "public"."notification" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create rule execution logs" ON "public"."rule_execution_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_rule" "br"
  WHERE (("br"."id" = "rule_execution_log"."business_rule_id") AND (("br"."team_id" = "public"."get_auth_team_id"()) OR ("br"."team_id" IS NULL))))));



CREATE
POLICY "System can create webhook events" ON "public"."webhook_event" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."webhook_config"
  WHERE (("webhook_config"."id" = "webhook_event"."webhook_config_id") AND ("webhook_config"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "System can create work queue items" ON "public"."work_queue" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can create workflow executions" ON "public"."workflow_execution" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can insert claim history" ON "public"."claim_state_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."claim"
  WHERE ((("claim"."id")::"text" = ("claim_state_history"."claim_id")::"text") AND ("claim"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "System can insert scrubbing results" ON "public"."scrubbing_result" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "System can manage ERA line details" ON "public"."era_line_detail" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."payment_detail" "pd"
     JOIN "public"."remittance_advice" "ra" ON (("pd"."remittance_advice_id" = "ra"."id")))
  WHERE (("pd"."id" = "era_line_detail"."payment_detail_id") AND ("ra"."team_id" = "public"."get_current_team_id"())))));



CREATE
POLICY "System can manage FHIR resources" ON "public"."fhir_resource" TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can manage automation retries" ON "public"."automation_retry" TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "System can manage batch job items" ON "public"."batch_job_item" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."batch_job" "bj"
  WHERE (("bj"."id" = "batch_job_item"."batch_job_id") AND ("bj"."team_id" = "public"."get_auth_team_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."batch_job" "bj"
  WHERE (("bj"."id" = "batch_job_item"."batch_job_id") AND ("bj"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "System can manage claim lines" ON "public"."claim_line" TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "System can manage clearinghouse batches" ON "public"."clearinghouse_batch" TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "System can manage eligibility cache" ON "public"."eligibility_cache" TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can manage failed jobs" ON "public"."failed_job" TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can manage predictions" ON "public"."ml_prediction" TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can manage sync jobs" ON "public"."sync_job" TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"())) WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can manage workflow states" ON "public"."workflow_state" TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "System can update eligibility checks" ON "public"."eligibility_check" FOR
UPDATE TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "System can update portal tasks" ON "public"."portal_automation_task" FOR
UPDATE TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team admins can manage invitations" ON "public"."team_invitation" USING (("team_id" IN ( SELECT "team_member"."team_id"
   FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Team admins can manage team members" ON "public"."team_member" USING (("team_id" IN ( SELECT "team_member_1"."team_id"
   FROM "public"."team_member" "team_member_1"
  WHERE (("team_member_1"."user_id" = "auth"."uid"()) AND ("team_member_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("team_member_1"."status" = 'active'::"text")))));



CREATE
POLICY "Team admins can remove team members" ON "public"."team_member" FOR DELETE
TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()));



CREATE
POLICY "Team admins can update team members" ON "public"."team_member" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team admins can update their team" ON "public"."team" FOR
UPDATE TO "authenticated" USING ((("id" = "public"."get_auth_team_id"()) AND "public"."is_auth_admin"()))
WITH CHECK (("id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can generate reports" ON "public"."generated_report" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can manage custom field values" ON "public"."custom_field_value" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."custom_field"
  WHERE (("custom_field"."id" = "custom_field_value"."custom_field_id") AND ("custom_field"."team_id" = "public"."get_auth_team_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."custom_field"
  WHERE (("custom_field"."id" = "custom_field_value"."custom_field_id") AND ("custom_field"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team can view KPI definitions" ON "public"."kpi_definition" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Team can view assignment rules" ON "public"."work_queue_assignment_rule" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view batch job items" ON "public"."batch_job_item" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."batch_job" "bj"
  WHERE (("bj"."id" = "batch_job_item"."batch_job_id") AND ("bj"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team can view communications" ON "public"."communication_log" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view custom field values" ON "public"."custom_field_value" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."custom_field"
  WHERE (("custom_field"."id" = "custom_field_value"."custom_field_id") AND ("custom_field"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team can view generated documents" ON "public"."generated_document" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view portal tasks" ON "public"."portal_automation_task" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view templates" ON "public"."document_template" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Team can view their API keys" ON "public"."api_key" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their FHIR resources" ON "public"."fhir_resource" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their KPI snapshots" ON "public"."kpi_snapshot" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their analytics" ON "public"."analytics_event" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their automation rules" ON "public"."automation_rule" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their batch jobs" ON "public"."batch_job" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their claim attachments" ON "public"."claim_attachment" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their clearinghouse connections" ON "public"."clearinghouse_connection" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their custom fields" ON "public"."custom_field" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their custom mappings" ON "public"."custom_field_mapping" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their documents" ON "public"."document" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their eligibility cache" ON "public"."eligibility_cache" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their failed jobs" ON "public"."failed_job" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their generated reports" ON "public"."generated_report" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their payer messages" ON "public"."payer_response_message" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their provider enrollments" ON "public"."provider_enrollment" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their reports" ON "public"."report_definition" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("is_public" = true)));



CREATE
POLICY "Team can view their rule executions" ON "public"."rule_execution_log" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."business_rule" "br"
  WHERE (("br"."id" = "rule_execution_log"."business_rule_id") AND (("br"."team_id" = "public"."get_auth_team_id"()) OR ("br"."team_id" IS NULL))))));



CREATE
POLICY "Team can view their scheduled tasks" ON "public"."scheduled_task" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Team can view their settings" ON "public"."team_settings" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their sync jobs" ON "public"."sync_job" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their templates" ON "public"."notification_template" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Team can view their transactions" ON "public"."x12_transaction" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view their webhooks" ON "public"."webhook_config" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view trading partners" ON "public"."trading_partner" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team can view webhook events" ON "public"."webhook_event" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."webhook_config"
  WHERE (("webhook_config"."id" = "webhook_event"."webhook_config_id") AND ("webhook_config"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team can view workflow executions" ON "public"."workflow_execution" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can generate documents" ON "public"."generated_document" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can log communications" ON "public"."communication_log" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can upload documents" ON "public"."document" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view appeals" ON "public"."appeal" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view appointments" ON "public"."appointment" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view automation events" ON "public"."automation_event" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view benefits coverage" ON "public"."benefits_coverage" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view claim history" ON "public"."claim_state_history" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."claim"
  WHERE ((("claim"."id")::"text" = ("claim_state_history"."claim_id")::"text") AND ("claim"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team members can view claims" ON "public"."claim" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view credentialing" ON "public"."provider_credentialing" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view denial playbooks" ON "public"."denial_playbook" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view denials" ON "public"."denial_tracking" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view eligibility checks" ON "public"."eligibility_check" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view encounters" ON "public"."encounter" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view fee schedules" ON "public"."fee_schedule" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view insurance policies" ON "public"."insurance_policy" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view patient documents" ON "public"."patient_document" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view patient payments" ON "public"."patient_payment" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view patient quality measures" ON "public"."patient_quality_measure" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view payment details" ON "public"."payment_detail" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM "public"."remittance_advice" "ra"
  WHERE (("ra"."id" = "payment_detail"."remittance_advice_id") AND ("ra"."team_id" = "public"."get_auth_team_id"())))));



CREATE
POLICY "Team members can view payment plans" ON "public"."payment_plan" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view payment sessions" ON "public"."payment_posting_session" FOR
SELECT USING (("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Team members can view payment variances" ON "public"."payment_variance" FOR
SELECT USING (("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Team members can view predictions" ON "public"."ml_prediction" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view prior auths" ON "public"."prior_auth" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view reconciliation" ON "public"."payment_reconciliation" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view referrals" ON "public"."referral" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view remittances" ON "public"."remittance_advice" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view schedules" ON "public"."provider_schedule" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view service locations" ON "public"."service_location" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view statements" ON "public"."patient_statement" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their EHR connections" ON "public"."ehr_connection" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their claim batches" ON "public"."claim_submission_batch" FOR
SELECT USING (("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Team members can view their clinicians" ON "public"."clinician" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their patients" ON "public"."patient" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their patients" ON "public"."patient_profile" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their payers" ON "public"."payer" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their rules" ON "public"."business_rule" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Team members can view their teammates" ON "public"."team_member" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Team members can view their work queue" ON "public"."work_queue" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("assigned_to" IS NULL) OR ("assigned_to" = "auth"."uid"()) OR "public"."is_auth_admin"())));



CREATE
POLICY "Team owners/admins can update their team" ON "public"."team" FOR
UPDATE USING (("id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Teams can view criteria for their payers" ON "public"."pa_clinical_criteria" FOR
SELECT TO "authenticated" USING ((("payer_id" IN ( SELECT DISTINCT "ip"."payer_id"
  FROM ("public"."insurance_policy" "ip"
  JOIN "public"."patient" "p" ON (("ip"."patient_id" = "p"."id")))
  WHERE ("p"."team_id" = "public"."get_auth_team_id"()))) OR ("payer_id" IS NULL)));



CREATE
POLICY "Teams can view formularies for their payers" ON "public"."drug_formulary" FOR
SELECT TO "authenticated" USING ((("payer_id" IN ( SELECT DISTINCT "ip"."payer_id"
  FROM ("public"."insurance_policy" "ip"
  JOIN "public"."patient" "p" ON (("ip"."patient_id" = "p"."id")))
  WHERE ("p"."team_id" = "public"."get_auth_team_id"()))) OR ("payer_id" IS NULL)));



CREATE
POLICY "Update only pending claim batches" ON "public"."claim_submission_batch" FOR
UPDATE USING ((("team_id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text") AND ("team_member"."role" = ANY (ARRAY['biller'::"text", 'org_admin'::"text", 'super_admin'::"text"]))))) AND ("status" = ANY (ARRAY['preparing'::"text", 'rejected'::"text"]))));



CREATE
POLICY "Update own incomplete payment sessions" ON "public"."payment_posting_session" FOR
UPDATE USING ((("posted_by" = "auth"."uid"()) AND ("completed_at" IS NULL)))
WITH CHECK (("posted_by" = "auth"."uid"()));



CREATE
POLICY "Users can create own sessions" ON "public"."user_session" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE
POLICY "Users can create payment adjustments in their team" ON "public"."payment_adjustment" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can insert claim validations in their team" ON "public"."claim_validation" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can only see their team's data" ON "public"."ehr_connection" TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can update own active sessions" ON "public"."user_session" FOR
UPDATE USING ((("user_id" = "auth"."uid"()) AND ("ended_at" IS NULL)));



CREATE
POLICY "Users can update own profile" ON "public"."user_profile" FOR
UPDATE USING (("auth"."uid"() = "id"));



CREATE
POLICY "Users can update their notifications" ON "public"."notification" FOR
UPDATE TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("team_member_id" = "auth"."uid"()) OR "public"."is_auth_admin"())))
WITH CHECK (("team_id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Users can upload PA documents in their team" ON "public"."pa_supporting_document" FOR INSERT TO "authenticated" WITH CHECK (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view ERA line details" ON "public"."era_line_detail" FOR
SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
  FROM ("public"."payment_detail" "pd"
  JOIN "public"."remittance_advice" "ra" ON (("pd"."remittance_advice_id" = "ra"."id")))
  WHERE (("pd"."id" = "era_line_detail"."payment_detail_id") AND ("ra"."team_id" = "public"."get_current_team_id"())))));



CREATE
POLICY "Users can view PA documents in their team" ON "public"."pa_supporting_document" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view PA rules in their team" ON "public"."pa_requirement_rule" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_current_team_id"()) OR ("team_id" IS NULL)));



CREATE
POLICY "Users can view automation retries in their team" ON "public"."automation_retry" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view claim lines in their team" ON "public"."claim_line" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view claim validations in their team" ON "public"."claim_validation" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view clearinghouse batches in their team" ON "public"."clearinghouse_batch" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view own profile" ON "public"."user_profile" FOR
SELECT USING (("auth"."uid"() = "id"));



CREATE
POLICY "Users can view own sessions" ON "public"."user_session" FOR
SELECT USING (("user_id" = "auth"."uid"()));



CREATE
POLICY "Users can view own sync record" ON "public"."clerk_user_sync" FOR
SELECT USING (("supabase_user_id" = "auth"."uid"()));



CREATE
POLICY "Users can view payer configs in their team" ON "public"."payer_config" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view payment adjustments in their team" ON "public"."payment_adjustment" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view scrubbing results in their team" ON "public"."scrubbing_result" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



CREATE
POLICY "Users can view team members of their teams" ON "public"."team_member" FOR
SELECT USING (("team_id" IN ( SELECT "tm"."team_id"
  FROM "public"."team_member" "tm"
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("tm"."status" = 'active'::"text")))));



CREATE
POLICY "Users can view teams they belong to" ON "public"."team" FOR
SELECT USING (("id" IN ( SELECT "team_member"."team_id"
  FROM "public"."team_member"
  WHERE (("team_member"."user_id" = "auth"."uid"()) AND ("team_member"."status" = 'active'::"text")))));



CREATE
POLICY "Users can view their notifications" ON "public"."notification" FOR
SELECT TO "authenticated" USING ((("team_id" = "public"."get_auth_team_id"()) AND (("team_member_id" = "auth"."uid"()) OR "public"."is_auth_admin"())));



CREATE
POLICY "Users can view their own team" ON "public"."team" FOR
SELECT TO "authenticated" USING (("id" = "public"."get_auth_team_id"()));



CREATE
POLICY "Users can view their team audit logs" ON "public"."audit_log" FOR
SELECT USING ((("auth_uid" = "auth"."uid"()) OR ("team_id" IN ( SELECT "t"."team_id"
  FROM "public"."team_member" "t"
  WHERE ("t"."user_id" = "auth"."uid"())))));



CREATE
POLICY "Users can view workflow states in their team" ON "public"."workflow_state" FOR
SELECT TO "authenticated" USING (("team_id" = "public"."get_current_team_id"()));



ALTER TABLE "public"."address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."adjustment_reason_code" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_key" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_version" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appeal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_retry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_rule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."batch_job" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."batch_job_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."benefits_coverage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_rule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_attachment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_line" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_state_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_submission_batch" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_validation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clearinghouse_batch" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clearinghouse_connection" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clerk_user_sync" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clerk_webhook_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinician" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinician_note" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cpt_code_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_balance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_field" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_field_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_field_value" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."denial_playbook" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."denial_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_template" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dosage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drug_formulary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ehr_connection" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ehr_system" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eligibility_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eligibility_check" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."encounter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."era_line_detail" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."failed_job" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fee_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fhir_resource" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_mapping_template" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_report" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."icd10_code_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_policy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intake" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_event_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_definition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_snapshot" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_dosage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_quantity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_model_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_prediction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modifier_code" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_template" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pa_clinical_criteria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pa_requirement_rule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pa_supporting_document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_diagnosis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_payment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_pharmacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_quality_measure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_statement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer_portal_credential" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer_response_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payer_submission_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_adjustment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_detail" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_posting_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_reconciliation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_variance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phi_export_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."place_of_service" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portal_automation_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription_request" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prior_auth" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_credentialing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_enrollment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quality_measure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_bucket" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."remittance_advice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_definition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rule_execution_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scrubbing_result" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_location" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_job" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invitation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_member" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_partner" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_queue_assignment_rule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_execution" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."x12_transaction" ENABLE ROW LEVEL SECURITY;



ALTER
PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA
"public" TO "postgres";
GRANT USAGE ON SCHEMA
"public" TO "anon";
GRANT USAGE ON SCHEMA
"public" TO "authenticated";
GRANT USAGE ON SCHEMA
"public" TO "service_role";






GRANT ALL
ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";


































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL
ON FUNCTION "public"."accept_team_invitation"("invitation_token" "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."accept_team_invitation"("invitation_token" "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."accept_team_invitation"("invitation_token" "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."audit_credit_refunds"() TO "anon";
GRANT ALL
ON FUNCTION "public"."audit_credit_refunds"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."audit_credit_refunds"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."audit_formulary_changes"() TO "anon";
GRANT ALL
ON FUNCTION "public"."audit_formulary_changes"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."audit_formulary_changes"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."audit_payment_plan_changes"() TO "anon";
GRANT ALL
ON FUNCTION "public"."audit_payment_plan_changes"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."audit_payment_plan_changes"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."audit_sensitive_changes"() TO "anon";
GRANT ALL
ON FUNCTION "public"."audit_sensitive_changes"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."audit_sensitive_changes"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."audit_trigger_function"() TO "anon";
GRANT ALL
ON FUNCTION "public"."audit_trigger_function"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."audit_trigger_function"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."auto_post_era_payment"("p_remittance_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."auto_post_era_payment"("p_remittance_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."auto_post_era_payment"("p_remittance_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."calculate_contractual_adjustment"("p_claim_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."calculate_contractual_adjustment"("p_claim_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."calculate_contractual_adjustment"("p_claim_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."calculate_days_in_ar"("claim_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."calculate_days_in_ar"("claim_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."calculate_days_in_ar"("claim_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."calculate_next_retry"("p_attempt_number" integer, "p_strategy" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."calculate_next_retry"("p_attempt_number" integer, "p_strategy" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."calculate_next_retry"("p_attempt_number" integer, "p_strategy" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."calculate_patient_balance"("p_patient_id" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."calculate_patient_balance"("p_patient_id" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."calculate_patient_balance"("p_patient_id" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."calculate_variance"() TO "anon";
GRANT ALL
ON FUNCTION "public"."calculate_variance"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."calculate_variance"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."can_provider_bill_payer"("p_clinician_id" integer, "p_payer_id" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."can_provider_bill_payer"("p_clinician_id" integer, "p_payer_id" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."can_provider_bill_payer"("p_clinician_id" integer, "p_payer_id" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_appointment_eligibility"() TO "anon";
GRANT ALL
ON FUNCTION "public"."check_appointment_eligibility"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_appointment_eligibility"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_drug_requires_pa"("p_payer_id" integer, "p_ndc_code" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."check_drug_requires_pa"("p_payer_id" integer, "p_ndc_code" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_drug_requires_pa"("p_payer_id" integer, "p_ndc_code" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_era_not_duplicate"() TO "anon";
GRANT ALL
ON FUNCTION "public"."check_era_not_duplicate"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_era_not_duplicate"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_pa_required"("p_payer_id" integer, "p_cpt_code" character varying, "p_icd10_codes" character varying[], "p_service_date" "date") TO "anon";
GRANT ALL
ON FUNCTION "public"."check_pa_required"("p_payer_id" integer, "p_cpt_code" character varying, "p_icd10_codes" character varying[], "p_service_date" "date") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_pa_required"("p_payer_id" integer, "p_cpt_code" character varying, "p_icd10_codes" character varying[], "p_service_date" "date") TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_prior_auth_requirement"("p_patient_id" integer, "p_ndc_code" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."check_prior_auth_requirement"("p_patient_id" integer, "p_ndc_code" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_prior_auth_requirement"("p_patient_id" integer, "p_ndc_code" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."check_timely_filing"("p_claim_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."check_timely_filing"("p_claim_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."check_timely_filing"("p_claim_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."cleanup_expired_alerts"() TO "anon";
GRANT ALL
ON FUNCTION "public"."cleanup_expired_alerts"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."cleanup_expired_alerts"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL
ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."create_claim_lines"() TO "anon";
GRANT ALL
ON FUNCTION "public"."create_claim_lines"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."create_claim_lines"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."create_denial_work_queue"() TO "anon";
GRANT ALL
ON FUNCTION "public"."create_denial_work_queue"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."create_denial_work_queue"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."create_team_with_owner"("team_name" "text", "team_slug" "text", "owner_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."create_team_with_owner"("team_name" "text", "team_slug" "text", "owner_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."create_team_with_owner"("team_name" "text", "team_slug" "text", "owner_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."end_stale_sessions"() TO "anon";
GRANT ALL
ON FUNCTION "public"."end_stale_sessions"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."end_stale_sessions"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."flag_claims_for_followup"() TO "anon";
GRANT ALL
ON FUNCTION "public"."flag_claims_for_followup"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."flag_claims_for_followup"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_ar_aging_summary"("p_team_id" "uuid", "p_as_of_date" "date") TO "anon";
GRANT ALL
ON FUNCTION "public"."get_ar_aging_summary"("p_team_id" "uuid", "p_as_of_date" "date") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_ar_aging_summary"("p_team_id" "uuid", "p_as_of_date" "date") TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_auth_team_id"() TO "anon";
GRANT ALL
ON FUNCTION "public"."get_auth_team_id"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_auth_team_id"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_auth_user_role"() TO "anon";
GRANT ALL
ON FUNCTION "public"."get_auth_user_role"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_auth_user_role"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_available_appointment_slots"("p_provider_id" integer, "p_date" "date", "p_location_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_available_appointment_slots"("p_provider_id" integer, "p_date" "date", "p_location_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_available_appointment_slots"("p_provider_id" integer, "p_date" "date", "p_location_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_claim_age_days"("p_claim_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_claim_age_days"("p_claim_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_claim_age_days"("p_claim_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_claim_readiness_score"("p_claim_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_claim_readiness_score"("p_claim_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_claim_readiness_score"("p_claim_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_current_team_id"() TO "anon";
GRANT ALL
ON FUNCTION "public"."get_current_team_id"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_current_team_id"() TO "service_role";



GRANT ALL
ON TABLE "public"."scheduled_task" TO "anon";
GRANT ALL
ON TABLE "public"."scheduled_task" TO "authenticated";
GRANT ALL
ON TABLE "public"."scheduled_task" TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_next_scheduled_task"() TO "anon";
GRANT ALL
ON FUNCTION "public"."get_next_scheduled_task"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_next_scheduled_task"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_next_work_item"("user_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."get_next_work_item"("user_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_next_work_item"("user_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_patient_financial_summary"("p_patient_id" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_patient_financial_summary"("p_patient_id" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_patient_financial_summary"("p_patient_id" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_patients_for_clinical_engine"() TO "anon";
GRANT ALL
ON FUNCTION "public"."get_patients_for_clinical_engine"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_patients_for_clinical_engine"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_prior_auth_metrics"("weeks_back" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_prior_auth_metrics"("weeks_back" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_prior_auth_metrics"("weeks_back" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_revenue_cycle_metrics"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL
ON FUNCTION "public"."get_revenue_cycle_metrics"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_revenue_cycle_metrics"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_security_audit_logs"("p_user_id" "uuid", "p_action" character varying, "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."get_security_audit_logs"("p_user_id" "uuid", "p_action" character varying, "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_security_audit_logs"("p_user_id" "uuid", "p_action" character varying, "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL
ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL
ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL
ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL
ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL
ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."increment_retry_attempt"() TO "anon";
GRANT ALL
ON FUNCTION "public"."increment_retry_attempt"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."increment_retry_attempt"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."is_auth_admin"() TO "anon";
GRANT ALL
ON FUNCTION "public"."is_auth_admin"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."is_auth_admin"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL
ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL
ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL
ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL
ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL
ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."log_clerk_webhook"("p_event_type" "text", "p_clerk_id" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL
ON FUNCTION "public"."log_clerk_webhook"("p_event_type" "text", "p_clerk_id" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."log_clerk_webhook"("p_event_type" "text", "p_clerk_id" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL
ON FUNCTION "public"."log_phi_export"("p_export_type" "text", "p_record_count" integer, "p_entity_types" "text"[], "p_purpose" "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."log_phi_export"("p_export_type" "text", "p_record_count" integer, "p_entity_types" "text"[], "p_purpose" "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."log_phi_export"("p_export_type" "text", "p_record_count" integer, "p_entity_types" "text"[], "p_purpose" "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text", "custom_team_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text", "custom_team_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."log_security_event"("action" character varying, "error_msg" "text", "custom_team_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."match_guidelines"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL
ON FUNCTION "public"."match_guidelines"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."match_guidelines"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL
ON FUNCTION "public"."migrate_patient_alerts_to_unified_system"() TO "anon";
GRANT ALL
ON FUNCTION "public"."migrate_patient_alerts_to_unified_system"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."migrate_patient_alerts_to_unified_system"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."prevent_duplicate_claim"() TO "anon";
GRANT ALL
ON FUNCTION "public"."prevent_duplicate_claim"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."prevent_duplicate_claim"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."refresh_materialized_views"() TO "anon";
GRANT ALL
ON FUNCTION "public"."refresh_materialized_views"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."schedule_metrics_refresh"() TO "anon";
GRANT ALL
ON FUNCTION "public"."schedule_metrics_refresh"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."search_guidelines_text"("search_query" "text", "match_count" integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."search_guidelines_text"("search_query" "text", "match_count" integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."search_guidelines_text"("search_query" "text", "match_count" integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL
ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL
ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL
ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL
ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL
ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL
ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL
ON FUNCTION "public"."sync_clerk_user"("p_clerk_user_id" "text", "p_supabase_user_id" "uuid", "p_organization_id" "text", "p_team_id" "uuid") TO "anon";
GRANT ALL
ON FUNCTION "public"."sync_clerk_user"("p_clerk_user_id" "text", "p_supabase_user_id" "uuid", "p_organization_id" "text", "p_team_id" "uuid") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sync_clerk_user"("p_clerk_user_id" "text", "p_supabase_user_id" "uuid", "p_organization_id" "text", "p_team_id" "uuid") TO "service_role";



GRANT ALL
ON FUNCTION "public"."track_workflow_state"() TO "anon";
GRANT ALL
ON FUNCTION "public"."track_workflow_state"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."track_workflow_state"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL
ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL
ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL
ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL
ON FUNCTION "public"."upsert_fhir_resource"("p_team_id" "uuid", "p_resource_type" character varying, "p_resource_id" character varying, "p_resource_data" "jsonb", "p_mapped_entity_type" character varying, "p_mapped_entity_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."upsert_fhir_resource"("p_team_id" "uuid", "p_resource_type" character varying, "p_resource_id" character varying, "p_resource_data" "jsonb", "p_mapped_entity_type" character varying, "p_mapped_entity_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."upsert_fhir_resource"("p_team_id" "uuid", "p_resource_type" character varying, "p_resource_id" character varying, "p_resource_data" "jsonb", "p_mapped_entity_type" character varying, "p_mapped_entity_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."validate_provider_billing"("p_encounter_id" character varying) TO "anon";
GRANT ALL
ON FUNCTION "public"."validate_provider_billing"("p_encounter_id" character varying) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."validate_provider_billing"("p_encounter_id" character varying) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL
ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL
ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL
ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";












GRANT ALL
ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL
ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL
ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL
ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL
ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL
ON FUNCTION "public"."sum"("public"."vector") TO "service_role";







































GRANT ALL
ON TABLE "public"."prior_auth" TO "anon";
GRANT ALL
ON TABLE "public"."prior_auth" TO "authenticated";
GRANT ALL
ON TABLE "public"."prior_auth" TO "service_role";



GRANT ALL
ON TABLE "public"."_internal_prior_auth_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."_internal_prior_auth_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."claim" TO "anon";
GRANT ALL
ON TABLE "public"."claim" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim" TO "service_role";



GRANT ALL
ON TABLE "public"."_internal_revenue_cycle_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."_internal_revenue_cycle_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."encounter" TO "anon";
GRANT ALL
ON TABLE "public"."encounter" TO "authenticated";
GRANT ALL
ON TABLE "public"."encounter" TO "service_role";



GRANT ALL
ON TABLE "public"."patient" TO "anon";
GRANT ALL
ON TABLE "public"."patient" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_profile" TO "anon";
GRANT ALL
ON TABLE "public"."patient_profile" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_profile" TO "service_role";



GRANT ALL
ON TABLE "public"."payer" TO "anon";
GRANT ALL
ON TABLE "public"."payer" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer" TO "service_role";



GRANT ALL
ON TABLE "public"."active_claims" TO "anon";
GRANT ALL
ON TABLE "public"."active_claims" TO "authenticated";
GRANT ALL
ON TABLE "public"."active_claims" TO "service_role";



GRANT ALL
ON TABLE "public"."user_profile" TO "anon";
GRANT ALL
ON TABLE "public"."user_profile" TO "authenticated";
GRANT ALL
ON TABLE "public"."user_profile" TO "service_role";



GRANT ALL
ON TABLE "public"."user_session" TO "anon";
GRANT ALL
ON TABLE "public"."user_session" TO "authenticated";
GRANT ALL
ON TABLE "public"."user_session" TO "service_role";



GRANT ALL
ON TABLE "public"."active_user_sessions" TO "anon";
GRANT ALL
ON TABLE "public"."active_user_sessions" TO "authenticated";
GRANT ALL
ON TABLE "public"."active_user_sessions" TO "service_role";



GRANT ALL
ON TABLE "public"."address" TO "anon";
GRANT ALL
ON TABLE "public"."address" TO "authenticated";
GRANT ALL
ON TABLE "public"."address" TO "service_role";



GRANT ALL
ON TABLE "public"."adjustment_reason_code" TO "anon";
GRANT ALL
ON TABLE "public"."adjustment_reason_code" TO "authenticated";
GRANT ALL
ON TABLE "public"."adjustment_reason_code" TO "service_role";



GRANT ALL
ON TABLE "public"."analytics_event" TO "anon";
GRANT ALL
ON TABLE "public"."analytics_event" TO "authenticated";
GRANT ALL
ON TABLE "public"."analytics_event" TO "service_role";



GRANT ALL
ON TABLE "public"."api_key" TO "anon";
GRANT ALL
ON TABLE "public"."api_key" TO "authenticated";
GRANT ALL
ON TABLE "public"."api_key" TO "service_role";



GRANT ALL
ON TABLE "public"."api_version" TO "anon";
GRANT ALL
ON TABLE "public"."api_version" TO "authenticated";
GRANT ALL
ON TABLE "public"."api_version" TO "service_role";



GRANT ALL
ON TABLE "public"."appeal" TO "anon";
GRANT ALL
ON TABLE "public"."appeal" TO "authenticated";
GRANT ALL
ON TABLE "public"."appeal" TO "service_role";



GRANT ALL
ON TABLE "public"."appointment" TO "anon";
GRANT ALL
ON TABLE "public"."appointment" TO "authenticated";
GRANT ALL
ON TABLE "public"."appointment" TO "service_role";



GRANT ALL
ON TABLE "public"."ar_aging_detail" TO "anon";
GRANT ALL
ON TABLE "public"."ar_aging_detail" TO "authenticated";
GRANT ALL
ON TABLE "public"."ar_aging_detail" TO "service_role";



GRANT ALL
ON TABLE "public"."audit_log" TO "anon";
GRANT ALL
ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL
ON TABLE "public"."automation_event" TO "anon";
GRANT ALL
ON TABLE "public"."automation_event" TO "authenticated";
GRANT ALL
ON TABLE "public"."automation_event" TO "service_role";



GRANT ALL
ON TABLE "public"."automation_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."automation_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."automation_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."automation_retry" TO "anon";
GRANT ALL
ON TABLE "public"."automation_retry" TO "authenticated";
GRANT ALL
ON TABLE "public"."automation_retry" TO "service_role";



GRANT ALL
ON TABLE "public"."automation_rule" TO "anon";
GRANT ALL
ON TABLE "public"."automation_rule" TO "authenticated";
GRANT ALL
ON TABLE "public"."automation_rule" TO "service_role";



GRANT ALL
ON TABLE "public"."batch_job" TO "anon";
GRANT ALL
ON TABLE "public"."batch_job" TO "authenticated";
GRANT ALL
ON TABLE "public"."batch_job" TO "service_role";



GRANT ALL
ON TABLE "public"."batch_job_item" TO "anon";
GRANT ALL
ON TABLE "public"."batch_job_item" TO "authenticated";
GRANT ALL
ON TABLE "public"."batch_job_item" TO "service_role";



GRANT ALL
ON TABLE "public"."benefits_coverage" TO "anon";
GRANT ALL
ON TABLE "public"."benefits_coverage" TO "authenticated";
GRANT ALL
ON TABLE "public"."benefits_coverage" TO "service_role";



GRANT ALL
ON TABLE "public"."business_rule" TO "anon";
GRANT ALL
ON TABLE "public"."business_rule" TO "authenticated";
GRANT ALL
ON TABLE "public"."business_rule" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_attachment" TO "anon";
GRANT ALL
ON TABLE "public"."claim_attachment" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_attachment" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_dashboard" TO "anon";
GRANT ALL
ON TABLE "public"."claim_dashboard" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_dashboard" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_line" TO "anon";
GRANT ALL
ON TABLE "public"."claim_line" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_line" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_state_history" TO "anon";
GRANT ALL
ON TABLE "public"."claim_state_history" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_state_history" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_submission_batch" TO "anon";
GRANT ALL
ON TABLE "public"."claim_submission_batch" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_submission_batch" TO "service_role";



GRANT ALL
ON TABLE "public"."claim_validation" TO "anon";
GRANT ALL
ON TABLE "public"."claim_validation" TO "authenticated";
GRANT ALL
ON TABLE "public"."claim_validation" TO "service_role";



GRANT ALL
ON TABLE "public"."clearinghouse_batch" TO "anon";
GRANT ALL
ON TABLE "public"."clearinghouse_batch" TO "authenticated";
GRANT ALL
ON TABLE "public"."clearinghouse_batch" TO "service_role";



GRANT ALL
ON TABLE "public"."clearinghouse_connection" TO "anon";
GRANT ALL
ON TABLE "public"."clearinghouse_connection" TO "authenticated";
GRANT ALL
ON TABLE "public"."clearinghouse_connection" TO "service_role";



GRANT ALL
ON TABLE "public"."clerk_user_sync" TO "anon";
GRANT ALL
ON TABLE "public"."clerk_user_sync" TO "authenticated";
GRANT ALL
ON TABLE "public"."clerk_user_sync" TO "service_role";



GRANT ALL
ON TABLE "public"."clerk_webhook_log" TO "anon";
GRANT ALL
ON TABLE "public"."clerk_webhook_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."clerk_webhook_log" TO "service_role";



GRANT ALL
ON TABLE "public"."clinician" TO "anon";
GRANT ALL
ON TABLE "public"."clinician" TO "authenticated";
GRANT ALL
ON TABLE "public"."clinician" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."clinician_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."clinician_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."clinician_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."clinician_note" TO "anon";
GRANT ALL
ON TABLE "public"."clinician_note" TO "authenticated";
GRANT ALL
ON TABLE "public"."clinician_note" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."clinician_note_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."clinician_note_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."clinician_note_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."collection_account" TO "anon";
GRANT ALL
ON TABLE "public"."collection_account" TO "authenticated";
GRANT ALL
ON TABLE "public"."collection_account" TO "service_role";



GRANT ALL
ON TABLE "public"."communication_log" TO "anon";
GRANT ALL
ON TABLE "public"."communication_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."communication_log" TO "service_role";



GRANT ALL
ON TABLE "public"."cpt_code_master" TO "anon";
GRANT ALL
ON TABLE "public"."cpt_code_master" TO "authenticated";
GRANT ALL
ON TABLE "public"."cpt_code_master" TO "service_role";



GRANT ALL
ON TABLE "public"."provider_credentialing" TO "anon";
GRANT ALL
ON TABLE "public"."provider_credentialing" TO "authenticated";
GRANT ALL
ON TABLE "public"."provider_credentialing" TO "service_role";



GRANT ALL
ON TABLE "public"."credentialing_status" TO "anon";
GRANT ALL
ON TABLE "public"."credentialing_status" TO "authenticated";
GRANT ALL
ON TABLE "public"."credentialing_status" TO "service_role";



GRANT ALL
ON TABLE "public"."credit_balance" TO "anon";
GRANT ALL
ON TABLE "public"."credit_balance" TO "authenticated";
GRANT ALL
ON TABLE "public"."credit_balance" TO "service_role";



GRANT ALL
ON TABLE "public"."custom_field" TO "anon";
GRANT ALL
ON TABLE "public"."custom_field" TO "authenticated";
GRANT ALL
ON TABLE "public"."custom_field" TO "service_role";



GRANT ALL
ON TABLE "public"."custom_field_mapping" TO "anon";
GRANT ALL
ON TABLE "public"."custom_field_mapping" TO "authenticated";
GRANT ALL
ON TABLE "public"."custom_field_mapping" TO "service_role";



GRANT ALL
ON TABLE "public"."custom_field_value" TO "anon";
GRANT ALL
ON TABLE "public"."custom_field_value" TO "authenticated";
GRANT ALL
ON TABLE "public"."custom_field_value" TO "service_role";



GRANT ALL
ON TABLE "public"."dashboard_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."dashboard_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."dashboard_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."denial_tracking" TO "anon";
GRANT ALL
ON TABLE "public"."denial_tracking" TO "authenticated";
GRANT ALL
ON TABLE "public"."denial_tracking" TO "service_role";



GRANT ALL
ON TABLE "public"."denial_analytics" TO "anon";
GRANT ALL
ON TABLE "public"."denial_analytics" TO "authenticated";
GRANT ALL
ON TABLE "public"."denial_analytics" TO "service_role";



GRANT ALL
ON TABLE "public"."denial_playbook" TO "anon";
GRANT ALL
ON TABLE "public"."denial_playbook" TO "authenticated";
GRANT ALL
ON TABLE "public"."denial_playbook" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."denial_playbook_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."denial_playbook_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."denial_playbook_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."document" TO "anon";
GRANT ALL
ON TABLE "public"."document" TO "authenticated";
GRANT ALL
ON TABLE "public"."document" TO "service_role";



GRANT ALL
ON TABLE "public"."document_template" TO "anon";
GRANT ALL
ON TABLE "public"."document_template" TO "authenticated";
GRANT ALL
ON TABLE "public"."document_template" TO "service_role";



GRANT ALL
ON TABLE "public"."dosage" TO "anon";
GRANT ALL
ON TABLE "public"."dosage" TO "authenticated";
GRANT ALL
ON TABLE "public"."dosage" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."dosage_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."dosage_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."dosage_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."drug_formulary" TO "anon";
GRANT ALL
ON TABLE "public"."drug_formulary" TO "authenticated";
GRANT ALL
ON TABLE "public"."drug_formulary" TO "service_role";



GRANT ALL
ON TABLE "public"."ehr_connection" TO "anon";
GRANT ALL
ON TABLE "public"."ehr_connection" TO "authenticated";
GRANT ALL
ON TABLE "public"."ehr_connection" TO "service_role";



GRANT ALL
ON TABLE "public"."ehr_system" TO "anon";
GRANT ALL
ON TABLE "public"."ehr_system" TO "authenticated";
GRANT ALL
ON TABLE "public"."ehr_system" TO "service_role";



GRANT ALL
ON TABLE "public"."eligibility_cache" TO "anon";
GRANT ALL
ON TABLE "public"."eligibility_cache" TO "authenticated";
GRANT ALL
ON TABLE "public"."eligibility_cache" TO "service_role";



GRANT ALL
ON TABLE "public"."eligibility_check" TO "anon";
GRANT ALL
ON TABLE "public"."eligibility_check" TO "authenticated";
GRANT ALL
ON TABLE "public"."eligibility_check" TO "service_role";



GRANT ALL
ON TABLE "public"."era_line_detail" TO "anon";
GRANT ALL
ON TABLE "public"."era_line_detail" TO "authenticated";
GRANT ALL
ON TABLE "public"."era_line_detail" TO "service_role";



GRANT ALL
ON TABLE "public"."failed_job" TO "anon";
GRANT ALL
ON TABLE "public"."failed_job" TO "authenticated";
GRANT ALL
ON TABLE "public"."failed_job" TO "service_role";



GRANT ALL
ON TABLE "public"."fee_schedule" TO "anon";
GRANT ALL
ON TABLE "public"."fee_schedule" TO "authenticated";
GRANT ALL
ON TABLE "public"."fee_schedule" TO "service_role";



GRANT ALL
ON TABLE "public"."fhir_resource" TO "anon";
GRANT ALL
ON TABLE "public"."fhir_resource" TO "authenticated";
GRANT ALL
ON TABLE "public"."fhir_resource" TO "service_role";



GRANT ALL
ON TABLE "public"."field_mapping_template" TO "anon";
GRANT ALL
ON TABLE "public"."field_mapping_template" TO "authenticated";
GRANT ALL
ON TABLE "public"."field_mapping_template" TO "service_role";



GRANT ALL
ON TABLE "public"."financial_performance" TO "anon";
GRANT ALL
ON TABLE "public"."financial_performance" TO "authenticated";
GRANT ALL
ON TABLE "public"."financial_performance" TO "service_role";



GRANT ALL
ON TABLE "public"."generated_document" TO "anon";
GRANT ALL
ON TABLE "public"."generated_document" TO "authenticated";
GRANT ALL
ON TABLE "public"."generated_document" TO "service_role";



GRANT ALL
ON TABLE "public"."generated_report" TO "anon";
GRANT ALL
ON TABLE "public"."generated_report" TO "authenticated";
GRANT ALL
ON TABLE "public"."generated_report" TO "service_role";



GRANT ALL
ON TABLE "public"."icd10_code_master" TO "anon";
GRANT ALL
ON TABLE "public"."icd10_code_master" TO "authenticated";
GRANT ALL
ON TABLE "public"."icd10_code_master" TO "service_role";



GRANT ALL
ON TABLE "public"."insurance_policy" TO "anon";
GRANT ALL
ON TABLE "public"."insurance_policy" TO "authenticated";
GRANT ALL
ON TABLE "public"."insurance_policy" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."insurance_policy_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."insurance_policy_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."insurance_policy_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."intake" TO "anon";
GRANT ALL
ON TABLE "public"."intake" TO "authenticated";
GRANT ALL
ON TABLE "public"."intake" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."intake_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."intake_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."intake_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."integration_event_log" TO "anon";
GRANT ALL
ON TABLE "public"."integration_event_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."integration_event_log" TO "service_role";



GRANT ALL
ON TABLE "public"."sync_job" TO "anon";
GRANT ALL
ON TABLE "public"."sync_job" TO "authenticated";
GRANT ALL
ON TABLE "public"."sync_job" TO "service_role";



GRANT ALL
ON TABLE "public"."team" TO "anon";
GRANT ALL
ON TABLE "public"."team" TO "authenticated";
GRANT ALL
ON TABLE "public"."team" TO "service_role";



GRANT ALL
ON TABLE "public"."integration_health" TO "anon";
GRANT ALL
ON TABLE "public"."integration_health" TO "authenticated";
GRANT ALL
ON TABLE "public"."integration_health" TO "service_role";



GRANT ALL
ON TABLE "public"."kpi_definition" TO "anon";
GRANT ALL
ON TABLE "public"."kpi_definition" TO "authenticated";
GRANT ALL
ON TABLE "public"."kpi_definition" TO "service_role";



GRANT ALL
ON TABLE "public"."kpi_snapshot" TO "anon";
GRANT ALL
ON TABLE "public"."kpi_snapshot" TO "authenticated";
GRANT ALL
ON TABLE "public"."kpi_snapshot" TO "service_role";



GRANT ALL
ON TABLE "public"."medical_history" TO "anon";
GRANT ALL
ON TABLE "public"."medical_history" TO "authenticated";
GRANT ALL
ON TABLE "public"."medical_history" TO "service_role";



GRANT ALL
ON TABLE "public"."medication" TO "anon";
GRANT ALL
ON TABLE "public"."medication" TO "authenticated";
GRANT ALL
ON TABLE "public"."medication" TO "service_role";



GRANT ALL
ON TABLE "public"."medication_dosage" TO "anon";
GRANT ALL
ON TABLE "public"."medication_dosage" TO "authenticated";
GRANT ALL
ON TABLE "public"."medication_dosage" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."medication_dosage_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."medication_dosage_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."medication_dosage_id_seq" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."medication_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."medication_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."medication_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."medication_quantity" TO "anon";
GRANT ALL
ON TABLE "public"."medication_quantity" TO "authenticated";
GRANT ALL
ON TABLE "public"."medication_quantity" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."medication_quantity_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."medication_quantity_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."medication_quantity_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."ml_model_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."ml_model_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."ml_model_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."ml_prediction" TO "anon";
GRANT ALL
ON TABLE "public"."ml_prediction" TO "authenticated";
GRANT ALL
ON TABLE "public"."ml_prediction" TO "service_role";



GRANT ALL
ON TABLE "public"."modifier_code" TO "anon";
GRANT ALL
ON TABLE "public"."modifier_code" TO "authenticated";
GRANT ALL
ON TABLE "public"."modifier_code" TO "service_role";



GRANT ALL
ON TABLE "public"."my_clerk_sync_status" TO "anon";
GRANT ALL
ON TABLE "public"."my_clerk_sync_status" TO "authenticated";
GRANT ALL
ON TABLE "public"."my_clerk_sync_status" TO "service_role";



GRANT ALL
ON TABLE "public"."notification" TO "anon";
GRANT ALL
ON TABLE "public"."notification" TO "authenticated";
GRANT ALL
ON TABLE "public"."notification" TO "service_role";



GRANT ALL
ON TABLE "public"."notification_template" TO "anon";
GRANT ALL
ON TABLE "public"."notification_template" TO "authenticated";
GRANT ALL
ON TABLE "public"."notification_template" TO "service_role";



GRANT ALL
ON TABLE "public"."pa_clinical_criteria" TO "anon";
GRANT ALL
ON TABLE "public"."pa_clinical_criteria" TO "authenticated";
GRANT ALL
ON TABLE "public"."pa_clinical_criteria" TO "service_role";



GRANT ALL
ON TABLE "public"."pa_pipeline" TO "anon";
GRANT ALL
ON TABLE "public"."pa_pipeline" TO "authenticated";
GRANT ALL
ON TABLE "public"."pa_pipeline" TO "service_role";



GRANT ALL
ON TABLE "public"."pa_requirement_rule" TO "anon";
GRANT ALL
ON TABLE "public"."pa_requirement_rule" TO "authenticated";
GRANT ALL
ON TABLE "public"."pa_requirement_rule" TO "service_role";



GRANT ALL
ON TABLE "public"."pa_supporting_document" TO "anon";
GRANT ALL
ON TABLE "public"."pa_supporting_document" TO "authenticated";
GRANT ALL
ON TABLE "public"."pa_supporting_document" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_payment" TO "anon";
GRANT ALL
ON TABLE "public"."patient_payment" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_payment" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_statement" TO "anon";
GRANT ALL
ON TABLE "public"."patient_statement" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_statement" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_detail" TO "anon";
GRANT ALL
ON TABLE "public"."payment_detail" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_detail" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_plan" TO "anon";
GRANT ALL
ON TABLE "public"."payment_plan" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_plan" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_balance_summary" TO "anon";
GRANT ALL
ON TABLE "public"."patient_balance_summary" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_balance_summary" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_diagnosis" TO "anon";
GRANT ALL
ON TABLE "public"."patient_diagnosis" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_diagnosis" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."patient_diagnosis_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."patient_diagnosis_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."patient_diagnosis_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_document" TO "anon";
GRANT ALL
ON TABLE "public"."patient_document" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_document" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."patient_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."patient_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."patient_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_pharmacy" TO "anon";
GRANT ALL
ON TABLE "public"."patient_pharmacy" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_pharmacy" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."patient_profile_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."patient_profile_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."patient_profile_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."patient_quality_measure" TO "anon";
GRANT ALL
ON TABLE "public"."patient_quality_measure" TO "authenticated";
GRANT ALL
ON TABLE "public"."patient_quality_measure" TO "service_role";



GRANT ALL
ON TABLE "public"."payer_config" TO "anon";
GRANT ALL
ON TABLE "public"."payer_config" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer_config" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."payer_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."payer_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."payer_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."payer_performance" TO "anon";
GRANT ALL
ON TABLE "public"."payer_performance" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer_performance" TO "service_role";



GRANT ALL
ON TABLE "public"."payer_portal_credential" TO "anon";
GRANT ALL
ON TABLE "public"."payer_portal_credential" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer_portal_credential" TO "service_role";



GRANT ALL
ON TABLE "public"."payer_response_message" TO "anon";
GRANT ALL
ON TABLE "public"."payer_response_message" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer_response_message" TO "service_role";



GRANT ALL
ON TABLE "public"."payer_submission_config" TO "anon";
GRANT ALL
ON TABLE "public"."payer_submission_config" TO "authenticated";
GRANT ALL
ON TABLE "public"."payer_submission_config" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_adjustment" TO "anon";
GRANT ALL
ON TABLE "public"."payment_adjustment" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_adjustment" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_posting_session" TO "anon";
GRANT ALL
ON TABLE "public"."payment_posting_session" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_posting_session" TO "service_role";



GRANT ALL
ON TABLE "public"."team_member" TO "anon";
GRANT ALL
ON TABLE "public"."team_member" TO "authenticated";
GRANT ALL
ON TABLE "public"."team_member" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_posting_activity" TO "anon";
GRANT ALL
ON TABLE "public"."payment_posting_activity" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_posting_activity" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_reconciliation" TO "anon";
GRANT ALL
ON TABLE "public"."payment_reconciliation" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_reconciliation" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_variance" TO "anon";
GRANT ALL
ON TABLE "public"."payment_variance" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_variance" TO "service_role";



GRANT ALL
ON TABLE "public"."payment_variance_summary" TO "anon";
GRANT ALL
ON TABLE "public"."payment_variance_summary" TO "authenticated";
GRANT ALL
ON TABLE "public"."payment_variance_summary" TO "service_role";



GRANT ALL
ON TABLE "public"."phi_export_log" TO "anon";
GRANT ALL
ON TABLE "public"."phi_export_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."phi_export_log" TO "service_role";



GRANT ALL
ON TABLE "public"."place_of_service" TO "anon";
GRANT ALL
ON TABLE "public"."place_of_service" TO "authenticated";
GRANT ALL
ON TABLE "public"."place_of_service" TO "service_role";



GRANT ALL
ON TABLE "public"."portal_automation_task" TO "anon";
GRANT ALL
ON TABLE "public"."portal_automation_task" TO "authenticated";
GRANT ALL
ON TABLE "public"."portal_automation_task" TO "service_role";



GRANT ALL
ON TABLE "public"."prescription" TO "anon";
GRANT ALL
ON TABLE "public"."prescription" TO "authenticated";
GRANT ALL
ON TABLE "public"."prescription" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."prescription_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."prescription_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."prescription_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."prescription_request" TO "anon";
GRANT ALL
ON TABLE "public"."prescription_request" TO "authenticated";
GRANT ALL
ON TABLE "public"."prescription_request" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."prescription_request_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."prescription_request_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."prescription_request_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."prior_auth_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."prior_auth_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."prior_auth_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."provider_enrollment" TO "anon";
GRANT ALL
ON TABLE "public"."provider_enrollment" TO "authenticated";
GRANT ALL
ON TABLE "public"."provider_enrollment" TO "service_role";



GRANT ALL
ON TABLE "public"."provider_productivity" TO "anon";
GRANT ALL
ON TABLE "public"."provider_productivity" TO "authenticated";
GRANT ALL
ON TABLE "public"."provider_productivity" TO "service_role";



GRANT ALL
ON TABLE "public"."provider_schedule" TO "anon";
GRANT ALL
ON TABLE "public"."provider_schedule" TO "authenticated";
GRANT ALL
ON TABLE "public"."provider_schedule" TO "service_role";



GRANT ALL
ON TABLE "public"."quality_measure" TO "anon";
GRANT ALL
ON TABLE "public"."quality_measure" TO "authenticated";
GRANT ALL
ON TABLE "public"."quality_measure" TO "service_role";



GRANT ALL
ON TABLE "public"."quantity" TO "anon";
GRANT ALL
ON TABLE "public"."quantity" TO "authenticated";
GRANT ALL
ON TABLE "public"."quantity" TO "service_role";



GRANT ALL
ON SEQUENCE "public"."quantity_id_seq" TO "anon";
GRANT ALL
ON SEQUENCE "public"."quantity_id_seq" TO "authenticated";
GRANT ALL
ON SEQUENCE "public"."quantity_id_seq" TO "service_role";



GRANT ALL
ON TABLE "public"."rate_limit_bucket" TO "anon";
GRANT ALL
ON TABLE "public"."rate_limit_bucket" TO "authenticated";
GRANT ALL
ON TABLE "public"."rate_limit_bucket" TO "service_role";



GRANT ALL
ON TABLE "public"."referral" TO "anon";
GRANT ALL
ON TABLE "public"."referral" TO "authenticated";
GRANT ALL
ON TABLE "public"."referral" TO "service_role";



GRANT ALL
ON TABLE "public"."remittance_advice" TO "anon";
GRANT ALL
ON TABLE "public"."remittance_advice" TO "authenticated";
GRANT ALL
ON TABLE "public"."remittance_advice" TO "service_role";



GRANT ALL
ON TABLE "public"."report_definition" TO "anon";
GRANT ALL
ON TABLE "public"."report_definition" TO "authenticated";
GRANT ALL
ON TABLE "public"."report_definition" TO "service_role";



GRANT ALL
ON TABLE "public"."revenue_cycle_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."revenue_cycle_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."revenue_cycle_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."rule_execution_log" TO "anon";
GRANT ALL
ON TABLE "public"."rule_execution_log" TO "authenticated";
GRANT ALL
ON TABLE "public"."rule_execution_log" TO "service_role";



GRANT ALL
ON TABLE "public"."scrubbing_result" TO "anon";
GRANT ALL
ON TABLE "public"."scrubbing_result" TO "authenticated";
GRANT ALL
ON TABLE "public"."scrubbing_result" TO "service_role";



GRANT ALL
ON TABLE "public"."security_audit_log" TO "anon";
GRANT
SELECT,
INSERT
,
REFERENCES
,
TRIGGER
,
TRUNCATE
,
MAINTAIN
ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT
ALL
ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL
ON TABLE "public"."service_location" TO "anon";
GRANT ALL
ON TABLE "public"."service_location" TO "authenticated";
GRANT ALL
ON TABLE "public"."service_location" TO "service_role";



GRANT ALL
ON TABLE "public"."system_settings" TO "anon";
GRANT ALL
ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL
ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL
ON TABLE "public"."team_invitation" TO "anon";
GRANT ALL
ON TABLE "public"."team_invitation" TO "authenticated";
GRANT ALL
ON TABLE "public"."team_invitation" TO "service_role";



GRANT ALL
ON TABLE "public"."team_metrics" TO "anon";
GRANT ALL
ON TABLE "public"."team_metrics" TO "authenticated";
GRANT ALL
ON TABLE "public"."team_metrics" TO "service_role";



GRANT ALL
ON TABLE "public"."team_settings" TO "anon";
GRANT ALL
ON TABLE "public"."team_settings" TO "authenticated";
GRANT ALL
ON TABLE "public"."team_settings" TO "service_role";



GRANT ALL
ON TABLE "public"."trading_partner" TO "anon";
GRANT ALL
ON TABLE "public"."trading_partner" TO "authenticated";
GRANT ALL
ON TABLE "public"."trading_partner" TO "service_role";



GRANT ALL
ON TABLE "public"."webhook_config" TO "anon";
GRANT ALL
ON TABLE "public"."webhook_config" TO "authenticated";
GRANT ALL
ON TABLE "public"."webhook_config" TO "service_role";



GRANT ALL
ON TABLE "public"."webhook_event" TO "anon";
GRANT ALL
ON TABLE "public"."webhook_event" TO "authenticated";
GRANT ALL
ON TABLE "public"."webhook_event" TO "service_role";



GRANT ALL
ON TABLE "public"."webhook_health_monitor" TO "anon";
GRANT ALL
ON TABLE "public"."webhook_health_monitor" TO "authenticated";
GRANT ALL
ON TABLE "public"."webhook_health_monitor" TO "service_role";



GRANT ALL
ON TABLE "public"."work_queue" TO "anon";
GRANT ALL
ON TABLE "public"."work_queue" TO "authenticated";
GRANT ALL
ON TABLE "public"."work_queue" TO "service_role";



GRANT ALL
ON TABLE "public"."work_queue_assignment_rule" TO "anon";
GRANT ALL
ON TABLE "public"."work_queue_assignment_rule" TO "authenticated";
GRANT ALL
ON TABLE "public"."work_queue_assignment_rule" TO "service_role";



GRANT ALL
ON TABLE "public"."work_queue_summary" TO "anon";
GRANT ALL
ON TABLE "public"."work_queue_summary" TO "authenticated";
GRANT ALL
ON TABLE "public"."work_queue_summary" TO "service_role";



GRANT ALL
ON TABLE "public"."workflow_execution" TO "anon";
GRANT ALL
ON TABLE "public"."workflow_execution" TO "authenticated";
GRANT ALL
ON TABLE "public"."workflow_execution" TO "service_role";



GRANT ALL
ON TABLE "public"."workflow_state" TO "anon";
GRANT ALL
ON TABLE "public"."workflow_state" TO "authenticated";
GRANT ALL
ON TABLE "public"."workflow_state" TO "service_role";



GRANT ALL
ON TABLE "public"."x12_transaction" TO "anon";
GRANT ALL
ON TABLE "public"."x12_transaction" TO "authenticated";
GRANT ALL
ON TABLE "public"."x12_transaction" TO "service_role";















ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER
DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET
ALL;
