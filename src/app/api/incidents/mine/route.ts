/* ════════════════════════════════════════════════════════
   GET /api/incidents/mine
   Fetch current user's incidents (for citizen dashboard)
   Uses real citizen identity from cookie/header
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCitizenIdentity } from "@/lib/citizen-identity";

interface IncidentListRow {
  public_reference: string;
  category_slug: string | null;
  status: string;
  severity: string | null;
  priority_score: number | null;
  title: string | null;
  citizen_summary: string | null;
  location_text: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Extract real citizen identity
    const identity = await getCitizenIdentity(request);
    if (!identity) {
      return NextResponse.json({
        success: true,
        incidents: [],
      });
    }

    // Build all possible citizen IDs for this user (cookie vs header may differ)
    const citizenIds = new Set<string>();
    citizenIds.add(identity.citizenId);

    const headerRaw = request.headers.get("x-guest-id");
    if (headerRaw) citizenIds.add(`guest_${headerRaw}`);

    const cookieRaw = request.cookies.get("guest_token")?.value;
    if (cookieRaw) citizenIds.add(`guest_${cookieRaw}`);

    const idList = Array.from(citizenIds);
    const placeholders = idList.map(() => "?").join(",");

    const city = request.nextUrl.searchParams.get("city") || request.headers.get("x-city");
    const paramsList: (string | number)[] = [...idList];
    let cityCondition = "";
    if (city && city !== "all") {
      cityCondition = "AND city = ?";
      paramsList.push(city);
    }

    const incidents = await query<IncidentListRow>(
      `SELECT public_reference, category_slug, status, severity,
              priority_score, title, citizen_summary, location_text,
              created_at, confirmed_at
       FROM incidents
       WHERE citizen_id IN (${placeholders}) ${cityCondition}
       ORDER BY created_at DESC
       LIMIT 20`,
      paramsList
    );

    return NextResponse.json({
      success: true,
      incidents: incidents.map((i) => ({
        publicReference: i.public_reference,
        category: i.category_slug,
        status: i.status,
        severity: i.severity,
        priorityScore: i.priority_score,
        title: i.title,
        citizenSummary: i.citizen_summary,
        locationText: i.location_text,
        createdAt: i.created_at,
        confirmedAt: i.confirmed_at,
      })),
    });
  } catch (err) {
    console.error("[API] /incidents/mine error:", err);
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch incidents.",
        },
      },
      { status: 500 }
    );
  }
}
