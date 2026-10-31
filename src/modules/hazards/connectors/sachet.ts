/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — NDMA SACHET Disaster Alert Connector
   Fetches official Common Alerting Protocol (CAP) feeds from NDMA.
   Filters by city/district keywords with fallback and health tracking.
   ════════════════════════════════════════════════════════ */

import { hazardCache } from "../cache";
import { healthMonitor } from "../health-monitor";
import { SachetCapAlert } from "./types";

const SACHET_FEED_URL = "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails";
const FETCH_TIMEOUT_MS = 10000;

export async function fetchSachetAlerts(citySlug: string): Promise<SachetCapAlert[]> {
  const cacheKey = `sachet_alerts:${citySlug}`;
  const cached = hazardCache.get<SachetCapAlert[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const sourceId = "sachet_alerts";
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(SACHET_FEED_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SentinelCityIntelligence/1.0",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`NDMA SACHET returned HTTP ${res.status}`);
    }

    const payload = await res.json();
    const latency = Date.now() - startTime;
    await healthMonitor.recordSuccess(sourceId, latency);

    const rawList = Array.isArray(payload) ? payload : (payload.data || payload.alerts || []);
    const cityTerms: Record<string, string[]> = {
      mumbai: ["mumbai", "bombay", "thane", "palghar", "raigad", "konkan"],
      pune: ["pune", "poona", "haveli", "pimpri", "chinchwad", "ghat"],
      nagpur: ["nagpur", "vidarbha", "kamthi", "wardha", "bhandara"],
    };

    const targetKeywords = cityTerms[citySlug] || [citySlug];

    const matchedAlerts: SachetCapAlert[] = [];
    for (const item of rawList) {
      const areaDesc = (item.area_description || item.areaDesc || "").toLowerCase();
      const headline = (item.headline || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const fullText = `${areaDesc} ${headline} ${desc}`;

      const matches = targetKeywords.some(keyword => fullText.includes(keyword));
      if (matches) {
        matchedAlerts.push({
          alertId: String(item.alert_id || item.identifier || Math.random().toString(36).substring(2, 9)),
          identifier: item.identifier || "SACHET-CAP",
          sender: item.sender || "NDMA / IMD Disaster Warning",
          sent: item.sent || new Date().toISOString(),
          status: item.status || "Actual",
          msgType: item.msg_type || "Alert",
          scope: item.scope || "Public",
          category: item.category || "Met",
          event: item.event || "Severe Weather Alert",
          urgency: item.urgency || "Expected",
          severity: item.severity || "Moderate",
          certainty: item.certainty || "Likely",
          headline: item.headline || "Official Government Weather Advisory",
          description: item.description || "Precautionary alert issued by state disaster management authorities.",
          instruction: item.instruction || "Citizens are advised to stay alert and follow local municipal guidelines.",
          areaDesc: item.area_description || item.areaDesc || citySlug.toUpperCase(),
          effective: item.effective || new Date().toISOString(),
          expires: item.expires || new Date(Date.now() + 86400000).toISOString(),
        });
      }
    }

    // Cache filtered alerts for 5 minutes (300 seconds)
    hazardCache.set(cacheKey, matchedAlerts, 300);
    return matchedAlerts;
  } catch (err) {
    const latency = Date.now() - startTime;
    await healthMonitor.recordFailure(sourceId, (err as Error).message, latency);

    // Return empty array on failure without throwing, preventing crash
    return [];
  }
}
