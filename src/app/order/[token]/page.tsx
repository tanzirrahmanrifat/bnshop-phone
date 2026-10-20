import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { Steps } from "@/components/Choice";
import { Icon } from "@/components/Icon";
import { getSettings } from "@/lib/data";
import { money, formatDate } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/admin";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

type OrderView = {
  order_no: number;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  landmark: string;
  payment_method: "cod" | "bank";
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { name: string; variant_label: string; qty: number; unit_price: number; line_total: number }[];
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const [{ data }, settings] = await Promise.all([
    createServiceClient().rpc("get_order_by_token", { p_token: token }),
    getSettings(),
  ]);
  const order = data as OrderView | null;
  if (!order) notFound();

  const steps = ORDER_STATUSES.filter((s) => s !== "cancelled");
  const current = steps.indexOf(order.status as (typeof steps)[number]);
  const wa = waLink(settings.whatsapp, `Hi, about my order #${order.order_no}`);

  return (
    <main className="container-x flex max-w-[960px] flex-col gap-5 pb-16 pt-4 sm:pt-8">
      {sp.new === "1" && <ClearCart />}
      {sp.new === "1" && <Steps steps={["Cart", "Delivery details", "Done"]} current={4} />}
      <section className="card flex flex-col items-center gap-3.5 px-5 py-8 text-center sm:p-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-green"><Icon name="check" size={32} /></span>
        <h1 className="text-[26px] font-extrabold leading-tight sm:text-3xl">{sp.new === "1" ? "Thank you, your order is placed" : `Order #${order.order_no}`}</h1>
        <p className="max-w-xl leading-relaxed text-muted">
          Order <strong className="text-ink">#{order.order_no}</strong>. We&apos;ll call or WhatsApp you on {order.phone} to confirm before dispatch.
          {order.payment_method === "cod" ? ` Pay ${money(order.total)} in cash when it arrives.` : " We will send bank details when we confirm."}
        </p>
        <div className="flex w-full flex-col justify-center gap-2.5 sm:w-auto sm:flex-row">
          {wa && <a href={wa} target="_blank" rel="noopener" className="btn btn-green"><Icon name="chat" size={18} />Chat about this order</a>}
          <Link href="/shop" className="btn btn-outline">Keep shopping</Link>
        </div>
        <p className="text-[13px] text-muted">Bookmark this page to check your order status later.</p>
      </section>

      <section aria-labelledby="st-h" className="card flex flex-col gap-5 p-5 sm:p-6">
        <h2 id="st-h" className="text-xl font-extrabold">Order status</h2>
        {order.status === "cancelled" ? (
          <p className="alert alert-error">This order was cancelled. Message us if you have questions.</p>
        ) : (
          <ol className="flex flex-col gap-0 sm:grid sm:grid-cols-5 sm:gap-3">
            {steps.map((s, i) => (
              <li key={s} aria-current={i === current ? "step" : undefined} className={`relative flex items-center gap-3 border-l-4 py-2 pl-4 sm:flex-col sm:items-start sm:gap-1 sm:border-l-0 sm:border-t-4 sm:py-0 sm:pl-0 sm:pt-3 ${i <= current ? "border-green" : "border-[#d5dae1]"}`}>
                <strong className={i <= current ? "" : "text-muted"}>{ORDER_STATUS_LABEL[s]}</strong>
                {i === current && <span className="rounded-full bg-green-soft px-2 py-0.5 text-xs font-bold text-green">Now</span>}
              </li>
            ))}
          </ol>
        )}
        <p className="text-sm text-muted">Placed {formatDate(order.created_at)}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card flex flex-col gap-2 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Delivery to</h2>
          <p className="leading-relaxed">
            {order.customer_name}<br />{order.address}<br />{order.area}, {order.district}
            {order.landmark && (<><br /><span className="text-muted">{order.landmark}</span></>)}
          </p>
          <p className="text-sm"><strong>Payment:</strong> {order.payment_method === "cod" ? "Cash on Delivery" : "Bank transfer"}</p>
        </section>
        <section className="card flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Items</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span>{i.name}{i.variant_label && ` · ${i.variant_label}`} × {i.qty}</span>
                <strong>{money(i.line_total)}</strong>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-line pt-2"><span>Delivery</span><strong>{Number(order.delivery_fee) === 0 ? "Free" : money(order.delivery_fee)}</strong></li>
            <li className="flex justify-between gap-3"><strong>Total</strong><strong>{money(order.total)}</strong></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
