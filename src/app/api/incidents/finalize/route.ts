/* ════════════════════════════════════════════════════════
   POST /api/incidents/finalize
   Stage 3 AI call — synthesizes original report + answers
   into a final structured incident report.
   Called BEFORE the citizen presses the Proceed button.
   NOT persisted here — persisted in /api/incidents/create.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { GroqIncidentAnalysisProvider } from "@/modules/ai/groq-provider";
import type { AnalysisResult } from "@/modules/ai/engine";

interface FinalizeBody {
  originalText: string;
  analysis: AnalysisResult;
  answers: Record<string, string | string[]>;
  locationText?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FinalizeBody;
    const { originalText, analysis, answers, locationText } = body;

    if (!originalText || !analysis) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "originalText and analysis are required" } },
        { status: 400 }
      );
    }

    // Build Q&A pairs from the analysis questions + citizen answers
    const questions = (analysis.deptQuestions || []).map((q) => {
      const rawAnswer = answers[q.id];
      const answerValue = Array.isArray(rawAnswer)
        ? rawAnswer.join(", ")
        : rawAnswer || "";
      return {
        questionText: q.question,
        answerValue,
      };
    });

    const provider = new GroqIncidentAnalysisProvider();

    const finalReport = await provider.generateFinalReport({
      originalText,
      summary: analysis.summary,
      mainCategory: analysis.mainCategory,
      severity: analysis.severity.level,
      priorityScore: analysis.priority.score,
      departments: analysis.departments,
      questions,
      locationText: locationText || analysis.location.text,
    });

    console.log(
      `[AI] Final report generated: severity=${finalReport.severity} ` +
        `priority=${finalReport.priorityScore} ` +
        `findings=${finalReport.keyFindings.length} ` +
        `affected=${finalReport.affectedPeople}`
    );

    return NextResponse.json({
      success: true,
      finalReport,
    });
  } catch (err) {
    console.error("[API] /incidents/finalize error:", err);
    return NextResponse.json(
      {
        error: {
          code: "FINALIZE_FAILED",
          message: "Failed to generate final report. Please try again.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
