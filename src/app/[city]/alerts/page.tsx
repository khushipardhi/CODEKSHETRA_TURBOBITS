/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Alert Centre
   Official CAP warnings, forecast advisories, and notification controls.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCityContext } from "@/components/providers/city-provider";
import { CitizenHeader } from "@/components/citizen/citizen-header";
import { AreaProvider, useAreaContext } from "@/components/citizen/area-context";
import { CitizenBottomNav } from "@/components/citizen/citizen-bottom-nav";

interface AlertItem {
  id: string;
  reference: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "ADVISORY";
  headline: string;
  description: string;
  source: string;
  isOfficial: boolean;
  effectiveAt: string;
  expiresAt?: string;
  recommendedActions?: string[];
  area?: string;
}

function AlertCentreContent() {
  const { city, cityConfig } = useCityContext();
  const { selectedArea } = useAreaContext();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "AREA">("ALL");
  const [tab, setTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/hazards/feed?city=${city}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const mapped: AlertItem[] = (json.data.activeAlerts || []).map((a: any) => ({
              id: a.id || a.alert_reference,
              reference: a.alert_reference || "ALT-CAP",
              severity: (a.severity as any) || "HIGH",
              headline: a.headline || a.title,
              description: a.description || "",
              source: `${cityConfig.municipalAbbr} Disaster Management`,
              isOfficial: true,
              effectiveAt: a.effective_at || new Date().toISOString(),
              expiresAt: a.expires_at,
              recommendedActions: a.recommended_actions || [
                "Monitor official civic updates on local radio or city portal.",
                "Avoid unnecessary travel through low-lying intersections.",
              ],
            }));
            setAlerts(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [city, cityConfig]);

  const handleTogglePush = async () => {
    if (!("Notification" in window)) {
      setPushStatus("Push notifications are not supported in this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setPushEnabled(true);
        setPushStatus("✓ Push alerts enabled for severe warnings in " + cityConfig.name);
      } else {
        setPushStatus("Permission denied. You can re-enable notifications in browser site settings.");
      }
    } catch {
      setPushStatus("Unable to request notification permission.");
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "CRITICAL":
        return "bg-rose-500 text-white";
      case "HIGH":
        return "bg-amber-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col pb-24">
      <CitizenHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                Disaster & Hazard Alert Centre
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-tertiary mt-1">
              Official Common Alerting Protocol (CAP) bulletins for {cityConfig.name}
            </p>
          </div>

          <Link
            href={`/${city}/dashboard`}
            className="self-start sm:self-auto text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Push Notification Card */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span>🔔</span>
              <span>Emergency Push Bulletins</span>
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Receive instant alerts for CRITICAL cloudburst, cyclone, or heat emergencies even when closed.
            </p>
            {pushStatus && (
              <p className="text-[11px] font-semibold text-accent mt-1.5">{pushStatus}</p>
            )}
          </div>
          <button
            onClick={handleTogglePush}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              pushEnabled
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-accent text-white hover:bg-accent-hover shadow-2xs"
            }`}
          >
            {pushEnabled ? "✓ Subscribed" : "Enable Alerts"}
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-1 border border-border">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === "ALL"
                  ? "bg-surface-0 text-text-primary shadow-2xs font-bold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              All {cityConfig.name}
            </button>
            <button
              onClick={() => setFilterType("AREA")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === "AREA"
                  ? "bg-surface-0 text-text-primary shadow-2xs font-bold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              📍 Near {selectedArea}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setTab("ACTIVE")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                tab === "ACTIVE"
                  ? "bg-accent/15 text-accent font-bold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              Active ({alerts.length})
            </button>
            <button
              onClick={() => setTab("ARCHIVED")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                tab === "ARCHIVED"
                  ? "bg-accent/15 text-accent font-bold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              Archive (0)
            </button>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-surface-1 rounded-2xl animate-pulse" />
            <div className="h-32 bg-surface-1 rounded-2xl animate-pulse" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl bg-surface-0 border border-border text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 text-2xl mx-auto">
              ✓
            </div>
            <h3 className="text-base font-bold text-text-primary">
              All Clear — No Active Warnings
            </h3>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto leading-relaxed">
              There are currently no active municipal or state disaster warnings published for {cityConfig.name}.
              Environmental signals are operating within baseline thresholds.
            </p>
            <div className="pt-2">
              <Link
                href={`/${city}/dashboard`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-1 hover:bg-surface-2 text-text-primary text-xs font-semibold border border-border transition-colors"
              >
                <span>View Live Dashboard Telemetry</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-5 rounded-3xl bg-surface-0 border border-border shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${severityColor(alt.severity)}`}>
                      {alt.severity}
                    </span>
                    <span className="text-xs font-mono text-text-tertiary">
                      {alt.reference}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    Issued: {new Date(alt.effectiveAt).toLocaleDateString()} · {alt.source}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary">{alt.headline}</h3>
                {alt.description && (
                  <p className="text-xs text-text-secondary leading-relaxed">{alt.description}</p>
                )}

                {alt.recommendedActions && alt.recommendedActions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-surface-1 border border-border/50 text-xs space-y-1.5">
                    <p className="font-bold text-text-primary uppercase tracking-wider text-[10px]">
                      Recommended Actions:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary">
                      {alt.recommendedActions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-text-tertiary">
                    Need Help? Call Helpline: <strong>{cityConfig.hazardCapabilities.emergencyHelpline}</strong>
                  </span>
                  <Link
                    href={`/${city}/sentinel`}
                    className="text-accent hover:underline font-semibold"
                  >
                    Ask Sentinel AI about this alert →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CitizenBottomNav />
    </div>
  );
}

export default function CitizenAlertCentrePage() {
  return (
    <AreaProvider>
      <AlertCentreContent />
    </AreaProvider>
  );
}
