import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type SupabaseClient = BaseSupabaseClient<Database>;
