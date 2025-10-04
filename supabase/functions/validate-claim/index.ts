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

  const { claimId } = await req.json();

  // Run all validation rules
  const validations = await runValidations(claimId, [
    checkNPIValid,
    checkTaxonomyCode,
    checkTimelyFiling,
    checkDuplicateClaim,
    checkAuthorizationRequired,
    checkMedicalNecessity,
    checkCodingCompliance,
  ]);

  // Store results
  await supabase.from("claim_validation").insert({
    claim_id: claimId,
    errors: validations.errors,
    warnings: validations.warnings,
    confidence_score: validations.score,
  });

  return new Response(JSON.stringify(validations));
});
