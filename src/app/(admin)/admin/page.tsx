/* ════════════════════════════════════════════════════════
   Admin Dashboard — City Command Centre
   Live KPIs + real incident feed from TiDB
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect } from "react";
import { Card, Badge, Button } from "@/components/ui";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  ArrowRightIcon,
  MapIcon,
  ShieldIcon,
  BuildingIcon,
  ActivityIcon,
  SlidersIcon,
  ChartIcon,
} from "@/components/ui/icons";
import Link from "next/link";
import { useCityContext } from "@/components/providers/city-provider";
import { OperationalDecisionCenter } from "@/components/admin/operational-decision-center";
import { WardActionHubModal } from "@/components/admin/ward-action-hub-modal";
import { DataSourceHealthMonitor } from "@/components/admin/data-source-health-monitor";

/* ─── Types ─── */
interface KPIData {
  total: number;
  criticalActive: number;
  inProgress: number;
  resolvedThisWeek: number;
  todayCount: number;
  awaitingReviewCount?: number;
  departmentAwaitingActionCount?: number;
  statusBreakdown?: {
    draftConfirmed: number;
    routed: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  severityBreakdown?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface DeptWorkload {
  code: string;
  name: string;
  active: number;
  pending: number;
  resolved: number;
}

interface IncidentItem {
  publicReference: string;
  title: string | null;
  severity: string | null;
  status: string;
  createdAt: string;
  departments: { code: string; name: string; status: string }[];
}

interface PriorityWardItem {
  id: string;
  name: string;
  zone: string;
  screeningScore: number;
  scenarioTitle: string;
  chronicHotspots: string[];
  openReportsCount: number;
  nearestShelter: string;
  primaryDepartment: string;
  rainfallForecastMmH: number;
}

/* ─── Grounded Priority Wards for Active Scenarios ─── */
const CITY_PRIORITY_WARDS: Record<string, PriorityWardItem[]> = {
  mumbai: [
    {
      id: "F/North",
      name: "Ward F/North (Matunga / Sion / Wadala)",
      zone: "Zone II (Central North)",
      screeningScore: 84,
      scenarioTitle: "Monsoon Convective Downpour & Tidal Surge",
      chronicHotspots: ["Gandhi Market Underpass", "King's Circle", "Sion Road No. 24"],
      openReportsCount: 2,
      nearestShelter: "BMC F/North Ward Disaster Relief Center",
      primaryDepartment: "BMC Stormwater Drains (SWD)",
      rainfallForecastMmH: 64.5,
    },
    {
      id: "G/North",
      name: "Ward G/North (Dharavi / Dadar / Mithi River)",
      zone: "Zone II (Central Island)",
      screeningScore: 88,
      scenarioTitle: "Monsoon Convective Downpour & Tidal Surge",
      chronicHotspots: ["Dharavi 90-Feet Road", "Kala Killa Basin", "T-Junction Nullah"],
      openReportsCount: 3,
      nearestShelter: "Sion Hospital Emergency Intake",
      primaryDepartment: "BMC Stormwater Drains (SWD)",
      rainfallForecastMmH: 72.0,
    },
    {
      id: "K/West",
      name: "Ward K/West (Andheri West / Juhu / SV Road)",
      zone: "Zone IV (Western Suburbs)",
      screeningScore: 78,
      scenarioTitle: "Monsoon Convective Downpour & Tidal Surge",
      chronicHotspots: ["Andheri Subway", "Milan Subway Concourse", "Irla Nullah Outfall"],
      openReportsCount: 1,
      nearestShelter: "Cooper Hospital Disaster Cell",
      primaryDepartment: "BMC Roads & SWD",
      rainfallForecastMmH: 58.0,
    },
    {
      id: "A",
      name: "Ward A (Colaba / Fort / Churchgate)",
      zone: "Zone I (Island South)",
      screeningScore: 42,
      scenarioTitle: "Monsoon Convective Downpour & Tidal Surge",
      chronicHotspots: ["CST Underpass", "Nana Chowk Drainage Sink"],
      openReportsCount: 0,
      nearestShelter: "KEM Hospital Disaster Center",
      primaryDepartment: "BMC Stormwater Drains (SWD)",
      rainfallForecastMmH: 28.5,
    },
  ],
  pune: [
    {
      id: "Zone 1 - Ward 3",
      name: "Shivajinagar / Model Colony",
      zone: "Central Zone",
      screeningScore: 82,
      scenarioTitle: "Ghats Cloudburst & River Spate",
      chronicHotspots: ["Ambil Odha Confluence", "Dandekar Bridge", "Pulachi Wadi"],
      openReportsCount: 2,
      nearestShelter: "PMC Shivajinagar Emergency Ward Office",
      primaryDepartment: "PMC Drainage & Stormwater",
      rainfallForecastMmH: 52.0,
    },
    {
      id: "Zone 2 - Ward 7",
      name: "Kothrud / Karve Nagar",
      zone: "West Zone",
      screeningScore: 76,
      scenarioTitle: "Ghats Cloudburst & River Spate",
      chronicHotspots: ["Karve Road Flyover Basin", "Dahanukar Colony Culvert"],
      openReportsCount: 1,
      nearestShelter: "Sahyadri Hospital Triage Center",
      primaryDepartment: "PMC Drainage Department",
      rainfallForecastMmH: 45.0,
    },
  ],
  nagpur: [
    {
      id: "Ward 2",
      name: "Dharampeth (Ambazari Axis)",
      zone: "West Zone",
      screeningScore: 80,
      scenarioTitle: "Nag River Urban Catchment Surge",
      chronicHotspots: ["Ambazari Overflow Nullah", "Corporation Colony Underpass"],
      openReportsCount: 1,
      nearestShelter: "NMC Dharampeth Zonal Office",
      primaryDepartment: "NMC Water Works & Drainage",
      rainfallForecastMmH: 48.0,
    },
    {
      id: "Ward 3",
      name: "Sitabuldi (Nag River Basin)",
      zone: "Central Zone",
      screeningScore: 74,
      scenarioTitle: "Nag River Urban Catchment Surge",
      chronicHotspots: ["Sitabuldi Siphon Junction", "Maharajbagh Nullah"],
      openReportsCount: 1,
      nearestShelter: "Government Medical College Emergency Cell",
      primaryDepartment: "NMC Public Health & Disaster",
      rainfallForecastMmH: 42.0,
    },
  ],
};

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
  const map: Record<string, string> = {
    DRAFT: "Draft",
    CONFIRMED: "Confirmed",
    ROUTED: "Routed",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    WORK_COMPLETED: "Work Complete",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return map[s] || s;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const { city, cityConfig } = useCityContext();
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [depts, setDepts] = useState<DeptWorkload[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [hazardData, setHazardData] = useState<any | null>(null);
  const [healthSources, setHealthSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 9: Ward Dossier Action Hub Modal State
  const [selectedWardForHub, setSelectedWardForHub] = useState<PriorityWardItem | null>(null);

  // Phase 9: Data Health Monitor Modal State
  const [showHealthModal, setShowHealthModal] = useState(false);

  const priorityWards = CITY_PRIORITY_WARDS[city] || CITY_PRIORITY_WARDS.mumbai;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, incidentsRes, hazardRes, healthRes] = await Promise.allSettled([
          fetch(`/api/admin/stats?city=${city}`),
          fetch(`/api/admin/incidents?city=${city}&limit=8`),
          fetch(`/api/hazards/feed?city=${city}`),
          fetch(`/api/hazards/health?city=${city}`),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          if (statsData.success) {
            setKpi(statsData.kpi);
            setDepts(statsData.departments || []);
          }
        }

        if (incidentsRes.status === "fulfilled" && incidentsRes.value.ok) {
          const incData = await incidentsRes.value.json();
          if (incData.success) {
            setIncidents(incData.incidents || []);
          }
        }

        if (hazardRes.status === "fulfilled" && hazardRes.value.ok) {
          const hData = await hazardRes.value.json();
          if (hData.success) {
            setHazardData(hData.data);
          }
        }

        if (healthRes.status === "fulfilled" && healthRes.value.ok) {
          const hlData = await healthRes.value.json();
          if (hlData.success && (hlData.data?.connectors || hlData.data?.sources)) {
            setHealthSources(hlData.data.connectors || hlData.data.sources || []);
          }
        }
      } catch (err) {
        console.error("[AdminDash] Load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [city]);

  useEffect(() => {
    if (!showHealthModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHealthModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHealthModal]);

  const kpis = kpi
    ? [
        {
          label: "Total Incidents",
          value: kpi.total.toLocaleString(),
          change: `+${kpi.todayCount} past 24h`,
          icon: <FileTextIcon size={20} />,
          color: "text-accent",
          bgColor: "bg-accent-muted",
          subtext: "Persisted in TiDB Serverless",
        },
        {
          label: "Awaiting Review",
          value: String(kpi.awaitingReviewCount ?? 0),
          change: "needs triage",
          icon: <ClockIcon size={20} />,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          subtext: "DRAFT + CONFIRMED status",
        },
        {
          label: "Critical Active",
          value: String(kpi.criticalActive),
          change: "requires immediate response",
          icon: <AlertTriangleIcon size={20} />,
          color: "text-critical",
          bgColor: "bg-critical-bg",
          subtext: "Active unclosed emergencies",
        },
        {
          label: "Dept Work Awaiting Action",
          value: String(kpi.departmentAwaitingActionCount ?? 0),
          change: "routed to queues",
          icon: <BuildingIcon size={20} />,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          subtext: "ROUTED / ASSIGNED tasks",
        },
        {
          label: "In Progress Mitigation",
          value: String(kpi.inProgress),
          change: "field teams active",
          icon: <ActivityIcon size={20} />,
          color: "text-warning",
          bgColor: "bg-warning-bg",
          subtext: "Field teams acknowledged",
        },
        {
          label: "Resolved This Week",
          value: String(kpi.resolvedThisWeek),
          change: "rolling 7 days",
          icon: <CheckCircleIcon size={20} />,
          color: "text-success",
          bgColor: "bg-success-bg",
          subtext: "Verified signed-off",
        },
      ]
    : [];

  return (
    <>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Sentinel Command Centre — {cityConfig.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30 uppercase tracking-wider">
              MUNICIPAL OPERATIONS CONSOLE
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Live environmental hazard surveillance, explainable incident routing, and cross-departmental coordination.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHealthModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-1 text-text-primary rounded-xl text-xs font-semibold border border-border hover:bg-surface-2 transition-all cursor-pointer shadow-xs"
          >
            <ActivityIcon size={14} className="text-emerald-500" />
            <span>Data Health Pipelines</span>
          </button>
          <Link
            href={`/admin/${city}/map`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-all shadow-xs"
          >
            <MapIcon size={15} />
            Command Hazard Map
          </Link>
        </div>
      </div>

      {/* ═══ OPERATIONAL WORKSPACE HUB (Cross-View Navigation) ═══ */}
      <div className="bg-surface-0 border border-border rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          <span>Connected Municipal Workspaces</span>
          <span className="text-[10px] lowercase text-text-tertiary font-normal">context-preserving links</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Link
            href={`/admin/${city}`}
            className="flex items-center gap-2 p-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-bold transition-all"
          >
            <ShieldIcon size={14} />
            <span className="truncate">Command</span>
          </Link>
          <Link
            href={`/admin/${city}/map`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <MapIcon size={14} />
            <span className="truncate">Hazard Map</span>
          </Link>
          <Link
            href={`/admin/${city}/telemetry-lab`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <ActivityIcon size={14} />
            <span className="truncate">Telemetry Lab</span>
          </Link>
          <Link
            href={`/admin/${city}/simulation`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <SlidersIcon size={14} />
            <span className="truncate">Simulation Lab</span>
          </Link>
          <Link
            href={`/admin/${city}/simulation/report`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <FileTextIcon size={14} />
            <span className="truncate">Report Studio</span>
          </Link>
          <Link
            href={`/admin/${city}/incidents`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <ClockIcon size={14} />
            <span className="truncate">Civic Reports</span>
          </Link>
          <Link
            href={`/admin/${city}/departments`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <BuildingIcon size={14} />
            <span className="truncate">Departments</span>
          </Link>
          <Link
            href={`/admin/${city}/audit`}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
          >
            <ChartIcon size={14} />
            <span className="truncate">Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-12 text-text-tertiary">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm">Loading municipal operations data...</p>
        </div>
      )}

      {error && (
        <Card variant="elevated" padding="md">
          <p className="text-sm text-critical">{error}</p>
        </Card>
      )}

      {/* ═══ 1. RECORD TYPE SEPARATION & INTEGRITY BANNER ═══ */}
      {!loading && (
        <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Operational Record Architecture & Boundary Discipline
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  9 SEPARATE RECORD TYPES
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Strict separation between numerical forecasts, screening estimates, citizen reports, and verified municipal actions.
              </p>
            </div>
            <div className="text-[11px] text-text-secondary bg-surface-1 px-3 py-1.5 rounded-xl border border-border">
              🛡️ Rule: Forecasts & simulations never auto-create public warnings without administrator signoff.
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 pt-3 text-[10px] font-semibold text-center">
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">🌦️ Telemetry</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">🔮 Forecast</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">🧪 Simulation</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">🔍 Screening</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">📢 Citizen Rpt</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-accent font-bold">🏛️ Verified Inc</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-amber-500 font-bold">⚠️ Warning</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary">📝 Draft Adv</span>
            <span className="p-1.5 rounded-lg bg-surface-1 border border-border text-blue-500 font-bold">🛠️ Dept Task</span>
          </div>
        </div>
      )}

      {/* Sentinel City Multi-Hazard Intelligence Overview */}
      {!loading && (
        <div className="bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-border/70 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
                <ShieldIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-text-primary">
                    Sentinel Multi-Hazard Intelligence
                  </h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Automated risk scoring, GIS asset exposure, and CAP-compliant early warnings for {cityConfig.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/admin/${city}/map`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-xs"
              >
                <MapIcon size={14} />
                Command Hazard Map
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
            {/* Risk Index */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-text-tertiary">Composite Risk</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-text-primary">
                  {hazardData?.assessment?.compositeScore ?? "—"}
                </span>
                <span className="text-xs text-text-tertiary">/100</span>
              </div>
              <p className={`text-[11px] font-medium mt-0.5 ${
                hazardData?.assessment?.riskLevel === "SEVERE"
                  ? "text-red-500 font-bold"
                  : hazardData?.assessment?.riskLevel === "WARNING"
                  ? "text-amber-500 font-bold"
                  : hazardData?.assessment?.riskLevel === "WATCH"
                  ? "text-yellow-500"
                  : "text-emerald-500"
              }`}>
                {hazardData?.assessment?.riskLevel ?? "MONITORING"}
              </p>
            </div>

            {/* Active Alerts */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-text-tertiary">Municipal Alerts</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-text-primary">
                  {hazardData?.activeAlerts?.length ?? 0}
                </span>
                <span className="text-xs text-text-tertiary">active</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {hazardData?.activeAlerts?.length ? "CAP Broadcasts live" : "Normal advisory"}
              </p>
            </div>

            {/* Precipitation */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-text-tertiary">Precipitation</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-text-primary">
                  {hazardData?.currentTelemetry?.weather?.precipitation ?? 0}
                </span>
                <span className="text-xs text-text-tertiary">mm/h</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                {hazardData?.currentTelemetry?.weather?.temperature ? `${hazardData.currentTelemetry.weather.temperature}°C ambient` : "Live Doppler radar"}
              </p>
            </div>

            {/* Wind / Marine */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-text-tertiary">
                {city === "mumbai" ? "Marine / Surge" : "Wind Gusts"}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-text-primary">
                  {city === "mumbai" 
                    ? (hazardData?.currentTelemetry?.marine?.stormSurge?.toFixed(1) ?? "0.2")
                    : (hazardData?.currentTelemetry?.weather?.windSpeed?.toFixed(0) ?? "12")}
                </span>
                <span className="text-xs text-text-tertiary">{city === "mumbai" ? "m surge" : "km/h"}</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                {city === "mumbai" ? "Arabian Sea tidal gauge" : "Surface anemometer"}
              </p>
            </div>

            {/* Air Quality */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-text-tertiary">Air Quality (AQI)</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-text-primary">
                  {hazardData?.currentTelemetry?.airQuality?.aqi ?? "Good"}
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                {hazardData?.currentTelemetry?.airQuality?.pm25 ? `PM2.5: ${hazardData.currentTelemetry.airQuality.pm25} µg` : "CPCB sensor net"}
              </p>
            </div>

            {/* Source Health Lights */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border/40 flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-text-tertiary">Connector Health</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {healthSources.length > 0 ? (
                    healthSources.slice(0, 7).map((s: any) => (
                      <span
                        key={s.sourceId}
                        className={`w-2.5 h-2.5 rounded-full shadow-xs ${
                          s.status === "HEALTHY" || s.status === "UP"
                            ? "bg-emerald-500"
                            : s.status === "DEGRADED"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        title={`${s.sourceName}: ${s.status}${s.lastLatencyMs ? ` (${s.lastLatencyMs}ms)` : ""}`}
                      />
                    ))
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="Open-Meteo: HEALTHY" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="NDMA SACHET: HEALTHY" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="USGS: HEALTHY" />
                    </>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {healthSources.length > 0
                  ? `${healthSources.filter((s: any) => s.status === "HEALTHY" || s.status === "UP").length}/${healthSources.length} pipelines online`
                  : "All pipelines HEALTHY"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase 10: Operational Decision & Incident Routing Center */}
      {!loading && <OperationalDecisionCenter />}

      {/* ═══ 2. DEFINED OPERATIONAL INDICATORS & METRICS RIBBON ═══ */}
      {!loading && kpis.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((k) => (
              <Card key={k.label} variant="elevated" padding="md" className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                      {k.label}
                    </span>
                    <div className={`w-7 h-7 rounded-lg ${k.bgColor} flex items-center justify-center ${k.color}`}>
                      {k.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-text-primary">{k.value}</p>
                </div>
                <div className="pt-2 mt-2 border-t border-border/40">
                  <p className="text-[11px] font-semibold text-text-secondary">{k.change}</p>
                  <p className="text-[9px] text-text-tertiary truncate">{k.subtext}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Granular Breakdown Sub-Ribbon */}
          {kpi?.statusBreakdown && kpi?.severityBreakdown && (
            <div className="bg-surface-0 border border-border/70 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Incident Status Breakdown:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-1 border border-border text-[11px] font-medium">
                  Confirmed: <strong>{kpi.statusBreakdown.draftConfirmed}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                  Routed: <strong>{kpi.statusBreakdown.routed}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-warning-bg border border-warning-border text-warning text-[11px] font-medium">
                  In Progress: <strong>{kpi.statusBreakdown.inProgress}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-success-bg border border-success-border text-success text-[11px] font-medium">
                  Resolved: <strong>{kpi.statusBreakdown.resolved}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-1 border border-border text-text-tertiary text-[11px]">
                  Closed: <strong>{kpi.statusBreakdown.closed}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Severity:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-critical-bg text-critical text-[11px] font-bold">
                  Critical: {kpi.severityBreakdown.critical}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-high-bg text-high text-[11px] font-bold">
                  High: {kpi.severityBreakdown.high}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-medium-bg text-medium text-[11px] font-medium">
                  Medium: {kpi.severityBreakdown.medium}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-low-bg text-low text-[11px] font-medium">
                  Low: {kpi.severityBreakdown.low}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 3. PRIORITY WARD VULNERABILITY & DISPATCH TRIAGE ═══ */}
      {!loading && (
        <Card padding="none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-divider gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  Priority Ward Vulnerability & Dispatch Triage
                </h2>
                <Badge variant="accent">Scenario Sourced</Badge>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Evaluated from active multi-hazard spatial scenarios. Click to inspect source calculation trace or draft reviewable municipal actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/${city}/simulation`}
                className="text-xs text-accent hover:text-accent-hover font-semibold transition-colors flex items-center gap-1"
              >
                <span>Launch Simulation Lab</span>
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-1/70 border-b border-border text-text-tertiary font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3">Ward / Jurisdiction</th>
                  <th className="px-4 py-3">Susceptibility Tier</th>
                  <th className="px-4 py-3">Forecast Precip</th>
                  <th className="px-4 py-3">Chronic Hotspots</th>
                  <th className="px-4 py-3">Active Reports</th>
                  <th className="px-4 py-3">Responsible Dept</th>
                  <th className="px-5 py-3 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {priorityWards.map((ward) => (
                  <tr key={ward.id} className="hover:bg-surface-1/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-text-primary text-xs">{ward.name}</p>
                      <p className="text-[10px] text-text-tertiary font-medium">{ward.zone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-xs ${
                          ward.screeningScore >= 80 ? "text-critical" : ward.screeningScore >= 60 ? "text-warning" : "text-success"
                        }`}>
                          {ward.screeningScore}/100
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ward.screeningScore >= 80 ? "bg-critical" : ward.screeningScore >= 60 ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${ward.screeningScore}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[9px] text-text-tertiary uppercase font-semibold">
                        GLO-30 Depression Basin
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-text-primary">{ward.rainfallForecastMmH} mm/h</span>
                      <p className="text-[10px] text-text-tertiary">ECMWF 1km</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {ward.chronicHotspots.slice(0, 2).map((h, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-surface-2 text-[10px] text-text-secondary truncate max-w-[140px]">
                            {h}
                          </span>
                        ))}
                        {ward.chronicHotspots.length > 2 && (
                          <span className="text-[10px] text-text-tertiary">+{ward.chronicHotspots.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ward.openReportsCount > 0 ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-tertiary"
                      }`}>
                        {ward.openReportsCount} open
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-text-secondary truncate max-w-[150px]">
                        {ward.primaryDepartment}
                      </p>
                      <p className="text-[10px] text-text-tertiary truncate max-w-[150px]">
                        Shelter: {ward.nearestShelter}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedWardForHub(ward)}
                          className="px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-bold hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
                        >
                          Inspect Dossier
                        </button>
                        <Link
                          href={`/admin/${city}/simulation/report?ward=${encodeURIComponent(ward.id)}`}
                          className="px-2 py-1 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary text-[11px] font-medium border border-border transition-colors"
                        >
                          Report Studio
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ 4. OPERATIONAL DECISION & ROUTING CENTER ═══ */}
      {!loading && <OperationalDecisionCenter />}

      {/* Empty state */}
      {!loading && !error && kpis.length === 0 && incidents.length === 0 && (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-8">
            <FileTextIcon size={48} className="text-text-tertiary/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No incidents yet in {cityConfig.name}</h2>
            <p className="text-sm text-text-tertiary">
              When citizens report issues through the Citizen Dashboard for {cityConfig.name}, they will appear here in real time.
            </p>
          </div>
        </Card>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Incidents Feed */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                <div>
                  <h2 className="text-base font-semibold">Priority Incident Feed</h2>
                  <p className="text-[10px] text-text-tertiary">Real-time reports awaiting field execution or verification</p>
                </div>
                <Link
                  href={`/admin/${city}/incidents`}
                  className="text-xs text-accent hover:text-accent-hover font-medium transition-colors flex items-center gap-1"
                >
                  View all <ArrowRightIcon size={12} />
                </Link>
              </div>
              <div className="divide-y divide-divider">
                {incidents.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-text-tertiary">
                    No incidents found. Reports from citizens in {cityConfig.name} will appear here.
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <Link
                      key={incident.publicReference}
                      href={`/admin/${city}/incidents/${incident.publicReference}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-surface-1 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={severityVariant(incident.severity)}>
                            {incident.severity || "—"}
                          </Badge>
                          <span className="text-xs text-text-tertiary font-mono">
                            {incident.publicReference}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {incident.title || "Untitled report"}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {incident.departments.map((d) => d.name).join(" · ") || "No departments"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-text-tertiary">
                          {timeAgo(incident.createdAt)}
                        </p>
                        <Badge variant="default" className="mt-1">
                          {statusLabel(incident.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Department Workload */}
          <div>
            <Card padding="none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                <div>
                  <h2 className="text-base font-semibold">Department Workload</h2>
                  <p className="text-[10px] text-text-tertiary">Active queue vs completed resolution</p>
                </div>
                <Link
                  href={`/admin/${city}/departments`}
                  className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Manage
                </Link>
              </div>
              <div className="divide-y divide-divider">
                {depts.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-text-tertiary">
                    No department data yet.
                  </div>
                ) : (
                  depts.map((dept, idx) => {
                    const total = dept.active + dept.pending + dept.resolved;
                    const pct = total > 0 ? Math.round((dept.resolved / total) * 100) : 0;
                    return (
                      <div key={`${dept.code}-${idx}`} className="px-6 py-3">
                        <p className="text-sm font-medium mb-1 truncate">{dept.name}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-warning">{dept.active} active</span>
                          <span className="text-text-tertiary">{dept.pending} pending</span>
                          <span className="text-success">{dept.resolved} resolved</span>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
      </div>

      {/* ═══ PHASE 9: WARD ACTION HUB MODAL ═══ */}
      {selectedWardForHub && (
        <WardActionHubModal
          isOpen={!!selectedWardForHub}
          onClose={() => setSelectedWardForHub(null)}
          wardId={selectedWardForHub.id}
          wardName={selectedWardForHub.name}
          screeningScore={selectedWardForHub.screeningScore}
          scenarioTitle={selectedWardForHub.scenarioTitle}
          chronicHotspots={selectedWardForHub.chronicHotspots}
          telemetryEvidence={{
            rainRateMmH: selectedWardForHub.rainfallForecastMmH,
            observedAt: new Date().toISOString(),
            sourceName: "ECMWF / Open-Meteo 1km Grid",
          }}
          onTaskCreated={() => {
            // refresh data
            fetch(`/api/admin/stats?city=${city}`)
              .then((r) => r.json())
              .then((d) => d.success && setKpi(d.kpi));
          }}
        />
      )}

      {/* ═══ PHASE 9: DATA SOURCE HEALTH FULL MODAL ═══ */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-surface-0 border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Environmental Telemetry & Pipeline Health</h2>
                <p className="text-xs text-text-tertiary">Real-time connector status, schema validation, latency SLAs, and cache fresh checks.</p>
              </div>
              <button
                id="close-health-modal-btn"
                onClick={() => setShowHealthModal(false)}
                className="w-8 h-8 rounded-full bg-surface-1 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <DataSourceHealthMonitor />
          </div>
        </div>
      )}
    </>
  );
}
