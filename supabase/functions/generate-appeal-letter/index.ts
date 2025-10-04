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

  const { denialId, templateId } = await req.json();

  const denial = await supabase
    .from("denial_tracking")
    .select("*, claim:claim_id(*)")
    .eq("id", denialId)
    .single();

  // Generate appeal letter
  const letter = await generateFromTemplate(templateId, {
    denial: denial.data,
    claim: denial.data.claim,
    guidelines: await fetchMedicalGuidelines(denial.data.claim.cpt_code),
  });

  // Store document
  const { data: upload } = await supabase.storage
    .from("appeals")
    .upload(`${denialId}/appeal-letter.pdf`, letter);

  // Create appeal record
  await supabase.from("appeal").insert({
    denial_tracking_id: denialId,
    claim_id: denial.data.claim_id,
    appeal_letter_path: upload.path,
    status: "preparing",
  });

  return new Response(letter, {
    headers: { "Content-Type": "application/pdf" },
  });
});
