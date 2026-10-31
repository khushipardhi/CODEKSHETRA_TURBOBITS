"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button } from "@/components/ui";

interface Facility {
  id: string;
  name: string;
  facilityType: string;
  address: string;
  zone: string;
  contactNumber: string;
  emergencyNumber: string;
  handlingCategories: string[];
}

interface CategoryScope {
  category: string;
  subCategories: string[];
}

interface DepartmentOpsModuleProps {
  departmentCode: string;
  departmentName: string;
}

export function DepartmentOpsModule({
  departmentCode,
  departmentName,
}: DepartmentOpsModuleProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<CategoryScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/department/${departmentCode}/facilities`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) {
            setFacilities(d.facilities || []);
            setCategories(d.categories || []);
          }
        }
      } catch (err) {
        console.error("Failed to load department geodata facilities:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [departmentCode]);

  const handleAction = (actionTitle: string) => {
    setToastMessage(`✓ Action executed: ${actionTitle}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const primaryFacilities = facilities.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Real Geodata Facilities & Jurisdiction Stations */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🏛️</span> Department Stations & Primary Facilities ({facilities.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verified operational facilities mapped from official Nagpur geodata
            </p>
          </div>
          <Badge variant="accent" className="text-[11px] font-bold">
            {facilities.length > 0 ? `${facilities.length} Mapped Units` : "Active Municipal Unit"}
          </Badge>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
            Loading verified facility network...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {primaryFacilities.map((fac, idx) => (
              <div
                key={fac.id || idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      {fac.facilityType || "Facility"}
                    </span>
                    {fac.zone && (
                      <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {fac.zone}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {fac.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    📍 {fac.address || "Nagpur, Maharashtra"}
                  </p>
                </div>
                {(fac.contactNumber || fac.emergencyNumber) && (
                  <p className="text-[10px] font-mono font-bold text-slate-700 pt-1 border-t border-slate-200/60">
                    📞 {fac.contactNumber || fac.emergencyNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tactical Department Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Operational Actions:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="text-xs py-1.5 px-3 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200"
              onClick={() => handleAction("Broadcast Zonal Standby Alert")}
            >
              📢 Broadcast Zonal Alert
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs py-1.5 px-3 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200"
              onClick={() => handleAction("Request NMC Mutual Aid Backup")}
            >
              🤝 Request Inter-Agency Backup
            </Button>
            <Button
              size="sm"
              variant="accent"
              className="text-xs py-1.5 px-3 font-semibold"
              onClick={() => handleAction("Mobilize Rapid Field Crew")}
            >
              ⚡ Mobilize Field Squad
            </Button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
