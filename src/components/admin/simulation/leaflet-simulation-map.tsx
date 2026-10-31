/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Leaflet Simulation Map
   Map-First Interactive GIS Canvas for Multi-Hazard Spatial Intelligence.

   Phase 1 Reliability & Performance Refinements:
   - Deterministic, high-performance Leaflet layer management via useMap()
   - Reusable stable layer instances: zero DOM/SVG thrashing during playback
   - Wards layer style updates via setStyle() in <1ms without re-creating geometries
   - Continuous hazard surface isobands update via clearLayers() + addData()
   - Dynamic tooltip updates synchronized to current time step metrics
   - In-memory static GeoJSON layer caching across mounts
   - Complete preservation of all 10 spatial layers, markers, popups, and controls
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { pointInGeometry } from "@/modules/geo/point-in-polygon";
import type { WardImpactRecord } from "@/modules/simulation/contracts";
import {
  canonicalWardId,
  isMatchingWard,
  findMatchingWardFeature,
  computeGeometryBounds,
} from "@/modules/geo/canonical-gis";

// Mumbai Geographic Coordinates
export const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];
export const MUMBAI_BOUNDS: [[number, number], [number, number]] = [
  [18.85, 72.70], // Southwest
  [19.35, 73.10], // Northeast
];

export interface SimulationLayerVisibility {
  showSurface: boolean;
  showWards: boolean;
  showRivers: boolean;
  showHotspots: boolean;
  showPumps: boolean;
  showZones?: boolean;
  showRoads?: boolean;
  showDepressions?: boolean;
  showHospitals?: boolean;
  showBridges?: boolean;
  showCoastal?: boolean;
}

export interface LeafletSimulationMapProps {
  isobandsGeoJSON?: FeatureCollection | null;
  selectedWardId?: string;
  wardFocusTrigger?: number;
  onSelectWard: (wardId: string) => void;
  filterToSelectedWard?: boolean;
  surfaceMode?: "isoband" | "choropleth" | "hybrid";
  wardImpacts?: WardImpactRecord[];
  layerVisibility: SimulationLayerVisibility;
  controlsOpen?: boolean;
  drawerOpen?: boolean;
  basemapProvider?: "osm" | "carto-light" | "carto-dark" | "satellite";
}

export const BASEMAP_CONFIG: Record<
  "osm" | "carto-light" | "carto-dark" | "satellite",
  { url: string; attribution: string }
> = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  "carto-light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  "carto-dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
  },
};

// Map Panes Setup Component to ensure strict GIS stacking order
function MapPanesSetup() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("hazardSurfacePane")) {
      const surfacePane = map.createPane("hazardSurfacePane");
      surfacePane.style.zIndex = "350";
    }
    if (!map.getPane("wardChoroplethPane")) {
      const choroplethPane = map.createPane("wardChoroplethPane");
      choroplethPane.style.zIndex = "400";
    }
    if (!map.getPane("infrastructurePane")) {
      const infraPane = map.createPane("infrastructurePane");
      infraPane.style.zIndex = "500";
    }
    if (!map.getPane("facilitiesPane")) {
      const facPane = map.createPane("facilitiesPane");
      facPane.style.zIndex = "600";
    }
  }, [map]);
  return null;
}

// Global in-memory cache for static GeoJSON datasets to eliminate duplicate HTTP fetches
const staticGeoCache = new Map<string, FeatureCollection>();

async function fetchCachedGeoJSON(url: string): Promise<FeatureCollection | null> {
  if (staticGeoCache.has(url)) {
    return staticGeoCache.get(url)!;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    staticGeoCache.set(url, data);
    return data;
  } catch (err) {
    console.error(`Error loading GeoJSON from ${url}:`, err);
    return null;
  }
}

