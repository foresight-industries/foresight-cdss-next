import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { auth } from "@clerk/nextjs/server";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Main server-side Supabase client with automatic Clerk authentication
export async function createSupabaseServerClient() {
  try {
    const { userId } = await auth();

    if (!userId) {
      // Return admin client for SSR operations
      return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        async accessToken() {
          return (await auth()).getToken()
        },
      });
    }

    // Get user's team context from your database
    const teamId = await getUserTeamId(userId);

    // Create Supabase server client with proper cookie handling and auth
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey, // Use service role key for authenticated operations
      {
        async accessToken() {
          return (await auth()).getToken()
        },
        global: {
          headers: {
            // Set the team context for RLS
            "x-team-id": teamId ?? "",
            "x-user-id": userId,
          },
        },
      }
    );

    // Optionally set the authenticated user context for RLS if you have this function
    try {
      await supabase.rpc("set_auth_context", {
        user_id: userId,
        team_id: teamId ?? "",
      });
    } catch (error) {
      // RPC function might not exist, that's okay
      console.debug("set_auth_context RPC not available:", error);
    }

    return supabase;
  } catch (error) {
    console.error("Error creating authenticated Supabase client:", error);
    // Fallback to unauthenticated client
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}

// Client that requires authentication (throws if not authenticated)
export async function createAuthenticatedSupabaseClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  const teamId = await getUserTeamId(userId);

  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      async accessToken() {
        return (await auth()).getToken()
      },
      global: {
        headers: {
          "x-team-id": teamId ?? "",
          "x-user-id": userId,
        },
      },
    }
  );

  try {
    await supabase.rpc("set_auth_context", {
      user_id: userId,
      team_id: teamId ?? "",
    });
  } catch (error) {
    console.debug("set_auth_context RPC not available:", error);
  }

  return { supabase, userId, teamId };
}

// Simple admin client (no auth, full access)
export function createSupabaseAdminClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Middleware-specific function that doesn't call auth()
export async function createSupabaseMiddlewareClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Get user's team from database
async function getUserTeamId(userId: string): Promise<string | null> {
  try {
    const adminSupabase = createSupabaseAdminClient();

    // Try to get from team_member table first
    const { data: teamMember } = await adminSupabase
      .from("team_member")
      .select("team_id")
      .eq("clerk_user_id", userId)
      .eq("status", "active")
      .single();

    if (teamMember?.team_id) {
      return teamMember.team_id;
    }

    // Fallback to clerk_user_sync if it exists
    const { data: clerkSync } = await adminSupabase
      .from("clerk_user_sync")
      .select("team_id")
      .eq("clerk_user_id", userId)
      .single();

    return clerkSync?.team_id ?? null;
  } catch (error) {
    console.debug("Could not fetch user team:", error);
    return null;
  }
}

// Convenience function to get current user info
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const teamId = await getUserTeamId(userId);

    return {
      userId,
      teamId,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Legacy export for backwards compatibility
export const supabaseAdmin = createSupabaseAdminClient();
