import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { BuyBox } from "@/components/BuyBox";
import { Icon } from "@/components/Icon";
import { ProductGrid } from "@/components/ProductCard";
import { getProductBySlug, getRelated, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description = (p.description || `${p.name} — cash on delivery across Brunei.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0] }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  const related = await getRelated(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description || undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL()}/product/${product.slug}`,
      priceCurrency: "BND",
      price: Number(product.effective_price).toFixed(2),
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(product.on_sale && product.sale_ends_at ? { priceValidUntil: product.sale_ends_at.slice(0, 10) } : {}),
    },
  };

  return (
    <main className="container-x flex flex-col gap-6 pb-16 pt-3 sm:gap-8 sm:pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="inline-flex min-h-9 items-center">Home</Link>
        {product.category && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/category/${product.category.slug}`} className="inline-flex min-h-9 items-center">{product.category.name}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="truncate">{product.name}</span>
      </nav>

      <section className="flex flex-wrap items-start gap-6 md:gap-10">
        <div className="min-w-0 flex-[1_1_420px]">
          <Gallery images={product.images} name={product.name} />
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <div className="flex flex-col gap-2">
            {(product.brand || product.sku) && (
              <span className="text-[13px] font-bold text-muted">
                {[product.brand, product.sku && `SKU ${product.sku}`].filter(Boolean).join(" · ")}
              </span>
            )}
            <h1 className="text-[clamp(24px,3vw,34px)] font-extrabold leading-tight tracking-[-0.02em]">{product.name}</h1>
          </div>
          <BuyBox product={product} whatsapp={settings.whatsapp} />
          <ul className="rounded-2xl border border-line bg-white px-4">
            {[
              { icon: "truck" as const, text: settings.delivery_note || "Delivery to all 4 districts" },
              { icon: "cash" as const, text: "Cash on Delivery or bank transfer" },
              ...(settings.warranty_note ? [{ icon: "shield" as const, text: settings.warranty_note }] : []),
            ].map((r) => (
              <li key={r.text} className="flex items-center gap-3 border-b border-line py-3 text-sm last:border-0">
                <Icon name={r.icon} />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {product.description && (
        <section aria-labelledby="desc-h" className="card p-5 sm:p-7">
          <h2 id="desc-h" className="mb-3 text-xl font-extrabold">Description</h2>
          <div className="prose-shop max-w-3xl whitespace-pre-line text-[15px]">{product.description}</div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-h" className="flex flex-col gap-4">
          <h2 id="rel-h" className="text-2xl font-extrabold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </main>
  );
}
