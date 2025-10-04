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

  const { userId, action, entityType, entityId } = await req.json();

  // Log PHI access
  await supabase.from("audit_log").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip_address: req.headers.get("x-forwarded-for"),
    user_agent: req.headers.get("user-agent"),
  });

  // Check for suspicious activity
  const recentAccess = await supabase
    .from("audit_log")
    .select("count")
    .eq("user_id", userId)
    .gt("created_at", new Date(Date.now() - 5 * 60 * 1000));

  if (recentAccess.count > 100) {
    await flagSuspiciousActivity(userId);
  }
});
