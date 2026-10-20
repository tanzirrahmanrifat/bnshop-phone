"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bool, done, num, slugOr, str, uploadImage } from "@/lib/admin";

const BACK = "/admin/catalog";

export async function saveTerm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const table = str(fd, "table") === "tags" ? "tags" : "categories";
  const id = str(fd, "id");
  const name = str(fd, "name", 80);
  if (!name) done(BACK, "Name is required.", true);

  let image: string | null = null;
  try {
    image = await uploadImage(supabase, fd.get("image"), table);
  } catch (e) {
    done(BACK, (e as Error).message, true);
  }
  const row: Record<string, unknown> = { name, slug: slugOr(fd, "slug", name), sort: Math.floor(num(fd, "sort") ?? 0) };
  if (table === "categories") {
    row.description = str(fd, "description", 500);
    row.active = id ? bool(fd, "active") : true;
  }
  if (image) row.image_url = image;
  if (bool(fd, "remove_image")) row.image_url = "";

  const { error } = id ? await supabase.from(table).update(row).eq("id", id) : await supabase.from(table).insert(row);
  if (error) done(BACK, error.code === "23505" ? "That slug is already used." : error.message, true);
  revalidatePath("/", "layout");
  done(BACK, `${name} saved.`);
}

export async function deleteTerm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const table = str(fd, "table") === "tags" ? "tags" : "categories";
  const { error } = await supabase.from(table).delete().eq("id", str(fd, "id"));
  if (error) done(BACK, error.message, true);
  revalidatePath("/", "layout");
  done(BACK, "Deleted.");
}
