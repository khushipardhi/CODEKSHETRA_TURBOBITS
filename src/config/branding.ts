/**
 * src/config/branding.ts
 * Sentinel City Intelligence — Authoritative Branding Configuration
 * Centralized constant for all display labels, compact labels, module titles,
 * and visual brand identity tokens.
 */

export const BRANDING = {
  // Product Identity
  name: "Sentinel City Intelligence",
  compactName: "Sentinel",
  badge: "City Intelligence",
  tagline: "Multi-Hazard Spatial Simulation & Environmental Telemetry",
  description:
    "Integrated municipal risk intelligence, spatial simulation, and civic response platform for Greater Mumbai, Pune, and Nagpur.",
  copyright: `© ${new Date().getFullYear()} Sentinel City Intelligence. Municipal Administration.`,

  // Standardized Module Labels (Strict Requirement)
  modules: {
    commandCentre: "Sentinel Command Centre",
    hazardMap: "Hazard & Incident Map",
    telemetryLab: "Telemetry Lab",
    spatialSimulation: "Spatial Simulation Lab",
    reportStudio: "Simulation Report Studio",
    citizen: "Sentinel Citizen",
    sentinelAi: "Sentinel AI",
    civicReports: "Civic Reports",
    myReports: "My Reports",
    departments: "Department Operations",
    users: "Citizens & Users",
    taxonomy: "Hazard Taxonomy",
    analytics: "Intelligence Analytics",
    audit: "Audit Log",
    settings: "System Settings",
  },

  // Document & Report Identity
  reports: {
    authority: "GREATER MUMBAI DISASTER MANAGEMENT AUTHORITY",
    jurisdiction: "Municipal Corporation of Greater Mumbai (MCGM / BMC)",
    subtitle: "Municipal Hazard Intelligence & Spatial Hydrology Dossier",
  },

  // Assets
  assets: {
    logo: "/favicon.png",
    logoAlt: "Sentinel City Intelligence",
    favicon: "/favicon.png",
  },
} as const;

export type BrandingConfig = typeof BRANDING;
