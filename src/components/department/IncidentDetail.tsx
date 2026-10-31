/* ════════════════════════════════════════════════════════
   In-Page Incident Investigation & Dispatch Command Console
   Clean, Elegant, Light-Mode Aesthetic with Refined Typography
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { IncidentData } from "./IncidentCard";

interface IncidentDetailProps {
  incident: IncidentData | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onResolve: (id: string) => void;
  onAssignTask: (id: string, assignment: any) => void;
}

const AVAILABLE_UNITS = [
  { id: "unit-01", name: "Quick Response Unit 01 (Station Alpha)", status: "Available" },
  { id: "unit-02", name: "Heavy Field Crew 02 (Central Hub)", status: "Available" },
  { id: "unit-03", name: "Emergency Dispatch Team 03", status: "On Standby" },
  { id: "unit-04", name: "Rapid Inspection Squad 04", status: "Available" },
];

export function IncidentDetail({
  incident,
  onClose,
  onAccept,
  onResolve,
  onAssignTask,
}: IncidentDetailProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("unit-01");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!incident) return null;

  const isEmergency = incident.priority >= 80;
  const isRestricted = incident.privacyLevel !== "PUBLIC";
  const displayTitle =
    incident.title && incident.title.trim() && !incident.title.toLowerCase().includes("untitled")
      ? incident.title
      : incident.summary && incident.summary.length > 70
      ? incident.summary.slice(0, 68) + "..."
      : incident.category || "Civic Incident Report";

  const handleDispatch = () => {
    const workerObj = AVAILABLE_UNITS.find((u) => u.id === selectedWorker);
    onAssignTask(incident.id, {
      workerId: selectedWorker,
      workerName: workerObj?.name || selectedWorker,
      instructions: dispatchNotes || "Field inspection and prompt civic resolution.",
    });
  };

  const handleResolveAction = () => {
    onResolve(incident.id);
  };

  // Status progression steps
  const statusSteps = [
    { key: "ROUTED", label: "1. Reported" },
    { key: "ASSIGNED", label: "2. Acknowledged" },
    { key: "IN_PROGRESS", label: "3. Dispatched" },
    { key: "RESOLVED", label: "4. Resolved" },
  ];

  const currentStatusIdx =
    incident.status === "RESOLVED" || incident.status === "CLOSED"
      ? 3
      : incident.status === "IN_PROGRESS" || incident.status === "WORK_STARTED"
      ? 2
      : incident.status === "ASSIGNED"
      ? 1
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col font-sans transition-all">
      {/* ─── Clean Header ─── */}
      <div className="bg-white border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              #{incident.trackingId}
            </span>
            <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {incident.category || "Civic Incident"}
            </span>
            {isEmergency && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Emergency
              </span>
            )}
            {isRestricted && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                🔒 {incident.privacyLevel}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-slate-900 line-clamp-1 leading-snug">
            {displayTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-medium text-slate-400">Priority Score</div>
            <div
              className={`font-mono font-bold text-sm ${
                incident.priority >= 80
                  ? "text-rose-600"
                  : incident.priority >= 50
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {incident.priority} / 100
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
            title="Close Panel"
          >
            <span>✕ Close</span>
          </button>
        </div>
      </div>

      {/* ─── Refined Status Progression Stepper ─── */}
      <div className="bg-slate-50/70 border-b border-slate-100 px-5 py-2.5">
        <div className="grid grid-cols-4 gap-2">
          {statusSteps.map((step, idx) => (
            <div
              key={step.key}
              className={`py-1.5 px-2 rounded-lg text-center text-xs transition-all border ${
                idx <= currentStatusIdx
                  ? "bg-slate-900 text-white font-medium border-slate-900 shadow-2xs"
                  : "bg-white text-slate-400 font-normal border-slate-200"
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Scrollable Investigation Body ─── */}
      <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-22rem)]">
        {/* Citizen Statement Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🗣️</span> Citizen Statement
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">
              {new Date(incident.timestamp).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <p className="p-3 bg-white rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            "{incident.summary || "No raw statement text submitted."}"
          </p>
        </div>

        {/* Location & GPS */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> Location & Address
          </h3>
          <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
              {incident.location || "Nagpur Municipal Jurisdiction"}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                incident.location || "Nagpur"
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>Open in Google Maps ↗</span>
            </a>
          </div>
        </div>

        {/* Visual Evidence (Photos) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📷</span> Visual Evidence & Attachments
            </h3>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {incident.media && incident.media.length > 0
                ? `${incident.media.length} Photo Attached`
                : "No Photos"}
            </span>
          </div>

          {incident.media && incident.media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {incident.media.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => item.storageUrl && setSelectedPhoto(item.storageUrl)}
                  className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs transition-all aspect-square"
                >
                  {item.storageUrl ? (
                    <>
                      <img
                        src={item.storageUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        Enlarge 🔍
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <span className="text-xl">📎</span>
                      <span className="text-[10px] truncate w-full mt-1 font-mono">{item.fileName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg bg-white text-slate-400 text-xs">
              No photographic evidence attached.
            </div>
          )}
        </div>

        {/* Dispatch & Personnel Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>👷</span> Field Crew & Unit Dispatch
            </h3>
            {incident.assignedTo ? (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Assigned: {incident.assignedTo}
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pending Field Dispatch
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Select Department Unit:
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {AVAILABLE_UNITS.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} — [{unit.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Dispatch Instructions:
              </label>
              <textarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g., Proceed to site with emergency response equipment..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 font-normal"
              />
            </div>

            <Button
              onClick={handleDispatch}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              Dispatch Unit to Site Now
            </Button>
          </div>
        </div>

        {/* Resolution Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <span>✅</span> Resolution & Citizen Notification
          </h3>

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Resolution Statement (Sent to Citizen):
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g., Road repairs completed and traffic flow restored."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 font-normal"
              />
            </div>

            <Button
              onClick={handleResolveAction}
              disabled={incident.status === "RESOLVED"}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {incident.status === "RESOLVED" ? "Incident Marked as Resolved ✓" : "Mark as Resolved & Notify Citizen ✓"}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Bottom Actions Footer ─── */}
      <div className="bg-slate-50 border-t border-slate-200/80 p-3.5 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          className="px-4 py-1.5 font-medium text-xs text-slate-600 bg-white hover:bg-slate-100 border-slate-200 rounded-lg cursor-pointer"
        >
          Close
        </Button>

        <div className="flex items-center gap-2">
          {incident.status === "ROUTED" && (
            <Button
              onClick={() => onAccept(incident.id)}
              className="px-4 py-1.5 font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer shadow-2xs"
            >
              Acknowledge & Accept
            </Button>
          )}

          {incident.status !== "RESOLVED" && (
            <Button
              onClick={handleResolveAction}
              className="px-4 py-1.5 font-medium text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shadow-2xs"
            >
              Resolve ✓
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[var(--z-toast)] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <img
              src={selectedPhoto}
              alt="Enlarged evidence"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
