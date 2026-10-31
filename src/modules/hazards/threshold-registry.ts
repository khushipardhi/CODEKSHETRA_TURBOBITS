/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard Threshold & Alert Semantics Registry
   Phase 6: Authoritative Semantic Classification & Scope Isolation.

   Enforces Strict Demarcation:
   1. OFFICIAL_GOVERNMENT_WARNING: Official bulletins issued by IMD, INCOIS, CPCB, NDMA.
   2. APPLICATION_SCREENING_LEVEL: Sentinel multi-criteria calculated index (Tier 2).
   3. HYPOTHETICAL_SIMULATION_SEVERITY: Operator-configured stress test scenario output.
   4. VERIFIED_INCIDENT_SEVERITY: On-ground field reports verified by municipal personnel.
   5. ADMINISTRATIVE_REVIEW_PRIORITY: Internal operational triage for departmental desks.
   ════════════════════════════════════════════════════════ */

export type AlertSemanticScope =
  | "OFFICIAL_GOVERNMENT_WARNING"
  | "APPLICATION_SCREENING_LEVEL"
  | "HYPOTHETICAL_SIMULATION_SEVERITY"
  | "VERIFIED_INCIDENT_SEVERITY"
  | "ADMINISTRATIVE_REVIEW_PRIORITY";

export interface SemanticThresholdDefinition {
  id: string;
  category: "rainfall" | "coastal_surge" | "heat" | "wind" | "air_quality" | "waterlogging";
  scope: AlertSemanticScope;
  tierLabel: string;
  colorCode: string;
  lowerBound: number;
  upperBound?: number;
  unit: string;
  authoritySource: string;
  authorityReferenceDoc: string;
  operationalMeaning: string;
  publicAdvisory: string;
  isOfficialWarning: boolean;
  legalDisclaimer: string;
}

