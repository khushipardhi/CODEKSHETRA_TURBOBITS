/* ════════════════════════════════════════════════════════
   Report Analysis — AI result display card
   Shows: category, severity, departments, summary
   Questions are now handled by DeptQuestions component
   Glassmorphism premium design
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import type { AnalysisResult } from "@/modules/ai/engine";

interface ReportAnalysisProps {
  analysis: AnalysisResult;
  /** Called when user clicks "Answer Details & Submit" */
  onContinue: () => void;
  onBack: () => void;
}

const SEVERITY_CONFIG: Record<string, {
  bg: string; border: string; text: string; dot: string; barColor: string; icon: string;
}> = {
  critical: {
    bg: "bg-critical-bg", border: "border-critical-border",
    text: "text-critical", dot: "bg-critical", barColor: "bg-critical", icon: "🔴",
  },
  high: {
    bg: "bg-high-bg", border: "border-high-border",
    text: "text-high", dot: "bg-high", barColor: "bg-high", icon: "🟠",
  },
  medium: {
    bg: "bg-medium-bg", border: "border-medium-border",
    text: "text-medium", dot: "bg-medium", barColor: "bg-medium", icon: "🟡",
  },
  low: {
    bg: "bg-low-bg", border: "border-low-border",
    text: "text-low", dot: "bg-low", barColor: "bg-low", icon: "🟢",
  },
};

export function ReportAnalysis({ analysis, onContinue, onBack }: ReportAnalysisProps) {
  const [isDisabled, setIsDisabled] = useState(false);
  const sev = SEVERITY_CONFIG[analysis.severity.level] || SEVERITY_CONFIG.medium;
  const hasQuestions = analysis.deptQuestions && analysis.deptQuestions.length > 0;

  const handleContinue = () => {
    if (isDisabled) return;
    setIsDisabled(true);
    onContinue();
    setTimeout(() => setIsDisabled(false), 3000);
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-text-primary">AI Analysis</h2>
        <span className="ml-auto text-xs text-text-tertiary flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {Math.round(analysis.confidence.overall * 100)}% confident
        </span>
      </div>

      {/* Category + incident type badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold">
          {analysis.mainCategoryName}
        </span>
        <span className="px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary text-xs font-medium">
          {analysis.incidentType.replace(/_/g, " ")}
        </span>
        {analysis.isEmergency && (
          <span className="px-3 py-1.5 rounded-full bg-critical-bg text-critical text-xs font-bold border border-critical-border">
            🚨 Emergency
          </span>
        )}
      </div>

      {/* Severity card */}
      <div className={`rounded-2xl p-4 border ${sev.border} ${sev.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{sev.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-bold ${sev.text} capitalize`}>
                {analysis.severity.level} Severity
              </span>
              <span className="text-xs font-mono font-bold text-text-tertiary">
                {analysis.severity.score}/100
              </span>
            </div>
            {/* Score bar */}
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sev.barColor}`}
                style={{ width: `${analysis.severity.score}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              {analysis.severity.reason}
            </p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
          AI Understanding
        </h3>
        <p className="text-sm text-text-primary leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Departments notified */}
      <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-3">
          Departments to be Notified ({analysis.departments.length})
        </h3>
        <div className="space-y-2.5">
          {analysis.departments.map((dept) => (
            <div key={dept.code} className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-text-primary">{dept.name}</span>
                <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{dept.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location detected */}
      {analysis.location.text && (
        <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">
            Location Detected
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <p className="text-sm text-text-primary">{analysis.location.text}</p>
          </div>
        </div>
      )}

      {/* Privacy notice */}
      {analysis.privacy.level !== "normal" && (
        <div className="flex items-center gap-2.5 text-xs text-text-secondary bg-surface-1 rounded-xl p-3.5 border border-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            {analysis.privacy.protectIdentity
              ? "Your identity will be protected in this report"
              : `Report marked as ${analysis.privacy.level}`}
          </span>
        </div>
      )}

      {/* Progress indicator — shows there are questions next */}
      {hasQuestions && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">✓</div>
            <span>Analysis</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center text-[9px] font-bold">2</div>
            <span className="font-medium">{analysis.deptQuestions.length} quick questions</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <div className="w-5 h-5 rounded-full bg-surface-2 border border-border text-text-tertiary flex items-center justify-center text-[9px] font-bold">3</div>
            <span>Submit</span>
          </div>
        </div>
      )}

      {/* Model meta */}
      <div className="flex items-center gap-1.5 text-xs text-text-tertiary px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>{analysis.aiModel}</span>
        <span className="mx-1">•</span>
        <span>{analysis.processingTimeMs}ms</span>
      </div>

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={isDisabled}
        className="w-full py-4 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
      >
        {isDisabled ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading...
          </>
        ) : hasQuestions ? (
          <>
            Answer {analysis.deptQuestions.length} Quick Questions
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
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
    </div>
  );
}
