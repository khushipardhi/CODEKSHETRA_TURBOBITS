/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Structured Action Catalogue & Validator
   Phase 7: Validated Tool/Action Registry for Conversational AI
   ════════════════════════════════════════════════════════ */

import { isValidCity, CITIES } from "@/lib/city-context";

export type SentinelActionType =
  | "VIEW_WARD"
  | "VIEW_FORECAST"
  | "OPEN_WARNING"
  | "VIEW_NEARBY_REPORTS"
  | "REPORT_WATERLOGGING"
  | "REPORT_DRAINAGE"
  | "REPORT_ROAD_OBSTRUCTION"
  | "OPEN_MY_REPORTS"
  | "OPEN_SIMULATION_DOSSIER"
  | "VIEW_FACILITIES"
  | "OPEN_CIVIC_REPORTS"
  | "INSPECT_TELEMETRY"
  | "CALL_HELPLINE";

export interface SentinelActionPayload {
  type: SentinelActionType;
  label: string;
  description: string;
  targetUrl: string;
  icon?: string;
  requiresConfirmation?: boolean;
  contextPayload?: {
    city: string;
    wardId?: string;
    alertReference?: string;
    dossierId?: string;
    categorySlug?: string;
    locationText?: string;
    lat?: number;
    lon?: number;
    prefillSummary?: string;
    telemetryRef?: string;
  };
}

export interface ActionValidationResult {
  isValid: boolean;
  sanitizedAction: SentinelActionPayload | null;
  rejectionReason?: string;
}

/** Supported civic report categories in the platform */
const VALID_REPORT_CATEGORIES = new Set([
  "drainage_waterlogging",
  "road_corridor_obstruction",
  "solid_waste_debris",
  "electrical_substation_hazard",
  "potable_water_contamination",
  "tree_fall_vegetation",
]);

/** Canonical Mumbai Wards */
const MUMBAI_WARDS = new Set([
  "A", "B", "C", "D", "E", "F/N", "F/S", "G/N", "G/S",
  "H/E", "H/W", "K/E", "K/W", "L", "M/E", "M/W", "N",
  "P/N", "P/S", "R/C", "R/N", "R/S", "S", "T",
]);

/**
 * Validate an action payload before rendering it to the citizen or operator.
 * Prevents hallucinated URLs, invalid report IDs, nonexistent wards, or arbitrary routes.
 */
