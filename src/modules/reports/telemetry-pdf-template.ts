/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Telemetry PDF Report Template
   Phase 4: Publication-Quality Multi-Page Telemetry Document Generator
   ════════════════════════════════════════════════════════ */

import type { TelemetryReportDocument } from "./contracts";
import { generateVectorChartSvg, type ChartSeriesData, type ChartThreshold } from "./vector-chart-svg";

export function generateTelemetryReportHtml(report: TelemetryReportDocument): string {
  const generatedDate = new Date(report.generatedAtIso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel Telemetry Intelligence Report - ${report.documentId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 15mm 12mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9pt;
      margin: 0;
      padding: 0;
    }
    .page {
      page-break-before: always;
      position: relative;
      padding-top: 5px;
    }
    .page:first-child {
      page-break-before: avoid;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
    
    /* Document Header */
    .official-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .emblem-title {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .emblem-subtitle {
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    .meta-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
      font-family: monospace;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #0284c715;
      color: #0284c7;
      border: 1px solid #0284c740;
    }
    
    /* Section Titles */
    h2.section-title {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    /* Metrics Grid */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .metric-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 3px;
    }
    .metric-value {
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
      font-family: monospace;
    }
    .metric-subtext {
      font-size: 7pt;
      color: #64748b;
      margin-top: 3px;
    }

    /* Callout */
    .callout-box {
      border-left: 4px solid #0284c7;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
      font-size: 8.5pt;
      line-height: 1.5;
    }
    
    /* Data Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 14px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.3px;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Chart Containers */
    .chart-box {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .chart-caption {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 4px;
      line-height: 1.4;
      font-style: italic;
    }
  </style>
</head>
<body>

  <!-- ════════════════════════════════════════════════════════
       PAGE 1: TELEMETRY EXECUTIVE COVER & CURRENT OVERVIEW
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">${report.cityName.toUpperCase()} ENVIRONMENTAL TELEMETRY LAB</div>
        <div class="emblem-subtitle">${report.categoryLabel.toUpperCase()} • MULTI-HAZARD SENSOR AUDIT DOSSIER</div>
        <div style="font-size: 8pt; color: #64748b; margin-top: 3px; font-family: monospace;">
          Document ID: <strong>${report.documentId}</strong> • Zone: <strong>${report.selectedZone}</strong> • Generated: ${generatedDate} IST
        </div>
      </div>
      <div style="text-align: right;">
        <span class="meta-badge">${report.categoryLabel}</span>
        <div style="margin-top: 4px; font-size: 7pt; font-family: monospace; color: #16a34a; font-weight: 700;">
          ● ${report.sourceHealth.status}
        </div>
      </div>
    </div>

    <!-- Provider Health & Station Context -->
    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 8pt; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Telemetry Source:</strong> ${report.sourceHealth.provider} &nbsp;•&nbsp; 
        <strong>Feed Cadence:</strong> ${report.sourceHealth.freshness} &nbsp;•&nbsp; 
        <strong>API Latency:</strong> ${report.sourceHealth.latencyMs} ms
      </div>
      <div style="font-family: monospace; font-size: 7.5pt; color: #475569;">
        ${report.sourceHealth.endpointDisclosure}
      </div>
    </div>

    <!-- Key Current Values -->
    <h2 class="section-title">
      <span>1. Current Telemetry Observations</span>
      <span style="font-size: 8pt; color: #64748b;">GROUND STATION SENSORS</span>
    </h2>
    <div class="metric-grid">
      ${report.keyCurrentMetrics
        .slice(0, 4)
        .map(
          (m) => `<div class="metric-card">
        <div class="metric-label">${m.name}</div>
        <div class="metric-value">${m.value} <span style="font-size: 9pt; font-weight: 600;">${m.unit}</span></div>
        <div class="metric-subtext">Status: <strong style="color: ${m.statusColor}">${m.status}</strong></div>
      </div>`
        )
        .join("")}
    </div>

    <!-- Second row of metrics if available -->
    ${
      report.keyCurrentMetrics.length > 4
        ? `<div class="metric-grid" style="margin-top: -6px;">
      ${report.keyCurrentMetrics
        .slice(4, 8)
        .map(
          (m) => `<div class="metric-card">
        <div class="metric-label">${m.name}</div>
        <div class="metric-value">${m.value} <span style="font-size: 9pt; font-weight: 600;">${m.unit}</span></div>
        <div class="metric-subtext">${m.referenceThreshold ? `Ref: ${m.referenceThreshold}` : "Operational"}</div>
      </div>`
        )
        .join("")}
    </div>`
        : ""
    }

    <!-- Environmental Synthesis -->
    <h2 class="section-title">
      <span>2. Environmental Synthesis & Analytical Insights</span>
      <span style="font-size: 8pt; color: #64748b;">MODEL-DERIVED ANALYSIS</span>
    </h2>
    <div class="callout-box">
      <ul style="margin: 0; padding-left: 16px;">
        ${report.environmentalInsights.map((ins) => `<li style="margin-bottom: 4px;">${ins}</li>`).join("")}
      </ul>
    </div>

    <!-- Missing Data Disclosure if any -->
    ${
      report.missingDataDisclosures.length > 0
        ? `<h2 class="section-title" style="border-bottom-color: #ea580c;">
      <span style="color: #ea580c;">3. Missing Data & Sensor Outage Disclosures</span>
      <span style="font-size: 8pt; color: #ea580c;">HONESTY SAFEGUARD</span>
    </h2>
    <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 6px; padding: 8px 12px; font-size: 8pt; color: #9a3412;">
      <ul style="margin: 0; padding-left: 16px;">
        ${report.missingDataDisclosures.map((d) => `<li style="margin-bottom: 3px;">${d}</li>`).join("")}
      </ul>
    </div>`
        : ""
    }
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 2: TIME-SERIES GRAPHS (VECTOR SVG FIGURES)
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">TELEMETRY TIME-SERIES FIGURES & THRESHOLD AUDIT</div>
        <div class="emblem-subtitle">FIGURE SET 2.0: CHRONOLOGICAL PROFILE (${report.timeRange.start} TO ${report.timeRange.end})</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        Cadence: ${report.timeRange.resolution}
      </div>
    </div>

    ${report.charts
      .map(
        (chart) => `<div class="chart-box">
      ${chart.svgString}
      <div class="chart-caption">
        <strong>${chart.title}:</strong> ${chart.subtitle || "Temporal profile recorded across observation horizon."} Units: ${chart.unit}. Solid lines denote observed telemetry; shaded bands denote statutory threshold indicators.
      </div>
    </div>`
      )
      .join("")}
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 3: STRUCTURED OBSERVATION & FORECAST DATA TABLE
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">STRUCTURED OBSERVATION & FORECAST DATA POINTS</div>
        <div class="emblem-subtitle">SECTION 3.0: CHRONOLOGICAL LOG (${report.tabularData.totalRows} SAMPLE INTERVALS)</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        Ground Telemetry Log
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          ${report.tabularData.columns.map((c) => `<th>${c}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${report.tabularData.rows
          .slice(0, 32)
          .map(
            (row) => `<tr>
          ${row.map((val, idx) => `<td style="${idx === 0 ? "font-family: monospace; font-weight: 700;" : "font-family: monospace; text-align: right;"}">${val ?? "-"}</td>`).join("")}
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    ${
      report.tabularData.truncated
        ? `<div style="font-size: 7.5pt; color: #64748b; font-style: italic;">
      * Complete full-resolution time-series containing ${report.tabularData.totalRows} points can be exported directly via CSV in the Environmental Telemetry Lab console.
    </div>`
        : ""
    }
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 4: PARAMETER CATALOGUE, SOURCES & LIMITATIONS
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">PARAMETER DEFINITIONS, SOURCES & STATUTORY LIMITATIONS</div>
        <div class="emblem-subtitle">SECTION 4.0: SENSOR REGISTRY & SCIENTIFIC CITATIONS</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        Registry Schema v4.0
      </div>
    </div>

    <h2 class="section-title">
      <span>1. Registered Parameter Definitions</span>
      <span style="font-size: 8pt; color: #64748b;">SCIENTIFIC SPECS</span>
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 110px;">Code / Name</th>
          <th style="width: 55px;">Unit</th>
          <th style="width: 100px;">Source</th>
          <th>Description & Physical Measurement Method</th>
        </tr>
      </thead>
      <tbody>
        ${report.parameterDefinitions
          .map(
            (p) => `<tr>
          <td style="font-weight: 700;">${p.name}<br/><span style="font-family: monospace; font-size: 6.5pt; color: #64748b;">${p.code}</span></td>
          <td style="font-family: monospace;">${p.unit}</td>
          <td style="font-size: 7.5pt; color: #0284c7;">${p.source}</td>
          <td style="font-size: 7.5pt;">${p.description} ${p.thresholdCitation ? `<em>(${p.thresholdCitation})</em>` : ""}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2 class="section-title">
      <span>2. Interpretation Limitations & Caveats</span>
      <span style="font-size: 8pt; color: #64748b;">OPERATIONAL BOUNDARIES</span>
    </h2>
    <div style="font-size: 8pt; color: #334155; line-height: 1.5; margin-bottom: 20px;">
      <ul style="margin: 0; padding-left: 18px;">
        ${report.limitations.map((lim) => `<li style="margin-bottom: 4px;">${lim}</li>`).join("")}
      </ul>
    </div>

    <div style="border-top: 1.5px solid #0f172a; padding-top: 10px; font-size: 7pt; color: #64748b; line-height: 1.4; text-align: justify;">
      <strong>LEGAL NOTICE:</strong> This Telemetry Intelligence Dossier compiles near-real-time observations and numerical weather prediction forecasts for administrative evaluation and preparedness. Forecasts are inherently probabilistic and subject to atmospheric chaos. Emergency mobilization must be conducted in accordance with standard operating procedures and verified on-ground municipal inspection.
    </div>
  </div>

</body>
</html>`;
}
