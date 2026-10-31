/* ════════════════════════════════════════════════════════
   OSM Incident Map — Types and Constants
   Isolated from Leaflet runtime so SSR/prerender is safe
   ════════════════════════════════════════════════════════ */

export const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];

// 1.5x buffer strictly containing Nagpur City & Metro Jurisdiction
export const NAGPUR_BOUNDS: [[number, number], [number, number]] = [
  [20.8500, 78.7500], // South-West
  [21.4500, 79.4500], // North-East
];

export interface IncidentMarkerData {
  id: string;
  publicReference: string;
  title: string | null;
  summary?: string | null;
  locationText?: string | null;
  severity: string | null;
  status: string;
  category: string | null;
  latitude: number;
  longitude: number;
  isEmergency: boolean;
  createdAt: string;
  departments: string[];
}

export interface FacilityMarkerData {
  id: string;
  name: string;
  departmentType: string;
  departmentName: string;
  facilityType: string;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
  contactNumber?: string;
  emergencyNumber?: string;
}

export interface ZoneData {
  id: string;
  zoneName: string;
  zoneNumber: number;
  areaSqKm: number;
  polygon: [number, number][];
  keyLocalities: string[];
}

export interface OsmIncidentMapProps {
  tileUrl: string;
  attribution: string;
  incidents: IncidentMarkerData[];
  facilities: FacilityMarkerData[];
  zones: ZoneData[];
  showIncidents: boolean;
  showFacilities: boolean;
  showZones: boolean;
  severityFilter: string;
  statusFilter: string;
  departmentFilter: string;
  selectedCoordinates?: [number, number] | null;
  center?: [number, number];
  bounds?: [[number, number], [number, number]];
  zoom?: number;
  cityName?: string;
  onResetToNagpur?: () => void;
  // Sentinel Multi-Hazard Extension Props:
  hazardLayers?: Record<string, any>;
  showFloodHotspots?: boolean;
  showTerrainSinks?: boolean;
  showDrainageNetwork?: boolean;
  showCoastalExposure?: boolean;
  showWaterways?: boolean;
  showHospitals?: boolean;
  fitCityTrigger?: number;
  resetViewTrigger?: number;
  activeAlerts?: any[];
}
