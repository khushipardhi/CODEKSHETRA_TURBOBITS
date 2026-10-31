/* ════════════════════════════════════════════════════════
   Admin Portal — Sidebar Navigation Layout
   Persistent side-rail for desktop, drawer for mobile
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ShieldIcon,
  HomeIcon,
  MapIcon,
  FileTextIcon,
  BuildingIcon,
  UserIcon,
  SettingsIcon,
  ChartIcon,
  BellIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ClockIcon,
  WrenchIcon,
  ActivityIcon,
  SlidersIcon,
} from "@/components/ui/icons";

import { useCityContext } from "@/components/providers/city-provider";
import { CITIES, DEFAULT_CITY } from "@/lib/city-context";

import { BRANDING } from "@/config/branding";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let activeCity = DEFAULT_CITY;
  try {
    const ctx = useCityContext();
    if (ctx?.city) activeCity = ctx.city;
  } catch {
    const parts = pathname?.split("/").filter(Boolean) || [];
    if (parts.length > 1 && parts[0] === "admin" && CITIES[parts[1]]) {
      activeCity = parts[1];
    }
  }

  const adminNav = [
    { href: `/admin/${activeCity}`, label: BRANDING.modules.commandCentre, icon: <HomeIcon size={18} /> },
    { href: `/admin/${activeCity}/map`, label: BRANDING.modules.hazardMap, icon: <MapIcon size={18} /> },
    { href: `/admin/${activeCity}/telemetry-lab`, label: BRANDING.modules.telemetryLab, icon: <ActivityIcon size={18} /> },
    { href: `/admin/${activeCity}/simulation`, label: BRANDING.modules.spatialSimulation, icon: <SlidersIcon size={18} /> },
    { href: `/admin/${activeCity}/simulation/report`, label: BRANDING.modules.reportStudio, icon: <FileTextIcon size={18} /> },
    { href: `/admin/${activeCity}/incidents`, label: BRANDING.modules.civicReports, icon: <FileTextIcon size={18} /> },
    { href: `/admin/${activeCity}/departments`, label: BRANDING.modules.departments, icon: <BuildingIcon size={18} /> },
    { href: `/admin/${activeCity}/users`, label: BRANDING.modules.users, icon: <UserIcon size={18} /> },
    { href: `/admin/${activeCity}/taxonomy`, label: BRANDING.modules.taxonomy, icon: <WrenchIcon size={18} /> },
    { href: `/admin/${activeCity}/analytics`, label: BRANDING.modules.analytics, icon: <ChartIcon size={18} /> },
    { href: `/admin/${activeCity}/audit`, label: BRANDING.modules.audit, icon: <ClockIcon size={18} /> },
    { href: `/admin/${activeCity}/settings`, label: BRANDING.modules.settings, icon: <SettingsIcon size={18} /> },
  ];

  const isActive = (href: string) => {
    if (href === `/admin/${activeCity}`) return pathname === href;
    if (href === `/admin/${activeCity}/simulation`) {
      return pathname === href || (pathname.startsWith(href) && !pathname.includes("/report"));
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${activeCity}/dashboard` });
  };

  const handleCitySwitch = (newCity: string) => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1 && parts[0] === "admin" && CITIES[parts[1]]) {
      parts[1] = newCity;
      router.push("/" + parts.join("/"));
    } else {
      router.push(`/admin/${newCity}`);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4.5 border-b border-divider">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-xs border border-border/40 bg-surface-1">
            <img src={BRANDING.assets.logo} alt={BRANDING.name} className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <span className="text-sm font-bold block text-text-primary tracking-tight leading-tight">{BRANDING.name}</span>
            <span className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Command Operations</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Jurisdiction Switcher */}
      <div className="px-3 py-2.5 border-b border-divider bg-surface-1/40">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Jurisdiction
          </span>
          <span className="text-[10px] font-mono text-accent uppercase font-bold">
            {activeCity}
          </span>
        </div>
        <select
          value={activeCity}
          onChange={(e) => handleCitySwitch(e.target.value)}
          className="w-full text-xs font-semibold bg-surface-0 border border-border rounded-xl px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="nagpur">🏛️ Nagpur (NMC)</option>
          <option value="pune">🏙️ Pune (PMC)</option>
          <option value="mumbai">🌆 Mumbai (BMC)</option>
        </select>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold
                transition-all duration-[var(--transition-fast)]
                ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm font-bold ring-1 ring-primary/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
                }
              `}
            >
              {active && (
                <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-primary-foreground/90 rounded-full" />
              )}
              <span className={`flex-shrink-0 ${active ? "text-primary-foreground" : "text-text-tertiary"}`}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-divider space-y-1.5 bg-surface-0">
        <Link
          href={`/${activeCity}/dashboard`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all w-full"
        >
          <span>🌐</span>
          <span>Switch to Citizen View</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-critical hover:bg-critical-bg transition-all w-full cursor-pointer"
        >
          <LogOutIcon size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[250px] bg-surface-0 border-r border-border flex-shrink-0 sticky top-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[280px] h-full bg-surface-0 border-r border-border flex flex-col slide-up shadow-2xl">
            <button
              className="absolute top-4 right-3 p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-2 cursor-pointer"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <XIcon size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface-0/95 backdrop-blur-md sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-1 cursor-pointer"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="text-sm font-bold text-accent">{BRANDING.compactName} Command</span>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
