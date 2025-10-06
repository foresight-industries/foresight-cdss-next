import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createSupabaseServerClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get user's team context from your database
  const teamId = await getUserTeamId(userId);
  const cookieStore = await cookies();

  // Create Supabase server client with proper cookie handling
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey, // Use service role key for RLS bypass
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          // Set the team context for RLS
          "x-team-id": teamId ?? "",
        },
      },
    }
  );

  // Set the authenticated user context for RLS
  await supabase.rpc("set_auth_context", {
    user_id: userId,
    team_id: teamId ?? "",
  });

  return supabase;
}

// Middleware-specific function that doesn't call auth() 
export async function createSupabaseMiddlewareClient() {
  // Create a simple admin client for middleware use
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get user's current team
async function getUserTeamId(userId: string): Promise<string | null> {
  // This should query your database to get the user's current team
  // For now, using a direct Supabase query
  const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data } = await adminSupabase
    .from("clerk_user_sync")
    .select("team_id")
    .eq("clerk_user_id", userId)
    .single();

  return data?.team_id ?? null;
}

// Admin Supabase client with the service role key for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
