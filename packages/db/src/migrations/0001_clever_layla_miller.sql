CREATE TABLE "external_service_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_name" varchar(50) NOT NULL,
	"service_type" varchar(20) NOT NULL,
	"environment" varchar(10) DEFAULT 'production' NOT NULL,
	"secret_arn" text NOT NULL,
	"secret_region" varchar(20) DEFAULT 'us-east-1' NOT NULL,
	"credential_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"is_valid" boolean DEFAULT false,
	"last_validated" timestamp,
	"last_validation_error" text,
	"validation_attempts" integer DEFAULT 0,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0,
	"enabled_features" jsonb NOT NULL,
	"connection_settings" jsonb,
	"expires_at" timestamp,
	"auto_renew" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "external_service_credential" ADD CONSTRAINT "external_service_credential_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_credential" ADD CONSTRAINT "external_service_credential_created_by_team_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_credential" ADD CONSTRAINT "external_service_credential_updated_by_team_member_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_service_credential_org_service_idx" ON "external_service_credential" USING btree ("organization_id","service_name");--> statement-breakpoint
CREATE INDEX "external_service_credential_service_type_idx" ON "external_service_credential" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "external_service_credential_active_idx" ON "external_service_credential" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "external_service_credential_valid_idx" ON "external_service_credential" USING btree ("is_valid");--> statement-breakpoint
CREATE INDEX "external_service_credential_secret_arn_idx" ON "external_service_credential" USING btree ("secret_arn");--> statement-breakpoint
CREATE INDEX "external_service_credential_last_validated_idx" ON "external_service_credential" USING btree ("last_validated");--> statement-breakpoint
CREATE INDEX "external_service_credential_expires_at_idx" ON "external_service_credential" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "external_service_credential_org_service_unique_idx" ON "external_service_credential" USING btree ("organization_id","service_name","environment") WHERE "external_service_credential"."is_active" = true AND "external_service_credential"."deleted_at" IS NULL;--> statement-breakpoint
