"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useCartCount } from "@/lib/cart";

export function CartLink() {
  const count = useCartCount();
  return (
    <Link href="/cart" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-3.5 text-sm font-bold text-white">
      <Icon name="cart" />
      <span className="hidden sm:inline">Cart</span>
      <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold" aria-label={`${count} items in cart`}>
        {count}
      </span>
    </Link>
  );
}

export function MobileCategoryToggle() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const bar = document.getElementById("catbar");
    bar?.classList.toggle("open", open);
    const close = (e: Event) => {
      if ((e.target as HTMLElement).closest("a")) setOpen(false);
    };
    bar?.addEventListener("click", close);
    return () => bar?.removeEventListener("click", close);
  }, [open]);
  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-bg md:hidden"
      aria-controls="catbar"
      aria-expanded={open}
      aria-label={open ? "Close categories" : "Open categories"}
      onClick={() => setOpen((o) => !o)}
    >
      <Icon name={open ? "close" : "menu"} size={22} />
    </button>
  );
}

const TABS = [
  { href: "/", icon: "home", label: "Home", match: (p: string) => p === "/" },
  { href: "/shop", icon: "grid", label: "Shop", match: (p: string) => /^\/(shop|category|tag|product)/.test(p) },
  { href: "/repair", icon: "wrench", label: "Repair", match: (p: string) => p.startsWith("/repair") },
  { href: "/cart", icon: "cart", label: "Cart", match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout") },
  { href: "/account", icon: "user", label: "Account", match: (p: string) => /^\/(account|login|admin)/.test(p) },
] as const;

/** Bottom tab bar for phones. */
export function MobileNav() {
  const pathname = usePathname() || "/";
  const count = useCartCount();
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold ${active ? "text-accent" : "text-muted"}`}
          >
            {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-[3px] rounded-b bg-accent" />}
            <span className="relative">
              <Icon name={t.icon} size={22} />
              {t.href === "/cart" && count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
