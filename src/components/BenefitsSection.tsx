import { useTranslations } from "next-intl";
import { Flower2, HandHeart, Truck, Heart } from "lucide-react";

/**
 * Service benefits bar shown above the footer.
 * Matches the light-beige rounded bar style from the design.
 */
export default function BenefitsSection() {
  const t = useTranslations("Home");

  const benefits = [
    {
      icon: <Flower2 size={28} strokeWidth={1} />,
      labelKey: "benefit_fresh",
    },
    {
      icon: <HandHeart size={28} strokeWidth={1} />,
      labelKey: "benefit_handcrafted",
    },
    {
      icon: <Truck size={28} strokeWidth={1} />,
      labelKey: "benefit_delivery",
    },
    {
      icon: <Heart size={28} strokeWidth={1} />,
      labelKey: "benefit_love",
    },
  ];

  return (
    <div className="mx-auto mt-10 max-w-6xl px-4 sm:mt-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-6 overflow-hidden rounded-2xl bg-ink/5 px-6 py-8 sm:flex sm:flex-wrap sm:items-center sm:justify-around sm:gap-y-10 sm:rounded-[3rem] sm:px-10 sm:py-14">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
            <div className="text-ink/30">
              {benefit.icon}
            </div>
            <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.15em] text-ink/70 sm:text-[11px] sm:tracking-[0.2em]">
              {t(benefit.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
