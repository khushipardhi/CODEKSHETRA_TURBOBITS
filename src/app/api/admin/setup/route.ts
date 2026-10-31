import { NextResponse } from "next/server"; import { runMigrations } from "@/lib/db-migrate"; export async function GET() { const res = await runMigrations(); return NextResponse.json(res); }
