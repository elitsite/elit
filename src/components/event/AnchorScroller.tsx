"use client";

import { useEffect } from "react";

const ANCHOR_MAP: Record<string, string> = {
  'wedding-portfolio': 'portfolio',
  'wedding-packages': 'packages',
  'wedding-decor': 'decor',
  'party-portfolio': 'portfolio',
  'party-packages': 'packages',
  'party-decor': 'decor',
};

export default function AnchorScroller({ anchor }: { anchor?: string }) {
  useEffect(() => {
    if (anchor && ANCHOR_MAP[anchor]) {
      const el = document.getElementById(ANCHOR_MAP[anchor]);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [anchor]);

  return null;
}
