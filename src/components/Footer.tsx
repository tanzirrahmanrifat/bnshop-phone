import Link from "next/link";
import { Icon } from "@/components/Icon";
import { MobileNav } from "@/components/HeaderClient";
import type { Category, Settings } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const wa = waLink(settings.whatsapp);
  return (
    <>
      <footer className="mt-16 bg-ink text-sm text-[#c9d2df]">
        <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <p className="font-display text-xl font-extrabold text-white">{settings.shop_name}</p>
            <p>{settings.tagline}</p>
            {settings.address && <p className="whitespace-pre-line">{settings.address}</p>}
            {settings.hours && <p>{settings.hours}</p>}
            {settings.maps_url && <a href={settings.maps_url} target="_blank" rel="noopener" className="text-white">Get directions →</a>}
          </div>
          <nav aria-label="Shop" className="flex flex-col gap-1 sm:gap-2.5 [&_a]:py-1.5 sm:[&_a]:py-0">
            <p className="font-display font-extrabold text-white">Shop</p>
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>
            ))}
          </nav>
          <nav aria-label="Help" className="flex flex-col gap-1 sm:gap-2.5 [&_a]:py-1.5 sm:[&_a]:py-0">
            <p className="font-display font-extrabold text-white">Help</p>
            <Link href="/track">Track order or repair</Link>
            <Link href="/repair">Phone repair</Link>
            <Link href="/account">My account</Link>
          </nav>
          <div className="flex flex-col gap-2.5">
            <p className="font-display font-extrabold text-white">Contact</p>
            {settings.phone && <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>}
            {wa && <a href={wa} target="_blank" rel="noopener">WhatsApp {settings.whatsapp}</a>}
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          </div>
        </div>
        <div className="container-x flex flex-wrap items-center justify-between gap-3 border-t border-ink-3 py-5 text-[13px]">
          <span>© {new Date().getFullYear()} {settings.shop_name}</span>
          <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
            <li className="rounded-md border border-[#3a4b66] px-2.5 py-1.5 text-white">Cash on Delivery</li>
            <li className="rounded-md border border-[#3a4b66] px-2.5 py-1.5 text-white">Bank transfer</li>
          </ul>
        </div>
      </footer>

      {wa && (
        <a href={wa} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp" className="wa-float fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green text-white shadow-lg transition-[bottom] md:bottom-5">
          <Icon name="chat" size={26} />
        </a>
      )}

      <MobileNav />
    </>
  );
}
