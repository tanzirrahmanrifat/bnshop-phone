import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Icon } from "@/components/Icon";
import { ProductGrid, ProductRail } from "@/components/ProductCard";
import { BrandIcon } from "@/components/BrandIcon";
import {
  getBanners,
  getCategories,
  getFlashDeals,
  getProductRow,
  getRepairBrands,
  getSettings,
  getTags,
} from "@/lib/data";
import { waLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

const THEME: Record<string, string> = {
  dark: "bg-ink text-white",
  orange: "bg-accent-soft text-ink",
  green: "bg-green-soft text-ink",
  blue: "bg-[#e8eefb] text-ink",
};

function SectionHead({ id, title, href, linkLabel }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 id={id} className="text-[22px] font-extrabold leading-tight sm:text-[28px]">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex min-h-10 flex-none items-center gap-1 rounded-full px-1 text-sm font-bold text-accent">
          {linkLabel ?? "See all"}
          <Icon name="arrowLeft" size={16} className="rotate-180" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [settings, banners, categories, tags, deals, best, fresh, repairBrands] = await Promise.all([
    getSettings(),
    getBanners(),
    getCategories(),
    getTags(),
    getFlashDeals(10),
    getProductRow("popular", 8),
    getProductRow("new", 10),
    getRepairBrands(),
  ]);
  const side = banners.filter((b) => b.placement === "side").slice(0, 2);
  const promos = banners.filter((b) => b.placement === "promo").slice(0, 2);
  const wa = waLink(settings.whatsapp);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.shop_name,
    url: SITE_URL(),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "BN" } } : {}),
    ...(settings.hours ? { openingHours: settings.hours } : {}),
  };

  return (
    <main className="container-x flex flex-col gap-10 pb-16 pt-4 sm:gap-14 sm:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero: the shop is organised around the customer's phone */}
      <section aria-labelledby="hero-h" className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink text-white">
          <div className="grid items-center gap-6 p-5 sm:p-9 md:grid-cols-[1.1fr_.9fr]">
            <div className="flex flex-col gap-4">
              {settings.hero_badge && (
                <span className="self-start rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold text-mint">{settings.hero_badge}</span>
              )}
              <h1 id="hero-h" className="text-[clamp(30px,5vw,50px)] font-extrabold leading-[1.02] tracking-[-0.03em]">{settings.hero_title}</h1>
              <p className="max-w-md text-[16px] leading-relaxed text-[#c9d2df]">{settings.hero_text}</p>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/shop" className="btn btn-accent">Shop accessories</Link>
                <Link href="/repair" className="btn btn-ghost">See repair prices</Link>
              </div>
            </div>
            {settings.hero_image && (
              <div className="relative hidden aspect-[3/2] overflow-hidden rounded-[22px] sm:block">
                <Image src={settings.hero_image} alt="" fill priority sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="border-t border-white/10 bg-ink-2/60 px-5 py-4 sm:px-9">
              <p className="mb-3 text-[15px] font-bold">What phone do you have?</p>
              <ul className="scroll-x -mx-5 flex gap-2.5 px-5 sm:mx-0 sm:flex-wrap sm:px-0">
                {tags.map((t) => (
                  <li key={t.id} className="flex-none">
                    <Link href={`/tag/${t.slug}`} className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-white/[.07] py-1.5 pl-1.5 pr-4 font-bold ring-1 ring-white/10 transition hover:bg-white/15">
                      <BrandIcon name={t.name} image={t.image_url} size={36} />
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {(side.length > 0
            ? side.map((b) => ({ key: b.id, href: b.link || "/shop", cls: THEME[b.theme], kicker: b.subtitle, title: b.title, cta: b.cta_label || "Shop now" }))
            : [
                { key: "deals", href: "/shop?sale=1", cls: "bg-accent text-white", kicker: "Flash sale", title: "Chargers and power banks on offer", cta: "Shop deals" },
                { key: "repair", href: "/repair", cls: "bg-mint text-ink", kicker: "Repair", title: "Cracked screen? Check your price", cta: "Find my phone" },
              ]
          ).map((b) => (
            <Link key={b.key} href={b.href} className={`flex min-h-[150px] flex-col justify-between gap-3 rounded-[24px] p-4 sm:p-6 ${b.cls}`}>
              {b.kicker && <span className="text-[13px] font-bold opacity-80">{b.kicker}</span>}
              <span className="font-display text-[17px] font-extrabold leading-tight sm:text-[22px]">{b.title}</span>
              <span className="text-sm font-extrabold underline decoration-2 underline-offset-4">{b.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why buy here */}
      <ul aria-label="Why shop with us" className="scroll-x -mx-4 -mt-4 flex gap-2.5 px-4 sm:mx-0 sm:-mt-6 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {[
          { icon: "cash" as const, title: "Cash on Delivery", text: "Pay the rider when it arrives" },
          { icon: "truck" as const, title: "All 4 districts", text: settings.delivery_note || "Brunei-Muara, Tutong, Belait, Temburong" },
          ...(settings.warranty_note ? [{ icon: "shield" as const, title: "Warranty", text: settings.warranty_note }] : []),
          ...(wa ? [{ icon: "chat" as const, title: "Order on WhatsApp", text: "A real person replies" }] : []),
        ].map((t) => (
          <li key={t.title} className="flex w-[78%] flex-none items-center gap-3 rounded-2xl bg-white p-3.5 sm:w-auto">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#e8eefb] text-ink"><Icon name={t.icon} size={22} /></span>
            <span className="flex min-w-0 flex-col"><strong className="text-[15px]">{t.title}</strong><small className="truncate text-[13px] text-muted">{t.text}</small></span>
          </li>
        ))}
      </ul>

      {/* Flash deals */}
      {deals.length > 0 && (
        <section id="flash-deals" aria-labelledby="flash-h" className="-mx-4 flex scroll-mt-40 flex-col gap-4 bg-accent-soft px-4 py-5 sm:mx-0 sm:rounded-[28px] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 id="flash-h" className="flex items-center gap-2 text-[22px] font-extrabold sm:text-[28px]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white"><Icon name="bolt" size={20} /></span>
                Flash deals
              </h2>
              {deals[0].sale_ends_at && <Countdown endsAt={deals[0].sale_ends_at} />}
            </div>
            <Link href="/shop?sale=1" className="inline-flex min-h-10 items-center text-sm font-extrabold text-accent-ink underline decoration-2 underline-offset-4">All deals</Link>
          </div>
          <ProductRail products={deals} />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section aria-labelledby="cat-h" className="flex flex-col gap-4">
          <SectionHead id="cat-h" title="Shop by category" href="/shop" linkLabel="All products" />
          <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="flex h-full flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3 text-center text-[12px] font-bold leading-tight transition hover:shadow-[0_8px_20px_rgba(11,27,51,.08)] sm:px-2 sm:py-4 sm:text-sm">
                  <BrandIcon name={c.name} image={c.image_url} size={52} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {best.length > 0 && (
        <section aria-labelledby="best-h" className="flex flex-col gap-4">
          <SectionHead id="best-h" title="Best sellers" href="/shop?sort=popular" />
          <ProductGrid products={best} />
        </section>
      )}

      {/* Repair */}
      <section aria-labelledby="rep-h" className="overflow-hidden rounded-[28px] bg-ink text-white">
        <div className="grid gap-6 p-5 sm:p-9 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="flex flex-col gap-3">
            <span className="self-start rounded-full bg-mint/15 px-3 py-1 text-[13px] font-bold text-mint">Repair centre</span>
            <h2 id="rep-h" className="text-[clamp(26px,3.6vw,40px)] font-extrabold leading-[1.05]">Broken phone? See the price before you come in.</h2>
            <p className="max-w-lg leading-relaxed text-[#c9d2df]">Screens, batteries, charging ports and more. Free diagnosis, and you approve the final price before we start.</p>
            <form action="/repair" className="mt-1 flex max-w-lg overflow-hidden rounded-2xl bg-white" role="search">
              <label htmlFor="rq" className="sr-only">Phone model</label>
              <input id="rq" name="q" type="search" enterKeyHint="search" placeholder="Type your model, e.g. iPhone 13" className="min-w-0 flex-1 px-4 py-3.5 text-base text-ink outline-none" />
              <button type="submit" className="flex flex-none items-center gap-1.5 bg-mint px-4 font-extrabold text-ink"><Icon name="search" size={18} />Find</button>
            </form>
          </div>
          {repairBrands.length > 0 && (
            <ul className="grid grid-cols-4 gap-2 sm:gap-3">
              {repairBrands.slice(0, 8).map((b) => (
                <li key={b.id}>
                  <Link href={`/repair/${b.slug}`} className="flex h-full flex-col items-center gap-2 rounded-2xl bg-ink-2 px-1 py-3 text-center text-[12px] font-bold ring-1 ring-white/5 transition hover:ring-mint/60 sm:text-sm">
                    <BrandIcon name={b.name} image={b.image_url} size={48} />
                    <span className="leading-tight">{b.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {promos.length > 0 && (
        <section aria-label="Offers" className="grid gap-3 md:grid-cols-2">
          {promos.map((b) => (
            <Link key={b.id} href={b.link || "/shop"} className={`flex min-h-[160px] flex-col justify-center gap-2 rounded-[24px] p-6 sm:p-7 ${THEME[b.theme]}`}>
              {b.subtitle && <span className="text-[13px] font-bold opacity-80">{b.subtitle}</span>}
              <span className="font-display text-2xl font-extrabold">{b.title}</span>
              {b.cta_label && <span className="text-sm font-extrabold underline decoration-2 underline-offset-4">{b.cta_label}</span>}
            </Link>
          ))}
        </section>
      )}

      {fresh.length > 0 && (
        <section aria-labelledby="new-h" className="flex flex-col gap-4">
          <SectionHead id="new-h" title="New arrivals" href="/shop?sort=new" />
          <ProductRail products={fresh} />
        </section>
      )}
    </main>
  );
}