// Controller to fit map precisely to selected ward polygon boundary
function MapWardFocusController({
  selectedWardId,
  wardFocusTrigger,
  wardsGeoJSON,
}: {
  selectedWardId?: string;
  wardFocusTrigger?: number;
  wardsGeoJSON: FeatureCollection | null;
}) {
  const map = useMap();
  const lastFocusKeyRef = useRef<string>("");

  useEffect(() => {
    if (!selectedWardId || !wardsGeoJSON) return;
    const targetCanonical = canonicalWardId(selectedWardId, "mumbai");
    if (!targetCanonical) return;

    const focusKey = `${targetCanonical}:${wardFocusTrigger || 0}`;
    if (lastFocusKeyRef.current === focusKey) return;
    lastFocusKeyRef.current = focusKey;

    const feature = findMatchingWardFeature(wardsGeoJSON, targetCanonical, "mumbai");

    if (feature && feature.geometry) {
      const bounds = computeGeometryBounds(feature.geometry);
      if (bounds) {
        // Ensure container dimensions are up-to-date
        map.invalidateSize();
        // Fit precisely to the actual polygon boundary with padding and clamped zoom
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15.0,
          animate: true,
          duration: 0.8,
        });
        return;
      }

      // Fallback: office coordinates if bounds cannot be computed
      const p = feature.properties || {};
      const lat = p.officeLat || p.office_coords?.[0];
      const lng = p.officeLng || p.office_coords?.[1];
      if (lat && lng) {
        map.invalidateSize();
        map.flyTo([lat, lng], 13.5, { duration: 0.8 });
      }
    }
  }, [selectedWardId, wardFocusTrigger, wardsGeoJSON, map]);

  return null;
}

// Resizes Leaflet map when drawers open/close or window resizes
function MapResizeWatcher({
  controlsOpen,
  drawerOpen,
}: {
  controlsOpen?: boolean;
  drawerOpen?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 280);
    return () => clearTimeout(timer);
  }, [controlsOpen, drawerOpen, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize({ animate: false });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
}

// Control to reset viewport to full Greater Mumbai extent
function FitMumbaiControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-14 z-[400]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.setView(MUMBAI_CENTER, 11, { animate: true });
        }}
        title="Reset to Full Greater Mumbai Extent"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-md border border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-all hover:shadow-lg active:scale-95 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
        <span>Fit Mumbai</span>
      </button>
    </div>
  );
}

// Helper: Surface style calculation
function getSurfaceStyle(feature?: Feature<Geometry, any>) {
  const color = feature?.properties?.color || "#3b82f6";
  const rawOpacity = feature?.properties?.fill_opacity ?? feature?.properties?.opacity ?? 0.45;
  const fillOpacity = Math.max(0.28, Math.min(0.68, rawOpacity));
  return {
    fillColor: color,
    fillOpacity,
    weight: 0.5,
    color: color,
    opacity: Math.min(0.75, fillOpacity + 0.15),
  };
}

// Helper: Surface tooltip HTML
function renderSurfaceTooltip(p: Record<string, any>) {
  const elevInfo = p.elevation_m !== undefined ? ` • Elev: ~${p.elevation_m}m ASL` : "";
  const depBadge = p.is_depression ? ` <span class="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold">Saucer Sink</span>` : "";
  return `<div class="font-sans text-xs p-1 space-y-0.5 min-w-[170px]">
    <div class="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
      <span>${p.ward_name || p.label || "Continuous Hazard Field"}</span>
      ${depBadge}
    </div>
    <div class="text-blue-700 dark:text-blue-400 font-bold font-mono text-xs">
      ${p.interpolated_value ?? p.value ?? p.min} ${p.unit || ""}
    </div>
    <div class="text-slate-600 dark:text-slate-400 text-[10px]">
      ${p.tier_label || "Continuous Field"}${elevInfo}
    </div>
  </div>`;
}

// Dedicated High-Performance Layer for Continuous Hazard Surface Isobands
function ContinuousSurfaceLayer({
  isobandsGeoJSON,
  surfaceMode,
  visible,
  onSelectWard,
}: {
  isobandsGeoJSON?: FeatureCollection | null;
  surfaceMode: "isoband" | "choropleth" | "hybrid";
  visible: boolean;
  onSelectWard?: (wardId: string) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.geoJSON(undefined, {
        pane: "hazardSurfacePane",
        style: getSurfaceStyle,
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          layer.bindTooltip(renderSurfaceTooltip(p), { sticky: true, opacity: 0.95 });
          if (p.ward_id && onSelectWard) {
            layer.on({
              click: () => {
                onSelectWard(p.ward_id);
              },
            });
          }
        },
      });
      layerRef.current.addTo(map);
    }

    const isLayerActive = visible && (surfaceMode === "isoband" || surfaceMode === "hybrid") && !!isobandsGeoJSON;

    if (isLayerActive && isobandsGeoJSON) {
      layerRef.current.clearLayers();
      layerRef.current.addData(isobandsGeoJSON);
    } else {
      layerRef.current.clearLayers();
    }
  }, [map, isobandsGeoJSON, surfaceMode, visible, onSelectWard]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  }, []);

  return null;
}

