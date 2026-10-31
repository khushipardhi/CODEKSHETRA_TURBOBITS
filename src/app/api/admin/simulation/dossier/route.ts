/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Dossier API Route
   /api/admin/simulation/dossier
   Phase 3: Evidence-Grounded Municipal Dossier Endpoint
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { simulationDossierService } from "@/modules/dossier/dossier-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenarioId = "monsoon_downpour_saucer_sinks",
      parametersApplied,
      timeStepHours = 2.0,
      selectedWardId,
      forceDeterministic = false,
      exportFormat,
    } = body;

    const dossier = await simulationDossierService.generateDossier({
      scenarioId,
      parametersApplied,
      timeStepHours: Number(timeStepHours),
      selectedWardId,
      forceDeterministic: Boolean(forceDeterministic),
    });

    if (exportFormat === "markdown") {
      const md = simulationDossierService.exportDossier(dossier, "markdown");
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${dossier.dossierId}.md"`,
        },
      });
    }

    if (exportFormat === "csv") {
      const csv = simulationDossierService.exportDossier(dossier, "csv");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${dossier.dossierId}.csv"`,
        },
      });
    }

    if (exportFormat === "pdf") {
      const { generateSimulationReportHtml } = await import("@/modules/reports/simulation-pdf-template");
      const { renderHtmlToPdf } = await import("@/modules/reports/pdf-renderer");
      const html = generateSimulationReportHtml(dossier);
      const pdfBuffer = await renderHtmlToPdf(html);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${dossier.dossierId}.pdf"`,
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:Dossier] Error generating dossier:", err);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dossierId = searchParams.get("dossierId");
    const scenarioId = searchParams.get("scenarioId") || undefined;
    const format = searchParams.get("format");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    if (dossierId) {
      const dossier = await simulationDossierService.getDossier(dossierId);
      if (!dossier) {
        return NextResponse.json(
          { success: false, error: "Dossier not found" },
          { status: 404 }
        );
      }

      if (format === "markdown") {
        const md = simulationDossierService.exportDossier(dossier, "markdown");
        return new NextResponse(md, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${dossier.dossierId}.md"`,
          },
        });
      }

      if (format === "csv") {
        const csv = simulationDossierService.exportDossier(dossier, "csv");
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${dossier.dossierId}.csv"`,
          },
        });
      }

      if (format === "pdf") {
        const { generateSimulationReportHtml } = await import("@/modules/reports/simulation-pdf-template");
        const { renderHtmlToPdf } = await import("@/modules/reports/pdf-renderer");
        const html = generateSimulationReportHtml(dossier);
        const pdfBuffer = await renderHtmlToPdf(html);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${dossier.dossierId}.pdf"`,
            "Content-Length": String(pdfBuffer.length),
          },
        });
      }

      return NextResponse.json({ success: true, dossier });
    }

    const list = await simulationDossierService.listRecentDossiers({ scenarioId, limit });
    return NextResponse.json({ success: true, dossiers: list });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API:Dossier] Error retrieving dossiers:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
