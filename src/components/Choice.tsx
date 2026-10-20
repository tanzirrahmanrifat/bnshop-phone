import type React from "react";

export type ChoiceOption = { value: string; title: React.ReactNode; note?: React.ReactNode; aside?: React.ReactNode };

/**
 * Tappable radio cards (replaces <select> where there are only a few options).
 * Works without JavaScript; pass onChange when a parent needs the value live.
 */
export function ChoiceCards({
  name,
  options,
  value,
  defaultValue,
  onChange,
  columns = "grid-cols-1 sm:grid-cols-2",
  tone = "light",
  required,
}: {
  name: string;
  options: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  columns?: string;
  tone?: "light" | "dark";
  required?: boolean;
}) {
  const card =
    tone === "dark"
      ? "border-ink-3 bg-ink-2 text-white has-[:checked]:border-mint has-[:checked]:bg-[#16345a]"
      : "border-[#d5dae2] bg-white has-[:checked]:border-ink has-[:checked]:bg-[#eef2fa] has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-ink)]";
  const dot = tone === "dark" ? "border-[#5b6f91] peer-checked:border-mint peer-checked:bg-mint" : "border-[#9aa3b2] peer-checked:border-ink peer-checked:bg-ink";
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-mint ${card}`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            className="peer sr-only"
            required={required}
            {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
          />
          <span aria-hidden="true" className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 bg-transparent shadow-[inset_0_0_0_3px_white] ${dot}`} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-bold leading-snug">{o.title}</span>
            {o.note && <span className={`text-[13px] leading-snug ${tone === "dark" ? "text-[#aeb9ca]" : "text-muted"}`}>{o.note}</span>}
          </span>
          {o.aside && <span className="flex-none text-sm font-extrabold">{o.aside}</span>}
        </label>
      ))}
    </div>
  );
}

/** Numbered progress for multi-step flows (cart → details → done, brand → model → repairs). */
export function Steps({ steps, current, tone = "accent" }: { steps: string[]; current: number; tone?: "accent" | "green" }) {
  const on = tone === "green" ? "bg-green text-white" : "bg-accent text-white";
  const bar = tone === "green" ? "bg-green" : "bg-accent";
  return (
    <ol aria-label="Progress" className="flex items-center gap-2 text-[13px] font-bold sm:text-sm">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-extrabold ${state === "todo" ? "bg-[#e3e7ee] text-muted" : on}`}>
              {state === "done" ? "✓" : n}
            </span>
            <span className={`truncate ${state === "todo" ? "text-subtle" : "text-ink"}`}>{label}</span>
            {n < steps.length && <span aria-hidden="true" className={`h-0.5 min-w-3 flex-1 rounded ${n < current ? bar : "bg-[#e3e7ee]"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
