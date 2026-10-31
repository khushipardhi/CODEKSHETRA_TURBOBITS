"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "warning" | "critical" | "success";
}

export function DepartmentNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Critical Incident",
      message: "Fire incident received in your jurisdiction. (Wardha Road)",
      timestamp: new Date().toISOString(),
      read: false,
      type: "critical"
    },
    {
      id: "2",
      title: "Task Accepted",
      message: "Team Alpha has accepted task for incident NAG-2026-X1.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      type: "success"
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch(type) {
      case "critical": return "🚨";
      case "warning": return "⚠️";
      case "success": return "✅";
      default: return "ℹ️";
    }
  };

  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-md hover:bg-surface-2 text-text-secondary transition-colors" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-critical border-2 border-surface-1"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-surface-1 border border-border rounded-xl shadow-xl z-50 overflow-hidden slide-up">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && <Badge variant="accent">{unreadCount} New</Badge>}
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-text-tertiary text-sm">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 hover:bg-surface-2 transition-colors cursor-pointer ${!n.read ? 'bg-accent/5' : ''}`}>
                      <div className="flex gap-3">
                        <div className="text-xl">{getIcon(n.type)}</div>
                        <div>
                          <h4 className={`text-sm ${!n.read ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
                            {n.title}
                          </h4>
                          <p className="text-xs text-text-secondary mt-1">{n.message}</p>
                          <p className="text-[10px] text-text-tertiary mt-2">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border text-center bg-surface-2">
              <button className="text-xs text-accent hover:underline font-medium">Mark all as read</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
