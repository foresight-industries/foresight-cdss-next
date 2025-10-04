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

  const { paId, method } = await req.json();

  const pa = await supabase
    .from("prior_auth")
    .select("*, patient:patient_id(*), payer:payer_id(*)")
    .eq("id", paId)
    .single();

  let result;

  if (method === "electronic") {
    // Submit via 278 transaction
    result = await submit278Transaction(pa);
  } else if (method === "portal") {
    // Automate portal submission
    result = await automatePortalSubmission(pa);
  } else {
    // Generate fax package
    result = await generateFaxPackage(pa);
  }

  await supabase
    .from("prior_auth")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submission_method: method,
    })
    .eq("id", paId);

  return new Response(JSON.stringify(result));
});
