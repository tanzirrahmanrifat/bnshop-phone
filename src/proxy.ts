import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that read the signed-in user. Storefront pages stay cacheable.
  matcher: ["/account/:path*", "/admin/:path*", "/login", "/auth/:path*", "/checkout", "/repair/:path*"],
};
