import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { getDistricts, getRepairBrands, getSettings } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Ask for a repair quote",
  description: "Phone or problem not listed? Tell us the model and what's wrong, and we'll send you a repair price.",
  alternates: { canonical: "/repair/request" },
};

type Props = { searchParams: Promise<{ brand?: string; model?: string }> };

export default async function QuoteRequestPage({ searchParams }: Props) {
  const [sp, brands, districts, settings] = await Promise.all([searchParams, getRepairBrands(), getDistricts(), getSettings()]);
  const clip = (v: string | undefined, n: number) => (v ?? "").slice(0, n);
  return (
    <main className="container-x flex flex-col gap-5 pb-16 pt-4 sm:gap-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/repair" className="inline-flex min-h-9 items-center gap-1 font-extrabold text-green"><Icon name="arrowLeft" size={16} />Repair</Link>
        <span aria-hidden="true">/</span>
        <span>Ask for a quote</span>
      </nav>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[clamp(26px,3.4vw,38px)] font-extrabold leading-tight">Tell us what&apos;s wrong. We&apos;ll send you a price.</h1>
        <p className="max-w-2xl text-muted">For any phone, tablet or smartwatch, including models that aren&apos;t in our price list.</p>
      </div>
      <QuoteRequestForm
        brands={brands.map((b) => b.name)}
        districts={districts}
        defaults={{ brand: clip(sp.brand, 60), model: clip(sp.model, 80) }}
        hasWhatsapp={Boolean(waLink(settings.whatsapp))}
      />
    </main>
  );
}
