/* ════════════════════════════════════════════════════════
   Incident Tracking Page — /dashboard/[reference]
   Map · Status card · AI Report · Q&A · Timeline · Departments
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TrackingTimeline } from "@/components/citizen/tracking-timeline";
import { SeverityRing } from "@/components/citizen/severity-ring";
import { citizenHeaders } from "@/lib/guest-id";

interface IncidentDetail {
  publicReference: string;
  category: string | null;
  status: string;
  severity: string | null;
  priorityScore: number | null;
  title: string | null;
  citizenSummary: string | null;
  locationText: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isEmergency: boolean;
  privacyLevel: string;
  createdAt: string;
  confirmedAt: string | null;
  resolvedAt: string | null;
  finalReport: {
    summary?: string;
    severity?: { level: string; score: number; reason: string };
    priority?: { score: number; band: string };
    affectedPeople?: number | null;
    departments?: Array<{ code: string; name: string; reason: string }>;
    isEmergency?: boolean;
  } | null;
}

interface Department {
  code: string;
  name: string;
  status: string;
}

interface TimelineEvent {
  status: string;
  description: string | null;
  timestamp: string;
}

interface AIConversationItem {
  questionId: string;
  questionText: string;
  questionType: string;
  answerValue: string | null;
  isRequired: boolean;
}

interface MediaItem {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string | null;
  purpose: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Submitted", className: "bg-accent/10 text-accent border-accent/20" },
  ROUTED: { label: "Routed", className: "bg-accent/10 text-accent border-accent/20" },
  ASSIGNED: { label: "Assigned", className: "bg-accent/10 text-accent border-accent/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-warning-bg text-warning border-warning-border" },
  PENDING_VERIFICATION: { label: "Verifying", className: "bg-warning-bg text-warning border-warning-border" },
  RESOLVED: { label: "Resolved", className: "bg-success-bg text-success border-success-border" },
  CLOSED: { label: "Closed", className: "bg-success-bg text-success border-success-border" },
};

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [aiConversation, setAiConversation] = useState<AIConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/incidents/${reference}`, {
          headers: citizenHeaders(),
        });
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("You are not authorized to view this report.");
          }
          throw new Error(res.status === 404 ? "Report not found" : "Failed to load");
        }
        const data = await res.json();
        setIncident(data.incident);
        setDepartments(data.departments || []);
        setTimeline(data.timeline || []);
        setMedia(data.media || []);
        setAiConversation(data.aiConversation || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-text-tertiary">Loading report...</span>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">{error || "Not Found"}</h2>
          <p className="text-sm text-text-tertiary mb-4">
            {error?.includes("authorized")
              ? "You can only view reports that belong to you."
              : "We couldn\u0027t find a report with this reference."}
          </p>
          <button
            onClick={() => {
              try {
                const cityParam = (params?.city as string) || "nagpur";
                router.push(`/${cityParam}/dashboard`);
              } catch {
                router.push("/dashboard");
              }
            }}
            className="px-6 py-2.5 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[incident.status] || STATUS_BADGE.CONFIRMED;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-[var(--z-sticky)] glass">
        <div className="flex items-center gap-3 px-4 h-14 max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-accent">Report Details</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-8">
        {/* Report card */}
        <div className="bg-surface-0 border border-border rounded-2xl overflow-hidden mt-4 shadow-sm">
          {/* Hero Banner — Uploaded Photo or Live Interactive OSM Location Map */}
          {media && media.length > 0 && media[0].storageUrl ? (
            <div
              className="relative h-56 bg-surface-2 overflow-hidden cursor-pointer group"
              onClick={() => setSelectedPhoto(media[0].storageUrl)}
            >
              <img
                src={media[0].storageUrl}
                alt="Citizen Evidence"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
              {incident.locationText && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/20">
                  <span>📍</span> {incident.locationText}
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-white/20">
                <span>📷</span> {media.length} Photo{media.length > 1 ? "s" : ""} Attached
              </div>
              <div className="absolute bottom-3 left-3 text-white/90 text-xs font-medium">
                Click to enlarge photo 🔍
              </div>
            </div>
          ) : (
            <div className="relative h-48 bg-slate-950 overflow-hidden">
              {incident.latitude && incident.longitude ? (
                <iframe
                  title="Nagpur Incident Location Map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(incident.longitude) - 0.007}%2C${Number(incident.latitude) - 0.005}%2C${Number(incident.longitude) + 0.007}%2C${Number(incident.latitude) + 0.005}&layer=mapnik&marker=${incident.latitude}%2C${incident.longitude}`}
                  className="w-full h-full border-0 pointer-events-none opacity-90"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Nagpur Civic Jurisdiction</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/20">
                <span>📍</span> {incident.locationText || "Nagpur Civic Location Verified"}
              </div>
              <a
                href={`https://www.google.com/maps?q=${incident.latitude || 21.1458},${incident.longitude || 79.0882}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md transition-all"
              >
                <span>View on Google Maps ↗</span>
              </a>
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-extrabold text-text-primary flex-1 leading-snug">
                {incident.title && incident.title.trim() && !incident.title.toLowerCase().includes("untitled")
                  ? incident.title
                  : (incident.citizenSummary || "Civic Incident Report")}
              </h2>
              <span className={`ml-3 px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-text-tertiary">Report ID: #{incident.publicReference}</p>

            {incident.citizenSummary && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                {incident.citizenSummary}
              </p>
            )}

            {/* Privacy badge */}
            {incident.privacyLevel && incident.privacyLevel !== "PUBLIC" && (
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  incident.privacyLevel === "SENSITIVE"
                    ? "bg-critical-bg text-critical"
                    : "bg-warning-bg text-warning"
                }`}>
                  🔒 {incident.privacyLevel}
                </span>
              </div>
            )}

            {/* Severity + departments row */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              {incident.priorityScore != null && (
                <SeverityRing score={incident.priorityScore} size={48} strokeWidth={4} />
              )}
              {departments.length > 0 && (
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Departments</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {departments.map((d) => (
                      <span key={d.code} className="text-xs px-2 py-0.5 bg-accent/8 text-accent rounded-full">
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final AI Report */}
        {incident.finalReport && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">AI Analysis Report</h2>
            <div className="bg-surface-0 border border-border rounded-2xl p-4 space-y-3">
              {incident.finalReport.summary && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Summary</span>
                  <p className="text-sm text-text-primary mt-0.5">{incident.finalReport.summary}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {incident.finalReport.severity && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Severity</span>
                    <p className="text-sm font-bold text-text-primary mt-0.5 capitalize">{incident.finalReport.severity.level}</p>
                    <p className="text-xs text-text-tertiary">{incident.finalReport.severity.reason}</p>
                  </div>
                )}
                {incident.finalReport.affectedPeople != null && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">People Affected</span>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{incident.finalReport.affectedPeople}</p>
                  </div>
                )}
              </div>
              {incident.finalReport.isEmergency && (
                <div className="bg-critical-bg border border-critical-border rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-base">🚨</span>
                  <span className="text-xs font-bold text-critical">Emergency Incident</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* AI Questions & Answers */}
        {aiConversation.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">Questions & Answers</h2>
            <div className="bg-surface-0 border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {aiConversation.map((item, idx) => (
                <div key={item.questionId || idx} className="p-4">
                  <p className="text-xs font-semibold text-text-tertiary mb-1">
                    Q{idx + 1}. {item.questionText}
                    {item.isRequired && <span className="text-critical ml-1">*</span>}
                  </p>
                  <p className="text-sm text-text-primary font-medium">
                    {item.answerValue || "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attached Photos & Evidence */}
        {media.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text-primary">Uploaded Photos & Evidence</h2>
              <span className="text-xs font-semibold text-accent">{media.length} Attached</span>
            </div>
            <div className="bg-surface-0 border border-border rounded-2xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    onClick={() => m.storageUrl && setSelectedPhoto(m.storageUrl)}
                    className="group relative rounded-xl overflow-hidden border border-border bg-surface-1 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    {m.storageUrl ? (
                      <div className="aspect-square">
                        <img
                          src={m.storageUrl}
                          alt={m.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          View Photo 🔍
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square flex flex-col items-center justify-center p-2 text-center text-text-tertiary">
                        <span className="text-2xl">📎</span>
                        <span className="text-[10px] font-mono truncate w-full mt-1">{m.fileName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Timeline */}
        <section className="mt-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Tracking Timeline</h2>
          <div className="bg-surface-0 border border-border rounded-2xl p-4">
            <TrackingTimeline events={timeline} currentStatus={incident.status} />
          </div>
        </section>
      </main>

      {/* Lightbox Photo Preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[var(--z-toast)] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-surface-0 rounded-2xl overflow-hidden shadow-2xl border border-border">
            <img
              src={selectedPhoto}
              alt="Enlarged evidence"
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
