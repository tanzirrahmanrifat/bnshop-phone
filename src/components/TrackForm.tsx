"use client";

import Link from "next/link";
import { useActionState } from "react";
import { track, type TrackState } from "@/app/track/actions";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS_LABEL, REPAIR_STATUS_LABEL, type OrderStatus, type RepairStatus } from "@/lib/types";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(track, {});
  const r = state.result;
  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="field"><span className="label">Order number or repair ID</span>
          <input className="input" name="ref" required placeholder="100123 or R-10045" />
        </label>
        <label className="field"><span className="label">Mobile number</span>
          <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" required placeholder="7XX XXXX" /></span>
        </label>
        <button type="submit" className="btn btn-green" disabled={pending}>{pending ? "Checking…" : "Check status"}</button>
      </form>
      {state.error && <p role="alert" className="alert alert-error">{state.error}</p>}
      {r?.kind === "order" && (
        <div role="status" className="card flex flex-col gap-2 p-6">
          <h2 className="text-xl font-extrabold">Order #{r.order_no}</h2>
          <p><strong>Status:</strong> {ORDER_STATUS_LABEL[r.status as OrderStatus] ?? r.status}</p>
          <p className="text-sm text-muted">Placed {formatDate(r.created_at)} · Total {money(r.total)}</p>
          <Link href={`/order/${r.tracking_token}`} className="font-bold text-accent">See order details →</Link>
        </div>
      )}
      {r?.kind === "repair" && (
        <div role="status" className="card flex flex-col gap-2 p-6">
          <h2 className="text-xl font-extrabold">Repair {r.code}</h2>
          <p><strong>Status:</strong> {REPAIR_STATUS_LABEL[r.status as RepairStatus] ?? r.status}</p>
          <p>{r.model_name} · {r.services.join(", ")}</p>
          <p className="text-sm text-muted">Estimate {money(r.estimate)}{r.needs_quote ? " + quote" : ""} · Updated {formatDate(r.updated_at)}</p>
          {r.customer_note && <p className="whitespace-pre-line rounded-xl bg-bg p-4">{r.customer_note}</p>}
        </div>
      )}
    </div>
  );
}
