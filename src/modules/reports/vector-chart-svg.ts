/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Vector SVG Chart Generator
   Phase 4: Publication-Grade Chart Figures for PDF Reports
   ════════════════════════════════════════════════════════ */

export interface ChartSeriesData {
  id: string;
  label: string;
  color: string;
  unit: string;
  values: (number | null | undefined)[];
  type?: "line" | "bar";
}

export interface ChartThreshold {
  value: number;
  label: string;
  color: string;
}

export interface VectorChartOptions {
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  timestamps: string[];
  series: ChartSeriesData[];
  thresholds?: ChartThreshold[];
  showLegend?: boolean;
}

export function generateVectorChartSvg(options: VectorChartOptions): string {
  const width = options.width || 720;
  const height = options.height || 240;
  const margin = { top: 32, right: 28, bottom: 35, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const timestamps = options.timestamps || [];
  const series = options.series || [];
  const thresholds = options.thresholds || [];

  if (timestamps.length === 0 || series.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc" stroke="#e2e8f0" rx="8"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">
        No observation telemetry available for this interval
      </text>
    </svg>`;
  }

  // Extract all valid numerical values
  const validValues: number[] = [];
  series.forEach((s) => {
    (s.values || []).forEach((v) => {
      if (typeof v === "number" && !isNaN(v)) {
        validValues.push(v);
      }
    });
  });
  thresholds.forEach((t) => validValues.push(t.value));

  const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 10;
  const rawRange = maxVal - minVal || 1;
  const pad = rawRange * 0.12;

  const yMin = minVal >= 0 ? 0 : Math.floor(minVal - pad);
  const yMax = Math.ceil(maxVal + pad);
  const yRange = yMax - yMin || 1;

  function getX(index: number): number {
    if (timestamps.length <= 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (timestamps.length - 1)) * plotWidth;
  }

  function getY(val: number): number {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return margin.top + plotHeight - ((clamped - yMin) / yRange) * plotHeight;
  }

  // Y-axis gridlines & ticks
  const tickCount = 4;
  let gridSvg = "";
  let yAxisLabelsSvg = "";
  for (let i = 0; i <= tickCount; i++) {
    const frac = i / tickCount;
    const yVal = yMin + frac * yRange;
    const yPos = margin.top + plotHeight - frac * plotHeight;
    gridSvg += `  <line x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="${i === 0 ? "none" : "3,3"}"/>\n`;
    yAxisLabelsSvg += `  <text x="${margin.left - 8}" y="${yPos + 3.5}" text-anchor="end" font-family="monospace" font-size="8.5" fill="#64748b">${Number(yVal.toFixed(1))}</text>\n`;
  }

  // X-axis time labels (sample ~6 points)
  let xAxisLabelsSvg = "";
  const step = Math.max(1, Math.floor(timestamps.length / 6));
  for (let i = 0; i < timestamps.length; i += step) {
    const xPos = getX(i);
    const d = new Date(timestamps[i]);
    const label = !isNaN(d.getTime())
      ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
      : `${i}h`;
    xAxisLabelsSvg += `  <line x1="${xPos}" y1="${margin.top + plotHeight}" x2="${xPos}" y2="${margin.top + plotHeight + 4}" stroke="#94a3b8" stroke-width="1"/>
  <text x="${xPos}" y="${margin.top + plotHeight + 14}" text-anchor="middle" font-family="monospace" font-size="8" fill="#64748b">${label}</text>\n`;
  }

  // Threshold lines
  let thresholdsSvg = "";
  thresholds.forEach((t) => {
    const ty = getY(t.value);
    thresholdsSvg += `  <g>
    <line x1="${margin.left}" y1="${ty}" x2="${width - margin.right}" y2="${ty}" stroke="${t.color}" stroke-width="1.2" stroke-dasharray="4,3"/>
    <rect x="${width - margin.right - 95}" y="${ty - 11}" width="95" height="12" rx="2" fill="#ffffff" fill-opacity="0.9" stroke="${t.color}" stroke-width="0.5"/>
    <text x="${width - margin.right - 5}" y="${ty - 2.5}" text-anchor="end" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" fill="${t.color}">${t.label}</text>
  </g>\n`;
  });

  // Series graphics
  let seriesSvg = "";
  series.forEach((s) => {
    if (!s.values || s.values.length === 0) return;

    if (s.type === "bar") {
      const barWidth = Math.max(2, (plotWidth / timestamps.length) * 0.65);
      let bars = "";
      s.values.forEach((v, idx) => {
        if (typeof v === "number" && !isNaN(v)) {
          const bx = getX(idx) - barWidth / 2;
          const by = getY(v);
          const bHeight = Math.max(0, margin.top + plotHeight - by);
          bars += `    <rect x="${bx}" y="${by}" width="${barWidth}" height="${bHeight}" fill="${s.color}" fill-opacity="0.75" stroke="${s.color}" stroke-width="0.5" rx="1"/>\n`;
        }
      });
      seriesSvg += `  <g id="series_${s.id}">\n${bars}  </g>\n`;
    } else {
      // Line series
      let pathD = "";
      let areaD = "";
      let first = true;
      let lastX = 0;
      let firstX = 0;

      s.values.forEach((v, idx) => {
        if (typeof v === "number" && !isNaN(v)) {
          const x = getX(idx);
          const y = getY(v);
          if (first) {
            pathD += `M ${x} ${y}`;
            areaD += `M ${x} ${margin.top + plotHeight} L ${x} ${y}`;
            firstX = x;
            first = false;
          } else {
            pathD += ` L ${x} ${y}`;
            areaD += ` L ${x} ${y}`;
          }
          lastX = x;
        }
      });

      if (pathD) {
        areaD += ` L ${lastX} ${margin.top + plotHeight} Z`;
        seriesSvg += `  <g id="series_${s.id}">
    <path d="${areaD}" fill="${s.color}" fill-opacity="0.08" />
    <path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>\n`;
      }
    }
  });

  // Legend at top
  let legendSvg = "";
  let lx = margin.left;
  series.forEach((s) => {
    legendSvg += `  <g transform="translate(${lx}, 14)">
    <rect width="10" height="10" rx="2" fill="${s.color}"/>
    <text x="14" y="8.5" font-family="system-ui, sans-serif" font-size="8.5" font-weight="600" fill="#1e293b">${s.label} (${s.unit})</text>
  </g>\n`;
    lx += s.label.length * 6 + 45;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="8"/>

  <!-- Title / Legend Header -->
  <g>
    ${options.title ? `<text x="${margin.left}" y="14" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#0f172a">${options.title.toUpperCase()}</text>` : ""}
    <g transform="translate(${options.title ? options.title.length * 6 + 70 : 0}, 0)">
${legendSvg}
    </g>
  </g>

  <!-- Y-Axis Unit -->
  <text x="${margin.left - 8}" y="${margin.top - 8}" text-anchor="end" font-family="monospace" font-size="7.5" fill="#64748b">${series[0]?.unit || ""}</text>

  <!-- Plot Gridlines -->
${gridSvg}

  <!-- Y-Axis Labels -->
${yAxisLabelsSvg}

  <!-- X-Axis Labels -->
${xAxisLabelsSvg}

  <!-- Data Series Lines and Bars -->
${seriesSvg}

  <!-- Threshold Reference Bands -->
${thresholdsSvg}
</svg>`;
}
