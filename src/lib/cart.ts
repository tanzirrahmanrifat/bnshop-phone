"use client";

import { useSyncExternalStore } from "react";

export type CartLine = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string;
  image: string;
  price: number; // display only; the server recalculates every price at checkout
  qty: number;
};

const KEY = "bnshop.cart.v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    cache = Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === "string" && l.qty > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const same = (a: CartLine, productId: string, variantId: string | null) =>
  a.productId === productId && a.variantId === variantId;

export const cart = {
  add(line: Omit<CartLine, "qty">, qty = 1) {
    const lines = [...read()];
    const i = lines.findIndex((l) => same(l, line.productId, line.variantId));
    if (i >= 0) lines[i] = { ...lines[i], ...line, qty: Math.min(20, lines[i].qty + qty) };
    else lines.push({ ...line, qty: Math.min(20, qty) });
    write(lines);
  },
  setQty(productId: string, variantId: string | null, qty: number) {
    write(
      read()
        .map((l) => (same(l, productId, variantId) ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l)),
    );
  },
  remove(productId: string, variantId: string | null) {
    write(read().filter((l) => !same(l, productId, variantId)));
  },
  clear() {
    write([]);
  },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount(): number {
  return useCart().reduce((n, l) => n + l.qty, 0);
}
