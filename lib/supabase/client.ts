import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client (public/anon).
 * Aman dipakai di client component karena hanya memakai
 * NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}