// Helper: Ward style calculation
function computeWardStyle(
  feature: Feature<Geometry, any> | undefined,
  selectedWardId: string | undefined,
  surfaceMode: "isoband" | "choropleth" | "hybrid",
  wardImpactsMap: Record<string, WardImpactRecord>
) {
  const p = feature?.properties;
  const rawId = p?.ward_id || p?.wardId || p?.shortCode || "";
  const canonicalId = canonicalWardId(rawId, "mumbai");
  const isSelected = isMatchingWard(rawId, selectedWardId, "mumbai");
  const impact = wardImpactsMap[canonicalId] || wardImpactsMap[rawId] || wardImpactsMap[p?.shortCode || ""];

  // Check for missing data or sensor offline
  const isNoData = !impact || impact.qualityStatus === "MISSING_SENSOR_FEED" || impact.metricValue === undefined;

  if (isNoData) {
    if (isSelected) {
      return {
        color: "#1d4ed8",
        weight: 4,
        opacity: 1,
        fillColor: "#94a3b8",
        fillOpacity: 0.50,
        dashArray: "5, 5",
      };
    }
    return {
      color: "#64748b",
      weight: 1.5,
      opacity: 0.85,
      fillColor: "#94a3b8",
      fillOpacity: 0.35,
      dashArray: "5, 5",
    };
  }

  if (surfaceMode === "choropleth") {
    const fillColor = impact.severityColor;
    if (isSelected) {
      return {
        color: "#1d4ed8",
        weight: 4,
        opacity: 1,
        fillColor,
        fillOpacity: 0.72,
      };
    }
    return {
      color: "#1e293b",
      weight: 1.5,
      opacity: 0.85,
      fillColor,
      fillOpacity: 0.55,
    };
  }

  if (surfaceMode === "hybrid") {
    const fillColor = impact.severityColor;
    if (isSelected) {
      return {
        color: "#1d4ed8",
        weight: 4,
        opacity: 1,
        fillColor,
        fillOpacity: 0.55,
      };
    }
    return {
      color: "#334155",
      weight: 1.4,
      opacity: 0.8,
      fillColor,
      fillOpacity: 0.35,
    };
  }

  // Default "isoband" mode: clean transparent outline with subtle tint over continuous raster
  if (isSelected) {
    return {
      color: "#1d4ed8",
      weight: 4,
      opacity: 1,
      fillColor: "#3b82f6",
      fillOpacity: 0.20,
    };
  }
  return {
    color: "#475569",
    weight: 1.4,
    opacity: 0.75,
    fillColor: "#64748b",
    fillOpacity: 0.05,
  };
}

// Helper: Ward tooltip HTML
function renderWardTooltip(p: Record<string, any>, impact?: WardImpactRecord) {
  const displayId = p.shortCode || p.wardId || p.ward_id || "";
  const displayName = p.wardName || p.name || `Ward ${displayId}`;
  const isNoData = !impact || impact.qualityStatus === "MISSING_SENSOR_FEED";

  return `<div class="font-sans text-xs p-1">
    <div class="font-bold text-slate-900 dark:text-slate-100">${displayName}</div>
    <div class="text-slate-600 dark:text-slate-400 text-[11px]">${p.zoneCode || p.zone_code || ""} | Pop: ${p.population ? (p.population / 1000).toFixed(0) + "k" : "N/A"}</div>
    ${
      isNoData
        ? `<div class="mt-1 pt-1 border-t border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-bold">
            ⚠️ Sensor Offline (No Data)
           </div>
           <div class="text-[10px] text-slate-500 font-mono">Status: MISSING_SENSOR_FEED</div>`
        : impact
        ? `<div class="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold" style="color: ${impact.severityColor}">
            ${impact.metricLabel}: ${impact.metricValue} ${impact.metricUnit.split(" ")[0]} (${impact.tierLabel})
           </div>
           <div class="text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Status: ${impact.qualityStatus || "PROVISIONAL"}</span>
            <span>${impact.drainageBasin || "SWD"}</span>
           </div>`
        : ""
    }
  </div>`;
}

