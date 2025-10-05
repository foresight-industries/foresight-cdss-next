import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { useAuth } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Client-side Supabase client
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Legacy client for backwards compatibility
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export function useSupabaseUser() {
  const { getToken } = useAuth();

  return async () => {
    const token = await getToken({ template: "supabase" });

    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
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
