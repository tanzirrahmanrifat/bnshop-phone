import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { Price } from "@/components/Price";
import { CardActions } from "@/components/CardActions";
import { discountPercent } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: ProductListItem; priority?: boolean }) {
  const pct = discountPercent(product.price, product.effective_price);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#e6e9ef] bg-white transition-shadow hover:shadow-[0_12px_28px_rgba(11,27,51,.10)]">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden bg-[#f1f4f9]" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.images[0]} alt="" priority={priority} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-extrabold text-white">−{pct}%</span>
        )}
        {!product.in_stock && (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 py-1 text-center text-xs font-bold text-white">Sold out</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.6em] text-[14px] font-bold leading-snug text-ink sm:text-[15px]">
          {product.name}
        </Link>
        <Price price={product.price} effective={product.effective_price} />
        <div className="mt-auto pt-1.5">
          <CardActions product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} />
      ))}
    </div>
  );
}

/** Swipeable row on phones, normal grid from tablet up. */
export function ProductRail({ products }: { products: ProductListItem[] }) {
  return (
    <div className="scroll-x -mx-4 flex snap-x snap-mandatory gap-2.5 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <div key={p.id} className="w-[46%] flex-none snap-start sm:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
