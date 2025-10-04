// supabase/functions/process-claim/index.ts
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
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), // Service key for bypassing RLS
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // Verify user token
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Process sensitive data server-side
  const claimData = await processClaimSecurely(user.id);

  // Return only necessary data
  return new Response(
    JSON.stringify({
      claimId: claimData.id,
      status: claimData.status,
      // Don't return full PHI
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
