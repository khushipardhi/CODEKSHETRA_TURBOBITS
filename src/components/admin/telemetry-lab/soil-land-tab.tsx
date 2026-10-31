/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Soil & Land Surface Tab
   Multi-depth soil moisture fractions, subsoil temperature,
   evapotranspiration, and runoff acceleration risk.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";

interface SoilLandTabProps {
  data: any;
}

export function SoilLandTab({ data }: SoilLandTabProps) {
  if (!data) return null;
  const { city, timeSeries } = data;
  const w = timeSeries?.weather || {};
  const timestamps = timeSeries?.timestamps || [];

  return (
    <div className="space-y-6">
      {/* Chart 1: Volumetric Soil Moisture at Multiple Depths */}
      <TelemetryChart
        title="Volumetric Soil Moisture Across Stratified Depths"
        subtitle={`Topsoil (0–1 cm) vs subsoil (1–3 cm) volumetric moisture in ${city.name} (${city.selectedZone})`}
        timestamps={timestamps}
        series={[
          {
            id: "m01",
            label: "Topsoil Moisture (0-1cm)",
            color: "#059669",
            unit: "m³/m³",
            values: w.soil_moisture_0_to_1cm || [],
          },
          {
            id: "m13",
            label: "Subsoil Moisture (1-3cm)",
            color: "#0d9488",
            unit: "m³/m³",
            values: w.soil_moisture_1_to_3cm || [],
          },
        ]}
        thresholds={[
          { value: 0.38, label: "Soil Saturation Limit (0.38 m³/m³)", color: "#ea580c" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 2: Soil Temperature Stratification */}
        <TelemetryChart
          title="Soil Temperature Profile (Surface vs 6 cm)"
          subtitle="Direct skin temperature (0 cm) vs shallow root-zone temperature (6 cm)"
          timestamps={timestamps}
          series={[
            {
              id: "t0",
              label: "Surface Soil (0cm)",
              color: "#d97706",
              unit: "°C",
              values: w.soil_temperature_0cm || [],
            },
            {
              id: "t6",
              label: "Root Zone (6cm)",
              color: "#b45309",
              unit: "°C",
              values: w.soil_temperature_6cm || [],
            },
          ]}
        />

        {/* Chart 3: FAO Reference Evapotranspiration */}
        <TelemetryChart
          title="FAO-56 Reference Evapotranspiration (ET₀)"
          subtitle="Hourly rate of moisture returning to atmosphere via vegetation transpiration and soil evaporation"
          timestamps={timestamps}
          series={[
            {
              id: "et0",
              label: "FAO ET₀",
              color: "#3b82f6",
              unit: "mm/h",
              type: "bar",
              values: w.et0_fao_evapotranspiration || [],
            },
            {
              id: "actual_et",
              label: "Actual ET",
              color: "#6366f1",
              unit: "mm/h",
              values: w.evapotranspiration || [],
            },
          ]}
        />
      </div>

      <div className="p-4 rounded-2xl border border-divider bg-surface-elevated/40 text-xs text-text-secondary">
        <strong className="text-text-primary">Hydrological Interpretation:</strong> When topsoil moisture reaches saturation (≥ 0.38 m³/m³), infiltration capacity drops to near zero. Subsequent rainfall is converted directly into 100% surface runoff, rapidly filling low-lying sinks and urban roadway underpasses.
      </div>
    </div>
  );
}
