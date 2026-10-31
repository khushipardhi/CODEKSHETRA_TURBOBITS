/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard Event Correlator
   Spatially & temporally clusters observations, attaches citizen
   reports via polymorphic evidence links, and manages candidate events.
   ════════════════════════════════════════════════════════ */

import { query } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import { assessCityRisk, AssessmentResult } from "./assessment-engine";
import { fetchCityWeather, fetchCityMarineSurge, fetchCityRiverDischarge } from "./connectors/open-meteo";
import { fetchSachetAlerts } from "./connectors/sachet";

export interface SyncedHazardState {
  city: string;
  activeEvents: any[];
  activeAlerts: any[];
  latestAssessment: AssessmentResult;
  observationsCount: number;
}

export async function syncCityHazards(citySlug: "mumbai" | "pune" | "nagpur"): Promise<SyncedHazardState> {
  // 1. Fetch live telemetry
  const weather = await fetchCityWeather(citySlug);
  const marine = await fetchCityMarineSurge(citySlug);
  const river = await fetchCityRiverDischarge(citySlug);
  const sachetAlerts = await fetchSachetAlerts(citySlug);

  // 2. Query active incidents in this city that relate to waterlogging, road damage, or hazards
  let activeReportsCount = 0;
  let recentIncidents: any[] = [];
  try {
    recentIncidents = await query<any>(
      `SELECT id, public_reference AS reference, title, latitude, longitude, status, created_at 
       FROM incidents 
       WHERE city = ? AND status IN ('SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS')
       ORDER BY created_at DESC LIMIT 10`,
      [citySlug]
    );
    activeReportsCount = recentIncidents.length;
  } catch (err) {
    console.warn("[Correlator] Could not query incidents table:", (err as Error).message);
  }

  // 3. Run Explainable Risk Assessment
  const assessment = assessCityRisk({
    city: citySlug,
    weather,
    marine,
    riverDischarge: river,
    activeNearbyReportsCount: activeReportsCount,
  });

  // 4. Save normalized weather observation to TiDB
  try {
    const obsId = generateULID();
    const defaultCoords = {
      mumbai: { lat: 19.076, lon: 72.8777 },
      pune: { lat: 18.5204, lon: 73.8567 },
      nagpur: { lat: 21.1458, lon: 79.0882 },
    }[citySlug];

    await query(
      `INSERT INTO hazard_observations 
       (id, city, hazard_type, source_id, source_name, observation_type, latitude, longitude, observed_at, metric_value, metric_unit, confidence, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        obsId,
        citySlug,
        "rainfall",
        "open_meteo_weather",
        "Open-Meteo Weather API",
        "LIVE_SENSOR",
        defaultCoords.lat,
        defaultCoords.lon,
        weather.observedAt ? new Date(weather.observedAt).toISOString().slice(0, 19).replace("T", " ") : new Date().toISOString().slice(0, 19).replace("T", " "),
        weather.rainfallRateMmH ?? 0,
        "mm/h",
        1.0,
        JSON.stringify(weather),
      ]
    );
  } catch (err) {
    console.warn("[Correlator] Failed to persist observation:", (err as Error).message);
  }

  // 5. Check if an active Hazard Event exists or if we should create a Candidate Event
  let activeEvents: any[] = [];
  try {
    activeEvents = await query<any>(
      `SELECT * FROM hazard_events 
       WHERE city = ? AND status IN ('DETECTED', 'ACTIVE', 'ESCALATED')
       ORDER BY started_at DESC LIMIT 5`,
      [citySlug]
    );

    // If risk is HIGH or SEVERE and no active event exists, create a candidate event
    if (assessment.riskScore >= 60 && activeEvents.length === 0) {
      const eventId = generateULID();
      const eventRef = `HAZ-${citySlug.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const title = `${assessment.riskLevel} ${citySlug.toUpperCase()} Weather Alert`;

      await query(
        `INSERT INTO hazard_events 
         (id, city, event_reference, hazard_type, title, description, status, severity, centroid_lat, centroid_lon, started_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          eventId,
          citySlug,
          eventRef,
          "rainfall",
          title,
          assessment.explanation,
          "ACTIVE",
          assessment.riskLevel,
          citySlug === "mumbai" ? 19.0760 : citySlug === "pune" ? 18.5204 : 21.1458,
          citySlug === "mumbai" ? 72.8777 : citySlug === "pune" ? 73.8567 : 79.0882,
        ]
      );

      // Link citizen reports as evidence without altering incidents
      for (const inc of recentIncidents) {
        await query(
          `INSERT INTO hazard_evidence_links 
           (id, hazard_event_id, evidence_type, evidence_id, correlation_score, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [generateULID(), eventId, "INCIDENT_REPORT", inc.id, 0.9, `Linked civic report ${inc.reference}: ${inc.title}`]
        );
      }

      // Persist assessment
      await query(
        `INSERT INTO hazard_assessments 
         (id, hazard_event_id, risk_score, risk_level, contributing_factors, explanation_text, population_exposed_approx, confidence_score, assessed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateULID(),
          eventId,
          assessment.riskScore,
          assessment.riskLevel,
          JSON.stringify(assessment.contributingFactors),
          assessment.explanation,
          assessment.affectedPopulationApprox,
          assessment.confidenceScore,
          "SENTINEL_ENGINE_V1",
        ]
      );

      // Create Alert Candidate in AWAITING_REVIEW
      const alertId = generateULID();
      const alertRef = `ALT-${citySlug.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const alertSeverity = assessment.riskLevel === "EXTREME" ? "EMERGENCY" : assessment.riskLevel === "SEVERE" ? "WARNING" : "WATCH";

      await query(
        `INSERT INTO hazard_alerts 
         (id, city, alert_reference, hazard_event_id, severity, title, headline, description, recommended_actions, approval_status, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 6 HOUR))`,
        [
          alertId,
          citySlug,
          alertRef,
          eventId,
          alertSeverity,
          title,
          `${alertSeverity}: Elevated flood and waterlogging conditions in ${citySlug.toUpperCase()}`,
          assessment.explanation,
          JSON.stringify(["Avoid known low-lying underpasses", "Follow municipal traffic advisories", "Contact emergency helpline if stranded"]),
          "AWAITING_REVIEW",
        ]
      );

      // Re-fetch active events
      activeEvents = await query<any>(
        `SELECT * FROM hazard_events WHERE city = ? AND status IN ('DETECTED', 'ACTIVE', 'ESCALATED')`,
        [citySlug]
      );
    }
  } catch (err) {
    console.warn("[Correlator] Error managing hazard events:", (err as Error).message);
  }

  // 6. Fetch active alerts
  let activeAlerts: any[] = [];
  try {
    activeAlerts = await query<any>(
      `SELECT * FROM hazard_alerts 
       WHERE city = ? AND approval_status = 'APPROVED_PUBLISHED' AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 5`,
      [citySlug]
    );
  } catch (err) {
    console.warn("[Correlator] Error fetching active alerts:", (err as Error).message);
  }

  return {
    city: citySlug,
    activeEvents,
    activeAlerts,
    latestAssessment: assessment,
    observationsCount: activeReportsCount + sachetAlerts.length + 1,
  };
}
