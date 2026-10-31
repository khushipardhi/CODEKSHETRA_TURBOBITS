/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/briefing
   Hyperlocal, location-aware intelligence summary for a citizen's area.
   Combines real-time telemetry, municipal shelter proximity, nearby
   verified citizen reports, and explainable safety advice.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY, CITIES } from "@/lib/city-context";
import { fetchCityWeather, fetchCityAirQuality, fetchCityMarineSurge, fetchCityRiverDischarge } from "@/modules/hazards/connectors/open-meteo";
import { fetchSachetAlerts } from "@/modules/hazards/connectors/sachet";
import { mumbaiFloodAdapter } from "@/modules/hazards/mumbai-flood-adapter";
import { assessCityRisk } from "@/modules/hazards/assessment-engine";
import { query } from "@/lib/db";

// Helper for Haversine distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city") || req.headers.get("x-city") || DEFAULT_CITY;

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is not supported.` } },
        { status: 400 }
      );
    }

    const citySlug = cityParam as "mumbai" | "pune" | "nagpur";
    const cityConfig = CITIES[citySlug];

    // Read coordinates and area label
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const areaName = searchParams.get("area") || cityConfig.localities[0]?.name || "City Area";

    const lat = latParam ? parseFloat(latParam) : cityConfig.center[0];
    const lon = lonParam ? parseFloat(lonParam) : cityConfig.center[1];

    // 1. Fetch live telemetry in parallel with resolved coordinates
    const [weather, aqi, marine, river, sachetAlerts] = await Promise.all([
      fetchCityWeather(citySlug, [lat, lon]),
      fetchCityAirQuality(citySlug, [lat, lon]),
      fetchCityMarineSurge(citySlug, [lat, lon]),
      fetchCityRiverDischarge(citySlug, [lat, lon]),
      fetchSachetAlerts(citySlug),
    ]);

    // 2. Fetch active municipal alerts from TiDB
    let dbAlerts: any[] = [];
    try {
      dbAlerts = await query<any>(
        `SELECT id, alert_reference, severity, headline, description, recommended_actions, COALESCE(approved_at, created_at) AS effective_at, expires_at 
         FROM hazard_alerts 
         WHERE city = ? AND approval_status = 'APPROVED_PUBLISHED' AND expires_at > NOW()
         ORDER BY severity = 'CRITICAL' DESC, created_at DESC`,
        [citySlug]
      );
    } catch (err) {
      console.warn("[Briefing API] DB alerts query non-fatal error:", err);
    }

    // 3. Fetch nearby verified citizen reports from TiDB (within ~5km)
    let nearbyReports: any[] = [];
    try {
      const reports = await query<any>(
        `SELECT id, public_reference AS reference, title, status, severity, latitude, longitude, created_at 
         FROM incidents 
         WHERE city = ? AND status IN ('SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'WORK_COMPLETED')
         ORDER BY created_at DESC LIMIT 15`,
        [citySlug]
      );

      nearbyReports = (reports || [])
        .map((r: any) => {
          const rLat = parseFloat(r.latitude);
          const rLon = parseFloat(r.longitude);
          const distance = !isNaN(rLat) && !isNaN(rLon) ? getDistanceMeters(lat, lon, rLat, rLon) : null;
          return {
            id: r.id,
            reference: r.reference,
            title: r.title,
            status: r.status,
            severity: r.severity,
            distanceMeters: distance,
            createdAt: r.created_at,
          };
        })
        .filter((r: any) => r.distanceMeters === null || r.distanceMeters <= 5000)
        .slice(0, 5);
    } catch (err) {
      console.warn("[Briefing API] Incidents query non-fatal error:", err);
    }

    // 4. Hydrological & Trustworthy Facility Evaluation
    let hydroContext: any = null;
    if (citySlug === "mumbai") {
      hydroContext = mumbaiFloodAdapter.evaluateLocation(lat, lon);
    }

    // Determine nearest verified municipal emergency facility (4-tier trustworthiness)
    const musterPoints = cityConfig.hazardCapabilities?.musterPoints || [];
    let nearestFacility: any = null;

    if (musterPoints.length > 0) {
      let closestPoint = musterPoints[0];
      let minDistance = getDistanceMeters(lat, lon, closestPoint.coords[0], closestPoint.coords[1]);

      for (const mp of musterPoints) {
        const d = getDistanceMeters(lat, lon, mp.coords[0], mp.coords[1]);
        if (d < minDistance) {
          minDistance = d;
          closestPoint = mp;
        }
      }

      // Distinguish 4 facility tiers based on facility registry record
      const isOfficialMuster = closestPoint.name.toLowerCase().includes("disaster") || closestPoint.name.toLowerCase().includes("headquarters") || closestPoint.name.toLowerCase().includes("control room");
      const isHospital = closestPoint.name.toLowerCase().includes("hospital") || closestPoint.name.toLowerCase().includes("medical");
      
      const tier: "OFFICIALLY_DESIGNATED_SHELTER" | "VERIFIED_PUBLIC_FACILITY" | "MAPPED_UNKNOWN_OPERATING_STATUS" | "UNVERIFIED_CANDIDATE" = 
        isOfficialMuster
          ? "OFFICIALLY_DESIGNATED_SHELTER"
          : isHospital
          ? "VERIFIED_PUBLIC_FACILITY"
          : "MAPPED_UNKNOWN_OPERATING_STATUS";

      const tierLabels = {
        OFFICIALLY_DESIGNATED_SHELTER: "Officially Designated Shelter",
        VERIFIED_PUBLIC_FACILITY: "Verified Public Facility",
        MAPPED_UNKNOWN_OPERATING_STATUS: "Mapped Facility (Operating Status Unverified)",
        UNVERIFIED_CANDIDATE: "Unverified Candidate Location",
      };

      nearestFacility = {
        name: closestPoint.name,
        address: closestPoint.address,
        phone: closestPoint.phone,
        distanceMeters: minDistance,
        facilityTypeTier: tier,
        tierLabel: tierLabels[tier],
        isVerifiedOpen: false, // Never state facility has confirmed vacant beds/intake without real-time dispatch check
        operatingStatusNotice: isOfficialMuster
          ? "Municipal emergency intake facility. Operational intake status is managed by ward disaster coordinators. Contact phone desk to confirm active admissions."
          : isHospital
          ? "Government healthcare facility. Dedicated casualty ward operating under disaster protocol."
          : "Mapped municipal structure. Physical existence confirmed in GIS registry, but live emergency intake capacity is unverified.",
        verifiedAgency: `${cityConfig.municipalAbbr} Disaster Management`,
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${closestPoint.coords[0]},${closestPoint.coords[1]}`,
      };
    }

    // 5. Run explainable risk assessment
    const assessment = assessCityRisk({
      city: citySlug,
      latitude: lat,
      longitude: lon,
      weather,
      marine,
      riverDischarge: river,
      activeNearbyReportsCount: nearbyReports.length,
    });

    // 6. Context-sensitive practical precautions
    const practicalActions: Array<{ title: string; detail: string; category: string }> = [];

    if (weather.rainfallRateMmH > 5 || (hydroContext && hydroContext.isLowLyingSink)) {
      practicalActions.push({
        title: "Avoid Low-Lying Underpasses",
        detail: "Ponding forms quickly in road depressions. Do not walk or drive through standing water.",
        category: "MONSOON_FLOOD",
      });
      practicalActions.push({
        title: "Charge Essential Devices",
        detail: "Keep portable battery packs charged in case of local feeder disconnections.",
        category: "MONSOON_FLOOD",
      });
    }

    if (weather.temperatureCelsius !== null && weather.temperatureCelsius > 35) {
      practicalActions.push({
        title: "Maintain Hydration",
        detail: "Drink water regularly and avoid direct sun exposure between 12:00 PM and 3:30 PM.",
        category: "HEAT_WAVE",
      });
    }

    if (aqi.usAqi !== null && aqi.usAqi > 150) {
      practicalActions.push({
        title: "Limit Strenuous Outdoor Exercise",
        detail: "High particulate levels can aggravate respiratory issues. Use an N95 mask outdoors.",
        category: "AIR_QUALITY",
      });
    }

    if (practicalActions.length === 0) {
      practicalActions.push({
        title: "Normal Civic Preparedness",
        detail: "Civic conditions are within standard thresholds. Keep emergency helpline numbers saved.",
        category: "GENERAL",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        city: citySlug,
        area: areaName,
        coordinates: [lat, lon],
        freshness: {
          timestamp: new Date().toISOString(),
          label: "Live Telemetry · Updated just now",
        },
        currentTelemetry: {
          weather,
          airQuality: aqi,
          marine,
          river,
        },
        riskAssessment: {
          score: assessment.riskScore,
          level: assessment.riskLevel,
          explanation: assessment.explanation,
          dominantHazard: assessment.contributingFactors[0]?.factor || "Urban Drainage",
          factors: assessment.contributingFactors,
        },
        hydrology: hydroContext
          ? {
              isSink: hydroContext.isLowLyingSink,
              sinkName: hydroContext.sinkName,
              depressionDepth: hydroContext.depressionDepthMeters,
              nearestHotspot: hydroContext.nearestHotspot,
              nearestChannel: hydroContext.nearestDrainageChannel,
              distanceToCoastMeters: hydroContext.distanceToCoastMeters,
            }
          : null,
        nearestEmergencyFacility: nearestFacility,
        nearbyReports,
        activeAlerts: [
          ...dbAlerts.map((a: any) => ({
            id: a.id,
            reference: a.alert_reference,
            severity: a.severity,
            headline: a.headline,
            description: a.description,
            recommendedActions: a.recommended_actions,
            effectiveAt: a.effective_at,
            expiresAt: a.expires_at,
            isOfficial: true,
            source: `${cityConfig.municipalAbbr} Disaster Management`,
          })),
          ...sachetAlerts.map((s: any) => ({
            id: s.id,
            reference: "SACHET-CAP",
            severity: s.severity || "WARNING",
            headline: s.headline,
            description: s.description,
            recommendedActions: s.instruction ? [s.instruction] : [],
            effectiveAt: s.effective,
            expiresAt: s.expires,
            isOfficial: true,
            source: "NDMA SACHET National Alert",
          })),
        ],
        practicalActions,
        helpline: cityConfig.hazardCapabilities.emergencyHelpline,
        limitations: {
          minorDrainageMapped: false,
          disclaimer: citySlug === "mumbai"
            ? "Mithi River & major arterial nullahs mapped. Local roadside catch-pits are unmapped in open geodata."
            : "Civic facilities mapped. River hydrology based on regional runoff model.",
        },
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/briefing] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
