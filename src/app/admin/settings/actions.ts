"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bool, done, num, str, uploadImage } from "@/lib/admin";

const BACK = "/admin/settings";
const TEXT_FIELDS = [
  ["shop_name", 80], ["tagline", 120], ["whatsapp", 30], ["phone", 30], ["email", 120], ["address", 300], ["hours", 160],
  ["maps_url", 300], ["topbar", 160], ["hero_badge", 40], ["hero_title", 120], ["hero_text", 300],
  ["delivery_note", 160], ["warranty_note", 160], ["bank_details", 600],
] as const;

export async function saveSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const row: Record<string, unknown> = {};
  for (const [key, max] of TEXT_FIELDS) row[key] = str(fd, key, max);
  if (!row.shop_name) done(BACK, "Shop name is required.", true);
  const maps = String(row.maps_url);
  if (maps && !/^https:\/\//.test(maps)) done(BACK, "Google Maps link must start with https://", true);
  row.free_delivery_min = Math.max(0, num(fd, "free_delivery_min") ?? 0);
  try {
    const hero = await uploadImage(supabase, fd.get("hero_image_file"), "hero");
    if (hero) row.hero_image = hero;
  } catch (e) {
    done(BACK, (e as Error).message, true);
  }
  if (bool(fd, "remove_hero")) row.hero_image = "";
  const { error } = await supabase.from("site_settings").update(row).eq("id", 1);
  if (error) done(BACK, error.message, true);
  revalidatePath("/", "layout");
  done(BACK, "Settings saved.");
}

export async function saveDistricts(fd: FormData) {
  const { supabase } = await requireAdmin();
  const codes = fd.getAll("code").map(String);
  for (const code of codes) {
    const fee = num(fd, `fee_${code}`);
    if (fee === null || fee < 0) done(BACK, `Enter a valid fee for ${code}.`, true);
    const { error } = await supabase
      .from("districts")
      .update({ fee, eta: str(fd, `eta_${code}`, 60), active: bool(fd, `active_${code}`) })
      .eq("code", code);
    if (error) done(BACK, error.message, true);
  }
  revalidatePath("/", "layout");
  done(BACK, "Delivery fees saved.");
}
