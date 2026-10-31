/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Environmental Telemetry Lab
   Master Console Workspace for Admin Environmental Intelligence.
   
   Integrates:
   - 11 Analytical Modules & Workspaces
   - 60+ Parameter Registry & Search
   - Real-time Multi-Parameter Data Feeds
   - Multi-Zone Microclimate Comparison & Grid Cell Snapping Analysis
   - ECMWF ERA5 Historical Reanalysis Replay
   - Derived Metrics (Rolling Rain, NOAA Heat Index, Gust Exceedance)
   - Zero-Mock Honesty Safeguards
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useCityContext } from "@/components/providers/city-provider";
import { CITIES, DEFAULT_CITY } from "@/lib/city-context";
import { OverviewTab } from "./overview-tab";
import { ParameterExplorerTab } from "./parameter-explorer-tab";
import { WeatherAtmosphereTab } from "./weather-atmosphere-tab";
import { RainfallHydrologyTab } from "./rainfall-hydrology-tab";
import { AirQualityTab } from "./air-quality-tab";
import { HeatExposureTab } from "./heat-exposure-tab";
import { CoastalMarineTab } from "./coastal-marine-tab";
import { SoilLandTab } from "./soil-land-tab";
import { HistoricalAnalysisTab } from "./historical-analysis-tab";
import { ZoneComparisonTab } from "./zone-comparison-tab";
import { DataQualityTab } from "./data-quality-tab";
import { TelemetryReportModal } from "./telemetry-report-modal";
import {
  ActivityIcon,
  SearchIcon,
  ThermometerIcon,
  CloudRainIcon,
  WindIcon,
  FlameIcon,
  LayersIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  DownloadIcon,
} from "@/components/ui/icons";

