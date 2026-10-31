/* ════════════════════════════════════════════════════════
   Report Success — After PROCEED confirmed
   Shows tracking ID, departments, nearest facilities, next actions
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import NearestFacilities from "@/components/citizen/nearest-facilities";
import type { GeoRoutingResult } from "@/modules/geo/types";

interface CreatedIncident {
  publicReference: string;
  title: string;
  severity: string;
  priorityScore: number;
  priorityBand: string;
  isEmergency: boolean;
  departments: Array<{ code: string; name: string }>;
  createdAt: string;
}

interface ReportSuccessProps {
  incident: CreatedIncident;
  geoRouting?: GeoRoutingResult | null;
  onViewReport: () => void;
  onReportAnother: () => void;
  onGoHome: () => void;
}

export function ReportSuccess({
  incident,
  geoRouting,
  onViewReport,
  onReportAnother,
  onGoHome,
}: ReportSuccessProps) {
  return (
    <div className="space-y-5 fade-in">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <div className="w-16 h-16 rounded-full bg-success-bg border-2 border-success-border flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary">Report Submitted</h2>
        <p className="text-sm text-text-tertiary">Your report has been created and departments have been notified.</p>
      </div>

      {/* Tracking ID card */}
      <div className="bg-accent/5 border-2 border-accent/20 rounded-2xl p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
          Your Tracking ID
        </p>
        <p className="text-2xl font-black text-accent tracking-wide font-mono">
          {incident.publicReference}
        </p>
        <p className="text-xs text-text-tertiary mt-2">
          Save this ID to track your report status
        </p>
      </div>

      {/* Summary */}
      <div className="bg-surface-1 rounded-2xl p-4 border border-border">
        <p className="text-sm text-text-primary leading-relaxed">
          {incident.title}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold
            ${incident.severity === "CRITICAL" ? "bg-critical-bg text-critical" :
              incident.severity === "HIGH" ? "bg-high-bg text-high" :
                incident.severity === "MEDIUM" ? "bg-medium-bg text-medium" :
                  "bg-low-bg text-low"}`}>
            {incident.severity}
          </span>
          {incident.isEmergency && (
            <span className="px-2.5 py-1 rounded-full bg-critical-bg text-critical text-xs font-bold">
              🚨 Emergency
            </span>
          )}
        </div>
      </div>

      {/* Departments notified */}
      {incident.departments.length > 0 && (
        <div className="bg-surface-1 rounded-2xl p-4 border border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
            Departments Being Notified
          </h3>
          <div className="space-y-2">
            {incident.departments.map((dept) => (
              <div key={dept.code} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-sm text-text-primary">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Nearest Facilities ─── */}
      {geoRouting && geoRouting.recommendations && geoRouting.recommendations.length > 0 && (
        <div className="bg-surface-1 rounded-2xl p-4 border border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-2">
            <span>📍</span>
            Nearest Government Facilities
          </h3>
          <NearestFacilities routing={geoRouting} />
        </div>
      )}

      {/* What Happens Next */}
      <div className="bg-surface-1 rounded-2xl p-4 border border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          What Happens Next
        </h3>
        <div className="space-y-3">
          {["Report Submitted", "Department Notified", "Worker Assigned", "Resolution"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${i === 0 ? "bg-success text-white" : "bg-surface-3 text-text-tertiary"}`}>
                {i === 0 ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === 0 ? "text-text-primary font-medium" : "text-text-tertiary"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onViewReport}
          className="w-full py-3.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-all cursor-pointer shadow-md"
        >
          View Report Status
        </button>
        <button
          onClick={onReportAnother}
          className="w-full py-3 border border-border rounded-full text-sm font-semibold text-text-primary hover:bg-surface-1 transition-colors cursor-pointer"
        >
          Report Another Issue
        </button>
        <button
          onClick={onGoHome}
          className="w-full py-2 text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
