import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getDistricts, getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [districts, settings, supabase] = await Promise.all([getDistricts(), getSettings(), createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let defaults = { name: "", phone: "", email: "" };
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name,phone,email").eq("id", user.id).single();
    defaults = {
      name: profile?.full_name ?? "",
      phone: (profile?.phone ?? user.phone ?? "").replace(/^\+?673/, ""),
      email: profile?.email ?? user.email ?? "",
    };
  }
  return (
    <main className="container-x pb-16 pt-4 sm:pt-7">
      <CheckoutForm
        districts={districts}
        freeDeliveryMin={Number(settings.free_delivery_min)}
        bankDetails={settings.bank_details}
        defaults={defaults}
      />
    </main>
  );
}
