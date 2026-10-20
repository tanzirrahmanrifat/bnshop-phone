"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

type Entry = { name: string; series: string; brand: string; href: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Search every model across brands; links straight to the price page. */
export function RepairSearch({ index }: { index: Entry[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const listId = useId();
  const term = norm(q);

  const results = useMemo(() => {
    if (!term) return [];
    const words = term.split(" ");
    return index
      .map((e) => ({ e, hay: norm(`${e.brand} ${e.name} ${e.series}`) }))
      .filter(({ hay }) => words.every((w) => hay.includes(w)))
      .slice(0, 8)
      .map(({ e }) => e);
  }, [index, term]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="repair-q" className="text-[15px] font-bold">Find your phone</label>
      <div className="flex overflow-hidden rounded-2xl bg-white ring-2 ring-transparent focus-within:ring-mint">
        <span className="flex items-center pl-4 text-muted"><Icon name="search" size={20} /></span>
        <input
          id="repair-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          enterKeyHint="search"
          autoComplete="off"
          aria-controls={listId}
          placeholder="e.g. iPhone 13, Galaxy S24, Redmi Note"
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-ink outline-none"
        />
      </div>
      <div id={listId} aria-live="polite">
        {term && results.length > 0 && (
          <ul className="mt-1 overflow-hidden rounded-2xl bg-white text-ink">
            {results.map((r) => (
              <li key={r.href} className="border-b border-line last:border-0">
                <Link href={r.href} className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-[#f1f4f9]">
                  <span className="text-green"><Icon name="phone" size={22} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate">{r.name}</strong>
                    <span className="text-[13px] text-muted">{r.brand}</span>
                  </span>
                  <span className="text-sm font-bold text-green">Prices</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {term && results.length === 0 && (
          <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-white p-4 text-ink">
            <p className="font-bold">“{q.trim()}” isn&apos;t in our price list yet.</p>
            <p className="text-sm text-muted">We still repair it. Tell us the problem and we&apos;ll send you a price.</p>
            <Link href={`/repair/request?model=${encodeURIComponent(q.trim())}`} className="btn btn-sm btn-green self-start">Ask for a quote</Link>
          </div>
        )}
      </div>
    </div>
  );
}
