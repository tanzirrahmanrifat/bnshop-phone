"use client";

import { useEffect, useState } from "react";
import { quoteCart, type QuotedLine } from "@/app/cart/actions";
import type { CartLine } from "@/lib/cart";

type Quote = { lines: QuotedLine[]; subtotal: number };
const EMPTY: Quote = { lines: [], subtotal: 0 };

/** Server-checked prices and stock for the browser cart. */
export function useQuote(lines: CartLine[]): Quote | null {
  const key = JSON.stringify(lines.map((l) => [l.productId, l.variantId, l.qty]));
  const [result, setResult] = useState<{ key: string; quote: Quote } | null>(null);

  useEffect(() => {
    const items = (JSON.parse(key) as [string, string | null, number][]).map(([productId, variantId, qty]) => ({ productId, variantId, qty }));
    if (!items.length) return;
    let alive = true;
    quoteCart(items).then((quote) => {
      if (alive) setResult({ key, quote });
    });
    return () => {
      alive = false;
    };
  }, [key]);

  if (lines.length === 0) return EMPTY;
  return result?.key === key ? result.quote : null;
}
