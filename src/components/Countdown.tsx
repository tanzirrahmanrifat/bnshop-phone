"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const [d, h, m, s] = now === null ? [0, 0, 0, 0] : parts(end - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div role="timer" aria-label={`${d} days ${h} hours ${m} minutes left`} className="flex items-center gap-1 font-display font-bold">
      <span className="mr-1.5 font-sans text-[13px] font-semibold text-muted">Ends in</span>
      {[d, h, m].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="rounded-lg bg-ink px-2 py-1.5 text-white" suppressHydrationWarning>{pad(v)}</span>:
        </span>
      ))}
      <span className="rounded-lg bg-accent px-2 py-1.5 text-white" suppressHydrationWarning>{pad(s)}</span>
    </div>
  );
}
