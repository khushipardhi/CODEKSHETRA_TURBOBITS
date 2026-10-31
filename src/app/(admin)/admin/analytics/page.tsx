/* ════════════════════════════════════════════════════════
   Admin Analytics — Live Aggregates & Performance Trends
   Directly pulling metrics from TiDB database
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui";
import { ChartIcon } from "@/components/ui/icons";
import { useCityContext } from "@/components/providers/city-provider";

interface Metric {
  label: string;
  value: string;
  sub: string;
  change: string;
  type: string;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  pct: number;
}

interface TrendData {
  period: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const { city, cityConfig } = useCityContext();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [city]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?city=${city}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics || []);
          setCategories(data.categoryBreakdown || []);
          setTrends(data.trendData || []);
        }
      }
    } catch (err) {
      console.error("[AdminAnalytics] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const maxTrend = Math.max(1, ...trends.map((t) => t.count));

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          City Civic Analytics & Insights
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Real-time incident volumes, SLA resolution efficiency, and department breakdown from TiDB
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-text-tertiary">Computing live civic metrics...</p>
        </div>
      ) : (
        <>
          {/* Performance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-surface-0 border border-border rounded-3xl p-5 shadow-sm hover:border-accent/30 transition-all"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {m.label}
                </p>
                <p className="text-2xl font-bold tracking-tight text-text-primary mt-2">
                  {m.value}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs">
                  <span className="text-text-secondary">{m.sub}</span>
                  <span className="font-semibold text-accent">{m.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-surface-0 border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>📊</span> Incidents by Department Category
              </h2>

              <div className="space-y-3.5">
                {categories.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-text-primary">{cat.category}</span>
                      <span className="text-text-secondary font-mono">
                        {cat.count} ({cat.pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-surface-1 rounded-full overflow-hidden border border-border/40">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, cat.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend Bars */}
            <div className="bg-surface-0 border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
                  <span>📈</span> Monthly Reporting Velocity
                </h2>
                <p className="text-xs text-text-tertiary mb-6">
                  Volume of civic reports logged across Nagpur municipal zones
                </p>
              </div>

              <div className="flex items-end justify-between h-48 gap-3 pt-6 border-b border-border pb-2">
                {trends.map((d) => {
                  const heightPct = Math.round((d.count / maxTrend) * 100);
                  return (
                    <div key={d.period} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[11px] font-bold text-accent">{d.count}</span>
                      <div
                        className="w-full bg-accent/20 hover:bg-accent/40 rounded-t-xl transition-all relative overflow-hidden flex items-end justify-center"
                        style={{ height: `${Math.max(12, heightPct)}%` }}
                      >
                        <div className="w-full bg-accent rounded-t-xl h-2/3 opacity-80" />
                      </div>
                      <span className="text-[10px] font-semibold text-text-tertiary truncate w-full text-center">
                        {d.period}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
                <span>Data source: TiDB Cluster</span>
                <span className="text-success font-bold">✓ Live Sync</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
