/* ════════════════════════════════════════════════════════
   Admin Incident Detail — Full incident view with
   AI analysis, departments, timeline, status actions
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, use } from "react";
import { Card, Badge, Button } from "@/components/ui";
import {
  ArrowRightIcon,
  AlertTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  MapIcon,
  BuildingIcon,
} from "@/components/ui/icons";
import Link from "next/link";

/* ─── Types ─── */
interface IncidentDetail {
  publicReference: string;
  citizenId: string;
  category: string | null;
  subcategory: string | null;
  status: string;
  severity: string | null;
  priorityScore: number | null;
  priorityBand: string | null;
  privacyLevel: string;
  title: string | null;
  citizenSummary: string | null;
  internalSummary: string | null;
  originalText: string | null;
  originalTranscript: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  isEmergency: boolean;
  selectedDepartment: string | null;
  departmentAnswers: Record<string, string> | null;
  ai: {
    provider: string | null;
    model: string | null;
    confidence: number | null;
    analysis: Record<string, unknown> | null;
  };
  finalAiReport: Record<string, unknown> | null;
  geoRouting: Record<string, unknown> | null;
  confirmedAt: string | null;
  routedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  code: string;
  name: string;
  routingReason: string | null;
  status: string;
}

interface TimelineEntry {
  fromStatus: string;
  toStatus: string;
  actorId: string | null;
  reason: string | null;
  timestamp: string;
}

interface MediaItem {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  purpose: string;
  storageUrl?: string | null;
}

interface Conversation {
  questionId: string;
  questionText: string;
  questionType: string;
  questionOptions: string[] | null;
  answerValue: string | null;
  sortOrder: number;
}

/* ─── Helpers ─── */
const severityVariant = (s: string | null) => {
  switch (s) {
    case "CRITICAL": return "critical" as const;
    case "HIGH": return "high" as const;
    case "MEDIUM": return "medium" as const;
    case "LOW": return "low" as const;
    default: return "default" as const;
  }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: "Draft", CONFIRMED: "Confirmed", ROUTED: "Routed",
    ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
    WORK_COMPLETED: "Work Complete", RESOLVED: "Resolved", CLOSED: "Closed",
  };
  return m[s] || s;
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const NEXT_STATUSES: Record<string, string[]> = {
  CONFIRMED: ["ROUTED"],
  ROUTED: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WORK_COMPLETED", "RESOLVED"],
  WORK_COMPLETED: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
};

