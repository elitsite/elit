import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type Crumb = {
  label: string;
  /** Locale-independent href (Link prefixes the locale). Omit for current page. */
  href?: string;
};

/** Breadcrumb trail with the last item rendered as plain (current) text. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs uppercase tracking-[0.15em] text-ink/50">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-x-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-ink" : ""}>{item.label}</span>
              )}
              {!isLast && <ChevronRight size={12} className="text-ink/30" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
