/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Air Quality & Pollutants Tab
   Multi-pollutant time series (PM2.5, PM10, NO2, SO2, O3, CO)
   and side-by-side standard comparison (US EPA vs EU CAQI vs CPCB).
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";

interface AirQualityTabProps {
  data: any;
}

export function AirQualityTab({ data }: AirQualityTabProps) {
  if (!data) return null;
  const { city, timeSeries } = data;
  const timestamps = timeSeries?.timestamps || [];
  const aqi = timeSeries?.airQuality || {};

  return (
    <div className="space-y-6">
      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Parameter-to-Impact Navigation
            </span>
            <span className="text-xs font-semibold text-text-primary">
              CPCB PM2.5 & NO2 Plumes → Public Exposure & Sensitive Group Warnings
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Correlate particulate concentrations with municipal traffic corridors and industrial clusters across {city.name} to dispatch automated advisory alerts to healthcare facilities and schools.
          </p>
        </div>
        <a
          href={`/admin/${city.id}/incidents`}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Dispatch Municipal Alert</span>
          <span>→</span>
        </a>
      </div>

      {/* Chart 1: Particulate Matter (PM2.5 vs PM10) */}
      <TelemetryChart
        title="Particulate Matter Concentrations (PM2.5 vs PM10)"
        subtitle={`Inhalable particulate concentrations in ${city.name} (${city.selectedZone}) with Indian CPCB thresholds`}
        timestamps={timestamps}
        series={[
          {
            id: "pm25",
            label: "PM2.5 (Fine)",
            color: "#ef4444",
            unit: "µg/m³",
            classification: "MODELLED",
            values: aqi.pm2_5 || [],
          },
          {
            id: "pm10",
            label: "PM10 (Coarse)",
            color: "#f59e0b",
            unit: "µg/m³",
            classification: "MODELLED",
            values: aqi.pm10 || [],
          },
        ]}
        thresholds={[
          { value: 60, label: "CPCB PM2.5 Satisfactory", color: "#84cc16", sourceAuthority: "CPCB" },
          { value: 120, label: "CPCB PM2.5 Poor", color: "#ea580c", sourceAuthority: "CPCB" },
          { value: 250, label: "CPCB PM2.5 Severe Alert", color: "#dc2626", sourceAuthority: "CPCB" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 2: US EPA AQI vs European CAQI */}
        <TelemetryChart
          title="Air Quality Indices: US EPA AQI vs European CAQI"
          subtitle="Distinguishing standards: US EPA 0–500 scale vs European CAQI 0–100 scale"
          timestamps={timestamps}
          series={[
            {
              id: "usaqi",
              label: "US EPA AQI",
              color: "#f97316",
              unit: "AQI",
              values: aqi.us_aqi || [],
            },
            {
              id: "euaqi",
              label: "European CAQI",
              color: "#3b82f6",
              unit: "CAQI",
              values: aqi.european_aqi || [],
            },
          ]}
          thresholds={[
            { value: 100, label: "US EPA Moderate Boundary", color: "#f59e0b" },
            { value: 150, label: "US EPA Unhealthy Sensitive", color: "#ef4444" },
          ]}
        />

        {/* Chart 3: Gaseous Combustion Pollutants (NO2, SO2, O3) */}
        <TelemetryChart
          title="Gaseous Pollutants: Nitrogen Dioxide, Sulphur Dioxide & Ozone"
          subtitle="Traffic emissions (NO2), industrial combustion (SO2), and photochemical smog (O3)"
          timestamps={timestamps}
          series={[
            {
              id: "no2",
              label: "Nitrogen Dioxide (NO2)",
              color: "#ea580c",
              unit: "µg/m³",
              values: aqi.nitrogen_dioxide || [],
            },
            {
              id: "so2",
              label: "Sulphur Dioxide (SO2)",
              color: "#8b5cf6",
              unit: "µg/m³",
              values: aqi.sulphur_dioxide || [],
            },
            {
              id: "o3",
              label: "Ground Ozone (O3)",
              color: "#06b6d4",
              unit: "µg/m³",
              values: aqi.ozone || [],
            },
          ]}
          thresholds={[
            { value: 80, label: "CPCB NO2/SO2 Standard (80 µg/m³)", color: "#eab308" },
          ]}
        />
      </div>

      {/* Explanatory Standard Note */}
      <div className="p-4 rounded-2xl border border-divider bg-surface-elevated/40 text-xs text-text-secondary">
        <strong className="text-text-primary">Standard Integrity:</strong> The Telemetry Lab strictly maintains the distinction between US EPA AQI (breakpoint piecewise linear function) and European Common Air Quality Index (CAQI). They are never combined into an artificial composite index.
      </div>
    </div>
  );
}
