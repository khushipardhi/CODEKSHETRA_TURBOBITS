/* ════════════════════════════════════════════════════════
   Department Portal — Clean Light Mode Layout with Sidebar
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BuildingIcon,
  HomeIcon,
  FileTextIcon,
  WrenchIcon,
  UserIcon,
  ChartIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "@/components/ui/icons";

export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enforce light mode on department portal
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, [pathname]);

  // Extract current department code if on a department sub-route
  const match = pathname.match(/\/department\/([a-z_]+)/);
  const currentDeptCode = match ? match[1] : null;

  const deptNav = currentDeptCode
    ? [
        { href: `/department/${currentDeptCode}`, label: "Operations Console", icon: <HomeIcon size={18} /> },
        { href: `/department/${currentDeptCode}/incidents`, label: "Incident Desk", icon: <FileTextIcon size={18} /> },
        { href: `/department/${currentDeptCode}/tasks`, label: "Tasks & Dispatch", icon: <WrenchIcon size={18} /> },
        { href: `/department/${currentDeptCode}/workers`, label: "Stations & Facilities", icon: <UserIcon size={18} /> },
        { href: `/department/${currentDeptCode}/analytics`, label: "Analytics & SLA", icon: <ChartIcon size={18} /> },
      ]
    : [
        { href: "/department", label: "Department Hub", icon: <HomeIcon size={18} /> },
      ];

  const isActive = (href: string) => {
    if (href === `/department/${currentDeptCode}` || href === "/department") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-xs">
          <BuildingIcon size={18} className="text-white" />
        </div>
        <div>
          <span className="font-display text-sm font-extrabold text-slate-900 block">Nagpur Connect</span>
          <span className="text-[11px] font-bold text-accent uppercase tracking-wider block truncate max-w-[140px]">
            {currentDeptCode ? currentDeptCode.replace(/_/g, " ") : "Central Portal"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentDeptCode && (
          <Link
            href="/department"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-accent hover:bg-blue-50 transition-colors mb-2"
          >
            <span>←</span> All Departments Hub
          </Link>
        )}

        {deptNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive(item.href)
                ? "bg-blue-50 text-accent font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <Link
          href="/department"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all w-full"
        >
          <BuildingIcon size={16} />
          Switch Department
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all w-full">
          <LogOutIcon size={16} />
          Exit to Main Site
        </button>
      </div>
    </>
  );

  return (
    <div data-theme="light" className="dept-portal flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <aside className="hidden lg:flex lg:flex-col w-[240px] bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 h-screen shadow-xs">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[var(--z-overlay)]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[260px] h-full bg-white border-r border-slate-200 flex flex-col slide-up shadow-xl">
            <button
              className="absolute top-4 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <XIcon size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="font-display text-sm font-extrabold text-slate-900 truncate max-w-[200px]">
            {currentDeptCode ? currentDeptCode.replace(/_/g, " ").toUpperCase() : "Department Portal"}
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
