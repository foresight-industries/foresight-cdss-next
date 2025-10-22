import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { useAuth } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Basic client-side Supabase client (no auth integration)
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Clerk-authenticated Supabase client for use in React components
export function useSupabaseWithAuth() {
  const { getToken, isLoaded, userId } = useAuth();

  return useMemo(() => {
    const getAuthenticatedClient = async () => {
      if (!isLoaded || !userId) {
        // Return unauthenticated client for public operations
        return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
      }

      try {
        const token = await getToken({ template: "supabase" });
        
        return createSupabaseClient<Database>(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            },
            auth: {
              persistSession: false, // We handle auth through Clerk
            },
          }
        );
      } catch (error) {
        console.error("Failed to get authenticated Supabase client:", error);
        // Fallback to unauthenticated client
        return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
      }
    };

    return {
      client: getAuthenticatedClient,
      isAuthenticated: isLoaded && !!userId,
      userId,
    };
  }, [getToken, isLoaded, userId]);
}

// Hook for getting Supabase client with automatic Clerk authentication
export function useSupabase() {
  const { client, isAuthenticated } = useSupabaseWithAuth();
  
  return useMemo(() => ({
    getClient: client,
    isAuthenticated,
  }), [client, isAuthenticated]);
}

// Legacy client for backwards compatibility (unauthenticated)
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Deprecated: Use useSupabaseWithAuth() instead
export function useSupabaseUser() {
  const { getToken } = useAuth();

  return async () => {
    const token = await getToken({ template: "supabase" });

    return createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      }
    );
  };
}