export const HAZARD_THRESHOLD_REGISTRY: Record<string, SemanticThresholdDefinition> = {
  // ─── 1. RAINFALL OFFICIAL WARNINGS (IMD Standard) ──────────────────
  IMD_RAIN_HEAVY: {
    id: "IMD_RAIN_HEAVY",
    category: "rainfall",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "Heavy Rain (Yellow Alert)",
    colorCode: "#eab308",
    lowerBound: 64.5,
    upperBound: 115.5,
    unit: "mm/24h",
    authoritySource: "India Meteorological Department (IMD)",
    authorityReferenceDoc: "IMD Master Meteorological Classification (Manual on Early Warning)",
    operationalMeaning: "Precipitation accumulation exceeding municipal storm-drain base capacity; low-lying intersections require pump standby.",
    publicAdvisory: "Avoid parking vehicles in low-lying subways; check local traffic police travel advisories.",
    isOfficialWarning: true,
    legalDisclaimer: "Originates from authorized IMD Regional Meteorological Centre bulletins.",
  },
  IMD_RAIN_VERY_HEAVY: {
    id: "IMD_RAIN_VERY_HEAVY",
    category: "rainfall",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "Very Heavy Rain (Orange Alert)",
    colorCode: "#f97316",
    lowerBound: 115.6,
    upperBound: 204.4,
    unit: "mm/24h",
    authoritySource: "India Meteorological Department (IMD)",
    authorityReferenceDoc: "IMD Monsoon Alert SOP Guidelines",
    operationalMeaning: "High probability of localized saucer-basin ponding; all stormwater pumping stations on continuous duty.",
    publicAdvisory: "Avoid non-essential transit; railway subways may experience temporary vehicular closures.",
    isOfficialWarning: true,
    legalDisclaimer: "Originates from authorized IMD Regional Meteorological Centre bulletins.",
  },
  IMD_RAIN_EXTREMELY_HEAVY: {
    id: "IMD_RAIN_EXTREMELY_HEAVY",
    category: "rainfall",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "Extremely Heavy Rain (Red Alert)",
    colorCode: "#dc2626",
    lowerBound: 204.5,
    unit: "mm/24h",
    authoritySource: "India Meteorological Department (IMD)",
    authorityReferenceDoc: "IMD Extreme Weather Warning Protocols",
    operationalMeaning: "Severe widespread inundation risk; high tide sluice locking will reverse drainage; EOC mobilized.",
    publicAdvisory: "Stay indoors unless in immediate low-lying structure danger; follow MCGM Disaster Management bulletins.",
    isOfficialWarning: true,
    legalDisclaimer: "Authoritative government emergency notification requiring executive administrative response.",
  },

  // ─── 2. COASTAL & MARINE OFFICIAL THRESHOLDS (INCOIS) ─────────────
  INCOIS_SPRING_TIDE_LOCKOUT: {
    id: "INCOIS_SPRING_TIDE_LOCKOUT",
    category: "coastal_surge",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "High Spring Tide Sluice Lockout",
    colorCode: "#dc2626",
    lowerBound: 4.5,
    unit: "meters Chart Datum (m CD)",
    authoritySource: "Indian National Centre for Ocean Information Services (INCOIS) / Survey of India",
    authorityReferenceDoc: "MCGM Monsoon Disaster Management Standard Operating Procedure 2024",
    operationalMeaning: "Astronomical high water exceeds outfall sill level; all gravity stormwater floodgates are locked shut to prevent seawater backflow into South Mumbai and Mithi River basin.",
    publicAdvisory: "Stay away from coastal promenades (Marine Drive, Worli, Bandra Bandstand) during peak tide window.",
    isOfficialWarning: true,
    legalDisclaimer: "Official tidal prediction based on astronomical survey datum.",
  },

  // ─── 3. APPLICATION SCREENING LEVELS (Sentinel Tier 2 Index) ───────
  SENTINEL_SCREENING_SEVERE: {
    id: "SENTINEL_SCREENING_SEVERE",
    category: "waterlogging",
    scope: "APPLICATION_SCREENING_LEVEL",
    tierLabel: "Severe Screening Susceptibility (Tier 2)",
    colorCode: "#991b1b",
    lowerBound: 80,
    upperBound: 100,
    unit: "screening index (0-100)",
    authoritySource: "Sentinel Municipal Screening Engine (Sentinel City Intelligence)",
    authorityReferenceDoc: "MCGM Chitale Committee & BRIMSTOWAD Elevation-Depression Multi-Factor Model",
    operationalMeaning: "Modelled compound vulnerability indicating critical intervention priority for municipal dewatering pumps.",
    publicAdvisory: "Municipal internal screening index indicating potential low-lying terrain depression exposure. NOT an official government evacuation order.",
    isOfficialWarning: false,
    legalDisclaimer: "Algorithmic screening output for municipal prioritization. Does NOT assert calibrated 2D flood depth in meters.",
  },
  SENTINEL_SCREENING_HIGH: {
    id: "SENTINEL_SCREENING_HIGH",
    category: "waterlogging",
    scope: "APPLICATION_SCREENING_LEVEL",
    tierLabel: "High Screening Susceptibility (Tier 2)",
    colorCode: "#ef4444",
    lowerBound: 60,
    upperBound: 79.9,
    unit: "screening index (0-100)",
    authoritySource: "Sentinel Municipal Screening Engine (Sentinel City Intelligence)",
    authorityReferenceDoc: "Copernicus GLO-30 DEM Sink & Hotspot Proximity Model",
    operationalMeaning: "Pre-position mobile dewatering units along drainage basin choke points; desilt roadside trash racks.",
    publicAdvisory: "Precautionary municipal planning index. Check live civic incident maps for verified street conditions.",
    isOfficialWarning: false,
    legalDisclaimer: "Algorithmic screening indicator. Does not confirm active water ingress.",
  },
  SENTINEL_SCREENING_MODERATE: {
    id: "SENTINEL_SCREENING_MODERATE",
    category: "waterlogging",
    scope: "APPLICATION_SCREENING_LEVEL",
    tierLabel: "Moderate Screening Susceptibility (Tier 2)",
    colorCode: "#f97316",
    lowerBound: 40,
    upperBound: 59.9,
    unit: "screening index (0-100)",
    authoritySource: "Sentinel Municipal Screening Engine (Sentinel City Intelligence)",
    authorityReferenceDoc: "Urban Impervious Surface Terrain Assessment",
    operationalMeaning: "Station traffic police near low-lying railway subways and underpasses.",
    publicAdvisory: "Standard monsoon precautionary posture.",
    isOfficialWarning: false,
    legalDisclaimer: "Planning heuristic; does not replace on-ground officer inspection.",
  },
  SENTINEL_SCREENING_LOW: {
    id: "SENTINEL_SCREENING_LOW",
    category: "waterlogging",
    scope: "APPLICATION_SCREENING_LEVEL",
    tierLabel: "Low Screening Susceptibility (Tier 2)",
    colorCode: "#22c55e",
    lowerBound: 0,
    upperBound: 39.9,
    unit: "screening index (0-100)",
    authoritySource: "Sentinel Municipal Screening Engine (Sentinel City Intelligence)",
    authorityReferenceDoc: "Topographic Elevation Model",
    operationalMeaning: "Routine municipal drainage surveillance.",
    publicAdvisory: "Normal operational conditions.",
    isOfficialWarning: false,
    legalDisclaimer: "Indicates low relative susceptibility under evaluated scenario.",
  },

  // ─── 4. HEAT STRESS STANDARDS (NOAA / IMD) ────────────────────────
  NOAA_HEAT_DANGEROUS: {
    id: "NOAA_HEAT_DANGEROUS",
    category: "heat",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "Dangerous Heat Index (>40°C)",
    colorCode: "#dc2626",
    lowerBound: 40.0,
    unit: "°C (Apparent Heat Index)",
    authoritySource: "NOAA National Weather Service / IMD Heatwave Action Plan",
    authorityReferenceDoc: "NOAA NWS Heat Index Equation (Rothfusz 1990)",
    operationalMeaning: "High human thermal stress; heat exhaustion likely and heat stroke possible with prolonged exposure.",
    publicAdvisory: "Stay hydrated; avoid direct outdoor physical exertion between 12:00 and 16:00 IST.",
    isOfficialWarning: true,
    legalDisclaimer: "Calculated from valid ambient temperature and relative humidity telemetry.",
  },

  // ─── 5. AIR QUALITY STANDARDS (CPCB National AQI) ──────────────────
  CPCB_AQI_SEVERE: {
    id: "CPCB_AQI_SEVERE",
    category: "air_quality",
    scope: "OFFICIAL_GOVERNMENT_WARNING",
    tierLabel: "Severe Air Quality (AQI >400)",
    colorCode: "#7f1d1d",
    lowerBound: 401,
    unit: "AQI Index (CPCB)",
    authoritySource: "Central Pollution Control Board (CPCB)",
    authorityReferenceDoc: "National Air Quality Index (NAQI) Standards, Ministry of Environment & Forests",
    operationalMeaning: "Emergency smog conditions; respiratory distress impacts healthy individuals and severely impacts vulnerable populations.",
    publicAdvisory: "Avoid all outdoor physical activity; keep windows closed; use N95 respirators if outdoor transit is required.",
    isOfficialWarning: true,
    legalDisclaimer: "Official statutory pollution classification.",
  },
};

