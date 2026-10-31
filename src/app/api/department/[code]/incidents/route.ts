/* ════════════════════════════════════════════════════════
   GET / PATCH /api/department/[code]/incidents
   Department-filtered incident list & lifecycle actions in TiDB
   - GET: Fetches routed incidents with media attachments and worker details
   - PATCH: Executes Accept, Assign, and Resolve actions with full audit history
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import { notifyStatusChange } from "@/lib/notification-service";

interface DeptIncidentRow {
  incident_id: string;
  department_code: string;
  department_name: string;
  dept_status: string;
  routing_reason: string | null;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  action_notes: string | null;
  public_reference: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  title: string | null;
  severity: string | null;
  priority_score: number | null;
  incident_status: string;
  citizen_summary: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  is_emergency: number;
  privacy_level: string | null;
  created_at: string;
}

function formatCategoryName(slug: string | null): string {
  if (!slug) return "Civic Report";
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function deriveIncidentTitle(r: DeptIncidentRow): string {
  if (r.title && r.title.trim() && !r.title.toLowerCase().includes("untitled")) {
    return r.title.trim();
  }
  if (r.citizen_summary && r.citizen_summary.trim()) {
    const s = r.citizen_summary.trim();
    return s.length > 75 ? s.slice(0, 72) + "..." : s;
  }
  if (r.subcategory_slug) {
    return formatCategoryName(r.subcategory_slug);
  }
  if (r.category_slug) {
    return formatCategoryName(r.category_slug);
  }
  return `${r.department_name} Incident`;
}

interface MediaRow {
  incident_id: string;
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_url: string | null;
  purpose: string;
}

interface CountRow {
  cnt: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Department code is required" } },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";
    const city = url.searchParams.get("city") || request.headers.get("x-city");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = ["id.department_code = ?"];
    const queryParams: (string | number)[] = [code];

    if (city && city !== "all" && city !== "ALL") {
      conditions.push("i.city = ?");
      queryParams.push(city);
    }

    if (statusFilter && statusFilter !== "all" && statusFilter !== "ALL") {
      if (statusFilter === "incoming") {
        conditions.push("id.status IN ('ROUTED', 'INCOMING')");
      } else if (statusFilter === "in_progress") {
        conditions.push("id.status IN ('ASSIGNED', 'IN_PROGRESS')");
      } else if (statusFilter === "resolved") {
        conditions.push("id.status IN ('RESOLVED', 'CLOSED')");
      } else {
        conditions.push("id.status = ?");
        queryParams.push(statusFilter.toUpperCase());
      }
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Total Count
    const countRows = await query<CountRow>(
      `SELECT COUNT(*) AS cnt
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       ${whereClause}`,
      queryParams
    );
    const total = Number(countRows[0]?.cnt || 0);

    // Fetch Incidents — Latest first
    const rows = await query<DeptIncidentRow>(
      `SELECT id.incident_id, id.department_code, id.department_name,
              id.status AS dept_status, id.routing_reason,
              id.assigned_worker_id, id.assigned_worker_name, id.action_notes,
              i.public_reference, i.category_slug, i.subcategory_slug, i.title,
              i.severity, i.priority_score,
              i.status AS incident_status, i.citizen_summary,
              i.location_text, i.latitude, i.longitude, i.is_emergency,
              i.privacy_level, i.created_at
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    );

    // Fetch media attachments for returned incidents
    const incidentIds = rows.map((r) => r.incident_id);
    let mediaByIncident: Record<string, MediaRow[]> = {};
    if (incidentIds.length > 0) {
      try {
        const placeholders = incidentIds.map(() => "?").join(",");
        const mediaRows = await query<MediaRow>(
          `SELECT incident_id, id, file_name, mime_type, file_size, storage_url, purpose
           FROM incident_media
           WHERE incident_id IN (${placeholders})`,
          incidentIds
        );
        for (const m of mediaRows) {
          if (!mediaByIncident[m.incident_id]) {
            mediaByIncident[m.incident_id] = [];
          }
          mediaByIncident[m.incident_id].push(m);
        }
      } catch {
        // Safe fallback if table empty
      }
    }

    return NextResponse.json({
      success: true,
      departmentCode: code,
      departmentName: rows[0]?.department_name || code,
      incidents: rows.map((r) => {
        const title = deriveIncidentTitle(r);
        const categoryName = formatCategoryName(r.subcategory_slug || r.category_slug || r.department_code);
        return {
          id: r.incident_id,
          trackingId: r.public_reference,
          title,
          category: categoryName,
          summary: r.citizen_summary || r.title || r.routing_reason || "No details provided",
          status: r.dept_status,
          incidentStatus: r.incident_status,
          priority: Number(r.priority_score || 50),
          severity: r.severity || "MEDIUM",
          location: r.location_text || "Nagpur Jurisdiction",
          latitude: r.latitude,
          longitude: r.longitude,
          isEmergency: !!r.is_emergency,
          privacyLevel: r.privacy_level || "PUBLIC",
          routingReason: r.routing_reason,
          assignedTo: r.assigned_worker_name || (r.assigned_worker_id ? `Worker #${r.assigned_worker_id}` : undefined),
          assignedWorkerId: r.assigned_worker_id || undefined,
          actionNotes: r.action_notes || undefined,
          timestamp: r.created_at,
          media: (mediaByIncident[r.incident_id] || []).map((m) => ({
            id: m.id,
            fileName: m.file_name,
            mimeType: m.mime_type,
            fileSize: m.file_size,
            storageUrl: m.storage_url,
            purpose: m.purpose,
          })),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[API] /department/[code]/incidents GET error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch department incidents." } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { incidentId, action, workerId, workerName, notes, reason } = body as {
      incidentId: string;
      action: "ACCEPT" | "ASSIGN" | "RESOLVE" | "UPDATE_STATUS";
      workerId?: string;
      workerName?: string;
      notes?: string;
      reason?: string;
    };

    if (!code || !incidentId || !action) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "department code, incidentId, and action are required." } },
        { status: 400 }
      );
    }

    // Fetch current department status for this incident
    const deptRows = await query<{
      id: string;
      status: string;
      department_name: string;
      public_reference: string;
      citizen_id: string;
    }>(
      `SELECT id.id, id.status, id.department_name, i.public_reference, i.citizen_id
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       WHERE id.incident_id = ? AND id.department_code = ?
       LIMIT 1`,
      [incidentId, code]
    );

    if (deptRows.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Incident not routed to this department." } },
        { status: 404 }
      );
    }

    const currentRecord = deptRows[0];
    const fromStatus = currentRecord.status;
    let toStatus = fromStatus;
    let historyReason = reason || "";

    if (action === "ACCEPT") {
      toStatus = "ASSIGNED";
      historyReason = historyReason || `Accepted by ${currentRecord.department_name}`;

      await execute(
        `UPDATE incident_departments
         SET status = 'ASSIGNED', received_at = NOW(), action_notes = COALESCE(?, action_notes)
         WHERE incident_id = ? AND department_code = ?`,
        [notes || null, incidentId, code]
      );

      // Advance incident overall status if currently DRAFT/CONFIRMED/ROUTED
      await execute(
        `UPDATE incidents
         SET status = 'ASSIGNED'
         WHERE id = ? AND status IN ('DRAFT', 'CONFIRMED', 'ROUTED')`,
        [incidentId]
      );
    } else if (action === "ASSIGN") {
      toStatus = "IN_PROGRESS";
      const assignedLabel = workerName || (workerId ? `Worker ${workerId}` : "Field Unit");
      historyReason = historyReason || `Assigned to ${assignedLabel}`;

      await execute(
        `UPDATE incident_departments
         SET status = 'IN_PROGRESS',
             assigned_worker_id = ?,
             assigned_worker_name = ?,
             action_notes = COALESCE(?, action_notes)
         WHERE incident_id = ? AND department_code = ?`,
        [workerId || null, workerName || null, notes || null, incidentId, code]
      );

      await execute(
        `UPDATE incidents
         SET status = 'IN_PROGRESS'
         WHERE id = ? AND status IN ('DRAFT', 'CONFIRMED', 'ROUTED', 'ASSIGNED')`,
        [incidentId]
      );
    } else if (action === "RESOLVE") {
      toStatus = "RESOLVED";
      historyReason = historyReason || `Resolved by ${currentRecord.department_name}: ${notes || "Work completed"}`;

      await execute(
        `UPDATE incident_departments
         SET status = 'RESOLVED',
             resolved_at = NOW(),
             action_notes = COALESCE(?, action_notes)
         WHERE incident_id = ? AND department_code = ?`,
        [notes || null, incidentId, code]
      );

      // Check if all departments for this incident are resolved
      const pendingDepts = await query<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt
         FROM incident_departments
         WHERE incident_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`,
        [incidentId]
      );

      if (Number(pendingDepts[0]?.cnt || 0) === 0) {
        await execute(
          `UPDATE incidents
           SET status = 'RESOLVED', resolved_at = NOW()
           WHERE id = ?`,
          [incidentId]
        );
      }
    }

    // Insert status history record
    await execute(
      `INSERT INTO incident_status_history (
        id, incident_id, from_status, to_status, actor_id, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [ulid(), incidentId, fromStatus, toStatus, code, historyReason]
    );

    // Notify citizen if applicable
    if (currentRecord.citizen_id && currentRecord.citizen_id !== "anonymous") {
      notifyStatusChange({
        citizenId: currentRecord.citizen_id,
        incidentId,
        publicReference: currentRecord.public_reference,
        newStatus: toStatus,
        reason: historyReason,
        departmentName: currentRecord.department_name,
        workerName: workerName || undefined,
      }).catch(() => {});
    }

    console.log(
      `[DeptAPI] Action ${action} on ${currentRecord.public_reference} by ${code}: ${fromStatus} → ${toStatus}`
    );

    return NextResponse.json({
      success: true,
      incidentId,
      publicReference: currentRecord.public_reference,
      departmentCode: code,
      fromStatus,
      toStatus,
    });
  } catch (err) {
    console.error("[API] /department/[code]/incidents PATCH error:", err);
    return NextResponse.json(
      { error: { code: "ACTION_FAILED", message: "Failed to update incident status." } },
      { status: 500 }
    );
  }
}
