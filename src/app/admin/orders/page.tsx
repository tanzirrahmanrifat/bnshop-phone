import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("orders")
    .select("id,order_no,customer_name,phone,district_code,total,status,payment_method,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status)) query = query.eq("status", sp.status);
  const q = (sp.q ?? "").trim();
  if (/^\d{6,}$/.test(q)) query = query.eq("order_no", Number(q));
  else if (/^\+?[\d\s-]{7,}$/.test(q)) query = query.ilike("phone", `%${q.replace(/\D/g, "").slice(-7)}%`);
  else if (q) query = query.ilike("customer_name", `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data: orders } = await query;

  return (
    <>
      <h1 className="text-[28px] font-extrabold sm:text-3xl">Orders</h1>
      <div className="scroll-x -mx-4 flex gap-2 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/admin/orders" className={`inline-flex min-h-10 flex-none items-center rounded-full px-3.5 text-sm font-bold ${!sp.status ? "bg-ink text-white" : "bg-white"}`}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`inline-flex min-h-10 flex-none items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold ${sp.status === s ? "bg-ink text-white" : "bg-white"}`}>{ORDER_STATUS_LABEL[s]}</Link>
        ))}
      </div>
      <form className="flex gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input className="input min-w-0 max-w-sm flex-1" type="search" name="q" defaultValue={sp.q} placeholder="Order no., phone or name" />
        <button className="btn btn-outline" type="submit">Search</button>
      </form>
      <ul className="flex flex-col gap-2 md:hidden">
        {(orders ?? []).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="flex flex-col gap-1 rounded-2xl bg-white p-4">
              <span className="flex items-center justify-between gap-2">
                <strong>#{o.order_no}</strong>
                <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-bold">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
              </span>
              <span className="text-sm">{o.customer_name} · {o.phone}</span>
              <span className="flex items-center justify-between text-sm text-muted">
                <span>{o.district_code} · {o.payment_method === "cod" ? "COD" : "Bank"} · {formatDate(o.created_at)}</span>
                <strong className="text-ink">{money(o.total)}</strong>
              </span>
            </Link>
          </li>
        ))}
        {!orders?.length && <li className="rounded-2xl bg-white p-6 text-muted">No orders found.</li>}
      </ul>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">District</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(orders ?? []).map((o) => (
              <tr key={o.id}>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-extrabold">#{o.order_no}</Link></td>
                <td className="p-3">{o.customer_name}<br /><span className="text-muted">{o.phone}</span></td>
                <td className="p-3">{o.district_code}</td>
                <td className="p-3 font-bold">{money(o.total)}</td>
                <td className="p-3 uppercase">{o.payment_method}</td>
                <td className="p-3">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</td>
                <td className="p-3 text-muted">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders?.length && <p className="p-6 text-muted">No orders found.</p>}
      </div>
    </>
  );
}
