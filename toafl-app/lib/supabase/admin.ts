import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service role).
 *
 * PENTING: File ini HANYA boleh diimpor dari kode server
 * (Server Component, Route Handler, Server Action, middleware).
 * JANGAN PERNAH mengimpornya dari client component —
 * SUPABASE_SERVICE_ROLE_KEY dapat melewati RLS sepenuhnya.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
