/* ════════════════════════════════════════════════════════
   Admin Audit API — /api/admin/audit
   Returns live chronological audit trail from incident_status_history & TiDB
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface StatusHistoryRow {
  id: string;
  incident_id: string;
  public_reference: string;
  title: string | null;
  status_from: string | null;
  status_to: string;
  changed_by_id: string | null;
  changed_by_name: string | null;
  changed_by_role: string | null;
  reason: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const city = searchParams.get("city") || request.headers.get("x-city");
    const isAll = !city || city === "all";

    // 1. Fetch status history events
    const historyRows = await query<StatusHistoryRow>(
      `SELECT 
         h.id, h.incident_id, i.public_reference, i.title,
         h.status_from, h.status_to, h.changed_by_id,
         h.changed_by_name, h.changed_by_role, h.reason, h.created_at
       FROM incident_status_history h
       JOIN incidents i ON h.incident_id = i.id
       ${isAll ? "" : "WHERE i.city = ?"}
       ORDER BY h.created_at DESC
       LIMIT ${limit}`,
      isAll ? [] : [city]
    ).catch(() => []);

    // 2. Fetch new incident submissions as well
    const newIncidentRows = await query<{
      id: string;
      public_reference: string;
      title: string | null;
      created_at: string;
      selected_department: string | null;
    }>(
      `SELECT id, public_reference, title, created_at, selected_department
       FROM incidents
       ${isAll ? "" : "WHERE city = ?"}
       ORDER BY created_at DESC
       LIMIT 20`,
      isAll ? [] : [city]
    ).catch(() => []);

    // Combine and sort events
    const events: Array<{
      id: string;
      event: string;
      actor: string;
      target: string;
      targetId: string;
      detail: string;
      timestamp: string;
    }> = [];

    for (const h of historyRows) {
      events.push({
        id: `hist_${h.id}`,
        event: `STATUS_${h.status_to}`,
        actor: h.changed_by_name || "System Automated Router",
        target: h.public_reference || "Incident",
        targetId: h.public_reference,
        detail: h.reason || `Transitioned from ${h.status_from || "INITIAL"} to ${h.status_to} for "${h.title || "Report"}"`,
        timestamp: h.created_at,
      });
    }

    for (const inc of newIncidentRows) {
      events.push({
        id: `inc_${inc.id}`,
        event: "INCIDENT_SUBMITTED",
        actor: "Citizen Reporter",
        target: inc.public_reference,
        targetId: inc.public_reference,
        detail: `New civic report "${inc.title || "Incident"}" logged under ${inc.selected_department || "General"}`,
        timestamp: inc.created_at,
      });
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      events: events.slice(0, limit),
      totalCount: events.length,
    });
  } catch (err) {
    console.error("[API] /admin/audit GET error:", err);
    return NextResponse.json(
      { error: { code: "AUDIT_FETCH_FAILED", message: "Failed to fetch audit log" } },
      { status: 500 }
    );
  }
}
