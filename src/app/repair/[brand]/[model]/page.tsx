import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RepairBooking } from "@/components/RepairBooking";
import { RepairProgress } from "@/components/RepairSteps";
import { getDistricts, getRepairModel, getSettings } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 300;

type Props = { params: Promise<{ brand: string; model: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params;
  const found = await getRepairModel(brand, model);
  if (!found) return {};
  const names = found.services.slice(0, 3).map((s) => s.name.toLowerCase()).join(", ");
  return {
    title: `${found.model.name} repair price in Brunei`,
    description: `${found.model.name} ${names || "repair"} — see prices by part quality and book a walk-in or pickup.`,
    alternates: { canonical: `/repair/${found.brand.slug}/${found.model.slug}` },
  };
}

export default async function ModelPage({ params }: Props) {
  const { brand, model } = await params;
  const [found, districts, settings] = await Promise.all([getRepairModel(brand, model), getDistricts(), getSettings()]);
  if (!found) notFound();
  const wa = waLink(settings.whatsapp, `Hi, I need a repair quote for my ${found.model.name}.`);

  return (
    <main className="container-x flex flex-col gap-5 pb-16 pt-4 sm:gap-6 sm:pt-8">
      <RepairProgress step={3} brand={found.brand} model={found.model.name} />
      <div className="step-in flex flex-col gap-1">
        <h1 className="text-[clamp(26px,3.2vw,38px)] font-extrabold">{found.model.name} repairs</h1>
        <p className="text-muted">Select what needs fixing. Prices include parts and labour.</p>
      </div>
      {found.services.length === 0 ? (
        <div className="card flex flex-col gap-3 p-6">
          <p>Prices for this model are not online yet. Send us a message and we will quote you.</p>
          {wa && <a href={wa} target="_blank" rel="noopener" className="btn btn-green self-start">Ask on WhatsApp</a>}
          <Link href={`/repair/${found.brand.slug}`} className="font-bold text-green">← Change model</Link>
        </div>
      ) : (
        <RepairBooking
          brandSlug={found.brand.slug}
          model={found.model}
          services={found.services}
          prices={found.prices}
          districts={districts}
          hasWhatsapp={Boolean(wa)}
        />
      )}
    </main>
  );
}
