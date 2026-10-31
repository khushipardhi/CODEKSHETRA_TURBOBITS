/* ════════════════════════════════════════════════════════
   Category Grid — 8 clickable cards
   Uses taxonomy as single source of truth
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { DEPARTMENTS } from "@/modules/ai/department-routing";

interface CategoryGridProps {
  onSelect: (slug: string) => void;
}

export function CategoryGrid({ onSelect }: CategoryGridProps) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
        Report an Issue
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.code}
            onClick={() => onSelect(dept.code)}
            className="bg-surface-0 border border-border rounded-2xl p-4 text-left hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer active:scale-[0.98] group"
          >
            <span className="text-2xl block mb-2">{dept.icon || "🏢"}</span>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {dept.name}
            </h3>
            <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2 leading-relaxed">
              {dept.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
