import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS_LABEL, REPAIR_STATUS_LABEL, type OrderStatus, type RepairStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: profile }, { data: orders }, { data: repairs }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,email,role").eq("id", user.id).single(),
    supabase.from("orders").select("order_no,status,total,created_at,tracking_token").order("created_at", { ascending: false }).limit(50),
    supabase.from("repair_requests").select("code,status,model_name,services,estimate,needs_quote,created_at").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <main className="container-x flex flex-col gap-6 pb-16 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">My account</h1>
        <div className="flex gap-2">
          {profile?.role === "admin" && <Link href="/admin" className="btn btn-sm btn-dark">Admin panel</Link>}
          <form action="/auth/signout" method="post"><button type="submit" className="btn btn-sm btn-outline">Sign out</button></form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="text-lg font-extrabold">Your details</h2>
          <ProfileForm name={profile?.full_name ?? ""} phone={(profile?.phone ?? user.phone ?? "").replace(/^\+?673\s?/, "")} />
          {(profile?.email || user.email) && <p className="text-sm text-muted">Email: {profile?.email || user.email}</p>}
        </section>

        <div className="flex flex-col gap-6">
          <section className="card flex flex-col gap-3 p-6">
            <h2 className="text-lg font-extrabold">Orders</h2>
            {!orders?.length ? (
              <p className="text-muted">No orders yet. Orders placed while signed in appear here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((o) => (
                  <li key={o.order_no} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="flex flex-col">
                      <Link href={`/order/${o.tracking_token}`} className="font-extrabold">#{o.order_no}</Link>
                      <small className="text-muted">{formatDate(o.created_at)}</small>
                    </span>
                    <span className="text-sm font-bold">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
                    <strong>{money(o.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card flex flex-col gap-3 p-6">
            <h2 className="text-lg font-extrabold">Repairs</h2>
            {!repairs?.length ? (
              <p className="text-muted">No repairs yet. <Link href="/repair" className="font-bold text-green">Book a repair →</Link></p>
            ) : (
              <ul className="divide-y divide-line">
                {repairs.map((r) => (
                  <li key={r.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="flex flex-col">
                      <strong>{r.code} · {r.model_name}</strong>
                      <small className="text-muted">{(r.services as string[]).join(", ")} · {formatDate(r.created_at)}</small>
                    </span>
                    <span className="text-sm font-bold">{REPAIR_STATUS_LABEL[r.status as RepairStatus]}</span>
                    <strong>{money(r.estimate)}{r.needs_quote ? " + quote" : ""}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
