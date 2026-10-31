"use client";

import React from "react";
import { IncidentCard, IncidentData } from "./IncidentCard";

interface IncidentFeedProps {
  incidents: IncidentData[];
  onIncidentClick: (id: string) => void;
  loading?: boolean;
}

export function IncidentFeed({ incidents, onIncidentClick, loading }: IncidentFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white border border-slate-200/90 rounded-2xl p-6 h-28 shadow-xs"
          />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200/90 rounded-2xl border-dashed shadow-xs space-y-2">
        <span className="text-4xl block">📭</span>
        <h3 className="text-base font-bold text-slate-900">No Incidents in Queue</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          All reports for this department have been addressed or no incidents match the active filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {incidents.map((inc) => (
        <IncidentCard key={inc.id} incident={inc} onClick={onIncidentClick} />
      ))}
    </div>
  );
}
