"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";

const lineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  qty: z.number().int().min(1).max(20),
});

export type QuotedLine = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string;
  slug: string;
  image: string;
  unit: number;
  qty: number;
  available: number;
  ok: boolean;
};

/** Current prices and stock for the items in a browser cart (read-only). */
export async function quoteCart(input: unknown): Promise<{ lines: QuotedLine[]; subtotal: number }> {
  const parsed = z.array(lineSchema).max(50).safeParse(input);
  if (!parsed.success || parsed.data.length === 0) return { lines: [], subtotal: 0 };
  const items = parsed.data;
  const sb = createPublicClient();

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items.map((i) => i.variantId).filter((v): v is string => Boolean(v));
  type ProductRow = { id: string; name: string; slug: string; images: string[]; stock: number; effective_price: number; active: boolean };
  type VariantRow = { id: string; product_id: string; label: string; price: number | null; stock: number };
  const { data: productData } = await sb
    .from("product_list")
    .select("id,name,slug,images,stock,effective_price,active")
    .in("id", productIds);
  const { data: variantData } = variantIds.length
    ? await sb.from("product_variants").select("id,product_id,label,price,stock").in("id", variantIds)
    : { data: [] };

  const pMap = new Map<string, ProductRow>(((productData ?? []) as ProductRow[]).map((p) => [p.id, p]));
  const vMap = new Map<string, VariantRow>(((variantData ?? []) as VariantRow[]).map((v) => [v.id, v]));

  const lines: QuotedLine[] = items.map((i) => {
    const p = pMap.get(i.productId);
    const v = i.variantId ? vMap.get(i.variantId) : undefined;
    if (!p || !p.active || (i.variantId && (!v || v.product_id !== i.productId))) {
      return { ...i, name: p?.name ?? "Unavailable item", variantLabel: v?.label ?? "", slug: p?.slug ?? "", image: "", unit: 0, available: 0, ok: false };
    }
    const unit = v && v.price != null ? Number(v.price) : Number(p.effective_price);
    const available = v ? Number(v.stock) : Number(p.stock);
    return {
      ...i,
      name: p.name,
      variantLabel: v?.label ?? "",
      slug: p.slug,
      image: (p.images ?? [])[0] ?? "",
      unit,
      available,
      ok: available >= i.qty,
    };
  });

  const subtotal = lines.filter((l) => l.ok).reduce((s, l) => s + l.unit * l.qty, 0);
  return { lines, subtotal: Math.round(subtotal * 100) / 100 };
}
