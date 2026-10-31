"use client";

import React from "react";
import { Button } from "@/components/ui";

interface CriticalIncident {
  id: string;
  trackingId: string;
  category: string;
  location: string;
  affectedCount?: number;
  status: string;
}

interface CriticalIncidentPanelProps {
  incidents: CriticalIncident[];
  onViewIncident: (id: string) => void;
}

export function CriticalIncidentPanel({
  incidents,
  onViewIncident,
}: CriticalIncidentPanelProps) {
  if (!incidents || incidents.length === 0) return null;

  // Show top 4 critical incidents on console to prevent page clutter
  const displayIncidents = incidents.slice(0, 4);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Priority Incident Alerts ({incidents.length})
        </h2>
        <span className="text-[11px] font-medium text-slate-500">
          Showing top {displayIncidents.length} active emergency dispatches
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {displayIncidents.map((incident) => (
          <div
            key={incident.id}
            className="rounded-xl p-4 bg-white border border-slate-200 shadow-xs hover:shadow-sm hover:border-slate-300 space-y-2.5 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight truncate">
                    {incident.category}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                    High Priority
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 font-semibold">
                  {incident.trackingId}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
                {incident.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5 font-medium truncate">
                <span className="text-slate-400">📍</span> {incident.location}
              </p>
              {incident.affectedCount !== undefined && (
                <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="text-slate-400">👥</span> {incident.affectedCount} people affected
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <Button
                size="sm"
                variant="secondary"
                className="font-semibold text-xs py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                onClick={() => onViewIncident(incident.id)}
              >
                Inspect & Respond →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
