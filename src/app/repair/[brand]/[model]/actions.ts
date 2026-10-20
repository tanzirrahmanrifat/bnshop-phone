"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/errors";
import { money, normalizePhone } from "@/lib/format";
import { getSettings } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";

export type BookingState = {
  error?: string;
  done?: { code: string; estimate: number; needsQuote: boolean; whatsappUrl: string; via: "site" | "whatsapp" };
};

const schema = z.object({
  modelId: z.string().uuid(),
  services: z.array(z.string().uuid()).max(15),
  grade: z.enum(["compatible", "oem", "original"]),
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: z.string().trim().min(1, "Please enter your mobile number."),
  mode: z.enum(["walkin", "pickup"]),
  district: z.string().regex(/^[A-Z]{2}$/),
  note: z.string().trim().max(500),
  via: z.enum(["site", "whatsapp"]),
}).refine((v) => v.services.length > 0 || v.note.length >= 5, {
  message: "Pick at least one repair, or describe the problem under “Something else”.",
});

export async function bookRepair(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const parsed = schema.safeParse({
    modelId: formData.get("modelId"),
    services: formData.getAll("services"),
    grade: formData.get("grade"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    mode: formData.get("mode"),
    district: formData.get("district"),
    note: formData.get("note") ?? "",
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

  const { data, error } = await createServiceClient().rpc("create_repair_request", {
    p_user_id: user?.id ?? null,
    p_model_id: d.modelId,
    p_service_ids: d.services,
    p_grade: d.grade,
    p_name: d.name,
    p_phone: local,
    p_mode: d.mode,
    p_district: d.district,
    p_note: d.note,
  });
  const row = data?.[0] as
    | { code: string; estimate: number; needs_quote: boolean; brand_name: string; model_name: string; services: string[] }
    | undefined;
  if (error || !row) {
    if (error) console.error("create_repair_request failed:", error.message);
    return { error: friendlyError(error?.message) };
  }

  const settings = await getSettings();
  const gradeLabel = { compatible: "Compatible", oem: "OEM-grade", original: "Original" }[d.grade];
  const text =
    `Hi, I booked repair ${row.code}. Phone: ${row.model_name}. Repairs: ${row.services.join(", ")}. ` +
    `Part quality: ${gradeLabel}. Estimate: ${money(row.estimate)}${row.needs_quote ? " + quote" : ""}. ` +
    `Service: ${d.mode === "pickup" ? "Pickup & delivery" : "Walk in"}.` +
    (d.note ? ` Problem: ${d.note}` : "");

  return {
    done: {
      code: row.code,
      estimate: Number(row.estimate),
      needsQuote: row.needs_quote,
      whatsappUrl: waLink(settings.whatsapp, text),
      via: d.via,
    },
  };
}
