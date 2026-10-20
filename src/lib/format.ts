/** "B$ 19.00" */
export function money(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return "B$ " + n.toLocaleString("en-BN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Brunei numbers are 7 digits (mobiles start 7/8, landlines 2–5). Returns '' if invalid. */
export function normalizePhone(raw: string): string {
  let d = (raw || "").replace(/\D+/g, "");
  if (d.startsWith("00673")) d = d.slice(5);
  else if (d.startsWith("673") && d.length === 10) d = d.slice(3);
  return /^[2-8]\d{6}$/.test(d) ? d : "";
}

export function formatPhone(local: string): string {
  return local ? `+673 ${local}` : "";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, effective: number): number {
  if (!price || effective >= price) return 0;
  return Math.round((1 - effective / price) * 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Brunei",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
