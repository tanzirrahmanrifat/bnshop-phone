import Image from "next/image";
import { Icon } from "@/components/Icon";

const TINTS = ["#e9eef7", "#e7eefb", "#fff1e8", "#e7f5ec", "#eef0fb", "#fdecea", "#fff7db", "#e6f4f7"];

function tint(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Small square image, or a phone icon with the first letter on a soft colour. */
export function BrandIcon({ name, image, size = 56 }: { name: string; image?: string; size?: number }) {
  if (image) {
    return (
      <span className="relative block overflow-hidden rounded-xl" style={{ width: size, height: size }}>
        <Image src={image} alt="" fill sizes={`${size}px`} className="object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative flex flex-none items-center justify-center rounded-2xl text-ink"
      style={{ width: size, height: size, background: tint(name) }}
    >
      <Icon name="phone" size={Math.round(size * 0.6)} />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[62%] font-display text-[13px] font-extrabold">
        {name.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}
