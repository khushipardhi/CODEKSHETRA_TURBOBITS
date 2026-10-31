/* ════════════════════════════════════════════════════════
   GET / POST / PATCH /api/department/[code]/workers/manage
   TiDB-backed Department Field Worker Roster & Onboarding Management
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";

interface WorkerRow {
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
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { error: "Department code is required" },
        { status: 400 }
      );
    }

    const city = request.nextUrl.searchParams.get("city") || request.headers.get("x-city");
    const isAll = !city || city === "all";
    const workerParams = isAll ? [code] : [code, city];

    const rows = await query<WorkerRow>(
      `SELECT id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status, is_approved, created_at, updated_at
       FROM workers
       WHERE department_code = ? ${isAll ? "" : "AND city = ?"}
       ORDER BY created_at DESC`,
      workerParams
    );

    // Fetch active task count per worker from incident_departments
    const taskCountRows = await query<{ assigned_worker_id: string; task_count: number }>(
      `SELECT assigned_worker_id, COUNT(*) as task_count
       FROM incident_departments
       WHERE department_code = ? AND status IN ('ASSIGNED', 'IN_PROGRESS') AND assigned_worker_id IS NOT NULL
       GROUP BY assigned_worker_id`,
      [code]
    ).catch(() => []);

    const countMap: Record<string, number> = {};
    for (const r of taskCountRows) {
      if (r.assigned_worker_id) {
        countMap[r.assigned_worker_id] = Number(r.task_count);
      }
    }

    const workers = rows.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      phone: w.phone || "",
      departmentCode: w.department_code,
      departmentName: w.department_name,
      zone: w.zone,
      role: w.role,
      vehicle: w.vehicle || "NMC Field Vehicle",
      avatar: w.avatar || "👷",
      status: w.status,
      isApproved: Boolean(w.is_approved),
      activeTasks: countMap[w.id] || 0,
      createdAt: w.created_at,
    }));

    return NextResponse.json({
      success: true,
      departmentCode: code,
      total: workers.length,
      available: workers.filter((w) => w.status === "AVAILABLE").length,
      onTask: workers.filter((w) => w.status === "ON_TASK" || (w.activeTasks > 0)).length,
      workers,
    });
  } catch (err) {
    console.error("[DeptWorkerAPI] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch department workers" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const zone = (body.zone || "Central Zone").trim();
    const role = (body.role || "Field Squad Specialist").trim();
    const vehicle = (body.vehicle || "Response Vehicle").trim();
    const workerCity = body.city || request.headers.get("x-city") || "nagpur";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Full name and Email ID are mandatory fields" },
        { status: 400 }
      );
    }

    const deptInfo = DEPARTMENT_REGISTRY[code] || { name: code };
    const departmentName = deptInfo.name;

    // Check if worker already exists
    const existing = await query<WorkerRow>(
      `SELECT id, name, email, department_code FROM workers WHERE LOWER(email) = ? LIMIT 1`,
      [email]
    );

    let workerId: string;

    if (existing.length > 0) {
      workerId = existing[0].id;
      // Update worker to this department
      await execute(
        `UPDATE workers
         SET name = ?, phone = ?, department_code = ?, department_name = ?, zone = ?, role = ?, vehicle = ?, city = ?, is_approved = 1, updated_at = NOW()
         WHERE id = ?`,
        [name, phone, code, departmentName, zone, role, vehicle, workerCity, workerId]
      );
    } else {
      const codePrefix = code.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "NMC";
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      workerId = `W-${codePrefix}-${randomSuffix}`;

      await execute(
        `INSERT INTO workers (
           id, name, email, phone, department_code, department_name, zone, role, vehicle, city, avatar, status, is_approved
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '👷', 'AVAILABLE', 1)`,
        [workerId, name, email, phone, code, departmentName, zone, role, vehicle, workerCity]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Worker ${name} successfully added to ${departmentName}`,
      worker: {
        id: workerId,
        name,
        email,
        phone,
        departmentCode: code,
        departmentName,
        zone,
        role,
        vehicle,
        status: "AVAILABLE",
        isApproved: true,
      },
    });
  } catch (err) {
    console.error("[DeptWorkerAPI] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add department worker" },
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
    const { workerId, status, isApproved } = body as {
      workerId: string;
      status?: "AVAILABLE" | "ON_TASK" | "OFF_DUTY";
      isApproved?: boolean;
    };

    if (!workerId) {
      return NextResponse.json(
        { error: "workerId is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const paramsList: (string | number)[] = [];

    if (status) {
      updates.push("status = ?");
      paramsList.push(status);
    }
    if (typeof isApproved === "boolean") {
      updates.push("is_approved = ?");
      paramsList.push(isApproved ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    updates.push("updated_at = NOW()");
    paramsList.push(workerId, code);

    await execute(
      `UPDATE workers SET ${updates.join(", ")} WHERE id = ? AND department_code = ?`,
      paramsList
    );

    return NextResponse.json({
      success: true,
      message: "Worker details updated successfully",
    });
  } catch (err) {
    console.error("[DeptWorkerAPI] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update worker status" },
      { status: 500 }
    );
  }
}
