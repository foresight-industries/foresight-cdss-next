import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

if (
  !Deno.env.get("SUPABASE_URL") ||
  !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
) {
  throw new Error("Missing Supabase environment variables");
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const tasks = [
    // Check claim statuses
    async () => {
      const submitted = await supabase
        .from("claim")
        .select("id, claim_number")
        .eq("status", "submitted")
        .gt("submitted_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      for (const claim of submitted.data) {
        await checkClaimStatus(claim.id);
      }
    },

    // Generate patient statements
    async () => {
      const patients = await supabase
        .from("patient_balance_summary")
        .select("*")
        .gt("current_balance", 0)
        .is("last_statement_date", null);

      for (const patient of patients.data) {
        await generateStatement(patient.patient_id);
      }
    },

    // Update eligibility cache
    async () => {
      const expiring = await supabase
        .from("eligibility_cache")
        .select("patient_id")
        .lt("expires_at", new Date(Date.now() + 24 * 60 * 60 * 1000));

      for (const record of expiring.data) {
        await verifyEligibility(record.patient_id);
      }
    },
  ];

  await Promise.allSettled(tasks.map((task) => task()));
});
