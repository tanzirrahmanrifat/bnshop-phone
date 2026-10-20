"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bool, done, num, slugOr, str, uploadImage } from "@/lib/admin";
import { REPAIR_STATUSES, type RepairStatus } from "@/lib/types";

const CAT = "/admin/repairs/catalog";

export async function updateRepairRequest(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as RepairStatus;
  if (!REPAIR_STATUSES.includes(status)) done(`/admin/repairs/${id}`, "Unknown status.", true);
  const { error } = await supabase
    .from("repair_requests")
    .update({ status, customer_note: str(fd, "customer_note", 2000) })
    .eq("id", id);
  if (error) done(`/admin/repairs/${id}`, error.message, true);
  revalidatePath("/admin/repairs");
  done(`/admin/repairs/${id}`, "Repair updated.");
}

export async function saveBrand(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name", 80);
  if (!name) done(CAT, "Brand name is required.", true);
  let image: string | null = null;
  try {
    image = await uploadImage(supabase, fd.get("image"), "brands");
  } catch (e) {
    done(CAT, (e as Error).message, true);
  }
  const row: Record<string, unknown> = { name, slug: slugOr(fd, "slug", name), sort: Math.floor(num(fd, "sort") ?? 0), active: id ? bool(fd, "active") : true };
  if (image) row.image_url = image;
  if (bool(fd, "remove_image")) row.image_url = "";
  const { error } = id ? await supabase.from("repair_brands").update(row).eq("id", id) : await supabase.from("repair_brands").insert(row);
  if (error) done(CAT, error.code === "23505" ? "That slug is already used." : error.message, true);
  revalidatePath("/repair", "layout");
  done(CAT, `${name} saved.`);
}

export async function saveService(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name", 80);
  if (!name) done(CAT, "Service name is required.", true);
  const row = {
    name,
    slug: slugOr(fd, "slug", name),
    description: str(fd, "description", 200),
    duration: str(fd, "duration", 40),
    sort: Math.floor(num(fd, "sort") ?? 0),
    active: id ? bool(fd, "active") : true,
  };
  const { error } = id ? await supabase.from("repair_services").update(row).eq("id", id) : await supabase.from("repair_services").insert(row);
  if (error) done(CAT, error.code === "23505" ? "That slug is already used." : error.message, true);
  revalidatePath("/", "layout");
  done(CAT, `${name} saved.`);
}

export async function addModel(fd: FormData) {
  const { supabase } = await requireAdmin();
  const brandId = str(fd, "brand_id");
  const name = str(fd, "name", 80);
  if (!brandId || !name) done(CAT, "Choose a brand and enter the model name.", true);
  const { data, error } = await supabase
    .from("repair_models")
    .insert({ brand_id: brandId, name, slug: slugOr(fd, "slug", name), series: str(fd, "series", 60), sort: Math.floor(num(fd, "sort") ?? 0) })
    .select("id")
    .single();
  if (error || !data) done(CAT, error?.code === "23505" ? "That model already exists for this brand." : (error?.message ?? "Save failed"), true);
  revalidatePath("/repair", "layout");
  done(`/admin/repairs/models/${data!.id}`, `${name} added. Now set its prices.`);
}

export async function saveModel(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const back = `/admin/repairs/models/${id}`;
  const name = str(fd, "name", 80);
  if (!name) done(back, "Model name is required.", true);
  const { error } = await supabase
    .from("repair_models")
    .update({ name, slug: slugOr(fd, "slug", name), series: str(fd, "series", 60), sort: Math.floor(num(fd, "sort") ?? 0), active: bool(fd, "active") })
    .eq("id", id);
  if (error) done(back, error.code === "23505" ? "That slug is already used for this brand." : error.message, true);

  // Prices: inputs named price__<serviceId>__<grade>. Empty = not offered.
  const upserts: { model_id: string; service_id: string; grade: string; price: number }[] = [];
  const deletes: { service_id: string; grade: string }[] = [];
  for (const [key, value] of fd.entries()) {
    const m = /^price__([0-9a-f-]{36})__(compatible|oem|original)$/.exec(key);
    if (!m) continue;
    const raw = String(value).trim();
    if (raw === "") deletes.push({ service_id: m[1], grade: m[2] });
    else if (Number.isFinite(Number(raw)) && Number(raw) >= 0) upserts.push({ model_id: id, service_id: m[1], grade: m[2], price: Math.round(Number(raw) * 100) / 100 });
    else done(back, `Invalid price "${raw}".`, true);
  }
  if (upserts.length) {
    const { error: e } = await supabase.from("repair_prices").upsert(upserts, { onConflict: "model_id,service_id,grade" });
    if (e) done(back, e.message, true);
  }
  for (const d of deletes) {
    await supabase.from("repair_prices").delete().eq("model_id", id).eq("service_id", d.service_id).eq("grade", d.grade);
  }
  revalidatePath("/repair", "layout");
  done(back, "Model and prices saved.");
}

export async function deleteModel(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { error } = await supabase.from("repair_models").delete().eq("id", id);
  if (error) done(`/admin/repairs/models/${id}`, error.message, true);
  revalidatePath("/repair", "layout");
  done(CAT, "Model deleted.");
}
