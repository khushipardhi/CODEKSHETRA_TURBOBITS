/* ════════════════════════════════════════════════════════
   GET / POST /api/worker/me
   Worker session identity, role resolution & registration request
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({
        authenticated: false,
        isWorker: false,
        worker: null,
      });
    }

    const email = session.user.email.toLowerCase();

    // Query database for worker profile
    const rows = await query<WorkerRow>(
      `SELECT id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status, is_approved, created_at
       FROM workers
       WHERE LOWER(email) = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        isWorker: false,
        isApproved: false,
        worker: null,
      });
    }

    const worker = rows[0];
    return NextResponse.json({
      authenticated: true,
      user: session.user,
      isWorker: true,
      isApproved: Boolean(worker.is_approved),
      worker: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone || "",
        departmentCode: worker.department_code,
        departmentName: worker.department_name,
        zone: worker.zone,
        role: worker.role,
        vehicle: worker.vehicle || "",
        avatar: worker.avatar || "👷",
        status: worker.status,
        isApproved: Boolean(worker.is_approved),
        createdAt: worker.created_at,
      },
    });
  } catch (err) {
    console.error("[WorkerAPI] GET /me error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve worker profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const email = (body.email || session?.user?.email || "").trim().toLowerCase();
    const name = (body.name || session?.user?.name || "").trim();
    const departmentCode = (body.departmentCode || "road_maintenance").trim();
    const zone = (body.zone || "Dharampeth Zone").trim();
    const role = (body.role || "Field Inspection Technician").trim();
    const phone = (body.phone || "").trim();
    const vehicle = (body.vehicle || "NMC Field Patrol Unit").trim();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and Email are required to register as a field worker" },
        { status: 400 }
      );
    }

    const deptInfo = DEPARTMENT_REGISTRY[departmentCode] || {
      name: "Municipal Department",
    };
    const departmentName = deptInfo.name;

    // Check if worker already exists
    const existing = await query<WorkerRow>(
      `SELECT id, name, email, department_code, is_approved FROM workers WHERE LOWER(email) = ? LIMIT 1`,
      [email]
    );

    const workerId =
      existing.length > 0
        ? existing[0].id
        : `W-${departmentCode.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (existing.length > 0) {
      // Update existing record
      await execute(
        `UPDATE workers
         SET name = ?, phone = ?, department_code = ?, department_name = ?, zone = ?, role = ?, vehicle = ?, is_approved = 1, updated_at = NOW()
         WHERE id = ?`,
        [name, phone, departmentCode, departmentName, zone, role, vehicle, workerId]
      );
    } else {
      // Insert new worker
      await execute(
        `INSERT INTO workers (
           id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status, is_approved
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '👷', 'AVAILABLE', 1)`,
        [
          workerId,
          name,
          email,
          phone,
          departmentCode,
          departmentName,
          zone,
          role,
          vehicle,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker profile registered and assigned successfully",
      worker: {
        id: workerId,
        name,
        email,
        phone,
        departmentCode,
        departmentName,
        zone,
        role,
        vehicle,
        status: "AVAILABLE",
        isApproved: true,
      },
    });
  } catch (err) {
    console.error("[WorkerAPI] POST /me error:", err);
    return NextResponse.json(
      { error: "Failed to register field worker" },
      { status: 500 }
    );
  }
}
