/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Vector SVG Map Generator
   Phase 4: Publication-Quality Vector Cartography for PDF Reports
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

export interface WardMapStyle {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
  label?: string;
  scoreText?: string;
  isSelected?: boolean;
  isNoData?: boolean;
}

export interface VectorMapOptions {
  width?: number;
  height?: number;
  selectedWardId?: string;
  wardStyles?: Record<string, WardMapStyle>;
  title?: string;
  scenarioTitle?: string;
  legendTitle?: string;
  legendUnit?: string;
  legendTiers?: { label: string; color: string; range: string }[];
  includeLabels?: boolean;
}

export function generateMumbaiVectorMapSvg(options: VectorMapOptions = {}): string {
  const width = options.width || 680;
  const height = options.height || 880;
  const includeLabels = options.includeLabels !== false;

  const geojsonPath = path.resolve(process.cwd(), "data", "mumbai", "mumbai_bmc_wards.geojson");
  if (!fs.existsSync(geojsonPath)) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#64748b">
        Map geometry unavailable
      </text>
    </svg>`;
  }

  const raw = fs.readFileSync(geojsonPath, "utf-8");
  const geojson = JSON.parse(raw);

  // Exact Mumbai bounds with slight cartographic margin
  const minLng = 72.765;
  const maxLng = 72.990;
  const minLat = 18.885;
  const maxLat = 19.280;

  const mapPadding = { top: 30, right: 30, bottom: 50, left: 30 };
  const mapWidth = width - mapPadding.left - mapPadding.right;
  const mapHeight = height - mapPadding.top - mapPadding.bottom;

  // Project longitude/latitude into SVG [x, y]
  function project(lng: number, lat: number): [number, number] {
    const x = mapPadding.left + ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    // Invert Y for latitude (north is up)
    const y = mapPadding.top + ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  }

  function ringsToPath(rings: number[][][]): string {
    return rings
      .map((ring) => {
        return (
          ring
            .map((pt, idx) => {
              const [px, py] = project(pt[0], pt[1]);
              return `${idx === 0 ? "M" : "L"} ${px} ${py}`;
            })
            .join(" ") + " Z"
        );
      })
      .join(" ");
  }

  let pathsSvg = "";
  let labelsSvg = "";

  const defaultLegendTiers = [
    { label: "Low Risk", color: "#065f46", range: "0 - 20%" },
    { label: "Guarded", color: "#0284c7", range: "20 - 40%" },
    { label: "Elevated", color: "#d97706", range: "40 - 60%" },
    { label: "High Hazard", color: "#ea580c", range: "60 - 80%" },
    { label: "Critical", color: "#991b1b", range: "80 - 100%" },
  ];

  const legendTiers = options.legendTiers || defaultLegendTiers;

  for (const feature of geojson.features) {
    const wardId = feature.properties.ward_id || feature.properties.wardId;
    const style = options.wardStyles?.[wardId] || {
      fill: "#e2e8f0",
      fillOpacity: 0.65,
      stroke: "#475569",
      strokeWidth: 1.2,
    };

    const isSelected = options.selectedWardId === wardId || style.isSelected;
    const fillColor = style.isNoData ? "#94a3b8" : style.fill;
    const fillOp = isSelected ? 0.78 : style.fillOpacity || 0.65;
    const strokeColor = isSelected ? "#1d4ed8" : style.stroke || "#475569";
    const strokeWidth = isSelected ? 3.5 : style.strokeWidth || 1.2;
    const dashAttr = style.isNoData ? 'stroke-dasharray="4,4"' : "";

    let pathD = "";
    if (feature.geometry.type === "Polygon") {
      pathD = ringsToPath(feature.geometry.coordinates);
    } else if (feature.geometry.type === "MultiPolygon") {
      pathD = feature.geometry.coordinates.map((poly: any) => ringsToPath(poly)).join(" ");
    }

    pathsSvg += `  <path d="${pathD}" fill="${fillColor}" fill-opacity="${fillOp}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashAttr} stroke-linejoin="round" />\n`;

    // Render ward label
    if (includeLabels && feature.properties.office_coords) {
      const [oLat, oLng] = feature.properties.office_coords;
      const [lx, ly] = project(oLng, oLat);
      const shortCode = feature.properties.shortCode || feature.properties.short_code || wardId;

      labelsSvg += `  <g transform="translate(${lx}, ${ly})">
    <circle r="${isSelected ? 11 : 9}" fill="#ffffff" fill-opacity="0.92" stroke="${isSelected ? "#1d4ed8" : "#64748b"}" stroke-width="${isSelected ? 2 : 1}"/>
    <text y="3.5" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${isSelected ? 8.5 : 7.5}" font-weight="800" fill="${isSelected ? "#1d4ed8" : "#0f172a"}">${shortCode}</text>
  </g>\n`;
    }
  }

  // Legend Component
  const legendX = 40;
  const legendY = height - 190;
  let legendItemsSvg = "";
  legendTiers.forEach((t, i) => {
    const iy = legendY + 22 + i * 18;
    legendItemsSvg += `  <rect x="${legendX + 10}" y="${iy}" width="14" height="12" rx="2" fill="${t.color}" fill-opacity="0.85" stroke="#334155" stroke-width="0.7"/>
  <text x="${legendX + 30}" y="${iy + 9.5}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="600" fill="#1e293b">${t.label}</text>
  <text x="${legendX + 145}" y="${iy + 9.5}" font-family="monospace" font-size="8" text-anchor="end" fill="#64748b">${t.range}</text>\n`;
  });

  // Offline / No-data swatch
  const noDataY = legendY + 22 + legendTiers.length * 18;
  legendItemsSvg += `  <rect x="${legendX + 10}" y="${noDataY}" width="14" height="12" rx="2" fill="#94a3b8" fill-opacity="0.4" stroke="#64748b" stroke-width="1" stroke-dasharray="2,2"/>
  <text x="${legendX + 30}" y="${noDataY + 9.5}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="600" fill="#475569">Offline / No Data</text>
  <text x="${legendX + 145}" y="${noDataY + 9.5}" font-family="monospace" font-size="8" text-anchor="end" fill="#94a3b8">--</text>\n`;

  const legendBoxHeight = 35 + (legendTiers.length + 1) * 18;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Waterbody Background (Arabian Sea & Thane Creek) -->
  <rect width="${width}" height="${height}" fill="#f0f9ff" />

  <!-- Coastline contour subtle tint -->
  <g id="mumbaiWardsGroup" filter="url(#mapShadow)">
