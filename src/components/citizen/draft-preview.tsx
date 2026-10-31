/* ════════════════════════════════════════════════════════
   Draft Preview — Shows citizen what they've entered
   Before AI analysis. Edit/remove/re-record actions.
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import type { IncidentDraft } from "@/modules/incidents/incident-draft";
import { isDraftReadyForAnalysis } from "@/modules/incidents/incident-draft";

interface DraftPreviewProps {
  draft: IncidentDraft;
  onEditText: () => void;
  onRecordAgain: () => void;
  onRemovePhoto: (index: number) => void;
  onAddPhoto: () => void;
  onEditLocation: () => void;
  onAnalyze: () => void;
  onCancel: () => void;
  isAnalyzing: boolean;
}

export function DraftPreview({
  draft,
  onEditText,
  onRecordAgain,
  onRemovePhoto,
  onAddPhoto,
  onEditLocation,
  onAnalyze,
  onCancel,
  isAnalyzing,
}: DraftPreviewProps) {
  const ready = isDraftReadyForAnalysis(draft);

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Your Report</h2>
        <button
          onClick={onCancel}
          className="text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Text content */}
      <div className="bg-surface-1 rounded-2xl p-4 border border-border">
        <div className="flex items-start justify-between gap-3">
          <blockquote className="text-base text-text-primary leading-relaxed italic flex-1">
            &ldquo;{draft.text || "No text entered"}&rdquo;
          </blockquote>
          <button
            onClick={onEditText}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Edit text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        {draft.source === "voice" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-text-tertiary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            Transcribed from voice
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="bg-surface-1 rounded-2xl p-4 border border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          Attachments
        </h3>
        <div className="flex gap-2.5 flex-wrap">
          {draft.photos.map((photo, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemovePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                aria-label="Remove photo"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {draft.photos.length < 3 && (
            <button
              onClick={onAddPhoto}
              className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-text-tertiary hover:border-accent hover:text-accent transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-[10px] font-medium">Add</span>
            </button>
          )}
          {draft.photos.length === 0 && (
            <p className="text-sm text-text-tertiary">No photos attached</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-surface-1 rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
              Location
            </h3>
            <p className="text-sm text-text-primary">
              {draft.locationText ? (
                <>📍 {draft.locationText}</>
              ) : (
                <span className="text-text-tertiary">No location specified</span>
              )}
            </p>
          </div>
          <button
            onClick={onEditLocation}
            className="text-xs text-accent font-medium hover:underline cursor-pointer"
          >
            {draft.locationText ? "Change" : "Add location"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {draft.source === "voice" && (
          <button
            onClick={onRecordAgain}
            className="w-full py-3 border border-border rounded-full text-sm font-semibold text-text-primary hover:bg-surface-1 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Record Again
          </button>
        )}

        <button
          onClick={onAnalyze}
          disabled={!ready || isAnalyzing}
          className="w-full py-3.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Analyze with AI
            </>
          )}
        </button>

        {!ready && draft.text.length > 0 && draft.text.length < 10 && (
          <p className="text-xs text-text-tertiary text-center">
            Please provide at least 10 characters for AI analysis
          </p>
        )}
      </div>
    </div>
  );
}
