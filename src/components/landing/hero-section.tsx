"use client";

import React from "react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";
import { CityConfig } from "@/lib/city-context";
import {
  SparklesIcon,
  ArrowRightIcon,
  MapIcon,
  ActivityIcon,
  ShieldIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/ui/icons";

interface HeroSectionProps {
  city: CityConfig;
  onOpenCitySelector?: () => void;
}

export function HeroSection({ city, onOpenCitySelector }: HeroSectionProps) {
  const citySlug = city.slug || "mumbai";

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-accent/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <SparklesIcon size={14} className="text-primary" />
            <span>Multi-Hazard Spatial Simulation & Environmental Telemetry</span>
          </div>

          <button
            onClick={onOpenCitySelector}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-1 hover:bg-surface-2 border border-border text-xs font-medium text-text-secondary transition-all cursor-pointer shadow-2xs"
            title="Change active city"
          >
            <span>{city.emoji}</span>
            <span className="font-semibold text-text-primary">{city.name}</span>
            <span className="text-[10px] text-text-tertiary">Switch City</span>
          </button>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-[1.08] mb-6">
            Understand Your City.
            <br />
            <span className="text-primary">Anticipate Risk.</span>{" "}
            <span>Act With Evidence.</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto font-normal leading-relaxed">
            An integrated urban intelligence platform connecting environmental telemetry,
            geospatial hazard analysis, scenario simulation, AI-assisted interpretation and
            civic response in one operational ecosystem.
          </p>
        </div>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
          <a
            href="#interactive-canvas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white hover:bg-primary-hover font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <span>Explore City Intelligence</span>
            <ArrowRightIcon size={16} />
          </a>

          <Link
            href={`/admin/${citySlug}/simulation`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-1 hover:bg-surface-2 text-text-primary font-semibold text-sm rounded-xl border border-border transition-all"
          >
            <ActivityIcon size={16} className="text-primary" />
            <span>Launch Simulation Lab</span>
          </Link>

          <Link
            href={`/${citySlug}/dashboard`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <MapIcon size={16} />
            <span>Open Citizen Hub</span>
          </Link>
        </div>

        {/* Hero Digital Twin & Spatial Intelligence Visual */}
        <div className="relative max-w-5xl mx-auto rounded-2xl border border-border bg-surface-0 dark:bg-[#0c1220] shadow-xl overflow-hidden">
          {/* Visual Header Strip */}
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-surface-1 dark:bg-[#111827] border-b border-border text-[11px] font-mono text-text-tertiary gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-text-secondary uppercase">
                {city.name} URBAN OBSERVATORY
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">EPSG:4326 WGS-84</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-surface-2 text-text-secondary font-semibold">
                TIER 2 SCREENING MODEL
              </span>
              <span>24 BMC WARDS (A–T)</span>
            </div>
          </div>

          {/* Visual Main Grid */}
          <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 cols: Spatial Map & Inundation Simulation Schematic */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative h-64 sm:h-76 w-full rounded-xl bg-gradient-to-b from-surface-1 to-surface-2 dark:from-[#111928] dark:to-[#0f172a] border border-border/80 p-4 flex flex-col justify-between overflow-hidden">
                {/* Simulated Geographic Grid Overlay */}
                <div
                  className="absolute inset-0 opacity-15 dark:opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* SVG Schematic of Mumbai Coast & Wards */}
                <svg
                  className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none"
                  viewBox="0 0 400 240"
                  fill="none"
                >
                  {/* Western Coastline */}
                  <path
                    d="M 120 10 Q 140 60 150 110 T 160 170 Q 155 210 170 230"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    opacity="0.6"
                  />
                  {/* Ward Boundaries Polygons */}
                  <polygon
                    points="150,40 190,30 210,65 170,75"
                    fill="#38bdf8"
                    fillOpacity="0.12"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="170,75 220,65 240,110 185,120"
                    fill="#ea580c"
                    fillOpacity="0.22"
                    stroke="#ea580c"
                    strokeWidth="1.5"
                  />
                  <text x="188" y="98" fill="#ea580c" fontSize="8" fontWeight="bold">
                    Ward L (Kurla)
                  </text>
                  <polygon
                    points="150,110 185,120 175,165 140,150"
                    fill="#dc2626"
                    fillOpacity="0.25"
                    stroke="#dc2626"
                    strokeWidth="1.5"
                  />
                  <text x="148" y="140" fill="#dc2626" fontSize="8" fontWeight="bold">
                    Ward F/N (Sion)
                  </text>
                  <polygon
                    points="175,165 230,155 240,210 180,215"
                    fill="#10b981"
                    fillOpacity="0.10"
                    stroke="#10b981"
                    strokeWidth="1.2"
                  />
                  <text x="195" y="190" fill="#10b981" fontSize="8">
                    Ward A (Colaba)
                  </text>
                  {/* Sluice Gate Outfall */}
                  <circle cx="150" cy="110" r="4" fill="#0284c7" />
                  <text x="75" y="112" fill="#0284c7" fontSize="7" fontWeight="bold">
                    Mithi Outfall (4.85m Tide)
                  </text>
                </svg>

                {/* Spatial Overlay Badges */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-md bg-surface-0/90 dark:bg-[#111827]/90 border border-border text-[11px] font-semibold text-text-primary backdrop-blur-xs shadow-2xs">
                    Copernicus GLO-30 DEM Topography (30m)
                  </div>
                  <div className="px-2 py-0.5 rounded bg-critical-bg text-critical border border-critical-border text-[10px] font-bold">
                    HIGH WATERLOGGING RISK
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div className="text-[11px] text-text-secondary bg-surface-0/85 dark:bg-[#111827]/85 p-2 rounded-lg border border-border max-w-[280px]">
                    <div className="font-bold text-text-primary">
                      Scenario: Coastal Monsoon Surge (T=3.0h)
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      Precip: 64.5 mm/h · Sluice Outfalls Locked (Tide ≥ 4.5m CD)
                    </div>
                  </div>

                  <Link
                    href={`/admin/${citySlug}/simulation`}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-hover shadow-xs transition-all"
                  >
                    Simulate Scenario →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Telemetry Metrics & Sentinel AI Insight */}
            <div className="lg:col-span-5 space-y-3.5">
              {/* Telemetry Metric Chips */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111827] border border-border">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase">
                    Ambient Temp
                  </div>
                  <div className="text-xl font-bold font-mono text-text-primary">
                    27.8 <span className="text-xs font-normal text-text-tertiary">°C</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ECMWF IFS Reanalysis
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111827] border border-border">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase">
                    Hourly Rainfall
                  </div>
                  <div className="text-xl font-bold font-mono text-text-primary">
                    0.0 <span className="text-xs font-normal text-text-tertiary">mm/h</span>
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                    Open-Meteo Radar Grid
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111827] border border-border">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase">
                    Astronomical Tide
                  </div>
                  <div className="text-xl font-bold font-mono text-text-primary">
                    3.2 <span className="text-xs font-normal text-text-tertiary">m CD</span>
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Ebb Phase (Sluices Open)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-1 dark:bg-[#111827] border border-border">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase">
                    Air Quality (PM2.5)
                  </div>
                  <div className="text-xl font-bold font-mono text-text-primary">
                    60.8 <span className="text-xs font-normal text-text-tertiary">µg/m³</span>
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    CPCB NAAQS 24h Threshold
                  </div>
                </div>
              </div>

              {/* Sentinel AI Grounded Recommendation Card */}
              <div className="p-3.5 rounded-xl bg-surface-1 dark:bg-[#111827] border border-primary/20 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <SparklesIcon size={12} />
                  </div>
                  <span className="text-xs font-bold text-text-primary">
                    Sentinel AI Grounded Synthesis
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  &ldquo;Spring tide peaking at 14:15 IST (4.62m CD). Runoff retention is elevated
                  in saucer sinks around Bail Bazar (Ward L) and Hindmata (Ward F/South).&rdquo;
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-text-tertiary border-t border-border pt-2">
                  <span>Groq qwen/qwen3.8-27b</span>
                  <Link
                    href={`/${citySlug}/sentinel`}
                    className="text-primary font-sans font-semibold hover:underline"
                  >
                    Ask Sentinel →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote Bar */}
          <div className="px-6 py-2.5 bg-surface-1/60 dark:bg-[#0f172a] border-t border-border flex flex-wrap items-center justify-between text-[11px] text-text-tertiary">
            <span>
              Snapshot data verified against Copernicus DEM, ECMWF NWP, and BMC GIS registries.
            </span>
            <span className="font-semibold text-text-secondary">
              Tier 2 Screening Model · Disclosures Apply
            </span>
          </div>
        </div>

        {/* Supported Cities Overview Strip */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <div className="p-3 rounded-xl bg-surface-1/80 border border-border text-center">
            <div className="text-xs font-bold text-text-primary">🌆 Mumbai (MCGM)</div>
            <div className="text-[11px] text-text-tertiary">
              24 Wards · 2D Hydrodynamic Screening · Live Telemetry
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-1/80 border border-border text-center">
            <div className="text-xs font-bold text-text-primary">🏛️ Pune (PMC)</div>
            <div className="text-[11px] text-text-tertiary">
              Regional Telemetry · Civic Operations & Dispatch
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-1/80 border border-border text-center">
            <div className="text-xs font-bold text-text-primary">🏛️ Nagpur (NMC)</div>
            <div className="text-[11px] text-text-tertiary">
              Regional Telemetry · Civic Operations & Dispatch
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
