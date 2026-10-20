import Image from "next/image";
import { saveDistricts, saveSettings } from "@/app/admin/settings/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth";
import type { District, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

function Field({ name, label, s, textarea, placeholder, help }: { name: keyof Settings; label: string; s: Settings; textarea?: boolean; placeholder?: string; help?: string }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {textarea ? (
        <textarea className="input" name={name} defaultValue={String(s[name] ?? "")} placeholder={placeholder} />
      ) : (
        <input className="input" name={name} defaultValue={String(s[name] ?? "")} placeholder={placeholder} />
      )}
      {help && <small className="text-xs text-muted">{help}</small>}
    </label>
  );
}

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: settings }, { data: districts }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("districts").select("*").order("sort"),
  ]);
  const s = settings as Settings & { hero_image: string };

  return (
    <>
      <h1 className="text-3xl font-extrabold">Settings & delivery</h1>
      <AdminNotice saved={sp.saved} error={sp.error} />

      <form action={saveSettings} className="flex flex-col gap-5">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-extrabold sm:col-span-2">Shop & contact</h2>
          <Field s={s} name="shop_name" label="Shop name *" />
          <Field s={s} name="tagline" label="Tagline" />
          <Field s={s} name="whatsapp" label="WhatsApp number" placeholder="+673 7123456" help="Used by every WhatsApp button. Include +673." />
          <Field s={s} name="phone" label="Phone number" placeholder="+673 …" />
          <Field s={s} name="email" label="Email" />
          <Field s={s} name="hours" label="Opening hours" placeholder="Mon–Sat 10:00–21:00" />
          <Field s={s} name="address" label="Store address" textarea />
          <Field s={s} name="maps_url" label="Google Maps link" placeholder="https://maps.app.goo.gl/…" />
          <Field s={s} name="topbar" label="Top bar message" />
          <Field s={s} name="bank_details" label="Bank transfer details (shown at checkout)" textarea placeholder="Bank, account name, account number" />
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-extrabold sm:col-span-2">Homepage hero</h2>
          <Field s={s} name="hero_badge" label="Badge" />
          <Field s={s} name="hero_title" label="Title" />
          <div className="sm:col-span-2"><Field s={s} name="hero_text" label="Text" textarea /></div>
          <label className="field"><span className="label">Hero image (1200×800)</span><input className="input pt-2.5" type="file" name="hero_image_file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
          {s.hero_image && (
            <div className="flex items-end gap-3">
              <span className="relative h-20 w-32 overflow-hidden rounded-xl bg-bg"><Image src={s.hero_image} alt="" fill sizes="128px" className="object-cover" /></span>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="remove_hero" /> Remove</label>
            </div>
          )}
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-extrabold sm:col-span-2">Product page & checkout</h2>
          <Field s={s} name="delivery_note" label="Delivery line" placeholder="Brunei-Muara next day · other districts 2–3 days" />
          <Field s={s} name="warranty_note" label="Warranty line" placeholder="6-month warranty · 7-day exchange if faulty" />
          <label className="field"><span className="label">Free delivery from (B$, 0 = off)</span><input className="input" type="number" min="0" step="0.01" name="free_delivery_min" defaultValue={s.free_delivery_min} /></label>
        </section>
        <SubmitButton className="btn btn-accent self-start">Save settings</SubmitButton>
      </form>

      <form action={saveDistricts} className="card flex flex-col gap-3 p-5">
        <h2 className="text-lg font-extrabold">Delivery fees by district</h2>
        <div className="hidden grid-cols-[10rem_8rem_1fr_6rem] gap-3 px-1 text-sm font-bold text-muted sm:grid">
          <span>District</span><span>Fee (B$)</span><span>Delivery time</span><span>Deliver here</span>
        </div>
        <ul className="divide-y divide-line">
          {((districts ?? []) as District[]).map((d) => (
            <li key={d.code} className="grid grid-cols-2 items-end gap-2 py-3 sm:grid-cols-[10rem_8rem_1fr_6rem] sm:items-center sm:gap-3">
              <span className="font-bold"><input type="hidden" name="code" value={d.code} />{d.name}</span>
              <label className="flex items-center justify-end gap-2 text-sm font-bold sm:order-last sm:justify-start">
                <input type="checkbox" name={`active_${d.code}`} defaultChecked={d.active} className="h-5 w-5" /> <span className="sm:sr-only">Deliver here</span>
              </label>
              <label className="flex flex-col gap-1"><span className="text-xs font-bold text-muted sm:sr-only">Fee (B$)</span>
                <input className="input !min-h-11" type="number" inputMode="decimal" min="0" step="0.01" name={`fee_${d.code}`} defaultValue={d.fee} required />
              </label>
              <label className="flex flex-col gap-1"><span className="text-xs font-bold text-muted sm:sr-only">Delivery time</span>
                <input className="input !min-h-11" name={`eta_${d.code}`} defaultValue={d.eta} placeholder="1–2 days" />
              </label>
            </li>
          ))}
        </ul>
        <SubmitButton className="btn btn-dark self-start">Save delivery fees</SubmitButton>
      </form>
    </>
  );
}
