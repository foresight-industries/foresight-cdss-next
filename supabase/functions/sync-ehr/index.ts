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

  const { connectionId, syncType } = await req.json();

  const connection = await supabase
    .from("ehr_connection")
    .select("*")
    .eq("id", connectionId)
    .single();

  const syncJob = await supabase
    .from("sync_job")
    .insert({
      ehr_connection_id: connectionId,
      entity_type: syncType,
      status: "running",
    })
    .select()
    .single();

  try {
    const data = await fetchFromEHR(connection.data, syncType);

    // Map and store data
    for (const record of data) {
      await mapAndStore(record, syncType);
    }

    await supabase
      .from("sync_job")
      .update({
        status: "completed",
        records_processed: data.length,
      })
      .eq("id", syncJob.data.id);
  } catch (error) {
    await supabase
      .from("sync_job")
      .update({
        status: "failed",
        error_log: error.message,
      })
      .eq("id", syncJob.data.id);
  }
});
