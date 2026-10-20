"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/ProductImage";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (!images.length) return <ProductImage alt={name} className="rounded-[24px]" />;

  const go = (idx: number) => {
    setI(idx);
    const el = track.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={track}
          className="scroll-x flex snap-x snap-mandatory overflow-x-auto rounded-[24px] bg-[#f1f4f9]"
          onScroll={(e) => {
            const el = e.currentTarget;
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            if (idx !== i) setI(idx);
          }}
        >
          {images.map((src, idx) => (
            <div key={src} className="relative aspect-square w-full flex-none snap-center">
              <Image src={src} alt={idx === 0 ? name : `${name}, image ${idx + 1}`} fill priority={idx === 0} sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {images.map((src, idx) => (
              <span key={src} className={`h-2 rounded-full transition-all ${idx === i ? "w-5 bg-ink" : "w-2 bg-ink/25"}`} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden grid-cols-5 gap-2.5 md:grid">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => go(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-pressed={idx === i}
              className={`relative aspect-square overflow-hidden rounded-xl bg-[#f1f4f9] ${idx === i ? "ring-2 ring-ink" : "ring-1 ring-line"}`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
