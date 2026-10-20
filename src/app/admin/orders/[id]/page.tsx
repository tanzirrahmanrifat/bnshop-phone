import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrder } from "@/app/admin/orders/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const [{ data: o }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*, district:districts(name)").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("id"),
  ]);
  if (!o) notFound();
  const wa = waLink(o.phone, `Hi ${o.customer_name}, this is about your order #${o.order_no}.`);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Order #{o.order_no}</h1>
        <Link href="/admin/orders" className="btn btn-sm btn-outline">← All orders</Link>
      </div>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card flex flex-col gap-2 p-5">
          <h2 className="text-lg font-extrabold">Customer</h2>
          <p><strong>{o.customer_name}</strong><br />{o.phone}{o.email && <><br />{o.email}</>}</p>
          <p>{o.address}<br />{o.area}, {o.district?.name ?? o.district_code}{o.landmark && <><br /><em>{o.landmark}</em></>}</p>
          {o.note && <p className="rounded-xl bg-bg p-3 text-sm"><strong>Note:</strong> {o.note}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {wa && <a href={wa} target="_blank" rel="noopener" className="btn btn-sm btn-green">WhatsApp customer</a>}
            <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className="btn btn-sm btn-outline">Call</a>
          </div>
          <p className="text-sm text-muted">Placed {formatDate(o.created_at)} · {o.payment_method === "cod" ? "Cash on Delivery" : "Bank transfer"}</p>
        </section>
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="text-lg font-extrabold">Items</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {(items ?? []).map((i) => (
              <li key={i.id} className="flex justify-between gap-3"><span>{i.name}{i.variant_label && ` · ${i.variant_label}`} × {i.qty} <span className="text-muted">@ {money(i.unit_price)}</span></span><strong>{money(i.line_total)}</strong></li>
            ))}
            <li className="flex justify-between border-t border-line pt-2"><span>Subtotal</span><span>{money(o.subtotal)}</span></li>
            <li className="flex justify-between"><span>Delivery</span><span>{money(o.delivery_fee)}</span></li>
            <li className="flex justify-between text-base"><strong>Total</strong><strong>{money(o.total)}</strong></li>
          </ul>
        </section>
      </div>
      <form action={updateOrder} className="card flex flex-col gap-4 p-5">
        <input type="hidden" name="id" value={o.id} />
        <h2 className="text-lg font-extrabold">Update</h2>
        <label className="field max-w-xs"><span className="label">Status</span>
          <select className="input" name="status" defaultValue={o.status}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Internal note</span><textarea className="input" name="admin_note" defaultValue={o.admin_note} /></label>
        <p className="text-sm text-muted">Setting status to Cancelled returns the items to stock. The customer sees the status on their order page and tracking page.</p>
        <SubmitButton className="btn btn-dark self-start">Save</SubmitButton>
      </form>
    </>
  );
}
