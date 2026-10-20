"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { ChoiceCards, Steps } from "@/components/Choice";
import { CHECKOUT_STEPS } from "@/components/CartView";
import { Icon } from "@/components/Icon";
import { ProductImage } from "@/components/ProductImage";
import { StickyBar } from "@/components/StickyBar";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import type { District } from "@/lib/types";
import { useQuote } from "@/components/useQuote";

export function CheckoutForm({
  districts,
  freeDeliveryMin,
  bankDetails,
  defaults,
}: {
  districts: District[];
  freeDeliveryMin: number;
  bankDetails: string;
  defaults: { name: string; phone: string; email: string };
}) {
  const lines = useCart();
  const quote = useQuote(lines);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const f = state.fields ?? {};
  const [district, setDistrict] = useState(f.district || districts[0]?.code || "");
  const [payment, setPayment] = useState<"cod" | "bank">((f.payment as "cod" | "bank") || "cod");

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-12 text-center">
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <p className="text-muted">Add something to your cart, then come back here to place the order.</p>
        <Link href="/shop" className="btn btn-dark w-full">Browse products</Link>
      </div>
    );
  }

  const subtotal = quote?.subtotal ?? 0;
  const freeDelivery = freeDeliveryMin > 0 && subtotal >= freeDeliveryMin;
  const fee = districts.find((d) => d.code === district)?.fee ?? 0;
  const delivery = freeDelivery ? 0 : Number(fee);
  const total = subtotal + delivery;
  const blocked = quote?.lines.some((l) => !l.ok) ?? false;
  const cannotSubmit = pending || !quote || blocked;
  const submitLabel = pending ? "Placing order…" : payment === "cod" ? "Place order, pay on delivery" : "Place order";

  const itemsList = (
    <ul className="flex flex-col gap-3">
      {(quote?.lines ?? []).map((l) => {
        const img = lines.find((x) => x.productId === l.productId && x.variantId === l.variantId)?.image;
        return (
          <li key={`${l.productId}-${l.variantId}`} className="flex items-center gap-3 text-sm">
            <span className="relative w-12 flex-none overflow-hidden rounded-lg bg-[#f1f4f9]">
              <ProductImage src={img} alt="" sizes="48px" />
              <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink px-1 text-[11px] font-extrabold text-white">{l.qty}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-semibold">{l.name}</span>
              {l.variantLabel && <span className="text-muted">{l.variantLabel}</span>}
              {!l.ok && <span className="block font-bold text-accent">Not enough stock</span>}
            </span>
            <strong>{money(l.unit * l.qty)}</strong>
          </li>
        );
      })}
    </ul>
  );

  const totals = (
    <dl className="grid grid-cols-[1fr_auto] gap-2 text-[15px]">
      <dt className="text-muted">Subtotal</dt><dd className="font-bold">{quote ? money(subtotal) : "…"}</dd>
      <dt className="text-muted">Delivery</dt><dd className="font-bold">{delivery === 0 ? "Free" : money(delivery)}</dd>
      <dt className="border-t border-line pt-2.5 font-extrabold">Total</dt>
      <dd className="border-t border-line pt-2.5 font-display text-xl font-extrabold">{quote ? money(total) : "…"}</dd>
    </dl>
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })))} />
      <Steps steps={CHECKOUT_STEPS} current={2} />
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-3xl">Where should we deliver?</h1>
        <p className="text-sm text-muted">We call or WhatsApp you to confirm before the rider leaves.</p>
      </div>

      {/* Phones: order summary folded at the top */}
      <details className="group rounded-2xl bg-white lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4">
          <span className="flex items-center gap-2 font-bold"><Icon name="cart" size={18} />Order summary ({lines.length})</span>
          <span className="flex items-center gap-2 font-display font-extrabold">{quote ? money(total) : "…"}<span className="text-muted transition-transform group-open:rotate-180">▾</span></span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-line p-4">{itemsList}{totals}</div>
      </details>

      {state.error && <p role="alert" className="alert alert-error">{state.error}</p>}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="c-h" className="card flex flex-col gap-4 p-4 sm:p-6">
            <h2 id="c-h" className="flex items-center gap-2.5 text-lg font-extrabold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">1</span>Your contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span className="label">Full name</span>
                <input className="input" name="name" autoComplete="name" required defaultValue={f.name ?? defaults.name} />
              </label>
              <label className="field"><span className="label">Mobile number</span>
                <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="7XX XXXX" required defaultValue={f.phone ?? defaults.phone} /></span>
              </label>
              <label className="field sm:col-span-2"><span className="label">Email <span className="font-semibold text-muted">(optional, for a receipt)</span></span>
                <input className="input" name="email" type="email" autoComplete="email" defaultValue={f.email ?? defaults.email} />
              </label>
            </div>
          </section>

          <section aria-labelledby="d-h" className="card flex flex-col gap-4 p-4 sm:p-6">
            <h2 id="d-h" className="flex items-center gap-2.5 text-lg font-extrabold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">2</span>Delivery address</h2>
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-2">District</legend>
              <ChoiceCards
                name="district"
                value={district}
                onChange={setDistrict}
                required
                columns="grid-cols-2"
                options={districts.map((d) => ({
                  value: d.code,
                  title: d.name,
                  note: freeDelivery || Number(d.fee) === 0 ? "Free delivery" : `Delivery ${money(d.fee)}`,
                }))}
              />
              {districts.find((d) => d.code === district)?.eta && (
                <p className="text-[13px] text-muted">Usually arrives in {districts.find((d) => d.code === district)?.eta}.</p>
              )}
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span className="label">Mukim / Kampong</span>
                <input className="input" name="area" required placeholder="e.g. Kg. Kiulap" defaultValue={f.area} />
              </label>
              <label className="field"><span className="label">House no., Simpang, Jalan</span>
                <input className="input" name="address" autoComplete="street-address" required placeholder="e.g. No. 12, Simpang 34" defaultValue={f.address} />
              </label>
              <label className="field sm:col-span-2"><span className="label">Note for the rider <span className="font-semibold text-muted">(optional)</span></span>
                <input className="input" name="landmark" placeholder="Near the mosque, blue gate, call on arrival" defaultValue={f.landmark} />
              </label>
            </div>
          </section>

          <section aria-labelledby="p-h" className="card flex flex-col gap-4 p-4 sm:p-6">
            <h2 id="p-h" className="flex items-center gap-2.5 text-lg font-extrabold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">3</span>Payment</h2>
            <ChoiceCards
              name="payment"
              value={payment}
              onChange={(v) => setPayment(v as "cod" | "bank")}
              options={[
                { value: "cod", title: "Cash on Delivery", note: "Pay the rider in cash when it arrives" },
                { value: "bank", title: "Bank transfer", note: "Transfer after we confirm, then send the receipt on WhatsApp" },
              ]}
            />
            {payment === "bank" && bankDetails && <p className="whitespace-pre-line rounded-xl bg-bg p-4 text-sm">{bankDetails}</p>}
            <label className="field"><span className="label">Order note <span className="font-semibold text-muted">(optional)</span></span>
              <input className="input" name="note" placeholder="Best time to deliver, gift wrap…" defaultValue={f.note} />
            </label>
          </section>
        </div>

        <aside aria-label="Your order" className="flex flex-col gap-4 rounded-[24px] bg-white p-5 sm:p-6 lg:sticky lg:top-40">
          <h2 className="hidden text-xl font-extrabold lg:block">Your order</h2>
          <div className="hidden lg:block">{itemsList}</div>
          {totals}
          <button id="place-order" type="submit" className="btn btn-accent w-full" disabled={cannotSubmit}>
            <Icon name="lock" size={18} />
            {submitLabel}
          </button>
          {blocked && <Link href="/cart" className="text-center text-sm font-bold text-accent">Fix your cart first</Link>}
          <p className="text-center text-[13px] text-muted">By placing the order you agree to be contacted to confirm it.</p>
        </aside>
      </div>

      <StickyBar watch="place-order">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[13px] text-muted">Total</span>
            <strong className="font-display text-lg font-extrabold">{quote ? money(total) : "…"}</strong>
          </div>
          <button type="submit" className="btn btn-sm btn-accent flex-none" disabled={cannotSubmit}>
            {pending ? "Placing…" : "Place order"}
          </button>
        </div>
      </StickyBar>
    </form>
  );
}
