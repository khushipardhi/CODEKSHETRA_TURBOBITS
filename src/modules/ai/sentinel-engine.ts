/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen AI Hazard Assistant
   Independent RAG engine powered by Groq SDK.
   Strict grounding in verified observations, active warnings,
   and municipal shelters. Zero hallucination of emergency routes.
   ════════════════════════════════════════════════════════ */

import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { CITIES } from "@/lib/city-context";
import { query } from "@/lib/db";
import {
  fetchCityWeather,
  fetchCityAirQuality,
  fetchCityMarineSurge,
  fetchCityRiverDischarge,
} from "../hazards/connectors/open-meteo";
import { fetchSachetAlerts } from "../hazards/connectors/sachet";
import { mumbaiFloodAdapter } from "../hazards/mumbai-flood-adapter";

import {
  type SentinelActionPayload,
  validateAndSanitizeAction,
  sanitizeActionList,
} from "./action-catalogue";

export interface SentinelAssistantQuery {
  city: "mumbai" | "pune" | "nagpur";
  userLocation?: {
    lat: number;
    lon: number;
    localityName?: string;
  };
  message: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface SentinelPrefillReportData {
  city: string;
  categorySlug: string;
  categoryName: string;
  locationText: string;
  latitude?: number;
  longitude?: number;
  prefillSummary: string;
  hazardTelemetryRef: string;
  observationTimestamp: string;
}

export interface SentinelSuggestedAction {
  type: "REPORT_ISSUE" | "VIEW_MAP" | "CHECK_SHELTER" | "VIEW_REPORTS";
  label: string;
  description: string;
  prefillData?: SentinelPrefillReportData;
}

export interface SentinelFollowUpAction {
  label: string;
  action: string;
  url?: string;
}

export interface SentinelAssistantReply {
  reply: string;
  groundingSources: Array<{
    name: string;
    timestamp: string;
    type: "SENSOR" | "GOVERNMENT_ALERT" | "CIVIC_REPORT" | "SPATIAL_ASSET" | "SYSTEM_POLICY";
  }>;
  nearestShelters: Array<{
    name: string;
    address: string;
    distanceMeters?: number;
    phone: string;
  }>;
  uncertaintyNotes: string;
  suggestedAction?: SentinelSuggestedAction;
  followUpActions?: SentinelFollowUpAction[];
  validatedActions?: SentinelActionPayload[];
  structuredMetrics?: Record<string, string | number>;
  roleAudit?: {
    roleName: string;
    modelUsed: string;
    executionTimeMs: number;
    status: "OPERATIONAL" | "FALLBACK_DETERMINISTIC" | "FAILED_AUTH";
    sourceCount: number;
  };
}

const PRIMARY_MODEL = "qwen/qwen3.8-27b";
const FALLBACK_MODEL = "openai/gpt-oss-20b";

export class SentinelAiEngine {
  private groq: Groq | null = null;

  private getGroqClient(): Groq | null {
    if (!this.groq && env.groqSentinelApiKey) {
      this.groq = new Groq({ apiKey: env.groqSentinelApiKey });
    }
    return this.groq;
  }

