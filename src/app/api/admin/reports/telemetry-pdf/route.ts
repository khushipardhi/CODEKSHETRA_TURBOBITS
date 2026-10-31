/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Telemetry PDF API Route
   /api/admin/reports/telemetry-pdf
   Phase 4: Publication-Grade Multi-Page Telemetry PDF Generation
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { buildTelemetryReportDocument } from "@/modules/reports/telemetry-report-builder";
import { generateTelemetryReportHtml } from "@/modules/reports/telemetry-pdf-template";
import { renderHtmlToPdf } from "@/modules/reports/pdf-renderer";
import { CITIES, DEFAULT_CITY, isValidCity } from "@/lib/city-context";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || DEFAULT_CITY;
    const tab = searchParams.get("tab") || "overview";
    const zone = searchParams.get("zone") || undefined;

    if (!isValidCity(city)) {
      return NextResponse.json({ success: false, error: `Invalid city: ${city}` }, { status: 400 });
    }

    // Fetch telemetry data from local telemetry-lab API
    const baseUrl = req.nextUrl.origin || "http://localhost:3000";
    const params = new URLSearchParams({ city, tab });
    if (zone) params.set("zone", zone);

    const telemetryRes = await fetch(`${baseUrl}/api/hazards/telemetry-lab?${params.toString()}`);
    if (!telemetryRes.ok) {
      throw new Error(`Failed to fetch telemetry data from internal API (HTTP ${telemetryRes.status})`);
    }
    const telemetryJson = await telemetryRes.json();
    if (!telemetryJson.success) {
      throw new Error(telemetryJson.error || "Telemetry API returned unhandled failure");
    }

    // Build structured document model
    const reportDoc = buildTelemetryReportDocument({
      city,
      tab,
      zone,
      telemetryData: telemetryJson,
    });

    // Generate publication-grade HTML
    const html = generateTelemetryReportHtml(reportDoc);
    if (searchParams.get("format") === "html") {
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Render binary PDF
    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportDoc.documentId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:TelemetryPDF] Generation error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city = DEFAULT_CITY, tab = "overview", zone, telemetryData } = body;

    let resolvedData = telemetryData;
    if (!resolvedData) {
      const baseUrl = req.nextUrl.origin || "http://localhost:3000";
      const params = new URLSearchParams({ city, tab });
      if (zone) params.set("zone", zone);
      const res = await fetch(`${baseUrl}/api/hazards/telemetry-lab?${params.toString()}`);
      if (!res.ok) throw new Error(`Telemetry fetch failed (HTTP ${res.status})`);
      resolvedData = await res.json();
    }

    const reportDoc = buildTelemetryReportDocument({
      city,
      tab,
      zone,
      telemetryData: resolvedData,
    });

    const html = generateTelemetryReportHtml(reportDoc);
    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportDoc.documentId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:TelemetryPDF:POST] Generation error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
