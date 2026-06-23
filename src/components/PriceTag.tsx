import { formatEUR } from "@/lib/format";
import { finalPrice } from "@/lib/i18n-content";

type Props = {
  price: number;
  discount?: number;
  className?: string;
};

/**
 * Price display. When a discount is present, shows the original price with a
 * strike-through and the discounted price in the gold accent colour.
 */
export default function PriceTag({ price, discount = 0, className = "" }: Props) {
  const hasDiscount = discount > 0;
  const final = finalPrice(price, discount);

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {hasDiscount && (
        <span className="text-sm text-ink/40 line-through">
          {formatEUR(price)}
        </span>
      )}
      <span
        className={`font-medium ${hasDiscount ? "text-brand-dark" : "text-ink"}`}
      >
        {formatEUR(final)}
      </span>
    </span>
  );
}
