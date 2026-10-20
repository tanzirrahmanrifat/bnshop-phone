"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/errors";
import { normalizePhone } from "@/lib/format";

export type CheckoutState = { error?: string; fields?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: z.string().trim().min(1, "Please enter your mobile number."),
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email or leave it empty.")]),
  district: z.string().regex(/^[A-Z]{2}$/, "Please choose your district."),
  area: z.string().trim().min(1, "Please enter your Mukim / Kampong.").max(120),
  address: z.string().trim().min(1, "Please enter your house no., Simpang and Jalan.").max(300),
  landmark: z.string().trim().max(300),
  note: z.string().trim().max(500),
  payment: z.enum(["cod", "bank"]),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(50),
});

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  let items: unknown = [];
  try {
    items = JSON.parse(raw.items || "[]");
  } catch {
    items = [];
  }
  const parsed = schema.safeParse({ ...raw, items, email: raw.email ?? "", landmark: raw.landmark ?? "", note: raw.note ?? "" });
  const fields = { ...raw, items: "" };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form.", fields };

  const local = normalizePhone(parsed.data.phone);
  if (!local) return { error: "Please enter a valid Brunei mobile number (7 digits, e.g. 7123456).", fields };

  if (!(await rateLimit("order", 6, 600))) {
    return { error: "Too many orders from this connection. Please wait a few minutes or message us on WhatsApp.", fields };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const d = parsed.data;
  const { data, error } = await createServiceClient().rpc("place_order", {
    p_user_id: user?.id ?? null,
    p_customer: {
      name: d.name,
      phone: local,
      email: d.email,
      district: d.district,
      area: d.area,
      address: d.address,
      landmark: d.landmark,
      note: d.note,
      payment: d.payment,
    },
    p_items: d.items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, qty: i.qty })),
  });

  if (error || !data?.[0]) {
    if (error) console.error("place_order failed:", error.message);
    return { error: friendlyError(error?.message), fields };
  }

  redirect(`/order/${data[0].tracking_token}?new=1`);
}
