/* ════════════════════════════════════════════════════════
   DeptMismatch — Wrong department selected screen
   Shows the correct department with a direct action button.
   User can accept correction or override.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { CATEGORIES } from "@/modules/incidents/category-taxonomy";
import { DEPARTMENTS, getDepartmentByCode } from "@/modules/ai/department-routing";
import type { AnalysisResult } from "@/modules/ai/engine";

interface DeptMismatchProps {
  analysis: AnalysisResult;
  selectedDepartmentSlug: string;
  onGoToCorrect: (correctSlug: string) => void;
  onOverride: () => void;
  onBack: () => void;
}

export function DeptMismatch({
  analysis,
  selectedDepartmentSlug,
  onGoToCorrect,
  onOverride,
  onBack,
}: DeptMismatchProps) {
  const selectedDept = getDepartmentByCode(selectedDepartmentSlug);
  const selectedCat = CATEGORIES.find((c) => c.slug === selectedDepartmentSlug);

  const suggestedDept = analysis.suggestedCategory
    ? getDepartmentByCode(analysis.suggestedCategory)
    : null;
  const suggestedCat = CATEGORIES.find((c) => c.slug === analysis.suggestedCategory);

  const selectedName = selectedDept?.name || selectedCat?.name || selectedDepartmentSlug;
  const suggestedName = analysis.suggestedCategoryName || suggestedDept?.name || suggestedCat?.name || analysis.suggestedCategory || "Suggested Department";
  const selectedIcon = selectedDept?.icon || selectedCat?.icon || "📋";
  const suggestedIcon = suggestedDept?.icon || suggestedCat?.icon || "📋";

  return (
    <div className="space-y-5 fade-in">
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
        <h2 className="text-lg font-bold text-text-primary">Department Check</h2>
      </div>

      {/* Mismatch card */}
      <div className="bg-surface-0 border border-warning-border rounded-2xl overflow-hidden shadow-sm">
        {/* Orange accent top */}
        <div className="h-1.5 bg-gradient-to-r from-warning to-high" />

        <div className="p-5">
          {/* Warning icon */}
          <div className="w-12 h-12 rounded-2xl bg-warning-bg flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 className="text-base font-bold text-text-primary mb-1">
            This may be the wrong department
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            {analysis.mismatchReason ||
              `Your report doesn't seem to match ${selectedName}. It looks like it belongs to ${suggestedName}.`}
          </p>

          {/* Department comparison */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Selected (wrong) */}
            <div className="bg-surface-1 rounded-xl p-3 border border-border opacity-60">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{selectedIcon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">You Selected</span>
              </div>
              <p className="text-sm font-semibold text-text-secondary">{selectedName}</p>
            </div>

            {/* Suggested (correct) */}
            <div className="bg-accent/5 rounded-xl p-3 border border-accent/20 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{suggestedIcon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Suggested</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">{suggestedName}</p>
              {/* Checkmark */}
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-surface-1 rounded-xl p-3.5 border border-border mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1">AI understood your report as:</p>
            <p className="text-sm text-text-primary leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            {analysis.suggestedCategory && (
              <button
                onClick={() => onGoToCorrect(analysis.suggestedCategory!)}
                className="w-full py-3.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <span>Go to {suggestedName}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <button
              onClick={onOverride}
              className="w-full py-3 bg-surface-1 border border-border text-text-secondary rounded-full text-sm font-medium hover:bg-surface-2 transition-all cursor-pointer"
            >
              Continue with {selectedName} anyway
            </button>
          </div>
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-text-tertiary text-center px-4">
        Sending reports to the right department ensures faster response
      </p>
    </div>
  );
}
