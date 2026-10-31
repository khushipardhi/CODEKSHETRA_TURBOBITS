/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/simulation
   Dedicated Spatial Intelligence & Multi-Hazard Simulation Endpoint.
   
   Supports:
   - GET: Scenario catalogue, baseline registry, and 24 canonical BMC wards GeoJSON
   - POST: Deterministic numerical simulation execution with time-step evaluation
   - Historical event replay profiles (26 July 2005, 8 July 2024)
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { SCENARIO_REGISTRY, HISTORICAL_EVENTS } from "@/modules/simulation/scenario-registry";
import { simulationEngine, type SimulationRequest } from "@/modules/simulation/engine";
import { bmcWardRegistry } from "@/modules/geo/ward-registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get("wardId");

    if (wardId) {
      const ward = bmcWardRegistry.getWardById(wardId);
      if (!ward) {
        return NextResponse.json({ success: false, error: `Ward '${wardId}' not found.` }, { status: 404 });
      }
      return NextResponse.json({ success: true, ward });
    }

    return NextResponse.json({
      success: true,
      scenarios: Object.values(SCENARIO_REGISTRY),
      historicalEvents: HISTORICAL_EVENTS,
      wardsGeoJSON: bmcWardRegistry.getGeoJSON(),
      wardCount: bmcWardRegistry.getAllWards().length,
      modelTiers: [
        {
          tier: "TIER_1_OBSERVED_FORECAST",
          label: "Tier 1: Observed / Forecast Overlay",
          description: "Presents direct observations and forecast products without unverified inundation claims.",
        },
        {
          tier: "TIER_2_SCREENING_SIMULATION",
          label: "Tier 2: Transparent Screening Simulation",
          description: "Computes a reproducible spatial screening index from environmental and terrain inputs. Identifies relative susceptibility; does NOT claim calibrated water depth in meters.",
        },
        {
          tier: "TIER_3_VALIDATED_HYDRODYNAMIC",
          label: "Tier 3: Validated Spatial Hazard Model",
          description: "Requires full 2D Saint-Venant shallow water hydrodynamic equations with high-resolution DEM and calibrated roughness.",
          status: "RESERVED_FOR_CALIBRATED_SOLVER",
        },
      ],
      meta: {
        timestamp: new Date().toISOString(),
        engineVersion: "Sentinel-SimulationEngine/3.0",
      },
    });
  } catch (err: any) {
    console.error("[API /api/hazards/simulation GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenarioId = "rainfall_waterlogging",
      parameters = {},
      timeStepHours = 2,
      baselineMode = "current_live",
      city = "mumbai",
      simulateMissingInputs = false,
    } = body;

    if (city && city.toLowerCase() !== "mumbai") {
      return NextResponse.json(
        {
          success: false,
          error: `Spatial flood simulation is currently only calibrated for 'mumbai'. City '${city}' is not supported for hydrodynamic screening.`,
          supportedCities: ["mumbai"],
        },
        { status: 400 }
      );
    }

    const simReq: SimulationRequest = {
      scenarioId,
      parameters,
      timeStepHours: Number(timeStepHours) || 0,
      baselineMode,
      city,
      simulateMissingInputs: Boolean(simulateMissingInputs),
    };

    const result = simulationEngine.execute(simReq);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[API /api/hazards/simulation POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
