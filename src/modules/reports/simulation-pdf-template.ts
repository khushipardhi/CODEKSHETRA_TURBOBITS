/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation PDF Report Template
   Phase 4: Publication-Quality Multi-Page Document Generator
   ════════════════════════════════════════════════════════ */

import type { CanonicalSimulationDossier } from "../dossier/contracts";
import { generateMumbaiVectorMapSvg, type WardMapStyle } from "./vector-map-svg";

export function generateSimulationReportHtml(dossier: CanonicalSimulationDossier): string {
  const ex = dossier.executiveSummary;
  const cond = dossier.conditionsAndInputs;
  const meth = dossier.methodologyAndCalculation;
  const city = dossier.citywideAssessment;
  const gov = dossier.limitationsAndGovernance;
  const wardDetail = dossier.wardDetailedAnalysis;

  // Format timestamps
  const generatedDate = new Date(dossier.generatedAtIso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  // Build ward styles for SVG map
  const wardStyles: Record<string, WardMapStyle> = {};
  const alertColor =
    ex.overallAlertLevel === "RED_WARNING"
      ? "#991b1b"
      : ex.overallAlertLevel === "ORANGE_ALERT"
      ? "#ea580c"
      : ex.overallAlertLevel === "YELLOW_WATCH"
      ? "#d97706"
      : "#16a34a";

  // Tier color mapping
  function getTierColor(score: number): string {
    if (score >= 80) return "#991b1b";
    if (score >= 60) return "#ea580c";
    if (score >= 40) return "#d97706";
    if (score >= 20) return "#0284c7";
    return "#065f46";
  }

  (dossier.rankedWardsAnalysis || []).forEach((w) => {
    wardStyles[w.wardId] = {
      fill: getTierColor(w.score),
      fillOpacity: 0.65,
      stroke: "#334155",
      strokeWidth: 1.2,
      isSelected: wardDetail?.wardId === w.wardId,
      scoreText: `${w.score}`,
    };
  });

  // Generate crisp vector map SVG
  const vectorMapSvg = generateMumbaiVectorMapSvg({
    width: 620,
    height: 780,
    selectedWardId: wardDetail?.wardId,
    wardStyles,
    legendTitle: "HYDRODYNAMIC RISK INDEX",
    legendUnit: "% (Runoff & Surcharge)",
    includeLabels: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel Simulation Dossier - ${dossier.dossierId}</title>
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
      font-size: 9.5pt;
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
    
    /* Document Header & Seals */
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
    }
    .meta-badge-alert {
      background: ${alertColor}15;
      color: ${alertColor};
      border: 1px solid ${alertColor}40;
    }
    .meta-badge-tier {
      background: #0284c715;
      color: #0284c7;
      border: 1px solid #0284c740;
    }
    
    /* Section Structure */
    h2.section-title {
      font-size: 11pt;
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
    h3.subsection-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    
    /* Metric Cards Grid */
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
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
      font-family: -apple-system, BlinkMacSystemFont, monospace;
    }
    .metric-subtext {
      font-size: 7pt;
      color: #64748b;
      margin-top: 3px;
    }

    /* Executive Callout Box */
    .callout-box {
      border-left: 4px solid ${alertColor};
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
      font-size: 9pt;
      line-height: 1.5;
    }
    
    /* Structured Tables */
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
      font-size: 7.5pt;
      letter-spacing: 0.3px;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.data-table tr.highlight td {
      background: #eff6ff;
      font-weight: 600;
    }
    
    /* Status Badges */
    .tier-pill {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
    }
    .tier-pill.critical { background: #fee2e2; color: #991b1b; }
    .tier-pill.high { background: #ffedd5; color: #ea580c; }
    .tier-pill.moderate { background: #fef3c7; color: #d97706; }
    .tier-pill.low { background: #dcfce7; color: #16a34a; }

    /* Map Page Container */
    .map-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    /* Footer Sign-off Block */
    .signoff-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
    }
    .signoff-box {
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
      font-size: 8pt;
    }
    .disclaimer-text {
      font-size: 7pt;
      color: #64748b;
      line-height: 1.4;
      margin-top: 15px;
      text-align: justify;
    }
  </style>
</head>
<body>

  <!-- ════════════════════════════════════════════════════════
       PAGE 1: OFFICIAL COVER & EXECUTIVE SITUATION OVERVIEW
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">MUNICIPAL CORPORATION OF GREATER MUMBAI (MCGM / BMC)</div>
        <div class="emblem-subtitle">DISASTER MANAGEMENT CELL • EMERGENCY OPERATIONS EXECUTIVE DOSSIER</div>
        <div style="font-size: 8pt; color: #64748b; margin-top: 3px; font-family: monospace;">
          Document ID: <strong>${dossier.dossierId}</strong> • Generated: ${generatedDate} IST
        </div>
      </div>
      <div style="text-align: right;">
        <span class="meta-badge meta-badge-alert">${ex.overallAlertLevel.replace("_", " ")}</span>
        <div style="margin-top: 4px;">
          <span class="meta-badge meta-badge-tier">${meth.readinessTier}</span>
        </div>
      </div>
    </div>

    <div class="callout-box">
      <strong>EXECUTIVE SITUATION SUMMARY:</strong>
      <p style="margin: 4px 0 0 0;">
        Multi-criteria hydrodynamic simulation evaluated for scenario <strong>"${ex.scenarioTitle}"</strong> across all 24 canonical administrative wards of Greater Mumbai over a <strong>T+${ex.selectedHorizonHours}h</strong> forecast horizon. Topographical saucer basins and coastal backpressure were evaluated against Copernicus GLO-30 DEM terrain profiles.
      </p>
    </div>

    <!-- 4 High-Level Key Indicators -->
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Severe Wards</div>
        <div class="metric-value" style="color: #991b1b;">${city.tierDistribution.severeCount}</div>
        <div class="metric-subtext">Score ≥ 80 / 100</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">High Risk Wards</div>
        <div class="metric-value" style="color: #ea580c;">${city.tierDistribution.highCount}</div>
        <div class="metric-subtext">Score 60 - 79 / 100</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Citywide Mean Risk</div>
        <div class="metric-value">${city.citywideMeanScore}</div>
        <div class="metric-subtext">Normalised 0-100 scale</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Screened Population</div>
        <div class="metric-value">~${(city.totalEstimatedExposedPopulation / 1000).toFixed(0)}k</div>
        <div class="metric-subtext">Low-lying contour buffers</div>
      </div>
    </div>

    <h2 class="section-title">
      <span>1. Key Intelligence Findings</span>
      <span style="font-size: 8pt; color: #64748b;">EVIDENCE-BASED SYNTHESIS</span>
    </h2>
    <ul style="padding-left: 18px; margin: 6px 0 14px 0; font-size: 8.5pt;">
      ${ex.keyFindings.map((f) => `<li style="margin-bottom: 5px;">${f}</li>`).join("")}
    </ul>

    <h2 class="section-title">
      <span>2. Highest Priority Intervention Wards</span>
      <span style="font-size: 8pt; color: #64748b;">TOP 5 OF 24</span>
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 45px;">Rank</th>
          <th style="width: 70px;">Ward ID</th>
          <th>Ward Designation</th>
          <th style="width: 75px;">Risk Score</th>
          <th style="width: 80px;">Severity Tier</th>
          <th>Primary Physical Trigger</th>
        </tr>
      </thead>
      <tbody>
        ${ex.highestPriorityWards
          .map(
            (w) => `<tr>
          <td style="font-weight: 800; font-family: monospace;">#${w.rank}</td>
          <td style="font-weight: 700; font-family: monospace;">Ward ${w.wardId}</td>
          <td>${w.wardName}</td>
          <td style="font-weight: 800; font-family: monospace;">${w.score} ${w.unit}</td>
          <td><span class="tier-pill ${w.tier.toLowerCase()}">${w.tier}</span></td>
          <td>${w.primaryTrigger}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2 class="section-title">
      <span>3. Potentially Exposed Municipal Infrastructure</span>
      <span style="font-size: 8pt; color: #64748b;">CRITICAL ASSETS</span>
    </h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      ${ex.mainPotentiallyAffectedAssets
        .map(
          (a) => `<div style="border: 1px solid #e2e8f0; border-radius: 5px; padding: 7px 10px; background: #fafafa;">
        <div style="font-weight: 700; font-size: 8pt; color: #0f172a; display: flex; justify-content: space-between;">
          <span>${a.category}</span>
          <span style="color: #0284c7;">${a.count} assets</span>
        </div>
        <div style="font-size: 7.5pt; color: #334155; margin-top: 3px;">
          ${a.prominentItems.join(", ")}
        </div>
        <div style="font-size: 6.5pt; color: #64748b; margin-top: 3px; font-style: italic;">
          Caveat: ${a.caveat}
        </div>
      </div>`
        )
        .join("")}
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 2: SPATIAL RISK DISTRIBUTION (VECTOR GIS FIGURE)
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">GREATER MUMBAI 24-WARD HYDRODYNAMIC CARTOGRAPHY</div>
        <div class="emblem-subtitle">FIGURE 1.1: MUNICIPAL CHOROPLETH RISK DISTRIBUTION & TOPOGRAPHIC SINK SCREENING</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        T+${ex.selectedHorizonHours}h Simulation Horizon
      </div>
    </div>

    <div class="map-container">
      ${vectorMapSvg}
    </div>

    <div style="font-size: 7.5pt; color: #475569; margin-top: 8px; line-height: 1.4; border-left: 3px solid #0284c7; padding-left: 8px;">
      <strong>Cartographic Note:</strong> Wards are filled according to their calculated waterlogging and drainage surcharge score for the active scenario. Boundaries adhere to canonical BMC administrative boundaries (EPSG:4326). Blue boundary highlights selected ward focus. Shaded contours represent Copernicus GLO-30 DEM depression sinks.
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 3: 24-WARD COMPREHENSIVE TABULAR RESULTS
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">COMPREHENSIVE 24-WARD MUNICIPAL EVALUATION MATRIX</div>
        <div class="emblem-subtitle">SECTION C: ADMINISTRATIVE WARD RANKINGS & POPULATION EXPOSURE</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        24 BMC Administrative Wards
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">Rank</th>
          <th style="width: 55px;">Ward</th>
          <th>Administrative Ward Designation</th>
          <th style="width: 55px;">Score</th>
          <th style="width: 65px;">Severity</th>
          <th style="width: 65px;">Elev (m)</th>
          <th style="width: 85px;">Exposed Pop</th>
          <th style="width: 65px;">Assets</th>
          <th>Primary Trigger</th>
        </tr>
      </thead>
      <tbody>
        ${(dossier.rankedWardsAnalysis || [])
          .map(
            (w, idx) => `<tr class="${wardDetail?.wardId === w.wardId ? "highlight" : ""}">
          <td style="font-weight: 800; font-family: monospace;">#${idx + 1}</td>
          <td style="font-weight: 700; font-family: monospace;">${w.wardId}</td>
          <td>${w.wardName}</td>
          <td style="font-weight: 800; font-family: monospace;">${w.score}</td>
          <td><span class="tier-pill ${w.severityTier.toLowerCase()}">${w.severityTier}</span></td>
          <td style="font-family: monospace; text-align: right;">${w.elevationMeanM}m</td>
          <td style="font-family: monospace; text-align: right;">~${(w.estimatedExposedPopulation || 0).toLocaleString()}</td>
          <td style="font-family: monospace; text-align: center;">${(w.potentiallyExposedHospitals?.length || 0) + (w.potentiallyExposedRoads?.length || 0)}</td>
          <td style="font-size: 7.5pt;">${w.calculationTrace?.slice(0, 50) || "Topographic runoff"}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div style="font-size: 7.5pt; color: #64748b; margin-top: 6px;">
      * Population estimates derive from 2011 Census ward totals adjusted to 2026 BMC projections, intersected with low-lying saucer depression buffer zones.
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 4: WARD FOCUS & ASSET VULNERABILITY
       ════════════════════════════════════════════════════════ -->
  ${
    wardDetail
      ? `<div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">WARD FOCUS: ${wardDetail.wardName.toUpperCase()}</div>
        <div class="emblem-subtitle">SECTION D: TOPOGRAPHIC PROFILE & CRITICAL ASSET EXPOSURE</div>
      </div>
      <div style="text-align: right;">
        <span class="tier-pill ${wardDetail.severityTier.toLowerCase()}" style="font-size: 9pt; padding: 3px 8px;">
          ${wardDetail.severityTier} (${wardDetail.score} / 100)
        </span>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Administrative Zone</div>
        <div class="metric-value" style="font-size: 11pt;">${wardDetail.zone}</div>
        <div class="metric-subtext">${wardDetail.isCoastal ? "Coastal Backwater Zone" : "Inland Catchment"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Mean Ground Elevation</div>
        <div class="metric-value" style="font-size: 13pt;">${wardDetail.elevationMeanM}m</div>
        <div class="metric-subtext">Copernicus GLO-30 ASL</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Depression Hotspots</div>
        <div class="metric-value" style="font-size: 13pt;">${wardDetail.saucerDepressions.length}</div>
        <div class="metric-subtext">Chronic low points</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Exposed Population</div>
        <div class="metric-value" style="font-size: 13pt;">~${wardDetail.estimatedExposedPopulation.toLocaleString()}</div>
        <div class="metric-subtext">of ~${wardDetail.populationEstimateTotal.toLocaleString()} residents</div>
      </div>
    </div>

    <h2 class="section-title">
      <span>Topographical Sinks & Drainage Outfalls</span>
    </h2>
    <div style="margin-bottom: 12px; font-size: 8.5pt;">
      <p style="margin: 0 0 6px 0;"><strong>Drainage Waterways & Basins:</strong> ${wardDetail.waterwaysAndBasins.join(", ")}</p>
      <p style="margin: 0 0 6px 0;"><strong>Depression Sinks:</strong> ${
        wardDetail.saucerDepressions.map((d) => `${d.name} (${d.elevationMinM}m)`).join(", ") || "None identified"
      }</p>
      <p style="margin: 0 0 6px 0;"><strong>Historical Chronic Waterlogging Points:</strong> ${
        wardDetail.historicalHotspots.join(", ") || "None recorded"
      }</p>
    </div>

    <h2 class="section-title">
      <span>Potentially Exposed Medical & Transport Infrastructure</span>
    </h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; background: #fafafa;">
        <h4 style="margin: 0 0 6px 0; font-size: 8pt; text-transform: uppercase; color: #0284c7;">Hospitals in Low-Lying Buffer</h4>
        ${
          wardDetail.potentiallyExposedHospitals.length > 0
            ? wardDetail.potentiallyExposedHospitals
                .map((h) => `<div style="font-size: 7.5pt; margin-bottom: 3px;">• <strong>${h.name}</strong> (${h.type})</div>`)
                .join("")
            : '<div style="font-size: 7.5pt; color: #64748b;">No major hospitals within primary saucer sink buffer.</div>'
        }
      </div>
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; background: #fafafa;">
        <h4 style="margin: 0 0 6px 0; font-size: 8pt; text-transform: uppercase; color: #ea580c;">Major Arterials in Inundation Corridor</h4>
        ${
          wardDetail.potentiallyExposedRoads.length > 0
            ? wardDetail.potentiallyExposedRoads
                .map((r) => `<div style="font-size: 7.5pt; margin-bottom: 3px;">• <strong>${r.name}</strong> (${r.highwayType || "Arterial"})</div>`)
                .join("")
            : '<div style="font-size: 7.5pt; color: #64748b;">No arterial transit arteries intersecting primary depressions.</div>'
        }
      </div>
    </div>

    <div class="callout-box" style="border-left-color: #0284c7;">
      <strong>METHODOLOGY & EXPOSURE CAVEAT:</strong>
      <p style="margin: 2px 0 0 0; font-size: 8pt;">
        Exposure figures represent geographic co-location within digital elevation sink buffers and BRIMSTOWAD catchments. They do not constitute verified flooding or structural damage. Actual inundation is subject to local stormwater drain maintenance, operational dewatering pumps, and real-time gate configurations.
      </p>
    </div>
  </div>`
      : ""
  }

  <!-- ════════════════════════════════════════════════════════
       PAGE 5: METHODOLOGY, FORMULAS & INPUT AUDIT
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">MATHEMATICAL METHODOLOGY & INPUT CONDITIONS</div>
        <div class="emblem-subtitle">SECTION E: FORMULA SPECIFICATION, TERRAIN INTEGRATION & AUDIT TRACE</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        ${meth.modelName} v${meth.modelVersion}
      </div>
    </div>

    <h2 class="section-title">
      <span>1. Mathematical Formulation</span>
      <span style="font-size: 8pt; color: #64748b;">HYDRODYNAMIC SCREENING</span>
    </h2>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 8.5pt; margin-bottom: 12px;">
      <code>${meth.formulaPlain}</code>
    </div>
    <div style="font-size: 8pt; color: #334155; margin-bottom: 14px; line-height: 1.4;">
      <strong>Latex Representation:</strong> <code>${meth.formulaLatex}</code><br/>
      <strong>Baseline Definition:</strong> ${meth.baselineDefinition}<br/>
      <strong>Spatial Resolution:</strong> ${meth.spatialResolution} • <strong>Temporal Resolution:</strong> ${meth.temporalResolution}
    </div>

    <h2 class="section-title">
      <span>2. User-Controlled Scenario Inputs & Observations</span>
      <span style="font-size: 8pt; color: #64748b;">PARAMETER AUDIT</span>
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Input Parameter / Variable</th>
          <th style="width: 80px;">Value</th>
          <th style="width: 65px;">Unit</th>
          <th style="width: 85px;">Status</th>
          <th>Source / Notes</th>
        </tr>
      </thead>
      <tbody>
        ${cond.userControlledInputs
          .map(
            (p) => `<tr>
          <td style="font-weight: 600;">${p.name}</td>
          <td style="font-family: monospace; font-weight: 700;">${p.value}</td>
          <td style="font-family: monospace;">${p.unit}</td>
          <td><span style="font-size: 7pt; font-weight: 700; color: #0284c7;">${p.status}</span></td>
          <td style="font-size: 7.5pt; color: #64748b;">${p.notes || "-"}</td>
        </tr>`
          )
          .join("")}
        ${cond.liveObservations
          .map(
            (o) => `<tr>
          <td style="font-weight: 600;">${o.name} (Live Telemetry)</td>
          <td style="font-family: monospace; font-weight: 700;">${o.value}</td>
          <td style="font-family: monospace;">${o.unit}</td>
          <td><span style="font-size: 7pt; font-weight: 700; color: #16a34a;">${o.status}</span></td>
          <td style="font-size: 7.5pt; color: #64748b;">${o.sourceName}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    ${
      cond.missingOrStaleInputs.length > 0
        ? `<h2 class="section-title" style="border-bottom-color: #ea580c;">
      <span style="color: #ea580c;">3. Missing or Offline Telemetry Feeds</span>
      <span style="font-size: 8pt; color: #ea580c;">HONEST DISCLOSURE</span>
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Variable Name</th>
          <th>Impact on Simulation Model</th>
          <th>Deterministic Fallback Used</th>
        </tr>
      </thead>
      <tbody>
        ${cond.missingOrStaleInputs
          .map(
            (m) => `<tr>
          <td style="font-weight: 700; color: #991b1b;">${m.variable}</td>
          <td style="font-size: 7.5pt;">${m.impactOnModel}</td>
          <td style="font-size: 7.5pt; font-family: monospace;">${m.fallbackUsed}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>`
        : ""
    }
  </div>

  <!-- ════════════════════════════════════════════════════════
       PAGE 6: ACTION DIRECTIVES & STATUTORY GOVERNANCE
       ════════════════════════════════════════════════════════ -->
  <div class="page">
    <div class="official-header">
      <div>
        <div class="emblem-title">RECOMMENDED ACTION DIRECTIVES & STATUTORY DISCLAIMER</div>
        <div class="emblem-subtitle">SECTION F: INTER-AGENCY OPERATIONS & EXECUTIVE SIGN-OFF</div>
      </div>
      <div style="text-align: right; font-size: 8pt; font-family: monospace; color: #64748b;">
        MCGM Inter-Agency Protocols
      </div>
    </div>

    <h2 class="section-title">
      <span>1. Departmental Operational Action Directives</span>
      <span style="font-size: 8pt; color: #64748b;">PRIORITY INTERVENTIONS</span>
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 55px;">Phase</th>
          <th style="width: 50px;">Dept</th>
          <th>Action Title & Directives</th>
          <th style="width: 70px;">Target Wards</th>
          <th style="width: 65px;">Priority</th>
        </tr>
      </thead>
      <tbody>
        ${dossier.recommendedActions
          .map(
            (a) => `<tr>
          <td style="font-weight: 700; font-family: monospace;">${a.phase}</td>
          <td style="font-weight: 800; font-family: monospace; color: #0284c7;">${a.departmentCode}</td>
          <td>
            <strong>${a.title}</strong><br/>
            <span style="font-size: 7pt; color: #475569;">${a.description || a.supportingEvidence || ""}</span>
          </td>
          <td style="font-family: monospace; font-size: 7.5pt;">${a.targetWards.join(", ")}</td>
          <td><span class="tier-pill ${a.priority.toLowerCase()}">${a.priority}</span></td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2 class="section-title">
      <span>2. AI Governance & Data Provenance</span>
      <span style="font-size: 8pt; color: #64748b;">AUDIT TRACE</span>
    </h2>
    <div style="font-size: 7.5pt; color: #334155; line-height: 1.4; margin-bottom: 14px;">
      <strong>AI Orchestration State:</strong> <code>${gov.aiGovernance.overallAIState}</code> (${gov.aiGovernance.orchestrationDurationMs} ms)<br/>
      <strong>Role 1 (Evidence Analyst):</strong> ${gov.aiGovernance.role1EvidenceAnalyst.status} (${gov.aiGovernance.role1EvidenceAnalyst.modelUsed})<br/>
      <strong>Role 2 (Impact Analyst):</strong> ${gov.aiGovernance.role2ImpactAnalyst.status} (${gov.aiGovernance.role2ImpactAnalyst.modelUsed})<br/>
      <strong>Role 3 (Report Editor):</strong> ${gov.aiGovernance.role3ReportEditor.status} (${gov.aiGovernance.role3ReportEditor.modelUsed})
    </div>

    <!-- Executive Sign-Off Grid -->
    <div class="signoff-grid">
      <div class="signoff-box">
        <div style="font-weight: 800; text-transform: uppercase;">PREPARED BY:</div>
        <div style="margin-top: 4px;">Senior GIS & Hydrological Modeller</div>
        <div style="color: #64748b;">Disaster Management Support Group, MCGM</div>
        <div style="margin-top: 25px; border-bottom: 1px dotted #94a3b8; width: 80%;"></div>
        <div style="font-size: 6.5pt; color: #64748b; margin-top: 3px;">Signature & Municipal Seal</div>
      </div>
      <div class="signoff-box">
        <div style="font-weight: 800; text-transform: uppercase;">EXECUTIVE REVIEW & AUTHORISATION:</div>
        <div style="margin-top: 4px;">Director / Additional Municipal Commissioner</div>
        <div style="color: #64748b;">Disaster Management Department, MCGM Head Office</div>
        <div style="margin-top: 25px; border-bottom: 1px dotted #94a3b8; width: 80%;"></div>
        <div style="font-size: 6.5pt; color: #64748b; margin-top: 3px;">Authorisation Signature</div>
      </div>
    </div>

    <div class="disclaimer-text">
      <strong>STATUTORY DISCLAIMER & LIMITATIONS:</strong>
      This document constitutes a computerized multi-criteria hydrodynamic screening evaluation based on digital elevation modeling (Copernicus GLO-30 DEM) and BRIMSTOWAD storm drainage catchments. It is designed to assist administrative situational awareness and pre-positioning. It does NOT constitute an automated municipal proclamation, legal evacuation order, or public emergency dispatch. Official deployment of personnel, equipment, and public alarms requires formal sign-off by the Municipal Commissioner or designated Disaster Management Officer.
    </div>
  </div>

</body>
</html>`;
}
