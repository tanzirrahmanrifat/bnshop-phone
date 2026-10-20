import type { Metadata } from "next";
import { ProductListing, type ListingParams } from "@/components/ProductListing";

export const metadata: Metadata = {
  title: "Shop phone accessories",
  description: "Cases, screen protectors, chargers, cables and power banks with cash on delivery across Brunei.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ListingParams> }) {
  const params = await searchParams;
  return (
    <ProductListing
      title={params.sale === "1" ? "Flash deals" : params.q ? "Search results" : "All products"}
      params={params}
      basePath="/shop"
    />
  );
}
