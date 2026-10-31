/* ════════════════════════════════════════════════════════
   Health Check API Route — includes DB connectivity
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

export async function GET() {
  let db: { connected: boolean; version?: string; error?: string } = { connected: false };
  try {
    db = await testConnection();
  } catch {
    // DB may not be configured
  }

  return NextResponse.json({
    status: "healthy",
    service: "nagpur-connect",
    version: "0.2.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      connected: db.connected,
      version: db.version,
    },
  });
}
