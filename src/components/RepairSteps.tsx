import Link from "next/link";

export function RepairProgress({ step, brand, model }: { step: 1 | 2 | 3; brand?: { name: string; slug: string }; model?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Repair steps" className="grid grid-cols-3 gap-2 text-[13px] font-extrabold">
        {["1. Brand", "2. Model", "3. Repairs"].map((label, i) => (
          <li key={label} aria-current={i + 1 === step ? "step" : undefined} className={`flex flex-col gap-2 ${i < step ? "" : "text-subtle"}`}>
            <span className={`h-1.5 rounded ${i < step ? "bg-green" : "bg-[#d5dae1]"}`} />
            {label}
          </li>
        ))}
      </ol>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/repair#brands" className="inline-flex min-h-9 items-center font-extrabold text-green">All brands</Link>
        {brand && (<><span aria-hidden="true">/</span><Link href={`/repair/${brand.slug}`} className="inline-flex min-h-9 items-center font-extrabold text-green">{brand.name}</Link></>)}
        {model && (<><span aria-hidden="true">/</span><span>{model}</span></>)}
      </nav>
    </div>
  );
}
