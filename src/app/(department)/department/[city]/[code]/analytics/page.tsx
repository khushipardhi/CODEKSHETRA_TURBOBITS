/* ════════════════════════════════════════════════════════
   Department Analytics & SLA — /department/[code]/analytics
   Real metrics from TiDB via /api/department/[code]/analytics
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, use } from "react";
import { DepartmentHeader } from "@/components/department/DepartmentHeader";
import { DepartmentSubNav } from "@/components/department/DepartmentSubNav";
import { DEPARTMENT_REGISTRY } from "@/lib/department-registry";
import { useCityContext } from "@/components/providers/city-provider";

interface AnalyticsData {
  avgResponseHours: number;
  slaCompliancePercent: number;
  resolutionRate: number;
  totalIncidents: number;
  resolvedCount: number;
  pendingCount: number;
  activeCount: number;
  criticalCount: number;
  weeklyVolume: { week: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { city, cityConfig } = useCityContext();
  const dept = DEPARTMENT_REGISTRY[code] || { name: code, icon: "📋" };

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/department/${code}/analytics?city=${city}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) setData(d.analytics);
        }
      } catch (err) {
        console.error("[Analytics] Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code, city]);

  const maxVolume = data
    ? Math.max(...data.weeklyVolume.map((w) => w.count), 1)
    : 1;

  const severityColors: Record<string, string> = {
    CRITICAL: "bg-rose-500",
    HIGH: "bg-amber-500",
    MEDIUM: "bg-blue-500",
    LOW: "bg-emerald-500",
    UNKNOWN: "bg-slate-400",
  };

  return (
    <div className="space-y-6 fade-in">
      <DepartmentHeader
        departmentName={`${dept.name} (${cityConfig.name})`}
        departmentIcon={dept.icon}
        criticalCount={data?.criticalCount || 0}
      />

      <DepartmentSubNav departmentCode={code} city={city} />

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading analytics...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Avg Response Time",
                value: `${data.avgResponseHours}h`,
                icon: "⏱️",
                color: "text-blue-600",
              },
              {
                label: "SLA Compliance",
                value: `${data.slaCompliancePercent}%`,
                icon: "📊",
                color:
                  data.slaCompliancePercent >= 80
                    ? "text-emerald-600"
                    : "text-amber-600",
              },
              {
                label: "Resolution Rate",
                value: `${data.resolutionRate}%`,
                icon: "✅",
                color:
                  data.resolutionRate >= 70
                    ? "text-emerald-600"
                    : "text-amber-600",
              },
              {
                label: "Total Incidents",
                value: data.totalIncidents.toString(),
                icon: "📋",
                color: "text-slate-900",
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {kpi.label}
                  </span>
                  <span className="text-sm">{kpi.icon}</span>
                </div>
                <div
                  className={`text-2xl font-black tracking-tight mt-2 ${kpi.color}`}
                >
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Volume Histogram */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                📈 Weekly Incident Volume
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Last {data.weeklyVolume.length} weeks
              </span>
            </div>
            <div className="flex items-end gap-2 h-40">
              {data.weeklyVolume.map((week, i) => {
                const height = Math.max(
                  (week.count / maxVolume) * 100,
                  4
                );
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-bold text-slate-700">
                      {week.count}
                    </span>
                    <div
                      className="w-full bg-accent/80 rounded-t-md transition-all duration-300 hover:bg-accent min-w-[16px]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-slate-400 font-medium truncate max-w-full">
                      {week.week}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              🎯 Severity Distribution
            </h3>
            <div className="space-y-3">
              {data.severityBreakdown.map((s, i) => {
                const totalForBar = data.totalIncidents || 1;
                const pct = Math.round((s.count / totalForBar) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {s.severity}
                      </span>
                      <span className="font-mono text-slate-500">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          severityColors[s.severity] || "bg-slate-400"
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Resolved", value: data.resolvedCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              { label: "Active", value: data.activeCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { label: "Pending", value: data.pendingCount, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              { label: "Critical", value: data.criticalCount, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl ${stat.bg} border ${stat.border}`}
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className={`text-xl font-black tracking-tight ${stat.color} mt-1 block`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-4xl block">📊</span>
          <h3 className="text-base font-bold text-slate-900">
            No Analytics Data
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Analytics will appear once incidents are processed by this department.
          </p>
        </div>
      )}
    </div>
  );
}
