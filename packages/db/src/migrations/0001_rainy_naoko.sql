ALTER TABLE "user_profile" ALTER COLUMN "clerk_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_clerk_user_id_unique" UNIQUE("clerk_user_id");--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "clerk_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_clerk_user_id_user_profile_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."user_profile"("clerk_user_id") ON DELETE no action ON UPDATE no action;
