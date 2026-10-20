import Link from "next/link";
import { addModel, saveBrand, saveService } from "@/app/admin/repairs/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { BrandIcon } from "@/components/BrandIcon";
import { requireAdmin } from "@/lib/auth";
import type { RepairBrand, RepairModel, RepairService } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RepairCatalog({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: brands }, { data: models }, { data: services }, { data: prices }] = await Promise.all([
    supabase.from("repair_brands").select("*").order("sort").order("name"),
    supabase.from("repair_models").select("*").order("sort").order("name"),
    supabase.from("repair_services").select("*").order("sort").order("name"),
    supabase.from("repair_prices").select("model_id"),
  ]);
  const priced = new Map<string, number>();
  (prices ?? []).forEach((p) => priced.set(p.model_id as string, (priced.get(p.model_id as string) ?? 0) + 1));
  const B = (brands ?? []) as RepairBrand[];
  const M = (models ?? []) as RepairModel[];
  const S = (services ?? []) as RepairService[];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Repair brands, models & prices</h1>
      <AdminNotice saved={sp.saved} error={sp.error} />

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="text-lg font-extrabold">Models</h2>
        <p className="text-sm text-muted">Click a model to set its prices. Models without prices show “Ask on WhatsApp” on the site.</p>
        {B.map((b) => (
          <div key={b.id}>
            <h3 className="mb-2 font-extrabold">{b.name}</h3>
            <div className="flex flex-wrap gap-2">
              {M.filter((m) => m.brand_id === b.id).map((m) => (
                <Link key={m.id} href={`/admin/repairs/models/${m.id}`} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${m.active ? "border-line" : "border-dashed text-muted"}`}>
                  {m.name} <span className={priced.get(m.id) ? "text-green" : "text-accent"}>· {priced.get(m.id) ?? 0} prices</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <form action={addModel} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <label className="field w-44"><span className="label">Brand</span>
            <select className="input" name="brand_id" required>{B.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </label>
          <label className="field w-52"><span className="label">New model name</span><input className="input" name="name" required placeholder="iPhone 17 Pro" /></label>
          <label className="field w-44"><span className="label">Series label</span><input className="input" name="series" placeholder="iPhone 17 series" /></label>
          <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={0} /></label>
          <SubmitButton className="btn btn-sm btn-accent">Add model</SubmitButton>
        </form>
      </section>

      <section className="card flex flex-col gap-1 p-5">
        <h2 className="text-lg font-extrabold">Brands</h2>
        {[...B, null].map((b) => (
          <form key={b?.id ?? "new"} action={saveBrand} className="flex flex-wrap items-end gap-3 border-b border-line py-3 last:border-0">
            <input type="hidden" name="id" value={b?.id ?? ""} />
            {b && <BrandIcon name={b.name} image={b.image_url} size={44} />}
            <label className="field w-44"><span className="label">Name</span><input className="input" name="name" defaultValue={b?.name} required placeholder={b ? "" : "New brand…"} /></label>
            <label className="field w-36"><span className="label">Slug</span><input className="input" name="slug" defaultValue={b?.slug} placeholder="auto" /></label>
            <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={b?.sort ?? 0} /></label>
            <label className="field w-56"><span className="label">Icon / logo</span><input className="input pt-2.5" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
            {b?.image_url && <label className="flex items-center gap-1 pb-3 text-sm"><input type="checkbox" name="remove_image" /> Remove</label>}
            {b && <label className="flex items-center gap-1 pb-3 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={b.active} /> Visible</label>}
            <SubmitButton className="btn btn-sm btn-dark">{b ? "Save" : "Add brand"}</SubmitButton>
          </form>
        ))}
        <p className="pt-2 text-xs text-muted">Only upload brand logos you have permission to use.</p>
      </section>

      <section className="card flex flex-col gap-1 p-5">
        <h2 className="text-lg font-extrabold">Repair services</h2>
        {[...S, null].map((s) => (
          <form key={s?.id ?? "new"} action={saveService} className="flex flex-wrap items-end gap-3 border-b border-line py-3 last:border-0">
            <input type="hidden" name="id" value={s?.id ?? ""} />
            <label className="field w-48"><span className="label">Name</span><input className="input" name="name" defaultValue={s?.name} required placeholder={s ? "" : "New service…"} /></label>
            <label className="field w-72"><span className="label">Short description</span><input className="input" name="description" defaultValue={s?.description} /></label>
            <label className="field w-32"><span className="label">Typical time</span><input className="input" name="duration" defaultValue={s?.duration} placeholder="45 min" /></label>
            <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={s?.sort ?? 0} /></label>
            {s && <label className="flex items-center gap-1 pb-3 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={s.active} /> Active</label>}
            <SubmitButton className="btn btn-sm btn-dark">{s ? "Save" : "Add service"}</SubmitButton>
          </form>
        ))}
      </section>
    </>
  );
}
