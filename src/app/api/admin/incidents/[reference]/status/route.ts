/* ════════════════════════════════════════════════════════
   PATCH /api/admin/incidents/[reference]/status
   Admin status update — advances the incident lifecycle.
   Creates audit trail in incident_status_history.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { notifyStatusChange } from "@/lib/notification-service";

/** Generate a ULID-like ID */
function ulid(): string {
  const time = Date.now().toString(36).padStart(10, "0");
  const rand = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
  return (time + rand).substring(0, 26);
}

const VALID_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "ROUTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

interface IncidentRow {
  id: string;
  status: string;
  citizen_id: string;
  public_reference: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Fetch current incident
    const incidents = await query<IncidentRow>(
      `SELECT id, status, citizen_id, public_reference FROM incidents WHERE public_reference = ?`,
      [reference]
    );

    if (incidents.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Incident not found" } },
        { status: 404 }
      );
    }

    const incident = incidents[0];
    const fromStatus = incident.status;

    if (fromStatus === status) {
      return NextResponse.json(
        { error: { code: "NO_CHANGE", message: "Status is already " + status } },
        { status: 400 }
      );
    }

    // Build update fields
    const updateFields: string[] = ["status = ?"];
    const updateParams: (string | number | null)[] = [status];

    if (status === "RESOLVED") {
      updateFields.push("resolved_at = NOW()");
    } else if (status === "ROUTED") {
      updateFields.push("routed_at = NOW()");
    }

    // Update incident
    await execute(
      `UPDATE incidents SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateParams, incident.id]
    );

    // Insert status history
    await execute(
      `INSERT INTO incident_status_history (id, incident_id, from_status, to_status, actor_id, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ulid(), incident.id, fromStatus, status, "admin", reason || null]
    );

    console.log(
      `[AdminAPI] Status update: ${reference} ${fromStatus} → ${status}` +
        (reason ? ` (reason: ${reason})` : "")
    );

    // Notify citizen of status change (non-blocking, non-fatal)
    if (incident.citizen_id && incident.citizen_id !== "anonymous") {
      notifyStatusChange({
        citizenId: incident.citizen_id,
        incidentId: incident.id,
        publicReference: reference,
        newStatus: status,
        reason: reason || undefined,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      publicReference: reference,
      fromStatus,
      toStatus: status,
    });
  } catch (err) {
    console.error("[API] /admin/incidents/[ref]/status error:", err);
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update status." } },
      { status: 500 }
    );
  }
}
