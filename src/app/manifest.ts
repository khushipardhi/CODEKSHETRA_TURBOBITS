import { MetadataRoute } from "next";
import { BRANDING } from "@/config/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRANDING.name} ${BRANDING.compactName} — Autonomous City Intelligence`,
    short_name: BRANDING.name,
    description: BRANDING.description,
    start_url: "/",
    id: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#090d16",
    theme_color: "#0ea5e9",
    orientation: "any",
    scope: "/",
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["government", "utilities", "productivity", "navigation"],
    shortcuts: [
      {
        name: "CivicOS Agent Network",
        short_name: "Agents",
        description: "Autonomous AI Agent Command Centre",
        url: "/admin/mumbai/agents",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Citizen Sentinel Portal",
        short_name: "Citizen",
        description: "Citizen Safety & Hazard Reporting",
        url: "/mumbai/citizen",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Hazard & Incident Map",
        short_name: "Hazard Map",
        description: "Live municipal geospatial risk map",
        url: "/admin/mumbai/hazards",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
