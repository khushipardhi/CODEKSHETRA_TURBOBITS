/* ════════════════════════════════════════════════════════
   API Route: /api/agents/reports
   GET: Query generated specialist and city-wide reports from agent_reports
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { getAgentReports, getReportById } from "@/modules/agents/task-manager";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const agentId = searchParams.get("agentId") || undefined;
    const reportType = searchParams.get("reportType") || undefined;
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    if (id) {
      const report = await getReportById(id);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ report });
    }

    const reports = await getAgentReports({ agentId, reportType, limit });
    return NextResponse.json({
      reports,
      count: reports.length,
    });
  } catch (err: any) {
    console.error("[API Reports] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
