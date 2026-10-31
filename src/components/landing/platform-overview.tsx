"use client";

import React from "react";
import Link from "next/link";
import {
  ActivityIcon,
  MapIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldIcon,
  BuildingIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ThermometerIcon,
} from "@/components/ui/icons";

interface PlatformOverviewProps {
  citySlug: string;
}

export function PlatformOverview({ citySlug }: PlatformOverviewProps) {
  return (
    <section id="overview" className="py-20 sm:py-24 border-t border-border bg-surface-1/40 dark:bg-[#060a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>MODULAR ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            One City. Multiple Intelligence Layers.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Every module in Sentinel operates as an authoritative layer—transforming numerical
            weather models, terrain topography, and field reports into accountable municipal intelligence.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* ─── Card 1 (Large 2-Column on LG): Spatial Simulation Lab ─── */}
          <div className="lg:col-span-2 rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <SparklesIcon size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-orange-600 dark:text-orange-400 uppercase">
                      Core Differentiator
                    </span>
                    <h3 className="text-lg font-bold text-text-primary">Spatial Simulation Lab</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-surface-2 text-text-secondary">
                  Tier 2 Screening
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-5">
                Simulate rainfall-runoff accumulation across all 24 BMC administrative wards.
                Configurable Chicago storm hyetographs, Copernicus GLO-30 DEM depression depths,
                and semi-diurnal astronomical tidal lockout at coastal outfalls.
              </p>

              {/* Simulation Visual Preview Box */}
              <div className="p-3.5 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">
                    Scenario: Coastal Monsoon Surge + High Spring Tide
                  </span>
                  <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                    T = 3.0h (Peak Flood)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-surface-0 dark:bg-[#0c1220] border border-border">
                    <div className="text-text-tertiary">Rain Intensity</div>
                    <div className="font-bold text-text-primary font-mono">64.5 mm/h</div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-0 dark:bg-[#0c1220] border border-border">
                    <div className="text-text-tertiary">Tidal Level</div>
                    <div className="font-bold text-critical font-mono">4.85 m CD</div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-0 dark:bg-[#0c1220] border border-border">
                    <div className="text-text-tertiary">Top Risk Ward</div>
                    <div className="font-bold text-orange-500 font-mono">Ward L (Kurla)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-text-tertiary">
                Demarcated screening model; not a 2D pipe-velocity solver.
              </span>
              <Link
                href={`/admin/${citySlug}/simulation`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>Launch Simulation Workspace</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>

          {/* ─── Card 2: Environmental Telemetry Lab ─── */}
          <div className="rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <ActivityIcon size={22} />
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  64 Parameters
                </span>
              </div>

              <h3 className="text-lg font-bold text-text-primary mb-2">Environmental Telemetry</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                Real-time & forecast telemetry spanning weather, hydrology, air quality, marine
                swell, and soil moisture with statutory IMD/CPCB threshold tracking.
              </p>

              {/* Telemetry Metric Pills */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-1 dark:bg-[#111927] border border-border text-xs">
                  <span className="text-text-tertiary">NOAA Heat Index</span>
                  <span className="font-mono font-bold text-text-primary">29.7°C (Normal)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-1 dark:bg-[#111927] border border-border text-xs">
                  <span className="text-text-tertiary">Fine Particulate (PM2.5)</span>
                  <span className="font-mono font-bold text-amber-500">60.8 µg/m³</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-1 dark:bg-[#111927] border border-border text-xs">
                  <span className="text-text-tertiary">Significant Wave Swell</span>
                  <span className="font-mono font-bold text-sky-500">0.40 m (Moderate)</span>
                </div>
              </div>
            </div>

            <Link
              href={`/admin/${citySlug}/telemetry-lab`}
              className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
            >
              <span>Explore Telemetry Lab</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {/* ─── Card 3: Multi-Hazard Intelligence ─── */}
          <div className="rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <AlertTriangleIcon size={22} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Multi-Hazard Intelligence</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                Correlates heavy monsoon precipitation, coastal spring tides, river discharge, and
                extreme heat waves into unified ward-by-ward hazard indexes.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Rainfall Runoff
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Tidal Backwater
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Urban Heat Island
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  River Discharge
                </span>
              </div>
            </div>

            <Link
              href={`/${citySlug}/dashboard`}
              className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
            >
              <span>View Citizen Hazard Hub</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {/* ─── Card 4: Geospatial & Municipal GIS ─── */}
          <div className="rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <MapIcon size={22} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Geospatial Intelligence</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                Authoritative 24 BMC administrative boundaries, 219 unclustered critical facilities
                (pumping stations, fire stations, hospitals), and DEM terrain contours.
              </p>
              <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border text-xs font-mono text-text-secondary space-y-1 mb-6">
                <div>✓ Default OpenStreetMap Base</div>
                <div>✓ 219 Restored Facility Points</div>
                <div>✓ RFC 7946 Polygon Topology</div>
              </div>
            </div>

            <Link
              href={`/admin/map`}
              className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
            >
              <span>Open Hazard GIS Map</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {/* ─── Card 5: Sentinel AI Orchestration ─── */}
          <div className="rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <SparklesIcon size={22} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Sentinel AI Assistant</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                Server-side Groq LLM inference with strict anti-hallucination sanitization. Answers
                citizen questions grounded in structured municipal evidence.
              </p>
              <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border text-xs text-text-secondary space-y-1.5 mb-6">
                <div className="font-semibold text-text-primary">Grounded Reasoning</div>
                <div className="text-[11px] text-text-tertiary">
                  Interprets model observations, explains uncertainty, and links to verified municipal shelters.
                </div>
              </div>
            </div>

            <Link
              href={`/${citySlug}/sentinel`}
              className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
            >
              <span>Consult Sentinel AI</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {/* ─── Card 6: Civic Reporting & Field Response ─── */}
          <div className="rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <ShieldIcon size={22} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Civic Operations & Dispatch</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                Citizen voice & text reporting triaged into high-resolution operational signals with
                deterministic department routing and supervisor proof-of-work state machines.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Stormwater Drains
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Solid Waste
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Health & Sanitation
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-1 border border-border text-text-tertiary">
                  Fire Brigade
                </span>
              </div>
            </div>

            <Link
              href={`/department`}
              className="inline-flex items-center justify-between w-full pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
            >
              <span>Inspect Department Dispatch</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {/* ─── Card 7 (Full 3-Column Width): Reports & Decision Support ─── */}
          <div className="lg:col-span-3 rounded-2xl p-6 sm:p-7 bg-surface-0 dark:bg-[#0c1322] border border-border hover:border-primary/40 shadow-xs transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <FileTextIcon size={18} />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                    Publication-Grade Documentation
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Simulation Report Studio & Vector PDF Dossiers
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Generate structured multi-page PDF dossiers for municipal disaster management
                  cells. Features 1200+ DPI standalone SVG vector maps, chronological time-series
                  charts, full 24-ward matrix tables, and explicit sensor outage disclosures.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <Link
                  href={`/admin/${citySlug}/simulation/report`}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs text-center transition-all"
                >
                  Open Report Studio →
                </Link>
                <a
                  href="/api/admin/reports/simulation-pdf?dossierId=DOS-COASTAL_MONSOON_SURGE-T6H-MVE9F1AC&scope=citywide"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border text-text-primary text-xs font-bold text-center transition-all"
                >
                  Download Sample PDF (630 KB)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