${pathsSvg}
  </g>

  <!-- Ward Centroid Labels -->
  <g id="mumbaiLabelsGroup">
${labelsSvg}
  </g>

  <!-- Cartographic North Arrow -->
  <g transform="translate(${width - 55}, 45)">
    <circle r="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" fill-opacity="0.95"/>
    <polygon points="0,-13 4,0 0,-3" fill="#0f172a"/>
    <polygon points="0,-13 -4,0 0,-3" fill="#64748b"/>
    <polygon points="0,13 4,0 0,3" fill="#cbd5e1"/>
    <polygon points="0,13 -4,0 0,3" fill="#94a3b8"/>
    <text y="-14" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="900" fill="#0f172a">N</text>
  </g>

  <!-- Cartographic Scale Bar (5 km) -->
  <g transform="translate(${width - 150}, ${height - 45})">
    <rect x="-10" y="-12" width="130" height="28" rx="4" fill="#ffffff" fill-opacity="0.9" stroke="#cbd5e1" stroke-width="0.8"/>
    <line x1="0" y1="0" x2="110" y2="0" stroke="#0f172a" stroke-width="2"/>
    <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="55" y1="-3" x2="55" y2="3" stroke="#0f172a" stroke-width="1"/>
    <line x1="110" y1="-4" x2="110" y2="4" stroke="#0f172a" stroke-width="1.5"/>
    <text x="0" y="9" font-family="monospace" font-size="7" fill="#0f172a">0</text>
    <text x="55" y="9" text-anchor="middle" font-family="monospace" font-size="7" fill="#0f172a">2.5</text>
    <text x="110" y="9" text-anchor="end" font-family="monospace" font-size="7" fill="#0f172a">5 km</text>
  </g>

  <!-- Cartographic Legend Card -->
  <g>
    <rect x="${legendX}" y="${legendY}" width="160" height="${legendBoxHeight}" rx="8" fill="#ffffff" fill-opacity="0.96" stroke="#cbd5e1" stroke-width="1" filter="url(#mapShadow)"/>
    <text x="${legendX + 10}" y="${legendY + 15}" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" fill="#0f172a">${options.legendTitle || "RISK SEVERITY INDEX"}</text>
    <text x="${legendX + 150}" y="${legendY + 15}" font-family="monospace" font-size="7.5" text-anchor="end" fill="#64748b">${options.legendUnit || "%"}</text>
    <line x1="${legendX + 10}" y1="${legendY + 18}" x2="${legendX + 150}" y2="${legendY + 18}" stroke="#e2e8f0" stroke-width="0.8"/>
${legendItemsSvg}
  </g>

  <!-- Authority Attribution Footer -->
  <text x="25" y="${height - 15}" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" fill="#64748b">
    MCGM / BMC 24 Administrative Wards · Copernicus GLO-30 Topography · Vector SVG
  </text>
</svg>`;
}
