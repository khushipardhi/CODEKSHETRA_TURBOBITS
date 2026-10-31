/* ════════════════════════════════════════════════════════
   Tracking Timeline — Live Real-Time Citizen Lifecycle Tracker
   Visual 4-Stage Milestone Stepper + Clean Chronological Log
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";

export interface TimelineEvent {
  status: string;
  description: string | null;
  timestamp: string;
}

interface TrackingTimelineProps {
  events: TimelineEvent[];
  currentStatus?: string;
}

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; emailNote?: string; color: string }> = {
  DRAFT: { label: "Report Created", icon: "📝", color: "bg-slate-100 text-slate-700 border-slate-200" },
  AI_PROCESSING: { label: "AI Analysis & Triage", icon: "🤖", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CONFIRMED: { label: "Report Submitted", icon: "📬", emailNote: "Confirmation email sent to citizen", color: "bg-blue-50 text-blue-700 border-blue-200" },
  ROUTED: { label: "Routed to Department", icon: "🏢", emailNote: "Department officer notified", color: "bg-blue-50 text-blue-700 border-blue-200" },
  ASSIGNED: { label: "Department Acknowledged", icon: "📋", emailNote: "Officer assigned to task", color: "bg-amber-50 text-amber-700 border-amber-200" },
  IN_PROGRESS: { label: "Work In Progress", icon: "⚙️", emailNote: "Field crew dispatched to site", color: "bg-amber-50 text-amber-700 border-amber-200" },
  WORK_STARTED: { label: "Field Work Underway", icon: "🛠️", emailNote: "Remediation underway", color: "bg-amber-50 text-amber-700 border-amber-200" },
  WORK_COMPLETED: { label: "Work Completed", icon: "✅", emailNote: "Field operations concluded", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING_VERIFICATION: { label: "Pending Verification", icon: "🔍", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESOLVED: { label: "Issue Resolved", icon: "🎉", emailNote: "Resolution email & closure report sent", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED: { label: "Report Closed & Archived", icon: "📁", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  // Deduplicate identical sequential events
  const deduplicatedEvents: TimelineEvent[] = [];
  for (let i = 0; i < events.length; i++) {
    const curr = events[i];
    const prev = deduplicatedEvents[deduplicatedEvents.length - 1];
    if (prev && prev.status === curr.status && prev.description === curr.description) {
      continue;
    }
    deduplicatedEvents.push(curr);
  }

  // Determine current active milestone index (0 to 3)
  const resolvedState = currentStatus === "RESOLVED" || currentStatus === "CLOSED" || deduplicatedEvents.some(e => e.status === "RESOLVED" || e.status === "CLOSED");
  const inProgressState = currentStatus === "IN_PROGRESS" || currentStatus === "WORK_STARTED" || deduplicatedEvents.some(e => e.status === "IN_PROGRESS");
  const assignedState = currentStatus === "ASSIGNED" || currentStatus === "ROUTED" || deduplicatedEvents.some(e => e.status === "ASSIGNED" || e.status === "ROUTED");

  const milestoneStep = resolvedState ? 3 : inProgressState ? 2 : assignedState ? 1 : 0;

  const milestones = [
    { label: "1. Submitted", desc: "Citizen AI Report" },
    { label: "2. Acknowledged", desc: "Department Triage" },
    { label: "3. In Progress", desc: "Crew Dispatched" },
    { label: "4. Resolved", desc: "Verified & Closed" },
  ];

  // Reverse activity log so latest update is at the top
  const reversedEvents = [...deduplicatedEvents].reverse();

  return (
    <div className="space-y-6">
      {/* ─── 4-Stage Milestone Stepper ─── */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {milestones.map((m, idx) => {
            const isCompleted = idx < milestoneStep;
            const isCurrent = idx === milestoneStep;

            return (
              <div
                key={m.label}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs"
                    : isCurrent
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  {isCompleted ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                  <span className="text-xs font-semibold">{m.label}</span>
                </div>
                <p className={`text-[10px] ${isCurrent ? "text-blue-100" : isCompleted ? "text-emerald-700" : "text-slate-400"}`}>
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Live Chronological Activity Stream ─── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>📋</span> Real-Time Action Log ({reversedEvents.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Database Synced</span>
        </div>

        {reversedEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
            Awaiting first departmental action
          </div>
        ) : (
          <div className="space-y-0 relative before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {reversedEvents.map((event, index) => {
              const isFirst = index === 0;
              const config = STATUS_CONFIG[event.status] || {
                label: event.status,
                icon: "📌",
                color: "bg-slate-100 text-slate-700 border-slate-200",
              };

              return (
                <div key={index} className="flex items-start gap-3.5 relative pb-6 last:pb-0">
                  {/* Icon Indicator Dot */}
                  <div
                    className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm border relative z-10 ${
                      isFirst
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-4 ring-slate-100"
                        : config.color
                    }`}
                  >
                    {config.icon}
                  </div>

                  {/* Activity Details Card */}
                  <div className="flex-1 bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        {config.label}
                        {isFirst && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 uppercase">
                            Latest
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {event.description}
                      </p>
                    )}

                    {config.emailNote && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                        <span>✉️</span>
                        <span>{config.emailNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
