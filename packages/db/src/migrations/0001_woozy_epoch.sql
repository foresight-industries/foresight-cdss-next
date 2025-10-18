CREATE TYPE "public"."hipaa_compliance_status" AS ENUM('compliant', 'pending', 'non_compliant');--> statement-breakpoint
CREATE TYPE "public"."phi_data_classification" AS ENUM('none', 'limited', 'full');--> statement-breakpoint
CREATE TYPE "public"."webhook_environment" AS ENUM('staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_type" AS ENUM('organization.created', 'organization.updated', 'organization.deleted', 'team_member.added', 'team_member.updated', 'team_member.removed', 'encounter.created', 'encounter.updated', 'encounter.deleted', 'patient.created', 'patient.updated', 'patient.deleted', 'claim.created', 'claim.updated', 'claim.submitted', 'payment.received', 'eligibility.checked');--> statement-breakpoint
CREATE TABLE "webhook_delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_delivery_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"http_status" integer,
	"response_time_ms" integer,
	"error_message" text,
	"error_type" varchar(50),
	"request_headers" jsonb,
	"response_headers" jsonb,
	"response_body_preview" text
);
--> statement-breakpoint
CREATE TABLE "webhook_event_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_config_id" uuid NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"event_filter" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "unique_webhook_config_event" UNIQUE("webhook_config_id","event_type")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"environment" "webhook_environment" DEFAULT 'production' NOT NULL,
	"entity_id" uuid,
	"entity_type" varchar(50),
	"event_data" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_hipaa_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_config_id" uuid NOT NULL,
	"webhook_delivery_id" uuid,
	"audit_event_type" varchar(50) NOT NULL,
	"user_id" varchar(255),
	"organization_id" uuid NOT NULL,
	"phi_data_types" jsonb,
	"entity_ids" jsonb,
	"data_classification" "phi_data_classification" NOT NULL,
	"baa_verified" boolean DEFAULT false,
	"encryption_verified" boolean DEFAULT false,
	"retention_policy_applied" boolean DEFAULT false,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"request_headers" jsonb,
	"risk_level" varchar(20) DEFAULT 'low',
	"compliance_status" varchar(20) DEFAULT 'compliant',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_config_id" uuid NOT NULL,
	"secret_id" text NOT NULL,
	"algorithm" varchar(20) DEFAULT 'sha256' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"rotation_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "webhook_config" DROP CONSTRAINT "webhook_config_organization_id_organization_id_fk";
--> statement-breakpoint
DROP INDEX "webhook_config_org_idx";--> statement-breakpoint
DROP INDEX "webhook_config_active_idx";--> statement-breakpoint
DROP INDEX "webhook_config_url_idx";--> statement-breakpoint
DROP INDEX "external_service_credential_org_service_unique_idx";--> statement-breakpoint
DROP INDEX "hcpcs_code_master_active_codes_idx";--> statement-breakpoint
DROP INDEX "icd10_code_master_billable_active_idx";--> statement-breakpoint
DROP INDEX "icd10_code_master_hot_codes_idx";--> statement-breakpoint
DROP INDEX "icd10_code_master_composite_idx";--> statement-breakpoint
ALTER TABLE "webhook_delivery" ALTER COLUMN "event_data" SET DATA TYPE jsonb USING CASE
  WHEN "event_data" IS NULL THEN '{}'::jsonb
  WHEN "event_data"::text = '' THEN '{}'::jsonb
  WHEN "event_data"::text ~ '^[[:space:]]*[\{\[].*[\}\]][[:space:]]*$' THEN "event_data"::jsonb
  ELSE ('{"data": ' || to_json("event_data"::text) || '}')::jsonb
END;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ALTER COLUMN "response_headers" SET DATA TYPE jsonb USING CASE
  WHEN "response_headers" IS NULL THEN NULL
  WHEN "response_headers"::text = '' THEN NULL
  WHEN "response_headers"::text ~ '^[[:space:]]*[\{\[].*[\}\]][[:space:]]*$' THEN "response_headers"::jsonb
  ELSE ('{"raw_response": ' || to_json("response_headers"::text) || '}')::jsonb
