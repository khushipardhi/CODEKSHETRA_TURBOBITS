"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DepartmentSubNavProps {
  departmentCode: string;
}

export function DepartmentSubNav({ departmentCode }: DepartmentSubNavProps) {
  const pathname = usePathname();

  const links = [
    { href: `/department/${departmentCode}`, label: "Operations Console", icon: "⚡" },
    { href: `/department/${departmentCode}/incidents`, label: "Incident Desk", icon: "📋" },
    { href: `/department/${departmentCode}/tasks`, label: "Tasks & Dispatch", icon: "👷" },
    { href: `/department/${departmentCode}/workers`, label: "Stations & Facilities", icon: "🏛️" },
    { href: `/department/${departmentCode}/analytics`, label: "Analytics & SLA", icon: "📈" },
  ];

  return (
    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {links.map((link) => {
        const isRoot = link.href === `/department/${departmentCode}`;
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