export function TelemetryLabView() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const pathCity = routeParams?.city as string | undefined;
  const cityCtx = useCityContext();
  const currentCity = pathCity && CITIES[pathCity] ? pathCity : (cityCtx?.city || DEFAULT_CITY);
  const cityConfig = CITIES[currentCity] || CITIES[DEFAULT_CITY];

  const urlTab = searchParams ? searchParams.get("tab") : null;
  const urlZone = searchParams ? searchParams.get("zone") : null;
  const [activeTab, setActiveTab] = useState<string>(urlTab || "overview");
  const [selectedZone, setSelectedZone] = useState<string>(urlZone || "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Historical query dates
  const [histDates, setHistDates] = useState<{ start: string; end: string } | null>(null);
  // Zone comparison array
  const [comparisonZones, setComparisonZones] = useState<string[]>([]);

  // Fetch telemetry lab data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        city: currentCity,
        tab: activeTab,
      });

      if (selectedZone) {
        params.set("zone", selectedZone);
      }

      if (comparisonZones.length > 0) {
        params.set("compareZones", comparisonZones.join(","));
      }

      if (histDates) {
        params.set("startDate", histDates.start);
        params.set("endDate", histDates.end);
      }

      const res = await fetch(`/api/hazards/telemetry-lab?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch telemetry lab data`);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "API returned unhandled failure");

      setData(json);
    } catch (err: any) {
      console.error("[TelemetryLab] Fetch error:", err);
      setError(err.message || "Failed to load telemetry workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentCity, activeTab, selectedZone, comparisonZones, histDates]);

  // Tab Navigation Definitions
  const tabs = [
    { id: "overview", label: "Overview", icon: <ActivityIcon size={14} /> },
    { id: "parameters", label: "Parameter Explorer", icon: <SearchIcon size={14} /> },
    { id: "weather", label: "Weather & Atmosphere", icon: <ThermometerIcon size={14} /> },
    { id: "rainfall", label: "Rainfall & Hydrology", icon: <CloudRainIcon size={14} /> },
    { id: "air_quality", label: "Air Quality", icon: <WindIcon size={14} /> },
    { id: "heat", label: "Heat & Human Exposure", icon: <FlameIcon size={14} /> },
    { id: "marine", label: "Coastal & Marine", icon: <span className="text-xs">🌊</span> },
    { id: "soil", label: "Soil & Land", icon: <LayersIcon size={14} /> },
    { id: "historical", label: "Historical Analysis", icon: <ClockIcon size={14} /> },
    { id: "comparison", label: "Zone Comparison", icon: <MapPinIcon size={14} /> },
    { id: "health", label: "Data Quality & Sources", icon: <CheckCircleIcon size={14} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Workspace Header */}
      <div className="p-6 rounded-3xl border border-divider bg-card shadow-sm space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                SENTINEL CITY INTELLIGENCE — TELEMETRY LAB
              </span>
              <span className="text-xs text-text-tertiary">
                Multi-Hazard Telemetry & Environmental Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight mt-1 flex items-center gap-2.5">
              <span>{cityConfig.name} Environmental Intelligence Console</span>
              <span className="text-lg">{cityConfig.emoji}</span>
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5 max-w-3xl leading-relaxed">
              Analytical workspace for discovering, comparing, and auditing verified multi-hazard parameters, numerical models, rolling accumulations, and microclimate zone divergence.
            </p>
          </div>

          {/* Location & Controls Strip */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Zone Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-divider bg-surface text-xs">
              <MapPinIcon size={14} className="text-primary shrink-0" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-text-primary font-semibold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="">{cityConfig.name} (City Center)</option>
                {cityConfig.localities.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              title="Refresh Telemetry Feeds"
            >
              <RefreshCwIcon size={14} className={loading ? "animate-spin text-primary" : ""} />
            </button>

            {/* Export PDF Report Button */}
            <button
              id="btn-open-telemetry-report-modal"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="Generate downloadable publication-grade Telemetry PDF report"
            >
              <DownloadIcon size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* Sticky Tab Navigation Rail */}
      <div className="sticky top-14 z-30 bg-card/95 dark:bg-zinc-950/95 backdrop-blur-md p-2 rounded-2xl border border-divider shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (typeof window !== "undefined") {
                    const u = new URL(window.location.href);
                    u.searchParams.set("tab", tab.id);
                    window.history.replaceState({}, "", u.toString());
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-500/30 border border-blue-700"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Cross-workspace navigation link to Spatial Analysis / Simulation */}
        <a
          href={currentCity === "mumbai" ? `/admin/${currentCity}/simulation` : `/admin/${currentCity}/map`}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-xs hover:bg-accent hover:text-white transition-all shrink-0 cursor-pointer"
          title={currentCity === "mumbai" ? "Switch to Spatial Simulation Lab for multi-hazard modeling" : `Switch to ${cityConfig.name} Spatial Incident Map`}
        >
          <span>🌐 {currentCity === "mumbai" ? "Spatial Lab" : `${cityConfig.name} Spatial Map`}</span>
          <span>→</span>
        </a>
      </div>

      {/* Loading Skeleton */}
      {loading && !data && activeTab !== "parameters" && (
        <div className="p-16 rounded-3xl border border-divider bg-card shadow-xs text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-text-tertiary">
            Synchronizing live multi-hazard feeds and numerical models...
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && activeTab !== "parameters" && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <span>Failed to load environmental telemetry: {error}</span>
          <button
            onClick={() => fetchData()}
            className="px-3 py-1 rounded-lg bg-red-500/20 font-bold hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab Workspaces */}
      {(data || activeTab === "parameters") && (
        <div className="space-y-6">
          {activeTab === "overview" && data && (
            <OverviewTab data={data} onSelectTab={(t) => setActiveTab(t)} />
          )}

          {activeTab === "parameters" && (
            <ParameterExplorerTab city={currentCity} />
          )}

          {activeTab === "weather" && (
            <WeatherAtmosphereTab data={data} />
          )}

          {activeTab === "rainfall" && (
            <RainfallHydrologyTab data={data} />
          )}

          {activeTab === "air_quality" && (
            <AirQualityTab data={data} />
          )}

          {activeTab === "heat" && (
            <HeatExposureTab data={data} />
          )}

          {activeTab === "marine" && (
            <CoastalMarineTab data={data} />
          )}

          {activeTab === "soil" && (
            <SoilLandTab data={data} />
          )}

          {activeTab === "historical" && (
            <HistoricalAnalysisTab
              data={data}
              city={currentCity}
              onRefreshHistorical={(start, end) => setHistDates({ start, end })}
              isLoading={loading}
            />
          )}

          {activeTab === "comparison" && (
            <ZoneComparisonTab
              data={data}
              city={cityConfig}
              onCompareZonesChange={(zones) => setComparisonZones(zones)}
            />
          )}

          {activeTab === "health" && (
            <DataQualityTab data={data} />
          )}
        </div>
      )}

      {/* Dedicated Telemetry PDF Report Modal */}
      <TelemetryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        city={currentCity}
        cityName={cityConfig.name}
        localities={cityConfig.localities}
        currentTab={activeTab}
        currentZone={selectedZone}
      />
    </div>
  );
}
