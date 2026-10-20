import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, type RepairStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRepairs({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("repair_requests")
    .select("id,code,name,phone,model_name,services,estimate,needs_quote,mode,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.status && (REPAIR_STATUSES as readonly string[]).includes(sp.status)) query = query.eq("status", sp.status);
  const q = (sp.q ?? "").trim().toUpperCase();
  if (/^R-?\d+$/.test(q)) query = query.eq("code", q.startsWith("R-") ? q : `R-${q.slice(1)}`);
  else if (/\d{7}/.test(q.replace(/\D/g, ""))) query = query.ilike("phone", `%${q.replace(/\D/g, "").slice(-7)}%`);
  const { data } = await query;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold sm:text-3xl">Repair requests</h1>
        <Link href="/admin/repairs/catalog" className="btn btn-sm btn-outline">Brands, models & prices →</Link>
      </div>
      <div className="scroll-x -mx-4 flex gap-2 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/admin/repairs" className={`inline-flex min-h-10 flex-none items-center rounded-full px-3.5 text-sm font-bold ${!sp.status ? "bg-ink text-white" : "bg-white"}`}>All</Link>
        {REPAIR_STATUSES.map((s) => (
          <Link key={s} href={`/admin/repairs?status=${s}`} className={`inline-flex min-h-10 flex-none items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold ${sp.status === s ? "bg-ink text-white" : "bg-white"}`}>{REPAIR_STATUS_LABEL[s]}</Link>
        ))}
      </div>
      <form className="flex gap-2">
        <input className="input min-w-0 max-w-sm flex-1" type="search" name="q" defaultValue={sp.q} placeholder="Repair ID or phone" />
        <button className="btn btn-outline" type="submit">Search</button>
      </form>
      <ul className="flex flex-col gap-2 md:hidden">
        {(data ?? []).map((r) => (
          <li key={r.id}>
            <Link href={`/admin/repairs/${r.id}`} className="flex flex-col gap-1 rounded-2xl bg-white p-4">
              <span className="flex items-center justify-between gap-2">
                <strong>{r.code}</strong>
                <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-bold">{REPAIR_STATUS_LABEL[r.status as RepairStatus]}</span>
              </span>
              <span className="text-sm font-bold">{r.model_name}</span>
              <span className="text-[13px] text-muted">{(r.services as string[]).join(", ")}</span>
              <span className="flex items-center justify-between text-sm text-muted">
                <span>{r.name} · {r.mode === "pickup" ? "Pickup" : "Walk in"}</span>
                <strong className="text-ink">{Number(r.estimate) > 0 ? money(r.estimate) : "Quote"}{Number(r.estimate) > 0 && r.needs_quote ? " + quote" : ""}</strong>
              </span>
            </Link>
          </li>
        ))}
        {!data?.length && <li className="rounded-2xl bg-white p-6 text-muted">No repair requests found.</li>}
      </ul>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">ID</th><th className="p-3">Customer</th><th className="p-3">Phone & repairs</th><th className="p-3">Estimate</th><th className="p-3">Status</th><th className="p-3">Booked</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="p-3"><Link href={`/admin/repairs/${r.id}`} className="font-extrabold">{r.code}</Link></td>
                <td className="p-3">{r.name}<br /><span className="text-muted">{r.phone}</span></td>
                <td className="p-3">{r.model_name}<br /><span className="text-muted">{(r.services as string[]).join(", ")}</span></td>
                <td className="p-3">{money(r.estimate)}{r.needs_quote ? " + quote" : ""}</td>
                <td className="p-3">{REPAIR_STATUS_LABEL[r.status as RepairStatus]}<br /><span className="text-muted">{r.mode === "pickup" ? "Pickup" : "Walk in"}</span></td>
                <td className="p-3 text-muted">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <p className="p-6 text-muted">No repair requests found.</p>}
      </div>
    </>
  );
}
