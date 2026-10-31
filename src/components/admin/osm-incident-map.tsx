/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard & Incident Map
   React-Leaflet Component with Hardware-Accelerated Canvas Rendering
   
   Features:
   - Default OpenStreetMap tiles with verified attribution & clean tile loading
   - Hardware-accelerated canvas renderer (preferCanvas=true) for smooth pan/zoom
   - True individual facility & incident markers with ZERO artificial count-clusters
   - Co-located facility hub support with honest multi-item detail popups
   - Restrained translucent ward polygons with high-contrast outlines
   - Dedicated Fit City & Reset View controllers with container invalidation
   - Strict city-boundary isolation
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Tooltip,
  CircleMarker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

import {
  NAGPUR_CENTER,
  NAGPUR_BOUNDS,
  type IncidentMarkerData,
  type FacilityMarkerData,
  type ZoneData,
  type OsmIncidentMapProps,
} from "./osm-map-types";

export {
  NAGPUR_CENTER,
  NAGPUR_BOUNDS,
  type IncidentMarkerData,
  type FacilityMarkerData,
  type ZoneData,
  type OsmIncidentMapProps,
};

/* ─── Severity Color Palette ─── */
const SEVERITY_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  CRITICAL: { bg: "#ef4444", border: "#b91c1c", glow: "rgba(239, 68, 68, 0.7)", text: "#ffffff" },
  HIGH:     { bg: "#f97316", border: "#c2410c", glow: "rgba(249, 115, 22, 0.6)", text: "#ffffff" },
  MEDIUM:   { bg: "#eab308", border: "#a16207", glow: "rgba(234, 179, 8, 0.5)", text: "#000000" },
  LOW:      { bg: "#10b981", border: "#047857", glow: "rgba(16, 185, 129, 0.4)", text: "#ffffff" },
};

/* ─── Department Icon Config ─── */
const DEPT_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  police:            { icon: "🚓", color: "#3b82f6", label: "Police Station" },
  traffic_police:    { icon: "🚦", color: "#f97316", label: "Traffic Post" },
  fire_brigade:      { icon: "🚒", color: "#ef4444", label: "Fire Station" },
  water_supply:      { icon: "💧", color: "#06b6d4", label: "Water Works" },
  drainage:          { icon: "🚰", color: "#0891b2", label: "Stormwater Drainage" },
  road_maintenance:  { icon: "🚧", color: "#d97706", label: "Road Depot" },
  electricity:       { icon: "⚡", color: "#8b5cf6", label: "Substation" },
  waste_management:  { icon: "♻️", color: "#10b981", label: "Solid Waste Management" },
  environment:       { icon: "🌱", color: "#16a34a", label: "Garden & Environment" },
  forest_dept:       { icon: "🌲", color: "#15803d", label: "Forest Office" },
  women_child:       { icon: "🛡️", color: "#db2777", label: "WCD Center" },
  disaster_mgmt:     { icon: "🚨", color: "#dc2626", label: "Disaster Cell" },
  health_dept:       { icon: "🏥", color: "#2563eb", label: "Health Center" },
  ambulance:         { icon: "🚑", color: "#e11d48", label: "Ambulance Base" },
  municipal_corp:    { icon: "🏛️", color: "#6366f1", label: "Zonal / Ward Office" },
};

