ALTER TABLE "adjustment_reason_code" DROP CONSTRAINT "adjustment_reason_code_organization_id_organization_id_fk";
--> statement-breakpoint
DROP INDEX "adjustment_reason_code_org_idx";--> statement-breakpoint
ALTER TABLE "adjustment_reason_code" DROP COLUMN "organization_id";