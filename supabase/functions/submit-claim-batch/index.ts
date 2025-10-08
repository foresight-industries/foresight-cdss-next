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

// Enhanced demo function for realistic Claim.MD simulation
async function submitToClearinghouse(claimData: any, clearinghouseId: string) {
  console.log("🚀 Demo Mode: Submitting to Claim.MD simulation:", {
    batchId: claimData.BatchId,
    claimCount: claimData.ClaimCount,
    clearinghouseId
  });
  
  // Add realistic processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const processedClaims = claimData.Claims.map((claim: any) => {
    const externalClaimId = `CMD_${claim.ClaimId}`;
    
    // Demo scenarios based on claim data patterns
    const demoScenario = getDemoScenario(claim);
    
    return {
      claimId: claim.ClaimId,
      externalClaimId,
      ...demoScenario
    };
  });
  
  // Check if any claims were rejected
  const hasRejections = processedClaims.some(claim => claim.status === "rejected_277ca");
  const hasAccepted = processedClaims.some(claim => claim.status === "accepted_277ca");
  
  let overallMessage = "Claims processed successfully (DEMO MODE)";
  if (hasRejections && hasAccepted) {
    overallMessage = "Batch processed with mixed results (DEMO MODE)";
  } else if (hasRejections) {
    overallMessage = "All claims rejected by clearinghouse (DEMO MODE)";
  } else if (hasAccepted) {
    overallMessage = "All claims accepted by clearinghouse (DEMO MODE)";
  }
  
  return {
    success: true,
    batchId: claimData.BatchId,
    externalBatchId: `CMD_${claimData.BatchId}`,
    status: "processed",
    message: overallMessage,
    claims: processedClaims,
    demoMode: true
  };
}

// Generate realistic demo scenarios based on claim characteristics
function getDemoScenario(claim: any) {
  // Demo logic: Create realistic acceptance/rejection patterns
  
  // Scenario 1: Missing or invalid provider NPI (rejection)
  if (!claim.ProviderNPI || claim.ProviderNPI === "DEFAULT_NPI") {
    return {
      status: "rejected_277ca",
      errors: [
        {
          errorCode: "AAE-44",
          fieldPath: "provider.npi",
          message: "Provider NPI is missing or invalid",
          severity: "error"
        }
      ]
    };
  }
  
  // Scenario 2: Invalid payer ID (rejection)
  if (claim.PayerId && claim.PayerId.includes("invalid")) {
    return {
      status: "rejected_277ca", 
      errors: [
        {
          errorCode: "AAE-12",
          fieldPath: "payer.id",
          message: "Payer ID not recognized by clearinghouse",
          severity: "error"
        }
      ]
    };
  }
  
  // Scenario 3: Missing patient demographics (rejection)
  if (!claim.PatientFirstName || !claim.PatientLastName || !claim.PatientDateOfBirth) {
    return {
      status: "rejected_277ca",
      errors: [
        {
          errorCode: "AAE-67",
          fieldPath: "patient.demographics",
          message: "Patient name and date of birth are required",
          severity: "error"
        }
      ]
    };
  }
  
  // Scenario 4: Procedure code warnings but acceptance
  if (claim.ServiceLines?.some((line: any) => line.ProcedureCode === "99999")) {
    return {
      status: "accepted_277ca",
      warnings: [
        {
          errorCode: "AAW-23",
          fieldPath: "serviceLine.procedureCode", 
          message: "Procedure code should be verified with latest updates",
          severity: "warning"
        }
      ]
    };
  }
  
  // Scenario 5: Random rejection for demo variety (10% chance)
  if (Math.random() < 0.1) {
    return {
      status: "rejected_277ca",
      errors: [
        {
          errorCode: "AAE-91",
          fieldPath: "claim.diagnosis",
          message: "Primary diagnosis code format requires verification",
          severity: "error"
        }
      ]
    };
  }
  
  // Default: Successful acceptance (most common scenario)
  return {
    status: "accepted_277ca",
    warnings: []
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
      // Process each claim submission result
      for (const claimSubmission of submission.claims) {
        // Update claim status based on clearinghouse response
        const claimStatus = claimSubmission.status || "awaiting_277ca";
        
        await supabase
          .from("claim")
          .update({
            status: claimStatus,
            submitted_at: new Date().toISOString(),
            external_claim_id: claimSubmission.externalClaimId,
            batch_id: submission.externalBatchId,
            attempt_count: supabase.sql`COALESCE(attempt_count, 0) + 1`
          })
          .eq("id", claimSubmission.claimId);

        // Store clearinghouse errors in scrubbing_result table
        if (claimSubmission.errors?.length > 0) {
          for (const error of claimSubmission.errors) {
            await supabase
              .from("scrubbing_result")
              .insert({
                entity_id: claimSubmission.claimId,
                entity_type: "claim",
                severity: error.severity || "error",
                message: error.message,
                field_path: error.fieldPath,
                error_code: error.errorCode,
                auto_fixable: false,
                fixed: false,
                created_at: new Date().toISOString()
              });
          }
        }

        // Store warnings as well
        if (claimSubmission.warnings?.length > 0) {
          for (const warning of claimSubmission.warnings) {
            await supabase
              .from("scrubbing_result")
              .insert({
                entity_id: claimSubmission.claimId,
                entity_type: "claim", 
                severity: warning.severity || "warning",
                message: warning.message,
                field_path: warning.fieldPath,
                error_code: warning.errorCode,
                auto_fixable: false,
                fixed: false,
                created_at: new Date().toISOString()
              });
          }
        }
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