export default function AdminIncidentDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = use(params);
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/incidents/${reference}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Incident not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setIncident(data.incident);
          setDepartments(data.departments || []);
          setTimeline(data.timeline || []);
          setMedia(data.media || []);
          setConversations(data.conversations || []);
        }
      } catch (err) {
        setError("Failed to load incident");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reference]);

  async function updateStatus(newStatus: string) {
    if (!incident) return;
    const reason = prompt(`Reason for changing status to ${statusLabel(newStatus)}:`) || "";
    try {
      setStatusUpdating(true);
      const res = await fetch(`/api/admin/incidents/${reference}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      if (res.ok) {
        // Reload data
        const reloadRes = await fetch(`/api/admin/incidents/${reference}`);
        const data = await reloadRes.json();
        if (data.success) {
          setIncident(data.incident);
          setTimeline(data.timeline || []);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4 fade-in">
        <Link href="/admin/incidents" className="text-sm text-accent hover:underline">
          ← Back to Incidents
        </Link>
        <Card padding="lg">
          <p className="text-sm text-critical">{error || "Incident not found"}</p>
        </Card>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[incident.status] || [];

  return (
    <div className="space-y-6 fade-in">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/incidents" className="text-xs text-accent hover:underline">
            ← All Incidents
          </Link>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            {incident.publicReference}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextStatuses.map((ns) => (
            <Button
              key={ns}
              variant="primary"
              size="sm"
              onClick={() => updateStatus(ns)}
              disabled={statusUpdating}
            >
              → {statusLabel(ns)}
            </Button>
          ))}
        </div>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Severity</p>
          <Badge variant={severityVariant(incident.severity)} className="mt-1">
            {incident.severity || "—"}
          </Badge>
        </Card>
        <Card padding="sm">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Status</p>
          <Badge variant="default" className="mt-1">{statusLabel(incident.status)}</Badge>
        </Card>
        <Card padding="sm">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Priority</p>
          <p className="text-lg font-bold mt-0.5">{incident.priorityScore ?? "—"}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Emergency</p>
          <p className="text-sm font-semibold mt-1">{incident.isEmergency ? "🚨 Yes" : "No"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title + Summary */}
          <Card padding="md">
            <h2 className="text-base font-semibold mb-3">
              {incident.title || "Untitled Report"}
            </h2>
            {incident.citizenSummary && (
              <div className="mb-3">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-1">
                  Citizen Summary
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {incident.citizenSummary}
                </p>
              </div>
            )}
            {incident.originalText && (
              <div className="mt-3 pt-3 border-t border-divider">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-1">
                  Original Text
                </p>
                <p className="text-sm text-text-tertiary italic leading-relaxed">
                  &ldquo;{incident.originalText}&rdquo;
                </p>
              </div>
            )}
          </Card>

          {/* Location */}
          {(incident.locationText || incident.latitude) && (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                📍 Location
              </p>
              {incident.locationText && (
                <p className="text-sm text-text-secondary mb-2">{incident.locationText}</p>
              )}
              {incident.latitude && incident.longitude && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-tertiary">
                    {incident.latitude}, {incident.longitude}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <MapIcon size={12} /> View on Map
                  </a>
                </div>
              )}
            </Card>
          )}

          {/* Citizen Visual Evidence / Media Gallery */}
          {media.length > 0 && (
            <Card padding="md" className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span>📷</span> Citizen Attached Evidence & Photos ({media.length})
                </p>
                <span className="text-[10px] text-text-tertiary">Click to enlarge</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {media.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    onClick={() => m.storageUrl && setActivePhoto(m.storageUrl)}
                    className="group relative rounded-xl overflow-hidden border border-border bg-surface-1 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    {m.storageUrl ? (
                      <div className="aspect-square">
                        <img
                          src={m.storageUrl}
                          alt={m.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white">
                          <span className="text-xs font-bold">🔍 Enlarge</span>
                          <span className="text-[9px] font-mono truncate w-full mt-1">{m.fileName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square flex flex-col items-center justify-center p-2 text-center text-text-tertiary bg-surface-1">
                        <span className="text-2xl">📎</span>
                        <span className="text-[10px] font-mono truncate w-full mt-1">{m.fileName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Analysis */}
          {incident.ai.analysis && (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                🤖 AI Analysis
              </p>
              <div className="flex items-center gap-3 mb-3 text-xs text-text-tertiary">
                <span>Provider: {incident.ai.provider || "—"}</span>
                <span>Model: {incident.ai.model || "—"}</span>
                {incident.ai.confidence !== null && (
                  <span>Confidence: {Math.round(incident.ai.confidence * 100)}%</span>
                )}
              </div>
              <pre className="text-xs bg-surface-1 rounded-lg p-3 overflow-x-auto text-text-secondary max-h-[300px] overflow-y-auto">
                {JSON.stringify(incident.ai.analysis, null, 2)}
              </pre>
            </Card>
          )}

          {/* Department Answers */}
          {incident.departmentAnswers && Object.keys(incident.departmentAnswers).length > 0 && (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                📋 Department-Specific Answers
              </p>
              <div className="space-y-2">
                {Object.entries(incident.departmentAnswers).map(([q, a]) => (
                  <div key={q} className="text-sm">
                    <p className="font-medium text-text-secondary">{q}</p>
                    <p className="text-text-tertiary mt-0.5">{String(a)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Q&A Conversations */}
          {conversations.length > 0 && (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
                💬 AI Questions & Citizen Answers
              </p>
              <div className="space-y-3">
                {conversations.map((c, i) => (
                  <div key={c.questionId || i} className="bg-surface-1 rounded-xl p-3">
                    <p className="text-xs font-semibold text-text-primary mb-1">
                      Q{i + 1}: {c.questionText}
                    </p>
                    <p className="text-sm text-accent font-medium">
                      → {c.answerValue || "(no answer)"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Final AI Report */}
          {incident.finalAiReport && (() => {
            const rpt = incident.finalAiReport as Record<string, unknown>;
            const summary = rpt.finalSummary ? String(rpt.finalSummary) : null;
            const findings = Array.isArray(rpt.keyFindings) ? rpt.keyFindings as string[] : [];
            const actions = Array.isArray(rpt.recommendedActions) ? rpt.recommendedActions as string[] : [];
            return (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
                📄 Final AI Report
              </p>
              <div className="space-y-3">
                {summary && (
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold mb-1">Summary</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
                  </div>
                )}
                {findings.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold mb-1">Key Findings</p>
                    <ul className="space-y-1">
                      {findings.map((f, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-accent mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {actions.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold mb-1">Recommended Actions</p>
                    <ul className="space-y-1">
                      {actions.map((a, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-warning mt-0.5">▸</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="mt-2">
                  <summary className="text-[10px] text-text-tertiary cursor-pointer hover:text-text-secondary">Raw Report JSON</summary>
                  <pre className="text-xs bg-surface-1 rounded-lg p-3 overflow-x-auto text-text-secondary max-h-[200px] overflow-y-auto mt-2">
                    {JSON.stringify(incident.finalAiReport, null, 2)}
                  </pre>
                </details>
              </div>
            </Card>
            );
          })()}

          {/* Original Transcript (voice input) */}
          {incident.originalTranscript && (
            <Card padding="md">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-1">
                🎙️ Original Voice Transcript
              </p>
              <p className="text-sm text-text-tertiary italic leading-relaxed">
                &ldquo;{incident.originalTranscript}&rdquo;
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Departments */}
          <Card padding="none">
            <div className="px-5 py-3 border-b border-divider">
              <p className="text-sm font-semibold">Departments</p>
            </div>
            {departments.length === 0 ? (
              <div className="px-5 py-4 text-xs text-text-tertiary">No departments assigned</div>
            ) : (
              <div className="divide-y divide-divider">
                {departments.map((d) => (
                  <div key={d.code} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{d.name}</span>
                      <Badge variant="default" className="text-[10px]">
                        {statusLabel(d.status)}
                      </Badge>
                    </div>
                    {d.routingReason && (
                      <p className="text-xs text-text-tertiary mt-1">{d.routingReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card padding="none">
            <div className="px-5 py-3 border-b border-divider">
              <p className="text-sm font-semibold">Timeline</p>
            </div>
            <div className="px-5 py-3 space-y-3">
              {/* Creation event */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Created</p>
                  <p className="text-[10px] text-text-tertiary">{formatDate(incident.createdAt)}</p>
                </div>
              </div>
              {incident.confirmedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Confirmed</p>
                    <p className="text-[10px] text-text-tertiary">{formatDate(incident.confirmedAt)}</p>
                  </div>
                </div>
              )}
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">
                      {statusLabel(t.fromStatus)} → {statusLabel(t.toStatus)}
                    </p>
                    {t.reason && <p className="text-[10px] text-text-tertiary">{t.reason}</p>}
                    <p className="text-[10px] text-text-tertiary">{formatDate(t.timestamp)}</p>
                  </div>
                </div>
              ))}
              {incident.resolvedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Resolved</p>
                    <p className="text-[10px] text-text-tertiary">{formatDate(incident.resolvedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card padding="md">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
              Details
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Category</span>
                <span className="text-text-secondary font-medium">{incident.category || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Subcategory</span>
                <span className="text-text-secondary font-medium">{incident.subcategory || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Privacy</span>
                <span className="text-text-secondary font-medium">{incident.privacyLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Department</span>
                <span className="text-text-secondary font-medium">{incident.selectedDepartment || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Citizen ID</span>
                <span className="text-text-secondary font-mono">{incident.citizenId}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Lightbox photo modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[var(--z-toast)] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-surface-1 rounded-2xl overflow-hidden shadow-2xl border border-border">
            <img
              src={activePhoto}
              alt="Enlarged visual evidence"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
