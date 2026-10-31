/* ════════════════════════════════════════════════════════
   Nearest Facilities — Citizen-facing geo results
   Shows nearest government facilities + Get Directions
   Displayed after incident creation if geo routing succeeded
   ════════════════════════════════════════════════════════ */

"use client";

import type { GeoRoutingResult } from "@/modules/geo/types";

interface NearestFacilitiesProps {
  routing: GeoRoutingResult;
}

const bandColors: Record<string, string> = {
  very_nearby: "text-green-400",
  nearby: "text-emerald-400",
  moderate: "text-yellow-400",
  far: "text-orange-400",
  extended: "text-red-400",
};

const bandBg: Record<string, string> = {
  very_nearby: "bg-green-400/10 border-green-400/20",
  nearby: "bg-emerald-400/10 border-emerald-400/20",
  moderate: "bg-yellow-400/10 border-yellow-400/20",
  far: "bg-orange-400/10 border-orange-400/20",
  extended: "bg-red-400/10 border-red-400/20",
};

export default function NearestFacilities({ routing }: NearestFacilitiesProps) {
  if (!routing.recommendations || routing.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Zone badge */}
      {routing.matchedZone && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-xl">
          <span className="text-sm">📍</span>
          <span className="text-xs font-medium text-accent">
            {routing.matchedZone.zoneName}
          </span>
        </div>
      )}

      {/* Per-department facility results */}
      {routing.recommendations.map((dept) => (
        <div key={dept.departmentType} className="space-y-2">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {dept.departmentName}
          </h4>

          {dept.facilities.map((rec, idx) => (
            <div
              key={rec.facility.id}
              className={`rounded-xl border p-3 transition-all ${
                idx === 0
                  ? "bg-surface-1 border-accent/20"
                  : "bg-surface-0 border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {rec.facility.name}
                  </p>
                  {rec.facility.address && (
                    <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                      {rec.facility.address}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        bandBg[rec.distanceBand] || ""
                      } ${bandColors[rec.distanceBand] || "text-text-tertiary"}`}
                    >
                      {rec.distanceKm} km · {rec.distanceLabel}
                    </span>
                    {rec.facility.facilityType && (
                      <span className="text-[10px] text-text-tertiary">
                        {rec.facility.facilityType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Get Directions button */}
                <a
                  href={rec.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
                  </svg>
                  Directions
                </a>
              </div>

              {/* Contact numbers */}
              {(rec.facility.contactNumber || rec.facility.emergencyNumber) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                  {rec.facility.contactNumber && (
                    <a
                      href={`tel:${rec.facility.contactNumber.replace(/[^+\d]/g, "")}`}
                      className="text-[10px] text-accent hover:underline"
                    >
                      📞 {rec.facility.contactNumber}
                    </a>
                  )}
                  {rec.facility.emergencyNumber && (
                    <a
                      href={`tel:${rec.facility.emergencyNumber.split("/")[0].trim().replace(/[^+\d]/g, "")}`}
                      className="text-[10px] text-critical hover:underline font-semibold"
                    >
                      🚨 {rec.facility.emergencyNumber}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Processing info */}
      <p className="text-[10px] text-text-tertiary text-center">
        Geo routing completed in {routing.processingTimeMs}ms
      </p>
    </div>
  );
}
