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

if (!Deno.env.get("CLAIM_MD_API_KEY")) {
  throw new Error("Missing CLAIM_MD_API_KEY environment variable");
}

// Generate 837P JSON format for Claim.MD submission
async function generate837P(claimIds: string[]) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const claims = [];

  for (const claimId of claimIds) {
    // Fetch comprehensive claim data
    const { data: claimData, error } = await supabase
      .from("claim")
      .select(`
        *,
        encounter:encounter_id (
          *,
          patient:patient_id (
            *,
            patient_profile:profile_id (*)
          ),
          provider:provider_id (*)
        ),
        payer:payer_id (*),
        claim_line (*),
        team:team_id (*)
      `)
      .eq("id", claimId)
      .single();

    if (error || !claimData) {
      throw new Error(`Failed to fetch claim data for ${claimId}: ${error?.message}`);
    }

    // Build JSON claim structure
    const claimJson = {
      // Provider Information
      ProviderNPI: claimData.encounter?.provider?.npi || Deno.env.get("DEFAULT_PROVIDER_NPI"),
      ProviderTaxId: claimData.encounter?.provider?.tax_id || Deno.env.get("DEFAULT_PROVIDER_TAX_ID"),
      ProviderName: claimData.encounter?.provider?.name || Deno.env.get("DEFAULT_PROVIDER_NAME") || "Default Provider",
      
      // Patient Demographics
      PatientFirstName: claimData.encounter?.patient?.patient_profile?.first_name || "",
      PatientLastName: claimData.encounter?.patient?.patient_profile?.last_name || "",
      PatientDateOfBirth: claimData.encounter?.patient?.patient_profile?.birth_date || "",
      PatientGender: claimData.encounter?.patient?.patient_profile?.gender || "U",
      
      // Payer Information
      PayerId: claimData.payer?.external_payer_id || claimData.payer?.id?.toString(),
      PayerName: claimData.payer?.name || "",
      
      // Claim Header
      ClaimId: claimData.id,
      ServiceDateFrom: claimData.encounter?.dos || claimData.encounter?.created_at,
      ServiceDateTo: claimData.encounter?.dos || claimData.encounter?.created_at,
      PlaceOfService: claimData.encounter?.visit_type === "Telehealth" ? "02" : "11",
      ClaimFrequency: "1", // Original claim
      
      // Procedure Lines
      ServiceLines: claimData.claim_line?.map((line: any, index: number) => ({
        LineNumber: line.line_number || index + 1,
        ProcedureCode: line.cpt_code,
        ChargeAmount: line.charge_amount,
        UnitsOfService: "1",
        DiagnosisPointer: line.diagnosis_pointers?.[0] || "1",
        Modifiers: claimData.encounter?.visit_type === "Telehealth" ? ["95"] : [],
        ServiceDate: claimData.encounter?.dos || claimData.encounter?.created_at,
      })) || [],
      
      // Diagnosis Codes (simplified - using primary diagnosis)
      DiagnosisCodes: [
        {
          DiagnosisCode: claimData.encounter?.primary_diagnosis || "Z00.00", // Default wellness visit
          DiagnosisSequence: "1"
        }
      ],
      
      // Claim amounts
      TotalChargeAmount: claimData.claim_line?.reduce((sum: number, line: any) => sum + (line.charge_amount || 0), 0) || 0,
      
      // Meta information
      SubmissionDate: new Date().toISOString(),
      ClaimNumber: claimData.claim_number || claimData.id,
      
      // Team/Organization info
      TeamId: claimData.team_id
    };

    claims.push(claimJson);
  }

  return {
    BatchId: crypto.randomUUID(),
    SubmissionDate: new Date().toISOString(),
    Claims: claims,
    ClaimCount: claims.length,
    TotalAmount: claims.reduce((sum, claim) => sum + claim.TotalChargeAmount, 0)
  };
}

// Stub function for Claim.MD API submission
async function submitToClearinghouse(claimData: any, clearinghouseId: string) {
  // TODO: Implement actual Claim.MD API call
  console.log("Submitting to Claim.MD:", {
    batchId: claimData.BatchId,
    claimCount: claimData.ClaimCount,
    clearinghouseId
  });
  
  // Return mock response for now
  return {
    success: true,
    batchId: claimData.BatchId,
    externalBatchId: `CMD_${claimData.BatchId}`,
    status: "submitted",
    message: "Claims submitted successfully (MOCK)",
    claims: claimData.Claims.map((claim: any) => ({
      claimId: claim.ClaimId,
      externalClaimId: `CMD_${claim.ClaimId}`,
      status: "submitted"
    }))
  };
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { claimIds, clearinghouseId } = await req.json();

  try {
    // Validate claims are ready
    const validationResults = await Promise.all(
      claimIds.map((id) =>
        supabase.rpc("get_claim_readiness_score", { p_claim_id: id })
      )
    );

    // Check if any claims are not ready
    const failedValidations = validationResults.filter(result => 
      result.data?.[0]?.readiness_score < 95
    );
    
    if (failedValidations.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Some claims are not ready for submission",
        validationResults
      }), { status: 400 });
    }

    // Generate 837P file
    const claimData = await generate837P(claimIds);

    // Submit to clearinghouse
    const submission = await submitToClearinghouse(claimData, clearinghouseId);

    if (submission.success) {
      // Update claim statuses with external IDs
      for (const claimSubmission of submission.claims) {
        await supabase
          .from("claim")
          .update({
            status: "awaiting_277ca",
            submitted_at: new Date().toISOString(),
            external_claim_id: claimSubmission.externalClaimId,
            batch_id: submission.externalBatchId,
            attempt_count: supabase.sql`COALESCE(attempt_count, 0) + 1`
          })
          .eq("id", claimSubmission.claimId);
      }

      return new Response(JSON.stringify({
        success: true,
        batchId: submission.batchId,
        externalBatchId: submission.externalBatchId,
        claimCount: claimIds.length,
        message: "Claims submitted successfully",
        claims: submission.claims
      }));
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to submit to clearinghouse",
        details: submission
      }), { status: 500 });
    }
  } catch (error) {
    console.error("Error submitting claims:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error occurred"
    }), { status: 500 });
  }
});
