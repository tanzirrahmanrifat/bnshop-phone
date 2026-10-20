import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { PriceFilter, SortSelect } from "@/components/ShopControls";
import { getCategories, getMaxPrice, getTags, listProducts, type ProductQuery } from "@/lib/data";

export type ListingParams = { q?: string; sort?: string; min?: string; max?: string; page?: string; sale?: string };

const SORTS = ["popular", "new", "price_asc", "price_desc"] as const;

export async function ProductListing({
  title,
  intro,
  params,
  basePath,
  categoryId,
  tagId,
}: {
  title: string;
  intro?: string;
  params: ListingParams;
  basePath: string;
  categoryId?: string;
  tagId?: string;
}) {
  const sort = (SORTS as readonly string[]).includes(params.sort ?? "") ? (params.sort as ProductQuery["sort"]) : "popular";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const min = Math.max(0, Number(params.min) || 0);
  const max = Math.max(0, Number(params.max) || 0);
  const perPage = 24;

  const [{ items, total }, categories, tags, top] = await Promise.all([
    listProducts({ q: params.q?.trim() || undefined, categoryId, tagId, min, max, sort, page, perPage, onSaleOnly: params.sale === "1" }),
    getCategories(),
    getTags(),
    getMaxPrice(),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const link = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const tagChips = tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Link key={t.id} href={`/tag/${t.slug}`} className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-bold ${t.id === tagId ? "border-ink bg-ink text-white" : "border-[#c9cfd8] bg-white"}`}>
          {t.name}
        </Link>
      ))}
    </div>
  );

  return (
    <main className="container-x flex flex-col gap-4 pb-16 pt-3 sm:gap-5 sm:pt-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="inline-flex min-h-9 items-center">Home</Link> <span aria-hidden="true">/</span> <span>{title}</span>
      </nav>
      <div className="rounded-[24px] bg-ink px-5 py-6 text-white sm:px-8 sm:py-7">
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-3xl">{title}</h1>
        {intro && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-[#c9d2df]">{intro}</p>}
      </div>

      {/* Phones: swipeable categories + folded filters */}
      <div className="flex flex-col gap-3 md:hidden">
        <ul className="scroll-x -mx-4 flex gap-2 px-4">
          <li className="flex-none"><Link href="/shop" className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${!categoryId && !tagId ? "bg-ink text-white" : "bg-white"}`}>All</Link></li>
          {categories.map((c) => (
            <li key={c.id} className="flex-none">
              <Link href={`/category/${c.slug}`} className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-bold ${c.id === categoryId ? "bg-ink text-white" : "bg-white"}`}>{c.name}</Link>
            </li>
          ))}
        </ul>
        <details className="group rounded-2xl bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-bold">
            <span>Filter by price or phone{min > 0 || max > 0 ? " (price set)" : ""}</span>
            <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="flex flex-col gap-5 border-t border-line p-4">
            <div>
              <h2 className="mb-2 text-sm font-extrabold">Price (B$)</h2>
              <Suspense>
                <PriceFilter key={`m-${min}-${max}`} top={top} min={min} max={max} />
              </Suspense>
            </div>
            {tagChips && (
              <div>
                <h2 className="mb-2 text-sm font-extrabold">For your phone</h2>
                {tagChips}
              </div>
            )}
          </div>
        </details>
      </div>

      <div className="flex items-start gap-6">
        <aside aria-label="Filters" className="hidden w-64 flex-none flex-col gap-6 rounded-[20px] bg-white p-5 md:flex md:sticky md:top-40">
          <div>
            <h2 className="mb-3 text-sm font-extrabold">Price (B$)</h2>
            <Suspense>
              <PriceFilter key={`${min}-${max}`} top={top} min={min} max={max} />
            </Suspense>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-extrabold">Categories</h2>
            <ul className="flex flex-col text-sm">
              <li><Link href="/shop" className={`block rounded-lg px-2 py-2 hover:bg-bg ${!categoryId && !tagId ? "font-extrabold" : ""}`}>All products</Link></li>
              {categories.map((c) => (
                <li key={c.id}><Link href={`/category/${c.slug}`} className={`block rounded-lg px-2 py-2 hover:bg-bg ${c.id === categoryId ? "bg-accent-soft font-extrabold text-accent-ink" : ""}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          {tagChips && (
            <div>
              <h2 className="mb-2 text-sm font-extrabold">For your phone</h2>
              {tagChips}
            </div>
          )}
        </aside>

        <section aria-label="Products" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <strong className="text-ink">{total}</strong> {total === 1 ? "product" : "products"}{params.q ? ` for “${params.q}”` : ""}
              {params.sale === "1" ? " on sale" : ""}
            </p>
            <Suspense>
              <SortSelect value={sort ?? "popular"} />
            </Suspense>
          </div>
          {items.length ? (
            <ProductGrid products={items} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white p-8 text-center">
              <p className="font-bold">No products match.</p>
              <p className="text-sm text-muted">Try a shorter search or clear the price filter.</p>
              <Link href={basePath} className="btn btn-sm btn-outline">Clear filters</Link>
            </div>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-3 flex flex-wrap justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={link(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-[10px] px-3 font-bold ${p === page ? "bg-ink text-white" : "bg-white"}`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