END;--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "primary_secret_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "webhook_secret_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "environment" "webhook_environment" DEFAULT 'production' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "correlation_id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "source_event_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "request_headers" jsonb;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "request_body_size" integer;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "signature_header" text;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "user_agent" varchar(255) DEFAULT 'Foresight-Webhooks/1.0';--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "response_body_size" integer;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD COLUMN "delivery_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "webhook_delivery_attempts" ADD CONSTRAINT "webhook_delivery_attempts_webhook_delivery_id_webhook_delivery_id_fk" FOREIGN KEY ("webhook_delivery_id") REFERENCES "public"."webhook_delivery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event_subscriptions" ADD CONSTRAINT "webhook_event_subscriptions_webhook_config_id_webhook_config_id_fk" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_hipaa_audit_log" ADD CONSTRAINT "webhook_hipaa_audit_log_webhook_config_id_webhook_config_id_fk" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_hipaa_audit_log" ADD CONSTRAINT "webhook_hipaa_audit_log_webhook_delivery_id_webhook_delivery_id_fk" FOREIGN KEY ("webhook_delivery_id") REFERENCES "public"."webhook_delivery"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_hipaa_audit_log" ADD CONSTRAINT "webhook_hipaa_audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_secrets" ADD CONSTRAINT "webhook_secrets_webhook_config_id_webhook_config_id_fk" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_delivery_attempts_delivery_idx" ON "webhook_delivery_attempts" USING btree ("webhook_delivery_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_attempts_status_idx" ON "webhook_delivery_attempts" USING btree ("http_status");--> statement-breakpoint
CREATE INDEX "webhook_delivery_attempts_started_idx" ON "webhook_delivery_attempts" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "webhook_event_subs_config_idx" ON "webhook_event_subscriptions" USING btree ("webhook_config_id");--> statement-breakpoint
CREATE INDEX "webhook_event_subs_type_idx" ON "webhook_event_subscriptions" USING btree ("event_type","is_enabled");--> statement-breakpoint
CREATE INDEX "webhook_events_org_idx" ON "webhook_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhook_events_type_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_events_env_idx" ON "webhook_events" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "webhook_events_entity_idx" ON "webhook_events" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "webhook_events_created_idx" ON "webhook_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_config_idx" ON "webhook_hipaa_audit_log" USING btree ("webhook_config_id");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_event_type_idx" ON "webhook_hipaa_audit_log" USING btree ("audit_event_type");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_org_idx" ON "webhook_hipaa_audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_created_at_idx" ON "webhook_hipaa_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_risk_level_idx" ON "webhook_hipaa_audit_log" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "webhook_hipaa_audit_compliance_status_idx" ON "webhook_hipaa_audit_log" USING btree ("compliance_status");--> statement-breakpoint
CREATE INDEX "webhook_secrets_config_idx" ON "webhook_secrets" USING btree ("webhook_config_id");--> statement-breakpoint
CREATE INDEX "webhook_secrets_active_idx" ON "webhook_secrets" USING btree ("is_active","expires_at");--> statement-breakpoint
ALTER TABLE "webhook_config" ADD CONSTRAINT "webhook_config_primary_secret_id_webhook_secrets_id_fk" FOREIGN KEY ("primary_secret_id") REFERENCES "public"."webhook_secrets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_secret_id_webhook_secrets_id_fk" FOREIGN KEY ("webhook_secret_id") REFERENCES "public"."webhook_secrets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_source_event_id_webhook_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_delivery_correlation_idx" ON "webhook_delivery" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_source_event_idx" ON "webhook_delivery" USING btree ("source_event_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_environment_idx" ON "webhook_delivery" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "webhook_delivery_secret_idx" ON "webhook_delivery" USING btree ("webhook_secret_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_service_credential_org_service_unique_idx" ON "external_service_credential" USING btree ("organization_id","service_name","environment") WHERE ("external_service_credential"."is_active" = true and "external_service_credential"."deleted_at" is null);--> statement-breakpoint
CREATE INDEX "hcpcs_code_master_active_codes_idx" ON "hcpcs_code_master" USING btree ("hcpcs_code","short_description","category") WHERE "hcpcs_code_master"."is_active" = true;--> statement-breakpoint
CREATE INDEX "icd10_code_master_billable_active_idx" ON "icd10_code_master" USING btree ("icd10_code") WHERE ("icd10_code_master"."is_billable" = true and "icd10_code_master"."is_active" = true);--> statement-breakpoint
CREATE INDEX "icd10_code_master_hot_codes_idx" ON "icd10_code_master" USING btree ("icd10_code","short_description") WHERE "icd10_code_master"."usage_count" > 100;--> statement-breakpoint
CREATE INDEX "icd10_code_master_composite_idx" ON "icd10_code_master" USING btree ("icd10_code","short_description","category","is_billable") WHERE "icd10_code_master"."is_active" = true;--> statement-breakpoint
