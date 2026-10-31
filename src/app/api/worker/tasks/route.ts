/* ════════════════════════════════════════════════════════
   GET / PATCH /api/worker/tasks
   Field Worker task queue & lifecycle execution
   Connects to TiDB workers, incident_departments, incidents, incident_media
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query, execute } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import { notifyStatusChange } from "@/lib/notification-service";
import { getWorkerById, WorkerProfile } from "@/lib/worker-roster";

interface DbTaskRow {
  incident_id: string;
  department_code: string;
  department_name: string;
  dept_status: string;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  action_notes: string | null;
  public_reference: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  title: string | null;
  severity: string | null;
  priority_score: number | null;
  citizen_summary: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  is_emergency: number;
  created_at: string;
  received_at: string | null;
  resolved_at: string | null;
}

interface WorkerDbRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department_code: string;
  department_name: string;
  zone: string;
  role: string;
  vehicle: string | null;
  avatar: string | null;
  status: string;
  is_approved: number;
}

interface MediaRow {
  incident_id: string;
  id: string;
  file_name: string;
  storage_url: string | null;
  purpose: string;
}

function getSafetyNotes(deptCode: string): string {
  switch (deptCode) {
    case "road_maintenance":
      return "Wear high-visibility reflective vest. Set up traffic safety cones 15 meters ahead. Keep emergency blinkers on.";
    case "waste_management":
      return "Wear puncture-resistant gloves and N95 dust mask. Use mechanized loader for heavy heaps. Disinfect area after removal.";
    case "water_supply":
      return "Shut off main valve before trenching. Check soil stability. Beware of underground utility cables.";
    case "drainage":
      return "Never enter manholes without gas testing for H2S and methane. Use tripod harness and blower ventilation.";
    case "electricity":
      return "Confirm line de-energization with tester. Use insulated tools (1000V rated) and fiberglass ladder. Wear arc-flash gloves.";
    case "health_dept":
      return "Wear chemical goggles and protective suit during thermal fogging. Keep public 30m away from chemical spray.";
    default:
      return "Follow standard NMC safety protocols. Wear PPE and display work zone signage.";
  }
}

async function resolveWorker(workerIdOrEmail: string): Promise<WorkerProfile> {
  try {
    const rows = await query<WorkerDbRow>(
      `SELECT id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status, is_approved
       FROM workers
       WHERE id = ? OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [workerIdOrEmail, workerIdOrEmail]
    );

    if (rows.length > 0) {
      const w = rows[0];
      return {
        id: w.id,
        name: w.name,
        departmentCode: w.department_code,
        departmentName: w.department_name,
        role: w.role,
        zone: w.zone,
        phone: w.phone || "+91 98230 00000",
        vehicle: w.vehicle || "NMC Field Unit",
        avatar: w.avatar || "👷",
      };
    }
  } catch (err) {
    console.warn("[WorkerAPI] DB worker lookup failed:", err);
  }

  return getWorkerById(workerIdOrEmail);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const url = new URL(request.url);

    // Identify worker by query param or session user email
    let workerKey = url.searchParams.get("workerId") || "";
    if (!workerKey && session?.user?.email) {
      workerKey = session.user.email;
    }
    if (!workerKey) {
      workerKey = "W-PWD-01";
    }

    const deptFilter = url.searchParams.get("dept") || "";
    const statusFilter = url.searchParams.get("status") || "";

    const worker = await resolveWorker(workerKey);
    const deptCode = deptFilter || worker.departmentCode;

    let dbRows: DbTaskRow[] = [];
    try {
      let sql = `
        SELECT id.incident_id, id.department_code, id.department_name,
               id.status AS dept_status, id.assigned_worker_id, id.assigned_worker_name,
               id.action_notes, id.received_at, id.resolved_at,
               i.public_reference, i.category_slug, i.subcategory_slug,
               i.title, i.severity, i.priority_score, i.citizen_summary,
               i.location_text, i.latitude, i.longitude, i.is_emergency,
               i.created_at
        FROM incident_departments id
        JOIN incidents i ON i.id = id.incident_id
        WHERE (id.department_code = ? OR id.assigned_worker_id = ? OR id.assigned_worker_name LIKE ?)
      `;
      const params: (string | number)[] = [deptCode, worker.id, `%${worker.name}%`];

      if (statusFilter && statusFilter !== "ALL") {
        sql += " AND id.status = ?";
        params.push(statusFilter);
      }

      sql += " ORDER BY i.created_at DESC LIMIT 40";
      dbRows = await query<DbTaskRow>(sql, params);
    } catch (dbErr) {
      console.warn("[WorkerAPI] DB query fallback:", dbErr);
    }

    // Fetch media attachments
    let mediaMap: Record<string, MediaRow[]> = {};
    if (dbRows.length > 0) {
      try {
        const ids = dbRows.map((r) => r.incident_id);
        const placeholders = ids.map(() => "?").join(",");
        const mediaRows = await query<MediaRow>(
          `SELECT incident_id, id, file_name, storage_url, purpose
           FROM incident_media
           WHERE incident_id IN (${placeholders})`,
          ids
        );
        for (const m of mediaRows) {
          if (!mediaMap[m.incident_id]) mediaMap[m.incident_id] = [];
          mediaMap[m.incident_id].push(m);
        }
      } catch {
        /* ignore */
      }
    }

    // Build task list from database rows
    const liveTasks = dbRows.map((r) => {
      const media = mediaMap[r.incident_id] || [];
      return {
        id: r.incident_id,
        incidentId: r.incident_id,
        trackingId: r.public_reference,
        title: r.title || r.citizen_summary?.slice(0, 60) || `${r.department_name} Issue`,
        description: r.citizen_summary || r.title || "No description provided.",
        location: r.location_text || `${worker.zone}, Nagpur`,
        latitude: r.latitude || 21.1458,
        longitude: r.longitude || 79.0882,
        departmentCode: r.department_code,
        departmentName: r.department_name,
        severity: (r.severity || (r.is_emergency ? "CRITICAL" : "HIGH")).toUpperCase(),
        priorityScore: Number(r.priority_score || 70),
        status: normalizeStatus(r.dept_status),
        assignedWorkerId: r.assigned_worker_id || worker.id,
        assignedWorkerName: r.assigned_worker_name || worker.name,
        safetyNotes: getSafetyNotes(r.department_code),
        actionNotes: r.action_notes || "",
        assignedAt: formatTimestamp(r.received_at || r.created_at),
        citizenPhotos: media.filter((m) => m.purpose !== "WORKER_PROOF").map((m) => m.storage_url || ""),
        workerProofPhotos: media.filter((m) => m.purpose === "WORKER_PROOF").map((m) => m.storage_url || ""),
        resolvedAt: r.resolved_at,
      };
    });

    // Provide contextual Nagpur tasks if live count is 0
    const tasks = liveTasks.length > 0 ? liveTasks : getMockDepartmentTasks(worker);

    return NextResponse.json({
      success: true,
      worker,
      tasks,
      kpis: {
        total: tasks.length,
        urgent: tasks.filter((t) => t.severity === "CRITICAL" || t.severity === "HIGH").length,
        inProgress: tasks.filter((t) => t.status === "WORK_STARTED" || t.status === "EN_ROUTE" || t.status === "REACHED_SITE").length,
        completed: tasks.filter((t) => t.status === "RESOLVED" || t.status === "WORK_COMPLETED").length,
      },
    });
  } catch (err) {
    console.error("[WorkerAPI] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch worker tasks" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      incidentId,
      departmentCode,
      workerId,
      nextStatus,
      resolutionNotes,
      proofPhotoUrl,
    } = body as {
      incidentId: string;
      departmentCode: string;
      workerId: string;
      nextStatus: "ACCEPTED" | "EN_ROUTE" | "REACHED_SITE" | "WORK_STARTED" | "RESOLVED";
      resolutionNotes?: string;
      proofPhotoUrl?: string;
    };

    if (!incidentId || !nextStatus) {
      return NextResponse.json(
        { error: "incidentId and nextStatus are required" },
        { status: 400 }
      );
    }

    const worker = await resolveWorker(workerId || "W-PWD-01");
    const dept = departmentCode || worker.departmentCode;

    // Fetch existing incident department record
    const existing = await query<{
      id: string;
      status: string;
      public_reference: string;
      citizen_id: string;
      department_name: string;
    }>(
      `SELECT id.id, id.status, i.public_reference, i.citizen_id, id.department_name
       FROM incident_departments id
       JOIN incidents i ON i.id = id.incident_id
       WHERE id.incident_id = ? AND id.department_code = ?
       LIMIT 1`,
      [incidentId, dept]
    );

    const fromStatus = existing[0]?.status || "ASSIGNED";
    const publicRef = existing[0]?.public_reference || incidentId.slice(0, 10);
    const citizenId = existing[0]?.citizen_id;
    const deptName = existing[0]?.department_name || dept;

    // Status mapping
    const isResolved = nextStatus === "RESOLVED";
    const dbStatus = isResolved ? "RESOLVED" : "IN_PROGRESS";

    // Update incident_departments
    await execute(
      `UPDATE incident_departments
       SET status = ?,
           action_notes = COALESCE(?, action_notes),
           resolved_at = ${isResolved ? "NOW()" : "resolved_at"},
           assigned_worker_id = COALESCE(assigned_worker_id, ?),
           assigned_worker_name = COALESCE(assigned_worker_name, ?)
       WHERE incident_id = ? AND department_code = ?`,
      [dbStatus, resolutionNotes || null, worker.id, worker.name, incidentId, dept]
    );

    // Update main incidents status if resolved
    if (isResolved) {
      await execute(
        `UPDATE incidents
         SET status = 'RESOLVED', resolved_at = NOW()
         WHERE id = ?`,
        [incidentId]
      );
    } else {
      await execute(
        `UPDATE incidents
         SET status = 'IN_PROGRESS'
         WHERE id = ? AND status IN ('CONFIRMED', 'ROUTED', 'ASSIGNED')`,
        [incidentId]
      );
    }

    // Insert history log
    await execute(
      `INSERT INTO incident_status_history (
        id, incident_id, from_status, to_status, actor_id, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        ulid(),
        incidentId,
        fromStatus,
        nextStatus,
        worker.id,
        resolutionNotes || `Field status updated to ${nextStatus} by ${worker.name}`,
      ]
    );

    // Save proof photo if uploaded
    if (proofPhotoUrl) {
      try {
        await execute(
          `INSERT INTO incident_media (
            id, incident_id, file_name, mime_type, file_size, storage_url, purpose, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'WORKER_PROOF', NOW())`,
          [ulid(), incidentId, "resolution_proof.jpg", "image/jpeg", 50000, proofPhotoUrl]
        );
      } catch (mediaErr) {
        console.warn("[WorkerAPI] Media save warning:", mediaErr);
      }
    }

    // Notify citizen if present
    if (citizenId && citizenId !== "anonymous") {
      notifyStatusChange({
        citizenId,
        incidentId,
        publicReference: publicRef,
        newStatus: nextStatus,
        reason: resolutionNotes || `Field worker ${worker.name} updated task to ${nextStatus}`,
        departmentName: deptName,
        workerName: worker.name,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      incidentId,
      trackingId: publicRef,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[WorkerAPI] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

function normalizeStatus(s: string): string {
  const upper = (s || "").toUpperCase();
  if (upper === "IN_PROGRESS") return "WORK_STARTED";
  if (upper === "ROUTED") return "ASSIGNED";
  return upper || "ASSIGNED";
}

function formatTimestamp(isoStr?: string): string {
  if (!isoStr) return "Just now";
  try {
    const d = new Date(isoStr);
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function getMockDepartmentTasks(worker: WorkerProfile) {
  switch (worker.departmentCode) {
    case "waste_management":
      return [
        {
          id: "task-swm-01",
          incidentId: "task-swm-01",
          trackingId: "NC-2026-004122",
          title: "Clear open garbage overflow near Medical Square",
          description: "Large heap of domestic solid waste overflowing from public collection bin onto the roadway. Blocking pedestrian footpath.",
          location: "Medical Square, Medical College Road, Hanuman Nagar Zone",
          latitude: 21.1278,
          longitude: 79.0963,
          departmentCode: "waste_management",
          departmentName: "Solid Waste Management",
          severity: "HIGH",
          priorityScore: 84,
          status: "ASSIGNED",
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          safetyNotes: getSafetyNotes("waste_management"),
          actionNotes: "Dispatch mini tipper MH-31-TR-4421 immediately.",
          assignedAt: "25m ago",
          citizenPhotos: [],
          workerProofPhotos: [],
        },
      ];
    case "water_supply":
      return [
        {
          id: "task-wtr-01",
          incidentId: "task-wtr-01",
          trackingId: "NC-2026-005019",
          title: "Major water pipeline leak flooding Shankar Nagar Square",
          description: "150mm distribution pipeline burst under sidewalk. High-pressure clean drinking water gushing into the road.",
          location: "Shankar Nagar Square, West High Court Road, Nagpur",
          latitude: 21.1342,
          longitude: 79.0685,
          departmentCode: "water_supply",
          departmentName: "Water Supply Department",
          severity: "CRITICAL",
          priorityScore: 95,
          status: "EN_ROUTE",
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          safetyNotes: getSafetyNotes("water_supply"),
          actionNotes: "Isolate valve #14 at Laxmi Nagar overhead tank immediately.",
          assignedAt: "15m ago",
          citizenPhotos: [],
          workerProofPhotos: [],
        },
      ];
    case "electricity":
      return [
        {
          id: "task-ele-01",
          incidentId: "task-ele-01",
          trackingId: "NC-2026-006201",
          title: "Broken streetlight pole and dangling live wire",
          description: "Truck collided with NMC pole #42. Wire is hanging 4 feet above road near school gate.",
          location: "Subhash Nagar Metro Station Road, Nagpur",
          latitude: 21.1265,
          longitude: 79.0432,
          departmentCode: "electricity",
          departmentName: "Electricity Department",
          severity: "CRITICAL",
          priorityScore: 98,
          status: "ASSIGNED",
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          safetyNotes: getSafetyNotes("electricity"),
          actionNotes: "Trip feeder breaker at Subhash Nagar sub-station before approach.",
          assignedAt: "10m ago",
          citizenPhotos: [],
          workerProofPhotos: [],
        },
      ];
    default:
      return [
        {
          id: "task-pwd-01",
          incidentId: "task-pwd-01",
          trackingId: "NC-2026-001246",
          title: "Deep pothole cluster on Wardha Road near Manish Nagar",
          description: "Multiple connected potholes (depth ~4 inches) on left lane. Two two-wheelers suffered tire damage this morning.",
          location: "Wardha Road, opposite Manish Nagar T-Point, Nagpur",
          latitude: 21.1012,
          longitude: 79.0718,
          departmentCode: "road_maintenance",
          departmentName: "Road Maintenance / PWD",
          severity: "HIGH",
          priorityScore: 88,
          status: "ASSIGNED",
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          safetyNotes: getSafetyNotes("road_maintenance"),
          actionNotes: "Fill using cold asphalt mix with vibrating plate compactor.",
          assignedAt: "20m ago",
          citizenPhotos: [],
          workerProofPhotos: [],
        },
      ];
  }
}
