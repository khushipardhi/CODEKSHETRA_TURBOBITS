/* ════════════════════════════════════════════════════════
   Admin Taxonomy Management — All 17 Departments & Subcategories
   Connected with AI Department Routing Taxonomy
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { WrenchIcon, SearchIcon, ChevronDownIcon } from "@/components/ui/icons";
import { DEPARTMENTS } from "@/modules/ai/department-routing";

export default function AdminTaxonomyPage() {
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const filtered = DEPARTMENTS.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      (d.scope && d.scope.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Department Taxonomy & AI Routing
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Taxonomy hierarchy, keyword triggers, SLA definitions, and department boundaries for Nagpur
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-accent/10 text-accent font-bold text-xs rounded-xl self-start sm:self-auto">
          17 Active Taxonomies
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search taxonomy by department name, scope, or keywords..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-0 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Taxonomy Cards */}
      <div className="space-y-3">
        {filtered.map((cat) => {
          const isExpanded = expandedCode === cat.code;
          const subcategories = cat.subcategories || [];

          return (
            <div
              key={cat.code}
              className="bg-surface-0 border border-border rounded-2xl overflow-hidden shadow-sm hover:border-accent/30 transition-all"
            >
              <div
                onClick={() => setExpandedCode(isExpanded ? null : cat.code)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center text-xl shadow-inner">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      {cat.name}
                      {cat.nameMarathi && (
                        <span className="text-xs text-accent font-medium">({cat.nameMarathi})</span>
                      )}
                    </h3>
                    <p className="text-xs text-text-tertiary font-mono">Code: {cat.code} · SLA: {cat.slaHours || 24}h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={cat.priorityBand === "IMMEDIATE_EMERGENCY" ? "critical" : "accent"}>
                    {(cat.priorityBand || "STANDARD").replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-text-tertiary hidden sm:inline">
                    {subcategories.length} Subcategories
                  </span>
                  <div className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    <ChevronDownIcon size={16} className="text-text-tertiary" />
                  </div>
                </div>
              </div>

              {/* Collapsible details */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 border-t border-border/60 bg-surface-1/30 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-text-secondary block mb-1">Operational Scope:</span>
                    <p className="text-text-primary bg-surface-1 p-3 rounded-xl leading-relaxed">
                      {cat.scope || cat.description}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-text-secondary block mb-1.5">Subcategories & Handled Issues:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {subcategories.map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 bg-surface-1 border border-border text-text-primary rounded-lg font-medium text-[11px]"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
