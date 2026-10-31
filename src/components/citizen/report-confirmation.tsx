/* ════════════════════════════════════════════════════════
   Report Confirmation — Summary modal before final submit
   Incident type · Location · Severity ring · Departments
   ════════════════════════════════════════════════════════ */

"use client";

import type { IncidentAnalysis } from "@/modules/incidents/domain/types";
import { SeverityRing } from "./severity-ring";

interface ReportConfirmationProps {
  analysis: IncidentAnalysis;
  locationText?: string;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  emergency: "Emergency",
  police_safety: "Police & Safety",
  fire_rescue: "Fire & Rescue",
  health_medical: "Health & Medical",
  water_drainage: "Water & Drainage",
  roads_traffic: "Roads & Traffic",
  waste_cleanliness: "Waste & Cleanliness",
  environment_public_spaces: "Environment",
};

const DEPT_NAMES: Record<string, string> = {
  police: "Police Dept",
  traffic_police: "Traffic Police",
  fire_brigade: "Fire Brigade",
  health_dept: "Health Dept",
  ambulance: "Ambulance",
  water_supply: "Water Supply",
  drainage: "Drainage Dept",
  road_maintenance: "Road Maintenance",
  traffic_management: "Traffic Mgmt",
  waste_management: "Waste Mgmt",
  environment: "Environment",
  electricity: "Electricity",
  disaster_management: "Disaster Mgmt",
  municipal_corp: "Municipal Corp",
  public_works: "Public Works",
};

export function ReportConfirmation({
  analysis,
  locationText,
  onConfirm,
  onEdit,
  onClose,
  isSubmitting = false,
}: ReportConfirmationProps) {
  const departments = analysis.proposedDepartmentCodes || [];

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface-0 rounded-t-3xl sm:rounded-3xl shadow-xl slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-0 border-b border-border px-5 py-4 flex items-center gap-3 rounded-t-3xl">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 3v18" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Report Summary</h2>
            <p className="text-xs text-text-tertiary">AI-Generated Assessment</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Incident Type */}
          <div className="bg-surface-1 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Incident Type</span>
            </div>
            <p className="text-base font-semibold text-text-primary">
              {analysis.title || CATEGORY_LABELS[analysis.categorySlug || ""] || "Unknown"}
            </p>
          </div>

          {/* Location */}
          <div className="bg-surface-1 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Location</span>
            </div>
            <p className="text-base font-semibold text-text-primary">
              {locationText || analysis.entities?.locationText || "Location not specified"}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">Nagpur, Maharashtra</p>
          </div>

          {/* Severity Assessment */}
          <div className="bg-critical-bg border border-critical-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-critical">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-critical">Severity Assessment</span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {analysis.severity === "CRITICAL"
                    ? "Critical priority — immediate response recommended."
                    : analysis.severity === "HIGH"
                      ? "High priority response recommended."
                      : `${analysis.severity} priority response recommended.`}
                </p>
              </div>
              <SeverityRing score={analysis.proposedPriorityScore || 50} size={60} />
            </div>
          </div>

          {/* Routed Departments */}
          {departments.length > 0 && (
            <div className="bg-surface-1 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Routed Departments</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/8 border border-accent/15 rounded-full text-xs font-medium text-accent"
                  >
                    {DEPT_NAMES[code] || code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-surface-0 border-t border-border px-5 py-4 space-y-2.5">
          <button
            onClick={onEdit}
            className="w-full py-3 border border-border rounded-full text-sm font-semibold text-text-primary hover:bg-surface-1 transition-colors cursor-pointer"
          >
            Edit Details
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-hover shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Creating Report...
              </>
            ) : (
              <>
                Confirm & Notify
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
