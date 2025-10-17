-- Enhanced Multi-Tenant Webhook System Migration
-- This migration adds additional webhook configuration columns and data migration
-- Converted to statement-breakpoint format for AWS RDS compatibility

-- Add environment column to existing webhook_config table
ALTER TABLE "webhook_config" ADD COLUMN "environment" "webhook_environment" DEFAULT 'production' NOT NULL;--> statement-breakpoint

-- Add constraint for unique webhook per org/environment/name
ALTER TABLE "webhook_config" ADD CONSTRAINT "unique_webhook_per_org_env" UNIQUE ("organization_id", "environment", "name");--> statement-breakpoint

-- Add additional columns for enhanced functionality
ALTER TABLE "webhook_config" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "api_version" varchar(10) DEFAULT 'v1';--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "content_type" varchar(50) DEFAULT 'application/json';--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "custom_headers" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "max_retries" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "retry_backoff_multiplier" decimal(3,2) DEFAULT 2.0;--> statement-breakpoint
ALTER TABLE "webhook_config" ADD COLUMN "signature_version" varchar(10) DEFAULT 'v1';--> statement-breakpoint

-- Migrate existing webhook configs to use new event subscription model
-- This will create event subscriptions based on existing 'events' JSON field
INSERT INTO "webhook_event_subscriptions" ("webhook_config_id", "event_type", "is_enabled")
SELECT 
  wc.id,
  event_type::"webhook_event_type",
  true
FROM "webhook_config" wc
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(wc.events::jsonb) as event_type
) events
WHERE event_type != 'all' 
  AND event_type::text = ANY(enum_range(NULL::"webhook_event_type")::text[]);--> statement-breakpoint

-- For webhooks that had 'all' events, subscribe to all available events
INSERT INTO "webhook_event_subscriptions" ("webhook_config_id", "event_type", "is_enabled")
SELECT 
  wc.id,
  et.event_type,
  true
FROM "webhook_config" wc
CROSS JOIN (
  SELECT unnest(enum_range(NULL::"webhook_event_type")) as event_type
) et
WHERE wc.events::jsonb ? 'all';--> statement-breakpoint

-- Create initial webhook secrets for existing configurations
INSERT INTO "webhook_secrets" ("webhook_config_id", "secret_id", "is_active")
SELECT id, secret, true
FROM "webhook_config"
WHERE secret IS NOT NULL;--> statement-breakpoint

-- Set the primary secret for existing configs
UPDATE "webhook_config" 
SET "primary_secret_id" = ws.id
FROM "webhook_secrets" ws
WHERE "webhook_config".id = ws."webhook_config_id"
  AND ws."is_active" = true;--> statement-breakpoint

-- Drop the old secret column
ALTER TABLE "webhook_config" DROP COLUMN "secret";--> statement-breakpoint

-- Drop the old events column since we now use event subscriptions
ALTER TABLE "webhook_config" DROP COLUMN "events";--> statement-breakpoint

-- Create function to automatically create webhook events
CREATE OR REPLACE FUNCTION create_webhook_event(
  p_organization_id UUID,
  p_event_type "webhook_event_type",
  p_environment "webhook_environment",
  p_entity_id UUID,
  p_entity_type VARCHAR(50),
  p_event_data JSONB,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO "webhook_events" (
    "organization_id",
    "event_type",
    "environment",
    "entity_id",
    "entity_type",
    "event_data",
    "metadata"
  ) VALUES (
    p_organization_id,
    p_event_type,
    p_environment,
    p_entity_id,
    p_entity_type,
    p_event_data,
    p_metadata
  ) RETURNING "id" INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create function to get active webhook configs for an event
CREATE OR REPLACE FUNCTION get_webhook_configs_for_event(
  p_organization_id UUID,
  p_event_type "webhook_event_type",
  p_environment "webhook_environment" DEFAULT 'production'
) RETURNS TABLE (
  webhook_config_id UUID,
  webhook_url TEXT,
  secret_value TEXT,
  retry_count INTEGER,
  timeout_seconds INTEGER,
  signature_version VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc."id",
    wc."url",
    ws."secret_id",
    wc."retry_count",
    wc."timeout_seconds",
    wc."signature_version"
  FROM "webhook_config" wc
  INNER JOIN "webhook_event_subscriptions" wes ON wc."id" = wes."webhook_config_id"
  INNER JOIN "webhook_secrets" ws ON wc."primary_secret_id" = ws."id"
  WHERE wc."organization_id" = p_organization_id
    AND wc."environment" = p_environment
    AND wc."is_active" = true
    AND wes."event_type" = p_event_type
    AND wes."is_enabled" = true
    AND ws."is_active" = true
    AND (ws."expires_at" IS NULL OR ws."expires_at" > NOW());
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Add comments for documentation
COMMENT ON TABLE "webhook_secrets" IS 'Stores webhook signing secrets with rotation support';--> statement-breakpoint
COMMENT ON TABLE "webhook_event_subscriptions" IS 'Defines which events each webhook endpoint subscribes to';--> statement-breakpoint
COMMENT ON TABLE "webhook_events" IS 'Source events that trigger webhook deliveries';--> statement-breakpoint
COMMENT ON TABLE "webhook_delivery_attempts" IS 'Detailed tracking of individual delivery attempts';--> statement-breakpoint

COMMENT ON COLUMN "webhook_config"."environment" IS 'Environment: staging or production';--> statement-breakpoint
COMMENT ON COLUMN "webhook_config"."signature_version" IS 'Version of signature algorithm (v1, v2)';--> statement-breakpoint
COMMENT ON COLUMN "webhook_delivery"."correlation_id" IS 'Unique ID for tracing delivery across systems';--> statement-breakpoint
COMMENT ON COLUMN "webhook_delivery"."source_event_id" IS 'Links delivery to originating webhook event';--> statement-breakpoint