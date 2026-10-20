"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bool, bruneiLocalToIso, done, num, slugOr, str, uploadImage } from "@/lib/admin";

export async function saveProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const back = id ? `/admin/products/${id}` : "/admin/products/new";

  const name = str(fd, "name", 200);
  const price = num(fd, "price");
  const salePrice = num(fd, "sale_price");
  if (!name) done(back, "Name is required.", true);
  if (price === null || price < 0) done(back, "Enter a valid price.", true);
  if (salePrice !== null && (salePrice < 0 || salePrice >= price!)) done(back, "Sale price must be lower than the regular price.", true);

  // Images: keep the ones not removed, then add uploads.
  const removed = new Set(fd.getAll("img_remove").map(String));
  const images = fd.getAll("img_keep").map(String).filter((u) => u && !removed.has(u));
  try {
    for (const file of fd.getAll("new_images")) {
      const url = await uploadImage(supabase, file, "products");
      if (url) images.push(url);
    }
  } catch (e) {
    done(back, (e as Error).message, true);
  }

  const labels = fd.getAll("v_label").map((v) => String(v).trim());
  const ids = fd.getAll("v_id").map(String);
  const toDelete = new Set(fd.getAll("v_delete").map(String));
  const hasVariants = labels.some((l, i) => l && !(ids[i] && toDelete.has(ids[i])));

  const row = {
    name,
    slug: slugOr(fd, "slug", name),
    description: str(fd, "description", 10000),
    category_id: str(fd, "category_id") || null,
    brand: str(fd, "brand", 80),
    price: price!,
    sale_price: salePrice,
    sale_ends_at: salePrice !== null ? bruneiLocalToIso(str(fd, "sale_ends_at")) : null,
    stock: Math.max(0, Math.floor(num(fd, "stock") ?? 0)),
    sku: str(fd, "sku", 80),
    images,
    option_name: hasVariants ? str(fd, "option_name", 40) || "Option" : "",
    active: bool(fd, "active"),
    featured: bool(fd, "featured"),
  };

  let productId = id;
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) done(back, error.code === "23505" ? "That URL slug is already used by another product." : error.message, true);
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error || !data) done(back, error?.code === "23505" ? "That URL slug is already used by another product." : (error?.message ?? "Save failed"), true);
    productId = data!.id as string;
  }

  // Tags
  const tagIds = fd.getAll("tags").map(String).filter(Boolean);
  await supabase.from("product_tags").delete().eq("product_id", productId);
  if (tagIds.length) await supabase.from("product_tags").insert(tagIds.map((tag_id) => ({ product_id: productId, tag_id })));

  // Variants
  const prices = fd.getAll("v_price").map(String);
  const stocks = fd.getAll("v_stock").map(String);
  const skus = fd.getAll("v_sku").map(String);
  for (let i = 0; i < labels.length; i++) {
    const vid = ids[i] ?? "";
    if (vid && toDelete.has(vid)) {
      await supabase.from("product_variants").delete().eq("id", vid).eq("product_id", productId);
      continue;
    }
    if (!labels[i]) continue;
    const v = {
      label: labels[i].slice(0, 80),
      price: prices[i]?.trim() ? Math.max(0, Number(prices[i])) : null,
      stock: Math.max(0, Math.floor(Number(stocks[i] || 0))),
      sku: (skus[i] ?? "").trim().slice(0, 80),
      sort: i,
    };
    const { error } = vid
      ? await supabase.from("product_variants").update(v).eq("id", vid).eq("product_id", productId)
      : await supabase.from("product_variants").insert({ ...v, product_id: productId });
    if (error) done(`/admin/products/${productId}`, error.code === "23505" ? `Option "${v.label}" is listed twice.` : error.message, true);
  }

  revalidatePath("/", "layout");
  done(`/admin/products/${productId}`, "Product saved.");
}

export async function deleteProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) done(`/admin/products/${id}`, error.message, true);
  revalidatePath("/", "layout");
  done("/admin/products", "Product deleted.");
}
