import { money } from "@/lib/format";

export function Price({ price, effective, size = "md" }: { price: number; effective: number; size?: "md" | "lg" }) {
  const onSale = effective < price;
  return (
    <span className="flex flex-wrap items-baseline gap-2">
      <strong className={`font-display font-extrabold tracking-tight ${size === "lg" ? "text-[32px] leading-none" : "text-[17px]"} ${onSale ? "text-accent" : "text-ink"}`}>{money(effective)}</strong>
      {onSale && <s className={size === "lg" ? "text-lg text-subtle" : "text-[13px] text-subtle"}>{money(price)}</s>}
    </span>
  );
}
