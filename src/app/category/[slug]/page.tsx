import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, type ListingParams } from "@/components/ProductListing";
import { getCategories } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return {
    title: `${cat.name} in Brunei`,
    description: cat.description || `${cat.name} for iPhone, Samsung and Android. Cash on delivery across Brunei.`,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  return <ProductListing title={cat.name} intro={cat.description} params={sp} basePath={`/category/${cat.slug}`} categoryId={cat.id} />;
}
