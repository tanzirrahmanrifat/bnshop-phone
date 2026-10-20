import Link from "next/link";
import { deleteBanner, saveBanner } from "@/app/admin/banners/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import type { Banner } from "@/lib/types";

export const dynamic = "force-dynamic";

function BannerForm({ b }: { b: Banner | null }) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-line py-4 last:border-0">
      <form action={saveBanner} className="flex flex-[999_1_600px] flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={b?.id ?? ""} />
        <label className="field w-32"><span className="label">Placement</span>
          <select className="input" name="placement" defaultValue={b?.placement ?? "side"}>
            <option value="side">Hero side card</option>
            <option value="promo">Promo card</option>
          </select>
        </label>
        <label className="field w-28"><span className="label">Colour</span>
          <select className="input" name="theme" defaultValue={b?.theme ?? "orange"}>
            <option value="orange">Orange</option><option value="green">Green</option><option value="blue">Blue</option><option value="dark">Dark</option>
          </select>
        </label>
        <label className="field w-36"><span className="label">Small label</span><input className="input" name="subtitle" defaultValue={b?.subtitle} placeholder="FLASH SALE" /></label>
        <label className="field w-64"><span className="label">Title</span><input className="input" name="title" defaultValue={b?.title} required /></label>
        <label className="field w-32"><span className="label">Button text</span><input className="input" name="cta_label" defaultValue={b?.cta_label} placeholder="Shop deals" /></label>
        <label className="field w-48"><span className="label">Link</span><input className="input" name="link" defaultValue={b?.link} placeholder="/shop?sale=1" /></label>
        <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={b?.sort ?? 0} /></label>
        {b && <label className="flex items-center gap-1 pb-3 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={b.active} /> Visible</label>}
        <SubmitButton className="btn btn-sm btn-dark">{b ? "Save" : "Add banner"}</SubmitButton>
      </form>
      {b && (
        <form action={deleteBanner}>
          <input type="hidden" name="id" value={b.id} />
          <SubmitButton className="btn btn-sm btn-outline" confirm="Delete this banner?">Delete</SubmitButton>
        </form>
      )}
    </div>
  );
}

export default async function BannersAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("banners").select("*").order("placement").order("sort");
  return (
    <>
      <h1 className="text-3xl font-extrabold">Homepage banners</h1>
      <p className="text-muted">The big hero text and image are in <Link href="/admin/settings" className="font-bold underline">Settings</Link>. Here you manage the two side cards next to the hero and the promo cards lower on the page. Without banners, default cards are shown.</p>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <section className="card p-5">
        {((data ?? []) as Banner[]).map((b) => <BannerForm key={b.id} b={b} />)}
        <BannerForm b={null} />
      </section>
    </>
  );
}
