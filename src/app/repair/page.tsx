import type { Metadata } from "next";
import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";
import { Icon } from "@/components/Icon";
import { Suspense } from "react";
import { RepairProgress } from "@/components/RepairSteps";
import { RepairSearch } from "@/components/RepairSearch";
import { getRepairBrands, getRepairSearchIndex, getRepairServices, getSettings } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Phone repair in Brunei — screen, battery, charging port",
  description: "Choose your phone, see the price for each repair and book a walk-in or pickup across Brunei. Free diagnosis, quote before repair.",
  alternates: { canonical: "/repair" },
};

const STEPS = [
  ["Book", "Online, WhatsApp or walk in."],
  ["Drop off or pickup", "We collect from your door if you prefer."],
  ["Free diagnosis", "A technician tests the device."],
  ["Fixed quote", "Price, part grade and warranty. You approve first."],
  ["Repair & test", "Fixed and checked before handover."],
  ["Collect or delivery", "Pay cash or bank transfer."],
];

const FAQ = [
  ["How long does a repair take?", "Screen and battery repairs are usually done the same day. Board-level and water damage repairs can take a few days. We confirm the time with your quote."],
  ["What parts do you use?", "You choose: compatible, OEM-grade or original where available. The grade, price and warranty are confirmed before we start."],
  ["Is the diagnosis free?", "Yes. If you decide not to repair, you pay nothing for the check."],
  ["Is my data safe?", "We do not access your personal data. Please back up before drop-off where possible; we tell you in advance if a repair might erase data."],
];

export default async function RepairPage() {
  const [brands, services, settings, index] = await Promise.all([getRepairBrands(), getRepairServices(), getSettings(), getRepairSearchIndex()]);
  const wa = waLink(settings.whatsapp, "Hi, I need a repair quote.");
  return (
    <main className="container-x flex flex-col gap-10 pb-16 pt-4 sm:gap-12 sm:pt-6">
      <section className="overflow-hidden rounded-[28px] bg-ink text-white">
        <div className="grid gap-6 p-5 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <span className="self-start rounded-full bg-mint/15 px-3 py-1 text-[13px] font-bold text-mint">Phone, tablet and smartwatch repair</span>
            <h1 className="max-w-2xl text-[clamp(30px,4.6vw,50px)] font-extrabold leading-[1.02] tracking-[-0.03em]">Cracked, dead or not charging? See your price first.</h1>
            <p className="max-w-xl text-[16px] leading-relaxed text-[#c9d2df]">Walk in, or we collect from your door anywhere in Brunei. Free diagnosis, and you approve the price before we start.</p>
            <ul className="flex flex-wrap gap-2 text-[13px] font-bold">
              {["Free diagnosis", "Choose your part quality", "Warranty on parts"].map((t) => (
                <li key={t} className="flex items-center gap-1.5 rounded-full bg-white/[.07] px-3 py-1.5"><Icon name="check" size={16} className="text-mint" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-[22px] bg-ink-2 p-4 sm:p-5">
            <Suspense>
              <RepairSearch index={index} />
            </Suspense>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="#brands" className="btn btn-sm btn-mint flex-1">Choose by brand</a>
              <Link href="/repair/request" className="btn btn-sm btn-ghost flex-1">Phone not listed?</Link>
            </div>
            {wa && <a href={wa} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-mint"><Icon name="chat" size={18} />Or ask us on WhatsApp</a>}
          </div>
        </div>
      </section>

      <section id="brands" aria-labelledby="b-h" className="step-in flex scroll-mt-40 flex-col gap-5">
        <RepairProgress step={1} />
        <h2 id="b-h" className="text-[clamp(24px,3vw,34px)] font-extrabold">Which phone do you need repaired?</h2>
        {brands.length === 0 ? (
          <p className="text-muted">Brands will appear here once they are added in the admin panel.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4">
            {brands.map((b) => (
              <li key={b.id}>
                <Link href={`/repair/${b.slug}`} className="flex h-full items-center gap-3 rounded-[20px] border border-line bg-white p-3 transition hover:border-ink hover:shadow-[0_8px_20px_rgba(11,27,51,.08)] sm:p-4">
                  <BrandIcon name={b.name} image={b.image_url} size={52} />
                  <span className="flex min-w-0 flex-col">
                    <strong className="truncate font-display text-[16px] sm:text-lg">{b.name}</strong>
                    <span className="text-[13px] text-muted">{b.model_count} {b.model_count === 1 ? "model" : "models"}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/repair/request" className="flex h-full items-center gap-3 rounded-[20px] border-2 border-dashed border-[#c9cfd8] bg-transparent p-3 transition hover:border-green sm:p-4">
                <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-green-soft text-green"><Icon name="plus" size={24} /></span>
                <span className="flex min-w-0 flex-col">
                  <strong className="font-display text-[16px] sm:text-lg">Other phone</strong>
                  <span className="text-[13px] text-muted">Ask for a quote</span>
                </span>
              </Link>
            </li>
          </ul>
        )}
      </section>

      <section aria-labelledby="how-h" className="flex flex-col gap-5">
        <h2 id="how-h" className="text-[clamp(24px,3vw,30px)] font-extrabold">How it works</h2>
        <ol className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 sm:p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green font-display text-sm font-extrabold text-white">{i + 1}</span>
              <strong>{title}</strong>
              <span className="text-[13px] leading-relaxed text-muted">{text}</span>
            </li>
          ))}
        </ol>
      </section>

      {services.length > 0 && (
        <section aria-labelledby="svc-h" className="flex flex-col gap-5">
          <h2 id="svc-h" className="text-[clamp(24px,3vw,30px)] font-extrabold">What we fix</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id} className="flex gap-3.5 rounded-2xl border border-line bg-white p-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-green-soft text-green"><Icon name="wrench" size={22} /></span>
                <span className="flex flex-col gap-1">
                  <strong>{s.name}</strong>
                  <span className="text-[13px] text-muted">{s.description}</span>
                  {s.duration && <span className="text-[13px] font-bold text-green">Typical time: {s.duration}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="g-h" className="flex flex-col gap-5">
        <h2 id="g-h" className="text-[clamp(24px,3vw,30px)] font-extrabold">You choose the part. We explain the difference.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Budget", "Compatible", "Third-party part that works well for everyday use. Lowest price.", false],
            ["Most chosen", "OEM-grade", "Close to original quality and colour accuracy. Best value.", true],
            ["Premium", "Original", "Genuine manufacturer part where available.", false],
          ].map(([k, t, d, featured]) => (
            <div key={String(t)} className={`flex flex-col gap-2.5 rounded-[18px] border-2 p-6 ${featured ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
              <small className={`self-start rounded-full px-2.5 py-1 text-[13px] font-bold ${featured ? "bg-mint text-ink" : "bg-bg text-muted"}`}>{k}</small>
              <h3 className="text-[22px] font-extrabold">{t}</h3>
              <p className={`text-sm leading-relaxed ${featured ? "text-[#c9d2df]" : "text-muted"}`}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-h" className="flex flex-col gap-4">
        <h2 id="faq-h" className="text-[clamp(24px,3vw,30px)] font-extrabold">Questions, answered</h2>
        <div className="flex flex-col gap-2.5">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold">
                {q}
                <span aria-hidden="true" className="text-2xl text-green group-open:rotate-45 transition">+</span>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
