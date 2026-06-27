"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Flower,
  Gift,
  Gem,
  CalendarHeart,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";

type Props = {
  /** Called after a leaf link is clicked (e.g. to close the drawer). */
  onNavigate?: () => void;
};

/** Material-style candle icon for funeral */
function DeceasedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2c-1.5 2.5-2.5 4-2.5 5.5a2.5 2.5 0 005 0C14.5 6 13.5 4.5 12 2z" />
      <rect x="10.5" y="9.5" width="3" height="11" rx="1" />
      <path d="M8.5 20.5h7" />
    </svg>
  );
}

/** Material-style celebration icon for parties */
function CelebrationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21L9 3l4.5 6L21 6l-6 15H3z" />
      <path d="M9 3l1.5 4" />
      <circle cx="18" cy="3" r="1" />
      <circle cx="21" cy="10" r="0.8" />
      <path d="M15 2l0.5 1.5" />
    </svg>
  );
}

/** Map top-level category slugs to clean icons */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bouquets: <Flower size={20} strokeWidth={1.3} className="text-ink/40" />,
  arrangements: <Gift size={20} strokeWidth={1.3} className="text-ink/40" />,
  "wedding-floristry": <Gem size={20} strokeWidth={1.3} className="text-ink/40" />,
  funeral: <DeceasedIcon className="text-ink/40" />,
  weddings: <CalendarHeart size={20} strokeWidth={1.3} className="text-ink/40" />,
  parties: <CelebrationIcon className="text-ink/40" />,
};

/** A single tree row: leaf = link, branch = collapsible group. */
function NavRow({
  node,
  trail,
  depth,
  onNavigate,
}: {
  node: CategoryNode;
  trail: string[];
  depth: number;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Categories");
  // Collapsed by default — groups open only when the user taps them.
  const [open, setOpen] = useState(false);
  const path = [...trail, node.slug];
  const hasChildren = !!node.children?.length;
  const label = t(node.labelKey);
  const isTopLevel = depth === 0;
  const icon = isTopLevel ? CATEGORY_ICONS[node.slug] : null;

  if (!hasChildren) {
    return (
      <Link
        href={`/category/${path.join("/")}`}
        onClick={onNavigate}
        className="block py-2.5 pl-[52px] pr-4 text-[15px] text-ink/70 transition-colors hover:text-brand"
      >
        {label}
      </Link>
    );
  }

  return (
    <div>
      <div
        className={`flex w-full items-center text-left transition-colors hover:text-brand group ${
          isTopLevel
            ? "font-display text-[17px] font-medium text-ink"
            : "text-[15px] font-medium text-ink/80"
        }`}
      >
        <Link
          href={`/category/${path.join("/")}`}
          onClick={onNavigate}
          className={`flex-1 py-3.5 flex items-center ${isTopLevel ? "pl-4" : "pl-[52px]"}`}
        >
          {icon && <span className="mr-3.5 flex-shrink-0">{icon}</span>}
          <span>{label}</span>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
          className="p-3.5 pr-4 pl-3"
          aria-expanded={open}
        >
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={`shrink-0 text-ink/25 transition-transform duration-300 group-hover:text-brand ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      <div
        className={`grid transition-all duration-300 ease-soft-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {node.children!.map((child) => (
            <NavRow
              key={child.slug}
              node={child}
              trail={path}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryNav({ onNavigate }: Props) {
  return (
    <nav className="flex flex-col divide-y divide-black/5">
      {CATEGORY_TREE.map((node) => (
        <div key={node.slug}>
          <NavRow node={node} trail={[]} depth={0} onNavigate={onNavigate} />
        </div>
      ))}
    </nav>
  );
}
