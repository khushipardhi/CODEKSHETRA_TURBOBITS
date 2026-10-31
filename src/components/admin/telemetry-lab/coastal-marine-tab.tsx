/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Coastal & Marine Tab (Mumbai)
   Significant wave height, swell dynamics, wave period,
   and coastal high tide overtopping vulnerability.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { TelemetryChart } from "./telemetry-chart";
import { ShieldAlertIcon } from "@/components/ui/icons";

interface CoastalMarineTabProps {
  data: any;
}

export function CoastalMarineTab({ data }: CoastalMarineTabProps) {
  if (!data) return null;
  const { city, timeSeries } = data;

  if (city.id !== "mumbai") {
    return (
      <div className="p-8 rounded-2xl border border-divider bg-card shadow-xs text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl">
          🏙️
        </div>
        <div>
          <h4 className="text-base font-bold text-text-primary">
            Inland Geographic Zone ({city.name})
          </h4>
          <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
            Coastal and marine wave telemetry is geographically restricted to maritime coastal zones (Mumbai). Inland plateau regions do not possess marine coastlines or tidal surge exposure.
          </p>
        </div>
        <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40 text-xs text-text-secondary text-left">
          <strong className="text-text-primary block mb-1">Applicable Inland Hazard Domains:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
            <li>Intense Convective Thunderstorms & Urban Waterlogging</li>
            <li>River Discharge & Watershed Flooding (Mula-Mutha in Pune, Nag River in Nagpur)</li>
            <li>Thermal Heatwave Stress (&gt;43°C threshold)</li>
          </ul>
        </div>
      </div>
    );
  }

  const marine = timeSeries?.marine || {};
  const timestamps = marine?.time || timeSeries?.timestamps || [];

  return (
    <div className="space-y-6">
      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-600/10 via-blue-500/5 to-transparent border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              Parameter-to-Impact Navigation
            </span>
            <span className="text-xs font-semibold text-text-primary">
              Marine Swell & Tidal Wave Height → Coastal Outfall Gate Locking
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Inspect how Arabian Sea wave heights and high spring tides (&gt;4.5m) force BMC floodgates closed, preventing stormwater gravity drainage from Worli, Mahim, and Mithi River.
          </p>
        </div>
        <a
          href={`/admin/mumbai/simulation?scenario=spring_tide_coastal_surge&t=2.0`}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Inspect in Spatial Simulation Lab</span>
          <span>→</span>
        </a>
      </div>

      {/* Chart 1: Wave Heights (Significant, Swell, Wind Waves) */}
      <TelemetryChart
        title="Arabian Sea Wave Dynamics: Significant, Swell & Wind Waves"
        subtitle="Copernicus Marine Environment Monitoring Service (CMEMS) 0.08° coastal grid off Mumbai"
        timestamps={timestamps}
        series={[
          {
            id: "sig",
            label: "Significant Wave Height",
            color: "#0284c7",
            unit: "m",
            classification: "MODELLED",
            values: marine.wave_height || [],
          },
          {
            id: "swell",
            label: "Swell Wave Height",
            color: "#6366f1",
            unit: "m",
            classification: "MODELLED",
            values: marine.swell_wave_height || [],
          },
          {
            id: "windwave",
            label: "Wind-Driven Waves",
            color: "#38bdf8",
            unit: "m",
            classification: "MODELLED",
            values: marine.wind_wave_height || [],
          },
        ]}
        thresholds={[
          { value: 1.8, label: "High Tide Surge Risk (1.8m)", color: "#ea580c", sourceAuthority: "INCOIS" },
          { value: 2.5, label: "Severe Marine Storm (2.5m)", color: "#dc2626", sourceAuthority: "INCOIS" },
        ]}
      />

      {/* Chart 2: Wave Period Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TelemetryChart
          title="Peak Wave Period (Seconds)"
          subtitle="Time interval between wave crests; long periods (>12s) indicate powerful remote swells"
          timestamps={timestamps}
          series={[
            {
              id: "period",
              label: "Wave Period",
              color: "#8b5cf6",
              unit: "s",
              values: marine.wave_period || [],
            },
          ]}
          thresholds={[
            { value: 14, label: "Destructive Swell Period", color: "#dc2626" },
          ]}
        />

        {/* Coastal Vulnerability Card */}
        <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Mumbai Coastal Inundation & Sea State Protocol
            </h4>
            <p className="text-xs text-text-tertiary mt-0.5">
              Correlation with BMC Storm Water Drains floodgates and Arabian Sea high tides
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40">
                <span className="font-bold text-text-primary block">Floodgate Lockout Trigger</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">
                  When high tide exceeds <strong>4.5 meters</strong> or significant wave height exceeds <strong>2.0 meters</strong>, BMC gravity floodgates close automatically to prevent seawater backflow, causing rainwater pooling inland.
                </span>
              </div>

              <div className="p-3 rounded-xl border border-divider bg-surface-elevated/40">
                <span className="font-bold text-text-primary block">Promenade Overtopping Hazard</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">
                  Marine Drive, Worli Sea Face, and Bandra Bandstand experience direct sea spray and boulder displacement during high-swell windows coinciding with astronomical springs.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-text-tertiary border-t border-divider pt-3 flex items-center justify-between">
            <span>Data Source: Copernicus Marine / Open-Meteo Marine API</span>
            <span className="font-mono">Spatial Grid: 0.08° (~9 km)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
