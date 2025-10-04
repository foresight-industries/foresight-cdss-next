// eslint-disable-next-line
// @ts-nocheck

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

  // Check status of all pending PAs
  const pendingPAs = await supabase
    .from("prior_auth")
    .select("*")
    .in("status", ["submitted", "in_review"]);

  for (const pa of pendingPAs.data) {
    const status = await checkPayerPortal(pa);

    if (status.decision) {
      await supabase
        .from("prior_auth")
        .update({
          status: status.decision,
          auth_number: status.authNumber,
          approved_at: status.approvedAt,
        })
        .eq("id", pa.id);

      // Notify team
      await sendNotification(pa.team_id, status);
    }
  }
});
