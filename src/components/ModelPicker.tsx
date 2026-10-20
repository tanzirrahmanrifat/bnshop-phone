"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { RepairBrand, RepairModel } from "@/lib/types";

export function ModelPicker({ brand, models }: { brand: RepairBrand; models: RepairModel[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = term ? models.filter((m) => m.name.toLowerCase().includes(term)) : models;
  return (
    <section aria-labelledby="m-h" className="step-in flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="m-h" className="text-[clamp(26px,3.4vw,38px)] font-extrabold">Choose your {brand.name} model</h1>
          <p className="text-muted">Not sure? It&apos;s in Settings → About phone.</p>
        </div>
        <label className="field w-full sm:w-80">
          <span className="label">Search models</span>
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 15 Pro" />
        </label>
      </div>
      {shown.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id}>
              <Link href={`/repair/${brand.slug}/${m.slug}`} className="flex h-full items-center gap-2.5 rounded-2xl border border-line bg-white p-3 transition hover:border-ink hover:shadow-[0_8px_20px_rgba(11,27,51,.08)] sm:p-4">
                <span className="hidden text-green min-[380px]:block"><Icon name="phone" size={24} /></span>
                <span className="flex min-w-0 flex-col">
                  <strong className="text-[15px] leading-snug">{m.name}</strong>
                  {m.series && <small className="truncate text-xs text-muted">{m.series}</small>}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/repair/request?brand=${encodeURIComponent(brand.name)}${q ? `&model=${encodeURIComponent(q.trim())}` : ""}`} className="flex h-full items-center gap-2.5 rounded-2xl border-2 border-dashed border-[#c9cfd8] p-3 transition hover:border-green sm:p-4">
              <span className="text-green"><Icon name="plus" size={22} /></span>
              <span className="flex flex-col">
                <strong className="text-[15px] leading-snug">Not listed?</strong>
                <small className="text-xs text-muted">Ask for a quote</small>
              </span>
            </Link>
          </li>
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white p-5">
          <p className="text-muted">No {brand.name} model matches “{q}”. We can still repair it.</p>
          <Link href={`/repair/request?brand=${encodeURIComponent(brand.name)}&model=${encodeURIComponent(q.trim())}`} className="btn btn-sm btn-green">Ask for a quote</Link>
        </div>
      )}
      <Link href="/repair#brands" className="btn btn-outline self-start"><Icon name="arrowLeft" size={18} />Change brand</Link>
    </section>
  );
}
