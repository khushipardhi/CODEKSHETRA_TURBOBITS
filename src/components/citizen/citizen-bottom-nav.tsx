/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Mobile Bottom Navigation
   High-contrast, 48px touch targets, frosted glassmorphism.
   Quick links: Home · My Area · Sentinel AI · Alerts · Reports
   ════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCityContext } from "@/components/providers/city-provider";

interface CitizenBottomNavProps {
  onScrollToArea?: () => void;
  onOpenReport?: () => void;
}

export function CitizenBottomNav({ onScrollToArea, onOpenReport }: CitizenBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { city } = useCityContext();

  const isHome = pathname === `/${city}/dashboard` || pathname === `/${city}` || pathname === "/dashboard";
  const isMyArea = pathname === `/${city}/my-area` || pathname?.startsWith(`/${city}/my-area`);
  const isSentinel = pathname?.startsWith(`/${city}/sentinel`);
  const isAlerts = pathname?.startsWith(`/${city}/alerts`);
  const isReports = pathname?.startsWith(`/${city}/my-reports`);
  const isNewReport = pathname === `/${city}/report` || pathname?.startsWith(`/${city}/report?`) || pathname === "/report";

  return (
    <nav
      aria-label="Citizen mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-border lg:hidden transition-all shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-5 items-center px-2 py-1 max-w-md mx-auto relative">
        {/* 1. Dashboard */}
        <button
          onClick={() => router.push(`/${city}/dashboard`)}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isHome
              ? "text-accent font-bold scale-105"
              : "text-text-tertiary hover:text-text-primary"
          }`}
          aria-label="Hazard Dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHome ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Dashboard</span>
        </button>

        {/* 2. My Area */}
        <button
          onClick={() => router.push(`/${city}/my-area`)}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isMyArea
              ? "text-accent font-bold scale-105"
              : "text-text-tertiary hover:text-text-primary"
          }`}
          aria-label="My Area Briefing"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMyArea ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">My Area</span>
        </button>

        {/* 3. Center Elevated Report Action (Exact Geometric Center) */}
        <button
          onClick={() => {
            if (onOpenReport) {
              onOpenReport();
            } else {
              router.push(`/${city}/report`);
            }
          }}
          className="flex flex-col items-center justify-center -mt-4 min-h-[52px] py-0.5 px-1 transition-all cursor-pointer group z-10"
          aria-label="Report Civic Issue"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-surface-0 dark:border-zinc-900 ${
              isNewReport
                ? "bg-accent-hover text-white ring-4 ring-accent/25 shadow-accent/40"
                : "bg-accent text-white shadow-accent/35 hover:bg-accent-hover"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight font-bold ${isNewReport ? "text-accent" : "text-text-secondary"}`}>
            Report
          </span>
        </button>

        {/* 4. Sentinel AI Assistant */}
        <button
          onClick={() => router.push(`/${city}/sentinel`)}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isSentinel
              ? "text-accent font-bold scale-105"
              : "text-text-tertiary hover:text-text-primary"
          }`}
          aria-label="Sentinel AI Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isSentinel ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122m8.484 8.484l2.122 2.122M5.636 18.364l2.122-2.122m8.484-8.484l2.122-2.122" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Sentinel AI</span>
        </button>

        {/* 5. Alerts & Reports */}
        <button
          onClick={() => router.push(`/${city}/alerts`)}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isAlerts || isReports
              ? "text-accent font-bold scale-105"
              : "text-text-tertiary hover:text-text-primary"
          }`}
          aria-label="Official Disaster Alerts"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isAlerts || isReports ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Alerts</span>
        </button>
      </div>
    </nav>
  );
}
