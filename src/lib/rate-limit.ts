import "server-only";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

/** true = allowed. Fails open if the limiter itself errors (logged). */
export async function rateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  const ip = await clientIp();
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", {
    p_key: `${bucket}:${ip}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit error", error.message);
    return true;
  }
  return data === true;
}
