import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Service-role client. SERVER ONLY. Used solely to call the server-only
 * database functions (place_order, create_repair_request, tracking, rate limit).
 * Never use it to read or write tables on behalf of a user.
 */
export function createServiceClient() {
  return createClient(SUPABASE_URL(), SUPABASE_SERVICE_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
