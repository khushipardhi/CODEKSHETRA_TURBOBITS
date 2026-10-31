/* ════════════════════════════════════════════════════════
   DeptQuestions — Interactive chip/button question UI
   Shows max 4 questions from Stage 2 AI output.
   Uses chips, multi-select, yes/no, or text fields.
   Citizen answers → confirm & submit.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import type { AnalysisResult, DeptQuestion } from "@/modules/ai/engine";
import { DEPARTMENTS } from "@/modules/ai/department-routing";

interface DeptQuestionsProps {
  analysis: AnalysisResult;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onBack: () => void;
}

const SEVERITY_COLORS: Record<string, { dot: string; text: string }> = {
  critical: { dot: "bg-critical", text: "text-critical" },
  high: { dot: "bg-high", text: "text-high" },
  medium: { dot: "bg-medium", text: "text-medium" },
  low: { dot: "bg-low", text: "text-low" },
};

export function DeptQuestions({ analysis, onSubmit, onBack }: DeptQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions: DeptQuestion[] = analysis.deptQuestions || [];
  const deptInfo = DEPARTMENTS.find((d) => d.code === analysis.mainCategory) || DEPARTMENTS[0];
  const severityColors = SEVERITY_COLORS[analysis.severity.level] || SEVERITY_COLORS.medium;

  const setChipAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMultiChip = (id: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [id]: current.filter((v) => v !== value) };
      }
      return { ...prev, [id]: [...current, value] };
    });
  };

  const setTextAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Check if all required questions are answered
  const requiredAnswered = questions
    .filter((q) => q.required)
    .every((q) => {
      const ans = answers[q.id];
      if (Array.isArray(ans)) return ans.length > 0;
      return ans && String(ans).trim().length > 0;
    });

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(answers);
  };

  const canSkip = !questions.some((q) => q.required);

  return (
    <div className="space-y-4 fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-text-primary">A Few More Details</h2>
      </div>

      {/* Analysis summary card */}
      <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Dept + category badge row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-base">{deptInfo?.icon || "📋"}</span>
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-bold">
                {analysis.mainCategoryName}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${severityColors.dot}`} />
                <span className={`text-[11px] font-semibold capitalize ${severityColors.text}`}>
                  {analysis.severity.level}
                </span>
              </div>
            </div>

            {/* AI summary */}
            <p className="text-sm text-text-primary leading-relaxed">{analysis.summary}</p>
          </div>
        </div>

        {/* Departments row */}
        {analysis.departments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {analysis.departments.map((d) => (
              <span key={d.code} className="text-[10px] px-2 py-0.5 bg-surface-2 text-text-secondary rounded-full font-medium">
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Help us respond faster
          </p>

          {questions.map((q, idx) => (
            <div key={q.id} className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm font-semibold text-text-primary leading-snug">
                  {q.question}
                  {q.required && <span className="text-critical ml-1">*</span>}
                </p>
              </div>

              {/* Chip single-select */}
              {q.type === "chip" && q.options && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setChipAnswer(q.id, opt)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-accent text-white border-accent shadow-sm"
                            : "bg-surface-1 text-text-secondary border-border hover:border-accent/40 hover:text-text-primary"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multi-select chips */}
              {q.type === "multi_chip" && q.options && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = (answers[q.id] as string[] | undefined) || [];
                    const isSelected = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleMultiChip(q.id, opt)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-accent text-white border-accent shadow-sm"
                            : "bg-surface-1 text-text-secondary border-border hover:border-accent/40 hover:text-text-primary"
                        }`}
                      >
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {opt}
                      </button>
                    );
                  })}
                  <p className="w-full text-[10px] text-text-tertiary mt-0.5">Select all that apply</p>
                </div>
              )}

              {/* Yes/No/Unsure */}
              {q.type === "yesno" && (
                <div className="flex gap-2">
                  {(q.options || ["Yes", "No", "Unsure"]).map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    const colorClass =
                      opt === "Yes"
                        ? isSelected ? "bg-success text-white border-success" : "border-border bg-surface-1 text-text-secondary hover:border-success/40"
                        : opt === "No"
                          ? isSelected ? "bg-critical text-white border-critical" : "border-border bg-surface-1 text-text-secondary hover:border-critical/40"
                          : isSelected ? "bg-accent text-white border-accent" : "border-border bg-surface-1 text-text-secondary hover:border-accent/40";

                    return (
                      <button
                        key={opt}
                        onClick={() => setChipAnswer(q.id, opt)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${colorClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text input */}
              {q.type === "text" && (
                <input
                  type="text"
                  placeholder={q.placeholder || "Type here..."}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setTextAnswer(q.id, e.target.value)}
                  className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        // No questions needed — show "ready to submit" message
        <div className="bg-success-bg border border-success-border rounded-2xl p-4 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-semibold text-success">Enough information collected</p>
          <p className="text-xs text-text-secondary mt-1">
            AI has all the details it needs from your description.
          </p>
        </div>
      )}

      {/* Emergency notice */}
      {analysis.isEmergency && (
        <div className="bg-critical-bg border border-critical-border rounded-xl p-3.5 flex items-center gap-3">
          <span className="text-xl">🚨</span>
          <div>
            <p className="text-sm font-bold text-critical">Emergency Detected</p>
            <p className="text-xs text-text-secondary">
              This report is flagged for immediate priority response.
            </p>
          </div>
        </div>
      )}

      {/* Privacy notice */}
      {analysis.privacy.level !== "normal" && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary bg-surface-1 rounded-xl p-3 border border-border">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            {analysis.privacy.protectIdentity
              ? "Your identity will be kept confidential"
              : `This report is marked ${analysis.privacy.level}`}
          </span>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-1.5 text-xs text-text-tertiary px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>AI confidence: {Math.round(analysis.confidence.overall * 100)}%</span>
        <span className="mx-1">•</span>
        <span>{analysis.aiModel}</span>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || (!requiredAnswered && !canSkip)}
        className="w-full py-4 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting...
          </>
        ) : (
          <>
            Confirm & Submit Report
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      {questions.some((q) => q.required) && (
        <p className="text-center text-[11px] text-text-tertiary">
          <span className="text-critical">*</span> Required questions must be answered
        </p>
      )}
    </div>
  );
}
