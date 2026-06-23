/** Currency / number formatting helpers (EUR, Dutch grouping). */

const eur = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format an integer euro amount, e.g. 1250 -> "€ 1.250". */
export function formatEUR(amount: number | null | undefined): string {
  return eur.format(amount ?? 0);
}
