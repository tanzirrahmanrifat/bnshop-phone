import Link from "next/link";
import { Icon } from "@/components/Icon";
import { CartLink, MobileCategoryToggle } from "@/components/HeaderClient";
import type { Category, Settings } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function Header({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const wa = waLink(settings.whatsapp);
  return (
    <>
      <div className="bg-ink text-[13px] text-[#e6eaf0]">
        <div className="container-x flex items-center justify-between gap-x-6 py-1.5 sm:py-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Icon name="truck" size={16} />
            <span className="truncate">{settings.topbar}</span>
          </span>
          <nav aria-label="Quick links" className="flex flex-none items-center gap-5">
            <Link href="/track" className="inline-flex min-h-8 items-center">Track order</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="hidden min-h-8 items-center font-bold text-mint sm:inline-flex">
                WhatsApp {settings.whatsapp}
              </a>
            )}
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="container-x flex flex-wrap items-center gap-x-3 gap-y-2.5 py-2.5 md:gap-x-6 md:py-3.5">
          <MobileCategoryToggle />
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-none">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-ink font-display text-lg font-extrabold text-white">
              {settings.shop_name.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-lg font-extrabold sm:text-xl">{settings.shop_name}</span>
              <span className="hidden text-xs text-muted sm:block">{settings.tagline}</span>
            </span>
          </Link>

          <form action="/shop" role="search" className="order-3 flex w-full min-w-0 overflow-hidden rounded-xl border-2 border-ink md:order-none md:w-auto md:flex-1">
            <label htmlFor="q" className="sr-only">Search products</label>
            <input id="q" name="q" type="search" enterKeyHint="search" placeholder="Search cases, chargers, screen protectors…" className="min-w-0 flex-1 px-3.5 py-2.5 text-base outline-none md:py-3" />
            <button type="submit" aria-label="Search" className="flex min-w-12 items-center justify-center bg-ink px-4 text-white">
              <Icon name="search" />
            </button>
          </form>

          <nav aria-label="Account" className="flex flex-none items-center gap-2">
            {/* Phones reach Account from the bottom bar, so the header keeps only the cart */}
            <Link href="/account" aria-label="My account" className="hidden h-11 w-11 items-center justify-center rounded-[10px] hover:bg-bg md:flex">
              <Icon name="user" size={22} />
            </Link>
            <CartLink />
          </nav>
        </div>

        <nav id="catbar" aria-label="Product categories" className="hidden max-h-[calc(100dvh-140px)] overflow-y-auto border-t border-line md:block md:max-h-none md:overflow-visible [&.open]:block">
          <ul className="container-x flex flex-col overflow-x-auto whitespace-nowrap text-[15px] font-semibold md:flex-row md:text-sm">
            <li><Link href="/shop?sale=1" className="block border-b border-line px-1 py-3.5 font-extrabold text-accent md:border-0 md:p-3">Flash Deals</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link href={`/category/${c.slug}`} className="block border-b border-line px-1 py-3.5 hover:shadow-[inset_0_-3px_0_var(--color-ink)] md:border-0 md:p-3">{c.name}</Link></li>
            ))}
            <li><Link href="/repair" className="block px-1 py-3.5 font-extrabold text-green md:p-3">Repair &amp; Parts</Link></li>
          </ul>
        </nav>
      </header>
    </>
  );
}
