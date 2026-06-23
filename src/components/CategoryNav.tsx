"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";

type Props = {
  /** Called after a leaf link is clicked (e.g. to close the drawer). */
  onNavigate?: () => void;
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
  const pad = { paddingLeft: `${depth * 0.875 + 1}rem` };

  if (!hasChildren) {
    return (
      <Link
        href={`/category/${path.join("/")}`}
        onClick={onNavigate}
        style={pad}
        className="block py-2 pr-4 text-[15px] text-ink/80 transition-colors hover:text-brand"
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
        style={pad}
        className={`flex w-full items-center justify-between py-2 pr-4 text-left transition-colors hover:text-brand ${
          depth === 0
            ? "font-display text-lg font-semibold text-ink"
            : "text-[15px] font-medium text-ink/90"
        }`}
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${
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
        <div key={node.slug} className="py-1.5">
          <NavRow node={node} trail={[]} depth={0} onNavigate={onNavigate} />
        </div>
      ))}
    </nav>
  );
}
