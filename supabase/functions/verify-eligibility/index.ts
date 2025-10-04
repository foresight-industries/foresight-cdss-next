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

  const { patientId, serviceDate, cptCodes } = await req.json();

  const patient = await supabase
    .from("patient")
    .select("*, insurance_policy(*)")
    .eq("id", patientId)
    .single();

  // Check cache first
  const cached = await supabase
    .from("eligibility_cache")
    .select("*")
    .eq("patient_id", patientId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached.data) {
    return new Response(JSON.stringify(cached.data));
  }

  // Submit 270 transaction
  const eligibility = await submit270Transaction({
    patient,
    serviceDate,
    cptCodes,
  });

  // Cache results
  await supabase.from("eligibility_cache").insert({
    patient_id: patientId,
    insurance_policy_id: patient.data.insurance_policy[0].id,
    is_eligible: eligibility.eligible,
    copay: eligibility.copay,
    deductible_remaining: eligibility.deductible,
    out_of_pocket_remaining: eligibility.outOfPocket,
    response_data: eligibility,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return new Response(JSON.stringify(eligibility));
});
