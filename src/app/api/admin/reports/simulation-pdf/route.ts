/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation PDF API Route
   /api/admin/reports/simulation-pdf
   Phase 4: Direct Simulation PDF Generation Endpoint
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { simulationDossierService } from "@/modules/dossier/dossier-service";
import { generateSimulationReportHtml } from "@/modules/reports/simulation-pdf-template";
import { renderHtmlToPdf } from "@/modules/reports/pdf-renderer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dossierId = searchParams.get("dossierId");

    if (!dossierId) {
      return NextResponse.json({ success: false, error: "Missing dossierId parameter" }, { status: 400 });
    }

    const dossier = await simulationDossierService.getDossier(dossierId);
    if (!dossier) {
      return NextResponse.json({ success: false, error: `Dossier ${dossierId} not found` }, { status: 404 });
    }

    const wardParam = searchParams.get("ward");
    if (wardParam && dossier.rankedWardsAnalysis) {
      const match = dossier.rankedWardsAnalysis.find(
        (w) => w.wardId.toUpperCase() === wardParam.toUpperCase() || w.wardName.toUpperCase().includes(wardParam.toUpperCase())
      );
      if (match) {
        dossier.wardDetailedAnalysis = match;
      }
    }

    const html = generateSimulationReportHtml(dossier);
    if (searchParams.get("format") === "html") {
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${dossier.dossierId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:SimulationPDF:GET] Generation error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let dossier = body.dossier;

    if (!dossier && body.dossierId) {
      dossier = await simulationDossierService.getDossier(body.dossierId);
    }

    if (!dossier) {
      // Generate from scenario parameters
      const {
        scenarioId = "monsoon_downpour_saucer_sinks",
        parametersApplied,
        timeStepHours = 2.0,
        selectedWardId,
      } = body;

      dossier = await simulationDossierService.generateDossier({
        scenarioId,
        parametersApplied,
        timeStepHours: Number(timeStepHours),
        selectedWardId,
        forceDeterministic: true,
      });
    }

    const html = generateSimulationReportHtml(dossier);
    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${dossier.dossierId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:SimulationPDF:POST] Generation error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
