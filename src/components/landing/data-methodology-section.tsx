"use client";

import React from "react";
import { CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";

export function DataMethodologySection() {
  const sources = [
    {
      domain: "Topography & Elevation",
      dataset: "Copernicus GLO-30 DEM",
      provider: "European Space Agency (ESA) & Airbus",
      resolution: "30-Meter Horizontal · 1-Meter Vertical",
      license: "Open Data (CC BY 4.0)",
      usage: "Delineates saucer depression basins and minimum surface elevations across 24 BMC wards.",
    },
    {
      domain: "Atmospheric Forecasts",
      dataset: "ECMWF Integrated Forecasting System (IFS)",
      provider: "European Centre for Medium-Range Weather Forecasts",
      resolution: "0.1° (~11 km Grid Mesh)",
      license: "WMO Open Access / Open-Meteo Gateway",
      usage: "Provides temperature, humidity, surface pressure, and wind speed grids at 1-hour cadence.",
    },
    {
      domain: "Precipitation & Radar",
      dataset: "Open-Meteo Weather API",
      provider: "Open-Meteo & IMD Doppler Radar Assimilation",
      resolution: "0.1° Coordinate Interpolation",
      license: "Creative Commons Attribution 4.0",
      usage: "Hourly precipitation rate, probability curves, and cumulative storm accumulation.",
    },
    {
      domain: "Tidal Hydrodynamics",
      dataset: "Astronomical Tide Model (Mumbai Datum)",
      provider: "Indian National Centre for Ocean Information Services (INCOIS)",
      resolution: "Semi-Diurnal Tidal Curve (Chart Datum)",
      license: "Public Government Telemetry / Research Access",
      usage: "Evaluates gravity drainage outfall closure and estuarine backwater when sea level ≥ 4.5m CD.",
    },
    {
      domain: "Air Quality Telemetry",
      dataset: "CPCB Ambient Monitoring & CAMS Regional",
      provider: "Central Pollution Control Board & Copernicus Atmosphere",
      resolution: "Point Sensor Stations & 0.1° Chemistry Grid",
      license: "Government Open Data License (GODL India)",
      usage: "Measures PM2.5 and PM10 concentrations against Indian National Ambient Air Quality Standards.",
    },
    {
      domain: "Municipal Boundaries",
      dataset: "MCGM Administrative Shapefiles",
      provider: "Brihanmumbai Municipal Corporation & BharatMaps",
      resolution: "Polygon Topology (24 Wards & 219 Facilities)",
      license: "Municipal Administrative GIS Data",
      usage: "Grounds coordinates to administrative ward councils and identifies nearest emergency muster points.",
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-1/40 dark:bg-[#060a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>PROVENANCE & INTEGRITY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-3">
            Data Provenance & Scientific Methodology
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Sentinel City Intelligence strictly attributes all third-party environmental models,
            satellite elevation rasters, and municipal administrative boundary files.
          </p>
        </div>

        {/* Provenance Table */}
        <div className="rounded-2xl border border-border bg-surface-0 dark:bg-[#0c1220] overflow-hidden shadow-xs mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-1 dark:bg-[#111927] text-text-tertiary font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Authoritative Provider</th>
                  <th className="py-3 px-4">Resolution & Grid</th>
                  <th className="py-3 px-4">License</th>
                  <th className="py-3 px-4">Role in Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text-secondary">
                {sources.map((s) => (
                  <tr key={s.dataset} className="hover:bg-surface-1/60 dark:hover:bg-[#111927]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-text-primary">{s.domain}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{s.dataset}</td>
                    <td className="py-3 px-4">{s.provider}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{s.resolution}</td>
                    <td className="py-3 px-4 text-text-tertiary text-[11px]">{s.license}</td>
                    <td className="py-3 px-4 text-text-secondary">{s.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Transparency Box */}
        <div className="p-6 rounded-2xl bg-surface-0 dark:bg-[#0c1220] border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text-primary">
              Scientific Model Disclaimer (Tier 2 Demarcation)
            </h4>
            <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
              Inundation calculations use the Rational Runoff formula combined with static DEM depression depths.
              While effective for municipal screening, this does not replace full 2D shallow-water pipe-flow hydrodynamic simulations (e.g. EPA-SWMM) for engineering works.
            </p>
          </div>
          <span className="shrink-0 text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary">
            WGS-84 · EPSG:4326
          </span>
        </div>
      </div>
    </section>
  );
}