// Dedicated High-Performance Layer for 24 BMC Wards & Discrete Choropleths
function WardsChoroplethLayer({
  wardsData,
  selectedWardId,
  surfaceMode,
  wardImpactsMap,
  onSelectWard,
  visible,
}: {
  wardsData: FeatureCollection | null;
  selectedWardId?: string;
  surfaceMode: "isoband" | "choropleth" | "hybrid";
  wardImpactsMap: Record<string, WardImpactRecord>;
  onSelectWard: (wardId: string) => void;
  visible: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const onSelectRef = useRef(onSelectWard);
  onSelectRef.current = onSelectWard;

  // Initialize Layer once when wardsData is loaded
  useEffect(() => {
    if (!wardsData || !visible) {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    if (!layerRef.current) {
      const geo = L.geoJSON(wardsData, {
        pane: "wardChoroplethPane",
        style: (feat) => computeWardStyle(feat, selectedWardId, surfaceMode, wardImpactsMap),
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const rawId = p.ward_id || p.wardId || p.shortCode || feature.id;
          const canonicalId = canonicalWardId(rawId, "mumbai");
          layer.on({
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectRef.current(canonicalId);
            },
          });
          const impact = wardImpactsMap[canonicalId] || wardImpactsMap[rawId];
          layer.bindTooltip(renderWardTooltip(p, impact), { sticky: true, opacity: 0.95 });
        },
      });
      geo.addTo(map);
      layerRef.current = geo;
    }
  }, [map, wardsData, visible]);

  // Fast style & tooltip synchronization on simulation time step changes (<1ms execution)
  useEffect(() => {
    if (!layerRef.current) return;

    layerRef.current.setStyle((feat) =>
      computeWardStyle(feat, selectedWardId, surfaceMode, wardImpactsMap)
    );

    layerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (!feature) return;
      const p = feature.properties || {};
      const rawId = p.ward_id || p.wardId || p.shortCode || feature.id;
      const canonicalId = canonicalWardId(rawId, "mumbai");
      const isSelected = isMatchingWard(rawId, selectedWardId, "mumbai");
      if (isSelected) {
        layer.bringToFront();
      }
      const impact = wardImpactsMap[canonicalId] || wardImpactsMap[rawId];
      if (layer.getTooltip()) {
        layer.setTooltipContent(renderWardTooltip(p, impact));
      }
    });
  }, [selectedWardId, surfaceMode, wardImpactsMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  }, []);

  return null;
}