/* ─── Fast Ray-Casting Point-in-Polygon Test ─── */
function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const [x, y] = point; // [lat, lng]
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/* ─── Controller for Center, Bounds, Navigation & Invalidation ─── */
function MapController({
  coords,
  center,
  bounds,
  zoom,
  resetTrigger,
  fitTrigger,
}: {
  coords?: [number, number] | null;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  zoom: number;
  resetTrigger?: number;
  fitTrigger?: number;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  // Invalidate size on mount to ensure crisp tile layout without grey tiles
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);

  // Set boundary restrictions
  useEffect(() => {
    if (bounds) {
      map.setMaxBounds(bounds);
    }
  }, [bounds, map]);

  // Specific target coordinate navigation (from search / incident click)
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      // Check if it's the general city center or a specific landmark
      const isExactCenter =
        Math.abs(coords[0] - center[0]) < 0.0001 &&
        Math.abs(coords[1] - center[1]) < 0.0001;

      if (!isExactCenter) {
        map.flyTo(coords, 15.5, { duration: 1.2, easeLinearity: 0.25 });
      }
    }
  }, [coords, center, map]);

  // Fit City trigger
  useEffect(() => {
    if (fitTrigger && fitTrigger > 0) {
      try { map.closePopup(); } catch (_) {}
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: zoom });
    }
  }, [fitTrigger, bounds, zoom, map]);

  // Reset View trigger
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      try { map.closePopup(); } catch (_) {}
      map.setView(center, zoom, { animate: true });
    }
  }, [resetTrigger, center, zoom, map]);

  return null;
}

