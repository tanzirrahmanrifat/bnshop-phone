import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Anonymous client without cookies, for public catalog reads.
 * Keeps storefront pages cacheable (ISR). RLS applies as "anon".
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
