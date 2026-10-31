/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Zone Comparison Tab
   Direct multi-zone microclimate comparison tool.
   Exposes requested coordinates vs effective model grid cells,
   detects shared provider grid cells honestly, and handles missing series.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { TelemetryChart } from "./telemetry-chart";
import { CheckCircleIcon, MapPinIcon, ActivityIcon, ShieldAlertIcon } from "@/components/ui/icons";

interface ZoneComparisonTabProps {
  data: any;
  city: any;
  onCompareZonesChange: (zones: string[]) => void;
}

export function ZoneComparisonTab({
  data,
  city,
  onCompareZonesChange,
}: ZoneComparisonTabProps) {
  const comparison = data?.comparison || [];
  const localities = city?.localities || [];
  const [selectedParam, setSelectedParam] = useState<"temperature" | "relativeHumidity" | "precipitation" | "windSpeed">("temperature");

  // Selected zone names
  const [selectedZones, setSelectedZones] = useState<string[]>(
    comparison.length > 0
      ? comparison.map((c: any) => c.name)
      : localities.slice(0, 3).map((l: any) => l.name)
  );

  const toggleZone = (name: string) => {
    let next: string[];
    if (selectedZones.includes(name)) {
      if (selectedZones.length <= 1) return; // Keep at least one
      next = selectedZones.filter((n) => n !== name);
    } else {
      if (selectedZones.length >= 4) return; // Cap at 4
      next = [...selectedZones, name];
    }
    setSelectedZones(next);
    onCompareZonesChange(next);
  };

  // Color mapping for zones
  const colors = ["#f59e0b", "#0ea5e9", "#10b981", "#8b5cf6"];

  // Prepare chart series from comparison data
  const timestamps = comparison[0]?.hourly?.time || [];

  const paramSeries = comparison.map((comp: any, idx: number) => {
    const isShared = comp.isSharedGridCell;
    const cleanName = comp.name.split("/")[0]?.trim() || comp.name;
    const label = isShared
      ? `${cleanName} (Shared Cell)`
      : cleanName;

    let values: number[] = [];
    let unit = "°C";

    if (selectedParam === "temperature") {
      values = comp.hourly?.temperature || [];
      unit = "°C";
    } else if (selectedParam === "relativeHumidity") {
      values = comp.hourly?.relativeHumidity || [];
      unit = "%";
    } else if (selectedParam === "precipitation") {
      values = comp.hourly?.precipitation || [];
      unit = "mm/h";
    } else if (selectedParam === "windSpeed") {
      values = comp.hourly?.windSpeed || [];
      unit = "km/h";
    }

    return {
      id: `${selectedParam}_${comp.name}`,
      label,
      color: colors[idx % colors.length],
      unit,
      type: selectedParam === "precipitation" ? ("bar" as const) : ("line" as const),
      classification: comp.hasMissingData ? ("UNAVAILABLE" as const) : ("MODELLED" as const),
      values,
    };
  });

  const anySharedCell = comparison.some((z: any) => z.isSharedGridCell);
  const anyMissingData = comparison.some((z: any) => z.hasMissingData);

  return (
    <div className="space-y-6">
      {/* Zone Selector Header */}
      <div className="p-5 rounded-2xl border border-divider bg-card shadow-xs space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Cross-Zone Microclimate & Grid Snapping Analysis ({city.name})
            </h4>
            <p className="text-xs text-text-tertiary mt-0.5">
              Compare up to 4 municipal zones or wards simultaneously. Inspects independent coordinate resolution and model grid cells.
            </p>
          </div>

          {/* Metric Selector for Comparison Chart */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-divider bg-surface">
            {[
              { id: "temperature", label: "Air Temp (°C)" },
              { id: "relativeHumidity", label: "Humidity (%)" },
              { id: "precipitation", label: "Precip (mm/h)" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedParam(m.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedParam === m.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {localities.map((loc: any) => {
            const isSelected = selectedZones.some(
              (n) => n.toLowerCase().includes(loc.name.toLowerCase()) || loc.name.toLowerCase().includes(n.toLowerCase())
            );
            return (
              <button
                key={loc.name}
                onClick={() => toggleZone(loc.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-divider bg-surface hover:bg-surface-elevated text-text-secondary"
                }`}
              >
                <MapPinIcon size={12} />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Grid Notification Banner */}
      {anySharedCell && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ActivityIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block">Shared Numerical Grid Cell Detected:</strong>
            <p className="leading-relaxed text-[11px]">
              Certain selected wards are located within &lt;5 km of each other and snap to the exact same ECMWF ~11 km (0.1°) provider grid cell. Sentinel City Intelligence displays identical telemetry values honestly, without inventing artificial microclimate variance.
            </p>
          </div>
        </div>
      )}

      {/* Missing Data Notification Banner */}
      {anyMissingData && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
          <ShieldAlertIcon size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block">Incomplete Comparison (Data Unavailable):</strong>
            <p className="leading-relaxed text-[11px]">
              One or more selected localities returned null/empty series from the provider. Missing series are rendered without fabricated fill values.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Analytical Table */}
      <div className="rounded-2xl border border-divider bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-divider bg-surface-elevated/40 flex items-center justify-between">
          <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Spatial Resolution & Telemetry Divergence Table
          </h5>
          <span className="text-[11px] text-text-tertiary">
            Comparing {comparison.length} Municipal Localities
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-divider bg-surface-elevated/20 text-text-tertiary uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Zone / Locality</th>
                <th className="py-3 px-4">Requested Coords</th>
                <th className="py-3 px-4">Effective Grid Cell</th>
                <th className="py-3 px-4">Air Temp</th>
                <th className="py-3 px-4">Rel Humidity</th>
                <th className="py-3 px-4">Surface Pressure</th>
                <th className="py-3 px-4">Wind Speed</th>
                <th className="py-3 px-4">Grid Cell Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/60">
              {comparison.map((z: any, idx: number) => {
                const reqLat = z.requestedCoords?.[0]?.toFixed(4);
                const reqLon = z.requestedCoords?.[1]?.toFixed(4);
                const gridLat = z.effectiveGridCoords?.[0]?.toFixed(4);
                const gridLon = z.effectiveGridCoords?.[1]?.toFixed(4);

                return (
                  <tr key={idx} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-text-primary flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span>{z.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-text-secondary">
                      [{reqLat}, {reqLon}]
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-primary font-bold">
                      [{gridLat}, {gridLon}]
                    </td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {z.current?.temperature !== null ? `${z.current.temperature}°C` : "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {z.current?.relativeHumidity !== null ? `${z.current.relativeHumidity}%` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {z.current?.surfacePressure !== null ? `${z.current.surfacePressure} hPa` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {z.current?.windSpeed !== null ? `${z.current.windSpeed} km/h` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {z.hasMissingData ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                          Data Unavailable
                        </span>
                      ) : z.isSharedGridCell ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Shared ({z.sharedWith?.[0]?.split("/")[0] || "Neighbour"})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Distinct (Δ {z.distanceFromRequestedKm ?? 0} km)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Zone Parameter Comparison Chart */}
      {timestamps.length > 0 && (
        <TelemetryChart
          title={`Cross-Zone Profile: ${selectedParam === "temperature" ? "Air Temperature (°C)" : selectedParam === "relativeHumidity" ? "Relative Humidity (%)" : "Hourly Precipitation (mm/h)"}`}
          subtitle={`Comparing hourly ${selectedParam} across selected municipal zones in ${city.name}`}
          timestamps={timestamps}
          series={paramSeries}
        />
      )}

      {/* Root-Cause Investigation Card */}
      <div className="p-5 rounded-2xl border border-divider bg-surface-elevated/40 space-y-3 text-xs text-text-secondary">
        <h5 className="font-bold text-text-primary text-sm flex items-center gap-2">
          <ActivityIcon size={16} className="text-primary" />
          Technical Investigation: Why Nearby Zones May Share Values
        </h5>
        <p className="leading-relaxed">
          Open-Meteo utilizes numerical atmospheric models with physical grid cell spacing:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-[11px]">
          <li>
            <strong>ECMWF IFS High-Resolution:</strong> ~11 km (0.1°) horizontal resolution.
          </li>
          <li>
            <strong>GFS Global:</strong> ~25 km (0.25°) resolution.
          </li>
          <li>
            <strong>Grid Snapping Reality:</strong> If two urban localities (e.g. Sitabuldi and Dharampeth in Nagpur, or Colaba and Nariman Point in Mumbai) are separated by &lt;3 km, both coordinates fall into the <em>exact same model grid cell</em>. The numerical model returns identical values.
          </li>
          <li>
            <strong>Distant Zones Divergence:</strong> Zones separated by &gt;8 km (e.g., Kalamna in East Nagpur vs MIHAN in South Nagpur, or Colaba vs Borivali in Mumbai) span different grid cells and display genuinely distinct temperatures, pressures, and rain rates.
          </li>
        </ul>
        <p className="text-[11px] font-medium text-text-tertiary pt-1 border-t border-divider">
          Sentinel City Intelligence displays both requested and effective grid coordinates transparently, never fabricating false variation between adjacent micro-neighbourhoods.
        </p>
      </div>
    </div>
  );
}
