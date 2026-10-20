import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  // Start of today in Brunei (UTC+8, no daylight saving).
  const bn = new Date(Date.now() + 8 * 3600 * 1000);
  bn.setUTCHours(0, 0, 0, 0);
  const today = new Date(bn.getTime() - 8 * 3600 * 1000);
  const [pending, todays, repairs, lowStock, recent] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("total").gte("created_at", today.toISOString()).neq("status", "cancelled"),
    supabase.from("repair_requests").select("id", { count: "exact", head: true }).eq("status", "received"),
    supabase.from("products").select("id,name,stock").eq("active", true).lte("stock", 3).order("stock").limit(8),
    supabase.from("orders").select("id,order_no,customer_name,total,status,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const todayTotal = (todays.data ?? []).reduce((s, o) => s + Number(o.total), 0);

  const tiles = [
    { label: "New orders to confirm", value: String(pending.count ?? 0), href: "/admin/orders?status=pending" },
    { label: "Orders today", value: `${todays.data?.length ?? 0} · ${money(todayTotal)}`, href: "/admin/orders" },
    { label: "New repair requests", value: String(repairs.count ?? 0), href: "/admin/repairs?status=received" },
  ];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card flex flex-col gap-1 p-5">
            <span className="text-sm text-muted">{t.label}</span>
            <strong className="font-display text-2xl">{t.value}</strong>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-extrabold">Latest orders</h2>
          <ul className="divide-y divide-line text-sm">
            {(recent.data ?? []).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/orders/${o.id}`} className="font-bold">#{o.order_no} · {o.customer_name}</Link>
                <span className="text-muted">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
                <span>{money(o.total)}</span>
                <span className="hidden text-muted sm:inline">{formatDate(o.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-extrabold">Low stock (3 or fewer)</h2>
          {lowStock.data?.length ? (
            <ul className="divide-y divide-line text-sm">
              {lowStock.data.map((p) => (
                <li key={p.id} className="flex justify-between py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="font-bold">{p.name}</Link>
                  <span>{p.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Nothing low. (Products with variants track stock per option.)</p>
          )}
        </section>
      </div>
    </>
  );
}