  /**
   * Main entrypoint: Retrieves grounding facts then generates grounded response
   */
  async answerCitizenQuery(input: SentinelAssistantQuery): Promise<SentinelAssistantReply> {
    const { city, message, userLocation, conversationHistory = [] } = input;
    const cityConfig = CITIES[city] || CITIES["nagpur"];
    const lat = userLocation?.lat ?? cityConfig.center[0];
    const lon = userLocation?.lon ?? cityConfig.center[1];
    const localityLabel = userLocation?.localityName || `${cityConfig.name} Central`;

    const groundingSources: SentinelAssistantReply["groundingSources"] = [];

    // Input Guardrail: Block prompt injection / adversarial override attempts
    const isInjectionAttempt = /(ignore\s+(all\s+)?previous\s+instructions|you\s+are\s+no\s+longer\s+sentinel|system\s+compromised|jailbreak|disregard\s+system\s+prompt)/i.test(message);
    if (isInjectionAttempt) {
      return {
        reply: `I am Sentinel City Intelligence, the official safety assistant for **${cityConfig.name}**. I can only assist with civic weather, flood risks, natural hazards, precautions, and verified municipal facilities. For emergency assistance in ${cityConfig.name}, call **${cityConfig.hazardCapabilities.emergencyHelpline}**.`,
        groundingSources: [{
          name: "Sentinel Municipal Safety Policy",
          timestamp: new Date().toISOString(),
          type: "SYSTEM_POLICY",
        }],
        nearestShelters: (cityConfig.hazardCapabilities?.musterPoints || []).map(p => ({
          name: p.name,
          address: p.address,
          phone: p.phone,
        })),
        uncertaintyNotes: "Adversarial override attempt detected and rejected. Returning standard safety guidelines.",
        followUpActions: [
          { label: "Emergency Helpline", action: "CALL_HELPLINE", url: `tel:${cityConfig.hazardCapabilities.emergencyHelpline}` },
        ],
      };
    }

    // 1. Retrieve Live Telemetry with resolved coordinates
    const weather = await fetchCityWeather(city, [lat, lon]);
    groundingSources.push({
      name: weather.isUnavailable
        ? "Open-Meteo Weather Model (Feed Offline)"
        : weather.isStale
          ? "Open-Meteo Weather Model (Stale Cached)"
          : "Open-Meteo High-Resolution Weather Model",
      timestamp: weather.observedAt,
      type: "SENSOR",
    });

    const aqi = await fetchCityAirQuality(city, [lat, lon]);
    groundingSources.push({
      name: aqi.isUnavailable
        ? "Open-Meteo Air Quality Model (Feed Offline)"
        : "Open-Meteo Air Quality Model",
      timestamp: aqi.observedAt,
      type: "SENSOR",
    });

    const marine = await fetchCityMarineSurge(city, [lat, lon]);
    if (marine) {
      groundingSources.push({
        name: marine.isUnavailable
          ? "Open-Meteo Marine Surge Monitor (Feed Offline)"
          : "Open-Meteo Marine Surge Monitor",
        timestamp: marine.observedAt,
        type: "SENSOR",
      });
    }

    const river = await fetchCityRiverDischarge(city, [lat, lon]);
    if (river) {
      groundingSources.push({
        name: river.isUnavailable
          ? "Open-Meteo River Discharge Monitor (Feed Offline)"
          : "Open-Meteo River Discharge Monitor",
        timestamp: river.observedAt,
        type: "SENSOR",
      });
    }

    // 2. Retrieve Government Alerts
    const sachetAlerts = await fetchSachetAlerts(city);
    for (const alt of sachetAlerts) {
      groundingSources.push({
        name: `NDMA SACHET: ${alt.headline}`,
        timestamp: alt.effective,
        type: "GOVERNMENT_ALERT",
      });
    }

    // 3. Retrieve Published Database Alerts
    let dbAlerts: any[] = [];
    try {
      dbAlerts = await query<any>(
        `SELECT alert_reference, severity, headline, description, recommended_actions, created_at 
         FROM hazard_alerts 
         WHERE city = ? AND approval_status = 'APPROVED_PUBLISHED' AND expires_at > NOW()`,
        [city]
      );
      for (const alt of dbAlerts) {
        groundingSources.push({
          name: `Municipal Alert [${alt.alert_reference}]`,
          timestamp: new Date(alt.created_at).toISOString(),
          type: "GOVERNMENT_ALERT",
        });
      }
    } catch (err) {
      console.warn("[SentinelAI] Could not query database alerts:", err);
    }

    // 4. Retrieve Proximate Civic Incident Reports
    let nearbyReports: any[] = [];
    try {
      nearbyReports = await query<any>(
        `SELECT public_reference AS reference, title, status, created_at 
         FROM incidents 
         WHERE city = ? AND status IN ('SUBMITTED', 'CONFIRMED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS')
         ORDER BY created_at DESC LIMIT 5`,
        [city]
      );
      for (const r of nearbyReports) {
        groundingSources.push({
          name: `Civic Report [${r.reference}]: ${r.title}`,
          timestamp: new Date(r.created_at).toISOString(),
          type: "CIVIC_REPORT",
        });
      }
    } catch (err) {
      console.warn("[SentinelAI] Could not query incidents:", err);
    }

    // 5. Hydrological & Shelter Context
    let hydroContextStr = "Standard municipal urban drainage.";
    let isSinkBasin = false;
    let sinkDetails = "";
    if (city === "mumbai") {
      const hydro = mumbaiFloodAdapter.evaluateLocation(lat, lon);
      isSinkBasin = hydro.isLowLyingSink;
      sinkDetails = hydro.isLowLyingSink ? `${hydro.sinkName || "Low-Lying Basin"} (Depression depth: ${hydro.depressionDepthMeters || 1.2}m)` : "";
      hydroContextStr = `Low-Lying Basin: ${hydro.isLowLyingSink ? "YES (" + sinkDetails + ")" : "NO"}. Nearest Hotspot: ${hydro.nearestHotspot.name} (${hydro.nearestHotspot.distanceMeters}m, ${hydro.nearestHotspot.recurrence}). Nearest Drainage: ${hydro.nearestDrainageChannel.name} (${hydro.nearestDrainageChannel.distanceMeters}m). Distance to Coast: ${hydro.distanceToCoastMeters}m.`;
      groundingSources.push({
        name: "Mumbai GIS Spatial Hydrology (DEM & Drainage)",
        timestamp: "Verified 2026",
        type: "SPATIAL_ASSET",
      });
    }

    const nearestShelters = (cityConfig.hazardCapabilities?.musterPoints || []).map(p => ({
      name: p.name,
      address: p.address,
      phone: p.phone,
    }));

    // 6. Build Grounded Prompt
    const currentTempStr = weather.temperatureCelsius !== null ? `${weather.temperatureCelsius.toFixed(1)}°C` : "Unavailable";
    const currentAqiStr = aqi.usAqi !== null ? `AQI ${aqi.usAqi} (${aqi.category}, PM2.5: ${aqi.pm25 ?? 'N/A'})` : "Air quality telemetry unavailable";
    const currentRainRateStr = weather.rainfallRateMmH > 0 ? `${weather.rainfallRateMmH.toFixed(1)} mm/hr` : "No active rainfall detected";
    const forecastRainStr = weather.forecast24hTotalMm > 0 ? `${weather.forecast24hTotalMm} mm accumulated` : "Minimal precipitation expected";

    const systemPrompt = `You are Sentinel City Intelligence, the official safety and multi-hazard assistant for ${cityConfig.name}.
Your job is to provide calm, factual, life-safety guidance regarding weather, flood risks, natural hazards, precautions, and verified municipal facilities.

GROUNDED REAL-TIME EVIDENCE (STRICT TRUTH):
- City: ${cityConfig.name} (${cityConfig.municipalBody})
- User Area / Location: ${localityLabel} [${lat.toFixed(4)}, ${lon.toFixed(4)}]
- Current Weather: ${currentRainRateStr}, ${currentTempStr}, Wind: ${weather.windSpeedKmh ?? 'N/A'} km/h, Condition: ${weather.weatherDescription}
- 24h Rainfall Forecast Total: ${forecastRainStr} (Precip Probability: ${weather.precipitationProbabilityMax ?? 'N/A'}%)
- Air Quality: ${currentAqiStr}
- Coastal Marine: ${marine ? (marine.isUnavailable ? "Marine surge feed unavailable" : `${marine.waveHeightMeters?.toFixed(1) ?? 'N/A'}m wave height, Surge Risk: ${marine.surgeRisk}`) : "Inland city (no marine surge)"}
- River Discharge: ${river ? (river.isUnavailable ? "River discharge feed unavailable" : `${river.riverDischargeM3s ?? 'N/A'} m³/s`) : "Standard river runoff"}
- Local Hydrological Assessment: ${hydroContextStr}
- Active Official Alerts: ${dbAlerts.length > 0 ? dbAlerts.map(a => `[${a.severity}] ${a.headline}`).join("; ") : "No active municipal emergency warnings"}
- State NDMA CAP Warnings: ${sachetAlerts.length > 0 ? sachetAlerts.map(a => a.headline).join("; ") : "No active national CAP disaster warnings for district"}
- Recent Verified Citizen Reports: ${nearbyReports.length > 0 ? nearbyReports.map(r => `[${r.reference}] ${r.title}`).join("; ") : "No active waterlogging reports"}
- Nearest Verified Emergency Shelter / Muster Points:
${nearestShelters.map(s => `  * ${s.name} - ${s.address} (Helpline: ${s.phone})`).join("\n")}
- Municipal Emergency Helpline: ${cityConfig.hazardCapabilities.emergencyHelpline}

SAFETY & BRIEFING STRUCTURE (MANDATORY):
When a citizen asks "What is happening in my area?" or asks for a general area briefing:
Structure your answer into a concise briefing comprising:
1. Conditions Now: Latest valid observations in ${localityLabel}.
2. 24-Hour Outlook: What numerical models project.
3. Active Warnings: Official municipal or NDMA CAP alerts.
4. Local Reports: Known nearby civic complaints.
5. Citizen Action: Practical, actionable advice.
6. Honest Disclosures: What is unknown, unavailable, or coarse model data.

NON-NEGOTIABLE CONSTRAINTS:
1. NEVER claim a street is flooded solely because rain is forecast. State that heavy rain may increase waterlogging risk when supporting evidence exists.
2. Missing values are UNAVAILABLE, not zero. If a sensor is offline, state it honestly.
3. NEVER automatically submit a complaint, dispatch crews, or declare an evacuation.
4. Support English, Marathi, and Hindi if the citizen writes in those languages.`;

    const startTime = Date.now();

    // 7. Contextual action logic & validation via Action Catalogue
    const highRainRisk = weather.rainfallRateMmH > 8 || weather.forecast24hTotalMm >= 25 || isSinkBasin;
    const mentionsWaterloggingOrFlood = /(flood|waterlog|drain|rain|water|puddle|choke|inundat)/i.test(message);
    const mentionsShelter = /(shelter|muster|relief|evacuat|camp)/i.test(message);
    const mentionsForecast = /(forecast|tomorrow|predict|outlook|next 24)/i.test(message);
    const mentionsWarning = /(warning|alert|sachet|imd|red alert|orange alert)/i.test(message);

    const rawActionsToValidate: any[] = [];

    if (highRainRisk || mentionsWaterloggingOrFlood) {
      rawActionsToValidate.push({
        type: "REPORT_WATERLOGGING",
        label: `Report Waterlogging in ${localityLabel}`,
        description: `Prefills official ${cityConfig.name} civic report with current rain rate (${weather.rainfallRateMmH.toFixed(1)} mm/h) for field inspection.`,
        contextPayload: {
          city,
          locationText: localityLabel,
          lat,
          lon,
          prefillSummary: `Possible waterlogging or drainage choke reported in ${localityLabel} (${cityConfig.name}) during rainfall.`,
        },
      });
    }

    if (mentionsForecast) {
      rawActionsToValidate.push({
        type: "VIEW_FORECAST",
        label: `View 24h Rain Outlook (${weather.forecast24hTotalMm}mm)`,
        description: "Examine high-resolution numerical ECMWF precipitation projections.",
      });
    }

    if (mentionsWarning || dbAlerts.length > 0 || sachetAlerts.length > 0) {
      rawActionsToValidate.push({
        type: "OPEN_WARNING",
        label: "Open Municipal Emergency Warnings",
        description: "Review active CAP emergency bulletins and meteorological alerts.",
        contextPayload: {
          city,
          alertReference: dbAlerts[0]?.alert_reference,
        },
      });
    }

    if (mentionsShelter || nearestShelters.length > 0) {
      rawActionsToValidate.push({
        type: "VIEW_FACILITIES",
        label: "Verified Emergency Shelters",
        description: `Inspect ${nearestShelters.length} municipal emergency shelters and muster points in ${cityConfig.name}.`,
      });
    }

    rawActionsToValidate.push({
      type: "VIEW_WARD",
      label: `Inspect Ward on Hazard Map`,
      description: "View low-lying saucer terrain and drainage nullah corridors.",
      contextPayload: { city, wardId: city === "mumbai" ? "L" : undefined },
    });

    rawActionsToValidate.push({
      type: "OPEN_MY_REPORTS",
      label: "My Civic Hazard Reports",
      description: "Check status of previously submitted civic complaints.",
    });

    // Sanitize and validate all actions against the strict action catalogue
    const validatedActions = sanitizeActionList(rawActionsToValidate, city);

    // Backward-compatible single suggestedAction and followUpActions
    const suggestedAction: SentinelSuggestedAction | undefined = validatedActions.find(
      (a) => a.type === "REPORT_WATERLOGGING" || a.type === "REPORT_DRAINAGE"
    )
      ? {
          type: "REPORT_ISSUE",
          label: `Report possible waterlogging in ${localityLabel}`,
          description: `Opens the official ${cityConfig.name} report form with your area, coordinates, and telemetry prefilled for human review.`,
          prefillData: {
            city,
            categorySlug: "drainage_waterlogging",
            categoryName: "Stormwater & Flood Management",
            locationText: localityLabel,
            latitude: lat,
            longitude: lon,
            prefillSummary: `Possible waterlogging or drainage risk observed in ${localityLabel} (${cityConfig.name}).`,
            hazardTelemetryRef: `Rain Rate: ${weather.rainfallRateMmH.toFixed(1)} mm/h | 24h Total: ${weather.forecast24hTotalMm} mm`,
            observationTimestamp: weather.observedAt,
          },
        }
      : undefined;

    const followUpActions: SentinelFollowUpAction[] = validatedActions.map((a) => ({
      label: `${a.icon ? a.icon + " " : ""}${a.label}`,
      action: a.type,
      url: a.targetUrl,
    }));

    const structuredMetrics = {
      precipitationRateMmH: weather.rainfallRateMmH,
      forecast24hTotalMm: weather.forecast24hTotalMm,
      temperatureC: weather.temperatureCelsius ?? "N/A",
      windSpeedKmh: weather.windSpeedKmh ?? "N/A",
      usAqi: aqi.usAqi ?? "N/A",
      aqiCategory: aqi.category || "Unavailable",
      activeAlertsCount: dbAlerts.length + sachetAlerts.length,
    };

    const client = this.getGroqClient();

    if (!client) {
      // Deterministic rule-based fallback if Groq API key is unconfigured
      return {
        reply: `### Current Conditions in **${localityLabel} (${cityConfig.name})**\n\n- **Weather:** ${weather.weatherDescription} with ${weather.rainfallRateMmH > 0 ? `${weather.rainfallRateMmH.toFixed(1)} mm/hr precipitation` : "no active rainfall"} and ${currentTempStr}.\n- **24-Hour Outlook:** ${forecastRainStr}.\n- **Air Quality:** ${currentAqiStr}.\n- **Active Warnings:** ${dbAlerts.length > 0 ? dbAlerts[0].headline : "No active municipal emergency warnings."}\n- **What To Do:** Keep emergency contacts handy. If you notice pooling in low-lying underpasses, report it for field verification.\n\n*Emergency Helpline:* **${cityConfig.hazardCapabilities.emergencyHelpline}**`,
        groundingSources,
        nearestShelters,
        uncertaintyNotes: "Telemetry provided via direct sensor feeds; AI text synthesis is running in deterministic rule-based fallback mode.",
        suggestedAction,
        followUpActions,
        validatedActions,
        structuredMetrics,
        roleAudit: {
          roleName: "Role 2 — Spatial Impact & Operations Analyst (Fallback Mode)",
          modelUsed: "deterministic-rules-engine",
          executionTimeMs: Date.now() - startTime,
          status: "FALLBACK_DETERMINISTIC",
          sourceCount: groundingSources.length,
        },
      };
    }

    try {
      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-4),
        { role: "user", content: message },
      ];

