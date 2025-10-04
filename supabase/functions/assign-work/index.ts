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

  const { queueType, maxItems } = await req.json();

  // Get available team members
  const availableMembers = await supabase
    .from("team_member")
    .select("id, permissions")
    .eq("status", "active");

  // Get unassigned work items
  const workItems = await supabase
    .from("work_queue")
    .select("*")
    .eq("queue_type", queueType)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at")
    .limit(maxItems);

  // Distribute work based on skills and capacity
  for (const item of workItems.data) {
    const assignee = selectBestAssignee(item, availableMembers.data);

    await supabase
      .from("work_queue")
      .update({
        assigned_to: assignee.id,
        assigned_at: new Date().toISOString(),
        status: "assigned",
      })
      .eq("id", item.id);
  }
});
