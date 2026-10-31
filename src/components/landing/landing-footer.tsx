"use client";

import React from "react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";
import { ShieldIcon } from "@/components/ui/icons";

interface LandingFooterProps {
  citySlug: string;
}

export function LandingFooter({ citySlug }: LandingFooterProps) {
  return (
    <footer className="border-t border-border bg-surface-1/60 dark:bg-[#05080e] text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1 & 2: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldIcon size={18} />
              </div>
              <span className="text-base font-bold text-text-primary tracking-tight">
                {BRANDING.name}
              </span>
            </Link>

            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              Integrated urban intelligence platform connecting environmental telemetry,
              geospatial hazard analysis, scenario simulation, AI-assisted interpretation,
              and civic response in one operational ecosystem.
            </p>

            <div className="text-[11px] font-mono text-text-tertiary space-y-1">
              <div>Jurisdictions: Mumbai (MCGM) · Pune (PMC) · Nagpur (NMC)</div>
              <div>Spatial Standard: EPSG:4326 (WGS-84) · GeoJSON RFC 7946</div>
              <div>Database: TiDB Cloud Serverless MySQL (21 Active Tables)</div>
            </div>
          </div>

          {/* Col 3: Intelligence Workspaces */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Workspaces
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Command Centre
                </Link>
              </li>
              <li>
                <Link href="/admin/map" className="hover:text-primary transition-colors">
                  Hazard & Incident Map
                </Link>
              </li>
              <li>
                <Link href={`/admin/${citySlug}/telemetry-lab`} className="hover:text-primary transition-colors">
                  Telemetry Lab
                </Link>
              </li>
              <li>
                <Link href={`/admin/${citySlug}/simulation`} className="hover:text-primary transition-colors">
                  Spatial Simulation Lab
                </Link>
              </li>
              <li>
                <Link href={`/admin/${citySlug}/simulation/report`} className="hover:text-primary transition-colors">
                  Simulation Report Studio
                </Link>
              </li>
              <li>
                <Link href={`/${citySlug}/sentinel`} className="hover:text-primary transition-colors">
                  Sentinel AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Civic & Public Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Civic Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={`/${citySlug}/dashboard`} className="hover:text-primary transition-colors">
                  Citizen Hazard Dashboard
                </Link>
              </li>
              <li>
                <Link href={`/${citySlug}/report`} className="hover:text-primary transition-colors">
                  Submit Civic Report
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-primary transition-colors">
                  Track Existing Report
                </Link>
              </li>
              <li>
                <Link href="/department" className="hover:text-primary transition-colors">
                  Department Workflows
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="text-critical hover:underline transition-colors font-medium">
                  Emergency Helplines
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Data & Methodology */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Methodology & Data
            </h4>
            <ul className="space-y-2 text-xs text-text-tertiary">
              <li>Copernicus GLO-30 DEM (~30m)</li>
              <li>ECMWF IFS (0.1° NWP Grid)</li>
              <li>INCOIS Astronomical Tides</li>
              <li>CPCB Air Quality NAAQS</li>
              <li>MCGM 24 Administrative Wards</li>
              <li>Rational Runoff (Q = C · I · A)</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-tertiary">
          <div>
            © {new Date().getFullYear()} {BRANDING.name}. Municipal Administration Platform.
          </div>
          <div className="flex items-center gap-4">
            <span>Tier 2 Hydrodynamic Screening Demarcation</span>
            <span>·</span>
            <Link href="/login" className="hover:text-text-primary">
              Officer Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
