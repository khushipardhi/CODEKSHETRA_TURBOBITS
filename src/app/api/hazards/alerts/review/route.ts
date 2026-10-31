/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/alerts/review
   Administrative approval, modification, rejection, and cancellation.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { alertLifecycle } from "@/modules/hazards/alert-lifecycle";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "mumbai";
    const pending = await alertLifecycle.getPendingAlerts(city);
    return NextResponse.json({
      success: true,
      data: {
        city,
        pendingAlerts: pending || [],
        candidateEvents: pending || [],
        count: (pending || []).length,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API GET /api/hazards/alerts/review] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { alertId, action, headline, description, recommendedActions, expiresInHours, notes } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "alertId and action are required." } },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT", "UPDATE", "CANCEL"].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ACTION", message: "Action must be APPROVE, REJECT, UPDATE, or CANCEL." } },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const updatedAlert = await alertLifecycle.reviewAlert({
      alertId,
      action,
      adminId: "ADMIN_MUNICIPAL",
      headline,
      description,
      recommendedActions,
      expiresInHours: expiresInHours || 6,
      notes: notes || `Admin ${action} via Command Center`,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: {
        alert: updatedAlert,
        message: `Alert successfully updated with status: ${updatedAlert.approval_status}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (msg.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: msg } },
        { status: 404 }
      );
    }
    console.error("[API /api/hazards/alerts/review] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: msg } },
      { status: 500 }
    );
  }
}
