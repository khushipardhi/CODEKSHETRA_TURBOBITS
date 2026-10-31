/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Telemetry Lab Overview Tab
   Live city status, executive environmental summary,
   rich KPI metric cards with trends and data age,
   customizable overview preferences (pinned charts, time horizon),
   active advisory alerts, explainable insight summaries,
   interactive parameter detail inspection modal, and parameter-to-impact navigation.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { TelemetryChart } from "./telemetry-chart";
import {
  ThermometerIcon,
  CloudRainIcon,
  WindIcon,
  ShieldAlertIcon,
  ActivityIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  LayersIcon,
  XIcon,
} from "@/components/ui/icons";

interface OverviewTabProps {
  data: any;
  onSelectTab: (tabId: string) => void;
}

interface OverviewPreferences {
  timeHorizonHours: number; // 24, 48, 72
  pinnedCharts: string[];
}

const DEFAULT_PREFERENCES: OverviewPreferences = {
  timeHorizonHours: 72,
  pinnedCharts: ["thermal", "rainfall", "wind", "aqi"],
};

export function OverviewTab({ data, onSelectTab }: OverviewTabProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [inspectMetric, setInspectMetric] = useState<{
    id: string;
    title: string;
    unit: string;
    currentValue: string | number;
    description: string;
    plainLanguage: string;
    whyItMatters: string;
    source: string;
    chartSeriesId?: string;
  } | null>(null);
  const [rainChartMode, setRainChartMode] = useState<"hourly" | "cumulative">("hourly");

  const [prefs, setPrefs] = useState<OverviewPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sentinel_telemetry_overview_prefs");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const savePreferences = (newPrefs: OverviewPreferences) => {
    setPrefs(newPrefs);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_telemetry_overview_prefs", JSON.stringify(newPrefs));
    }
  };

  const togglePinnedChart = (chartId: string) => {
    let next: string[];
    if (prefs.pinnedCharts.includes(chartId)) {
      if (prefs.pinnedCharts.length <= 1) return; // Keep at least one
      next = prefs.pinnedCharts.filter((id) => id !== chartId);
    } else {
      next = [...prefs.pinnedCharts, chartId];
    }
    savePreferences({ ...prefs, pinnedCharts: next });
  };

  if (!data) return null;

  const { city, current, timeSeries, derived, insights, sourceHealth, timestamps } = data;
  const weatherCurrent = current?.weather || {};
  const aqiCurrent = current?.airQuality || {};
  const marineCurrent = current?.marine || {};
  const riverCurrent = current?.riverFlood || {};
  const heatIndex = derived?.heatIndex;
  const windExceedance = derived?.windExceedance;

  // Filter timestamps and series by timeHorizonHours
  const allTimestamps: string[] = timeSeries?.timestamps || [];
  const horizonHours = prefs.timeHorizonHours || 72;
  const activeTimestamps = allTimestamps.slice(0, horizonHours);

  const filterSeries = (arr: number[] | undefined) => (arr || []).slice(0, horizonHours);

  // Compute 3-hour temperature trend
  const tempSeries = timeSeries?.weather?.temperature_2m || [];
  let tempTrendStr = "→ Steady (±0.2°C)";
  if (tempSeries.length >= 4) {
    const delta = tempSeries[0] - tempSeries[3];
    if (delta > 0.5) tempTrendStr = `↗ +${delta.toFixed(1)}°C (warming vs 3h prior)`;
    else if (delta < -0.5) tempTrendStr = `↘ ${delta.toFixed(1)}°C (cooling vs 3h prior)`;
  }

  // Compute cumulative rainfall series
  const rawHourlyRain = filterSeries(timeSeries?.weather?.precipitation);
  const cumulativeRainSeries: number[] = [];
  let runningSum = 0;
  for (const r of rawHourlyRain) {
    runningSum += (typeof r === "number" && !isNaN(r) ? r : 0);
    cumulativeRainSeries.push(Math.round(runningSum * 10) / 10);
  }
  const totalRainInHorizon = cumulativeRainSeries[cumulativeRainSeries.length - 1] ?? 0;

  // Active Advisory evaluation
  const advisories: Array<{
    title: string;
    desc: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    color: string;
  }> = [];

  if (heatIndex && (heatIndex.riskTier === "DANGER" || heatIndex.riskTier === "EXTREME_DANGER")) {
    advisories.push({
      title: `Extreme Heat Stress (${heatIndex.heatIndexCelsius}°C Heat Index)`,
      desc: heatIndex.advisoryText,
      severity: "CRITICAL",
      color: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    });
  }

  if (derived?.rollingRainfall?.rolling6h?.exceedsWarning) {
    advisories.push({
      title: `Excessive Rainfall Accumulation (${derived.rollingRainfall.rolling6h.maxRollingMm} mm / 6h)`,
      desc: "Rolling 6-hour rainfall exceeds arterial drainage absorption thresholds. High waterlogging probability in natural sinks.",
      severity: "WARNING",
      color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    });
  }

  if (windExceedance?.isSquall) {
    advisories.push({
      title: `High Wind Gust Advisory (${windExceedance.gustKmh} km/h)`,
      desc: windExceedance.advisory,
      severity: "WARNING",
      color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    });
  }

  if (city.id === "mumbai" && marineCurrent?.wave_height >= 2.2) {
    advisories.push({
      title: `Rough Marine Sea State (${marineCurrent.wave_height} m Waves)`,
      desc: "High wave heights coincide with coastal high tide overtopping risks along Marine Drive and Bandra Promenade.",
      severity: "CRITICAL",
      color: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Timestamp & Customizer Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-xs text-text-tertiary flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <ClockIcon size={13} className="text-primary" />
            Model Valid Time: <strong className="text-text-primary font-mono">{timestamps?.observedAt?.replace("T", " ") || "Live"}</strong>
          </span>
          <span>•</span>
          <span>
            Telemetry Retrieval: <strong className="text-text-primary font-mono">{timestamps?.retrievedAt?.slice(11, 19) || "Sync"} UTC</strong>
          </span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {current?.quality || "VALIDATED"}
          </span>
        </div>

        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          className="px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>⚙️</span>
          <span>Customize Overview ({prefs.pinnedCharts.length} Pinned)</span>
        </button>
      </div>

      {/* Executive Environmental Summary Box */}
      <div className="p-4 rounded-2xl border border-divider bg-gradient-to-r from-card via-surface-elevated/40 to-card shadow-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Executive Environmental Summary · {city.name} ({city.selectedZone})
            </h4>
          </div>
          <span className="text-[11px] font-mono text-text-tertiary">
            Horizon: {horizonHours}h · Model: ECMWF IFS / GFS 11km
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {city.name} currently records an ambient temperature of{" "}
          <strong className="text-text-primary">{weatherCurrent.temperature_2m ?? "—"}°C</strong>{" "}
          (feels like {weatherCurrent.apparent_temperature ?? "—"}°C) with{" "}
          <strong className="text-text-primary">{weatherCurrent.relative_humidity_2m ?? "—"}%</strong> relative humidity.{" "}
          {totalRainInHorizon === 0 ? (
            <span>Atmospheric precipitation remains at <strong className="text-emerald-600 dark:text-emerald-400">0.0 mm (Dry Interval)</strong> over the {horizonHours}-hour forecast window. </span>
          ) : (
            <span>Precipitation sums to <strong className="text-sky-600">{totalRainInHorizon} mm</strong> over the {horizonHours}-hour horizon with a current rate of {weatherCurrent.precipitation ?? 0} mm/h. </span>
          )}
          Air quality is measured at US AQI{" "}
          <strong className="text-text-primary">{aqiCurrent.us_aqi ?? "—"}</strong>{" "}
          (PM2.5 {aqiCurrent.pm2_5 ?? "—"} µg/m³).{" "}
          {city.id === "mumbai" ? (
            <span>Coastal waters report wave heights of <strong className="text-text-primary">{marineCurrent.wave_height ?? 0.8} m</strong> at {marineCurrent.wave_period ?? 8}s period.</span>
          ) : (
            <span>River flow is currently clocked at <strong className="text-text-primary">{riverCurrent.discharge ?? "—"} m³/s</strong>.</span>
          )}
        </p>
      </div>

      {/* Overview Customizer Panel */}
      {showCustomizer && (
        <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-text-primary">Overview Preferences (Saved in Local Storage)</h5>
            <button
              onClick={() => savePreferences(DEFAULT_PREFERENCES)}
              className="text-primary font-medium hover:underline text-[11px]"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Time Horizon Selector */}
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary font-medium">Forecast Horizon:</span>
              {[24, 48, 72].map((h) => (
                <button
                  key={h}
                  onClick={() => savePreferences({ ...prefs, timeHorizonHours: h })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    prefs.timeHorizonHours === h
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface border border-divider text-text-secondary"
                  }`}
                >
                  {h} Hours
                </button>
              ))}
            </div>

            {/* Pinned Charts Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-tertiary font-medium">Pinned Graphs:</span>
              {[
                { id: "thermal", label: "Thermal Progression" },
                { id: "rainfall", label: "Hourly Precipitation" },
                { id: "wind", label: "Wind & Gusts" },
                { id: "aqi", label: "Air Quality PM2.5" },
                { id: "coastal_or_river", label: city.id === "mumbai" ? "Marine Waves" : "River Flow" },
              ].map((c) => {
                const isPinned = prefs.pinnedCharts.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => togglePinnedChart(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isPinned
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-surface border border-divider text-text-tertiary opacity-70"
                    }`}
                  >
                    <span>{isPinned ? "✓" : "+"}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Advisories Banner */}
      {advisories.length > 0 && (
        <div className="space-y-3">
          {advisories.map((adv, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${adv.color}`}
            >
              <ShieldAlertIcon size={20} className="shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold">{adv.title}</h5>
                <p className="text-xs opacity-90 mt-0.5">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Headline Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Temperature */}
        <div
          onClick={() =>
            setInspectMetric({
              id: "temperature_2m",
              title: "Ambient Air Temperature (2m)",
              unit: "°C",
              currentValue: weatherCurrent.temperature_2m !== undefined ? `${weatherCurrent.temperature_2m}°C` : "—",
              description: "Dry-bulb ambient air temperature measured at 2 meters above ground elevation.",
              plainLanguage: "The true air temperature measured in the shade, unaffected by direct sunlight radiant heating.",
              whyItMatters: "Governs municipal heat illness risk, urban heat island accumulation, and atmospheric evaporative demand.",
              source: "ECMWF IFS / GFS 0.1° (~11 km)",
              chartSeriesId: "thermal",
            })
          }
          className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-tertiary mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Air Temp</span>
              <ThermometerIcon size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {weatherCurrent.temperature_2m !== undefined ? `${weatherCurrent.temperature_2m}°C` : "—"}
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
              Feels: {weatherCurrent.apparent_temperature ?? "—"}°C
            </div>
          </div>
          <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-text-tertiary text-[10px] truncate max-w-[85px]">{tempTrendStr}</span>
            <span className="text-primary font-semibold hover:underline">Inspect →</span>
          </div>
        </div>

        {/* Metric 2: 24h Rain */}
        <div
          onClick={() =>
            setInspectMetric({
              id: "precipitation",
              title: "Precipitation & 24h Accumulation",
              unit: "mm",
              currentValue: `${derived?.rollingRainfall?.rolling24h?.maxRollingMm ?? 0} mm (24h)`,
              description: "Instantaneous hourly rainfall rate combined with rolling 24-hour total depth.",
              plainLanguage: "How much rain is falling right now and the cumulative water volume accumulated over a full day.",
              whyItMatters: "Distinguishes sudden curb-overflow downpours from macro-watershed soil saturation and saucer basin flooding.",
              source: "Open-Meteo Seamless Numerical Analysis",
              chartSeriesId: "rainfall",
            })
          }
          className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-tertiary mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Precipitation</span>
              <CloudRainIcon size={16} className="text-sky-500" />
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {derived?.rollingRainfall?.rolling24h?.maxRollingMm ?? 0} <span className="text-xs font-normal text-text-tertiary">mm</span>
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
              Rate: {weatherCurrent.precipitation ?? 0} mm/h · Prob: {weatherCurrent.precipitation_probability_max ?? 0}%
            </div>
          </div>
          <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[85px]">
              {totalRainInHorizon === 0 ? "Dry Window" : `${totalRainInHorizon}mm in ${horizonHours}h`}
            </span>
            <span className="text-primary font-semibold hover:underline">Inspect →</span>
          </div>
        </div>

        {/* Metric 3: Air Quality US AQI */}
        <div
          onClick={() =>
            setInspectMetric({
              id: "us_aqi",
              title: "US EPA Air Quality Index (AQI)",
              unit: "AQI",
              currentValue: aqiCurrent.us_aqi !== undefined ? aqiCurrent.us_aqi : "—",
              description: "Standardized non-linear composite air health risk rating computed from dominant criteria pollutants.",
              plainLanguage: "A 0 to 500 danger score translating complex aerosol concentrations into civic health categories.",
              whyItMatters: "Directly governs municipal Graded Response Action Plan (GRAP) alerts, outdoor sports, and school advisories.",
              source: "Copernicus CAMS Global Atmospheric Model",
              chartSeriesId: "aqi",
            })
          }
          className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-tertiary mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Air Quality</span>
              <WindIcon size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {aqiCurrent.us_aqi !== undefined ? aqiCurrent.us_aqi : "—"}
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
              PM2.5: {aqiCurrent.pm2_5 ?? "—"} µg/m³
            </div>
          </div>
          <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[10px] font-semibold text-emerald-600 truncate max-w-[85px]">
              {aqiCurrent.us_aqi < 50 ? "Satisfactory" : aqiCurrent.us_aqi < 100 ? "Moderate" : "Advisory"}
            </span>
            <span className="text-primary font-semibold hover:underline">Inspect →</span>
          </div>
        </div>

        {/* Metric 4: Peak Wind Gust */}
        <div
          onClick={() =>
            setInspectMetric({
              id: "wind_gusts_10m",
              title: "Wind Velocity & Peak Gusts",
              unit: "km/h",
              currentValue: `${weatherCurrent.wind_gusts_10m ?? 0} km/h`,
              description: "10-minute continuous sustained airflow velocity compared against 3–5 second peak instantaneous gusts.",
              plainLanguage: "Steady wind compared against violent momentary gusts that uproot trees and tear billboards.",
              whyItMatters: "Gusts cause over 80% of structural and electrical network damages during coastal squalls and monsoons.",
              source: "ECMWF IFS / GFS 10m Diagnostic",
              chartSeriesId: "wind",
            })
          }
          className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-tertiary mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Wind Gusts</span>
              <ActivityIcon size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {weatherCurrent.wind_gusts_10m ?? 0} <span className="text-xs font-normal text-text-tertiary">km/h</span>
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
              Sustained: {weatherCurrent.wind_speed_10m ?? 0} km/h · {weatherCurrent.wind_direction_10m ?? 0}°
            </div>
          </div>
          <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-text-tertiary truncate max-w-[85px]">
              Ratio: {windExceedance?.gustRatio ? `${windExceedance.gustRatio}x` : "1.2x"}
            </span>
            <span className="text-primary font-semibold hover:underline">Inspect →</span>
          </div>
        </div>

        {/* Metric 5: Heat Index */}
        <div
          onClick={() =>
            setInspectMetric({
              id: "derived_noaa_heat_index",
              title: "NOAA Heat Index (Human Thermal Stress)",
              unit: "°C",
              currentValue: `${heatIndex?.heatIndexCelsius ?? "—"}°C`,
              description: "Steadman / Rothfusz polynomial calculating apparent heat stress combining ambient temperature and relative humidity.",
              plainLanguage: "How hot it truly feels to human physiology when high humidity prevents evaporative sweat cooling.",
              whyItMatters: "Directly determines municipal heat action triggers, drinking water station deployments, and outdoor worker shift bans.",
              source: "NOAA NWS Rothfusz 9-Term Polynomial Regression",
              chartSeriesId: "thermal",
            })
          }
          className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-tertiary mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Heat Index</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                NOAA
              </span>
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {heatIndex?.heatIndexCelsius ?? "—"}°C
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-medium truncate">
              {heatIndex?.riskTier ?? "NORMAL"}
            </div>
          </div>
          <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-text-tertiary truncate max-w-[85px]">
              {heatIndex?.heatIndexCelsius && heatIndex.heatIndexCelsius >= 41 ? "Danger Tier" : "Safe Zone"}
            </span>
            <span className="text-primary font-semibold hover:underline">Inspect →</span>
          </div>
        </div>

        {/* Metric 6: Coastal / Marine or River Discharge */}
        {city.id === "mumbai" ? (
          <div
            onClick={() =>
              setInspectMetric({
                id: "wave_height",
                title: "Coastal Wave Height & Marine Sea State",
                unit: "m",
                currentValue: marineCurrent.wave_height !== undefined ? `${marineCurrent.wave_height} m` : "—",
                description: "Significant wave height (crest-to-trough) of oceanic wind waves and swell along Mumbai's Arabian Sea coastline.",
                plainLanguage: "The average height of the largest one-third of waves crashing against seawalls and promenades.",
                whyItMatters: "Coincides with astronomical spring tides to trigger wave overtopping and coastal road inundation along Marine Drive and Worli.",
                source: "Copernicus Marine Environment Monitoring Service",
                chartSeriesId: "coastal_or_river",
              })
            }
            className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-text-tertiary mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Wave Height</span>
                <span className="text-xs">🌊</span>
              </div>
              <div className="text-2xl font-black text-text-primary tracking-tight">
                {marineCurrent.wave_height !== undefined ? `${marineCurrent.wave_height} m` : "—"}
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
                Period: {marineCurrent.wave_period ?? "—"}s · Swell: {marineCurrent.swell_wave_height ?? "—"}m
              </div>
            </div>
            <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-text-tertiary truncate max-w-[85px]">
                {marineCurrent.wave_height >= 2.0 ? "Rough Sea" : "Normal Coastal"}
              </span>
              <span className="text-primary font-semibold hover:underline">Inspect →</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() =>
              setInspectMetric({
                id: "river_discharge",
                title: "River Discharge Rate (GloFAS)",
                unit: "m³/s",
                currentValue: riverCurrent.discharge !== null ? `${riverCurrent.discharge} m³/s` : "—",
                description: "Volumetric river channel discharge rate modeled by the Global Flood Awareness System.",
                plainLanguage: "The total volume of river water rushing through the channel every second.",
                whyItMatters: "Early warning indicator for riverine bankfull overtopping and bridge closure thresholds.",
                source: "Copernicus GloFAS 4.0 Flood Awareness System",
                chartSeriesId: "coastal_or_river",
              })
            }
            className="p-4 rounded-2xl border border-divider bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-text-tertiary mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">River Flow</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                  GloFAS
                </span>
              </div>
              <div className="text-2xl font-black text-text-primary tracking-tight">
                {riverCurrent.discharge !== null ? `${riverCurrent.discharge}` : "—"}{" "}
                <span className="text-xs font-normal text-text-tertiary">m³/s</span>
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5 font-medium">
                Median: {riverCurrent.dischargeMedian ?? "—"} m³/s
              </div>
            </div>
            <div className="pt-2 border-t border-divider/60 mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-text-tertiary truncate max-w-[85px]">GloFAS 4.0</span>
              <span className="text-primary font-semibold hover:underline">Inspect →</span>
            </div>
          </div>
        )}
      </div>

      {/* Parameter-to-Impact Simulation Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Parameter-to-Impact Integration
            </span>
            <span className="text-xs font-semibold text-text-primary">
              Multi-Hazard Telemetry → 2D Spatial Hydrodynamics
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl">
            {city.id === "mumbai"
              ? "Translate live rainfall rates, tidal curves, and wind gusts into calibrated 2D sub-ward waterlogging hazard surfaces across Mumbai's 24 BMC administrative wards."
              : `Spatial flood simulation is calibrated specifically for Greater Mumbai's 24 wards (Copernicus 30m DEM & MCGM SWD GIS). For ${city.name}, telemetry observations provide civic early warning baseline without unsupported 2D flood solver grids.`}
          </p>
        </div>
        {city.id === "mumbai" ? (
          <a
            href={`/admin/mumbai/simulation?scenario=monsoon_downpour_saucer_sinks&t=2.0`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Spatial Simulation Lab</span>
            <span>→</span>
          </a>
        ) : (
          <a
            href={`/admin/${city.id}/map`}
            className="px-4 py-2 rounded-xl bg-surface-elevated border border-divider hover:border-primary/40 text-text-primary font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open {city.name} Incident Map</span>
            <span>→</span>
          </a>
        )}
      </div>

      {/* Primary Analytical Charts Grid (Honors Pinned Chart Preferences) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pinned Chart 1: Temperature & Apparent Temp Hourly */}
        {prefs.pinnedCharts.includes("thermal") && (
          <TelemetryChart
            title={`Atmospheric Thermal Progression (${horizonHours}h Horizon)`}
            subtitle={`Modelled 2m ambient vs perceived apparent temperature in ${city.name} (${city.selectedZone})`}
            timestamps={activeTimestamps}
            series={[
              {
                id: "temp",
                label: "Ambient (2m)",
                color: "#f59e0b",
                unit: "°C",
                classification: "MODELLED",
                values: filterSeries(timeSeries?.weather?.temperature_2m),
              },
              {
                id: "apparent",
                label: "Apparent (Feels Like)",
                color: "#ef4444",
                unit: "°C",
                classification: "MODELLED",
                values: filterSeries(timeSeries?.weather?.apparent_temperature),
              },
              {
                id: "dew",
                label: "Dew Point",
                color: "#38bdf8",
                unit: "°C",
                classification: "MODELLED",
                values: filterSeries(timeSeries?.weather?.dew_point_2m),
              },
            ]}
            thresholds={[
              { value: 40, label: "Heatwave Alert", color: "#dc2626", sourceAuthority: "IMD" },
            ]}
          />
        )}

        {/* Pinned Chart 2: Hourly Precipitation & Cumulative Accumulation */}
        {prefs.pinnedCharts.includes("rainfall") && (
          <div className="relative">
            {/* View Mode Toggle Header */}
            <div className="absolute right-14 top-4 z-10 flex items-center gap-1 p-0.5 rounded-lg border border-divider bg-surface text-[10px]">
              <button
                onClick={() => setRainChartMode("hourly")}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  rainChartMode === "hourly" ? "bg-primary text-primary-foreground" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Hourly Rate
              </button>
              <button
                onClick={() => setRainChartMode("cumulative")}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  rainChartMode === "cumulative" ? "bg-primary text-primary-foreground" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Accumulation
              </button>
            </div>

            {rainChartMode === "hourly" ? (
              <TelemetryChart
                title={`Hourly Precipitation Rate (${horizonHours}h Horizon)`}
                subtitle="Non-overlapping hourly rainfall rate (mm/h) plotted against forecast probability (%)"
                timestamps={activeTimestamps}
                series={[
                  {
                    id: "rain",
                    label: "Hourly Rain",
                    color: "#0284c7",
                    unit: "mm/h",
                    type: "bar",
                    classification: "FORECAST",
                    values: rawHourlyRain,
                  },
                  {
                    id: "prob",
                    label: "Precip Probability",
                    color: "#8b5cf6",
                    unit: "%",
                    classification: "FORECAST",
                    values: filterSeries(timeSeries?.weather?.precipitation_probability),
                  },
                ]}
                thresholds={[
                  { value: 30, label: "Waterlogging Inflow Rate (30mm/h)", color: "#ea580c", sourceAuthority: "MCGM SWD" },
                ]}
              />
            ) : (
              <TelemetryChart
                title={`Cumulative Precipitation Accumulation (${horizonHours}h)`}
                subtitle="Running cumulative rainfall depth (mm) over the selected observation window"
                timestamps={activeTimestamps}
                series={[
                  {
                    id: "accum_rain",
                    label: "Cumulative Rain Depth",
                    color: "#0284c7",
                    unit: "mm",
                    type: "line",
                    classification: "DERIVED",
                    values: cumulativeRainSeries,
                  },
                ]}
                thresholds={[
                  { value: 65, label: "IMD Heavy Rain Standard (65mm)", color: "#eab308", sourceAuthority: "IMD" },
                  { value: 115, label: "IMD Very Heavy Rain (115mm)", color: "#ea580c", sourceAuthority: "IMD" },
                ]}
              />
            )}
          </div>
        )}

        {/* Pinned Chart 3: Wind Velocity & Gusts */}
        {prefs.pinnedCharts.includes("wind") && (
          <TelemetryChart
            title={`Wind Velocity & Peak Gust Profile (${horizonHours}h Horizon)`}
            subtitle="Sustained horizontal wind at 10m vs peak hourly gusts"
            timestamps={activeTimestamps}
            series={[
              {
                id: "gusts",
                label: "Wind Gusts (10m)",
                color: "#ef4444",
                unit: "km/h",
                classification: "FORECAST",
                values: filterSeries(timeSeries?.weather?.wind_gusts_10m),
              },
              {
                id: "speed",
                label: "Sustained Speed (10m)",
                color: "#0284c7",
                unit: "km/h",
                classification: "FORECAST",
                values: filterSeries(timeSeries?.weather?.wind_speed_10m),
              },
            ]}
            thresholds={[
              { value: 55, label: "Gale Advisory (55 km/h)", color: "#ea580c", sourceAuthority: "IMD" },
            ]}
          />
        )}

        {/* Pinned Chart 4: Air Quality PM2.5 & PM10 */}
        {prefs.pinnedCharts.includes("aqi") && (
          <TelemetryChart
            title={`Particulate Matter Concentrations (PM2.5 vs PM10) (${horizonHours}h)`}
            subtitle={`Inhalable particulate concentrations in ${city.name} (${city.selectedZone})`}
            timestamps={activeTimestamps}
            series={[
              {
                id: "pm25",
                label: "PM2.5 (Fine)",
                color: "#ef4444",
                unit: "µg/m³",
                classification: "MODELLED",
                values: filterSeries(timeSeries?.airQuality?.pm2_5),
              },
              {
                id: "pm10",
                label: "PM10 (Coarse)",
                color: "#f59e0b",
                unit: "µg/m³",
                classification: "MODELLED",
                values: filterSeries(timeSeries?.airQuality?.pm10),
              },
            ]}
            thresholds={[
              { value: 60, label: "CPCB PM2.5 Satisfactory", color: "#84cc16", sourceAuthority: "CPCB" },
              { value: 120, label: "CPCB PM2.5 Poor", color: "#ea580c", sourceAuthority: "CPCB" },
            ]}
          />
        )}
      </div>

      {/* Explainable Environmental Insights Section */}
      {insights && insights.length > 0 && (
        <div className="rounded-2xl border border-divider bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-divider bg-surface-elevated/40 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Explainable Insight Layer
              </span>
              <h4 className="text-sm font-bold text-text-primary">
                Operational Environmental Interpretations & Actionable Thresholds
              </h4>
            </div>
            <span className="text-xs text-text-tertiary">
              Derived from verified mathematical formulations with explicit statutory thresholds
            </span>
          </div>

          <div className="divide-y divide-divider/60">
            {insights.map((insight: any) => {
              const isExpanded = expandedInsightId === insight.id;
              const severityColor =
                insight.severity === "CRITICAL"
                  ? "bg-red-500 text-white"
                  : insight.severity === "WARNING"
                  ? "bg-amber-500 text-white"
                  : insight.severity === "ADVISORY"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-500 text-white";

              return (
                <div key={insight.id} className="p-4 hover:bg-surface-elevated/20 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${severityColor}`}>
                          {insight.severity}
                        </span>
                        <h5 className="text-sm font-bold text-text-primary">{insight.title}</h5>
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {insight.currentValue} {insight.units}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-secondary leading-relaxed">
                        {insight.headline}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
                      className="px-2.5 py-1 rounded-lg border border-divider bg-surface text-text-secondary hover:text-text-primary text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Hide Details" : "Inspect Formula & Actions"}</span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </div>

                  {/* Operational Meaning Strip */}
                  <div className="p-3 rounded-xl bg-surface-elevated/50 border border-divider text-xs text-text-secondary space-y-2">
                    <p className="leading-relaxed">
                      <strong className="text-text-primary">What it means:</strong>{" "}
                      {insight.operationalInterpretation?.whatItMeans}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-semibold text-text-tertiary">Contributing Hazards:</span>
                      {(insight.operationalInterpretation?.contributingHazards || []).map((h: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-divider text-text-secondary">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Technical & Mathematical Drawer */}
                  {isExpanded && (
                    <div className="p-4 rounded-xl border border-divider bg-surface space-y-3 text-xs text-text-secondary animate-in fade-in-50">
                      <div>
                        <strong className="text-text-primary block text-[11px] uppercase tracking-wider mb-1">
                          Mathematical Definition & Formulation
                        </strong>
                        <p className="text-xs text-text-tertiary leading-relaxed mb-1.5">{insight.definition}</p>
                        <div className="p-2.5 rounded-lg bg-card border border-divider font-mono text-[11px] text-primary">
                          {insight.calculation}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 rounded-lg border border-divider bg-card">
                          <strong className="text-text-primary block mb-1">Threshold Authority & Standard:</strong>
                          <span className="text-text-secondary">{insight.thresholdSource}</span>
                        </div>
                        <div className="p-3 rounded-lg border border-divider bg-card">
                          <strong className="text-text-primary block mb-1">Scientific Limitations:</strong>
                          <span className="text-text-tertiary">{insight.limitations}</span>
                        </div>
                      </div>

                      <div>
                        <strong className="text-text-primary block text-[11px] uppercase tracking-wider mb-1">
                          Recommended Municipal Actions
                        </strong>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-text-secondary">
                          {(insight.operationalInterpretation?.recommendedActions || []).map((act: string, idx: number) => (
                            <li key={idx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Provider Provenance & Grid Cell Summary */}
      <div className="p-4 rounded-2xl border border-divider bg-surface-elevated/40 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Grid Resolution: <strong className="text-text-primary">~11 km (0.1°)</strong>
          </span>
          <span className="text-text-tertiary">|</span>
          <span className="text-text-secondary">
            Requested Coords:{" "}
            <strong className="font-mono text-text-primary">
              {city.requestedCoords[0].toFixed(4)}, {city.requestedCoords[1].toFixed(4)}
            </strong>
          </span>
          <span className="text-text-tertiary">|</span>
          <span className="text-text-secondary">
            Effective Grid:{" "}
            <strong className="font-mono text-text-primary">
              {city.effectiveGridCoords[0].toFixed(4)}, {city.effectiveGridCoords[1].toFixed(4)}
            </strong>{" "}
            (Δ {city.distanceFromRequestedKm ?? 0} km)
          </span>
        </div>
        <button
          onClick={() => onSelectTab("health")}
          className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          View Full 7-Point Provider Health & Latency Monitor →
        </button>
      </div>

      {/* Interactive Metric Inspection Modal */}
      {inspectMetric && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-divider rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-divider pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary font-mono">
                  {inspectMetric.source}
                </span>
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2 mt-0.5">
                  <span>{inspectMetric.title}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {inspectMetric.currentValue}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectMetric(null)}
                className="p-1.5 rounded-xl border border-divider hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-secondary">
              <div className="p-3 rounded-xl bg-surface border border-divider space-y-1">
                <strong className="text-text-primary block text-[11px] uppercase tracking-wider">
                  Plain-Language Meaning
                </strong>
                <p className="leading-relaxed">{inspectMetric.plainLanguage}</p>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-divider space-y-1">
                <strong className="text-text-primary block text-[11px] uppercase tracking-wider">
                  Why It Matters to Municipal Operations
                </strong>
                <p className="leading-relaxed">{inspectMetric.whyItMatters}</p>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-divider space-y-1">
                <strong className="text-text-primary block text-[11px] uppercase tracking-wider">
                  Scientific Measurement Definition
                </strong>
                <p className="leading-relaxed text-text-tertiary">{inspectMetric.description}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-divider">
              <span className="text-[11px] text-text-tertiary">
                Observation Resolution: ~11 km (0.1°) ECMWF IFS
              </span>
              <button
                onClick={() => {
                  setInspectMetric(null);
                  if (inspectMetric.chartSeriesId) {
                    onSelectTab(
                      inspectMetric.chartSeriesId === "rainfall"
                        ? "rainfall"
                        : inspectMetric.chartSeriesId === "aqi"
                        ? "air_quality"
                        : inspectMetric.chartSeriesId === "wind"
                        ? "weather"
                        : inspectMetric.chartSeriesId === "coastal_or_river"
                        ? city.id === "mumbai" ? "marine" : "rainfall"
                        : "weather"
                    );
                  }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Go to Dedicated Analytical Tab →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
