"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DepartmentSidebarProps {
  departmentCode: string;
}

export function DepartmentSidebar({ departmentCode }: DepartmentSidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: `/department/${departmentCode}`, icon: "📊" },
    { name: "Incidents", href: `/department/${departmentCode}/incidents`, icon: "📋" },
    { name: "Tasks & Workers", href: `/department/${departmentCode}/tasks`, icon: "👷" },
    { name: "Analytics", href: `/department/${departmentCode}/analytics`, icon: "📈" },
  ];

  return (
    <aside className="w-64 bg-surface-1 border-r border-border h-full flex flex-col hidden md:flex">
      <div className="p-6 border-b border-border">
        <Link href="/department" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Department Hub</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name !== "Dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
          <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">👤</span>
          <div>
            <p className="font-medium text-text-primary">Dept. Admin</p>
            <p className="text-xs">Active Session</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
