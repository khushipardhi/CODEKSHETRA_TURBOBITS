"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";

interface SimulationDifferentiatorSectionProps {
  citySlug: string;
}

export function SimulationDifferentiatorSection({ citySlug }: SimulationDifferentiatorSectionProps) {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [timeStep, setTimeStep] = useState<number>(3); // 1 to 6 hours

  const scenarios = [
    {
      id: "coastal_surge",
      name: "Coastal Monsoon Surge + Spring High Tide",
      rainfallIntensity: "64.5 mm/h (IMD Very Heavy)",
      tideStage: "4.85 m CD (High Tide Lockout)",
      description:
        "Severe monsoon cloud band coinciding with astronomical spring high tide. Gravity sluice gates close at ≥4.5m CD, preventing Mithi river discharge.",
      durationHours: 6,
      topWards: [
        { ward: "Ward L (Kurla)", risk: "CRITICAL", depth: "+52 cm", trace: "Saucer Depression (6.9m ASL)" },
        { ward: "Ward F/North (Sion)", risk: "CRITICAL", depth: "+44 cm", trace: "Highway Ponding (4.2m ASL)" },
        { ward: "Ward K/East (Andheri E)", risk: "ELEVATED", depth: "+28 cm", trace: "Subway Invert (8.1m ASL)" },
      ],
      colorScale: "#dc2626",
    },
    {
      id: "severe_cloudburst",
      name: "Localized Cloudburst (100 mm/h Extreme)",
      rainfallIntensity: "100.0 mm/h (Flash Inundation)",
      tideStage: "3.20 m CD (Gravity Flow Active)",
      description:
        "Extreme convective downpour exceeding Mumbai storm drainage design capacity (50 mm/h). Gravity outfalls open, but internal runoff backs up.",
      durationHours: 4,
      topWards: [
        { ward: "Ward F/South (Parel/Hindmata)", risk: "CRITICAL", depth: "+68 cm", trace: "Severe Catchment Convergence" },
        { ward: "Ward G/North (Dharavi)", risk: "CRITICAL", depth: "+54 cm", trace: "High Impervious Density (C=0.85)" },
        { ward: "Ward M/East (Govandi)", risk: "ELEVATED", depth: "+36 cm", trace: "Low Slope Gradient (0.8%)" },
      ],
      colorScale: "#ea580c",
    },
    {
      id: "heat_stress",
      name: "Urban Heat Island & Thermal Exposure",
      rainfallIntensity: "0.0 mm/h (Dry Atmosphere)",
      tideStage: "2.80 m CD (Normal)",
      description:
        "High diurnal solar insolation combined with concrete density and 80% relative humidity, elevating NOAA Heat Index into Extreme Danger tier.",
      durationHours: 6,
      topWards: [
        { ward: "Ward M/West (Chembur)", risk: "DANGER", depth: "43.2 °C HI", trace: "Concrete Density & Low Canopy" },
        { ward: "Ward L (Kurla)", risk: "DANGER", depth: "42.8 °C HI", trace: "High Informal Settlement Density" },
        { ward: "Ward C (Chandanwadi)", risk: "CAUTION", depth: "39.4 °C HI", trace: "High Built-Up Enclosure" },
      ],
      colorScale: "#d97706",
    },
  ];

  const current = scenarios[selectedScenarioIdx];

  // Dynamic calculated susceptibility based on slider timeStep
  const susceptibilityMultiplier = (timeStep / 3).toFixed(2);
  const estimatedRunoffVolume = (64.5 * Number(susceptibilityMultiplier) * 1.4).toFixed(0);

  return (
    <section id="simulation" className="py-20 sm:py-24 border-t border-border bg-surface-1/50 dark:bg-[#070b13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-600 dark:text-orange-400 mb-3">
              <span>CORE DIFFERENTIATOR</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-3">
              Spatial Simulation Lab: Hydrodynamic Screening
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Explore scenario-based inundation susceptibility across all 24 BMC administrative wards.
              Evaluate temporal hyetographs, Copernicus DEM saucer sinks, and coastal outfall sluice lockout.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href={`/admin/${citySlug}/simulation`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover shadow-md transition-all"
            >
              <span>Open Simulation Lab</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* Interactive Scenario Control Canvas */}
        <div className="rounded-2xl border border-border bg-surface-0 dark:bg-[#0c1220] p-6 sm:p-8 shadow-xl">
          {/* Scenario Tab Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8">
            {scenarios.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioIdx(idx)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedScenarioIdx === idx
                    ? "bg-primary/5 dark:bg-primary/10 border-primary text-text-primary shadow-xs"
                    : "bg-surface-1 dark:bg-[#111927] hover:bg-surface-2 border-border text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-primary">
                    Scenario 0{idx + 1}
                  </span>
                  {selectedScenarioIdx === idx && (
                    <CheckCircleIcon size={14} className="text-primary" />
                  )}
                </div>
                <div className="text-xs font-bold text-text-primary leading-snug truncate">
                  {sc.name}
                </div>
              </button>
            ))}
          </div>

          {/* Two-Column Simulation Workbench Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Time-Step Slider & Spatial Vector Preview */}
            <div className="lg:col-span-7 space-y-6">
              {/* Active Scenario Card */}
              <div className="p-4 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{current.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-text-secondary">
                    {current.rainfallIntensity}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {current.description}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-text-tertiary pt-1">
                  <span>Tide: {current.tideStage}</span>
                  <span>·</span>
                  <span>Horizon: {current.durationHours} Hours</span>
                </div>
              </div>

              {/* Time-Step Progression Scrub Slider */}
              <div className="p-4 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <ClockIcon size={16} className="text-primary" />
                    <span>Time-Step Horizon: T = {timeStep}.0 Hours</span>
                  </div>
                  <span className="font-mono text-primary font-bold">
                    Relative Inundation Index: {susceptibilityMultiplier}x
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={timeStep}
                  onChange={(e) => setTimeStep(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                  <span>T = 1.0h (Onset)</span>
                  <span>T = 2.0h</span>
                  <span>T = 3.0h (Peak Flood)</span>
                  <span>T = 4.0h</span>
                  <span>T = 5.0h</span>
                  <span>T = 6.0h (Recession)</span>
                </div>
              </div>

              {/* Vector GIS Elevation & Sluice Lockout Schematic */}
              <div className="relative h-56 rounded-xl bg-gradient-to-b from-surface-0 to-surface-2 dark:from-[#080d18] dark:to-[#0f172a] border border-border p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                <svg className="w-full h-full" viewBox="0 0 380 180" fill="none">
                  {/* Elevation Profile Curve */}
                  <path
                    d="M 20 40 Q 90 120 160 145 T 260 70 Q 320 150 360 160"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* Ponding Water Body in Depression */}
                  <ellipse
                    cx="160"
                    cy="145"
                    rx={40 + timeStep * 8}
                    ry={12 + timeStep * 3}
                    fill={current.colorScale}
                    fillOpacity="0.35"
                    stroke={current.colorScale}
                    strokeWidth="1.5"
                  />
                  <text x="120" y="148" fill="#ffffff" fontSize="9" fontWeight="bold">
                    Ward L (Kurla) Saucer Sink
                  </text>
                  <text x="125" y="159" fill="#ffffff" fontSize="7">
                    Elev: 6.9m ASL · Retention: +{timeStep * 14}%
                  </text>

                  {/* Sluice Gate Representation */}
                  <rect x="335" y="125" width="20" height="35" fill="#dc2626" rx="2" />
                  <text x="245" y="132" fill="#dc2626" fontSize="8" fontWeight="bold">
                    Coastal Sluice Lockout
                  </text>
                  <text x="245" y="143" fill="#dc2626" fontSize="7">
                    Tide: 4.85m CD (Discharge 15%)
                  </text>
                </svg>

                <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                  <span>Demarcation: Tier 2 Screening Model</span>
                  <span>Calculated Runoff: ~{estimatedRunoffVolume} Megalitres</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Top Ward Rankings & Calculation Trace */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-text-tertiary">
                  Top Inundated Wards (T={timeStep}.0h)
                </span>
                <span className="text-[11px] font-mono text-primary font-semibold">
                  24 Wards Evaluated
                </span>
              </div>

              {/* Ward Rankings List */}
              <div className="space-y-2.5">
                {current.topWards.map((w, i) => (
                  <div
                    key={w.ward}
                    className="p-3.5 rounded-xl bg-surface-1 dark:bg-[#111927] border border-border flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-text-tertiary">
                          #{i + 1}
                        </span>
                        <span className="text-sm font-bold text-text-primary">{w.ward}</span>
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">{w.trace}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-critical-bg text-critical border border-critical-border">
                        {w.risk}
                      </span>
                      <div className="text-xs font-mono font-bold text-text-primary mt-1">
                        {w.depth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mathematical Calculation Trace Box */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 dark:bg-[#0f172a] border border-border text-xs font-mono space-y-1.5 text-text-secondary">
                <div className="font-bold text-text-primary text-[11px] uppercase">
                  Runoff Mathematical Formulation:
                </div>
                <div className="text-primary font-semibold">
                  Q = C · I · A (Rational Method)
                </div>
                <div className="text-[11px] text-text-tertiary">
                  C = 0.85 (Built-up Impervious) · I = 64.5 mm/h · A = 2,109 ha
                </div>
                <div className="text-[11px] text-text-tertiary">
                  Saucer Retention = (z_mean - z_min) · SlopeVariance = 2.45m head
                </div>
              </div>

              {/* Explicit Screening Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangleIcon size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Scientific Demarcation:</strong> Screening model calibrated against Copernicus
                  DEM macro-topography. Does not compute sub-grade pipe backwater or curb velocities.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