export default function LeafletSimulationMap({
  isobandsGeoJSON,
  selectedWardId,
  wardFocusTrigger,
  onSelectWard,
  filterToSelectedWard = false,
  surfaceMode = "isoband",
  wardImpacts = [],
  layerVisibility,
  controlsOpen = true,
  drawerOpen = true,
  basemapProvider = "osm",
}: LeafletSimulationMapProps) {
  // Spatial Reference Layers State
  const [wardsData, setWardsData] = useState<FeatureCollection | null>(null);
  const [zonesData, setZonesData] = useState<FeatureCollection | null>(null);
  const [riversData, setRiversData] = useState<FeatureCollection | null>(null);
  const [hotspotsData, setHotspotsData] = useState<FeatureCollection | null>(null);
  const [pumpsData, setPumpsData] = useState<FeatureCollection | null>(null);
  const [roadsData, setRoadsData] = useState<FeatureCollection | null>(null);
  const [depressionsData, setDepressionsData] = useState<FeatureCollection | null>(null);
  const [hospitalsData, setHospitalsData] = useState<FeatureCollection | null>(null);
  const [bridgesData, setBridgesData] = useState<FeatureCollection | null>(null);
  const [coastalData, setCoastalData] = useState<FeatureCollection | null>(null);

  // Load static reference layers with global caching
  useEffect(() => {
    let isMounted = true;

    fetchCachedGeoJSON("/data/mumbai/mumbai_bmc_wards.geojson").then((d) => {
      if (isMounted && d) setWardsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_bmc_zones.geojson").then((d) => {
      if (isMounted && d) setZonesData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_public_drainage_network.geojson").then((d) => {
      if (isMounted && d) setRiversData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_flood_hotspots.geojson").then((d) => {
      if (isMounted && d) setHotspotsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_drainage_structures.geojson").then((d) => {
      if (isMounted && d) setPumpsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_full_road_network.geojson").then((d) => {
      if (isMounted && d) setRoadsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_low_lying_areas.geojson").then((d) => {
      if (isMounted && d) setDepressionsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_emergency_hospitals.geojson").then((d) => {
      if (isMounted && d) setHospitalsData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_bridges_culverts.geojson").then((d) => {
      if (isMounted && d) setBridgesData(d);
    });
    fetchCachedGeoJSON("/data/mumbai/mumbai_coastal_exposure.geojson").then((d) => {
      if (isMounted && d) setCoastalData(d);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Quick lookup map of ward impacts by wardId
  const wardImpactsMap = useMemo(() => {
    const map: Record<string, WardImpactRecord> = {};
    for (const w of wardImpacts) {
      map[w.wardId] = w;
    }
    return map;
  }, [wardImpacts]);

  // Selected ward feature geometry for point containment testing
  const selectedWardFeature = useMemo(() => {
    if (!selectedWardId || !wardsData) return null;
    return findMatchingWardFeature(wardsData, selectedWardId, "mumbai");
  }, [selectedWardId, wardsData]);

  // Drainage / Waterways Line Style Function
  const getRiversStyle = () => ({
    color: "#0284c7",
    weight: 2.2,
    opacity: 0.8,
  });

  // Arterial Roads Style Function
  const getRoadsStyle = (feature?: Feature<Geometry, any>) => {
    const p = feature?.properties || {};
    const isMajor = p.highway === "motorway" || p.highway === "trunk";
    const isInSelectedWard = p.ward_id === selectedWardId;
    return {
      color: isInSelectedWard ? "#1e293b" : "#475569",
      weight: isMajor ? 2.2 : 1.4,
      opacity: isInSelectedWard ? 0.85 : 0.45,
      dashArray: isMajor ? undefined : "3, 3",
    };
  };

  // Low-Lying Saucer Depressions Style Function
  const getDepressionsStyle = () => ({
    color: "#d97706",
    weight: 1.5,
    opacity: 0.8,
    fillColor: "#f59e0b",
    fillOpacity: 0.18,
    dashArray: "4, 4",
  });

  return (
    <div className="w-full h-full relative z-0 bg-slate-100">
      <MapContainer
        center={MUMBAI_CENTER}
        zoom={11}
        minZoom={10}
        maxZoom={18}
        maxBounds={MUMBAI_BOUNDS}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Real Interactive Multi-Provider Base Map */}
        <TileLayer
          key={basemapProvider}
          attribution={BASEMAP_CONFIG[basemapProvider]?.attribution || BASEMAP_CONFIG.osm.attribution}
          url={BASEMAP_CONFIG[basemapProvider]?.url || BASEMAP_CONFIG.osm.url}
          maxZoom={19}
        />

        {/* Dedicated Hierarchical Map Panes for Layer Stacking Order */}
        <MapPanesSetup />

        {/* ─── 1. CONTINUOUS HAZARD SURFACE ISOBANDS (DETERMINISTIC PERSISTENT LAYER) ─── */}
        <ContinuousSurfaceLayer
          isobandsGeoJSON={isobandsGeoJSON}
          surfaceMode={surfaceMode}
          visible={layerVisibility.showSurface}
          onSelectWard={onSelectWard}
        />

        {/* ─── 2a. CANONICAL 24 BMC WARD CHOROPLETH & BOUNDARIES (<1ms STYLES) ─── */}
        <WardsChoroplethLayer
          wardsData={wardsData}
          selectedWardId={selectedWardId}
          surfaceMode={surfaceMode}
          wardImpactsMap={wardImpactsMap}
          onSelectWard={onSelectWard}
          visible={layerVisibility.showWards}
        />

        {/* ─── 2b. BMC ADMINISTRATIVE ZONES (ZONES I–VII) ───────── */}
        {layerVisibility.showZones && zonesData && (
          <GeoJSON
            key="zones-boundaries"
            data={zonesData}
            pane="infrastructurePane"
            style={() => ({
              color: "#7c3aed",
              weight: 2.2,
              opacity: 0.85,
              fillOpacity: 0,
              dashArray: "6, 6",
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div class="font-sans text-xs">
                  <div class="font-bold text-purple-900">${p.zone_name || p.zoneCode}</div>
                  <div class="text-purple-700 text-[11px]">Constituent Wards: ${(p.constituent_wards || []).join(", ")}</div>
                </div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* ─── 2c. COPERNICUS DEM LOW-LYING SAUCER DEPRESSIONS ───── */}
        {layerVisibility.showDepressions && depressionsData && (
          <GeoJSON
            key="low-lying-depressions"
            data={depressionsData}
            pane="hazardSurfacePane"
            style={getDepressionsStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div class="font-sans text-xs">
                  <div class="font-bold text-amber-900">🔻 ${p.name || "Topographic Saucer Sink"}</div>
                  <div class="text-amber-700 text-[11px]">Mean Elevation: ~${p.elevation_mean || 6.5}m ASL</div>
                  <div class="text-slate-500 text-[10px]">Source: Copernicus GLO-30 DEM</div>
                </div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* ─── 2d. ARTERIAL ROADS & HIGHWAY NETWORK ─────────────── */}
        {layerVisibility.showRoads && roadsData && (
          <GeoJSON
            key={`roads-network-${selectedWardId}`}
            data={roadsData}
            pane="infrastructurePane"
            style={getRoadsStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div class="font-sans text-xs">
                  <div class="font-bold text-slate-800">🛣️ ${p.name || "Arterial Road Corridor"}</div>
                  <div class="text-slate-600 text-[11px]">Type: ${p.highway || "arterial"} • Lanes: ${p.lanes || 4} • Ward: ${p.ward_id || "BMC"}</div>
                </div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* ─── 3. DRAINAGE NETWORK & MITHI RIVER ───────────────── */}
        {layerVisibility.showRivers && riversData && (
          <GeoJSON
            key="drainage-network"
            data={riversData}
            pane="infrastructurePane"
            style={getRiversStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div class="font-sans text-xs">
                  <div class="font-bold text-sky-800">💧 ${p.Name || p.name || "Municipal Nullah Corridor"}</div>
                  <div class="text-sky-600 text-[11px]">${p.Catchment || "Natural Surface Waterway"}</div>
                </div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* ─── 4. RECURRING FLOOD HOTSPOTS (HIERARCHICAL MICRO-MARKERS) ─── */}
        {layerVisibility.showHotspots &&
          hotspotsData?.features?.map((f, idx) => {
            const geom = f.geometry as any;
            if (!geom || geom.type !== "Point" || !geom.coordinates) return null;
            const [lng, lat] = geom.coordinates;
            const p = f.properties || {};

            const isInsideSelectedWard =
              selectedWardFeature?.geometry
                ? pointInGeometry([lng, lat], selectedWardFeature.geometry)
                : false;

            if (filterToSelectedWard && selectedWardId && !isInsideSelectedWard) {
              return null;
            }

            const markerName = p.name || p.Location || p.location || "Chronic Flood Hotspot";

            return (
              <CircleMarker
                key={`hotspot-${idx}-${lat}-${lng}`}
                center={[lat, lng]}
                pane="facilitiesPane"
                radius={isInsideSelectedWard ? 7 : 4.5}
                pathOptions={{
                  fillColor: "#ef4444",
                  fillOpacity: isInsideSelectedWard ? 1 : 0.88,
                  color: "#ffffff",
                  weight: isInsideSelectedWard ? 2.5 : 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="font-sans text-xs font-bold text-slate-900">
                    {markerName}
                    {isInsideSelectedWard && (
                      <span className="ml-1 text-[10px] text-blue-600 font-mono">(Ward {selectedWardId})</span>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-sans text-xs p-1 space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 shadow-xs" />
                      <strong className="text-red-700 text-xs font-bold leading-tight">
                        {markerName}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                        {p.hotspot_type ? p.hotspot_type.replace(/_/g, " ") : "Low-lying Depression"}
                      </span>
                      {isInsideSelectedWard && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Ward {selectedWardId} Focus
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 text-[11px] bg-red-50 p-2 rounded-lg border border-red-200 leading-relaxed">
                      <strong>Evidence:</strong> {p.evidence || p.Chronic_Issue || "Documented localized waterlogging during high tide or heavy monsoon rainfall."}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 flex justify-between">
                      <span>Confidence: {p.confidence || "High"}</span>
                      <span>Recurrence: {p.recurrence || "Annual"}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* ─── 5. STORMWATER PUMPING STATIONS & OUTFALLS ──────────── */}
        {layerVisibility.showPumps &&
          pumpsData?.features?.map((f, idx) => {
            const geom = f.geometry as any;
            if (!geom || geom.type !== "Point" || !geom.coordinates) return null;
            const [lng, lat] = geom.coordinates;
            const p = f.properties || {};

            const isInsideSelectedWard =
              (p.ward_id && p.ward_id === selectedWardId) ||
              (selectedWardFeature?.geometry
                ? pointInGeometry([lng, lat], selectedWardFeature.geometry)
                : false);

            if (filterToSelectedWard && selectedWardId && !isInsideSelectedWard) {
              return null;
            }

            const pumpName = p.name || p.Name || "Stormwater Infrastructure";

            return (
              <CircleMarker
                key={`pump-${idx}-${lat}-${lng}`}
                center={[lat, lng]}
                pane="facilitiesPane"
                radius={isInsideSelectedWard ? 7 : 4.5}
                pathOptions={{
                  fillColor: "#06b6d4",
                  fillOpacity: isInsideSelectedWard ? 1 : 0.88,
                  color: "#ffffff",
                  weight: isInsideSelectedWard ? 2.5 : 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="font-sans text-xs font-bold text-slate-900">
                    {pumpName}
                    {isInsideSelectedWard && (
                      <span className="ml-1 text-[10px] text-cyan-600 font-mono">(Ward {selectedWardId})</span>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-sans text-xs p-1 space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0 shadow-xs" />
                      <strong className="text-cyan-800 text-xs font-bold leading-tight">
                        {pumpName}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono text-[10px] font-bold uppercase">
                        {p.structure_type ? p.structure_type.replace(/_/g, " ") : "Pumping Station"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        Ward {p.ward_id || selectedWardId || "BMC"}
                      </span>
                    </div>
                    {p.connected_drainage_id && (
                      <div className="text-slate-600 text-[11px] bg-cyan-50 p-2 rounded-lg border border-cyan-200">
                        <strong>Connected SWD Nullah:</strong> <span className="font-mono">{p.connected_drainage_id}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 flex justify-between">
                      <span>Source: {p.source ? "BRIMSTOWAD / MCGM" : "Municipal SWD"}</span>
                      <span>Confidence: {p.confidence || "High"}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* ─── 6. EMERGENCY HOSPITALS & HEALTH FACILITIES ───────── */}
        {layerVisibility.showHospitals &&
          hospitalsData?.features?.map((f, idx) => {
            const geom = f.geometry as any;
            if (!geom || geom.type !== "Point" || !geom.coordinates) return null;
            const [lng, lat] = geom.coordinates;
            const p = f.properties || {};

            const isInsideSelectedWard =
              selectedWardFeature?.geometry
                ? pointInGeometry([lng, lat], selectedWardFeature.geometry)
                : false;

            if (filterToSelectedWard && selectedWardId && !isInsideSelectedWard) {
              return null;
            }

            return (
              <CircleMarker
                key={`hospital-${idx}-${lat}-${lng}`}
                center={[lat, lng]}
                pane="facilitiesPane"
                radius={isInsideSelectedWard ? 7 : 4.5}
                pathOptions={{
                  fillColor: "#10b981",
                  fillOpacity: isInsideSelectedWard ? 1 : 0.88,
                  color: "#ffffff",
                  weight: isInsideSelectedWard ? 2.5 : 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="font-sans text-xs font-bold text-slate-900">
                    🏥 {p.name || "Emergency Hospital"}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-sans text-xs p-1 space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 shadow-xs" />
                      <strong className="text-emerald-800 text-xs font-bold leading-tight">
                        {p.name || "Municipal Healthcare Facility"}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                        {p.facility_type || "Emergency Hospital"}
                      </span>
                    </div>
                    {p.address && (
                      <p className="text-[11px] text-slate-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        {p.address}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 flex justify-between">
                      <span>Agency: {p.agency || "Public Health"}</span>
                      {p.phone && <span>Tel: {p.phone}</span>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* ─── 7. COASTAL EXPOSURE CORRIDORS ─────────────────── */}
        {layerVisibility.showCoastal && coastalData && (
          <GeoJSON
            key="coastal-exposure-corridors"
            data={coastalData}
            pane="infrastructurePane"
            style={() => ({
              color: "#0d9488",
              weight: 2.8,
              opacity: 0.85,
              dashArray: "6, 4",
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div class="font-sans text-xs">
                  <div class="font-bold text-teal-900">🌊 ${p.name || "Coastal Exposure Corridor"}</div>
                  <div class="text-teal-700 text-[11px]">Type: ${p.zone_type || "Marine Coastline"} • Confidence: ${p.confidence || "High"}</div>
                  <div class="text-slate-500 text-[10px]">Source: ${p.source || "NCCR / Survey of India"}</div>
                </div>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* ─── 8. BRIDGES & WATERWAY CULVERTS ──────────────────── */}
        {layerVisibility.showBridges &&
          bridgesData?.features?.map((f, idx) => {
            const geom = f.geometry as any;
            if (!geom || geom.type !== "Point" || !geom.coordinates) return null;
            const [lng, lat] = geom.coordinates;
            const p = f.properties || {};

            const isInsideSelectedWard =
              selectedWardFeature?.geometry
                ? pointInGeometry([lng, lat], selectedWardFeature.geometry)
                : false;

            if (filterToSelectedWard && selectedWardId && !isInsideSelectedWard) {
              return null;
            }

            const brgName = p.name || "Bridges / Culvert";

            return (
              <CircleMarker
                key={`bridge-${idx}-${lat}-${lng}`}
                center={[lat, lng]}
                pane="facilitiesPane"
                radius={isInsideSelectedWard ? 7 : 4.5}
                pathOptions={{
                  fillColor: "#8b5cf6",
                  fillOpacity: isInsideSelectedWard ? 1 : 0.88,
                  color: "#ffffff",
                  weight: isInsideSelectedWard ? 2.5 : 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="font-sans text-xs font-bold text-slate-900">
                    🌉 {brgName}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-sans text-xs p-1 space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0 shadow-xs" />
                      <strong className="text-purple-900 text-xs font-bold leading-tight">
                        {brgName}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold block">
                        {p.structure_type ? p.structure_type.replace(/_/g, " ") : "Road / River Bridge"}
                      </span>
                      {p.road_name && (
                        <div><strong>Road:</strong> {p.road_name}</div>
                      )}
                      {p.waterway_name && (
                        <div><strong>Waterway Crossed:</strong> {p.waterway_name}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                      <span>Source: {p.source || "MCGM Bridges / Western Railway"}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Map Controller for Ward Focusing */}
        <MapWardFocusController
          selectedWardId={selectedWardId}
          wardFocusTrigger={wardFocusTrigger}
          wardsGeoJSON={wardsData}
        />

        {/* Dynamic Resize Watcher for Panel Drawer Transitions */}
        <MapResizeWatcher
          controlsOpen={controlsOpen}
          drawerOpen={drawerOpen}
        />

        {/* Zoom Controls & Fit Mumbai Extent */}
        <ZoomControl position="bottomright" />
        <FitMumbaiControl />
      </MapContainer>
    </div>
  );
}