/**
 * Validates whether a given alert level is an official government warning or an internal application screening index.
 */
export function getThresholdScope(thresholdId: string): AlertSemanticScope {
  const def = HAZARD_THRESHOLD_REGISTRY[thresholdId];
  return def ? def.scope : "APPLICATION_SCREENING_LEVEL";
}

/**
 * Returns a strict label badge ensuring application levels are never misrepresented as government alerts.
 */
export function formatSemanticAlertBadge(tierLabel: string, scope: AlertSemanticScope): {
  badgeText: string;
  isOfficial: boolean;
  provenanceNotice: string;
} {
  if (scope === "OFFICIAL_GOVERNMENT_WARNING") {
    return {
      badgeText: `OFFICIAL WARNING: ${tierLabel}`,
      isOfficial: true,
      provenanceNotice: "Issued by authorized statutory meteorological or environmental authority.",
    };
  }

  if (scope === "HYPOTHETICAL_SIMULATION_SEVERITY") {
    return {
      badgeText: `SIMULATION STRESS TEST: ${tierLabel}`,
      isOfficial: false,
      provenanceNotice: "Hypothetical scenario output for municipal planning. Not a live alert.",
    };
  }

  return {
    badgeText: `SCREENING ESTIMATE: ${tierLabel}`,
    isOfficial: false,
    provenanceNotice: "Algorithmic multi-criteria screening index. Administrative review priority, NOT a government public warning.",
  };
}
