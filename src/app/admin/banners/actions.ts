"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bool, done, num, str, uploadImage } from "@/lib/admin";

const BACK = "/admin/banners";

export async function saveBanner(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const placement = ["hero", "side", "promo"].includes(str(fd, "placement")) ? str(fd, "placement") : "side";
  const theme = ["dark", "orange", "green", "blue"].includes(str(fd, "theme")) ? str(fd, "theme") : "dark";
  const link = str(fd, "link", 300);
  if (link && !link.startsWith("/") && !/^https:\/\//.test(link)) done(BACK, "Links must start with / or https://", true);

  let image: string | null = null;
  try {
    image = await uploadImage(supabase, fd.get("image"), "banners");
  } catch (e) {
    done(BACK, (e as Error).message, true);
  }
  const row: Record<string, unknown> = {
    placement,
    theme,
    title: str(fd, "title", 120),
    subtitle: str(fd, "subtitle", 120),
    cta_label: str(fd, "cta_label", 40),
    link,
    sort: Math.floor(num(fd, "sort") ?? 0),
    active: id ? bool(fd, "active") : true,
  };
  if (image) row.image_url = image;
  const { error } = id ? await supabase.from("banners").update(row).eq("id", id) : await supabase.from("banners").insert(row);
  if (error) done(BACK, error.message, true);
  revalidatePath("/", "layout");
  done(BACK, "Banner saved.");
}

export async function deleteBanner(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("banners").delete().eq("id", str(fd, "id"));
  revalidatePath("/", "layout");
  done(BACK, "Banner deleted.");
}
