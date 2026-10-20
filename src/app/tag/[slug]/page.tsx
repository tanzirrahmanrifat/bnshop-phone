import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, type ListingParams } from "@/components/ProductListing";
import { getTags } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await getTags()).find((t) => t.slug === slug);
  if (!tag) return {};
  return {
    title: `${tag.name} accessories in Brunei`,
    description: `Cases, screen protectors and chargers for ${tag.name}. Cash on delivery across Brunei.`,
    alternates: { canonical: `/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const tag = (await getTags()).find((t) => t.slug === slug);
  if (!tag) notFound();
  return <ProductListing title={`${tag.name} accessories`} params={sp} basePath={`/tag/${tag.slug}`} tagId={tag.id} />;
}
