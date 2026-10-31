/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Area & Locality Context
   Phase 6 Enterprise Edition: Location Context Model Architecture
   
   Manages explicit citizen location context:
   - Selected city and locality / ward name
   - User-authorized GPS coordinates when permitted
   - Point-in-polygon ray-casting against official municipal boundary GeoJSON
   - Provider / numerical model resolution (1.0 km ECMWF / 30m GLO-30 DEM)
   - Selection method ("GPS_DEVICE" | "MANUAL_SELECTOR" | "DEFAULT_LOCALITY")
   - Privacy protection: Zero continuous background location tracking
   ════════════════════════════════════════════════════════ */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useCityContext } from "@/components/providers/city-provider";
import { CITIES } from "@/lib/city-context";
import { resolveBoundary, type ResolvedBoundary } from "@/modules/geo/point-in-polygon";
import type { FeatureCollection } from "geojson";

export interface AreaLocality {
  name: string;
  coords: [number, number];
}

export type LocationSelectionMethod = "GPS_DEVICE" | "MANUAL_SELECTOR" | "DEFAULT_LOCALITY";
export type GeographicSupportStatus = "SUPPORTED" | "OUTSIDE_JURISDICTION" | "UNRESOLVED_WARD";

export interface CitizenLocationContext {
  city: string;
  cityName: string;
  selectedLocality: string;
  userCoords: [number, number];
  isGpsAuthorized: boolean;
  resolvedWard: ResolvedBoundary | null;
  resolvedWardId?: string;
  resolvedWardName?: string;
  resolvedZoneName?: string;
  sourceLocationText: string;
  providerCoords: [number, number];
  spatialResolution: string;
  selectionMethod: LocationSelectionMethod;
  locationTimestamp: string;
  supportStatus: GeographicSupportStatus;
  statusMessage: string;
}

interface AreaContextType {
  selectedArea: string;
  areaCoords: [number, number];
  isGpsDetected: boolean;
  localities: AreaLocality[];
  resolvedWard: ResolvedBoundary | null;
  selectionMethod: LocationSelectionMethod;
  locationTimestamp: string;
  spatialResolution: string;
  providerCoords: [number, number];
  supportStatus: GeographicSupportStatus;
  statusMessage: string;
  locationContext: CitizenLocationContext;
  selectArea: (name: string, coords: [number, number], isGps?: boolean) => void;
  detectGpsLocation: () => Promise<{ success: boolean; message: string; conflictCity?: string }>;
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
}

const AreaContext = createContext<AreaContextType | undefined>(undefined);

