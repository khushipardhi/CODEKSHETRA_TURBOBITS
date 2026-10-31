"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DepartmentSubNavProps {
  departmentCode: string;
  city?: string;
}

export function DepartmentSubNav({ departmentCode, city }: DepartmentSubNavProps) {
  const pathname = usePathname();

  // Try to detect city from pathname if not explicitly passed
  const cityMatch = pathname.match(/^\/department\/(nagpur|pune|mumbai)\//);
  const activeCity = city || (cityMatch ? cityMatch[1] : null);
  const basePath = activeCity ? `/department/${activeCity}/${departmentCode}` : `/department/${departmentCode}`;

  const links = [
    { href: `${basePath}`, label: "Operations Console", icon: "⚡" },
    { href: `${basePath}/incidents`, label: "Incident Desk", icon: "📋" },
    { href: `${basePath}/tasks`, label: "Tasks & Dispatch", icon: "👷" },
    { href: `${basePath}/workers`, label: "Stations & Facilities", icon: "🏛️" },
    { href: `${basePath}/analytics`, label: "Analytics & SLA", icon: "📈" },
  ];

  return (
    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {links.map((link) => {
        const isRoot = link.href === basePath;
        const isActive = isRoot ? pathname === link.href : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors whitespace-nowrap select-none
              ${
                isActive
                  ? "bg-accent text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
          >
            <span className="text-sm">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
