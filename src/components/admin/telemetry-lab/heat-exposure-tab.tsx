/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Heat & Human Exposure Tab
   NOAA Rothfusz Heat Index regression, thermal stress tiers,
   and municipal Heat Action Plan (HAP) advisory thresholds.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";
import { FlameIcon } from "@/components/ui/icons";

interface HeatExposureTabProps {
  data: any;
}

export function HeatExposureTab({ data }: HeatExposureTabProps) {
  if (!data) return null;
  const { city, timeSeries, derived } = data;
  const timestamps = timeSeries?.timestamps || [];
  const w = timeSeries?.weather || {};
  const currentHeat = derived?.heatIndex;

  // Compute hourly Heat Index array from hourly temps and humidities
  const hourlyTemps: number[] = w.temperature_2m || [];
  const hourlyRH: number[] = w.relative_humidity_2m || [];
  const hourlyHeatIndex: number[] = hourlyTemps.map((temp, idx) => {
    const rh = hourlyRH[idx] ?? 50;
    // Simple inline Rothfusz for charting series
    const T = (temp * 9) / 5 + 32;
    if (T < 80) return temp;
    let HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * rh -
      0.22475541 * T * rh -
      0.00683783 * T * T -
      0.05481717 * rh * rh +
      0.00122874 * T * T * rh +
      0.00085282 * T * rh * rh -
      0.00000199 * T * T * rh * rh;
    return Number((((HI - 32) * 5) / 9).toFixed(1));
  });

  return (
    <div className="space-y-6">
      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              Parameter-to-Impact Navigation
            </span>
            <span className="text-xs font-semibold text-text-primary">
              NOAA Heat Index & Wet Bulb → Urban Heat Island Screening
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            {city.id === "mumbai"
              ? `Evaluate how high ambient temperatures (${currentHeat?.heatIndexCelsius ?? 32}°C Heat Index) combine with high relative humidity and concrete density across dense settlements in Mumbai's Urban Heat Island scenario.`
              : `Spatial simulation calibrated specifically for Greater Mumbai. Inland thermal stress for ${city.name} is evaluated against municipal Heat Action Plan (HAP) advisory tiers.`}
          </p>
        </div>
        {city.id === "mumbai" ? (
          <a
            href={`/admin/mumbai/simulation?scenario=heatwave_urban_furnace&t=4.0`}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
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

      {/* Chart: Ambient vs Apparent vs NOAA Heat Index */}
      <TelemetryChart
        title="Human Thermal Stress: Ambient vs Apparent vs NOAA Heat Index"
        subtitle={`72-Hour biometeorological evaluation in ${city.name} (${city.selectedZone})`}
        timestamps={timestamps}
        series={[
          {
            id: "hi",
            label: "NOAA Heat Index",
            color: "#dc2626",
            unit: "°C",
            classification: "DERIVED",
            values: hourlyHeatIndex,
          },
          {
            id: "apparent",
            label: "Apparent Temp (BOM)",
            color: "#ea580c",
            unit: "°C",
            classification: "MODELLED",
            values: w.apparent_temperature || [],
          },
          {
            id: "ambient",
            label: "Ambient Air Temp (2m)",
            color: "#f59e0b",
            unit: "°C",
            classification: "FORECAST",
            values: w.temperature_2m || [],
          },
        ]}
        thresholds={[
          { value: 32, label: "Extreme Caution (32°C)", color: "#f59e0b", sourceAuthority: "NOAA" },
          { value: 41, label: "Danger Threshold (41°C)", color: "#ea580c", sourceAuthority: "NOAA" },
          { value: 54, label: "Extreme Danger (54°C)", color: "#dc2626", sourceAuthority: "NOAA" },
        ]}
      />

      {/* Heat Stress Cards & Formula Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Heat Stress Card */}
        <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Current Exposure Tier
              </span>
              <h4 className="text-base font-black text-text-primary mt-0.5">
                {currentHeat?.riskTier || "SAFE"}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FlameIcon size={20} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-divider bg-surface-elevated/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Ambient Air Temperature:</span>
              <strong className="font-mono text-text-primary">{currentHeat?.temperatureCelsius ?? "—"}°C</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Relative Humidity:</span>
              <strong className="font-mono text-text-primary">{currentHeat?.relativeHumidity ?? "—"}%</strong>
            </div>
            <div className="flex items-center justify-between border-t border-divider pt-2">
              <span className="font-bold text-text-primary">NOAA Heat Index (Shade):</span>
              <strong className="font-mono text-base font-black text-red-600 dark:text-red-400">
                {currentHeat?.heatIndexCelsius ?? "—"}°C
              </strong>
            </div>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            {currentHeat?.advisoryText || "Normal conditions. Outdoor activities require standard hydration."}
          </p>
        </div>

        {/* Scientific Formula & Audit Card */}
        <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-text-primary">
            Scientific Formulation & Disclosure
          </h4>
          <p className="text-xs text-text-tertiary">
            Rothfusz 9-term polynomial regression model with Steadman boundary adjustments
          </p>

          <div className="p-3 rounded-xl bg-surface-elevated/60 font-mono text-[10px] text-text-secondary border border-divider leading-relaxed overflow-x-auto">
            HI = -42.379 + 2.049·T + 10.143·RH - 0.224·T·RH - 0.0068·T² - 0.054·RH² + 0.0012·T²·RH + 0.00085·T·RH² - 0.00000199·T²·RH²
          </div>

          <div className="p-3 rounded-xl border border-divider bg-surface-elevated/20 text-xs text-text-secondary space-y-1">
            <strong className="text-text-primary block">Meteorological Limitation:</strong>
            <span>
              The Heat Index formula assumes shaded conditions with a light 5-knot breeze. Direct exposure to bright sunlight adds up to <strong>8°C (15°F)</strong> to the effective thermal load.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
