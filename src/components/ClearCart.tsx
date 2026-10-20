"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
