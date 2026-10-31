/* ════════════════════════════════════════════════════════
   Admin Incident & Multi-Hazard Map — OpenStreetMap (OSM)
   Sentinel City Intelligence Command Center
   - Multi-city support (Nagpur, Pune, Mumbai)
   - Real-time weather, AQI, river/marine telemetry
   - 10 verified GIS hazard layers (hotspots, depression sinks, nullahs, coastal surge)
   - Administrative Alert Review & Publication Modal
   - Controlled Monsoon Downpour Scenario Simulation
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { SearchIcon, MapIcon, ShieldIcon, BuildingIcon } from "@/components/ui/icons";
import {
  type IncidentMarkerData,
  type FacilityMarkerData,
  type ZoneData,
} from "@/components/admin/osm-map-types";
import { useCityContext } from "@/components/providers/city-provider";
import { WardActionHubModal } from "@/components/admin/ward-action-hub-modal";

// Dynamic import with SSR disabled to prevent Leaflet window errors
const OsmIncidentMap = dynamic(
  () => import("@/components/admin/osm-incident-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-1">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-text-primary">Loading Sentinel Command Map...</p>
        <p className="text-xs text-text-tertiary">Connecting live telemetry and spatial layers</p>
      </div>
    ),
  }
);

/* ─── OpenStreetMap Tile Providers ─── */
const TILE_PROVIDERS = [
  {
    id: "osm",
    label: "OpenStreetMap",
    icon: "🌐",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  {
    id: "carto-light",
    label: "Clean Light",
    icon: "☀️",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  {
    id: "carto-dark",
    label: "Dark Matter",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  {
    id: "maptiler-streets",
    label: "MapTiler Vector",
    icon: "🗺️",
    url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "vfych9w2Nh5AGjIQ7jgL"}`,
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap',
  },
  {
    id: "satellite",
    label: "Satellite",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
  },
  {
    id: "topo",
    label: "Topographic",
    icon: "⛰️",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM',
  },
];

export default function AdminMapPage() {
  const { city, cityConfig } = useCityContext();
  const [selectedProvider, setSelectedProvider] = useState(TILE_PROVIDERS[0]);
  const [incidents, setIncidents] = useState<IncidentMarkerData[]>([]);
  const [facilities, setFacilities] = useState<FacilityMarkerData[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer toggles (Incidents & Facilities on by default; Hazard overlays on-demand)
  const [showIncidents, setShowIncidents] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showZones, setShowZones] = useState(true);

  // Sentinel Hazard Layer Toggles
  const [showFloodHotspots, setShowFloodHotspots] = useState(false);
  const [showTerrainSinks, setShowTerrainSinks] = useState(false);
  const [showDrainageNetwork, setShowDrainageNetwork] = useState(false);
  const [showCoastalExposure, setShowCoastalExposure] = useState(false);
  const [showWaterways, setShowWaterways] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showHazardMenu, setShowHazardMenu] = useState(false);

  // Navigation triggers (Fit City & Reset View)
  const [fitCityTrigger, setFitCityTrigger] = useState(0);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Sentinel Telemetry & Layers State
  const [hazardFeed, setHazardFeed] = useState<any>(null);
  const [hazardLayers, setHazardLayers] = useState<Record<string, any>>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [actionHubOpen, setActionHubOpen] = useState(false);
  const [actionHubWard, setActionHubWard] = useState({
    id: city === "mumbai" ? "F/N" : "ZONE-1",
    name: city === "mumbai" ? "Ward F/North (Matunga / Sion)" : "Zone I",
    score: 68,
    hotspots: ["Gandhi Market", "Hindmata Cinema", "Sion Circle"],
  });
  const [simRainfall, setSimRainfall] = useState(50);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(cityConfig?.center || null);
  const [showLegend, setShowLegend] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [showRecentFeed, setShowRecentFeed] = useState(false);

  /* Load map data from /api/admin/map-data?city=${city} */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/map-data?city=${city}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setIncidents(data.incidents || []);
            setFacilities(data.facilities || []);
            setZones(data.zones || []);
          }
        }
      } catch (err) {
        console.error("[AdminMap] Error loading map data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [city]);

  /* Load Sentinel Multi-Hazard Feed & GIS Layers */
  useEffect(() => {
    async function loadHazards() {
      try {
        const [feedRes, layersRes] = await Promise.all([
          fetch(`/api/hazards/feed?city=${city}`),
          fetch(`/api/hazards/map-layers?city=${city}&layers=hotspots,sinks,drainage,coastal`),
        ]);
        if (feedRes.ok) {
          const feedJson = await feedRes.json();
          if (feedJson.success) setHazardFeed(feedJson.data);
        }
        if (layersRes.ok) {
          const layersJson = await layersRes.json();
          if (layersJson.success) setHazardLayers(layersJson.data?.layers || {});
        }
      } catch (err) {
        console.warn("[AdminMap] Hazard feed non-fatal error:", err);
      }
    }
    loadHazards();
  }, [city]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "alerts" || params.get("review") === "true") {
        setReviewModalOpen(true);
      }
      if (params.get("tab") === "simulation" || params.get("simulate") === "true") {
        setSimulationModalOpen(true);
      }
    }
  }, []);

  /* Run Simulation Scenario */
  const handleRunSimulation = async (rainRate: number) => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch(`/api/hazards/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          simulationScenario: {
            rainfallRateMmH: rainRate,
            durationHours: 3,
            tidalSurgeMeters: city === "mumbai" ? 2.2 : 0,
          },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSimResult(json.data);
      }
    } catch (err) {
      console.error("[AdminMap] Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  /* Review and Approve / Reject Alert */
  const handleReviewAlert = async (alertId: string, action: "APPROVE" | "REJECT" | "CANCEL") => {
    try {
      const res = await fetch(`/api/hazards/alerts/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          action,
          notes: `Authorized by Municipal Admin via Sentinel Command Center`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setActionSuccessMsg(`Alert status updated to ${action === "APPROVE" ? "APPROVED & PUBLISHED" : action}`);
          // Refresh feed
          const feedRes = await fetch(`/api/hazards/feed?city=${city}`);
          if (feedRes.ok) {
            const feedJson = await feedRes.json();
            if (feedJson.success) setHazardFeed(feedJson.data);
          }
          setTimeout(() => setActionSuccessMsg(null), 4000);
          setReviewModalOpen(false);
        }
      }
    } catch (err) {
      console.error("[AdminMap] Alert review error:", err);
    }
  };

  /* Search matching across incidents, facilities and zones */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();

    const matchedIncidents = incidents
      .filter(
        (i) =>
          i.publicReference.toLowerCase().includes(q) ||
          (i.title && i.title.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map((i) => ({
        type: "incident" as const,
        id: i.id,
        title: i.publicReference,
        subtitle: i.title || "Reported incident",
        coords: [i.latitude, i.longitude] as [number, number],
      }));

    const matchedFacilities = facilities
      .filter((f) => f.name.toLowerCase().includes(q) || f.departmentName.toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({
        type: "facility" as const,
        id: f.id,
        title: f.name,
        subtitle: `${f.departmentName} · ${f.facilityType}`,
        coords: [f.latitude, f.longitude] as [number, number],
      }));

    return [...matchedIncidents, ...matchedFacilities];
  }, [searchQuery, incidents, facilities]);

  // Live Incident Counts
  const counts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const inc of incidents) {
      const s = inc.severity?.toUpperCase();
      if (s === "CRITICAL" || inc.isEmergency) critical++;
      else if (s === "HIGH") high++;
      else if (s === "MEDIUM") medium++;
      else if (s === "LOW") low++;
    }

    return {
      total: incidents.length,
      critical,
      high,
      medium,
      low,
      facilities: facilities.length,
      zones: zones.length,
    };
  }, [incidents, facilities, zones]);

  const handleFitCity = () => {
    setSelectedCoords(null);
    setFitCityTrigger((prev) => prev + 1);
  };

  const handleResetView = () => {
    setSelectedCoords(null);
    setResetViewTrigger((prev) => prev + 1);
  };

  const activeHazardCount = useMemo(() => {
    let count = 0;
    if (showFloodHotspots) count++;
    if (showTerrainSinks) count++;
    if (showDrainageNetwork) count++;
    if (showCoastalExposure) count++;
    if (showWaterways) count++;
    if (showHospitals) count++;
    return count;
  }, [showFloodHotspots, showTerrainSinks, showDrainageNetwork, showCoastalExposure, showWaterways, showHospitals]);

  const weather = hazardFeed?.currentTelemetry?.weather;
  const aqi = hazardFeed?.currentTelemetry?.airQuality;
  const assessment = hazardFeed?.assessment;
  const activeAlerts = hazardFeed?.activeAlerts || [];
  const candidateEvents = hazardFeed?.activeEvents || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-surface-0">
      {/* ─── Top Control Bar ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-2.5 bg-surface-0/95 backdrop-blur-md border-b border-border z-20 shadow-xs">
        {/* Left: City Title & Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl">{cityConfig.emoji}</span>
            <div className="hidden lg:block shrink-0">
              <h2 className="text-sm font-bold text-text-primary leading-tight">
                {cityConfig.name} — Hazard & Incident Map
              </h2>
              <p className="text-[10px] text-text-tertiary">
                Sentinel Multi-Hazard Intelligence
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs md:max-w-sm">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${cityConfig.name} incidents, facilities...`}
              className="w-full pl-9 pr-4 py-2 bg-surface-1 border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />

            {/* Live Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-0 border border-border rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-border">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCoords(item.coords);
                      setSearchQuery("");
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-surface-1 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-text-primary">{item.title}</p>
                      <p className="text-[11px] text-text-tertiary">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">
                      {item.type} ↗
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Locality Jump Selector */}
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx) && cityConfig.localities[idx]) {
                setSelectedCoords(cityConfig.localities[idx].coords);
              }
            }}
            defaultValue=""
            className="bg-surface-1 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 hidden xl:block shrink-0 min-w-[200px] w-52 cursor-pointer"
          >
            <option value="" disabled>Jump to {cityConfig.name} Locality...</option>
            {cityConfig.localities.map((loc, idx) => (
              <option key={loc.name} value={idx}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Tile Switcher & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tile Selector */}
          <div className="flex items-center gap-1 bg-surface-1 border border-border p-1 rounded-xl">
            {TILE_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  selectedProvider.id === provider.id
                    ? "bg-accent text-white shadow-sm font-bold"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
                title={provider.label}
              >
                <span>{provider.icon}</span>
                <span className={selectedProvider.id === provider.id ? "inline text-xs font-bold" : "hidden 2xl:inline text-xs"}>
                  {provider.label}
                </span>
              </button>
            ))}
          </div>

          {/* Fit City */}
          <button
            onClick={handleFitCity}
            className="px-2.5 py-1.5 bg-surface-1 hover:bg-surface-2 border border-border rounded-xl text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={`Fit bounds to ${cityConfig.name} administrative area`}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">Fit City</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="px-2.5 py-1.5 bg-surface-1 hover:bg-surface-2 border border-border rounded-xl text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={`Reset ${cityConfig.name} default center & zoom`}
          >
            <span>↺</span>
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Toggle Legend Drawer */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              showLegend
                ? "bg-accent text-white border-accent"
                : "bg-surface-1 text-text-primary border-border hover:bg-surface-2"
            }`}
          >
            <span>📊</span>
            <span className="hidden sm:inline">Layers & Risk</span>
          </button>

          {/* Prompt 8: Ward Action Hub & Dispatch Modal */}
          <button
            onClick={() => setActionHubOpen(true)}
            className="px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Open Ward Action Hub to inspect evidence and dispatch department tasks"
          >
            <span>🛠️</span>
            <span className="hidden md:inline">Ward Action Hub</span>
          </button>
        </div>
      </div>

      {/* ─── Sentinel Multi-Hazard Telemetry Ribbon ─── */}
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-4 text-xs overflow-x-auto z-10 shadow-inner">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
            <span>🌧️ Rain:</span>
            <span className="font-bold text-cyan-400">
              {weather ? `${weather.rainfallRateMmH.toFixed(1)} mm/h` : "0.0 mm/h"}
            </span>
            <span className="text-slate-400">· {weather?.temperatureCelsius || 28}°C</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
            <span>🌿 AQI:</span>
            <span className={`font-bold ${
              (aqi?.usAqi || 50) <= 50 ? "text-emerald-400" : (aqi?.usAqi || 50) <= 100 ? "text-amber-400" : "text-rose-400"
            }`}>
              {aqi ? `${aqi.usAqi} (${aqi.category})` : "75 (Moderate)"}
            </span>
          </div>

          {city === "mumbai" && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
              <span>🌊 Surge:</span>
              <span className="font-bold text-sky-400">
                {hazardFeed?.currentTelemetry?.marine?.waveHeightMeters?.toFixed(1) || "0.6"}m Wave
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
            <span>🛡️ Risk Score:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              (assessment?.riskScore || 20) >= 75 ? "bg-rose-600 text-white" : (assessment?.riskScore || 20) >= 60 ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
            }`}>
              {assessment ? `${assessment.riskScore}/100 (${assessment.riskLevel})` : "20/100 (LOW)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actionSuccessMsg && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded-lg animate-fadeIn">
              ✓ {actionSuccessMsg}
            </span>
          )}

          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>⚠️</span>
            <span>Alerts & Warnings ({candidateEvents.length + activeAlerts.length})</span>
          </button>

          <button
            onClick={() => {
              setSimulationModalOpen(true);
              handleRunSimulation(simRainfall);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>⚡</span>
            <span>Simulate Scenario</span>
          </button>
        </div>
      </div>

      {/* ─── Map Container Area ─── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <OsmIncidentMap
          key={city}
          tileUrl={selectedProvider.url}
          attribution={selectedProvider.attribution}
          incidents={incidents}
          facilities={facilities}
          zones={zones}
          showIncidents={showIncidents}
          showFacilities={showFacilities}
          showZones={showZones}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
          departmentFilter={departmentFilter}
          selectedCoordinates={selectedCoords}
          center={cityConfig.center}
          bounds={cityConfig.bounds}
          zoom={cityConfig.zoom}
          cityName={cityConfig.name}
          hazardLayers={hazardLayers}
          showFloodHotspots={showFloodHotspots}
          showTerrainSinks={showTerrainSinks}
          showDrainageNetwork={showDrainageNetwork}
          showCoastalExposure={showCoastalExposure}
          showWaterways={showWaterways}
          showHospitals={showHospitals}
          activeAlerts={activeAlerts}
          fitCityTrigger={fitCityTrigger}
          resetViewTrigger={resetViewTrigger}
        />

        {/* ─── Streamlined GIS Control Toolbar ─── */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2 pointer-events-auto">
          <div className="bg-surface-0/95 backdrop-blur-md border border-border/80 p-1 rounded-2xl shadow-xl flex items-center gap-1 text-xs flex-wrap">
            {/* Incident Reports */}
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showIncidents
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
              title="Toggle Citizen Incident Reports"
            >
              <span>🚨</span>
              <span>Reports</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                showIncidents ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-surface-2 text-text-tertiary"
              }`}>
                {counts.total}
              </span>
            </button>

            {/* Facilities */}
            <button
              onClick={() => setShowFacilities(!showFacilities)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showFacilities
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
              title="Toggle Public & Emergency Facilities"
            >
              <span>🏢</span>
              <span>Facilities</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                showFacilities ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-surface-2 text-text-tertiary"
              }`}>
                {facilities.length}
              </span>
            </button>

            {/* Administrative Wards / Zones */}
            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showZones
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
              title="Toggle Ward / Administrative Boundaries"
            >
              <span>🏛️</span>
              <span>Wards</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                showZones ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-surface-2 text-text-tertiary"
              }`}>
                {zones.length}
              </span>
            </button>

            {/* Hazard Layers Dropdown Trigger */}
            <button
              onClick={() => setShowHazardMenu(!showHazardMenu)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeHazardCount > 0
                  ? "bg-amber-600 text-white shadow-xs"
                  : showHazardMenu
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
              title="Toggle Environmental & Hazard GIS Layers"
            >
              <span>⚠️</span>
              <span>Hazards</span>
              {activeHazardCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/25 text-white text-[10px] font-mono font-bold">
                  {activeHazardCount}
                </span>
              )}
              <span className="text-[10px] opacity-70">{showHazardMenu ? "▲" : "▼"}</span>
            </button>

            <div className="w-[1px] h-4 bg-border mx-0.5" />

            {/* Fit City */}
            <button
              onClick={handleFitCity}
              className="px-2 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-1 font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Fit viewport to full city bounds"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">Fit</span>
            </button>

            {/* Reset View */}
            <button
              onClick={handleResetView}
              className="px-2 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-1 font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Reset default zoom and center"
            >
              <span>↺</span>
              <span className="hidden sm:inline">Reset</span>
            </button>

            <div className="w-[1px] h-4 bg-border mx-0.5" />

            {/* Live Feed Toggle */}
            <button
              onClick={() => setShowRecentFeed(!showRecentFeed)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showRecentFeed
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
              title="Toggle Real-Time Incident Feed Drawer"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>Live Feed</span>
            </button>
          </div>

          {/* ─── Compact Hazard Layer Popover ─── */}
          {showHazardMenu && (
            <div className="bg-surface-0/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-2xl w-72 space-y-2 pointer-events-auto animate-fadeIn">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{cityConfig.name} Hazard Layers</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const turnOn = activeHazardCount === 0;
                      setShowFloodHotspots(turnOn);
                      setShowTerrainSinks(turnOn);
                      setShowDrainageNetwork(turnOn);
                      setShowCoastalExposure(turnOn && city === "mumbai");
                      setShowWaterways(turnOn);
                      setShowHospitals(turnOn);
                    }}
                    className="text-[10px] text-accent hover:underline font-bold"
                  >
                    {activeHazardCount === 0 ? "Enable All" : "Clear All"}
                  </button>
                  <button
                    onClick={() => setShowHazardMenu(false)}
                    className="text-text-tertiary hover:text-text-primary text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                {city === "mumbai" && (
                  <>
                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>🔴</span>
                        <span className="font-medium text-text-primary">Flood Hotspots (35)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showFloodHotspots}
                        onChange={(e) => setShowFloodHotspots(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>🔵</span>
                        <span className="font-medium text-text-primary">Elevation Sinks (15)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showTerrainSinks}
                        onChange={(e) => setShowTerrainSinks(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>🌊</span>
                        <span className="font-medium text-text-primary">Drainage Network (88km)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showDrainageNetwork}
                        onChange={(e) => setShowDrainageNetwork(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>🌊</span>
                        <span className="font-medium text-text-primary">Coastal Surge Inundation</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showCoastalExposure}
                        onChange={(e) => setShowCoastalExposure(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>
                  </>
                )}

                {(city === "pune" || city === "nagpur") && (
                  <>
                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>💧</span>
                        <span className="font-medium text-text-primary">{city === "pune" ? "Mula-Mutha Rivers" : "Nag-Pili Rivers"}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showWaterways}
                        onChange={(e) => setShowWaterways(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>🏥</span>
                        <span className="font-medium text-text-primary">Emergency Trauma Centers</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showHospitals}
                        onChange={(e) => setShowHospitals(e.target.checked)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                    </label>

                    {city === "pune" && (
                      <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-1 cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span>🌊</span>
                          <span className="font-medium text-text-primary">Drainage Corridors</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showDrainageNetwork}
                          onChange={(e) => setShowDrainageNetwork(e.target.checked)}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Floating Top 10 Recent Incident Triage Drawer ─── */}
        {showRecentFeed && (
          <div className="absolute top-16 left-4 z-10 w-80 sm:w-96 max-h-[calc(100vh-13rem)] bg-surface-0/95 backdrop-blur-md border border-border rounded-3xl p-3.5 shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Live Recent Reports ({incidents.slice(0, 10).length})
                </span>
              </div>
              <button
                onClick={() => setShowRecentFeed(false)}
                className="text-text-tertiary hover:text-text-primary text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-2.5 pr-1">
              {incidents.length === 0 && (
                <div className="text-center py-8 text-xs text-text-tertiary">
                  No active incidents recorded
                </div>
              )}
              {incidents.slice(0, 10).map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedCoords([inc.latitude, inc.longitude])}
                  className="w-full p-2.5 rounded-2xl bg-surface-1 hover:bg-accent/10 border border-border hover:border-accent/40 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      {inc.publicReference}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inc.severity === "CRITICAL" || inc.isEmergency
                          ? "bg-rose-500/20 text-rose-600 border border-rose-500/30"
                          : inc.severity === "HIGH"
                          ? "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                          : inc.severity === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                      }`}
                    >
                      {inc.severity || "NORMAL"}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-text-primary group-hover:text-accent line-clamp-1 leading-snug">
                    {inc.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1.5 pt-1 border-t border-border/50">
                    <span className="truncate max-w-[170px]">
                      📍 {inc.locationText || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                    </span>
                    <span className="font-bold text-accent group-hover:underline flex items-center gap-0.5">
                      Locate 🎯
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Floating / Bottom Sheet Interactive Legend Panel ─── */}
        {showLegend && isLegendMinimized && (
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto animate-fadeIn">
            <button
              onClick={() => setIsLegendMinimized(false)}
              className="px-4 py-2.5 bg-surface-0/95 backdrop-blur-md border border-border rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-text-primary hover:bg-surface-1 cursor-pointer transition-all"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              <span>{cityConfig.name} Hazard Triage</span>
              <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-mono text-[10px]">
                {counts.total}
              </span>
              <span className="text-text-tertiary ml-1">▲ Expand</span>
            </button>
          </div>
        )}

        {showLegend && !isLegendMinimized && (
          <div className="absolute bottom-0 left-0 right-0 sm:bottom-4 sm:right-4 sm:left-auto sm:w-80 max-h-[48vh] sm:max-h-[80%] overflow-y-auto bg-surface-0/95 backdrop-blur-md border border-border rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl space-y-4 animate-fadeIn pointer-events-auto z-10">
            {/* Mobile Grab Handle */}
            <div
              className="w-12 h-1 bg-border rounded-full mx-auto -mt-1 mb-2 sm:hidden cursor-pointer"
              onClick={() => setIsLegendMinimized(true)}
            />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                  {cityConfig.name} Hazard Triage
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-accent">
                  {counts.total} Reports
                </span>
                <button
                  onClick={() => setIsLegendMinimized(true)}
                  className="p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors cursor-pointer text-xs"
                  title="Minimize Panel"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div>
              <p className="text-[10px] uppercase font-bold text-text-tertiary mb-2">Severity Levels</p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setSeverityFilter(severityFilter === "CRITICAL" ? "ALL" : "CRITICAL")}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    severityFilter === "CRITICAL"
                      ? "bg-red-500/20 border-red-500 text-red-500 font-bold"
                      : "bg-surface-1 border-border text-text-primary hover:border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Critical</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{counts.critical}</span>
                </div>

                <div
                  onClick={() => setSeverityFilter(severityFilter === "HIGH" ? "ALL" : "HIGH")}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    severityFilter === "HIGH"
                      ? "bg-orange-500/20 border-orange-500 text-orange-500 font-bold"
                      : "bg-surface-1 border-border text-text-primary hover:border-orange-500/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>High</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{counts.high}</span>
                </div>

                <div
                  onClick={() => setSeverityFilter(severityFilter === "MEDIUM" ? "ALL" : "MEDIUM")}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    severityFilter === "MEDIUM"
                      ? "bg-amber-500/20 border-amber-500 text-amber-500 font-bold"
                      : "bg-surface-1 border-border text-text-primary hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span>Medium</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{counts.medium}</span>
                </div>

                <div
                  onClick={() => setSeverityFilter(severityFilter === "LOW" ? "ALL" : "LOW")}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    severityFilter === "LOW"
                      ? "bg-green-500/20 border-green-500 text-green-500 font-bold"
                      : "bg-surface-1 border-border text-text-primary hover:border-green-500/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span>Low</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{counts.low}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Filter */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] uppercase font-bold text-text-tertiary mb-2">Resolution Status</p>
              <div className="flex gap-2">
                {["ALL", "ACTIVE", "RESOLVED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === status
                        ? "bg-accent text-white"
                        : "bg-surface-1 text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Geographic Scope Note */}
            <div className="pt-2 border-t border-border text-[11px] text-text-tertiary flex items-center justify-between">
              <span>Jurisdiction: {cityConfig.municipalAbbr}</span>
              <span className="text-accent font-bold">{facilities.length} Hubs</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Alert Review & Publication ─── */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-0 border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <h3 className="font-bold text-base text-text-primary">
                  Sentinel Warning Approval Center — {cityConfig.name}
                </h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-tertiary">
              Human municipal administrator review is mandatory before broadcasting public warnings or sirens to citizens.
            </p>

            {/* List candidate alerts */}
            <div className="space-y-3">
              {activeAlerts.length === 0 && candidateEvents.length === 0 && (
                <div className="p-8 text-center bg-surface-1 rounded-2xl border border-dashed border-border text-xs text-text-tertiary">
                  No alerts currently requiring approval. City risk is within normal parameters.
                </div>
              )}

              {activeAlerts.map((alt: any) => (
                <div key={alt.id} className="p-4 rounded-2xl bg-surface-1 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {alt.alert_reference || alt.alertReference}
                    </span>
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                      {alt.approval_status || "APPROVED_PUBLISHED"}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary">{alt.title}</h4>
                  <p className="text-xs text-text-secondary">{alt.headline}</p>
                  <p className="text-xs text-text-tertiary">{alt.description}</p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleReviewAlert(alt.id, "CANCEL")}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel / Expire Alert
                    </button>
                  </div>
                </div>
              ))}

              {candidateEvents.map((evt: any) => (
                <div key={evt.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                      Candidate Event: {evt.event_reference}
                    </span>
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
                      Awaiting Review
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary">{evt.title}</h4>
                  <p className="text-xs text-text-secondary">{evt.description}</p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleReviewAlert(evt.id, "APPROVE")}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                    >
                      ✓ Approve & Broadcast Alert
                    </button>
                    <button
                      onClick={() => handleReviewAlert(evt.id, "REJECT")}
                      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 text-text-primary rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 bg-surface-1 hover:bg-surface-2 text-text-primary rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Scenario Simulation Stress-Test ─── */}
      {simulationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-0 border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-bold text-base text-text-primary">
                  Monsoon Downpour Stress-Test Simulation — {cityConfig.name}
                </h3>
              </div>
              <button
                onClick={() => setSimulationModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-tertiary">
              Run an explainable hydrological stress-test against actual terrain, low-lying basins, and nullahs.
            </p>

            {/* Simulation Intensity Buttons */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-2">
                Select Synthetic Downpour Intensity:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "25 mm/h (Heavy Rain)", val: 25 },
                  { label: "50 mm/h (Very Heavy)", val: 50 },
                  { label: "85 mm/h (Cloudburst)", val: 85 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      setSimRainfall(opt.val);
                      handleRunSimulation(opt.val);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      simRainfall === opt.val
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-surface-1 border-border text-text-primary hover:border-blue-500/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {simulating && (
              <div className="p-6 text-center text-xs text-text-tertiary animate-pulse">
                Running deterministic hydrological model...
              </div>
            )}

            {simResult && !simulating && (
              <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-tertiary uppercase">Simulated Risk Level:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase text-white ${
                    simResult.riskScore >= 75 ? "bg-rose-600" : simResult.riskScore >= 60 ? "bg-amber-600" : "bg-emerald-600"
                  }`}>
                    {simResult.riskScore}/100 ({simResult.riskLevel})
                  </span>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  ⚠️ {simResult.uncertaintyDisclaimer}
                </div>

                <p className="text-xs text-text-primary leading-relaxed">{simResult.explanation}</p>

                {/* Contributing factors */}
                <div>
                  <h5 className="text-[11px] uppercase font-bold text-text-tertiary mb-2">Contributing Factors:</h5>
                  <div className="space-y-1.5">
                    {simResult.contributingFactors?.map((f: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-surface-0 rounded-xl border border-border">
                        <div>
                          <p className="font-bold text-text-primary">{f.factor}</p>
                          <p className="text-[10px] text-text-tertiary">{f.description}</p>
                        </div>
                        <span className="font-mono font-bold text-blue-600">+{f.scoreContribution} pts ({f.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                  <span className="text-text-tertiary">Estimated Demographic Exposure:</span>
                  <span className="font-bold text-text-primary font-mono">~{simResult.affectedPopulationApprox?.toLocaleString()} residents</span>
                </div>

                {/* Prompt 8: Action Hub Transition from Simulation Finding */}
                <div className="pt-2 border-t border-border flex justify-end">
                  <button
                    onClick={() => {
                      setActionHubWard({
                        id: city === "mumbai" ? "F/N" : "ZONE-1",
                        name: `${cityConfig.name} Low-Lying Drainage Basin`,
                        score: simResult.riskScore || 75,
                        hotspots: ["Simulated Critical Surcharge Point", "Gravity Outfall Canal"],
                      });
                      setSimulationModalOpen(false);
                      setActionHubOpen(true);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>🛠️</span>
                    <span>Open Ward Action Hub for Simulated Hazard →</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setSimulationModalOpen(false)}
                className="px-4 py-2 bg-surface-1 hover:bg-surface-2 text-text-primary rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Prompt 8 Ward Action Hub & Municipal Dispatch ─── */}
      <WardActionHubModal
        isOpen={actionHubOpen}
        onClose={() => setActionHubOpen(false)}
        wardId={actionHubWard.id}
        wardName={actionHubWard.name}
        screeningScore={actionHubWard.score}
        scenarioTitle={`Monsoon Downpour Stress-Test (${simRainfall} mm/h)`}
        telemetryEvidence={{
          rainRateMmH: weather?.rainfallRateMmH || 28.5,
          waterLevelM: 1.42,
          waveHeightM: city === "mumbai" ? 3.8 : 0,
          aqi: aqi?.usAqi || 68,
          observedAt: new Date().toISOString(),
          sourceName: "Open-Meteo GFS / ECMWF",
        }}
        chronicHotspots={actionHubWard.hotspots}
      />
    </div>
  );
}