export function AreaProvider({ children }: { children: React.ReactNode }) {
  const { city, cityConfig } = useCityContext();
  const localities = cityConfig?.localities || CITIES[city]?.localities || [];

  const defaultLocality = localities[0] || {
    name: cityConfig?.name ? `${cityConfig.name} Center` : "City Center",
    coords: cityConfig?.center || [19.076, 72.8777],
  };

  const [selectedArea, setSelectedArea] = useState<string>(defaultLocality.name);
  const [areaCoords, setAreaCoords] = useState<[number, number]>(defaultLocality.coords);
  const [isGpsDetected, setIsGpsDetected] = useState<boolean>(false);
  const [selectionMethod, setSelectionMethod] = useState<LocationSelectionMethod>("DEFAULT_LOCALITY");
  const [locationTimestamp, setLocationTimestamp] = useState<string>(new Date().toISOString());
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  // Municipal boundary GeoJSON for ray-casting
  const [boundariesGeoJSON, setBoundariesGeoJSON] = useState<FeatureCollection | null>(null);

  // Load municipal boundary polygons for active city
  useEffect(() => {
    let cancelled = false;
    async function loadBoundaries() {
      try {
        let url = `/data/${city}/${city}_bmc_wards.geojson`;
        if (city === "nagpur") url = `/data/nagpur/nagpur_nmc_zones.geojson`;
        if (city === "pune") url = `/data/pune/pune_pmc_zones.geojson`;

        const res = await fetch(url);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBoundariesGeoJSON(data);
        }
      } catch (err) {
        console.warn(`[AreaContext] Boundary load error for ${city}:`, err);
      }
    }
    loadBoundaries();
    return () => {
      cancelled = true;
    };
  }, [city]);

  // Load persisted locality on city change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`sentinel_area_${city}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name && parsed?.coords) {
          setSelectedArea(parsed.name);
          setAreaCoords(parsed.coords);
          setIsGpsDetected(!!parsed.isGps);
          setSelectionMethod(parsed.isGps ? "GPS_DEVICE" : "MANUAL_SELECTOR");
          setLocationTimestamp(parsed.timestamp || new Date().toISOString());
          return;
        }
      }
    } catch {}

    // Fallback to first locality for this city
    const initial = localities[0] || defaultLocality;
    setSelectedArea(initial.name);
    setAreaCoords(initial.coords);
    setIsGpsDetected(false);
    setSelectionMethod("DEFAULT_LOCALITY");
    setLocationTimestamp(new Date().toISOString());
  }, [city]);

  // Ray-casting point-in-polygon resolution
  const resolvedWard = useMemo<ResolvedBoundary | null>(() => {
    if (!boundariesGeoJSON || !areaCoords) return null;
    return resolveBoundary(areaCoords[0], areaCoords[1], boundariesGeoJSON);
  }, [boundariesGeoJSON, areaCoords]);

  // Provider coordinates: models like ECMWF/Open-Meteo operate on a ~1.0km grid (~0.01 deg)
  const providerCoords = useMemo<[number, number]>(() => {
    return [
      Math.round(areaCoords[0] * 100) / 100,
      Math.round(areaCoords[1] * 100) / 100,
    ];
  }, [areaCoords]);

  // Geographic support status evaluation
  const { supportStatus, statusMessage } = useMemo(() => {
    const currentBounds = cityConfig?.bounds || CITIES[city]?.bounds;
    if (currentBounds) {
      const [[swLat, swLon], [neLat, neLon]] = currentBounds;
      const isInside =
        areaCoords[0] >= swLat &&
        areaCoords[0] <= neLat &&
        areaCoords[1] >= swLon &&
        areaCoords[1] <= neLon;

      if (!isInside) {
        return {
          supportStatus: "OUTSIDE_JURISDICTION" as GeographicSupportStatus,
          statusMessage: `Coordinates (${areaCoords[0].toFixed(3)}, ${areaCoords[1].toFixed(3)}) are outside ${cityConfig?.name || city} municipal jurisdiction.`,
        };
      }
    }

    if (!resolvedWard && boundariesGeoJSON) {
      return {
        supportStatus: "UNRESOLVED_WARD" as GeographicSupportStatus,
        statusMessage: `Coordinates are within ${cityConfig?.name || city} bounding region, but do not intersect any designated administrative boundary. Baseline regional telemetry applied.`,
      };
    }

    return {
      supportStatus: "SUPPORTED" as GeographicSupportStatus,
      statusMessage: `Validated ${cityConfig?.name || city} municipal jurisdiction. Resolved to ${resolvedWard?.name || selectedArea}.`,
    };
  }, [areaCoords, city, cityConfig, resolvedWard, boundariesGeoJSON, selectedArea]);

  const selectArea = useCallback(
    (name: string, coords: [number, number], isGps: boolean = false) => {
      setSelectedArea(name);
      setAreaCoords(coords);
      setIsGpsDetected(isGps);
      const method: LocationSelectionMethod = isGps ? "GPS_DEVICE" : "MANUAL_SELECTOR";
      setSelectionMethod(method);
      const nowIso = new Date().toISOString();
      setLocationTimestamp(nowIso);

      try {
        localStorage.setItem(
          `sentinel_area_${city}`,
          JSON.stringify({ name, coords, isGps, method, timestamp: nowIso })
        );
      } catch {}
      setIsSelectorOpen(false);
    },
    [city]
  );

  const detectGpsLocation = useCallback(async (): Promise<{ success: boolean; message: string; conflictCity?: string }> => {
    if (!navigator.geolocation) {
      return { success: false, message: "Geolocation is not supported by your browser." };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // Check if coordinates fall within active city's bounding box
          const currentBounds = cityConfig?.bounds || CITIES[city]?.bounds;
          if (currentBounds) {
            const [[swLat, swLon], [neLat, neLon]] = currentBounds;
            const isWithinCity = lat >= swLat && lat <= neLat && lon >= swLon && lon <= neLon;

            if (!isWithinCity) {
              // Check if user is located inside another supported city
              for (const [otherKey, otherConf] of Object.entries(CITIES)) {
                if (otherKey === city) continue;
                const [[oSwLat, oSwLon], [oNeLat, oNeLon]] = otherConf.bounds;
                if (lat >= oSwLat && lat <= oNeLat && lon >= oSwLon && lon <= oNeLon) {
                  resolve({
                    success: false,
                    conflictCity: otherConf.slug,
                    message: `GPS coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)}) detected in ${otherConf.name}, but you are currently viewing ${cityConfig?.name || city}.`,
                  });
                  return;
                }
              }

              resolve({
                success: false,
                message: `GPS coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)}) are outside ${cityConfig?.name || city} municipal jurisdiction. Please pick a locality manually.`,
              });
              return;
            }
          }

          // Find closest known locality in active city
          let nearest = localities[0];
          let minDistance = Infinity;

          for (const loc of localities) {
            const d = Math.hypot(loc.coords[0] - lat, loc.coords[1] - lon);
            if (d < minDistance) {
              minDistance = d;
              nearest = loc;
            }
          }

          const areaLabel = `${nearest.name} (GPS detected)`;
          selectArea(areaLabel, [lat, lon], true);
          resolve({ success: true, message: `Detected location near ${nearest.name}` });
        },
        (err) => {
          resolve({
            success: false,
            message: err.code === 1 ? "Location permission denied. Please choose your area manually." : "Unable to retrieve device GPS coordinates.",
          });
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }, [city, cityConfig, localities, selectArea]);

  const locationContext = useMemo<CitizenLocationContext>(() => {
    return {
      city,
      cityName: cityConfig?.name || city,
      selectedLocality: selectedArea,
      userCoords: areaCoords,
      isGpsAuthorized: isGpsDetected,
      resolvedWard,
      resolvedWardId: resolvedWard?.id,
      resolvedWardName: resolvedWard?.name,
      resolvedZoneName: resolvedWard?.parentZone,
      sourceLocationText: resolvedWard ? `${resolvedWard.name} (${selectedArea})` : selectedArea,
      providerCoords,
      spatialResolution: "1.0 km (Open-Meteo High-Resolution Grid) · Copernicus GLO-30 DEM",
      selectionMethod,
      locationTimestamp,
      supportStatus,
      statusMessage,
    };
  }, [
    city,
    cityConfig,
    selectedArea,
    areaCoords,
    isGpsDetected,
    resolvedWard,
    providerCoords,
    selectionMethod,
    locationTimestamp,
    supportStatus,
    statusMessage,
  ]);

  return (
    <AreaContext.Provider
      value={{
        selectedArea,
        areaCoords,
        isGpsDetected,
        localities,
        resolvedWard,
        selectionMethod,
        locationTimestamp,
        spatialResolution: "1.0 km Numerical Grid · Copernicus GLO-30 DEM",
        providerCoords,
        supportStatus,
        statusMessage,
        locationContext,
        selectArea,
        detectGpsLocation,
        isSelectorOpen,
        openSelector: () => setIsSelectorOpen(true),
        closeSelector: () => setIsSelectorOpen(false),
      }}
    >
      {children}
    </AreaContext.Provider>
  );
}

