/* ════════════════════════════════════════════════════════
   POST /api/incidents/analyze
   AI-powered incident analysis from citizen text
   Stage 1: analysis + department mismatch detection
   Stage 2: department-specific question generation
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { analyzeIncident } from "@/modules/ai/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, locationContext, selectedDepartment } = body;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Report text must be at least 5 characters",
          },
        },
        { status: 400 }
      );
    }

    console.log(
      `[AI] Analyzing report (${text.trim().length} chars)` +
        (selectedDepartment ? ` | dept=${selectedDepartment}` : "") +
        "..."
    );

    const result = await analyzeIncident({
      text: text.trim(),
      locationContext: locationContext || undefined,
      selectedDepartment: selectedDepartment || undefined,
    });

    // Log key outcomes
    if (result.mismatch) {
      console.log(
        `[AI] MISMATCH detected: selected=${selectedDepartment} → correct=${result.suggestedCategory}`
      );
    } else {
      console.log(
        `[AI] Analysis complete: ${result.mainCategory}/${result.subcategory} ` +
          `severity=${result.severity.level}(${result.severity.score}) ` +
          `depts=[${result.departments.map((d) => d.code).join(",")}] ` +
          `questions=${result.deptQuestions?.length || 0} ` +
          `confidence=${result.confidence.overall} ` +
          `in ${result.processingTimeMs}ms`
      );
    }

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (err) {
    console.error("[API] /incidents/analyze error:", err);

    const message =
      err instanceof Error && err.message.includes("API key")
        ? "AI service configuration error. Please contact support."
        : "Failed to analyze the report. Please try again.";

    return NextResponse.json(
      {
        error: {
          code: "AI_ANALYSIS_FAILED",
          message,
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
