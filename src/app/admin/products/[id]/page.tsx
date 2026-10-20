import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct, saveProduct } from "@/app/admin/products/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import { isoToBruneiLocal } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Variant = { id: string; label: string; price: number | null; stock: number; sku: string };

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const isNew = id === "new";

  const [{ data: product }, { data: categories }, { data: tags }, { data: variants }, { data: productTags }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").order("sort"),
    supabase.from("tags").select("id,name").order("sort"),
    isNew ? Promise.resolve({ data: [] }) : supabase.from("product_variants").select("id,label,price,stock,sku").eq("product_id", id).order("sort"),
    isNew ? Promise.resolve({ data: [] }) : supabase.from("product_tags").select("tag_id").eq("product_id", id),
  ]);
  if (!isNew && !product) notFound();
  const p = product ?? { name: "", slug: "", description: "", category_id: "", brand: "", price: "", sale_price: null, sale_ends_at: null, stock: 0, sku: "", images: [] as string[], option_name: "", active: true, featured: false };
  const selectedTags = new Set((productTags ?? []).map((t: { tag_id: string }) => t.tag_id));
  const rows: (Variant | null)[] = [...((variants ?? []) as Variant[]), null, null, null];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{isNew ? "New product" : p.name}</h1>
        <div className="flex gap-2">
          {!isNew && <Link href={`/product/${p.slug}`} target="_blank" className="btn btn-sm btn-outline">View on site</Link>}
          <Link href="/admin/products" className="btn btn-sm btn-outline">← All products</Link>
        </div>
      </div>
      <AdminNotice saved={sp.saved} error={sp.error} />

      <form action={saveProduct} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <label className="field sm:col-span-2"><span className="label">Name *</span><input className="input" name="name" required defaultValue={p.name} /></label>
          <label className="field"><span className="label">URL slug</span><input className="input" name="slug" defaultValue={p.slug} placeholder="auto from name" /></label>
          <label className="field"><span className="label">Brand</span><input className="input" name="brand" defaultValue={p.brand} /></label>
          <label className="field"><span className="label">Category</span>
            <select className="input" name="category_id" defaultValue={p.category_id ?? ""}>
              <option value="">— none —</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">SKU</span><input className="input" name="sku" defaultValue={p.sku} /></label>
          <label className="field sm:col-span-2"><span className="label">Description</span><textarea className="input" name="description" rows={6} defaultValue={p.description} /></label>
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-4">
          <h2 className="text-lg font-extrabold sm:col-span-4">Price & stock</h2>
          <label className="field"><span className="label">Price (B$) *</span><input className="input" name="price" type="number" min="0" step="0.01" required defaultValue={p.price} /></label>
          <label className="field"><span className="label">Sale price (B$)</span><input className="input" name="sale_price" type="number" min="0" step="0.01" defaultValue={p.sale_price ?? ""} /></label>
          <label className="field"><span className="label">Sale ends (Brunei time)</span><input className="input" name="sale_ends_at" type="datetime-local" defaultValue={isoToBruneiLocal(p.sale_ends_at)} /></label>
          <label className="field"><span className="label">Stock</span><input className="input" name="stock" type="number" min="0" step="1" defaultValue={p.stock} /></label>
          <p className="text-sm text-muted sm:col-span-4">A sale price with an end date appears in <strong>Flash Deals</strong> with a countdown. Without an end date, the sale runs until you remove it.</p>
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" name="active" defaultChecked={p.active} className="h-5 w-5" /> Visible in shop</label>
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" name="featured" defaultChecked={p.featured} className="h-5 w-5" /> Featured</label>
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">Options (variants)</h2>
          <p className="text-sm text-muted">For products sold in several colours or sizes. Each option has its own stock. Leave price empty to use the product price (including sale). Fill empty rows to add more; save to get new empty rows.</p>
          <label className="field max-w-xs"><span className="label">Option name</span><input className="input" name="option_name" defaultValue={p.option_name} placeholder="Colour" /></label>
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_4rem] gap-3 px-1 text-sm font-bold text-muted sm:grid">
            <span>Label</span><span>Price (B$)</span><span>Stock</span><span>SKU</span><span>Delete</span>
          </div>
          <ul className="flex flex-col gap-3 sm:gap-2">
            {rows.map((v, i) => (
              <li key={v?.id ?? `new-${i}`} className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_4rem] sm:items-center sm:gap-3 sm:bg-transparent sm:p-0">
                <label className="col-span-2 flex flex-col gap-1 sm:col-span-1"><span className="text-xs font-bold text-muted sm:sr-only">Label</span>
                  <input type="hidden" name="v_id" value={v?.id ?? ""} /><input className="input" name="v_label" defaultValue={v?.label ?? ""} placeholder={v ? "" : "e.g. Black"} />
                </label>
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-muted sm:sr-only">Price (B$)</span>
                  <input className="input" name="v_price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={v?.price ?? ""} />
                </label>
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-muted sm:sr-only">Stock</span>
                  <input className="input" name="v_stock" type="number" inputMode="numeric" min="0" step="1" defaultValue={v?.stock ?? 0} />
                </label>
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-muted sm:sr-only">SKU</span>
                  <input className="input" name="v_sku" defaultValue={v?.sku ?? ""} />
                </label>
                <span className="flex items-center gap-2 text-sm font-bold sm:justify-center">
                  {v && <><input type="checkbox" name="v_delete" value={v.id} aria-label={`Delete ${v.label}`} className="h-5 w-5" /><span className="sm:sr-only">Delete</span></>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">Images</h2>
          <div className="flex flex-wrap gap-3">
            {(p.images as string[]).map((src) => (
              <label key={src} className="flex flex-col items-center gap-1 text-xs">
                <input type="hidden" name="img_keep" value={src} />
                <span className="relative h-24 w-24 overflow-hidden rounded-xl bg-bg"><Image src={src} alt="" fill sizes="96px" className="object-cover" /></span>
                <span className="flex items-center gap-1"><input type="checkbox" name="img_remove" value={src} /> Remove</span>
              </label>
            ))}
          </div>
          <label className="field"><span className="label">Add images (JPG, PNG, WebP · max 5 MB each)</span>
            <input className="input pt-2.5" name="new_images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple />
          </label>
          <p className="text-sm text-muted">The first image is used on product cards. Square images (1:1) look best.</p>
        </section>

        {(tags ?? []).length > 0 && (
          <section className="card flex flex-col gap-3 p-5">
            <h2 className="text-lg font-extrabold">Fits these phones</h2>
            <div className="flex flex-wrap gap-3">
              {(tags ?? []).map((t) => (
                <label key={t.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-bold">
                  <input type="checkbox" name="tags" value={t.id} defaultChecked={selectedTags.has(t.id)} /> {t.name}
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <SubmitButton className="btn btn-accent">Save product</SubmitButton>
        </div>
      </form>

      {!isNew && (
        <form action={deleteProduct} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-muted">Deleting removes the product from the shop. Past orders keep their item names and prices.</p>
          <SubmitButton className="btn btn-danger" confirm="Delete this product permanently?">Delete product</SubmitButton>
        </form>
      )}
    </>
  );
}
