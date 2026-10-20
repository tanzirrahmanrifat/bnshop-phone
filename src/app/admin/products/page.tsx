import Link from "next/link";
import Image from "next/image";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase.from("product_list").select("id,name,slug,price,effective_price,stock,images,active,in_stock").order("created_at", { ascending: false }).limit(200);
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data: products } = await query;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold sm:text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn btn-accent">+ New product</Link>
      </div>
      <AdminNotice saved={sp.saved} error={sp.error} />
      <form className="flex gap-2">
        <input className="input min-w-0 max-w-sm flex-1" type="search" name="q" defaultValue={sp.q} placeholder="Search by name" />
        <button className="btn btn-outline" type="submit">Search</button>
      </form>
      <ul className="flex flex-col gap-2 md:hidden">
        {(products ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3">
              <span className="relative h-14 w-14 flex-none overflow-hidden rounded-xl bg-bg">
                {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate">{p.name}</strong>
                <span className="text-sm">{money(p.effective_price)}{Number(p.effective_price) < Number(p.price) && <s className="ml-1 text-subtle">{money(p.price)}</s>}</span>
                <span className="text-[13px] text-muted">{p.in_stock ? `Stock ${p.stock}` : "Out of stock"} · {p.active ? "Visible" : "Hidden"}</span>
              </span>
            </Link>
          </li>
        ))}
        {!products?.length && <li className="rounded-2xl bg-white p-6 text-muted">No products yet.</li>}
      </ul>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-bold">
                    <span className="relative h-10 w-10 flex-none overflow-hidden rounded-lg bg-bg">
                      {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    {p.name}
                  </Link>
                </td>
                <td className="p-3">{money(p.effective_price)}{Number(p.effective_price) < Number(p.price) && <s className="ml-1 text-subtle">{money(p.price)}</s>}</td>
                <td className="p-3">{p.in_stock ? p.stock : <span className="font-bold text-accent">Out</span>}</td>
                <td className="p-3">{p.active ? "Visible" : <span className="text-muted">Hidden</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products?.length && <p className="p-6 text-muted">No products yet.</p>}
      </div>
    </>
  );
}
