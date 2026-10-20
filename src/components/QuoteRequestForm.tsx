"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { requestQuote, type QuoteState } from "@/app/repair/request/actions";
import { ChoiceCards } from "@/components/Choice";
import { Icon } from "@/components/Icon";
import type { District } from "@/lib/types";

export function QuoteRequestForm({
  brands,
  districts,
  defaults,
  hasWhatsapp,
}: {
  brands: string[];
  districts: District[];
  defaults: { brand: string; model: string };
  hasWhatsapp: boolean;
}) {
  const [state, action, pending] = useActionState<QuoteState, FormData>(requestQuote, {});

  useEffect(() => {
    if (state.done?.via === "whatsapp" && state.done.whatsappUrl) window.location.href = state.done.whatsappUrl;
  }, [state.done]);

  if (state.done) {
    return (
      <div role="status" className="card step-in flex flex-col gap-3 p-5 sm:p-7">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-green"><Icon name="check" size={28} /></span>
        <h2 className="text-2xl font-extrabold">Request sent. Your repair ID is {state.done.code}</h2>
        <p className="text-muted">We&apos;ll look at the problem and message you a price. Nothing is charged until you approve it.</p>
        <div className="flex flex-wrap gap-2.5">
          {state.done.whatsappUrl && (
            <a href={state.done.whatsappUrl} target="_blank" rel="noopener" className="btn btn-green"><Icon name="chat" size={18} />Send details on WhatsApp</a>
          )}
          <Link href="/track" className="btn btn-outline">Track repair</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {state.error && <p role="alert" className="alert alert-error">{state.error}</p>}
        <section className="card flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-lg font-extrabold">Your device</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field"><span className="label">Brand</span>
              <input className="input" name="brand" list="brand-list" defaultValue={defaults.brand} placeholder="e.g. Samsung, Nothing, iPad" />
              <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>
            </label>
            <label className="field"><span className="label">Model</span>
              <input className="input" name="model" required defaultValue={defaults.model} placeholder="e.g. Galaxy A55" />
            </label>
          </div>
          <label className="field"><span className="label">What&apos;s the problem?</span>
            <textarea className="input" name="issue" rows={4} required minLength={5} maxLength={500} placeholder="e.g. Screen cracked after a drop, touch still works" />
          </label>
          <p className="text-[13px] text-muted">Tip: mention when it started and anything you&apos;ve tried. A photo can be sent on WhatsApp after you submit.</p>
        </section>

        <section className="card flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-lg font-extrabold">How do you want to hand it over?</h2>
          <ChoiceCards
            name="mode"
            defaultValue="walkin"
            options={[
              { value: "walkin", title: "Walk in", note: "Bring it to the shop" },
              { value: "pickup", title: "Pickup & delivery", note: "We collect from your door" },
            ]}
          />
        </section>
      </div>

      <aside className="flex flex-col gap-4 rounded-[24px] bg-ink p-5 text-white sm:p-6 lg:sticky lg:top-40">
        <h2 className="text-lg font-extrabold">Your contact</h2>
        <label className="field"><span className="label">Name</span><input className="input" name="name" autoComplete="name" required /></label>
        <label className="field"><span className="label">Mobile number</span>
          <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="7XX XXXX" required className="text-ink" /></span>
        </label>
        <label className="field"><span className="label">District</span>
          <select className="input" name="district">{districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}</select>
        </label>
        {hasWhatsapp && (
          <button type="submit" name="via" value="whatsapp" className="btn btn-mint w-full" disabled={pending}>
            <Icon name="chat" size={18} />{pending ? "Sending…" : "Get my quote on WhatsApp"}
          </button>
        )}
        <button type="submit" name="via" value="site" className="btn btn-ghost w-full" disabled={pending}>
          {pending ? "Sending…" : "Send quote request"}
        </button>
        <p className="text-[13px] text-[#aeb9ca]">Free diagnosis. You approve the price before we start.</p>
      </aside>
    </form>
  );
}
