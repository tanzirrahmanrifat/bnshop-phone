import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Banner,
  Category,
  District,
  Product,
  ProductListItem,
  RepairBrand,
  RepairModel,
  RepairPrice,
  RepairService,
  Settings,
  Tag,
} from "@/lib/types";

const LIST_COLUMNS =
  "id,name,slug,category_id,brand,price,sale_price,sale_ends_at,stock,images,option_name,active,featured,sold_count,created_at,effective_price,on_sale,in_stock";

export const getSettings = cache(async (): Promise<Settings> => {
  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error(`Could not load site settings: ${error?.message}`);
  return data as Settings;
});

export const getDistricts = cache(async (): Promise<District[]> => {
  const { data } = await createPublicClient().from("districts").select("*").eq("active", true).order("sort");
  return (data ?? []) as District[];
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await createPublicClient().from("categories").select("*").eq("active", true).order("sort");
  return (data ?? []) as Category[];
});

export const getTags = cache(async (): Promise<Tag[]> => {
  const { data } = await createPublicClient().from("tags").select("*").order("sort");
  return (data ?? []) as Tag[];
});

export const getBanners = cache(async (): Promise<Banner[]> => {
  const { data } = await createPublicClient().from("banners").select("*").eq("active", true).order("sort");
  return (data ?? []) as Banner[];
});

export type ProductQuery = {
  q?: string;
  categoryId?: string;
  tagId?: string;
  min?: number;
  max?: number;
  sort?: "popular" | "new" | "price_asc" | "price_desc" | "discount";
  page?: number;
  perPage?: number;
  onSaleOnly?: boolean;
};

