/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Dossier Export Utilities
   Formats: Markdown, Structured JSON, Municipal CSV
   ════════════════════════════════════════════════════════ */

import type { CanonicalSimulationDossier } from "./contracts";

export function exportDossierToMarkdown(dossier: CanonicalSimulationDossier): string {
  const ex = dossier.executiveSummary;
  const cond = dossier.conditionsAndInputs;
  const meth = dossier.methodologyAndCalculation;
  const city = dossier.citywideAssessment;
  const gov = dossier.limitationsAndGovernance;

  return `# SENTINEL CITY INTELLIGENCE — CANONICAL SIMULATION DOSSIER
**Document ID:** ${dossier.dossierId}  
**Jurisdiction:** ${ex.city} — ${ex.municipalAuthority}  
**Scenario:** ${ex.scenarioTitle} (${ex.scenarioType})  
**Simulation Horizon:** T+${ex.selectedHorizonHours}h (${ex.timeZone})  
**Overall Municipal Alert:** ${ex.overallAlertLevel}  
**Generated At:** ${dossier.generatedAtIso}  
**Schema Version:** ${dossier.schemaVersion}  

---

## SECTION A: EXECUTIVE SUMMARY
${dossier.limitationsAndGovernance.aiGovernance.role3ReportEditor.status === "OPERATIONAL"
  ? ex.keyFindings.join("\n\n")
  : "Multi-criteria hazard screening evaluation completed across Mumbai's 24 administrative wards."}

### Top 5 Priority Intervention Wards
| Rank | Ward ID | Ward Name | Score | Tier | Primary Trigger |
| :--- | :--- | :--- | :--- | :--- | :--- |
${ex.highestPriorityWards
  .map(
    (w) =>
      `| #${w.rank} | **Ward ${w.wardId}** | ${w.wardName} | **${w.score} ${w.unit}** | ${w.tier} | ${w.primaryTrigger} |`
  )
  .join("\n")}

### Main Potentially Affected Infrastructure Categories
${ex.mainPotentiallyAffectedAssets
  .map(
    (a) =>
      `- **${a.category} (${a.count} identified):** ${a.prominentItems.join(", ")}  \n  *Caveat:* ${a.caveat}`
  )
  .join("\n")}

---

## SECTION B: CONDITIONS AND INPUTS

### 1. Live Observations
| Variable | Value | Unit | Source | Status |
| :--- | :--- | :--- | :--- | :--- |
${cond.liveObservations
  .map((o) => `| ${o.name} | ${o.value} | ${o.unit} | ${o.sourceName} | ${o.status} |`)
  .join("\n")}

### 2. User-Controlled Scenario Parameters
| Parameter | Value | Unit | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
${cond.userControlledInputs
  .map((p) => `| ${p.name} | **${p.value}** | ${p.unit} | ${p.status} | ${p.notes || "-"} |`)
  .join("\n")}

### 3. Missing or Uncalibrated Inputs
${cond.missingOrStaleInputs
  .map(
    (m) =>
      `- **${m.variable}:** ${m.impactOnModel} (*Fallback:* ${m.fallbackUsed})`
  )
  .join("\n")}

---

## SECTION C: METHODOLOGY AND CALCULATION TRACE
**Model:** ${meth.modelName} (Version ${meth.modelVersion}, ${meth.readinessTier})  
**Formula:** \`${meth.formulaPlain}\`  
**Latex:** \`${meth.formulaLatex}\`  
**Baseline Definition:** ${meth.baselineDefinition}  
**Spatial Resolution:** ${meth.spatialResolution}  
**Temporal Coverage:** ${meth.temporalResolution}  

${
  meth.selectedWardCalculationTrace
    ? `### Selected Ward Calculation: ${meth.selectedWardCalculationTrace.wardName} (Ward ${meth.selectedWardCalculationTrace.wardId})