/* ─── Co-located Facility Marker (Honest multi-facility location selector) ─── */
function ColocatedFacilityMarker({
  locationKey,
  latitude,
  longitude,
  facilities,
}: {
  locationKey: string;
  latitude: number;
  longitude: number;
  facilities: FacilityMarkerData[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const isMultiple = facilities.length > 1;
  const primary = facilities[activeIdx] || facilities[0];
  const conf = DEPT_ICONS[primary.departmentType] || { icon: "🏢", color: "#3b82f6", label: "Municipal Hub" };

  const icon = useMemo(() => {
    const html = `
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: #ffffff;
        border: 2px solid ${conf.color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.22);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        position: relative;
        transition: transform 0.15s ease;
      ">
        ${conf.icon}
        ${isMultiple ? `
          <span style="
            position: absolute;
            top: -5px;
            right: -5px;
            background: #1e293b;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 999px;
            border: 1px solid #ffffff;
            line-height: 1;
          ">+${facilities.length - 1}</span>
        ` : ""}
      </div>
    `;

    return L.divIcon({
      className: "custom-facility-marker",
      html,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -14],
    });
  }, [conf.color, conf.icon, isMultiple, facilities.length]);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
        },
      }}
    >
      <Popup autoPan keepInView minWidth={280}>
        <div className="p-2.5 max-w-sm font-sans text-xs">
          {/* Multiple items at this location header */}
          {isMultiple && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                📍 Location Hub ({facilities.length} Facilities)
              </span>
              <div className="flex items-center gap-1">
                {facilities.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                      activeIdx === i
                        ? "bg-accent text-white shadow-xs"
                        : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Facility Details */}
          <div className="flex items-start gap-2.5 mb-2">
            <span className="text-xl p-1 bg-surface-1 rounded-lg shrink-0 border border-border/40">
              {conf.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-text-primary leading-tight truncate">
                {primary.name}
              </h4>
              <span className="inline-block mt-0.5 text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                {primary.departmentName || conf.label}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 my-2.5 bg-surface-1 p-2.5 rounded-xl border border-border/60">
            {primary.address && (
              <p className="flex items-start gap-1.5 text-text-secondary leading-snug">
                <span className="text-text-tertiary shrink-0">📍</span>
                <span>{primary.address}</span>
              </p>
            )}
            {primary.zone && (
              <p className="flex items-center gap-1.5 text-text-tertiary">
                <span>🏛️</span>
                <span>{primary.zone}</span>
              </p>
            )}
            {primary.contactNumber && (
              <p className="flex items-center gap-1.5 text-text-secondary">
                <span className="text-text-tertiary">📞</span>
                <a href={`tel:${primary.contactNumber}`} className="text-accent font-bold hover:underline">
                  {primary.contactNumber}
                </a>
              </p>
            )}
            {primary.emergencyNumber && (
              <p className="flex items-center gap-1.5 text-critical font-bold">
                <span>🚨 Helpline:</span>
                <a href={`tel:${primary.emergencyNumber}`} className="hover:underline">
                  {primary.emergencyNumber}
                </a>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
            <span className="font-mono text-text-tertiary text-[10px]">
              {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-accent font-bold hover:underline flex items-center gap-1"
            >
              Get Directions ↗
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function OsmIncidentMap({
  tileUrl,
  attribution,
  incidents,
  facilities,
  zones,
  showIncidents,
  showFacilities,
  showZones,
  severityFilter,
  statusFilter,
  departmentFilter,
  selectedCoordinates,
  center,
  bounds,
  zoom,
  cityName,
  hazardLayers = {},
  showFloodHotspots = false,
  showTerrainSinks = false,
  showDrainageNetwork = false,
  showCoastalExposure = false,
  showWaterways = false,
  showHospitals = false,
  activeAlerts = [],
  fitCityTrigger = 0,
  resetViewTrigger = 0,
}: OsmIncidentMapProps & {
  fitCityTrigger?: number;
  resetViewTrigger?: number;
}) {
  const effectiveCenter = center || NAGPUR_CENTER;
  const effectiveBounds = bounds || NAGPUR_BOUNDS;
  const effectiveZoom = zoom || 11;

  // Fix default Leaflet marker assets on mount
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    if (!showIncidents) return [];
    return incidents.filter((inc) => {
      if (!inc.latitude || !inc.longitude || isNaN(inc.latitude) || isNaN(inc.longitude)) {
        return false;
      }
      if (severityFilter !== "ALL" && inc.severity?.toUpperCase() !== severityFilter) {
        return false;
      }
      if (statusFilter === "ACTIVE" && (inc.status === "RESOLVED" || inc.status === "CLOSED")) {
        return false;
      }
      if (statusFilter === "RESOLVED" && inc.status !== "RESOLVED" && inc.status !== "CLOSED") {
        return false;
      }
      if (departmentFilter !== "ALL") {
        const matches = inc.departments.some(
          (d) => d.toLowerCase().includes(departmentFilter.toLowerCase().replace(/_/g, " "))
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, showIncidents, severityFilter, statusFilter, departmentFilter]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    if (!showFacilities) return [];
    return facilities.filter((fac) => {
      if (!fac.latitude || !fac.longitude || isNaN(fac.latitude) || isNaN(fac.longitude)) {
        return false;
      }
      if (departmentFilter !== "ALL") {
        if (fac.departmentType !== departmentFilter) return false;
      }
      return true;
    });
  }, [facilities, showFacilities, departmentFilter]);

  // Group co-located facilities strictly by identical coordinate location
  // (Prevents stacked markers on top of each other, renders clear multi-item popups)
  const groupedFacilities = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; items: FacilityMarkerData[] }>();

    for (const fac of filteredFacilities) {
      // 5 decimal places is ~1 meter precision — identifies true co-location
      const key = `${fac.latitude.toFixed(5)},${fac.longitude.toFixed(5)}`;
      if (!map.has(key)) {
        map.set(key, { lat: fac.latitude, lng: fac.longitude, items: [] });
      }
      map.get(key)!.items.push(fac);
    }

    return Array.from(map.entries()).map(([k, val]) => ({
      key: k,
      latitude: val.lat,
      longitude: val.lng,
      facilities: val.items,
    }));
  }, [filteredFacilities]);

  // Incident density per zone for graduated choropleth fills (memoized)
  const zoneIncidentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const zone of zones) {
      const latLngs = (zone.polygon || []).map(([lng, lat]) => [lat, lng] as [number, number]);
      if (latLngs.length === 0) {
        map[zone.id] = 0;
        continue;
      }
      let count = 0;
      for (const inc of filteredIncidents) {
        if (isPointInPolygon([inc.latitude, inc.longitude], latLngs)) {
          count++;
        }
      }
      map[zone.id] = count;
    }
    return map;
  }, [zones, filteredIncidents]);

  // Create Custom Incident DivIcon (memoized per severity)
  const createIncidentIcon = (incident: IncidentMarkerData) => {
    const sev = incident.severity?.toUpperCase() || "MEDIUM";
    const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.MEDIUM;
    const isCritical = sev === "CRITICAL" || incident.isEmergency;

    const html = `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${isCritical ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 9999px;
            background: ${colors.glow};
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ""}
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: ${colors.bg};
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${incident.isEmergency ? "🚨" : sev === "CRITICAL" ? "🔴" : sev === "HIGH" ? "⚠️" : "📌"}
        </div>
      </div>
    `;

    return L.divIcon({
      className: "custom-incident-marker",
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  return (
    <MapContainer
      preferCanvas={true}
      center={effectiveCenter}
      zoom={effectiveZoom}
      minZoom={10}
      maxZoom={19}
      maxBounds={effectiveBounds}
      maxBoundsViscosity={0.9}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
      style={{ background: "#f8fafc" }}
    >
      <TileLayer
        key={tileUrl}
        url={tileUrl}
        attribution={attribution}
        maxZoom={19}
        maxNativeZoom={19}
      />

      <MapController
        coords={selectedCoordinates}
        center={effectiveCenter}
        bounds={effectiveBounds}
        zoom={effectiveZoom}
        fitTrigger={fitCityTrigger}
        resetTrigger={resetViewTrigger}
      />

      {/* ─── Zone Polygons (Subtle Translucent Choropleth) ─── */}
      {showZones &&
        zones.map((zone, idx) => {
          const latLngs = (zone.polygon || []).map(([lng, lat]) => [lat, lng] as [number, number]);
          if (latLngs.length === 0) return null;

          const incidentCount = zoneIncidentCounts[zone.id] ?? 0;
          // Restrained, subtle choropleth palette so streets and basemap remain visible
          const borderColor = incidentCount >= 6 ? "#ef4444" : incidentCount >= 3 ? "#f97316" : incidentCount >= 1 ? "#3b82f6" : "#64748b";
          const fillColor = incidentCount >= 6 ? "#ef4444" : incidentCount >= 3 ? "#f97316" : incidentCount >= 1 ? "#3b82f6" : "#94a3b8";
          const fillOpacity = incidentCount >= 6 ? 0.14 : incidentCount >= 3 ? 0.10 : incidentCount >= 1 ? 0.08 : 0.04;

          return (
            <Polygon
              key={zone.id || idx}
              positions={latLngs}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                },
              }}
              pathOptions={{
                color: borderColor,
                weight: 1.5,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                opacity: 0.8,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1 font-sans">
                  <p className="font-bold text-slate-900">{zone.zoneName}</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: borderColor }}>
                    Active Reports: {incidentCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {zone.areaSqKm ? `${zone.areaSqKm} sq km` : "Administrative Boundary"}
                  </p>
                </div>
              </Tooltip>

              <Popup>
                <div className="p-2 max-w-xs font-sans text-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: fillColor }} />
                    <h3 className="font-bold text-sm text-slate-900">{zone.zoneName}</h3>
                  </div>
                  <p className="text-slate-600 mb-2">
                    {zone.areaSqKm ? `Area: ${zone.areaSqKm} sq. km` : "Municipal Administrative Ward"}
                  </p>
                  <div className="font-mono font-bold p-1.5 rounded-lg bg-slate-50 border border-slate-200 mb-2" style={{ color: borderColor }}>
                    Incident Triage: {incidentCount} active reports
                  </div>
                  {zone.keyLocalities && zone.keyLocalities.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Key Localities:</p>
                      <div className="flex flex-wrap gap-1">
                        {zone.keyLocalities.slice(0, 6).map((loc) => (
                          <span key={loc} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}

      {/* ─── Sentinel Multi-Hazard Layers ─── */}
      {/* 1. Drainage Corridors */}
      {showDrainageNetwork && hazardLayers?.drainage?.features?.map((feat: any, idx: number) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || feat.geometry.type !== "LineString") return null;
        const latLngs = coords.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
        return (
          <Polyline
            key={`drain-${idx}`}
            positions={latLngs}
            pathOptions={{ color: "#0891b2", weight: 2.5, opacity: 0.8 }}
          >
            <Tooltip sticky>
              <div className="text-xs font-semibold">
                🌊 {feat.properties?.name || "Drainage Corridor"}
                <span className="block text-[10px] text-slate-500 font-normal">
                  {feat.properties?.channel_type || "Stormwater Channel"}
                </span>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {/* 2. Coastal Exposure Line */}
      {showCoastalExposure && hazardLayers?.coastal?.features?.map((feat: any, idx: number) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || feat.geometry.type !== "LineString") return null;
        const latLngs = coords.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
        return (
          <Polyline
            key={`coast-${idx}`}
            positions={latLngs}
            pathOptions={{ color: "#1e40af", weight: 3.5, dashArray: "6, 6", opacity: 0.85 }}
          >
            <Tooltip sticky>
              <div className="text-xs font-semibold text-blue-900">
                🌊 Coastal Surge Buffer ({feat.properties?.length_km || "143"} km Coastline)
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {/* 3. Low-Lying Topographic Sinks */}
      {showTerrainSinks && hazardLayers?.sinks?.features?.map((feat: any, idx: number) => {
        const geom = feat.geometry;
        if (!geom) return null;
        let polygons: [number, number][][] = [];
        if (geom.type === "Polygon") {
          polygons = [geom.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number])];
        } else if (geom.type === "MultiPolygon") {
          polygons = geom.coordinates.map((poly: any) => poly[0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]));
        }

        return polygons.map((positions, pIdx) => (
          <Polygon
            key={`sink-${idx}-${pIdx}`}
            positions={positions}
            pathOptions={{
              color: "#2563eb",
              weight: 1.5,
              fillColor: "#3b82f6",
              fillOpacity: 0.22,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs p-1">
                <p className="font-bold text-blue-900">⚠️ {feat.properties?.name || "Topographic Depression"}</p>
                <p className="text-[10px] text-slate-600">Mean Depth: ~{feat.properties?.depth_mean_m || 1.4}m</p>
              </div>
            </Tooltip>
          </Polygon>
        ));
      })}

      {/* 4. Recurrent Flood Hotspots */}
      {showFloodHotspots && hazardLayers?.hotspots?.features?.map((feat: any, idx: number) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lon, lat] = coords;

        return (
          <CircleMarker
            key={`hotspot-${idx}`}
            center={[lat, lon]}
            radius={7}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              },
            }}
            pathOptions={{
              color: "#b91c1c",
              weight: 2,
              fillColor: "#ef4444",
              fillOpacity: 0.85,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs p-1">
                <p className="font-bold text-red-700">🚨 {feat.properties?.name || "Flood Hotspot"}</p>
                <p className="text-[10px] text-slate-700">{feat.properties?.cause || "Recurrent waterlogging zone"}</p>
              </div>
            </Tooltip>
            <Popup autoPan keepInView>
              <div className="p-2 max-w-xs font-sans text-xs">
                <div className="flex items-center gap-1.5 text-red-600 font-bold mb-1">
                  <span>🚨 Flood Hotspot</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">{feat.properties?.name || "Hotspot"}</h4>
                <p className="text-slate-600 mb-2">{feat.properties?.cause || "Recurrent waterlogging zone"}</p>
                <div className="bg-red-50 p-2 rounded text-[11px] text-red-800">
                  <p className="font-semibold">Recurrence:</p>
                  <p>{feat.properties?.recurrence || "Frequent monsoon inundation"}</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* 5. Waterways & Urban River Basins */}
      {showWaterways && hazardLayers?.waterways?.features?.map((feat: any, idx: number) => {
        const geom = feat.geometry;
        if (!geom) return null;
        if (geom.type === "LineString") {
          const latLngs = geom.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
          return (
            <Polyline
              key={`waterway-line-${idx}`}
              positions={latLngs}
              pathOptions={{ color: "#0284c7", weight: 3, opacity: 0.85 }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1">
                  <p className="font-bold text-sky-800">💧 {feat.properties?.name || "Waterway"}</p>
                  <p className="text-[10px] text-slate-600">{feat.properties?.catchment || "River / Stream"}</p>
                </div>
              </Tooltip>
            </Polyline>
          );
        } else if (geom.type === "Polygon") {
          const latLngs = geom.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
          return (
            <Polygon
              key={`waterway-poly-${idx}`}
              positions={latLngs}
              pathOptions={{ color: "#0369a1", weight: 1.5, fillColor: "#38bdf8", fillOpacity: 0.25 }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1">
                  <p className="font-bold text-sky-900">🌊 {feat.properties?.name || "Water Body"}</p>
                </div>
              </Tooltip>
            </Polygon>
          );
        }
        return null;
      })}

      {/* 6. Emergency Hospitals */}
      {showHospitals && hazardLayers?.hospitals?.features?.map((feat: any, idx: number) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lon, lat] = coords;
        const hospIcon = L.divIcon({
          className: "custom-hospital-marker",
          html: `
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 8px;
              background: #ffffff;
              border: 2px solid #e11d48;
              box-shadow: 0 2px 6px rgba(225, 29, 72, 0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              cursor: pointer;
            ">🏥</div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -14],
        });

        return (
          <Marker
            key={`hosp-${idx}`}
            position={[lat, lon]}
            icon={hospIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              },
            }}
          >
            <Popup autoPan keepInView>
              <div className="p-2.5 max-w-xs font-sans text-xs">
                <div className="flex items-start gap-2 mb-2 pb-1.5 border-b border-rose-100">
                  <span className="text-lg p-1 bg-rose-50 rounded-lg">🏥</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{feat.properties?.name}</h4>
                    <span className="inline-block mt-0.5 text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                      {feat.properties?.healthcare?.replace(/_/g, " ").toUpperCase() || "HOSPITAL"}
                    </span>
                  </div>
                </div>
                {feat.properties?.address && (
                  <p className="text-[11px] text-slate-600 mb-2">📍 {feat.properties.address}</p>
                )}
                {feat.properties?.phone && (
                  <p className="text-xs text-slate-700 mb-2">
                    📞 <a href={`tel:${feat.properties.phone}`} className="text-rose-600 font-bold hover:underline">{feat.properties.phone}</a>
                  </p>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Get Directions ↗
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ─── Individual Facility Markers (No Aggregate Count Circles) ─── */}
      {showFacilities &&
        groupedFacilities.map((group) => (
          <ColocatedFacilityMarker
            key={group.key}
            locationKey={group.key}
            latitude={group.latitude}
            longitude={group.longitude}
            facilities={group.facilities}
          />
        ))}

      {/* ─── Individual Incident Markers ─── */}
      {showIncidents &&
        filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={createIncidentIcon(incident)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              },
            }}
          >
            <Popup autoPan keepInView>
              <div className="p-2.5 max-w-sm font-sans text-xs">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border">
                  <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {incident.publicReference}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{
                      background:
                        SEVERITY_COLORS[incident.severity?.toUpperCase() || "MEDIUM"]?.bg || "#eab308",
                    }}
                  >
                    {incident.severity || "MEDIUM"}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-text-primary line-clamp-2 mb-2">
                  {incident.title || "Reported Civic Incident"}
                </h4>

                <div className="space-y-1 my-2 bg-surface-1 p-2 rounded-lg border border-border/40">
                  <p className="flex justify-between">
                    <span className="text-text-tertiary">Status:</span>
                    <span className="font-semibold text-text-primary">
                      {incident.status.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-text-tertiary">Reported:</span>
                    <span className="text-text-secondary">
                      {new Date(incident.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                  {incident.departments.length > 0 && (
                    <p className="flex justify-between">
                      <span className="text-text-tertiary">Routed:</span>
                      <span className="font-medium text-accent text-right">
                        {incident.departments.join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                <Link
                  href={`/admin/incidents?search=${encodeURIComponent(incident.publicReference)}`}
                  className="w-full block text-center py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-bold transition-colors shadow-2xs mt-2"
                >
                  Inspect in Incident Tracker →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
