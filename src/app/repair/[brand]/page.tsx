import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModelPicker } from "@/components/ModelPicker";
import { RepairProgress } from "@/components/RepairSteps";
import { getRepairBrand } from "@/lib/data";

export const revalidate = 300;

type Props = { params: Promise<{ brand: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const found = await getRepairBrand(brand);
  if (!found) return {};
  return {
    title: `${found.brand.name} repair in Brunei — choose your model`,
    description: `Screen, battery and charging port repair for ${found.brand.name}. Choose your model to see prices.`,
    alternates: { canonical: `/repair/${found.brand.slug}` },
  };
}

export default async function BrandPage({ params }: Props) {
  const { brand } = await params;
  const found = await getRepairBrand(brand);
  if (!found) notFound();
  return (
    <main className="container-x flex flex-col gap-5 pb-16 pt-4 sm:gap-6 sm:pt-8">
      <RepairProgress step={2} brand={found.brand} />
      <ModelPicker brand={found.brand} models={found.models} />
    </main>
  );
}
