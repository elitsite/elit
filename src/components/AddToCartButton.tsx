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
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-ink/40 sm:px-6 sm:py-3.5 sm:text-xs sm:tracking-[0.2em]"
      >
        {soldOutLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-[0.98] sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-xs ${
        added
          ? "bg-brand text-white shadow-sm"
          : "bg-ink text-white hover:bg-brand shadow-sm"
      }`}
    >
      {added ? <Check size={15} /> : <ShoppingBag size={15} strokeWidth={1.5} />}
      {label}
    </button>
  );
}
