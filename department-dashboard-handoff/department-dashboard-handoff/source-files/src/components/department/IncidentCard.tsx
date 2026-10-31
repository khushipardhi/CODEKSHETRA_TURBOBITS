"use client";

import React from "react";
import { Badge, Button } from "@/components/ui";

export interface IncidentData {
  id: string;
  trackingId: string;
  category: string;
  summary: string;
  location: string;
  timestamp: string;
  status: string;
  priority: number;
  privacyLevel: "PUBLIC" | "RESTRICTED" | "PRIVATE";
  assignedTo?: string;
}

interface IncidentCardProps {
  incident: IncidentData;
  onClick: (id: string) => void;
}

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const getPriorityColor = (p: number) => {
    if (p >= 80) return "text-rose-600";
    if (p >= 50) return "text-amber-600";
    if (p >= 20) return "text-blue-600";
    return "text-emerald-600";
  };

  const getStatusBadgeVariant = (s: string) => {
    switch (s.toUpperCase()) {
      case "INCOMING":
      case "ROUTED":
        return "warning";
      case "IN_PROGRESS":
      case "ASSIGNED":
        return "accent";
      case "RESOLVED":
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };

  const isEmergency = incident.priority >= 85;

  return (
    <div
      onClick={() => onClick(incident.id)}
      className="group relative rounded-2xl p-4.5 cursor-pointer transition-all duration-200 select-none bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(incident.status)}
            className="font-bold text-[10px] py-0.5 px-2"
          >
            {incident.status}
          </Badge>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {incident.trackingId}
          </span>
          {isEmergency && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Priority Alert
            </span>
          )}
          <span className="text-[11px] text-slate-400 ml-auto font-medium">
            {new Date(incident.timestamp).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight group-hover:text-accent transition-colors truncate">
            {incident.category}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {incident.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-xs">
            <span>📍</span> {incident.location}
          </span>
          {incident.privacyLevel !== "PUBLIC" && (
            <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
              <span>🔒</span> {incident.privacyLevel}
            </span>
          )}
          {incident.assignedTo && (
            <span className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
              <span>👷</span> {incident.assignedTo}
            </span>
          )}
        </div>
      </div>

      <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 md:border-l md:border-slate-200 md:pl-4 w-full md:w-auto min-w-[110px] flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div className="text-center">
          <div
            className={`font-display text-xl font-black tracking-tight ${getPriorityColor(
              incident.priority
            )}`}
          >
            {incident.priority}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Priority Score
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="text-xs py-1 px-3 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 w-24 md:w-full"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
