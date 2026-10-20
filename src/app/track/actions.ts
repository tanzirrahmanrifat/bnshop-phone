"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/format";

export type TrackResult =
  | { kind: "order"; order_no: number; status: string; created_at: string; total: number; tracking_token: string }
  | { kind: "repair"; code: string; status: string; model_name: string; services: string[]; estimate: number; needs_quote: boolean; customer_note: string; updated_at: string };

export type TrackState = { error?: string; result?: TrackResult };

export async function track(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const ref = String(formData.get("ref") ?? "").trim().toUpperCase();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!ref || !phone) return { error: "Enter your order number or repair ID, and the mobile number you used." };
  if (!(await rateLimit("track", 20, 900))) return { error: "Too many lookups. Please try again in 15 minutes." };

  const sb = createServiceClient();
  if (/^R-?\d+$/.test(ref)) {
    const code = ref.startsWith("R-") ? ref : `R-${ref.slice(1)}`;
    const { data } = await sb.rpc("track_repair", { p_code: code, p_phone: phone });
    if (!data) return { error: "No repair found with that ID and mobile number." };
    return { result: { kind: "repair", ...(data as Omit<Extract<TrackResult, { kind: "repair" }>, "kind">) } };
  }
  const orderNo = Number(ref.replace(/^#/, ""));
  if (!Number.isSafeInteger(orderNo)) return { error: "Order numbers look like 100123; repair IDs look like R-10045." };
  const { data } = await sb.rpc("track_order", { p_order_no: orderNo, p_phone: phone });
  if (!data) return { error: "No order found with that number and mobile number." };
  return { result: { kind: "order", ...(data as Omit<Extract<TrackResult, { kind: "order" }>, "kind">) } };
}
