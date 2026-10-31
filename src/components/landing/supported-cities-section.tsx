"use client";

import React from "react";
import Link from "next/link";
import { CheckCircleIcon, AlertTriangleIcon, ArrowRightIcon } from "@/components/ui/icons";

interface SupportedCitiesSectionProps {
  onSelectCity?: (cityId: string) => void;
}

export function SupportedCitiesSection({ onSelectCity }: SupportedCitiesSectionProps) {
  const cities = [
    {
      id: "mumbai",
      name: "Greater Mumbai (MCGM / BMC)",
      state: "Maharashtra",
      emoji: "🌆",
      maturity: "FULL MATURITY TIER 2",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      description:
        "Comprehensive 2D hydrodynamic inundation screening calibrated against 24 BMC administrative wards, Copernicus 30m DEM topography, and semi-diurnal coastal tide outfalls.",
      capabilities: [
        { label: "24 BMC Wards & 219 Facilities", verified: true },
        { label: "Copernicus GLO-30 DEM (~30m)", verified: true },
        { label: "Coastal Sluice Lockout (Tide ≥ 4.5m)", verified: true },
        { label: "Live Telemetry & 64 Parameters", verified: true },
        { label: "Publication-Grade Vector PDFs", verified: true },
      ],
      limitations: "Micro-curb elevations (<15cm) and subterranean pipe inverts require future sensor calibration.",
      primaryRoute: "/mumbai/dashboard",
      simRoute: "/admin/mumbai/simulation",
    },
    {
      id: "pune",
      name: "Pune (PMC / Pimpri-Chinchwad)",
      state: "Maharashtra",
      emoji: "🏛️",
      maturity: "REGIONAL TELEMETRY & OPERATIONS",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      description:
        "Regional weather and air quality telemetry assimilation with municipal civic reporting and deterministic department dispatch for the Pune metropolitan region.",
      capabilities: [
        { label: "Open-Meteo Weather & AQI Telemetry", verified: true },
        { label: "Municipal Boundary & Localities", verified: true },
        { label: "Civic Reporting & Department Routing", verified: true },
        { label: "Muster Points & Designated Shelters", verified: true },
        { label: "Calibrated 2D Simulation Engine", verified: false },
      ],
      limitations: "2D spatial flood screening simulation is not yet calibrated for Mula-Mutha river basin.",
      primaryRoute: "/pune/dashboard",
      simRoute: null,
    },
    {
      id: "nagpur",
      name: "Nagpur (NMC / Smart City)",
      state: "Maharashtra",
      emoji: "🏛️",
      maturity: "REGIONAL TELEMETRY & OPERATIONS",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      description:
        "Inland central India climate monitoring, thermal heat exposure index, and municipal civic operations tracking for Nagpur Municipal Corporation.",
      capabilities: [
        { label: "Open-Meteo Weather & Thermal Index", verified: true },
        { label: "Municipal Zone Context (Dharampeth, etc.)", verified: true },
        { label: "Civic Reporting & TiDB Work Orders", verified: true },
        { label: "Designated Emergency Shelters", verified: true },
        { label: "Coastal Surge Model", verified: false },
      ],
      limitations: "Inland geography has no coastal storm surge or marine wave model applicability.",
      primaryRoute: "/nagpur/dashboard",
      simRoute: null,
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-0 dark:bg-[#070b12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>MULTI-CITY JURISDICTION INTEGRATION</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            Supported Municipal Jurisdictions
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            We disclose exact data availability and simulation maturity per city.
            Selecting a city card opens its genuine geographic context without silent data substitution.
          </p>
        </div>

        {/* 3 City Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cities.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-surface-1 dark:bg-[#0c1220] border border-border flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1.5 rounded-xl bg-surface-0 dark:bg-[#111927] border border-border shadow-2xs">
                      {c.emoji}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-text-primary leading-tight">{c.name}</h3>
                      <div className="text-xs text-text-tertiary">{c.state}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${c.badgeClass}`}>
                    {c.maturity}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-5">
                  {c.description}
                </p>

                {/* Capabilities List */}
                <div className="space-y-2 mb-6 text-xs">
                  {c.capabilities.map((cap) => (
                    <div key={cap.label} className="flex items-center gap-2">
                      {cap.verified ? (
                        <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangleIcon size={14} className="text-text-tertiary shrink-0" />
                      )}
                      <span className={cap.verified ? "text-text-primary font-medium" : "text-text-tertiary line-through"}>
                        {cap.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Limitation Disclosure */}
                <div className="p-3 rounded-xl bg-surface-2/60 dark:bg-[#111927] border border-border text-[11px] text-text-tertiary mb-6">
                  <strong>Limitation:</strong> {c.limitations}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Link
                  href={c.primaryRoute}
                  onClick={() => onSelectCity?.(c.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>Open {c.name.split(" ")[0]} Hub</span>
                  <ArrowRightIcon size={14} />
                </Link>

                {c.simRoute && (
                  <Link
                    href={c.simRoute}
                    className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                  >
                    Simulate →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
