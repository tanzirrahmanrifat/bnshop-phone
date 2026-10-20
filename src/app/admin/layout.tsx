import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products"],
  ["/admin/catalog", "Categories & tags"],
  ["/admin/banners", "Banners"],
  ["/admin/repairs", "Repair requests"],
  ["/admin/repairs/catalog", "Repair brands, models & prices"],
  ["/admin/settings", "Settings & delivery"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-x admin-area flex flex-col items-start gap-4 pb-16 pt-3 lg:flex-row lg:gap-6 lg:pt-6">
      <nav aria-label="Admin" className="w-full lg:sticky lg:top-36 lg:w-60 lg:flex-none lg:rounded-2xl lg:bg-white lg:p-3">
        <p className="hidden px-3 pb-2 pt-1 text-sm font-extrabold text-muted lg:block">Admin</p>
        <ul className="scroll-x -mx-4 flex gap-1.5 px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {NAV.map(([href, label]) => (
            <li key={href} className="flex-none">
              <Link href={href} className="flex min-h-10 items-center whitespace-nowrap rounded-full bg-white px-3.5 text-sm font-bold hover:bg-bg lg:rounded-lg lg:bg-transparent lg:px-3">{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-5">{children}</div>
    </div>
  );
}
