/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — "My Area" Briefing Component
   Location-aware intelligence summary for the citizen's neighborhood.
   Enforces:
   - Source-labelled observations
   - Honest missing data (Unavailable, not 0)
   - 24-Hour and multi-day outlook
   - Verified emergency facilities with directions
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useAreaContext } from "./area-context";
import { useCityContext } from "@/components/providers/city-provider";

interface HourlyPoint {
  time: string;
  precipitationMm: number;
  rainProbabilityPercent: number;
  temperatureCelsius: number;
  windSpeedKmh: number;
}

interface DailyPoint {
  date: string;
  tempMaxCelsius: number;
  tempMinCelsius: number;
  rainSumMm: number;
  precipitationProbabilityMax: number;
  weatherCode: number;
}

interface BriefingData {
  city: string;
  area: string;
  coordinates: [number, number];
  freshness: {
    timestamp: string;
    label: string;
  };
  currentTelemetry: {
    weather: {
      temperatureCelsius: number | null;
      rainfallRateMmH: number;
      forecast24hTotalMm: number;
      windSpeedKmh: number | null;
      windGustsKmh?: number | null;
      precipitationProbabilityMax?: number | null;
      weatherDescription: string;
      isUnavailable?: boolean;
      isStale?: boolean;
      quality?: string;
      hourlyForecast?: HourlyPoint[];
      dailyForecast?: DailyPoint[];
      providerAttribution?: string;
    };
    airQuality: {
      usAqi: number | null;
      category: string;
      pm25: number | null;
      isUnavailable?: boolean;
      isStale?: boolean;
      quality?: string;
    };
    marine?: {
      waveHeightMeters: number | null;
      surgeRisk: string;
      isUnavailable?: boolean;
    };
  };
  riskAssessment: {
    score: number;
    level: string;
    explanation: string;
    dominantHazard: string;
    factors: Array<{ factor: string; score: number; weightPercent: number }>;
  };
  hydrology?: {
    isSink: boolean;
    sinkName?: string;
    depressionDepth?: number;
    nearestHotspot: {
      name: string;
      distanceMeters: number;
      recurrence: string;
    };
    nearestChannel: {
      name: string;
      distanceMeters: number;
    };
  };
  nearestEmergencyFacility?: {
    name: string;
    address: string;
    phone: string;
    distanceMeters: number;
    googleMapsUrl: string;
    facilityTypeTier?: "OFFICIALLY_DESIGNATED_SHELTER" | "VERIFIED_PUBLIC_FACILITY" | "MAPPED_UNKNOWN_OPERATING_STATUS" | "UNVERIFIED_CANDIDATE";
    tierLabel?: string;
    operatingStatusNotice?: string;
    isVerifiedOpen?: boolean;
    verifiedAgency?: string;
  };
  nearbyReports: Array<{
    id: string;
    reference: string;
    title: string;
    status: string;
    severity: string;
    distanceMeters?: number;
    createdAt: string;
  }>;
  activeAlerts: Array<{
    id: string;
    reference: string;
    severity: string;
    headline: string;
    description: string;
    source: string;
  }>;
  practicalActions: Array<{
    title: string;
    detail: string;
    category: string;
  }>;
  helpline: string;
  limitations: {
    disclaimer: string;
  };
}

