import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteModel, saveModel } from "@/app/admin/repairs/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import { GRADES, type RepairService } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ModelAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const [{ data: model }, { data: services }, { data: prices }] = await Promise.all([
    supabase.from("repair_models").select("*, brand:repair_brands(name,slug)").eq("id", id).maybeSingle(),
    supabase.from("repair_services").select("*").order("sort").order("name"),
    supabase.from("repair_prices").select("service_id,grade,price").eq("model_id", id),
  ]);
  if (!model) notFound();
  const price = new Map((prices ?? []).map((p) => [`${p.service_id}__${p.grade}`, p.price as number]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold leading-tight sm:text-3xl">{model.brand?.name} {model.name}</h1>
        <div className="flex gap-2">
          <Link href={`/repair/${model.brand?.slug}/${model.slug}`} target="_blank" className="btn btn-sm btn-outline">View on site</Link>
          <Link href="/admin/repairs/catalog" className="btn btn-sm btn-outline">← Catalog</Link>
        </div>
      </div>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <form action={saveModel} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={model.id} />
        <section className="card flex flex-wrap items-end gap-3 p-4 sm:p-5">
          <label className="field w-56"><span className="label">Model name</span><input className="input" name="name" defaultValue={model.name} required /></label>
          <label className="field w-48"><span className="label">Slug</span><input className="input" name="slug" defaultValue={model.slug} /></label>
          <label className="field w-48"><span className="label">Series label</span><input className="input" name="series" defaultValue={model.series} /></label>
          <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={model.sort} /></label>
          <label className="flex items-center gap-2 pb-3 font-bold"><input type="checkbox" name="active" defaultChecked={model.active} /> Visible</label>
        </section>
        <section className="card p-4 sm:p-5">
          <h2 className="mb-1 text-lg font-extrabold">Prices (B$, parts + labour)</h2>
          <p className="mb-3 text-sm text-muted">Leave a box empty if you don&apos;t offer that repair or part grade for this model.</p>
          <div className="hidden grid-cols-[1fr_repeat(3,8.5rem)] gap-3 px-1 pb-1 text-sm font-bold text-muted sm:grid">
            <span>Repair</span>{GRADES.map((g) => <span key={g.id}>{g.label}</span>)}
          </div>
          <ul className="divide-y divide-line">
            {((services ?? []) as RepairService[]).map((s) => (
              <li key={s.id} className={`grid grid-cols-3 items-center gap-2 py-3 sm:grid-cols-[1fr_repeat(3,8.5rem)] sm:gap-3 ${s.active ? "" : "opacity-60"}`}>
                <span className="col-span-3 font-bold sm:col-span-1">{s.name}</span>
                {GRADES.map((g) => (
                  <label key={g.id} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-muted sm:sr-only">{g.label}</span>
                    <input className="input !min-h-11" type="number" inputMode="decimal" min="0" step="0.01" name={`price__${s.id}__${g.id}`} defaultValue={price.get(`${s.id}__${g.id}`) ?? ""} aria-label={`${s.name} ${g.label} price`} placeholder="—" />
                  </label>
                ))}
              </li>
            ))}
          </ul>
        </section>
        <SubmitButton className="btn btn-accent self-start">Save model & prices</SubmitButton>
      </form>
      <form action={deleteModel} className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <input type="hidden" name="id" value={model.id} />
        <p className="text-sm text-muted">Deleting removes the model and its prices. Past repair requests keep the model name.</p>
        <SubmitButton className="btn btn-danger" confirm="Delete this model and its prices?">Delete model</SubmitButton>
      </form>
    </>
  );
}
