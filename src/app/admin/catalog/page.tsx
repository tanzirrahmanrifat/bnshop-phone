import { deleteTerm, saveTerm } from "@/app/admin/catalog/actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubmitButton } from "@/components/admin/AdminUI";
import { BrandIcon } from "@/components/BrandIcon";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Term = { id: string; name: string; slug: string; sort: number; image_url: string; description?: string; active?: boolean };

function TermRow({ term, table }: { term: Term | null; table: "categories" | "tags" }) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-line py-4 last:border-0">
      <form action={saveTerm} className="flex flex-[999_1_500px] flex-wrap items-end gap-3">
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={term?.id ?? ""} />
        {term && <BrandIcon name={term.name} image={term.image_url} size={44} />}
        <label className="field w-44"><span className="label">Name</span><input className="input" name="name" defaultValue={term?.name} required placeholder={term ? "" : "New…"} /></label>
        <label className="field w-40"><span className="label">Slug</span><input className="input" name="slug" defaultValue={term?.slug} placeholder="auto" /></label>
        <label className="field w-20"><span className="label">Order</span><input className="input" name="sort" type="number" defaultValue={term?.sort ?? 0} /></label>
        {table === "categories" && (
          <label className="field w-64"><span className="label">Short description (SEO)</span><input className="input" name="description" defaultValue={term?.description} /></label>
        )}
        <label className="field w-56"><span className="label">Icon / image</span><input className="input pt-2.5" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
        {term?.image_url && <label className="flex items-center gap-1 pb-3 text-sm"><input type="checkbox" name="remove_image" /> Remove image</label>}
        {table === "categories" && term && <label className="flex items-center gap-1 pb-3 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={term.active} /> Visible</label>}
        <SubmitButton className="btn btn-sm btn-dark">{term ? "Save" : "Add"}</SubmitButton>
      </form>
      {term && (
        <form action={deleteTerm}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={term.id} />
          <SubmitButton className="btn btn-sm btn-outline" confirm={`Delete ${term.name}?`}>Delete</SubmitButton>
        </form>
      )}
    </div>
  );
}

export default async function CatalogAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: cats }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("tags").select("*").order("sort"),
  ]);
  return (
    <>
      <h1 className="text-3xl font-extrabold">Categories & phone tags</h1>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <section className="card p-5">
        <h2 className="text-lg font-extrabold">Categories</h2>
        {((cats ?? []) as Term[]).map((t) => <TermRow key={t.id} term={t} table="categories" />)}
        <TermRow term={null} table="categories" />
      </section>
      <section className="card p-5">
        <h2 className="text-lg font-extrabold">“Shop by your phone” tags</h2>
        <p className="text-sm text-muted">Tick these on each product (“Fits these phones”). Upload a small icon, or leave empty for a phone icon with the first letter.</p>
        {((tags ?? []) as Term[]).map((t) => <TermRow key={t.id} term={t} table="tags" />)}
        <TermRow term={null} table="tags" />
      </section>
    </>
  );
}
