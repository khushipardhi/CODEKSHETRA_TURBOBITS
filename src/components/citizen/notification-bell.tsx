/* ════════════════════════════════════════════════════════
   NotificationBell — Citizen notification indicator
   Fetches unread count, shows dropdown panel
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { citizenHeaders } from "@/lib/guest-id";
import {
  requestNotificationPermission,
  showNewNotifications,
  subscribeToPush,
} from "@/lib/browser-notifications";

interface Notification {
  id: string;
  incidentId: string | null;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const priorityDot: Record<string, string> = {
  critical: "bg-critical",
  high: "bg-warning",
  normal: "bg-accent",
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: citizenHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newNotifs = data.notifications || [];
          setNotifications(newNotifs);
          setUnreadCount(data.unreadCount || 0);

          // Show browser notifications for new unread items (with sound)
          showNewNotifications(newNotifs);
        }
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch on mount and poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);

    // Request notification permission + subscribe to push
    requestNotificationPermission().then((perm) => {
      if (perm === "granted") {
        subscribeToPush().catch(() => {});
      }
    });

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: citizenHeaders(),
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* non-fatal */ }
  }

  async function handleNotificationClick(n: Notification) {
    // Mark as read
    if (!n.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: citizenHeaders(),
          body: JSON.stringify({ notificationIds: [n.id] }),
        });
        setNotifications((prev) =>
          prev.map((notif) => notif.id === n.id ? { ...notif, isRead: true } : notif)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch { /* non-fatal */ }
    }

    // Navigate if linked to incident
    if (n.incidentId) {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-critical text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — fixed on mobile, absolute on desktop */}
      {open && (
        <div
          className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-surface-0 border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-accent hover:text-accent-hover font-medium cursor-pointer transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 last:border-0 hover:bg-surface-1 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-accent/3" : ""
                  }`}
                >
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.isRead ? "bg-border" : (priorityDot[n.priority] || priorityDot.normal)
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug truncate ${
                      !n.isRead ? "text-text-primary" : "text-text-secondary"
                    }`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-text-tertiary/60 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
