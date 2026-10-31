/* ════════════════════════════════════════════════════════
   Worker Notifications / Alerts Page — /worker/notifications
   Live urgent broadcasts, task dispatches, and SLA alerts
   ════════════════════════════════════════════════════════ */

"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { BellIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon } from "@/components/ui/icons";
import Link from "next/link";

interface WorkerAlert {
  id: string;
  type: "DISPATCH" | "URGENT" | "SLA_WARNING" | "SYSTEM";
  title: string;
  message: string;
  taskRef?: string;
  time: string;
  isRead: boolean;
}

const INITIAL_ALERTS: WorkerAlert[] = [
  {
    id: "alt-1",
    type: "URGENT",
    title: "Urgent Pothole Repair Dispatched",
    message: "Two-wheeler hazard reported on Wardha Road near Manish Nagar T-point. Priority score: 88. Dispatch squad immediately.",
    taskRef: "NC-2026-001246",
    time: "15 min ago",
    isRead: false,
  },
  {
    id: "alt-2",
    type: "DISPATCH",
    title: "New Task Assigned to Squad",
    message: "Concrete road divider displaced near Law College Square, Dharampeth. Vehicle assistance required.",
    taskRef: "NC-2026-001289",
    time: "1 hour ago",
    isRead: false,
  },
  {
    id: "alt-3",
    type: "SLA_WARNING",
    title: "SLA Reminder: 4 Hours Remaining",
    message: "Debris clearance on Amravati Road must be addressed within SLA standard.",
    time: "2 hours ago",
    isRead: true,
  },
  {
    id: "alt-4",
    type: "SYSTEM",
    title: "Shift Check-in Confirmed",
    message: "You are checked in as on-duty for Morning Shift (07:00 - 15:00) in Dharampeth Zone.",
    time: "4 hours ago",
    isRead: true,
  },
];

export default function WorkerNotificationsPage() {
  const [alerts, setAlerts] = useState<WorkerAlert[]>(INITIAL_ALERTS);

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  return (
    <div className="space-y-4 fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Alerts & Dispatches</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            Real-time notifications from NMC dispatchers
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-xs font-semibold text-accent hover:underline cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const isUrgent = alert.type === "URGENT";
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                alert.isRead
                  ? "bg-surface-0 border-border"
                  : isUrgent
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs"
                    : "bg-surface-0 border-accent/30 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-surface-1 text-lg flex-shrink-0">
                  {alert.type === "URGENT" && "🚨"}
                  {alert.type === "DISPATCH" && "📋"}
                  {alert.type === "SLA_WARNING" && "⚠️"}
                  {alert.type === "SYSTEM" && "ℹ️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {alert.title}
                    </h3>
                    <span className="text-[11px] text-text-tertiary flex-shrink-0">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {alert.message}
                  </p>
                  {alert.taskRef && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        href="/worker"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                      >
                        View Task #{alert.taskRef} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
