import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRepairRequest } from "@/app/admin/repairs/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { GRADES, REPAIR_STATUSES, REPAIR_STATUS_LABEL } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function AdminRepair({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const { data: r } = await supabase.from("repair_requests").select("*, district:districts(name)").eq("id", id).maybeSingle();
  if (!r) notFound();
  const wa = waLink(r.phone, `Hi ${r.name}, this is about your repair ${r.code} (${r.model_name}).`);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Repair {r.code}</h1>
        <Link href="/admin/repairs" className="btn btn-sm btn-outline">← All repairs</Link>
      </div>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <p><strong>{r.name}</strong><br />{r.phone}</p>
        <p>{r.brand_name} · <strong>{r.model_name}</strong><br />{(r.services as string[]).join(", ")}</p>
        <p>Part quality: {GRADES.find((g) => g.id === r.grade)?.label}<br />Estimate: <strong>{money(r.estimate)}{r.needs_quote ? " + quote" : ""}</strong></p>
        <p>{r.mode === "pickup" ? "Pickup & delivery" : "Walk in"} · {r.district?.name ?? r.district_code}<br /><span className="text-muted">Booked {formatDate(r.created_at)}</span></p>
        {r.note && <p className="rounded-xl bg-bg p-3 text-sm sm:col-span-2"><strong>Customer note:</strong> {r.note}</p>}
        <div className="flex gap-2 sm:col-span-2">
          {wa && <a href={wa} target="_blank" rel="noopener" className="btn btn-sm btn-green">WhatsApp customer</a>}
          <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="btn btn-sm btn-outline">Call</a>
        </div>
      </section>
      <form action={updateRepairRequest} className="card flex flex-col gap-4 p-5">
        <input type="hidden" name="id" value={r.id} />
        <label className="field max-w-xs"><span className="label">Status</span>
          <select className="input" name="status" defaultValue={r.status}>
            {REPAIR_STATUSES.map((s) => <option key={s} value={s}>{REPAIR_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Note shown to the customer on the tracking page</span>
          <textarea className="input" name="customer_note" defaultValue={r.customer_note} placeholder="e.g. Quote: B$ 120 (OEM screen, 6-month warranty). Reply on WhatsApp to approve." />
        </label>
        <SubmitButton className="btn btn-dark self-start">Save</SubmitButton>
      </form>
    </>
  );
}
