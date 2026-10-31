/* ════════════════════════════════════════════════════════
   My Reports — Citizen Report History & Live Timelines
   Shows visual progress bars, email update indicators, filters
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { getOrCreateGuestId, citizenHeaders } from "@/lib/guest-id";
import { useCityContext } from "@/components/providers/city-provider";

interface Report {
  publicReference: string;
  title: string;
  status: string;
  severity: string;
  priorityScore: number;
  categorySlug: string;
  createdAt: string;
}

const MILESTONES = ["CONFIRMED", "ROUTED", "IN_PROGRESS", "RESOLVED"];

function getMilestoneIndex(status: string): number {
  switch (status) {
    case "CONFIRMED":
    case "RECEIVED":
      return 0;
    case "ROUTED":
    case "ASSIGNED":
      return 1;
    case "IN_PROGRESS":
    case "WORK_STARTED":
    case "WORK_COMPLETED":
    case "PENDING_VERIFICATION":
      return 2;
    case "RESOLVED":
    case "CLOSED":
    case "VERIFIED":
      return 3;
    default:
      return 0;
  }
}

export default function MyReportsPage() {
  const router = useRouter();
  const { city } = useCityContext();
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");

  useEffect(() => {
    getOrCreateGuestId().then(() => fetchReports());
  }, [session, city]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/mine?city=${city}`, {
        headers: {
          ...citizenHeaders(),
          "x-city": city,
        },
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(
        (data.incidents || []).map((i: Record<string, unknown>) => ({
          publicReference: (i.publicReference || i.public_reference) as string,
          title: i.title as string,
          status: (i.status as string) || "CONFIRMED",
          severity: (i.severity as string) || "MEDIUM",
          priorityScore: (i.priorityScore || i.priority_score || 0) as number,
          categorySlug: (i.categorySlug || i.category_slug || "") as string,
          createdAt: (i.createdAt || i.created_at) as string,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = (s: string) => {
    switch (s?.toUpperCase()) {
      case "CRITICAL":
        return "bg-critical-bg text-critical border-critical/30";
      case "HIGH":
        return "bg-high-bg text-high border-high/30";
      case "MEDIUM":
        return "bg-medium-bg text-medium border-medium/30";
      default:
        return "bg-low-bg text-low border-low/30";
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "RESOLVED":
      case "CLOSED":
        return { label: "Resolved ✓", cls: "bg-success-bg text-success border-success-border" };
      case "IN_PROGRESS":
      case "WORK_STARTED":
        return { label: "In Progress", cls: "bg-warning-bg text-warning border-warning-border" };
      case "ROUTED":
      case "ASSIGNED":
        return { label: "Routed to Dept", cls: "bg-accent/10 text-accent border-accent/20" };
      default:
        return { label: "Submitted", cls: "bg-surface-2 text-text-primary border-border" };
    }
  };

  const filteredReports = reports.filter((r) => {
    const isResolved = r.status === "RESOLVED" || r.status === "CLOSED";
    if (filter === "RESOLVED") return isResolved;
    if (filter === "ACTIVE") return !isResolved;
    return true;
  });

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <CitizenHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Reports</h1>
            <p className="text-xs text-text-tertiary">
              Track the resolution timeline and departmental updates of your submitted issues
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer shadow-sm"
          >
            + New Report
          </button>
        </div>

        {/* Guest Warning / Google Sync Callout */}
        {!isAuth && (
          <div className="mb-5 p-4 bg-surface-0 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-xs font-bold text-text-primary">Viewing reports as Guest</p>
                <p className="text-[11px] text-text-tertiary">
                  Sign in with Google to permanently save your reports and receive automated email status alerts.
                </p>
              </div>
            </div>
            <button
              onClick={() => signIn("google")}
              className="px-3.5 py-1.5 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              Sign In with Google
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { id: "ALL", label: `All (${reports.length})` },
            { id: "ACTIVE", label: `Active / In Progress (${reports.filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED").length})` },
            { id: "RESOLVED", label: `Resolved (${reports.filter((r) => r.status === "RESOLVED" || r.status === "CLOSED").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-accent text-white border-accent shadow-sm"
                  : "bg-surface-0 border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-text-tertiary font-medium">Fetching your civic reports...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-critical-bg border border-critical-border rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm text-critical font-semibold">{error}</p>
            <button
              onClick={fetchReports}
              className="text-xs text-accent font-bold mt-2 hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredReports.length === 0 && (
          <div className="bg-surface-0 border border-border rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-surface-1 rounded-full flex items-center justify-center mx-auto mb-3 text-text-tertiary text-2xl">
              📋
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1">
              {filter === "ALL" ? "No reports submitted yet" : `No ${filter.toLowerCase()} reports found`}
            </h3>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto mb-5 leading-relaxed">
              When you report civic issues like potholes, streetlights, power cuts, or water supply, they will appear here with live timeline updates.
            </p>
            <button
              onClick={() => router.push(`/${city}/dashboard`)}
              className="px-6 py-2.5 bg-accent text-white rounded-full text-xs font-bold cursor-pointer hover:bg-accent-hover transition-all shadow-md"
            >
              Report a Civic Issue
            </button>
          </div>
        )}

        {/* Reports List with Timeline Progress */}
        {!loading && filteredReports.length > 0 && (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const currentStep = getMilestoneIndex(report.status);
              const badge = statusBadge(report.status);

              return (
                <div
                  key={report.publicReference}
                  onClick={() => router.push(`/${city}/dashboard/${report.publicReference}`)}
                  className="bg-surface-0 border border-border rounded-3xl p-5 hover:border-accent/40 transition-all cursor-pointer shadow-sm hover:shadow-md group relative overflow-hidden"
                >
                  {/* Top Reference & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent px-2.5 py-1 bg-accent/10 rounded-lg">
                        {report.publicReference}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${severityStyle(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 mb-3">
                    {report.title}
                  </h3>

                  {/* Visual 4-Step Resolution Timeline */}
                  <div className="bg-surface-1 rounded-2xl p-3.5 mb-3 border border-border/50">
                    <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary mb-2">
                      <span className={currentStep >= 0 ? "text-accent" : ""}>1. Submitted</span>
                      <span className={currentStep >= 1 ? "text-accent" : ""}>2. Routed</span>
                      <span className={currentStep >= 2 ? "text-accent" : ""}>3. In Progress</span>
                      <span className={currentStep >= 3 ? "text-success" : ""}>4. Resolved</span>
                    </div>

                    {/* Progress Track */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((step) => {
                        const isDone = currentStep >= step;
                        const isCurrent = currentStep === step;
                        return (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all ${
                              step === 3 && isDone
                                ? "bg-success"
                                : isDone
                                  ? "bg-accent"
                                  : "bg-border"
                            } ${isCurrent && step !== 3 ? "animate-pulse" : ""}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer info: Date & Email indicator */}
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/60">
                    <span>
                      📅 {new Date(report.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                      <span>✉️ Email Alerts Active</span>
                      <span className="text-accent group-hover:translate-x-0.5 transition-transform ml-1 font-bold">
                        View Details →
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
