"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/format";

function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, v)));
    next.delete("page");
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };
}

export function SortSelect({ value }: { value: string }) {
  const set = useSetParams();
  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <span className="sr-only sm:not-sr-only">Sort by</span>
      <select
        aria-label="Sort products"
        className="input !min-h-10 !w-auto"
        value={value}
        onChange={(e) => set({ sort: e.target.value === "popular" ? null : e.target.value })}
      >
        <option value="popular">Best selling</option>
        <option value="new">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </label>
  );
}

export function PriceFilter({ top, min, max }: { top: number; min: number; max: number }) {
  const set = useSetParams();
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max || top);
  const pct = (v: number) => `${(v / top) * 100}%`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm font-extrabold">
        <span>{money(lo)}</span>
        <span>{money(hi)}</span>
      </div>
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-4 h-1 rounded bg-line" />
        <div className="absolute top-4 h-1 rounded bg-accent" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
        <input
          className="range"
          type="range"
          min={0}
          max={top}
          step={1}
          value={lo}
          aria-label="Minimum price"
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
        />
        <input
          className="range"
          type="range"
          min={0}
          max={top}
          step={1}
          value={hi}
          aria-label="Maximum price"
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-sm btn-dark" onClick={() => set({ min: lo > 0 ? String(lo) : null, max: hi < top ? String(hi) : null })}>
          Apply
        </button>
        {(min > 0 || (max > 0 && max < top)) && (
          <button
            type="button"
            className="min-h-10 px-2 text-sm font-bold text-accent"
            onClick={() => {
              setLo(0);
              setHi(top);
              set({ min: null, max: null });
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