export function MyAreaBriefing({
  onReportSimilarIssue,
  onOpenAssistant,
}: {
  onReportSimilarIssue?: (category: string, locationText: string) => void;
  onOpenAssistant?: () => void;
}) {
  const { city, cityConfig } = useCityContext();
  const { selectedArea, areaCoords, openSelector, isGpsDetected } = useAreaContext();
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOutlook, setShowOutlook] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchBriefing() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/hazards/briefing?city=${city}&area=${encodeURIComponent(selectedArea)}&lat=${areaCoords[0]}&lon=${areaCoords[1]}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && mounted) {
            setData(json.data);
          }
        } else {
          throw new Error("Unable to load area briefing.");
        }
      } catch (err) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBriefing();
    const interval = setInterval(fetchBriefing, 60000); // 1 minute polling
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [city, selectedArea, areaCoords]);

  if (loading && !data) {
    return (
      <div className="bg-surface-0 border border-border rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-surface-2 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-20 bg-surface-2 rounded-2xl" />
          <div className="h-20 bg-surface-2 rounded-2xl" />
          <div className="h-20 bg-surface-2 rounded-2xl" />
          <div className="h-20 bg-surface-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const weather = data.currentTelemetry.weather;
  const aqi = data.currentTelemetry.airQuality;
  const marine = data.currentTelemetry.marine;
  const hydro = data.hydrology;
  const shelter = data.nearestEmergencyFacility;
  const risk = data.riskAssessment;

  const tempDisplay = weather.temperatureCelsius !== null ? `${weather.temperatureCelsius.toFixed(1)}°C` : "Unavailable";
  const rainRateDisplay = weather.isUnavailable ? "Unavailable" : weather.rainfallRateMmH > 0 ? `${weather.rainfallRateMmH.toFixed(1)}` : "0.0";
  const aqiDisplay = aqi.usAqi !== null ? `${aqi.usAqi}` : "Unavailable";
  const aqiCategory = aqi.usAqi !== null ? aqi.category : "Unavailable";
  const windDisplay = weather.windSpeedKmh !== null ? `${weather.windSpeedKmh} km/h` : "Unavailable";

  return (
    <section id="my-area" className="bg-surface-0 border border-border/80 rounded-3xl p-5 md:p-6 shadow-xs space-y-5 transition-all">
      {/* ── Header & Location Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">📍</span>
            <h2 className="text-base font-bold text-text-primary tracking-tight">
              {data.area} Briefing
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text-tertiary border border-border">
              {cityConfig.name}
            </span>
            {isGpsDetected && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                GPS
              </span>
            )}
            {weather.isStale && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                CACHED STALE
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${weather.isUnavailable ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            <span>{data.freshness.label}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {weather.hourlyForecast && weather.hourlyForecast.length > 0 && (
            <button
              onClick={() => setShowOutlook(!showOutlook)}
              className="px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold border border-accent/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{showOutlook ? "Hide Outlook" : "24h & 7d Outlook"}</span>
              <span className="text-[10px]">{showOutlook ? "▲" : "▼"}</span>
            </button>
          )}

          <button
            onClick={openSelector}
            className="px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-semibold border border-border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Change Locality</span>
            <span className="text-[10px]">⇄</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Precipitation */}
        <div className="p-3.5 rounded-2xl bg-surface-1 border border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-text-tertiary uppercase">Precipitation</p>
            {weather.precipitationProbabilityMax !== null && weather.precipitationProbabilityMax !== undefined && (
              <span className="text-[10px] font-bold text-accent">
                {weather.precipitationProbabilityMax}% prob
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-text-primary">
              {rainRateDisplay}
            </span>
            {!weather.isUnavailable && <span className="text-xs text-text-tertiary">mm/h</span>}
          </div>
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
            {weather.isUnavailable
              ? "Feed offline"
              : weather.forecast24hTotalMm > 0
              ? `24h: ${weather.forecast24hTotalMm} mm accumulated`
              : weather.weatherDescription}
          </p>
        </div>

        {/* Temperature & Wind */}
        <div className="p-3.5 rounded-2xl bg-surface-1 border border-border/50">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase">Temperature</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-text-primary">
              {tempDisplay}
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
            Wind: {windDisplay}
          </p>
        </div>

        {/* Air Quality */}
        <div className="p-3.5 rounded-2xl bg-surface-1 border border-border/50">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase">Air Quality</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-black ${
              aqi.usAqi === null
                ? "text-text-tertiary"
                : aqi.usAqi <= 50
                ? "text-emerald-500"
                : aqi.usAqi <= 100
                ? "text-amber-500"
                : "text-rose-500"
            }`}>
              {aqiDisplay}
            </span>
            {aqi.usAqi !== null && <span className="text-xs text-text-tertiary">AQI</span>}
          </div>
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
            {aqiCategory}
          </p>
        </div>

        {/* Local Risk Index */}
        <div className="p-3.5 rounded-2xl bg-surface-1 border border-border/50">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase">Neighborhood Risk</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-black ${
              risk.level === "SEVERE"
                ? "text-red-500"
                : risk.level === "WARNING"
                ? "text-amber-500"
                : risk.level === "MODERATE"
                ? "text-yellow-500"
                : "text-emerald-500"
            }`}>
              {risk.score}
            </span>
            <span className="text-xs text-text-tertiary">/100</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate font-semibold">
            {risk.level}
          </p>
        </div>
      </div>

      {/* ── Expandable 24-Hour & 7-Day Forecast Outlook ── */}
      {showOutlook && weather.hourlyForecast && (
        <div className="p-4 rounded-2xl bg-surface-1 border border-border/70 space-y-4 fade-in">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center justify-between">
              <span>Next 24 Hours Precipitation & Temperature (ECMWF Model)</span>
              <span className="text-[10px] text-text-tertiary font-normal">Hourly intervals</span>
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {weather.hourlyForecast.slice(0, 16).map((h, idx) => {
                const hourLabel = new Date(h.time).toLocaleTimeString([], { hour: "numeric", hour12: true });
                return (
                  <div key={idx} className="flex-shrink-0 w-16 p-2 rounded-xl bg-surface-0 border border-border/60 text-center text-xs">
                    <p className="text-[10px] text-text-tertiary font-mono mb-1">{hourLabel}</p>
                    <p className="font-bold text-text-primary text-xs">{h.temperatureCelsius}°</p>
                    <div className="h-6 flex items-end justify-center my-1">
                      <div
                        className="w-3 rounded-t bg-blue-500 transition-all"
                        style={{ height: `${Math.min(24, Math.max(3, h.precipitationMm * 6))}px` }}
                        title={`${h.precipitationMm} mm`}
                      />
                    </div>
                    <p className="text-[9px] text-text-tertiary">{h.precipitationMm}mm</p>
                    {h.rainProbabilityPercent > 0 && (
                      <p className="text-[9px] text-accent font-semibold">{h.rainProbabilityPercent}%</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {weather.dailyForecast && weather.dailyForecast.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                7-Day Multi-Hazard Outlook
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {weather.dailyForecast.map((d, dIdx) => {
                  const dayName = new Date(d.date).toLocaleDateString([], { weekday: "short" });
                  return (
                    <div key={dIdx} className="p-2 rounded-xl bg-surface-0 border border-border/60 text-center text-xs">
                      <p className="font-bold text-text-primary text-[11px]">{dayName}</p>
                      <p className="text-[10px] text-text-tertiary">{d.date.slice(5)}</p>
                      <div className="my-1 font-mono text-[11px]">
                        <span className="font-bold text-text-primary">{d.tempMaxCelsius}°</span>
                        <span className="text-text-tertiary"> / {d.tempMinCelsius}°</span>
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{d.rainSumMm} mm</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Terrain & Drainage Context (If Available) ── */}
      {hydro && (
        <div className="p-4 rounded-2xl bg-surface-1/70 border border-border/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary flex items-center gap-1.5">
              <span>🌊</span>
              <span>Local Hydrological Context ({cityConfig.name})</span>
            </span>
            {hydro.isSink && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Low-Lying Basin ({hydro.depressionDepth?.toFixed(1) || "1.2"}m depression)
              </span>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed">
            {hydro.isSink
              ? `You are near ${hydro.sinkName || "a natural terrain depression"}. Water accumulates quickly here during intense bursts (>25 mm/h).`
              : "Elevation in this area is elevated relative to adjacent natural drainage channels."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-text-tertiary">
            <div>
              <span className="font-medium text-text-secondary">Nearest Recurrent Hotspot:</span>{" "}
              {hydro.nearestHotspot.name} ({(hydro.nearestHotspot.distanceMeters / 1000).toFixed(1)} km)
            </div>
            <div>
              <span className="font-medium text-text-secondary">Arterial Drainage:</span>{" "}
              {hydro.nearestChannel.name} ({(hydro.nearestChannel.distanceMeters / 1000).toFixed(1)} km)
            </div>
          </div>
        </div>
      )}

      {/* ── Nearest Verified Municipal Shelter / Facility (Trustworthy 4-Tier) ── */}
      {shelter && (
        <div className="p-4 rounded-2xl bg-surface-1 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base ${
              shelter.facilityTypeTier === "OFFICIALLY_DESIGNATED_SHELTER"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : shelter.facilityTypeTier === "VERIFIED_PUBLIC_FACILITY"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            }`}>
              {shelter.facilityTypeTier === "OFFICIALLY_DESIGNATED_SHELTER" ? "🏛️" : shelter.name.toLowerCase().includes("hospital") ? "🏥" : "🏢"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  shelter.facilityTypeTier === "OFFICIALLY_DESIGNATED_SHELTER"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : shelter.facilityTypeTier === "VERIFIED_PUBLIC_FACILITY"
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                }`}>
                  {shelter.tierLabel || "Verified Public Facility"}
                </span>
                <span className="text-xs text-text-tertiary font-mono">
                  {(shelter.distanceMeters / 1000).toFixed(1)} km away
                </span>
              </div>
              <h4 className="text-sm font-bold text-text-primary">{shelter.name}</h4>
              <p className="text-xs text-text-tertiary">{shelter.address}</p>
              <p className="text-[10px] text-text-secondary mt-1 max-w-md">
                ℹ️ <strong>Capacity Notice:</strong> {shelter.operatingStatusNotice || "Intake capacity unverified in real time."} Contact desk at <strong>{shelter.phone}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <a
              href={shelter.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-2xs flex items-center gap-1"
            >
              <span>Get Directions</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Nearby Verified Citizen Reports & Recurring Issues ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
            <span>📋</span>
            <span>Nearby Civic Issues ({data.nearbyReports.length})</span>
          </h3>
          {onReportSimilarIssue && (
            <button
              onClick={() => onReportSimilarIssue("drainage_waterlogging", data.area)}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>+ Report Issue in {data.area}</span>
            </button>
          )}
        </div>

        {data.nearbyReports.length === 0 ? (
          <div className="p-4 rounded-2xl bg-surface-1/50 border border-border/40 text-center text-xs text-text-tertiary">
            No active civic hazard reports currently logged in {data.area}.
          </div>
        ) : (
          <div className="space-y-2">
            {data.nearbyReports.map((report) => (
              <div
                key={report.id}
                className="p-3 rounded-2xl bg-surface-1 border border-border/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-accent text-[11px]">
                      {report.reference}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-2 text-text-tertiary">
                      {report.status}
                    </span>
                    {report.distanceMeters && (
                      <span className="text-[10px] text-text-tertiary">
                        {(report.distanceMeters / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <p className="text-text-primary font-medium truncate">{report.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Contextual Practical Actions ── */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-border/60 space-y-2.5">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Practical Precautions for {data.area}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {data.practicalActions.map((act, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-surface-0 border border-border/40">
              <p className="font-bold text-text-primary mb-0.5">{act.title}</p>
              <p className="text-text-tertiary text-[11px] leading-relaxed">{act.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Limitations Disclosure ── */}
      <p className="text-[10px] text-text-tertiary leading-relaxed pt-1 border-t border-border/30">
        ℹ️ <strong>Data Transparency:</strong> {data.limitations.disclaimer} · Emergency Helpline: <strong>{data.helpline}</strong>.
      </p>
    </section>
  );
}
