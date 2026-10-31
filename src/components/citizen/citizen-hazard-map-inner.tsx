/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Interactive Hazard Map (Inner Leaflet)
   Location-Aware GIS Map displaying official municipal boundaries, citizen GPS pin,
   emergency facilities, hazard susceptibility and compact ward intelligence.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { FeatureCollection, Feature } from "geojson";
import { resolveBoundary, type ResolvedBoundary } from "@/modules/geo/point-in-polygon";
import Link from "next/link";

// Citizen location pulsing pin icon factory
function createCitizenIcon() {
  if (typeof window === "undefined" || !L.divIcon) return undefined;
  return L.divIcon({
    className: "citizen-map-marker",
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(37, 99, 235, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export interface CitizenHazardMapProps {
  city: string;
  cityName: string;
  centerCoords: [number, number];
  citizenCoords: [number, number];
  citizenAreaName: string;
  isGps: boolean;
  onWardSelected?: (boundary: ResolvedBoundary | null) => void;
  selectedWardId?: string;
}

// Controller to fly to citizen location or selected feature
function MapViewController({
  targetCoords,
  triggerKey,
  zoomLevel = 13,
}: {
  targetCoords: [number, number];
  triggerKey: string | number;
  zoomLevel?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, zoomLevel, { duration: 0.8 });
    }
  }, [targetCoords, triggerKey, map, zoomLevel]);
  return null;
}

export default function CitizenHazardMapInner({
  city,
  cityName,
  centerCoords,
  citizenCoords,
  citizenAreaName,
  isGps,
  onWardSelected,
  selectedWardId: initialSelectedWardId,
}: CitizenHazardMapProps) {
  // Leaflet marker icons setup safely on client mount
  useEffect(() => {
    if (typeof window !== "undefined" && L.Icon?.Default?.prototype) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const citizenIcon = useMemo(() => createCitizenIcon(), []);

  // Map layers data
  const [boundariesGeoJSON, setBoundariesGeoJSON] = useState<FeatureCollection | null>(null);
  const [facilitiesGeoJSON, setFacilitiesGeoJSON] = useState<FeatureCollection | null>(null);
  const [fireGeoJSON, setFireGeoJSON] = useState<FeatureCollection | null>(null);
  const [hotspotsGeoJSON, setHotspotsGeoJSON] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected boundary for detail briefing
  const [selectedBoundary, setSelectedBoundary] = useState<ResolvedBoundary | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number]>(citizenCoords);
  const [flyKey, setFlyKey] = useState<number>(0);

  // Layer visibility toggles
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showFire, setShowFire] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // Load GeoJSON data based on city
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadData() {
      try {
        let boundUrl = `/data/${city}/${city}_bmc_wards.geojson`;
        if (city === "nagpur") boundUrl = `/data/nagpur/nagpur_nmc_zones.geojson`;
        if (city === "pune") boundUrl = `/data/pune/pune_pmc_zones.geojson`;

        const [bRes, fRes, fireRes, hotRes] = await Promise.allSettled([
          fetch(boundUrl),
          fetch(`/data/${city}/${city}_emergency_hospitals.geojson`),
          fetch(`/data/${city}/${city}_fire_department.geojson`),
          city === "mumbai" ? fetch(`/data/mumbai/mumbai_flood_hotspots.geojson`) : Promise.reject(),
        ]);

        if (!cancelled && bRes.status === "fulfilled" && bRes.value.ok) {
          const bData = await bRes.value.json();
          setBoundariesGeoJSON(bData);
        }

        if (!cancelled && fRes.status === "fulfilled" && fRes.value.ok) {
          const fData = await fRes.value.json();
          setFacilitiesGeoJSON(fData);
        }

        if (!cancelled && fireRes.status === "fulfilled" && fireRes.value.ok) {
          const fireData = await fireRes.value.json();
          setFireGeoJSON(fireData);
        }

        if (!cancelled && hotRes.status === "fulfilled" && hotRes.value.ok) {
          const hotData = await hotRes.value.json();
          setHotspotsGeoJSON(hotData);
        }
      } catch (err) {
        console.error("[CitizenHazardMap] Failed to load spatial data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [city]);

  // Resolve citizen location to ward/zone boundary
  const citizenBoundary = useMemo(() => {
    if (!boundariesGeoJSON || !citizenCoords) return null;
    return resolveBoundary(citizenCoords[0], citizenCoords[1], boundariesGeoJSON);
  }, [boundariesGeoJSON, citizenCoords]);

  // Auto-select citizen's ward on initial load if none selected
  useEffect(() => {
    if (citizenBoundary && !selectedBoundary) {
      setSelectedBoundary(citizenBoundary);
      if (onWardSelected) onWardSelected(citizenBoundary);
    }
  }, [citizenBoundary, selectedBoundary, onWardSelected]);

  // Recenter on citizen location
  const handleRecenterCitizen = () => {
    setFlyTarget(citizenCoords);
    setFlyKey((k) => k + 1);
  };

  // Reset to entire city bounding extent
  const handleResetCityExtent = () => {
    setFlyTarget(centerCoords);
    setFlyKey((k) => k + 1);
  };

  // Styling for boundaries
  const boundaryStyle = (feature: any) => {
    const p = feature?.properties || {};
    const id = String(p.ward_id || p.wardId || p.zone_id || p.id || p.zone_number || "");
    const isCitizenWard = citizenBoundary && citizenBoundary.id === id;
    const isSelected = selectedBoundary && selectedBoundary.id === id;

    if (isSelected) {
      return {
        fillColor: "#2563eb",
        fillOpacity: 0.35,
        color: "#1d4ed8",
        weight: 3.5,
        dashArray: undefined,
      };
    }

    if (isCitizenWard) {
      return {
        fillColor: "#3b82f6",
        fillOpacity: 0.22,
        color: "#2563eb",
        weight: 2.5,
        dashArray: "4, 4",
      };
    }

    return {
      fillColor: "#64748b",
      fillOpacity: 0.08,
      color: "#94a3b8",
      weight: 1.2,
      dashArray: undefined,
    };
  };

  // Feature click handler
  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const p = feature.properties || {};
    const id = String(p.ward_id || p.wardId || p.zone_id || p.id || p.zone_number || "");
    const name = String(p.name || p.wardName || p.zone_name || `Area ${id}`);

    layer.on({
      click: () => {
        const resolved: ResolvedBoundary = {
          id,
          name,
          code: String(p.shortCode || p.zone_code || id),
          parentZone: p.zone_name || p.zoneName || p.sector_orientation,
          populationEst: p.population_est || p.population,
          areaSqKm: p.area_sq_km || p.area_sq_km_approx,
          properties: p,
          feature,
        };
        setSelectedBoundary(resolved);
        if (onWardSelected) onWardSelected(resolved);
      },
    });

    layer.bindTooltip(
      `<div class="text-xs font-semibold px-1 py-0.5">${name}</div>`,
      { sticky: true, direction: "top", className: "map-tooltip-custom" }
    );
  };

  return (
    <div className="relative isolate w-full h-full min-h-[460px] flex flex-col rounded-2xl overflow-hidden border border-border bg-surface-1 shadow-sm">
      {/* Top Map Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Toggles Pill */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md pointer-events-auto text-xs">
          <button
            onClick={() => setShowBoundaries(!showBoundaries)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showBoundaries ? "bg-accent text-white" : "text-text-secondary hover:bg-surface-2"
            }`}
          >
            {city === "mumbai" ? "Wards" : "Zones"}
          </button>
          <button
            onClick={() => setShowHospitals(!showHospitals)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showHospitals ? "bg-emerald-600 text-white" : "text-text-secondary hover:bg-surface-2"
            }`}
          >
            🏥 Hospitals
          </button>
          <button
            onClick={() => setShowFire(!showFire)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showFire ? "bg-amber-600 text-white" : "text-text-secondary hover:bg-surface-2"
            }`}
          >
            🚒 Fire
          </button>
          {city === "mumbai" && (
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                showHotspots ? "bg-rose-600 text-white" : "text-text-secondary hover:bg-surface-2"
              }`}
            >
              🌊 Flood Hotspots
            </button>
          )}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
              showLegend
                ? "bg-surface-elevated text-text-primary border-accent/40"
                : "text-text-tertiary border-transparent hover:bg-surface-2"
            }`}
            title="Toggle Map Legend"
          >
            🏷️ Legend
          </button>
        </div>

        {/* Location & Extent Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleRecenterCitizen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md text-xs font-semibold text-accent hover:bg-surface-2 active:scale-95 transition-all cursor-pointer min-h-[36px]"
            title="Return to My Selected Location"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
            <span>My Location</span>
          </button>

          <button
            onClick={handleResetCityExtent}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md text-xs font-semibold text-text-primary hover:bg-surface-2 active:scale-95 transition-all cursor-pointer min-h-[36px]"
            title={`Reset Map to Entire ${cityName} Extent`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span>City Extent</span>
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div className="relative flex-1 w-full min-h-[380px]">
        <MapContainer
          center={citizenCoords}
          zoom={12.5}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ background: "#f8fafc" }}
        >
          <MapViewController targetCoords={flyTarget} triggerKey={flyKey} />

          {/* Correctly Attributed OpenStreetMap Basemap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* Official City Boundaries */}
          {showBoundaries && boundariesGeoJSON && (
            <GeoJSON
              key={`bounds-${city}-${boundariesGeoJSON.features.length}`}
              data={boundariesGeoJSON}
              style={boundaryStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Verified Emergency Hospitals */}
          {showHospitals && facilitiesGeoJSON && (
            <GeoJSON
              key={`hosp-${city}`}
              data={facilitiesGeoJSON}
              pointToLayer={(feature, latlng) => {
                const name = feature.properties?.name || feature.properties?.hospital_name || "Emergency Medical Facility";
                return L.circleMarker(latlng, {
                  radius: 5,
                  fillColor: "#10b981",
                  color: "#ffffff",
                  weight: 1.5,
                  fillOpacity: 0.9,
                }).bindPopup(
                  `<div class="p-1 max-w-[210px]">
                    <div class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase mb-1">
                      Verified Public Facility
                    </div>
                    <p class="font-bold text-xs text-emerald-700">🏥 ${name}</p>
                    <p class="text-[10px] text-zinc-600 mt-1">Designated Emergency Healthcare Facility • Intake capacity managed dynamically by hospital triage.</p>
                  </div>`
                );
              }}
            />
          )}

          {/* Verified Fire Stations */}
          {showFire && fireGeoJSON && (
            <GeoJSON
              key={`fire-${city}`}
              data={fireGeoJSON}
              pointToLayer={(feature, latlng) => {
                const name = feature.properties?.station_name || feature.properties?.name || "Fire Brigade Station";
                return L.circleMarker(latlng, {
                  radius: 5,
                  fillColor: "#f59e0b",
                  color: "#ffffff",
                  weight: 1.5,
                  fillOpacity: 0.9,
                }).bindPopup(
                  `<div class="p-1 max-w-[210px]">
                    <div class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase mb-1">
                      Verified Public Facility
                    </div>
                    <p class="font-bold text-xs text-amber-700">🚒 ${name}</p>
                    <p class="text-[10px] text-zinc-600 mt-1">Municipal Disaster Response & Rescue • Operational under Fire Control Room dispatch.</p>
                  </div>`
                );
              }}
            />
          )}

          {/* Flood Hotspots (Mumbai) */}
          {showHotspots && hotspotsGeoJSON && (
            <GeoJSON
              key={`hotspots-${city}`}
              data={hotspotsGeoJSON}
              pointToLayer={(feature, latlng) => {
                const name = feature.properties?.name || "Vulnerable Waterlogging Point";
                return L.circleMarker(latlng, {
                  radius: 4,
                  fillColor: "#ef4444",
                  color: "#ffffff",
                  weight: 1.2,
                  fillOpacity: 0.85,
                }).bindPopup(
                  `<div class="p-1">
                    <p class="font-bold text-xs text-rose-700">⚠️ ${name}</p>
                    <p class="text-[11px] text-zinc-600 mt-0.5">Documented Chronic Waterlogging Vulnerability</p>
                  </div>`
                );
              }}
            />
          )}

          {/* Citizen Location Marker (With User Permission) */}
          {citizenIcon && (
            <Marker position={citizenCoords} icon={citizenIcon}>
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Your Location: {citizenAreaName}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Coordinates: {citizenCoords[0].toFixed(4)}°N, {citizenCoords[1].toFixed(4)}°E
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    {isGps ? "✓ Device GPS Position" : "📍 Selected Locality"}
                  </p>
                  {citizenBoundary ? (
                    <div className="mt-1.5 pt-1.5 border-t border-border/60 text-[11px]">
                      <span className="font-semibold text-text-primary">Jurisdiction: </span>
                      {citizenBoundary.name}
                    </div>
                  ) : (
                    <div className="mt-1.5 pt-1.5 border-t border-border/60 text-[10px] text-amber-600">
                      Location outside mapped administrative wards.
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Map Legend Overlay */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 z-20 p-3 rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl text-[11px] space-y-1.5 max-w-[220px] pointer-events-auto animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-text-primary text-[10px] uppercase tracking-wider pb-1 border-b border-border">
              <span>Map Legend</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-text-tertiary hover:text-text-primary p-0.5 text-xs leading-none cursor-pointer"
                title="Hide Legend"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-blue-600/35 border-2 border-blue-600 inline-block shrink-0" />
              <span className="text-text-secondary text-[11px]">Selected Ward / Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-blue-500/20 border border-blue-500 border-dashed inline-block shrink-0" />
              <span className="text-text-secondary text-[11px]">Your Area Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block shrink-0 shadow-xs" />
              <span className="text-text-secondary text-[11px]">Emergency Hospital</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white inline-block shrink-0 shadow-xs" />
              <span className="text-text-secondary text-[11px]">Fire Brigade Station</span>
            </div>
            {city === "mumbai" && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-white inline-block shrink-0 shadow-xs" />
                <span className="text-text-secondary text-[11px]">Flood Hotspot (MCGM)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white inline-block shrink-0 shadow-xs ring-1 ring-blue-500/50" />
              <span className="text-text-secondary text-[11px]">Citizen Location Pin</span>
            </div>
          </div>
        )}
      </div>

      {/* Resolution & Selected Ward Briefing Panel */}
      <div className="p-4 bg-surface-0 border-t border-border space-y-3 text-xs">
        {selectedBoundary ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {city === "mumbai" ? "BMC Ward" : "Municipal Zone"}: {selectedBoundary.code}
                  </span>
                  <h4 className="font-bold text-text-primary text-sm">{selectedBoundary.name}</h4>
                  <span className="text-[10px] text-text-tertiary">Municipal Boundary Record • Open GIS</span>
                </div>
                <p className="text-text-secondary text-[11px] mt-0.5">
                  {selectedBoundary.parentZone ? `${selectedBoundary.parentZone} • ` : ""}
                  {selectedBoundary.areaSqKm ? `${selectedBoundary.areaSqKm} km² • ` : ""}
                  {selectedBoundary.populationEst
                    ? `Est. Pop: ${selectedBoundary.populationEst.toLocaleString()} (Screening buffer)`
                    : "Population data pending Census alignment"}
                </p>
              </div>

              {/* Contextual Action Button */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/${city}/report?ward=${encodeURIComponent(selectedBoundary.id)}&location=${encodeURIComponent(
                    selectedBoundary.name
                  )}&category=drainage_waterlogging`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors shadow-xs text-xs cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Report in {selectedBoundary.code || selectedBoundary.name.split(" ")[0]}</span>
                </Link>
                {selectedBoundary.id !== citizenBoundary?.id && (
                  <button
                    onClick={() => {
                      if (citizenBoundary) {
                        setSelectedBoundary(citizenBoundary);
                        if (onWardSelected) onWardSelected(citizenBoundary);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer text-xs"
                    title="Reset to your area ward"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Environmental & Hazard Context Interpretation (Distinguishing Forecast vs Screening vs Confirmed Incident) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              {/* Pillar 1: Forecast */}
              <div className="p-2.5 rounded-xl bg-surface-1 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary flex items-center gap-1">
                    <span>🌦️</span>
                    <span>1. Forecast</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    ECMWF Model
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[10px]">
                  Atmospheric rainfall prediction. Represents potential incoming precipitation rate, NOT proof of current street waterlogging.
                </p>
              </div>

              {/* Pillar 2: Screening Estimate */}
              <div className="p-2.5 rounded-xl bg-surface-1 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary flex items-center gap-1">
                    <span>📐</span>
                    <span>2. Screening</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    GLO-30 DEM
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[10px]">
                  Topographic depression calculation. Highlights saucer basin runoff accumulation potential during intense rain.
                </p>
              </div>

              {/* Pillar 3: Confirmed Ground Incident */}
              <div className="p-2.5 rounded-xl bg-surface-1 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary flex items-center gap-1">
                    <span>⚠️</span>
                    <span>3. Confirmed</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    Civic Data
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[10px]">
                  Validated chronic hotspots and verified citizen reports. Confirms physical ground impediments and dispatched teams.
                </p>
              </div>
            </div>

            {/* Scope Limitation Warning */}
            <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] flex items-center gap-2">
              <span className="text-xs shrink-0">ℹ️</span>
              <p className="leading-relaxed">
                <strong>Data Boundary:</strong> Model uses Copernicus DEM & OpenStreetMap records. Real-time internal basement pump operational status and micro-drain desiltation are not established from satellite screening.
              </p>
            </div>
          </div>
        ) : citizenBoundary ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Resolved Locality
                </span>
                <h4 className="font-bold text-text-primary text-sm">{citizenBoundary.name}</h4>
              </div>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Click any ward or zone polygon on the map to inspect local vulnerability, emergency hospitals, and data limitations.
              </p>
            </div>
            <Link
              href={`/${city}/report?ward=${encodeURIComponent(citizenBoundary.id)}&location=${encodeURIComponent(
                citizenBoundary.name
              )}`}
              className="px-3 py-1.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors shadow-xs text-xs shrink-0 cursor-pointer"
            >
              Report Issue in My Area →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Coordinates ({citizenCoords[0].toFixed(2)}, {citizenCoords[1].toFixed(2)}) fall outside mapped municipal polygons. Displaying regional baseline context.
            </span>
          </div>
        )}
      </div>

      {/* Attribution & Data Freshness Footer */}
      <div className="px-3.5 py-1.5 bg-surface-2/60 border-t border-border/50 text-[10px] text-text-tertiary flex items-center justify-between">
        <span>Map: OpenStreetMap contributors • Boundaries: Municipal GIS Registry ({cityName})</span>
        <span>Resolution: 1km grid & municipal polygons • Freshness: Live 15m sync</span>
      </div>
    </div>
  );
}