export function useAreaContext(): AreaContextType {
  const ctx = useContext(AreaContext);
  if (!ctx) {
    // Safe fallback if used outside AreaProvider
    const defaultCoords: [number, number] = [19.076, 72.8777];
    return {
      selectedArea: "City Area",
      areaCoords: defaultCoords,
      isGpsDetected: false,
      localities: [],
      resolvedWard: null,
      selectionMethod: "DEFAULT_LOCALITY",
      locationTimestamp: new Date().toISOString(),
      spatialResolution: "1.0 km Grid",
      providerCoords: defaultCoords,
      supportStatus: "SUPPORTED",
      statusMessage: "Default baseline area context.",
      locationContext: {
        city: "mumbai",
        cityName: "Mumbai",
        selectedLocality: "City Area",
        userCoords: defaultCoords,
        isGpsAuthorized: false,
        resolvedWard: null,
        sourceLocationText: "City Area",
        providerCoords: defaultCoords,
        spatialResolution: "1.0 km Grid",
        selectionMethod: "DEFAULT_LOCALITY",
        locationTimestamp: new Date().toISOString(),
        supportStatus: "SUPPORTED",
        statusMessage: "Default baseline area context.",
      },
      selectArea: () => {},
      detectGpsLocation: async () => ({ success: false, message: "" }),
      isSelectorOpen: false,
      openSelector: () => {},
      closeSelector: () => {},
    };
  }
  return ctx;
}
