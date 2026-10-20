"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { bookRepair, type BookingState } from "@/app/repair/[brand]/[model]/actions";
import { ChoiceCards } from "@/components/Choice";
import { Icon } from "@/components/Icon";
import { StickyBar } from "@/components/StickyBar";
import { money } from "@/lib/format";
import { GRADES, type District, type Grade, type RepairModel, type RepairPrice, type RepairService } from "@/lib/types";

export function RepairBooking({
  brandSlug,
  model,
  services,
  prices,
  districts,
  hasWhatsapp,
}: {
  brandSlug: string;
  model: RepairModel;
  services: RepairService[];
  prices: RepairPrice[];
  districts: District[];
  hasWhatsapp: boolean;
}) {
  const priceOf = useMemo(() => {
    const m = new Map<string, number>();
    prices.forEach((p) => m.set(`${p.service_id}:${p.grade}`, Number(p.price)));
    return (serviceId: string, grade: Grade) => m.get(`${serviceId}:${grade}`);
  }, [prices]);

  const defaultGrade: Grade = prices.some((p) => p.grade === "oem") ? "oem" : (prices[0]?.grade ?? "oem");
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [picked, setPicked] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [other, setOther] = useState(false);
  const [issue, setIssue] = useState("");
  const [mode, setMode] = useState<"walkin" | "pickup">("walkin");
  const [state, action, pending] = useActionState<BookingState, FormData>(bookRepair, {});

  useEffect(() => {
    if (state.done?.via === "whatsapp" && state.done.whatsappUrl) {
      window.location.href = state.done.whatsappUrl;
    }
  }, [state.done]);

  const lines = services
    .filter((s) => picked.includes(s.id))
    .map((s) => ({ name: s.name, price: priceOf(s.id, grade) }));
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
  const needsQuote = lines.some((l) => l.price === undefined) || other;
  const canBook = picked.length > 0 || (other && issue.trim().length >= 5);
  const estimateText = lines.length ? `${money(total)}${needsQuote ? " + quote" : ""}` : other ? "Quote" : "—";
  const gradeLabel = GRADES.find((g) => g.id === grade)?.label;

  if (state.done) {
    return (
      <div role="status" className="card step-in flex flex-col gap-3 p-5 sm:p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-green"><Icon name="check" size={28} /></span>
        <h2 className="text-2xl font-extrabold">Booked. Your repair ID is {state.done.code}</h2>
        <p className="text-muted">
          {state.done.estimate > 0
            ? `Estimate ${money(state.done.estimate)}${state.done.needsQuote ? " + quote" : ""}.`
            : "We'll check the problem and send you a price."}{" "}
          We&apos;ll contact you shortly to confirm. Keep your repair ID to track progress.
        </p>
        <div className="flex flex-wrap gap-3">
          {state.done.whatsappUrl && <a href={state.done.whatsappUrl} target="_blank" rel="noopener" className="btn btn-green"><Icon name="chat" size={18} />Send details on WhatsApp</a>}
          <Link href="/track" className="btn btn-outline">Track repair</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-start gap-6">
      <input type="hidden" name="modelId" value={model.id} />
      <input type="hidden" name="grade" value={grade} />
      {picked.map((id) => <input key={id} type="hidden" name="services" value={id} />)}

      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
        <fieldset>
          <legend className="mb-3 font-extrabold">Part quality</legend>
          <div role="radiogroup" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#e9ecf1] p-1">
            {GRADES.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={grade === g.id}
                onClick={() => setGrade(g.id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center transition ${grade === g.id ? "bg-white shadow" : ""}`}
              >
                <strong className="text-[13px] sm:text-sm">{g.label}</strong>
                <small className="text-xs leading-tight text-muted">{g.note}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-extrabold">What needs fixing?</legend>
          <div className="flex flex-col gap-2.5">
            {services.map((s) => {
              const on = picked.includes(s.id);
              const p = priceOf(s.id, grade);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => setPicked((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]))}
                  className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-colors sm:gap-3.5 sm:p-4 ${on ? "border-2 border-green bg-green-soft" : "border-2 border-transparent bg-white"} ${p === undefined ? "opacity-80" : ""}`}
                >
                  <span aria-hidden="true" className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border-2 ${on ? "border-green bg-green text-white" : "border-[#9aa3b2] bg-white text-transparent"}`}>
                    <Icon name="check" size={16} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong>{s.name}</strong>
                    <small className="text-[13px] text-muted">{s.description}</small>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-0.5">
                    <strong className="whitespace-nowrap font-display">{p === undefined ? "Quote" : money(p)}</strong>
                    {s.duration && <small className="text-xs text-muted">{s.duration}</small>}
                  </span>
                </button>
              );
            })}
            <div className={`rounded-2xl ${other ? "border-2 border-green bg-green-soft" : "border-2 border-dashed border-[#c9cfd8]"}`}>
              <button
                type="button"
                role="checkbox"
                aria-checked={other}
                aria-controls="other-issue"
                onClick={() => setOther((o) => !o)}
                className="flex w-full items-center gap-3 p-3.5 text-left sm:p-4"
              >
                <span aria-hidden="true" className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border-2 ${other ? "border-green bg-green text-white" : "border-[#9aa3b2] bg-white text-transparent"}`}>
                  <Icon name="check" size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong>Something else</strong>
                  <small className="text-[13px] text-muted">Not in the list? Describe it and we&apos;ll quote you.</small>
                </span>
                <strong className="font-display">Quote</strong>
              </button>
              {other && (
                <div id="other-issue" className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                  <label className="field">
                    <span className="label">What&apos;s wrong with your {model.name}?</span>
                    <textarea
                      className="input"
                      name="note"
                      rows={3}
                      maxLength={500}
                      required={picked.length === 0}
                      minLength={picked.length === 0 ? 5 : undefined}
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      placeholder="e.g. Face ID stopped working after a drop"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </div>

      <aside id="repair-book" aria-label="Your repair" className="flex flex-[1_1_320px] scroll-mt-40 flex-col gap-3.5 rounded-[24px] bg-ink p-5 text-white sm:p-6 md:sticky md:top-36">
        <h2 className="text-xl font-extrabold">Your repair</h2>
        <p className="flex items-center gap-3 rounded-2xl bg-ink-2 p-3">
          <span className="text-mint"><Icon name="phone" size={24} /></span>
          <span className="flex flex-col"><strong>{model.name}</strong><small className="text-[13px] text-[#aeb9ca]">{gradeLabel} parts</small></span>
        </p>
        {lines.length === 0 && !other ? (
          <p className="text-sm text-[#aeb9ca]">Select one or more repairs.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {lines.map((l) => (
              <li key={l.name} className="flex justify-between gap-3"><span>{l.name}</span><strong>{l.price === undefined ? "Quote" : money(l.price)}</strong></li>
            ))}
            {other && <li className="flex justify-between gap-3"><span>Something else</span><strong>Quote</strong></li>}
          </ul>
        )}
        <p className="flex items-baseline justify-between border-t border-ink-3 pt-3 text-[#aeb9ca]">
          <span>Estimate</span>
          <strong className="font-display text-2xl text-white">{estimateText}</strong>
        </p>
        <p className="text-xs text-[#aeb9ca]">Free diagnosis. Final price confirmed before we start.</p>

        {state.error && <p role="alert" className="alert alert-error">{state.error}</p>}

        <label className="field"><span className="label">Your name *</span><input className="input" name="name" autoComplete="name" required /></label>
        <label className="field"><span className="label">Mobile number *</span>
          <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="7XX XXXX" required /></span>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-2">How do you want to hand it over?</legend>
          <ChoiceCards
            name="mode"
            tone="dark"
            value={mode}
            onChange={(v) => setMode(v as "walkin" | "pickup")}
            columns="grid-cols-1"
            options={[
              { value: "walkin", title: "Walk in", note: "Bring it to the shop, wait or collect later" },
              { value: "pickup", title: "Pickup & delivery", note: "We collect from your door and bring it back" },
            ]}
          />
        </fieldset>
        <label className="field"><span className="label">{mode === "pickup" ? "Your district (for pickup)" : "Your district"}</span>
          <select className="input" name="district">{districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}</select>
        </label>
        {!other && <label className="field"><span className="label">Anything we should know? (optional)</span><input className="input" name="note" maxLength={500} placeholder="e.g. phone was dropped in water" /></label>}
        {hasWhatsapp && (
          <button type="submit" name="via" value="whatsapp" className="btn btn-mint w-full" disabled={pending || !canBook}>
            <Icon name="chat" size={18} />{pending ? "Booking…" : "Book on WhatsApp"}
          </button>
        )}
        <button type="submit" name="via" value="site" className="btn btn-ghost w-full" disabled={pending || !canBook}>
          {mode === "pickup" ? "Book a pickup" : "Book a walk-in"}
        </button>
        <Link href={`/repair/${brandSlug}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 font-extrabold text-mint"><Icon name="arrowLeft" size={18} />Change model</Link>
      </aside>

      <StickyBar watch="repair-book">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[13px] text-muted">{model.name} · {lines.length + (other ? 1 : 0)} selected</span>
            <strong className="font-display text-lg font-extrabold">{estimateText}</strong>
          </div>
          <a href="#repair-book" className={`btn btn-sm btn-green flex-none ${canBook ? "" : "pointer-events-none opacity-50"}`}>Book now</a>
        </div>
      </StickyBar>
    </form>
  );
}
