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

  const { patientId, amount, paymentMethod, appliedTo } = await req.json();

  // Process payment via Stripe
  const stripePayment = await processStripePayment({
    amount,
    paymentMethod,
    metadata: { patientId },
  });

  // Record payment
  await supabase.from("patient_payment").insert({
    patient_id: patientId,
    amount,
    payment_method: paymentMethod,
    transaction_id: stripePayment.id,
    status: "processed",
    applied_to_claims: appliedTo,
  });

  // Update claim balances
  for (const claimId of appliedTo) {
    await updateClaimBalance(claimId);
  }

  return new Response(JSON.stringify({ success: true }));
});
