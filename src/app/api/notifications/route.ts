/* ════════════════════════════════════════════════════════
   GET/PATCH /api/notifications
   GET  — Fetch unread notifications for current user
   PATCH — Mark notification(s) as read
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCitizenIdentity } from "@/lib/citizen-identity";

interface NotificationRow {
  id: string;
  incident_id: string | null;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    if (!identity) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    // Check if admin request
    const isAdmin = request.headers.get("x-admin-token") === "admin";
    const recipientType = isAdmin ? "admin" : "citizen";
    const recipientId = isAdmin ? "admin" : identity.citizenId;

    let rows: NotificationRow[];
    try {
      rows = await query<NotificationRow>(
        `SELECT id, incident_id, type, priority, title, message, is_read, created_at
         FROM notifications
         WHERE recipient_type = ? AND recipient_id = ?
         ORDER BY created_at DESC
         LIMIT 30`,
        [recipientType, recipientId]
      );
    } catch {
      // Table doesn't exist yet — return empty
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const unreadCount = rows.filter((r) => !r.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: rows.map((r) => ({
        id: r.id,
        incidentId: r.incident_id,
        type: r.type,
        priority: r.priority,
        title: r.title,
        message: r.message,
        isRead: !!r.is_read,
        createdAt: r.created_at,
      })),
      unreadCount,
    });
  } catch (err) {
    console.error("[API] /notifications GET error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch notifications." } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    if (!identity) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body as {
      notificationIds?: string[];
      markAllRead?: boolean;
    };

    const isAdmin = request.headers.get("x-admin-token") === "admin";
    const recipientType = isAdmin ? "admin" : "citizen";
    const recipientId = isAdmin ? "admin" : identity.citizenId;

    try {
      if (markAllRead) {
        await execute(
          `UPDATE notifications SET is_read = 1, read_at = NOW()
           WHERE recipient_type = ? AND recipient_id = ? AND is_read = 0`,
          [recipientType, recipientId]
        );
      } else if (notificationIds && notificationIds.length > 0) {
        const placeholders = notificationIds.map(() => "?").join(",");
        await execute(
          `UPDATE notifications SET is_read = 1, read_at = NOW()
           WHERE id IN (${placeholders}) AND recipient_id = ?`,
          [...notificationIds, recipientId]
        );
      }
    } catch {
      // Table may not exist — non-fatal
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] /notifications PATCH error:", err);
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update notifications." } },
      { status: 500 }
    );
  }
}
