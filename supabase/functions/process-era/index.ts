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

  const { eraFileContent } = await req.json();

  // Parse 835 ERA file
  const payments = await parse835(eraFileContent);

  for (const payment of payments) {
    // Match to claims
    const claim = await supabase
      .from("claim")
      .select("*")
      .eq("claim_number", payment.claimNumber)
      .single();

    if (claim.data) {
      // Post payment
      await supabase.from("payment_detail").insert({
        claim_id: claim.data.id,
        paid_amount: payment.paidAmount,
        allowed_amount: payment.allowedAmount,
        patient_responsibility: payment.patientResp,
        adjustment_codes: payment.adjustments,
      });

      // Update claim status
      await supabase
        .from("claim")
        .update({
          status: payment.paidAmount > 0 ? "paid" : "denied",
          paid_amount: payment.paidAmount,
          paid_at: new Date().toISOString(),
        })
        .eq("id", claim.data.id);

      // Check for denials
      if (payment.denialCodes.length > 0) {
        await supabase.from("denial_tracking").insert({
          claim_id: claim.data.id,
          carc_code: payment.denialCodes[0],
          denial_reason: payment.denialReason,
          denial_date: new Date().toISOString(),
          appealable: true,
          financial_impact: claim.data.total_amount - payment.paidAmount,
        });
      }
    }
  }
});