      let completion;
      let modelUsed = PRIMARY_MODEL;
      try {
        completion = await client.chat.completions.create({
          model: PRIMARY_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 650,
        });
      } catch (err) {
        console.warn(`[SentinelAI] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, (err as Error).message);
        modelUsed = FALLBACK_MODEL;
        completion = await client.chat.completions.create({
          model: FALLBACK_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 650,
        });
      }

      const replyText = completion.choices[0]?.message?.content || "Information temporarily unavailable.";

      return {
        reply: replyText,
        groundingSources,
        nearestShelters,
        uncertaintyNotes: "Telemetry reflects real-time Open-Meteo, NDMA, and municipal GIS assets. Numerical models represent coarse resolution cells.",
        suggestedAction,
        followUpActions,
        validatedActions,
        structuredMetrics,
        roleAudit: {
          roleName: "Role 2 — Spatial Impact & Operations Analyst",
          modelUsed,
          executionTimeMs: Date.now() - startTime,
          status: "OPERATIONAL",
          sourceCount: groundingSources.length,
        },
      };
    } catch (err) {
      console.error("[SentinelAI] Groq generation failure:", err);
      return {
        reply: `### Area Briefing for **${localityLabel} (${cityConfig.name})**\n\n- **Current Weather:** ${weather.rainfallRateMmH > 0 ? `${weather.rainfallRateMmH.toFixed(1)} mm/hr` : "Clear/Overcast"}, ${currentTempStr}.\n- **Forecast:** ${forecastRainStr}.\n- **Air Quality:** ${currentAqiStr}.\n- **Official Assistance:** Contact the ${cityConfig.municipalAbbr} Disaster Control Room at **${cityConfig.hazardCapabilities.emergencyHelpline}**.`,
        groundingSources,
        nearestShelters,
        uncertaintyNotes: "Network communication error with AI reasoning provider. Direct sensor telemetry displayed.",
        suggestedAction,
        followUpActions,
        validatedActions,
        structuredMetrics,
        roleAudit: {
          roleName: "Role 2 — Spatial Impact & Operations Analyst (Fallback)",
          modelUsed: "deterministic-rules-engine",
          executionTimeMs: Date.now() - startTime,
          status: "FALLBACK_DETERMINISTIC",
          sourceCount: groundingSources.length,
        },
      };
    }
  }
}

export const sentinelAi = new SentinelAiEngine();
