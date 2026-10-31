"use client";

import React from "react";

interface DepartmentStatsProps {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  resolutionRate: number;
}

export function DepartmentStats({
  total,
  active,
  pending,
  resolved,
  resolutionRate,
}: DepartmentStatsProps) {
  const stats = [
    {
      label: "Total Incidents",
      value: total,
      color: "text-slate-900",
      icon: "📊",
    },
    {
      label: "Active / In Progress",
      value: active,
      color: "text-amber-600",
      icon: "⚡",
    },
    {
      label: "Pending / Incoming",
      value: pending,
      color: "text-blue-600",
      icon: "📥",
    },
    {
      label: "Resolved Tickets",
      value: resolved,
      color: "text-emerald-600",
      icon: "✅",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="text-sm opacity-80">{stat.icon}</span>
          </div>
          <div className={`text-2xl font-black tracking-tight ${stat.color} mt-2`}>
            {stat.value}
          </div>
        </div>
      ))}

      {/* Resolution Rate Gauge */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Resolution Rate
          </span>
          <span className="text-xs font-bold text-emerald-600">
            {resolved}/{total}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {resolutionRate}%
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
