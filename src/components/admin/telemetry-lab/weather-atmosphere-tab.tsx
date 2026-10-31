/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Weather & Atmosphere Tab
   Deep inspection of thermal, barometric, wind, cloud, and CAPE variables.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";

interface WeatherAtmosphereTabProps {
  data: any;
}

export function WeatherAtmosphereTab({ data }: WeatherAtmosphereTabProps) {
  if (!data) return null;
  const { city, timeSeries } = data;
  const w = timeSeries?.weather || {};
  const timestamps = timeSeries?.timestamps || [];

  return (
    <div className="space-y-6">
      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-amber-500/5 to-transparent border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              Parameter-to-Impact Navigation
            </span>
            <span className="text-xs font-semibold text-text-primary">
              Wind Velocity & Gale Gusts → Structural Exposure & Treefall Risk
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            {city.id === "mumbai"
              ? `Evaluate how wind gusts (${w.wind_gusts_10m ? Math.max(...(w.wind_gusts_10m as number[]).filter(Boolean)) : 0} km/h peak) combine with marine storm surge and heavy rainfall across coastal promenades in Mumbai's Cyclone Surge scenario.`
              : `Spatial simulation calibrated specifically for Greater Mumbai. Inland squall patterns in ${city.name} are monitored against municipal treefall and hoarding stability standards.`}
          </p>
        </div>
        {city.id === "mumbai" ? (
          <a
            href={`/admin/mumbai/simulation?scenario=cyclone_wind_surge&t=3.0`}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Inspect in Spatial Simulation Lab</span>
            <span>→</span>
          </a>
        ) : (
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium shrink-0 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800">
            ⚠️ Hydrodynamic simulation calibrated for Mumbai
          </div>
        )}
      </div>

      {/* Chart 1: Barometric Pressure Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TelemetryChart
          title="Surface Pressure vs Mean Sea-Level (MSL)"
          subtitle={`Barometric pressure indicators in ${city.name} (${city.selectedZone})`}
          timestamps={timestamps}
          series={[
            {
              id: "msl",
              label: "Mean Sea Level (MSL)",
              color: "#3b82f6",
              unit: "hPa",
              classification: "FORECAST",
              values: w.pressure_msl || [],
            },
            {
              id: "surface",
              label: "Surface Pressure",
              color: "#6366f1",
              unit: "hPa",
              classification: "FORECAST",
              values: w.surface_pressure || [],
            },
          ]}
          thresholds={[
            { value: 1000, label: "Depression Boundary", color: "#f59e0b", sourceAuthority: "IMD" },
          ]}
        />

        {/* Chart 2: Horizontal Wind Speed vs Wind Gusts */}
        <TelemetryChart
          title="Wind Velocity & Peak Gust Profile"
          subtitle="Sustained horizontal wind at 10m vs peak hourly gusts"
          timestamps={timestamps}
          series={[
            {
              id: "gusts",
              label: "Wind Gusts (10m)",
              color: "#ef4444",
              unit: "km/h",
              classification: "FORECAST",
              values: w.wind_gusts_10m || [],
            },
            {
              id: "speed",
              label: "Sustained Speed (10m)",
              color: "#0ea5e9",
              unit: "km/h",
              classification: "FORECAST",
              values: w.wind_speed_10m || [],
            },
          ]}
          thresholds={[
            { value: 55, label: "Gale Warning (55 km/h)", color: "#ea580c", sourceAuthority: "IMD" },
            { value: 75, label: "Severe Squall (75 km/h)", color: "#dc2626", sourceAuthority: "IMD" },
          ]}
        />
      </div>

      {/* Chart 3 & 4: Multi-Layer Clouds & Convective Energy (CAPE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cloud Layers */}
        <TelemetryChart
          title="Atmospheric Cloud Stratification"
          subtitle="Low (< 2 km), Mid (2–6 km), and High (> 6 km) cloud cover percentage"
          timestamps={timestamps}
          series={[
            {
              id: "low",
              label: "Low Clouds (<2km)",
              color: "#64748b",
              unit: "%",
              values: w.cloud_cover_low || [],
            },
            {
              id: "mid",
              label: "Mid Clouds (2-6km)",
              color: "#94a3b8",
              unit: "%",
              values: w.cloud_cover_mid || [],
            },
            {
              id: "high",
              label: "High Clouds (>6km)",
              color: "#cbd5e1",
              unit: "%",
              values: w.cloud_cover_high || [],
            },
          ]}
        />

        {/* CAPE & Convective Energy */}
        <TelemetryChart
          title="Convective Available Potential Energy (CAPE)"
          subtitle="Atmospheric buoyancy index indicating severe thunderstorm and lightning risk"
          timestamps={timestamps}
          series={[
            {
              id: "cape",
              label: "CAPE",
              color: "#a855f7",
              unit: "J/kg",
              values: w.cape || [],
            },
          ]}
          thresholds={[
            { value: 1500, label: "Moderate Instability", color: "#f59e0b" },
            { value: 2500, label: "Severe Thunderstorm Potential", color: "#dc2626" },
          ]}
        />
      </div>
    </div>
  );
}
