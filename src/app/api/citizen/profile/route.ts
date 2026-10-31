/* ==========================================================
   Citizen Profile API — /api/citizen/profile
   GET  — Fetch citizen profile & statistics
   PATCH — Update citizen profile details
   ========================================================== */

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCitizenIdentity } from "@/lib/citizen-identity";
import { generateULID } from "@/lib/ids";

interface CitizenRow {
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
}

interface StatsRow {
  total: number;
  resolved: number;
  in_progress: number;
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    const citizenId = identity?.citizenId || "anonymous";
    const isGuest = identity?.isGuest ?? true;

    let profile: CitizenRow | null = null;

    if (!isGuest && citizenId.startsWith("google_")) {
      const googleId = citizenId.replace("google_", "");
      const rows = await query<CitizenRow>(
        `SELECT id, guest_id, google_id, email, name, phone, ward_zone, address,
                emergency_contact, bio, notification_email_enabled, avatar_url, created_at, updated_at
         FROM citizens WHERE google_id = ? LIMIT 1`,
        [googleId]
      ).catch(() => []);
      profile = rows[0] || null;
    } else if (isGuest && citizenId.startsWith("guest_")) {
      const guestId = citizenId.replace("guest_", "");
      const rows = await query<CitizenRow>(
        `SELECT id, guest_id, google_id, email, name, phone, ward_zone, address,
                emergency_contact, bio, notification_email_enabled, avatar_url, created_at, updated_at
         FROM citizens WHERE guest_id = ? LIMIT 1`,
        [guestId]
      ).catch(() => []);
      profile = rows[0] || null;
    }

    // Fetch live incident stats
    const statsRows = await query<StatsRow>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved,
         SUM(CASE WHEN status IN ('IN_PROGRESS', 'ASSIGNED', 'ROUTED') THEN 1 ELSE 0 END) as in_progress
       FROM incidents WHERE citizen_id = ?`,
      [citizenId]
    ).catch(() => [{ total: 0, resolved: 0, in_progress: 0 }]);

    const stats = statsRows[0] || { total: 0, resolved: 0, in_progress: 0 };

    return NextResponse.json({
      success: true,
      profile: profile ? {
        id: profile.id,
        googleId: profile.google_id,
        guestId: profile.guest_id,
        name: profile.name || "Citizen User",
        email: profile.email || null,
        phone: profile.phone || null,
        wardZone: profile.ward_zone || null,
        address: profile.address || null,
        emergencyContact: profile.emergency_contact || null,
        bio: profile.bio || null,
        notificationEmailEnabled: !!profile.notification_email_enabled,
        avatarUrl: profile.avatar_url || null,
        isGuest,
        createdAt: profile.created_at,
      } : {
        id: null,
        googleId: null,
        guestId: isGuest ? citizenId.replace("guest_", "") : null,
        name: "Citizen User",
        email: null,
        phone: null,
        wardZone: null,
        address: null,
        emergencyContact: null,
        bio: null,
        notificationEmailEnabled: true,
        avatarUrl: null,
        isGuest,
        createdAt: new Date().toISOString(),
      },
      stats: {
        totalReports: Number(stats.total) || 0,
        resolvedReports: Number(stats.resolved) || 0,
        inProgressReports: Number(stats.in_progress) || 0,
      },
    });
  } catch (err) {
    console.error("[API] /citizen/profile GET error:", err);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch citizen profile" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await getCitizenIdentity(request);
    if (!identity) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Citizen identity required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      wardZone,
      address,
      emergencyContact,
      bio,
      notificationEmailEnabled,
    } = body as {
      name?: string;
      phone?: string;
      wardZone?: string;
      address?: string;
      emergencyContact?: string;
      bio?: string;
      notificationEmailEnabled?: boolean;
    };

    const citizenId = identity.citizenId;
    const isGuest = identity.isGuest;

    if (!isGuest && citizenId.startsWith("google_")) {
      const googleId = citizenId.replace("google_", "");
      
      await execute(
        `UPDATE citizens SET
           name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           ward_zone = COALESCE(?, ward_zone),
           address = COALESCE(?, address),
           emergency_contact = COALESCE(?, emergency_contact),
           bio = COALESCE(?, bio),
           notification_email_enabled = COALESCE(?, notification_email_enabled),
           updated_at = NOW()
         WHERE google_id = ?`,
        [
          name !== undefined ? name : null,
          phone !== undefined ? phone : null,
          wardZone !== undefined ? wardZone : null,
          address !== undefined ? address : null,
          emergencyContact !== undefined ? emergencyContact : null,
          bio !== undefined ? bio : null,
          notificationEmailEnabled !== undefined ? (notificationEmailEnabled ? 1 : 0) : null,
          googleId,
        ]
      );
    } else if (isGuest && citizenId.startsWith("guest_")) {
      const guestId = citizenId.replace("guest_", "");

      const existing = await query<{ id: string }>(
        `SELECT id FROM citizens WHERE guest_id = ? LIMIT 1`,
        [guestId]
      ).catch(() => []);

      if (existing.length === 0) {
        await execute(
          `INSERT INTO citizens (
             id, guest_id, name, phone, ward_zone, address, emergency_contact, bio, notification_email_enabled
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateULID(),
            guestId,
            name || "Guest Citizen",
            phone || null,
            wardZone || null,
            address || null,
            emergencyContact || null,
            bio || null,
            notificationEmailEnabled !== undefined ? (notificationEmailEnabled ? 1 : 0) : 1,
          ]
        );
      } else {
        await execute(
          `UPDATE citizens SET
             name = COALESCE(?, name),
             phone = COALESCE(?, phone),
             ward_zone = COALESCE(?, ward_zone),
             address = COALESCE(?, address),
             emergency_contact = COALESCE(?, emergency_contact),
             bio = COALESCE(?, bio),
             notification_email_enabled = COALESCE(?, notification_email_enabled),
             updated_at = NOW()
           WHERE guest_id = ?`,
          [
            name !== undefined ? name : null,
            phone !== undefined ? phone : null,
            wardZone !== undefined ? wardZone : null,
            address !== undefined ? address : null,
            emergencyContact !== undefined ? emergencyContact : null,
            bio !== undefined ? bio : null,
            notificationEmailEnabled !== undefined ? (notificationEmailEnabled ? 1 : 0) : null,
            guestId,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("[API] /citizen/profile PATCH error:", err);
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Failed to update citizen profile" } },
      { status: 500 }
    );
  }
}
