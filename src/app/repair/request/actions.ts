"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/errors";
import { normalizePhone } from "@/lib/format";
import { getSettings } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";

export type QuoteState = {
  error?: string;
  done?: { code: string; whatsappUrl: string; via: "site" | "whatsapp" };
};

const schema = z.object({
  brand: z.string().trim().max(60),
  model: z.string().trim().min(1, "Please enter your phone model.").max(80),
  issue: z.string().trim().min(5, "Please describe the problem in a few words.").max(500),
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: z.string().trim().min(1, "Please enter your mobile number."),
  mode: z.enum(["walkin", "pickup"]),
  district: z.string().regex(/^[A-Z]{2}$/),
  via: z.enum(["site", "whatsapp"]),
});

/** Quote request for a phone that is not in the model list, or a problem not in the repair list. */
export async function requestQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  const parsed = schema.safeParse({
    brand: formData.get("brand") ?? "",
    model: formData.get("model"),
    issue: formData.get("issue"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    mode: formData.get("mode"),
    district: formData.get("district"),
    via: formData.get("via") ?? "site",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  const local = normalizePhone(d.phone);
  if (!local) return { error: "Please enter a valid Brunei mobile number (7 digits)." };
  if (!(await rateLimit("repair", 10, 3600))) return { error: "Too many requests from this connection. Please message us on WhatsApp." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await createServiceClient().rpc("create_custom_repair_request", {
    p_user_id: user?.id ?? null,
    p_brand: d.brand,
    p_model: d.model,
    p_issue: d.issue,
    p_name: d.name,
    p_phone: local,
    p_mode: d.mode,
    p_district: d.district,
  });
  const row = data?.[0] as { code: string; brand_name: string; model_name: string } | undefined;
  if (error || !row) {
    if (error) console.error("create_custom_repair_request failed:", error.message);
    return { error: friendlyError(error?.message) };
  }

  const settings = await getSettings();
  const phone = [row.brand_name, row.model_name].filter(Boolean).join(" ");
  const text = `Hi, I asked for a repair quote ${row.code}. Phone: ${phone}. Problem: ${d.issue}. Service: ${d.mode === "pickup" ? "Pickup & delivery" : "Walk in"}.`;
  return { done: { code: row.code, whatsappUrl: waLink(settings.whatsapp, text), via: d.via } };
}
