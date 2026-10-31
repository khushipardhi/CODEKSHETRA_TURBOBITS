"use client";

import React from "react";
import { Badge } from "@/components/ui";
import { DepartmentNotifications } from "./DepartmentNotifications";

interface DepartmentHeaderProps {
  departmentName: string;
  departmentIcon: string;
  criticalCount: number;
}

export function DepartmentHeader({
  departmentName,
  departmentIcon,
  criticalCount,
}: DepartmentHeaderProps) {
  return (
    <header className="bg-white border border-slate-200/90 rounded-2xl px-6 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
          {departmentIcon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {departmentName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-xs text-slate-500 font-medium">
              Operational Command Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {criticalCount > 0 && (
          <span className="font-semibold text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            {criticalCount} Critical
          </span>
        )}
        <DepartmentNotifications />
      </div>
    </header>
  );
}
