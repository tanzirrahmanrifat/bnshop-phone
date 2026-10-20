"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Price } from "@/components/Price";
import { StickyBar } from "@/components/StickyBar";
import { cart } from "@/lib/cart";
import { discountPercent, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function BuyBox({ product, whatsapp }: { product: Product; whatsapp: string }) {
  const router = useRouter();
  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(
    hasVariants ? (product.variants.find((v) => v.stock > 0)?.id ?? null) : null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(() => product.variants.find((v) => v.id === variantId) ?? null, [product.variants, variantId]);
  const unit = variant?.price != null ? Number(variant.price) : Number(product.effective_price);
  const regular = variant?.price != null ? Number(variant.price) : Number(product.price);
  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const canBuy = stock > 0 && (!hasVariants || variant !== null);
  const pct = discountPercent(regular, unit);

  const add = () => {
    cart.add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantLabel: variant?.label ?? "",
        image: product.images[0] ?? "",
        price: unit,
      },
      Math.min(qty, stock),
    );
  };

  const waText = `Hi, I want to order: ${product.name}${variant ? ` (${variant.label})` : ""} × ${qty}`;
  const wa = waLink(whatsapp, waText);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Price price={regular} effective={unit} size="lg" />
        {pct > 0 && <span className="rounded-md bg-accent-soft px-2 py-1 text-[13px] font-extrabold text-accent-ink">Save {money(regular - unit)}</span>}
      </div>
      <p className={`text-sm font-bold ${stock > 0 ? "text-green" : "text-accent"}`}>
        {stock > 0 ? (stock <= 5 ? `Only ${stock} left` : "In stock") : "Out of stock"}
      </p>

      {hasVariants && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-extrabold">
            {product.option_name || "Option"}: {variant?.label ?? "choose one"}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variantId}
                disabled={v.stock < 1}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={`min-h-11 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                  v.id === variantId ? "border-2 border-ink bg-bg" : "border border-[#c9cfd8] bg-white"
                }`}
              >
                {v.label}
                {v.price != null && v.price !== product.effective_price ? ` · ${money(v.price)}` : ""}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div id="buy-actions" className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label="Quantity" className="flex h-[50px] items-center rounded-xl border border-[#c9cfd8] bg-white">
          <button type="button" aria-label="Decrease quantity" className="h-12 w-12 text-xl font-extrabold" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span aria-live="polite" className="min-w-8 text-center font-extrabold">{qty}</span>
          <button type="button" aria-label="Increase quantity" className="h-12 w-12 text-xl font-extrabold" onClick={() => setQty((q) => Math.min(Math.max(1, stock), 20, q + 1))}>+</button>
        </div>
        <button
          type="button"
          disabled={!canBuy}
          className="btn btn-outline flex-[1_1_150px]"
          onClick={() => {
            add();
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          <Icon name={added ? "check" : "cart"} size={18} />
          {added ? "Added to cart" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={!canBuy}
          className="btn btn-accent flex-[1_1_150px]"
          onClick={() => {
            add();
            router.push("/checkout");
          }}
        >
          <Icon name="bolt" size={18} />
          Buy now
        </button>
      </div>
      <p className="-mt-2 text-[13px] text-muted">Pay cash when it arrives. No account needed.</p>
      {wa && (
        <a href={wa} target="_blank" rel="noopener" className="btn btn-green w-full">
          <Icon name="chat" size={18} />
          Order on WhatsApp
        </a>
      )}

      <StickyBar watch="buy-actions">
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[13px] text-muted">{variant ? `${product.name} · ${variant.label}` : product.name}</span>
            <strong className={`font-display text-lg font-extrabold ${pct > 0 ? "text-accent" : ""}`}>{money(unit)}</strong>
          </div>
          <button
            type="button"
            disabled={!canBuy}
            aria-label="Add to cart"
            className={`btn btn-sm flex-none !px-0 w-11 ${added ? "btn-green" : "btn-outline"}`}
            onClick={() => {
              add();
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
          >
            <Icon name={added ? "check" : "cart"} size={18} />
          </button>
          <button
            type="button"
            disabled={!canBuy}
            className="btn btn-sm btn-accent flex-none"
            onClick={() => {
              add();
              router.push("/checkout");
            }}
          >
            Buy now
          </button>
        </div>
      </StickyBar>
    </div>
  );
}
