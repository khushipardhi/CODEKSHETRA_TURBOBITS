/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Rainfall & Hydrology Tab
   Rolling accumulations (3h, 6h, 12h, 24h), precipitation intensity,
   surface runoff risk, and river discharge hydrographs.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";

interface RainfallHydrologyTabProps {
  data: any;
}

export function RainfallHydrologyTab({ data }: RainfallHydrologyTabProps) {
  if (!data) return null;
  const { city, timeSeries, derived } = data;
  const timestamps = timeSeries?.timestamps || [];
  const w = timeSeries?.weather || {};
  const rolling = derived?.rollingRainfall;

  const rolling3hValues = (rolling?.rolling3h?.series || []).map((s: any) => s.rollingMm);
  const rolling6hValues = (rolling?.rolling6h?.series || []).map((s: any) => s.rollingMm);
  const rolling12hValues = (rolling?.rolling12h?.series || []).map((s: any) => s.rollingMm);
  const rolling24hValues = (rolling?.rolling24h?.series || []).map((s: any) => s.rollingMm);

  return (
    <div className="space-y-6">
      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Parameter-to-Impact Navigation
            </span>
            <span className="text-xs font-semibold text-text-primary">
              Precipitation Intensity → Hydrodynamic Ward Impact
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            {city.id === "mumbai"
              ? `Evaluate how current 6h/24h precipitation accumulations (${rolling?.rolling6h?.maxRollingMm ?? 0} mm) route into Mumbai's saucer-basin wards (F/South, F/North, Kurla L) under hydrodynamic gravity and pump constraints.`
              : `Spatial simulation calibrated specifically for Greater Mumbai's 24 wards (Copernicus GLO-30 DEM & MCGM SWD GIS). Pune and Nagpur ward-level flood routing is in preparation.`}
          </p>
        </div>
        {city.id === "mumbai" ? (
          <a
            href={`/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&t=2.0`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
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

      {/* Chart 1: Multi-Hour Rolling Accumulations */}
      <TelemetryChart
        title="Multi-Hour Rolling Accumulation Spectrum (3h, 6h, 12h, 24h)"
        subtitle="Running sum of precipitation without double counting preceding periods"
        timestamps={timestamps}
        series={[
          {
            id: "roll3",
            label: "Rolling 3h",
            color: "#38bdf8",
            unit: "mm",
            classification: "DERIVED",
            values: rolling3hValues,
          },
          {
            id: "roll6",
            label: "Rolling 6h (Urban Drain)",
            color: "#0284c7",
            unit: "mm",
            classification: "DERIVED",
            values: rolling6hValues,
          },
          {
            id: "roll12",
            label: "Rolling 12h",
            color: "#6366f1",
            unit: "mm",
            classification: "DERIVED",
            values: rolling12hValues,
          },
          {
            id: "roll24",
            label: "Rolling 24h (Daily Standard)",
            color: "#8b5cf6",
            unit: "mm",
            classification: "DERIVED",
            values: rolling24hValues,
          },
        ]}
        thresholds={[
          { value: 64.5, label: "IMD Heavy Rain (64.5mm/24h)", color: "#eab308", sourceAuthority: "IMD" },
          { value: 115.6, label: "IMD Very Heavy Rain (115.6mm/24h)", color: "#ea580c", sourceAuthority: "IMD" },
          { value: 204.5, label: "IMD Extremely Heavy Rain (204.5mm/24h)", color: "#dc2626", sourceAuthority: "IMD" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly Precipitation vs Rain Probability */}
        <TelemetryChart
          title="Hourly Rain Intensity & Probability"
          subtitle="Direct hourly rain volume (mm) compared against model probability"
          timestamps={timestamps}
          series={[
            {
              id: "rain",
              label: "Hourly Rain Rate",
              color: "#0ea5e9",
              unit: "mm/h",
              type: "bar",
              classification: "FORECAST",
              values: w.precipitation || [],
            },
            {
              id: "prob",
              label: "Precip Probability",
              color: "#a855f7",
              unit: "%",
              classification: "FORECAST",
              values: w.precipitation_probability || [],
            },
          ]}
          thresholds={[
            { value: 20, label: "Flash Waterlogging Rate (20mm/h)", color: "#ea580c", sourceAuthority: "MCGM SWD" },
          ]}
        />

        {/* Catchment & River Discharge Assessment */}
        <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Hydrological Catchment & Drainage Assessment
            </h4>
            <p className="text-xs text-text-tertiary mt-0.5">
              Terrain absorption capacity and drainage system saturation
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary block">Peak Rolling 6-Hour Total</span>
                  <span className="text-[11px] text-text-tertiary">Primary indicator for municipal drain capacity</span>
                </div>
                <span className="text-base font-black font-mono text-primary">
                  {rolling?.rolling6h?.maxRollingMm ?? 0} mm
                </span>
              </div>

              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary block">24-Hour Catchment Cumulative</span>
                  <span className="text-[11px] text-text-tertiary">Total volume incident upon local watershed</span>
                </div>
                <span className="text-base font-black font-mono text-primary">
                  {rolling?.rolling24h?.maxRollingMm ?? 0} mm
                </span>
              </div>

              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary block">River Discharge Model (GloFAS)</span>
                  <span className="text-[11px] text-text-tertiary">Copernicus 0.05° European hydrological ensemble</span>
                </div>
                <span className="text-base font-black font-mono text-text-primary">
                  {data?.current?.riverFlood?.discharge !== null ? `${data.current.riverFlood.discharge} m³/s` : "Baseline Flow"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary">
            <strong className="text-text-primary">Hydrological Rule:</strong> Precipitation values are evaluated as rolling sums without double-counting. A 100mm accumulation in 3 hours carries 4× higher waterlogging risk than the same volume dispersed over 24 hours.
          </div>
        </div>
      </div>
    </div>
  );
}