${meth.selectedWardCalculationTrace.stepByStepCalculations.map((s) => `- ${s}`).join("\n")}
**Baseline Delta:** ${meth.selectedWardCalculationTrace.baselineComparison}
`
    : ""
}

---

## SECTION D: CITY-WIDE ASSESSMENT
- **Total Wards Evaluated:** ${city.totalWardsEvaluated} (100% of canonical Greater Mumbai wards)
- **Severe Tier Count:** ${city.tierDistribution.severeCount} wards
- **High Tier Count:** ${city.tierDistribution.highCount} wards
- **Moderate Tier Count:** ${city.tierDistribution.moderateCount} wards
- **Citywide Mean Score:** ${city.citywideMeanScore} / 100
- **Peak Ward:** ${city.peakWard.wardName} (${city.peakWard.score} / 100)
- **Estimated Population in Low-Lying Screening Buffers:** ~${city.totalEstimatedExposedPopulation.toLocaleString()} residents
  *(Methodology: ${city.populationExposureMethodology})*

---

## SECTION E: WARD-WISE DETAILED ANALYSIS
${
  dossier.wardDetailedAnalysis
    ? `### Detailed Analysis for ${dossier.wardDetailedAnalysis.wardName} (Ward ${dossier.wardDetailedAnalysis.wardId})
- **Zone:** ${dossier.wardDetailedAnalysis.zone}
- **Mean Elevation:** ${dossier.wardDetailedAnalysis.elevationMeanM}m ASL
- **Coastal Exposure:** ${dossier.wardDetailedAnalysis.isCoastal ? "Yes (Coastal Backwater Zone)" : "Inland Basin"}
- **Drainage Basins & Waterways:** ${dossier.wardDetailedAnalysis.waterwaysAndBasins.join(", ")}
- **Topographic Sinks:** ${dossier.wardDetailedAnalysis.saucerDepressions.map((d) => `${d.name} (${d.elevationMinM}m)`).join(", ") || "None"}
- **Score:** ${dossier.wardDetailedAnalysis.score} / 100 (${dossier.wardDetailedAnalysis.severityTier})
- **Historical Hotspots:** ${dossier.wardDetailedAnalysis.historicalHotspots.join(", ") || "None"}
- **Potentially Exposed Hospitals:** ${dossier.wardDetailedAnalysis.potentiallyExposedHospitals.map((h) => `${h.name} (${h.type})`).join(", ") || "None"}
- **Potentially Exposed Arterials:** ${dossier.wardDetailedAnalysis.potentiallyExposedRoads.map((r) => r.name).join(", ") || "None"}
- **Exposed Population Estimate:** ~${dossier.wardDetailedAnalysis.estimatedExposedPopulation.toLocaleString()} of ${dossier.wardDetailedAnalysis.populationEstimateTotal.toLocaleString()} residents
`
    : ""
}

---

## SECTION F: RECOMMENDED MUNICIPAL ACTIONS
| Phase | Dept | Action Title | Target Wards | Priority | Prerequisites |
| :--- | :--- | :--- | :--- | :--- | :--- |
${dossier.recommendedActions
  .map(
    (a) =>
      `| ${a.phase} | **${a.departmentCode}** | ${a.title} | ${a.targetWards.join(", ")} | **${a.priority}** | ${a.prerequisites.join("; ")} |`
  )
  .join("\n")}

*Note: ${dossier.recommendedActions[0]?.nonDispatchDisclaimer || "Advisory actions for administrative review."}*

---

## SECTION G: DATA PROVENANCE, AI GOVERNANCE & DISCLAIMERS

### AI Governance & Role Verification
- **Role 1 (Evidence Analyst):** ${gov.aiGovernance.role1EvidenceAnalyst.status} (${gov.aiGovernance.role1EvidenceAnalyst.modelUsed})
- **Role 2 (Impact & Operations Analyst):** ${gov.aiGovernance.role2ImpactAnalyst.status} (${gov.aiGovernance.role2ImpactAnalyst.modelUsed})
- **Role 3 (Report Editor & Quality Reviewer):** ${gov.aiGovernance.role3ReportEditor.status} (${gov.aiGovernance.role3ReportEditor.modelUsed})
- **Overall AI Orchestration State:** \`${gov.aiGovernance.overallAIState}\` (${gov.aiGovernance.orchestrationDurationMs} ms)

### Authoritative Data Sources Cited
${gov.sourceReferences
  .map((s) => `- **[${s.id}]** *${s.title}* — ${s.publisher} (${s.licenseOrProvenance})`)
  .join("\n")}

### Scientific & Operational Disclaimers
${gov.scientificDisclaimers.map((d) => `> **DISCLAIMER:** ${d}`).join("\n\n")}

> **ADMINISTRATIVE NOTICE:** ${gov.administrativeDisclaimer}
`;
}

