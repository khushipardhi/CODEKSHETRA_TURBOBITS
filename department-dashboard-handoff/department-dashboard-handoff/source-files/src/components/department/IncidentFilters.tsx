"use client";

import React from "react";

interface IncidentFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

export function IncidentFilters({ activeFilter, onFilterChange, counts }: IncidentFiltersProps) {
  const filters = [
    { id: "all", label: "All Records" },
    { id: "incoming", label: "Incoming / Pending" },
    { id: "in_progress", label: "In Progress" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap select-none
              ${
                isActive
                  ? "bg-accent text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent"
              }
            `}
          >
            <span>{f.label}</span>
            <span
              className={`
                inline-flex items-center justify-center min-w-[20px] h-4.5 px-1.5 text-[10px] font-extrabold rounded-full
                ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }
              `}
            >
              {counts[f.id] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
