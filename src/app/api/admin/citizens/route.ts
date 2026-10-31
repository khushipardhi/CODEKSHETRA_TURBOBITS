/* ==========================================================
   Admin Citizens API — /api/admin/citizens
   GET — List all registered & guest citizens with report counts
   ========================================================== */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface AdminCitizenRow {
  id: string;
  guest_id: string | null;
  google_id: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  ward_zone: string | null;
  address: string | null;
  emergency_contact: string | null;
  bio: string | null;
  notification_email_enabled: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  total_reports: number;
  resolved_reports: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    let whereClause = "";
    const params: any[] = [];

    if (search.trim()) {
      whereClause = `WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.ward_zone LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const rows = await query<AdminCitizenRow>(
      `SELECT 
         c.id, c.guest_id, c.google_id, c.email, c.name, c.phone,
         c.ward_zone, c.address, c.emergency_contact, c.bio,
         c.notification_email_enabled, c.avatar_url, c.created_at, c.updated_at,
         (
           SELECT COUNT(*) FROM incidents i 
           WHERE (c.google_id IS NOT NULL AND i.citizen_id = CONCAT('google_', c.google_id))
              OR (c.guest_id IS NOT NULL AND i.citizen_id = CONCAT('guest_', c.guest_id))
         ) as total_reports,
         (
           SELECT COUNT(*) FROM incidents i 
           WHERE ((c.google_id IS NOT NULL AND i.citizen_id = CONCAT('google_', c.google_id))
              OR (c.guest_id IS NOT NULL AND i.citizen_id = CONCAT('guest_', c.guest_id)))
             AND i.status IN ('RESOLVED', 'CLOSED')
         ) as resolved_reports
       FROM citizens c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ).catch((e) => {
      console.error("[API] Admin citizens query error:", e);
      return [];
    });

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM citizens c ${whereClause}`,
      params
    ).catch(() => [{ total: 0 }]);

    return NextResponse.json({
      success: true,
      citizens: rows.map((r) => ({
        id: r.id,
        name: r.name || "Anonymous Citizen",
        email: r.email || null,
        phone: r.phone || null,
        wardZone: r.ward_zone || null,
        address: r.address || null,
        emergencyContact: r.emergency_contact || null,
        bio: r.bio || null,
        notificationEmailEnabled: !!r.notification_email_enabled,
        avatarUrl: r.avatar_url || null,
        authProvider: r.google_id ? "google" : "guest",
        totalReports: Number(r.total_reports) || 0,
        resolvedReports: Number(r.resolved_reports) || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      totalCount: Number(countRows[0]?.total) || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[API] /admin/citizens GET error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch citizens directory" } },
      { status: 500 }
    );
  }
}
