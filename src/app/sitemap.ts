import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL();
  const sb = createPublicClient();
  const [{ data: products }, { data: cats }, { data: tags }, { data: brands }, { data: models }] = await Promise.all([
    sb.from("products").select("slug,updated_at").eq("active", true).limit(5000),
    sb.from("categories").select("slug").eq("active", true),
    sb.from("tags").select("slug"),
    sb.from("repair_brands").select("id,slug").eq("active", true),
    sb.from("repair_models").select("slug,brand_id").eq("active", true),
  ]);
  const brandSlug = new Map((brands ?? []).map((b) => [b.id as string, b.slug as string]));

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/repair`, changeFrequency: "weekly", priority: 0.8 },
    ...(cats ?? []).map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...(tags ?? []).map((t) => ({ url: `${base}/tag/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(products ?? []).map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updated_at as string, priority: 0.7 })),
    ...(brands ?? []).map((b) => ({ url: `${base}/repair/${b.slug}`, priority: 0.6 })),
    ...(models ?? [])
      .filter((m) => brandSlug.has(m.brand_id as string))
      .map((m) => ({ url: `${base}/repair/${brandSlug.get(m.brand_id as string)}/${m.slug}`, priority: 0.5 })),
  ];
}
