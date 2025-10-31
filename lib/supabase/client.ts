import { createClient } from "@supabase/supabase-js";

export function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key"
  );
}

// Alias for compatibility
export const createSupabaseClient = createSupabaseBrowserClient;
