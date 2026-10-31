/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/assistant
   Citizen RAG Multi-Hazard Safety Advisor powered by Groq.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import { sentinelAi } from "@/modules/ai/sentinel-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cityParam = body.city || DEFAULT_CITY;
    const message = (body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Message cannot be empty." } },
        { status: 400 }
      );
    }

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is invalid.` } },
        { status: 400 }
      );
    }

    const userLocation = body.userLocation || (body.locality ? {
      localityName: body.locality,
      lat: body.coords?.[0],
      lon: body.coords?.[1],
    } : undefined);

    const reply = await sentinelAi.answerCitizenQuery({
      city: cityParam as "mumbai" | "pune" | "nagpur",
      message,
      userLocation,
      conversationHistory: body.conversationHistory,
    });

    return NextResponse.json({
      success: true,
      data: reply,
      meta: {
        city: cityParam,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/assistant] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
