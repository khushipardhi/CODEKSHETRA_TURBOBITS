/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — High-Precision Telemetry Chart
   Clean SVG multi-series line & bar chart with crosshair tooltips,
   threshold indicator bands, Now marker, forecast shading,
   responsive scaling, and CSV export.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { DownloadIcon } from "@/components/ui/icons";

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  unit: string;
  values: number[];
  type?: "line" | "bar";
  classification?: "OBSERVED" | "FORECAST" | "DERIVED" | "MODELLED";
}

export interface ThresholdLine {
  value: number;
  label: string;
  color: string;
  sourceAuthority?: string;
}

interface TelemetryChartProps {
  title: string;
  subtitle?: string;
  timestamps: string[];
  series: ChartSeries[];
  thresholds?: ThresholdLine[];
  height?: number;
  allowExport?: boolean;
  className?: string;
}

export function TelemetryChart({
  title,
  subtitle,
  timestamps,
  series,
  thresholds = [],
  height = 270,
  allowExport = true,
  className = "",
}: TelemetryChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Check if series has any valid values
  const hasValidData =
    series &&
    series.length > 0 &&
    series.some(
      (s) => s.values && s.values.some((v) => typeof v === "number" && !isNaN(v))
    );

  if (!timestamps || timestamps.length === 0 || !hasValidData) {
    return (
      <div
        className={`p-8 rounded-2xl border border-divider bg-card/60 flex flex-col items-center justify-center text-center space-y-2 ${className}`}
      >
        <span className="text-xl">📊</span>
        <p className="text-xs font-semibold text-text-primary">Telemetry Data Unavailable</p>
        <p className="text-[11px] text-text-tertiary max-w-sm">
          The selected observation interval has no recorded values returned from the external provider.
        </p>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-elevated text-text-secondary border border-divider">
          HTTP Null Payload · Honest Disclosure
        </span>
      </div>
    );
  }

  // Find min and max across all series and thresholds
  let allValues: number[] = [];
  let seriesOnlyValues: number[] = [];
  series.forEach((s) => {
    (s.values || []).forEach((v) => {
      if (typeof v === "number" && !isNaN(v)) {
        allValues.push(v);
        seriesOnlyValues.push(v);
      }
    });
  });
  thresholds.forEach((t) => allValues.push(t.value));

  const isAllZero = seriesOnlyValues.length > 0 && seriesOnlyValues.every((v) => v === 0);

  if (allValues.length === 0) allValues = [0, 10];

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const range = rawMax - rawMin || 1;
  const padding = range * 0.12;
  const nonNegativeUnits = [
    "mm",
    "mm/h",
    "km/h",
    "m",
    "%",
    "µg/m³",
    "AQI",
    "CAQI",
    "J/kg",
    "m³/s",
    "W/m²",
    "s",
  ];
  const hasOnlyNonNegative = series.every(
    (s) => nonNegativeUnits.includes(s.unit) || s.unit.includes("mm") || s.unit.includes("km")
  );
  const minY = rawMin >= 0 && hasOnlyNonNegative ? 0 : Math.floor(rawMin - padding);
  const maxY = Math.ceil(rawMax + padding);
  const totalRange = maxY - minY || 1;

  // Chart dimensions inside SVG
  const svgWidth = 800;
  const svgHeight = height;
  const margin = { top: 28, right: 30, bottom: 35, left: 52 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Coordinate mapping functions
  const getX = (index: number) => {
    if (timestamps.length <= 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (timestamps.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return margin.top + plotHeight - ((clamped - minY) / totalRange) * plotHeight;
  };

  // Determine "Now" (Current Observation) Index
  let nowIndex: number | null = null;
  const now = new Date().toISOString();
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] <= now) {
      nowIndex = i;
    } else {
      break;
    }
  }

  // Primary unit for Y-axis header
  const primaryUnit = series[0]?.unit || "";

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      "Timestamp (IST)",
      ...series.map(
        (s) => `${s.label} [${s.unit}]${s.classification ? ` (${s.classification})` : ""}`
      ),
    ].join(",");
    const rows = timestamps.map((t, idx) => {
      const vals = series.map((s) => (s.values[idx] !== undefined ? s.values[idx] : ""));
      return [t, ...vals].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_telemetry.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`p-5 rounded-2xl border border-divider bg-card shadow-xs transition-all ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              {title}
            </h4>
            {isAllZero && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                0.0 {primaryUnit} (Zero measured in interval)
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Series Legend */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-medium text-[11px]">{s.label}</span>
                {s.classification && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase bg-surface-elevated text-text-tertiary border border-divider">
                    {s.classification}
                  </span>
                )}
              </div>
            ))}
          </div>

          {allowExport && (
            <button
              onClick={handleExportCsv}
              title="Export CSV dataset"
              className="p-1.5 rounded-lg border border-divider hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors text-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              <DownloadIcon size={13} />
              <span className="hidden sm:inline text-[11px] font-semibold">CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (mouseX >= margin.left && mouseX <= margin.left + plotWidth) {
              const fraction = (mouseX - margin.left) / plotWidth;
              const idx = Math.round(fraction * (timestamps.length - 1));
              setHoverIndex(Math.max(0, Math.min(timestamps.length - 1, idx)));
            }
          }}
        >
          {/* Forecast Area Shading (Right of Now) */}
          {nowIndex !== null && nowIndex > 0 && nowIndex < timestamps.length - 1 && (
            <rect
              x={getX(nowIndex)}
              y={margin.top}
              width={margin.left + plotWidth - getX(nowIndex)}
              height={plotHeight}
              fill="currentColor"
              className="text-primary/5"
            />
          )}

          {/* Y Axis Unit Label */}
          <text
            x={margin.left}
            y={margin.top - 10}
            textAnchor="start"
            className="fill-text-tertiary text-[10px] font-mono font-semibold"
          >
            Axis Unit: [{primaryUnit}]
          </text>

          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = minY + totalRange * ratio;
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-divider/60"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-text-tertiary text-[10px] font-mono"
                >
                  {val.toFixed(val > 100 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {/* Threshold Reference Lines */}
          {thresholds.map((t, idx) => {
            const y = getY(t.value);
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke={t.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <text
                  x={margin.left + plotWidth - 4}
                  y={y - 4}
                  textAnchor="end"
                  fill={t.color}
                  className="text-[9px] font-bold uppercase tracking-wider"
                >
                  {t.sourceAuthority ? `[${t.sourceAuthority}] ` : ""}
                  {t.label} ({t.value})
                </text>
              </g>
            );
          })}

          {/* "NOW" Vertical Demarcation Line */}
          {nowIndex !== null && nowIndex > 0 && nowIndex < timestamps.length - 1 && (
            <g>
              <line
                x1={getX(nowIndex)}
                y1={margin.top}
                x2={getX(nowIndex)}
                y2={margin.top + plotHeight}
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <rect
                x={getX(nowIndex) - 22}
                y={margin.top - 18}
                width={44}
                height={16}
                rx={4}
                fill="#3b82f6"
              />
              <text
                x={getX(nowIndex)}
                y={margin.top - 7}
                textAnchor="middle"
                fill="#ffffff"
                className="text-[8px] font-black uppercase font-mono tracking-wider"
              >
                NOW
              </text>
            </g>
          )}

          {/* Data Series Rendering */}
          {series.map((s) => {
            if (s.type === "bar") {
              const barWidth = Math.max(3, (plotWidth / timestamps.length) * 0.65);
              return (
                <g key={s.id}>
                  {s.values.map((v, idx) => {
                    if (typeof v !== "number" || isNaN(v) || v <= 0) return null;
                    const x = getX(idx) - barWidth / 2;
                    const y = getY(v);
                    const zeroY = getY(0);
                    const barHeight = Math.max(1, zeroY - y);
                    return (
                      <rect
                        key={idx}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={s.color}
                        opacity={hoverIndex === idx ? 1 : 0.75}
                        rx={1.5}
                      />
                    );
                  })}
                </g>
              );
            }

            // Line chart
            const points = s.values
              .map((v, idx) => {
                if (typeof v !== "number" || isNaN(v)) return null;
                return `${getX(idx)},${getY(v)}`;
              })
              .filter(Boolean)
              .join(" ");

            return (
              <g key={s.id}>
                {/* Line Path */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data Points */}
                {s.values.map((v, idx) => {
                  if (typeof v !== "number" || isNaN(v)) return null;
                  const isHovered = hoverIndex === idx;
                  return (
                    <circle
                      key={idx}
                      cx={getX(idx)}
                      cy={getY(v)}
                      r={isHovered ? 4.5 : 2}
                      fill={isHovered ? "#fff" : s.color}
                      stroke={s.color}
                      strokeWidth={isHovered ? 2 : 1}
                      className="transition-all"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Crosshair Cursor on Hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={margin.top}
                x2={getX(hoverIndex)}
                y2={margin.top + plotHeight}
                stroke="currentColor"
                className="text-text-secondary"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            </g>
          )}

          {/* X Axis Time Labels */}
          {timestamps.map((t, idx) => {
            const step = Math.max(1, Math.floor(timestamps.length / 6));
            if (idx % step !== 0 && idx !== timestamps.length - 1) return null;
            const label = t.includes("T") ? t.split("T")[1]?.slice(0, 5) : t.slice(-5);
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={margin.top + plotHeight + 18}
                textAnchor="middle"
                className="fill-text-tertiary text-[10px] font-mono"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none z-10 px-3 py-2 rounded-xl bg-surface-elevated/95 backdrop-blur-md border border-divider shadow-md text-xs transition-all"
            style={{
              left: `${Math.min(75, Math.max(15, (getX(hoverIndex) / svgWidth) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1 flex items-center justify-between gap-2">
              <span>Time: {timestamps[hoverIndex]?.replace("T", " ") || "Time"}</span>
              {nowIndex !== null && (
                <span
                  className={`px-1 rounded text-[8px] font-mono font-bold ${
                    hoverIndex <= nowIndex
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {hoverIndex <= nowIndex ? "OBSERVED / CURRENT" : "FORECAST"}
                </span>
              )}
            </div>
            {series.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-text-primary">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                  {s.classification && (
                    <span className="text-[9px] text-text-tertiary font-mono">
                      [{s.classification}]
                    </span>
                  )}
                  :
                </span>
                <span className="font-bold font-mono">
                  {s.values[hoverIndex] !== undefined ? s.values[hoverIndex] : "—"} {s.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
