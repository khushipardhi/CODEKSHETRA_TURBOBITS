"use client";

import React, { useState } from "react";
import { Badge, Button, Dialog } from "@/components/ui";
import { IncidentData } from "./IncidentCard";
import { TaskAssignmentPanel } from "./TaskAssignmentPanel";

interface IncidentDetailProps {
  incident: IncidentData | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onResolve: (id: string) => void;
  onAssignTask: (id: string, assignment: any) => void;
}

export function IncidentDetail({
  incident,
  onClose,
  onAccept,
  onResolve,
  onAssignTask,
}: IncidentDetailProps) {
  const [showAssignment, setShowAssignment] = useState(false);

  if (!incident) return null;

  const isRestricted = incident.privacyLevel !== "PUBLIC";

  return (
    <Dialog open={!!incident} onClose={onClose} size="lg" title="Incident Investigation & Dispatch">
      <div className="mt-2 space-y-5 max-h-[72vh] overflow-y-auto pr-1 text-slate-900">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {incident.trackingId}
              </span>
              <Badge variant={incident.status === "RESOLVED" ? "success" : "warning"} className="text-[10px] font-bold">
                {incident.status}
              </Badge>
              {isRestricted && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🔒 {incident.privacyLevel}
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {incident.category}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Reported: {new Date(incident.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-200/80 md:bg-transparent md:p-0 md:border-0 flex-shrink-0">
            <div className="font-display text-2xl font-black text-rose-600/90 tracking-tight">{incident.priority}</div>
            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">PRIORITY SCORE</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                INCIDENT LOCATION
              </h4>
              <p className="text-xs font-semibold text-slate-900 flex items-start gap-1.5">
                <span>📍</span> {incident.location}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                CITIZEN SUMMARY
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{incident.summary}"
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                ASSIGNMENT & FIELD CREW
              </h4>
              {incident.assignedTo ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-900">{incident.assignedTo}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">No field worker assigned yet.</p>
                  <Button
                    size="sm"
                    variant="accent"
                    className="w-full text-xs font-bold py-1.5"
                    onClick={() => setShowAssignment(true)}
                  >
                    Assign Field Unit Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task Assignment Drawer/Panel */}
        {showAssignment && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <TaskAssignmentPanel
              incidentId={incident.id}
              onAssign={(assignment) => {
                onAssignTask(incident.id, assignment);
                setShowAssignment(false);
              }}
              onCancel={() => setShowAssignment(false)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <Button variant="secondary" size="sm" className="bg-slate-100 border-slate-200 text-xs font-semibold" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {incident.status === "INCOMING" || incident.status === "ROUTED" ? (
              <Button
                variant="accent"
                size="sm"
                className="text-xs font-bold py-1.5 px-4"
                onClick={() => onAccept(incident.id)}
              >
                Acknowledge & Accept
              </Button>
            ) : null}

            {incident.status !== "RESOLVED" && incident.status !== "WORK_COMPLETED" ? (
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onResolve(incident.id)}
              >
                Mark as Resolved
              </Button>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                ✓ Incident Resolved
              </span>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