export function exportDossierToCSV(dossier: CanonicalSimulationDossier): string {
  const lines: string[] = [];

  lines.push(`"# SENTINEL CITY INTELLIGENCE — SIMULATION DOSSIER CSV"`);
  lines.push(`"Dossier ID","${dossier.dossierId}"`);
  lines.push(`"Generated At","${dossier.generatedAtIso}"`);
  lines.push(`"Scenario","${dossier.executiveSummary.scenarioTitle}"`);
  lines.push(`"Horizon","T+${dossier.timeStepHours}h"`);
  lines.push(`"Alert Level","${dossier.executiveSummary.overallAlertLevel}"`);
  lines.push(`"Peak Ward","${dossier.citywideAssessment.peakWard.wardName}"`);
  lines.push(`"Citywide Mean Score","${dossier.citywideAssessment.citywideMeanScore}"`);
  lines.push(`"Total Buffer Exposed Population","${dossier.citywideAssessment.totalEstimatedExposedPopulation}"`);
  lines.push(``);

  lines.push(`"# SECTION: APPLIED SCENARIO PARAMETERS"`);
  lines.push(`"Parameter Key","Label","Value","Unit","Category"`);
  for (const p of dossier.conditionsAndInputs.userControlledInputs) {
    lines.push(`"${p.id}","${p.name}","${p.value}","${p.unit}","${p.category}"`);
  }
  lines.push(``);

  lines.push(`"# SECTION: WARD-BY-WARD EVALUATION (24 MCGM ADMINISTRATIVE WARDS)"`);
  lines.push(
    `"Rank","Ward ID","Ward Name","Zone","Elevation (m ASL)","Is Coastal","Score (0-100)","Severity Tier","Baseline Score","Delta %","Total Pop (2011/2026)","Buffer Exposed Pop","Chronic Hotspots Count","Hospitals in Proximity","Roads in Proximity"`
  );

  for (let i = 0; i < dossier.rankedWardsAnalysis.length; i++) {
    const w = dossier.rankedWardsAnalysis[i];
    lines.push(
      `"${i + 1}","${w.wardId}","${w.wardName}","${w.zone}","${w.elevationMeanM}","${w.isCoastal ? "YES" : "NO"}","${w.score}","${w.severityTier}","${w.baselineValue}","+${w.deltaPercent.toFixed(1)}%","${w.populationEstimateTotal}","${w.estimatedExposedPopulation}","${w.historicalHotspots.length}","${w.potentiallyExposedHospitals.length}","${w.potentiallyExposedRoads.length}"`
    );
  }
  lines.push(``);

  lines.push(`"# SECTION: ACTIONABLE MUNICIPAL RECOMMENDATIONS"`);
  lines.push(`"ID","Phase","Department","Title","Priority","Target Wards","Prerequisites"`);
  for (const a of dossier.recommendedActions) {
    lines.push(
      `"${a.id}","${a.phase}","${a.departmentCode}","${a.title.replace(/"/g, '""')}","${a.priority}","${a.targetWards.join("; ")}","${a.prerequisites.join("; ").replace(/"/g, '""')}"`
    );
  }

  return lines.join("\n");
}
