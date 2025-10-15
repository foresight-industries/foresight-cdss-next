ALTER TABLE "modifier_code" DROP CONSTRAINT "modifier_code_organization_id_organization_id_fk";
--> statement-breakpoint
DROP INDEX "modifier_code_org_idx";--> statement-breakpoint
ALTER TABLE "modifier_code" DROP COLUMN "organization_id";