export function validateAndSanitizeAction(
  rawAction: any,
  cityContext: string
): ActionValidationResult {
  if (!rawAction || typeof rawAction !== "object") {
    return { isValid: false, sanitizedAction: null, rejectionReason: "Action payload is null or non-object." };
  }

  const { type, label, description, targetUrl, contextPayload } = rawAction;

  if (!type || typeof type !== "string") {
    return { isValid: false, sanitizedAction: null, rejectionReason: "Missing action type." };
  }

  // Reject malicious URL schemes
  if (targetUrl && typeof targetUrl === "string") {
    const lowerUrl = targetUrl.toLowerCase().trim();
    if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:") || lowerUrl.startsWith("vbscript:")) {
      return { isValid: false, sanitizedAction: null, rejectionReason: "Blocked unsafe targetUrl protocol (javascript:/data:)." };
    }
  }

  const city = isValidCity(cityContext) ? cityContext : "mumbai";
  const cityConfig = CITIES[city] || CITIES["mumbai"];

  switch (type as SentinelActionType) {
    case "VIEW_WARD": {
      const wardId = contextPayload?.wardId || "";
      if (city === "mumbai" && wardId && !MUMBAI_WARDS.has(wardId.toUpperCase())) {
        return { isValid: false, sanitizedAction: null, rejectionReason: `Unknown ward ID '${wardId}' for Mumbai.` };
      }
      const safeWard = wardId ? wardId.toUpperCase() : "L";
      return {
        isValid: true,
        sanitizedAction: {
          type: "VIEW_WARD",
          label: label || `View Ward ${safeWard} on Map`,
          description: description || `Inspect topographic saucer depression and flood hotspots in Ward ${safeWard}.`,
          targetUrl: `/${city}/dashboard#ward-${encodeURIComponent(safeWard)}`,
          icon: "🗺️",
          contextPayload: { city, wardId: safeWard },
        },
      };
    }

    case "VIEW_FORECAST": {
      return {
        isValid: true,
        sanitizedAction: {
          type: "VIEW_FORECAST",
          label: label || "View 24h Rainfall Forecast",
          description: description || `Review high-resolution numerical ECMWF precipitation projections for ${cityConfig.name}.`,
          targetUrl: `/${city}/dashboard#telemetry`,
          icon: "🌧️",
          contextPayload: { city },
        },
      };
    }

    case "OPEN_WARNING": {
      const alertRef = contextPayload?.alertReference;
      return {
        isValid: true,
        sanitizedAction: {
          type: "OPEN_WARNING",
          label: label || "Open Municipal Warnings",
          description: description || `Review active CAP emergency warnings and IMD bulletins for ${cityConfig.name}.`,
          targetUrl: alertRef ? `/${city}/alerts?ref=${encodeURIComponent(alertRef)}` : `/${city}/alerts`,
          icon: "⚠️",
          contextPayload: { city, alertReference: alertRef },
        },
      };
    }

    case "VIEW_NEARBY_REPORTS":
    case "OPEN_MY_REPORTS": {
      return {
        isValid: true,
        sanitizedAction: {
          type: type as SentinelActionType,
          label: label || "View Civic Hazard Reports",
          description: description || `Inspect submitted citizen waterlogging and drainage reports in ${cityConfig.name}.`,
          targetUrl: `/${city}/my-reports`,
          icon: "📋",
          contextPayload: { city },
        },
      };
    }

    case "REPORT_WATERLOGGING":
    case "REPORT_DRAINAGE":
    case "REPORT_ROAD_OBSTRUCTION": {
      const categorySlug =
        type === "REPORT_ROAD_OBSTRUCTION"
          ? "road_corridor_obstruction"
          : "drainage_waterlogging";

      const locationText = contextPayload?.locationText || `${cityConfig.name} Central`;
      const summary =
        contextPayload?.prefillSummary ||
        `Localized ${type === "REPORT_ROAD_OBSTRUCTION" ? "road corridor obstruction" : "waterlogging or drainage choke"} observed near ${locationText}.`;

      const lat = typeof contextPayload?.lat === "number" ? contextPayload.lat : cityConfig.center[0];
      const lon = typeof contextPayload?.lon === "number" ? contextPayload.lon : cityConfig.center[1];

      const queryParams = new URLSearchParams({
        category: categorySlug,
        location: locationText,
        summary: summary,
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
      });

      return {
        isValid: true,
        sanitizedAction: {
          type: type as SentinelActionType,
          label: label || (type === "REPORT_ROAD_OBSTRUCTION" ? "Report Road Obstruction" : "Report Waterlogging"),
          description: description || `Prefills the official ${cityConfig.municipalAbbr} civic report form for human review before dispatch.`,
          targetUrl: `/${city}/report?${queryParams.toString()}`,
          icon: "📝",
          requiresConfirmation: true,
          contextPayload: {
            city,
            categorySlug,
            locationText,
            lat,
            lon,
            prefillSummary: summary,
          },
        },
      };
    }

    case "OPEN_SIMULATION_DOSSIER": {
      const dossierId = contextPayload?.dossierId;
      if (!dossierId || !/^DOS-[A-Z0-9_-]+$/i.test(dossierId)) {
        return { isValid: false, sanitizedAction: null, rejectionReason: `Invalid or non-existent dossier ID '${dossierId}'.` };
      }
      return {
        isValid: true,
        sanitizedAction: {
          type: "OPEN_SIMULATION_DOSSIER",
          label: label || `Open Dossier ${dossierId}`,
          description: description || `Open the full simulation report studio for run ${dossierId}.`,
          targetUrl: `/admin/${city}/simulation/report?dossierId=${encodeURIComponent(dossierId)}`,
          icon: "📊",
          contextPayload: { city, dossierId },
        },
      };
    }

    case "VIEW_FACILITIES": {
      return {
        isValid: true,
        sanitizedAction: {
          type: "VIEW_FACILITIES",
          label: label || "Verified Emergency Shelters",
          description: description || `Inspect designated municipal muster stations and emergency assembly points in ${cityConfig.name}.`,
          targetUrl: `/${city}/sentinel#shelters`,
          icon: "🏛️",
          contextPayload: { city },
        },
      };
    }

    case "INSPECT_TELEMETRY": {
      return {
        isValid: true,
        sanitizedAction: {
          type: "INSPECT_TELEMETRY",
          label: label || "Inspect Telemetry Lab",
          description: description || `Open the full-parameter environmental telemetry console for ${cityConfig.name}.`,
          targetUrl: `/admin/${city}/telemetry`,
          icon: "🔬",
          contextPayload: { city },
        },
      };
    }

    case "CALL_HELPLINE": {
      const helpline = cityConfig.hazardCapabilities?.emergencyHelpline || "1916";
      return {
        isValid: true,
        sanitizedAction: {
          type: "CALL_HELPLINE",
          label: label || `Emergency Helpline: ${helpline}`,
          description: description || `Direct telephone link to the ${cityConfig.municipalAbbr} Disaster Control Center.`,
          targetUrl: `tel:${helpline}`,
          icon: "🚨",
          contextPayload: { city },
        },
      };
    }

    default:
      return {
        isValid: false,
        sanitizedAction: null,
        rejectionReason: `Unsupported action type '${type}'.`,
      };
  }
}

/**
 * Filter an array of AI suggested actions, discarding any that fail validation.
 */
export function sanitizeActionList(
  actions: any[],
  cityContext: string
): SentinelActionPayload[] {
  if (!Array.isArray(actions)) return [];
  const validList: SentinelActionPayload[] = [];
  for (const act of actions) {
    const res = validateAndSanitizeAction(act, cityContext);
    if (res.isValid && res.sanitizedAction) {
      validList.push(res.sanitizedAction);
    } else {
      console.warn(`[ActionCatalogue] Rejected invalid action:`, res.rejectionReason);
    }
  }
  return validList;
}
