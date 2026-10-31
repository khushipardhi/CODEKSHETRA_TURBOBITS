/* ════════════════════════════════════════════════════════
   POST /api/admin/migrate
   Run database migrations (dev-only)
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";
import { runMigrations } from "@/lib/db-migrate";

export async function POST() {
  // Test connection first
  const connTest = await testConnection();
  if (!connTest.connected) {
    return NextResponse.json(
      {
        error: {
          code: "DB_CONNECTION_FAILED",
          message: "Cannot connect to database",
          details: connTest.error,
        },
      },
      { status: 500 }
    );
  }

  // Run migrations
  const result = await runMigrations();

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "MIGRATION_FAILED",
          message: "Migration failed",
          details: result.error,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    database: {
      version: connTest.version,
      tables: result.tables,
    },
  });
}

export async function GET() {
  const connTest = await testConnection();
  return NextResponse.json({
    connected: connTest.connected,
    version: connTest.version,
    error: connTest.error,
  });
}
