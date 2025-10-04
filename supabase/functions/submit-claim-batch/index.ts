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

  const { claimIds, clearinghouseId } = await req.json();

  // Validate claims are ready
  const validationResults = await Promise.all(
    claimIds.map((id) =>
      supabase.rpc("get_claim_readiness_score", { p_claim_id: id })
    )
  );

  // Generate 837P file
  const x12Data = await generate837P(claimIds);

  // Submit to clearinghouse
  const submission = await submitToClearinghouse(x12Data, clearinghouseId);

  // Update claim statuses
  await supabase
    .from("claim")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .in("id", claimIds);

  return new Response(JSON.stringify(submission));
});
