import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

if (
  !Deno.env.get("SUPABASE_URL") ||
  !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
) {
  throw new Error("Missing Supabase environment variables");
}

// Run after each payment posting
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { claimId } = await req.json();

  const expected = await calculateExpectedPayment(claimId);
  const actual = await getActualPayment(claimId);

  if (actual < expected * 0.9) {
    // >10% underpayment
    await supabase.from("payment_variance").insert({
      claim_id: claimId,
      expected_amount: expected,
      paid_amount: actual,
      variance_amount: expected - actual,
      action_required: "appeal",
    });
  }
});
