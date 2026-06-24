"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Flower,
  Gift,
  Gem,
  Flame,
  CalendarHeart,
  GlassWater,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";

type Props = {
  /** Called after a leaf link is clicked (e.g. to close the drawer). */
  onNavigate?: () => void;
};

/** Map top-level category slugs to clean, professional icons */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bouquets: <Flower size={20} strokeWidth={1.3} className="text-ink/40" />,
  arrangements: <Gift size={20} strokeWidth={1.3} className="text-ink/40" />,
  "wedding-floristry": <Gem size={20} strokeWidth={1.3} className="text-ink/40" />,
  funeral: <Flame size={20} strokeWidth={1.3} className="text-ink/40" />,
  weddings: <CalendarHeart size={20} strokeWidth={1.3} className="text-ink/40" />,
  parties: <GlassWater size={20} strokeWidth={1.3} className="text-ink/40" />,
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
  const [open, setOpen] = useState(depth === 0);
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center py-3.5 pr-4 text-left transition-colors hover:text-brand ${
          isTopLevel
            ? "pl-4 font-display text-[17px] font-medium text-ink"
            : "pl-[52px] text-[15px] font-medium text-ink/80"
        }`}
        aria-expanded={open}
      >
        {icon && <span className="mr-3.5 flex-shrink-0">{icon}</span>}
        <span className="flex-1">{label}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`shrink-0 text-ink/25 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
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