export async function listProducts(opts: ProductQuery): Promise<{ items: ProductListItem[]; total: number }> {
  const sb = createPublicClient();
  const perPage = opts.perPage ?? 24;
  const page = Math.max(1, opts.page ?? 1);

  let ids: string[] | null = null;
  if (opts.tagId) {
    const { data } = await sb.from("product_tags").select("product_id").eq("tag_id", opts.tagId);
    const tagged: string[] = ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
    if (tagged.length === 0) return { items: [], total: 0 };
    ids = tagged;
  }

  let query = sb.from("product_list").select(LIST_COLUMNS, { count: "exact" }).eq("active", true);
  if (ids) query = query.in("id", ids);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.q) {
    const term = opts.q.replace(/[%_\\]/g, (c) => `\\${c}`).slice(0, 80);
    query = query.ilike("name", `%${term}%`);
  }
  if (typeof opts.min === "number" && opts.min > 0) query = query.gte("effective_price", opts.min);
  if (typeof opts.max === "number" && opts.max > 0) query = query.lte("effective_price", opts.max);
  if (opts.onSaleOnly) query = query.eq("on_sale", true);

  switch (opts.sort) {
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("effective_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("effective_price", { ascending: false });
      break;
    default:
      query = query.order("sold_count", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as ProductListItem[], total: count ?? 0 };
}

export const getFlashDeals = cache(async (limit = 10): Promise<ProductListItem[]> => {
  const { data } = await createPublicClient()
    .from("product_list")
    .select(LIST_COLUMNS)
    .eq("active", true)
    .eq("on_sale", true)
    .gt("sale_ends_at", new Date().toISOString())
    .order("sale_ends_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as ProductListItem[];
});

export async function getProductRow(sort: "popular" | "new", limit = 8): Promise<ProductListItem[]> {
  const { items } = await listProducts({ sort, perPage: limit });
  return items;
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const sb = createPublicClient();
  const { data: row } = await sb.from("product_list").select(LIST_COLUMNS).eq("slug", slug).eq("active", true).maybeSingle();
  if (!row) return null;
  const [{ data: extra }, { data: variants }] = await Promise.all([
    sb.from("products").select("description,sku,category:categories(name,slug)").eq("id", row.id).single(),
    sb.from("product_variants").select("*").eq("product_id", row.id).order("sort").order("label"),
  ]);
  const category = (extra?.category ?? null) as unknown as Product["category"];
  return {
    ...(row as ProductListItem),
    description: (extra?.description as string) ?? "",
    sku: (extra?.sku as string) ?? "",
    category,
    variants: (variants ?? []) as Product["variants"],
  };
});

export async function getRelated(product: ProductListItem, limit = 4): Promise<ProductListItem[]> {
  if (!product.category_id) return [];
  const { data } = await createPublicClient()
    .from("product_list")
    .select(LIST_COLUMNS)
    .eq("active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .order("sold_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as ProductListItem[];
}

/* ------------------------------------------------------------------ Repairs */

export const getRepairBrands = cache(async (): Promise<(RepairBrand & { model_count: number })[]> => {
  const sb = createPublicClient();
  const [{ data: brands }, { data: models }] = await Promise.all([
    sb.from("repair_brands").select("*").eq("active", true).order("sort").order("name"),
    sb.from("repair_models").select("brand_id").eq("active", true),
  ]);
  const counts = new Map<string, number>();
  (models ?? []).forEach((m) => counts.set(m.brand_id as string, (counts.get(m.brand_id as string) ?? 0) + 1));
  return ((brands ?? []) as RepairBrand[]).map((b) => ({ ...b, model_count: counts.get(b.id) ?? 0 }));
});

export const getRepairBrand = cache(
  async (slug: string): Promise<{ brand: RepairBrand; models: RepairModel[] } | null> => {
    const sb = createPublicClient();
    const { data: brand } = await sb.from("repair_brands").select("*").eq("slug", slug).eq("active", true).maybeSingle();
    if (!brand) return null;
    const { data: models } = await sb
      .from("repair_models")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("active", true)
      .order("sort")
      .order("name");
    return { brand: brand as RepairBrand, models: (models ?? []) as RepairModel[] };
  },
);

export const getRepairModel = cache(
  async (
    brandSlug: string,
    modelSlug: string,
  ): Promise<{ brand: RepairBrand; model: RepairModel; services: RepairService[]; prices: RepairPrice[] } | null> => {
    const found = await getRepairBrand(brandSlug);
    if (!found) return null;
    const model = found.models.find((m) => m.slug === modelSlug);
    if (!model) return null;
    const sb = createPublicClient();
    const [{ data: services }, { data: prices }] = await Promise.all([
      sb.from("repair_services").select("*").eq("active", true).order("sort").order("name"),
      sb.from("repair_prices").select("*").eq("model_id", model.id),
    ]);
    const priced = new Set((prices ?? []).map((p) => p.service_id as string));
    return {
      brand: found.brand,
      model,
      services: ((services ?? []) as RepairService[]).filter((s) => priced.has(s.id)),
      prices: (prices ?? []) as RepairPrice[],
    };
  },
);

/** Every active model with its brand, for the search box on the repair page. */
export const getRepairSearchIndex = cache(async (): Promise<{ name: string; series: string; brand: string; href: string }[]> => {
  const sb = createPublicClient();
  const [{ data: brands }, { data: models }] = await Promise.all([
    sb.from("repair_brands").select("id,name,slug").eq("active", true),
    sb.from("repair_models").select("name,slug,series,brand_id,sort").eq("active", true).order("sort").order("name"),
  ]);
  const byId = new Map(((brands ?? []) as { id: string; name: string; slug: string }[]).map((b) => [b.id, b]));
  return ((models ?? []) as { name: string; slug: string; series: string; brand_id: string }[])
    .filter((m) => byId.has(m.brand_id))
    .map((m) => {
      const b = byId.get(m.brand_id)!;
      return { name: m.name, series: m.series, brand: b.name, href: `/repair/${b.slug}/${m.slug}` };
    });
});

export const getRepairServices = cache(async (): Promise<RepairService[]> => {
  const { data } = await createPublicClient().from("repair_services").select("*").eq("active", true).order("sort");
  return (data ?? []) as RepairService[];
});

export const getMaxPrice = cache(async (): Promise<number> => {
  const { data } = await createPublicClient()
    .from("product_list")
    .select("effective_price")
    .eq("active", true)
    .order("effective_price", { ascending: false })
    .limit(1)
    .maybeSingle();
  const max = Number(data?.effective_price ?? 0);
  return Math.max(10, Math.ceil(max / 10) * 10);
});
