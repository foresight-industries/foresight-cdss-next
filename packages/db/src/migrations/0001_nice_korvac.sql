CREATE TABLE IF NOT EXISTS "hcpcs_code_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hcpcs_code" varchar(10) NOT NULL,
	"short_description" varchar(100),
	"long_description" text,
	"category" varchar(100),
	"level" varchar(10) DEFAULT 'II',
	"action_code" varchar(50),
	"coverage_status" varchar(50),
	"pricing_indicator" varchar(50),
	"multiple_pricing_indicator" varchar(50),
	"asc_payment_indicator" varchar(10),
	"asc_group_payment_weight" numeric(10,4),
	"is_active" boolean DEFAULT true,
	"effective_date" date,
	"termination_date" date,
	"usage_count" integer DEFAULT 0,
	"last_used_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hcpcs_code_master_hcpcs_code_unique" UNIQUE("hcpcs_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hcpcs_code_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hcpcs_code" varchar(10) NOT NULL,
	"short_description" varchar(100),
	"long_description" text,
	"category" varchar(100),
	"level" varchar(10) DEFAULT 'II',
	"action_code" varchar(50),
	"coverage_status" varchar(50),
	"pricing_indicator" varchar(50),
	"multiple_pricing_indicator" varchar(50),
	"asc_payment_indicator" varchar(10),
	"asc_group_payment_weight" numeric(10,4),
	"is_active" boolean DEFAULT true,
	"effective_date" date,
	"termination_date" date,
	"update_year" integer NOT NULL,
	"import_batch" varchar(50),
	"validation_status" varchar(20) DEFAULT 'pending',
	"validation_errors" jsonb,
	"processing_notes" text,
	"source_file" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_code_idx" ON "hcpcs_code_master" USING btree ("hcpcs_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_category_idx" ON "hcpcs_code_master" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_active_idx" ON "hcpcs_code_master" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_action_code_idx" ON "hcpcs_code_master" USING btree ("action_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_effective_date_idx" ON "hcpcs_code_master" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_active_codes_idx" ON "hcpcs_code_master" USING btree ("hcpcs_code","short_description","category") WHERE "is_active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_master_usage_tracking_idx" ON "hcpcs_code_master" USING btree ("usage_count","last_used_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_staging_hcpcs_code_idx" ON "hcpcs_code_staging" USING btree ("hcpcs_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_staging_update_year_idx" ON "hcpcs_code_staging" USING btree ("update_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_staging_batch_idx" ON "hcpcs_code_staging" USING btree ("import_batch");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hcpcs_code_staging_validation_idx" ON "hcpcs_code_staging" USING btree ("validation_status");