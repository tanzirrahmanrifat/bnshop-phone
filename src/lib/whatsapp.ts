/** wa.me link for a number stored like "+673 7123456". Returns '' if no number. */
export function waLink(number: string, text?: string): string {
  const digits = (number || "").replace(/\D+/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
