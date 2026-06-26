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
  selectedSize?: string;
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
  selectedSize,
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: productId,
      name,
      price,
      discount,
      image_url: imageUrl,
      selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 border border-ink/15 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-ink/40 sm:px-8 sm:py-4 sm:text-xs sm:tracking-[0.2em]"
      >
        {soldOutLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cream transition-all hover:bg-black sm:gap-3 sm:px-8 sm:py-4 sm:text-[11px] sm:tracking-[0.25em]"
    >
      {added ? <Check size={14} /> : <ShoppingBag size={14} strokeWidth={1.5} />}
      {label}
    </button>
  );
}
