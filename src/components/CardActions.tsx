"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { cart } from "@/lib/cart";
import type { ProductListItem } from "@/lib/types";

export function CardActions({ product }: { product: ProductListItem }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const hasOptions = Boolean(product.option_name);

  if (!product.in_stock) {
    return <Link href={`/product/${product.slug}`} className="btn btn-sm btn-outline w-full">See details</Link>;
  }
  if (hasOptions) {
    return (
      <Link href={`/product/${product.slug}`} className="btn btn-sm btn-dark w-full">
        Choose {product.option_name.toLowerCase()}
      </Link>
    );
  }

  const line = {
    productId: product.id,
    variantId: null,
    slug: product.slug,
    name: product.name,
    variantLabel: "",
    image: product.images[0] ?? "",
    price: product.effective_price,
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
        title="Add to cart"
        className={`btn btn-sm flex-none !px-0 w-10 ${added ? "btn-green" : "btn-outline"}`}
        onClick={() => {
          cart.add(line);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        <Icon name={added ? "check" : "cart"} size={18} />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-accent min-w-0 flex-1 !px-2"
        onClick={() => {
          cart.add(line);
          router.push("/checkout");
        }}
      >
        <Icon name="bolt" size={16} />
        Buy now
      </button>
    </div>
  );
}
