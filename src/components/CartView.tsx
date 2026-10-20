"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ProductImage } from "@/components/ProductImage";
import { Steps } from "@/components/Choice";
import { StickyBar } from "@/components/StickyBar";
import { cart, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { useQuote } from "@/components/useQuote";

export const CHECKOUT_STEPS = ["Cart", "Delivery details", "Done"];

export function CartView({ whatsapp, freeDeliveryMin }: { whatsapp: string; freeDeliveryMin: number }) {
  const lines = useCart();
  const quote = useQuote(lines);
  const problems = quote?.lines.filter((l) => !l.ok) ?? [];
  const count = lines.reduce((n, l) => n + l.qty, 0);

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8eefb] text-ink"><Icon name="cart" size={30} /></span>
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <p className="text-muted">Pick your phone to see the cases, screen protectors and chargers that fit.</p>
        <Link href="/shop" className="btn btn-dark w-full">Browse products</Link>
      </div>
    );
  }

  const waText = [
    "Hi, I want to order:",
    ...lines.map((l) => `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} × ${l.qty}`),
    quote ? `Subtotal: ${money(quote.subtotal)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const wa = waLink(whatsapp, waText);
  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.price * l.qty, 0);
  const missing = freeDeliveryMin > 0 ? Math.max(0, freeDeliveryMin - subtotal) : 0;
  const progress = freeDeliveryMin > 0 ? Math.min(100, (subtotal / freeDeliveryMin) * 100) : 0;
  const blocked = problems.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <Steps steps={CHECKOUT_STEPS} current={1} />
      <h1 className="text-[28px] font-extrabold leading-tight sm:text-3xl">
        Your cart <span className="font-sans text-lg font-bold text-muted">({count} {count === 1 ? "item" : "items"})</span>
      </h1>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <section aria-label="Cart items" className="flex min-w-0 flex-col gap-3">
          {freeDeliveryMin > 0 && (
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm">
                {missing > 0 ? (
                  <>Add <strong>{money(missing)}</strong> more for <strong>free delivery</strong>.</>
                ) : (
                  <strong className="text-green">You get free delivery.</strong>
                )}
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#e3e7ee]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress to free delivery">
                <div className={`h-full rounded-full transition-[width] duration-500 ${missing > 0 ? "bg-accent" : "bg-green"}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <ul className="flex flex-col gap-2.5">
            {lines.map((l) => {
              const q = quote?.lines.find((x) => x.productId === l.productId && x.variantId === l.variantId);
              const unit = q ? q.unit : l.price;
              return (
                <li key={`${l.productId}-${l.variantId}`} className={`flex gap-3 rounded-2xl bg-white p-3 sm:gap-4 sm:p-4 ${q && !q.ok ? "ring-2 ring-accent" : ""}`}>
                  <Link href={`/product/${l.slug}`} className="w-[84px] flex-none overflow-hidden rounded-xl bg-[#f1f4f9] sm:w-24">
                    <ProductImage src={l.image} alt={l.name} sizes="96px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${l.slug}`} className="line-clamp-2 font-bold leading-snug">{l.name}</Link>
                      <button type="button" aria-label={`Remove ${l.name}`} className="-mr-1 -mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-accent" onClick={() => cart.remove(l.productId, l.variantId)}>
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                    {l.variantLabel && <span className="text-[13px] text-muted">{l.variantLabel}</span>}
                    {q && !q.ok && (
                      <span className="text-sm font-bold text-accent">{q.available > 0 ? `Only ${q.available} left. Lower the quantity.` : "No longer available. Remove it to continue."}</span>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <div role="group" aria-label="Quantity" className="flex h-10 items-center rounded-xl bg-[#f1f4f9]">
                        <button type="button" aria-label="Decrease quantity" className="h-10 w-10 text-lg font-extrabold disabled:opacity-30" disabled={l.qty <= 1} onClick={() => cart.setQty(l.productId, l.variantId, l.qty - 1)}>−</button>
                        <span aria-live="polite" className="min-w-6 text-center font-extrabold">{l.qty}</span>
                        <button type="button" aria-label="Increase quantity" className="h-10 w-10 text-lg font-extrabold" onClick={() => cart.setQty(l.productId, l.variantId, l.qty + 1)}>+</button>
                      </div>
                      <strong className="font-display text-[17px]">{money(unit * l.qty)}</strong>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/shop" className="inline-flex min-h-11 items-center gap-1.5 self-start font-bold text-ink">
            <Icon name="arrowLeft" size={18} />
            Keep shopping
          </Link>
        </section>

        <aside id="cart-summary" aria-label="Order summary" className="flex flex-col gap-4 rounded-[24px] bg-white p-5 sm:p-6 lg:sticky lg:top-40">
          <h2 className="text-xl font-extrabold">Summary</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-2.5 text-[15px]">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-bold">{quote ? money(quote.subtotal) : "…"}</dd>
            <dt className="text-muted">Delivery</dt>
            <dd className="font-bold">{missing === 0 && freeDeliveryMin > 0 ? "Free" : "By district, next step"}</dd>
          </dl>
          {blocked && <p className="alert alert-error text-sm">Some items need attention before checkout.</p>}
          <Link href="/checkout" aria-disabled={blocked} className={`btn btn-accent w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>
            Go to checkout
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="btn btn-green w-full">
              <Icon name="chat" size={18} />
              Send this cart on WhatsApp
            </a>
          )}
          <ul className="flex flex-col gap-2 border-t border-line pt-4 text-[13px] text-muted">
            <li className="flex items-center gap-2"><Icon name="cash" size={18} />Pay cash when it arrives, or bank transfer</li>
            <li className="flex items-center gap-2"><Icon name="lock" size={18} />No account needed</li>
          </ul>
        </aside>
      </div>

      <StickyBar watch="cart-summary">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[13px] text-muted">Subtotal</span>
            <strong className="font-display text-lg font-extrabold">{money(subtotal)}</strong>
          </div>
          <Link href="/checkout" aria-disabled={blocked} className={`btn btn-sm btn-accent flex-none ${blocked ? "pointer-events-none opacity-50" : ""}`}>
            Go to checkout
          </Link>
        </div>
      </StickyBar>
    </div>
  );
}
