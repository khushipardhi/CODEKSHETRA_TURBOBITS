/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Historical Analysis Tab
   ECMWF ERA5 Atmospheric Reanalysis replay, multi-day historical
   trends, baseline anomalies, and explicit data-type labelling.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { TelemetryChart } from "./telemetry-chart";
import { ClockIcon, CalendarIcon, ActivityIcon, CheckCircleIcon } from "@/components/ui/icons";

interface HistoricalAnalysisTabProps {
  data: any;
  city: string;
  onRefreshHistorical: (start: string, end: string) => void;
  isLoading?: boolean;
}

export function HistoricalAnalysisTab({
  data,
  city,
  onRefreshHistorical,
  isLoading = false,
}: HistoricalAnalysisTabProps) {
  const [startDate, setStartDate] = useState("2024-07-01");
  const [endDate, setEndDate] = useState("2024-07-07");

  const hist = data?.historical;
  const hourly = hist?.hourly || {};
  const timestamps = hourly?.time || [];
  const currentHourly = data?.timeSeries?.weather || {};
  const currentTimes = data?.timeSeries?.timestamps || [];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshHistorical(startDate, endDate);
  };

  // Build baseline comparison series (aligning first N hours of current with historical)
  const comparisonHours = Math.min(timestamps.length, currentTimes.length, 72);
  const compTimestamps = currentTimes.slice(0, comparisonHours);
  const currentTempsSlice = (currentHourly.temperature_2m || []).slice(0, comparisonHours);
  const histTempsSlice = (hourly.temperature_2m || []).slice(0, comparisonHours);

  return (
    <div className="space-y-6">
      {/* Historical Controls & Time Range Selector */}
      <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                HISTORICAL REANALYSIS (ERA5)
              </span>
              <span className="text-xs text-text-tertiary">0.25° Reanalysis Grid (~28 km)</span>
            </div>
            <h4 className="text-base font-black text-text-primary mt-1">
              Historical Meteorological Replay & Baseline Analysis
            </h4>
            <p className="text-xs text-text-tertiary mt-0.5">
              ECMWF ERA5 continuous atmospheric reanalysis. Grounded retrospective meteorological modeling.
            </p>
          </div>

          <form onSubmit={handleApply} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-tertiary font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-divider bg-surface text-text-primary font-mono text-xs focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-tertiary font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-divider bg-surface text-text-primary font-mono text-xs focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Querying Archive..." : "Load Archive →"}
            </button>
          </form>
        </div>

        {/* Data Classification Provenance Badges */}
        <div className="p-3.5 rounded-xl border border-divider bg-surface-elevated/40 space-y-2 text-xs">
          <strong className="text-text-primary block text-[11px] uppercase tracking-wider">
            Authoritative Provenance Classification Standards:
          </strong>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-card border border-divider">
              <span className="font-bold text-amber-600 block">1. Historical Reanalysis</span>
              <span className="text-text-tertiary">ERA5 global physical assimilation (~28 km). Used as climatic baseline.</span>
            </div>
            <div className="p-2 rounded-lg bg-card border border-divider">
              <span className="font-bold text-blue-600 block">2. Past Archived Forecast</span>
              <span className="text-text-tertiary">Numerical forecast snapshots saved at runtime prior to event.</span>
            </div>
            <div className="p-2 rounded-lg bg-card border border-divider">
              <span className="font-bold text-emerald-600 block">3. Local Station Reading</span>
              <span className="text-text-tertiary">Point sensor telemetry from verified municipal AWS or CAAQMS.</span>
            </div>
          </div>
        </div>

        {/* Scientific Integrity Disclosure */}
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-300">
          <strong>Scientific Integrity Disclosure:</strong> These historical records represent <strong>numerical atmospheric reanalysis (ERA5)</strong>, which assimilates global satellite, radar, and balloon sounding data into a coherent physical grid. They are <strong>not</strong> direct local weather station recordings and should be used for baseline anomaly estimation rather than point-specific legal claims.
        </div>
      </div>

      {/* Historical vs Current Baseline Comparison Chart */}
      {timestamps.length > 0 && compTimestamps.length > 0 && (
        <div className="space-y-5">
          <TelemetryChart
            title="Climatic Baseline Comparison: Current Forecast vs ERA5 Historical Reanalysis"
            subtitle={`Comparing current 72h temperature forecast against historical reference window (${hist?.startDate} to ${hist?.endDate})`}
            timestamps={compTimestamps}
            series={[
              {
                id: "current_temp",
                label: "Current Forecast (2m)",
                color: "#ef4444",
                unit: "°C",
                classification: "FORECAST",
                values: currentTempsSlice,
              },
              {
                id: "hist_baseline",
                label: `ERA5 Reanalysis Baseline (${hist?.startDate})`,
                color: "#64748b",
                unit: "°C",
                classification: "OBSERVED",
                values: histTempsSlice,
              },
            ]}
          />
        </div>
      )}

      {/* Historical Time Series Charts */}
      {timestamps.length > 0 ? (
        <div className="space-y-5">
          <TelemetryChart
            title={`ERA5 Historical Temperature Profile (${hist?.startDate} to ${hist?.endDate})`}
            subtitle="Hourly 2-meter air temperature retrospective from ECMWF ERA5"
            timestamps={timestamps}
            series={[
              {
                id: "hist_temp",
                label: "ERA5 2m Air Temperature",
                color: "#f59e0b",
                unit: "°C",
                classification: "OBSERVED",
                values: hourly.temperature_2m || [],
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TelemetryChart
              title="ERA5 Historical Precipitation Accumulation"
              subtitle="Retrospective hourly rainfall events recorded in reanalysis model"
              timestamps={timestamps}
              series={[
                {
                  id: "hist_rain",
                  label: "Hourly Rain",
                  color: "#0284c7",
                  unit: "mm",
                  type: "bar",
                  classification: "OBSERVED",
                  values: hourly.precipitation || [],
                },
              ]}
            />

            <TelemetryChart
              title="ERA5 Historical Atmospheric Pressure & Wind"
              subtitle="Surface barometric pressure and wind velocity during historical window"
              timestamps={timestamps}
              series={[
                {
                  id: "hist_pressure",
                  label: "Surface Pressure",
                  color: "#6366f1",
                  unit: "hPa",
                  classification: "OBSERVED",
                  values: hourly.surface_pressure || [],
                },
                {
                  id: "hist_wind",
                  label: "Wind Speed (10m)",
                  color: "#06b6d4",
                  unit: "km/h",
                  classification: "OBSERVED",
                  values: hourly.wind_speed_10m || [],
                },
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-divider bg-card/60 text-center space-y-3">
          <span className="text-2xl">🏛️</span>
          <h5 className="font-bold text-sm text-text-primary">Historical Reanalysis Data Ready to Query</h5>
          <p className="text-xs text-text-tertiary max-w-md mx-auto leading-relaxed">
            Select a start and end date above and click &quot;Load Archive&quot; to fetch verified ECMWF ERA5 continuous atmospheric reanalysis series.
          </p>
        </div>
      )}
    </div>
  );
}
