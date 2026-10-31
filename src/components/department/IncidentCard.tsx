"use client";

import React from "react";
import { Badge, Button } from "@/components/ui";

export interface IncidentData {
  id: string;
  trackingId: string;
  title?: string;
  category: string;
  summary: string;
  location: string;
  timestamp: string;
  status: string;
  priority: number;
  privacyLevel: "PUBLIC" | "RESTRICTED" | "PRIVATE";
  assignedTo?: string;
  media?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    storageUrl: string | null;
  }>;
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
  const headline = incident.title && incident.title.trim() && !incident.title.toLowerCase().includes("untitled")
    ? incident.title
    : (incident.summary && incident.summary.length > 60 ? incident.summary.slice(0, 58) + "..." : (incident.category || "Civic Incident"));

  const hasPhotos = incident.media && incident.media.length > 0;

  return (
    <div
      onClick={() => onClick(incident.id)}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 select-none bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
    >
      <div className="flex-1 space-y-2.5 min-w-0">
        {/* Top metadata tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(incident.status)}
            className="font-semibold text-[10px] py-0.5 px-2 uppercase tracking-wider"
          >
            {incident.status}
          </Badge>
          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {incident.trackingId}
          </span>
          {incident.category && (
            <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {incident.category}
            </span>
          )}
          {isEmergency && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Priority Alert
            </span>
          )}
          <span className="text-[11px] text-slate-400 ml-auto font-normal">
            {new Date(incident.timestamp).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Headline & Description */}
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-blue-600 transition-colors">
            {headline}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
            {incident.summary}
          </p>
        </div>

        {/* Bottom tags & evidence thumbnail indicator */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1 font-normal text-slate-600 truncate max-w-sm">
            <span>📍</span> {incident.location}
          </span>

          {hasPhotos && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span>📷</span> {incident.media!.length} Photo{incident.media!.length > 1 ? "s" : ""} Attached
            </span>
          )}

          {incident.privacyLevel !== "PUBLIC" && (
            <span className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
              <span>🔒</span> {incident.privacyLevel}
            </span>
          )}

          {incident.assignedTo && (
            <span className="flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
              <span>👷</span> {incident.assignedTo}
            </span>
          )}
        </div>
      </div>

      {/* Right Column / Priority Score */}
      <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 md:border-l md:border-slate-100 md:pl-5 w-full md:w-auto min-w-[110px] flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div className="text-center">
          <div
            className={`text-xl font-bold font-mono ${getPriorityColor(
              incident.priority
            )}`}
          >
            {incident.priority}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Priority Score
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="text-xs py-1 px-3 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border-slate-200 w-28 md:w-full transition-all cursor-pointer"
        >
          View Details →
        </Button>
      </div>
    </div>
  );
}
