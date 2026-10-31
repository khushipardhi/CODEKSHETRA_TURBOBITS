import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { WORKER_ROSTER } from "@/lib/worker-roster";
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
}

export async function GET() {
  try {
    const dbWorkers = await query<WorkerRow>(
      `SELECT id, name, email, phone, department_code, department_name, zone, role, vehicle, avatar, status
       FROM workers
       WHERE is_approved = 1
       ORDER BY name ASC`
    );

    const workers =
      dbWorkers.length > 0
        ? dbWorkers.map((w) => ({
            id: w.id,
            name: w.name,
            email: w.email,
            phone: w.phone || "+91 98230 00000",
            departmentCode: w.department_code,
            departmentName: w.department_name,
            role: w.role,
            zone: w.zone,
            vehicle: w.vehicle || "NMC Field Vehicle",
            avatar: w.avatar || "👷",
            status: w.status,
          }))
        : WORKER_ROSTER;

    return NextResponse.json({
      success: true,
      workers,
      departments: Object.values(DEPARTMENT_REGISTRY).map((d) => ({
        code: d.code,
        name: d.name,
        shortName: d.shortName,
        icon: d.icon,
      })),
    });
  } catch (err) {
    console.warn("[WorkerRosterAPI] DB error, using fallback roster:", err);
    return NextResponse.json({
      success: true,
      workers: WORKER_ROSTER,
      departments: Object.values(DEPARTMENT_REGISTRY).map((d) => ({
        code: d.code,
        name: d.name,
        shortName: d.shortName,
        icon: d.icon,
      })),
    });
  }
}
