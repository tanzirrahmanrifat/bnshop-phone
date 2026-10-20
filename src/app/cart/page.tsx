import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <main className="container-x pb-16 pt-4 sm:pt-7">
      <CartView whatsapp={settings.whatsapp} freeDeliveryMin={Number(settings.free_delivery_min)} />
    </main>
  );
}
