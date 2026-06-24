"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

type Props = {
  productId: string;
  name: string;
  price: number;
  discount: number;
  imageUrl: string;
  disabled?: boolean;
  label: string;
  soldOutLabel: string;
};

/** Add-to-cart action wired to the persistent cart store. */
export default function AddToCartButton({
  productId,
  name,
  price,
  discount,
  imageUrl,
  disabled = false,
  label,
  soldOutLabel,
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({
      id: productId,
      name,
      price,
      discount,
      image_url: imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 border border-ink/15 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-ink/40"
      >
        {soldOutLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 border border-ink bg-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:border-brand hover:bg-brand"
    >
      {added ? <Check size={16} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
      {label}
    </button>
  );
}
