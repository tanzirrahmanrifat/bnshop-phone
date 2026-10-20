"use client";

import type React from "react";
import { useEffect, useState } from "react";

/**
 * Phone-only bar pinned above the bottom navigation. It appears while the element with id
 * `watch` (the real buttons or form) is off screen, so the main action is always one tap away.
 */
export function StickyBar({ watch, children }: { watch: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { rootMargin: "0px 0px -60px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)").matches;
    if (show && phone) document.body.setAttribute("data-sticky-bar", "");
    else document.body.removeAttribute("data-sticky-bar");
    return () => document.body.removeAttribute("data-sticky-bar");
  }, [show]);

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-4 py-2.5 shadow-[0_-8px_24px_rgba(11,27,51,.08)] backdrop-blur transition-transform duration-200 md:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-[calc(100%+70px)]"}`}
    >
      {children}
    </div>
  );
}
