"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Flower2,
  Package,
  Heart,
  Leaf,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";

type Props = {
  /** Called after a leaf link is clicked (e.g. to close the drawer). */
  onNavigate?: () => void;
};

/** Map top-level category slugs to icons */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bouquets: <Flower2 size={18} strokeWidth={1.5} className="text-brand/60" />,
  arrangements: <Package size={18} strokeWidth={1.5} className="text-brand/60" />,
  "wedding-floristry": <Heart size={18} strokeWidth={1.5} className="text-brand/60" />,
  funeral: <Leaf size={18} strokeWidth={1.5} className="text-brand/60" />,
  weddings: <Sparkles size={18} strokeWidth={1.5} className="text-brand/60" />,
  parties: <PartyPopper size={18} strokeWidth={1.5} className="text-brand/60" />,
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
        className="block py-2 pl-10 pr-4 text-[15px] text-ink/80 transition-colors hover:text-brand"
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
        className={`flex w-full items-center gap-3 py-3 pr-4 text-left transition-colors hover:text-brand ${
          isTopLevel
            ? "pl-4 font-display text-[17px] font-semibold text-ink"
            : "pl-10 text-[15px] font-medium text-ink/90"
        }`}
        aria-expanded={open}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1">{label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink/30 transition-transform duration-300 ${
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
        <div key={node.slug} className="py-0.5">
          <NavRow node={node} trail={[]} depth={0} onNavigate={onNavigate} />
        </div>
      ))}
    </nav>
  );
}
