/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/admin/simulation/report-qa
   Phase 7: Report-Aware Conversational AI for Municipal Operators
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { answerReportQuestion } from "@/modules/dossier/report-qa-engine";
import { getDossierById } from "@/modules/dossier/repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { dossierId, dossier, question, selectedWard, conversationHistory } = body;

    const trimmedQuestion = (question || "").trim();
    if (!trimmedQuestion) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Question cannot be empty." } },
        { status: 400 }
      );
    }

    // Resolve dossier from payload or repository
    let targetDossier = dossier;
    if (!targetDossier && dossierId) {
      targetDossier = await getDossierById(dossierId);
    }

    if (!targetDossier) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Dossier snapshot not found." } },
        { status: 404 }
      );
    }

    const reply = await answerReportQuestion({
      dossier: targetDossier,
      question: trimmedQuestion,
      selectedWard,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      data: reply,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[API /api/admin/simulation/report-qa] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: err?.message || "Report QA engine error" } },
      { status: 500 }
    );
  }
}
