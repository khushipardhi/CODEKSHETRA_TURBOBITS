/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Parameter Explorer Tab
   Interactive catalogue of 60+ typed environmental parameters.
   Organised across 8 categories with plain-language explanations,
   why it matters, statutory thresholds, limitations, and city isolation.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useMemo } from "react";
import {
  ENVIRONMENTAL_PARAMETER_REGISTRY,
  EnvironmentalParameterDefinition,
  PARAMETER_CATEGORIES,
  ParameterCategory,
} from "@/modules/hazards/parameter-registry";
import { SearchIcon, XIcon, CheckCircleIcon, ShieldIcon, ActivityIcon } from "@/components/ui/icons";

interface ParameterExplorerTabProps {
  city: string;
}

export function ParameterExplorerTab({ city }: ParameterExplorerTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedDataType, setSelectedDataType] = useState<string>("ALL");
  const [showUnsupported, setShowUnsupported] = useState<boolean>(true);
  const [activeParameter, setActiveParameter] = useState<EnvironmentalParameterDefinition | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const pId = sp.get("param");
      if (pId && ENVIRONMENTAL_PARAMETER_REGISTRY[pId]) {
        return ENVIRONMENTAL_PARAMETER_REGISTRY[pId];
      }
    }
    return null;
  });

  // Filter parameters
  const parameters = useMemo(() => {
    return Object.values(ENVIRONMENTAL_PARAMETER_REGISTRY).filter((p) => {
      // Category filter matching 8 categories
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "derived_indicators") {
          const isDerived = p.category === "derived_indicators" || p.isDerived || p.dataType === "DERIVED" || p.endpoint === "derived";
          if (!isDerived) return false;
        } else if (selectedCategory === "historical_archive") {
          const isHist = p.category === "historical_archive" || p.dataType === "HISTORICAL_REANALYSIS" || p.endpoint === "archive";
          if (!isHist) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // Data Type filter
      if (selectedDataType !== "ALL" && p.dataType !== selectedDataType) return false;

      // City filter (hide unsupported if toggled off)
      if (!showUnsupported && !p.supportedCities.includes(city as any)) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.whatItMeasures && p.whatItMeasures.toLowerCase().includes(q)) ||
          (p.plainLanguageMeaning && p.plainLanguageMeaning.toLowerCase().includes(q)) ||
          p.model.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [city, selectedCategory, selectedDataType, showUnsupported, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Search and Category Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-divider bg-card shadow-xs space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by key, description, scientific term or formula..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-divider bg-surface text-text-primary text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* Data Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-text-tertiary font-medium">Type:</span>
            <select
              value={selectedDataType}
              onChange={(e) => setSelectedDataType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-divider bg-surface text-text-primary text-xs font-semibold focus:outline-hidden"
            >
              <option value="ALL">All Types</option>
              <option value="MODELLED_CURRENT">Modelled Current</option>
              <option value="FORECAST">Forecast</option>
              <option value="DERIVED">Derived Indicator</option>
              <option value="HISTORICAL_REANALYSIS">Reanalysis</option>
            </select>
          </div>

          {/* City Scope Toggle */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
              <input
                type="checkbox"
                checked={showUnsupported}
                onChange={(e) => setShowUnsupported(e.target.checked)}
                className="rounded border-divider text-primary focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Include Non-{city.toUpperCase()} Variables</span>
            </label>
          </div>
        </div>

        {/* 8-Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-divider bg-surface hover:bg-surface-elevated text-text-secondary"
            }`}
          >
            All Parameters ({Object.values(ENVIRONMENTAL_PARAMETER_REGISTRY).length})
          </button>
          {Object.entries(PARAMETER_CATEGORIES).map(([catKey, catInfo]) => {
            const count = Object.values(ENVIRONMENTAL_PARAMETER_REGISTRY).filter((p) => {
              if (catKey === "derived_indicators") return p.category === "derived_indicators" || p.isDerived || p.dataType === "DERIVED" || p.endpoint === "derived";
              if (catKey === "historical_archive") return p.category === "historical_archive" || p.dataType === "HISTORICAL_REANALYSIS" || p.endpoint === "archive";
              return p.category === catKey;
            }).length;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategory === catKey
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-divider bg-surface hover:bg-surface-elevated text-text-secondary"
                }`}
              >
                {catInfo.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Parameter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parameters.map((param) => {
          const isSelected = activeParameter?.id === param.id;
          const isSupported = param.supportedCities.includes(city as any);

          return (
            <div
              key={param.id}
              onClick={() => setActiveParameter(param)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                  : !isSupported
                  ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                  : "border-divider bg-card hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-text-tertiary uppercase">
                    {param.endpoint} • {param.apiField}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isSupported && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        NON-{city.toUpperCase()}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        param.dataType === "DERIVED"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : param.dataType === "FORECAST"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : param.dataType === "HISTORICAL_REANALYSIS"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {param.dataType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-text-primary flex items-center justify-between">
                  <span>{param.label}</span>
                  <span className="font-mono text-xs text-primary font-black bg-surface-elevated px-2 py-0.5 rounded-md border border-divider">
                    {param.unit}
                  </span>
                </h4>

                <p className="text-xs text-text-tertiary line-clamp-2 mt-1 leading-relaxed">
                  {param.plainLanguageMeaning || param.description}
                </p>
              </div>

              <div className="pt-2 border-t border-divider flex items-center justify-between text-[11px] text-text-secondary">
                <span className="truncate max-w-[170px] text-text-tertiary">{param.model}</span>
                <span className="font-semibold text-primary flex items-center gap-1">
                  Inspect & Rules →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Inspection Drawer for Active Parameter */}
      {activeParameter && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 bg-card border-l border-divider shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-4 border-b border-divider pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] text-primary uppercase font-bold">
                  {PARAMETER_CATEGORIES[activeParameter.category]?.label || activeParameter.category.replace("_", " ")}
                </span>
                <span className="text-[10px] text-text-tertiary">•</span>
                <span className="font-mono text-[10px] text-text-tertiary">{activeParameter.apiField}</span>
              </div>
              <h3 className="text-lg font-black text-text-primary mt-1 flex items-center gap-2">
                <span>{activeParameter.label}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface-elevated border border-divider text-primary font-bold">
                  {activeParameter.unit}
                </span>
              </h3>
            </div>
            <button
              onClick={() => setActiveParameter(null)}
              className="p-1.5 rounded-xl border border-divider hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* City Geographic Support Status Banner */}
          {!activeParameter.supportedCities.includes(city as any) ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <span>⚠️ Unavailable for {city.toUpperCase()}</span>
              </strong>
              <p className="text-[11px] leading-relaxed">
                This environmental parameter requires specific shoreline topography or calibrated numerical grids. Supported only in:{" "}
                <strong>{activeParameter.supportedCities.map((c) => c.toUpperCase()).join(", ")}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircleIcon size={14} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11px]">Calibrated and operational for {city.toUpperCase()} telemetry feeds</span>
            </div>
          )}

          <div className="space-y-4 text-xs text-text-secondary">
            {/* 1. What it Measures & Physical Definition */}
            <div>
              <h5 className="font-bold text-text-primary mb-1 uppercase text-[10px] tracking-wider">
                1. What it Measures & Physical Definition
              </h5>
              <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-divider space-y-1 text-text-primary">
                <p className="font-medium leading-relaxed">
                  {activeParameter.whatItMeasures || activeParameter.description}
                </p>
                {activeParameter.whatItMeasures && activeParameter.description !== activeParameter.whatItMeasures && (
                  <p className="text-[11px] text-text-tertiary leading-relaxed pt-1 border-t border-divider/60">
                    {activeParameter.description}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Plain-Language Meaning (Operational Interpretation) */}
            <div>
              <h5 className="font-bold text-text-primary mb-1 uppercase text-[10px] tracking-wider text-accent">
                2. Plain-Language Operational Meaning
              </h5>
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <p className="text-text-primary leading-relaxed font-normal">
                  {activeParameter.plainLanguageMeaning || activeParameter.description}
                </p>
              </div>
            </div>

            {/* 3. Why It Matters to Selected City / Hazard */}
            <div>
              <h5 className="font-bold text-text-primary mb-1 uppercase text-[10px] tracking-wider text-primary">
                3. Why It Matters to {city.toUpperCase()} & Environmental Hazards
              </h5>
              <div className="p-3.5 rounded-xl bg-surface-elevated/50 border border-divider space-y-2 text-text-secondary">
                <p className="leading-relaxed">
                  {activeParameter.whyItMatters || (
                    city === "mumbai"
                      ? "Directly impacts urban flood routing, coastal sea states, and monsoon chokepoint management across Mumbai's 24 wards."
                      : city === "nagpur"
                      ? "Governs convective storm surge risks across Nag River and Pili Nadi drainage basins and Vidarbha heatwaves."
                      : "Affects riverine urban conveyance through the Mula-Mutha river basin and Western Ghats runoff."
                  )}
                </p>
                {activeParameter.associatedAnalysis && (
                  <div className="text-[11px] font-semibold text-primary pt-1 border-t border-divider/60 flex items-center gap-1.5">
                    <span>Associated Analysis:</span>
                    <span className="font-mono bg-card px-2 py-0.5 rounded border border-divider">
                      {activeParameter.associatedAnalysis}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Derived Mathematical Formulation (if applicable) */}
            {activeParameter.formula && (
              <div>
                <h5 className="font-bold text-text-primary mb-1 uppercase text-[10px] tracking-wider">
                  4. Derived Mathematical Formulation
                </h5>
                <div className="p-3 rounded-xl bg-surface-elevated/40 font-mono text-[11px] text-primary border border-divider">
                  {activeParameter.formula}
                </div>
              </div>
            )}

            {/* 5. Authoritative Operational Thresholds (IMD / CPCB / NOAA) */}
            <div>
              <h5 className="font-bold text-text-primary mb-1 uppercase text-[10px] tracking-wider">
                5. Authoritative Operational Thresholds (IMD / CPCB / NOAA)
              </h5>
              {activeParameter.thresholds && activeParameter.thresholds.length > 0 ? (
                <div className="space-y-1.5">
                  {activeParameter.thresholds.map((th, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-divider bg-surface-elevated/30 flex items-center justify-between"
                    >
                      <span className="font-bold text-xs" style={{ color: th.color }}>
                        {th.label}
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-text-primary">
                          {th.min !== undefined && th.max !== undefined
                            ? `${th.min} – ${th.max} ${activeParameter.unit}`
                            : th.min !== undefined
                            ? `≥ ${th.min} ${activeParameter.unit}`
                            : `≤ ${th.max} ${activeParameter.unit}`}
                        </span>
                        <span className="text-[10px] text-text-tertiary ml-2">
                          [{th.sourceAuthority} Standard]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-divider/80 bg-surface-elevated/30 text-[11px] text-text-tertiary">
                  No statutory single-value threshold exists for this parameter (continuous physical baseline).
                </div>
              )}
            </div>

            {/* 6. Spatial Resolution & Scientific Limitations */}
            <div className="space-y-2">
              <h5 className="font-bold text-text-primary uppercase text-[10px] tracking-wider">
                6. Spatial Resolution & Scientific Limitations
              </h5>
              <div className="p-3.5 rounded-xl border border-divider bg-surface-elevated/30 space-y-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2 text-text-secondary">
                  <div>
                    <span className="text-text-tertiary block text-[10px] uppercase font-bold">Spatial Grid:</span>
                    <strong className="text-text-primary">{activeParameter.spatialResolution}</strong>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[10px] uppercase font-bold">Temporal Step:</span>
                    <strong className="text-text-primary">{activeParameter.temporalResolution}</strong>
                  </div>
                </div>
                {activeParameter.limitations && (
                  <p className="text-text-tertiary pt-2 border-t border-divider/60 leading-relaxed">
                    <strong className="text-text-primary">Limitation:</strong> {activeParameter.limitations}
                  </p>
                )}
              </div>
            </div>

            {/* 7. Contextual Action Links with Honest City Isolation */}
            <div className="pt-2 space-y-2 border-t border-divider">
              <div className="flex items-center gap-2">
                {city === "mumbai" ? (
                  <a
                    href={`/admin/mumbai/simulation?scenario=${
                      activeParameter.category === "rainfall_hydrology" || activeParameter.id.includes("precip") || activeParameter.id.includes("rain")
                        ? "monsoon_downpour_saucer_sinks"
                        : activeParameter.category === "weather_atmosphere" && (activeParameter.id.includes("wind") || activeParameter.id.includes("gust"))
                        ? "cyclone_wind_surge"
                        : activeParameter.category === "coastal_marine" || activeParameter.id.includes("wave")
                        ? "spring_tide_coastal_surge"
                        : activeParameter.category === "heat_exposure" || activeParameter.id.includes("heat") || activeParameter.id.includes("temp")
                        ? "heatwave_urban_furnace"
                        : "monsoon_downpour_saucer_sinks"
                    }&param=${activeParameter.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs text-center hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                  >
                    Inspect in Spatial Simulation Lab →
                  </a>
                ) : (
                  <a
                    href={`/admin/${city}/map`}
                    className="flex-1 py-2 px-3 rounded-xl bg-surface-elevated border border-divider text-accent font-bold text-xs text-center hover:bg-surface-2 transition-colors shadow-xs"
                    title={`View ${city.toUpperCase()} Spatial Incident Map`}
                  >
                    View {city.toUpperCase()} Incident Map →
                  </a>
                )}
                <a
                  href={`/admin/${city}/incidents`}
                  className="py-2 px-3 rounded-xl bg-surface-elevated border border-divider text-text-primary font-bold text-xs hover:border-accent/40 transition-colors"
                >
                  Related Incidents
                </a>
              </div>
              {city !== "mumbai" && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  ⚠️ Note: 2D hydrodynamic saucer-depression mesh is calibrated exclusively for Greater Mumbai. {city.toUpperCase()} displays telemetry monitoring with honest boundary limitation status.
                </p>
              )}
            </div>

            {/* 8. Provenance & Attribution */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/20">
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                  Underlying Numerical Model
                </span>
                <span className="font-semibold text-text-primary">{activeParameter.model}</span>
              </div>
              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/20">
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                  Licence & Source
                </span>
                <span className="font-semibold text-text-primary">
                  {activeParameter.license}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
