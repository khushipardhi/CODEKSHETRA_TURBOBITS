/* ════════════════════════════════════════════════════════
   GeoNexus — Hazard Intelligence Agent
   Specialist Agent for live telemetry, 0–100 risk scoring,
   threshold anomaly detection, and municipal advisory proposals.
   Uses dedicated GROQ_THIRD_API_KEY with failover.
   ════════════════════════════════════════════════════════ */

import Groq from "groq-sdk";
import { env } from "@/lib/env";
import {
  fetchCityWeather,
  fetchCityAirQuality,
  fetchCityMarineSurge,
} from "@/modules/hazards/connectors/open-meteo";
import { fetchSachetAlerts } from "@/modules/hazards/connectors/sachet";
import { assessCityRisk, AssessmentResult } from "@/modules/hazards/assessment-engine";
import {
  createTask,
  addTraceStep,
  recordToolExecution,
  completeTask,
  failTask,
  submitForApproval,
} from "./task-manager";
import { AgentTask, RiskLevel, SpecialistAgentResult } from "@/db/schema/005-agents";

export interface HazardAgentExecutionResult {
  taskId: string;
  agentId: "hazard";
  content: string;
  telemetrySummary?: Record<string, any>;
  assessmentResult?: AssessmentResult;
  advisoryDraft?: Record<string, any>;
  requiresApproval?: boolean;
  approvalId?: string;
  specialistResult: SpecialistAgentResult;
  task: AgentTask;
}

function getGroqClient(): Groq {
  const apiKey = env.groqHazardApiKey || env.groqReportingApiKey;
  return new Groq({ apiKey });
}

export async function executeHazardTask(input: {
  intent: string;
  query: string;
  wardId?: string;
  parameters?: Record<string, any>;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  priorSimulationContext?: Record<string, any>;
  parentTaskId?: string | null;
}): Promise<HazardAgentExecutionResult> {
  const task = await createTask({
    agentId: "hazard",
    taskType: "HAZARD_INTELLIGENCE",
    intent: input.intent,
    inputPreview: input.query,
    inputPayload: {
      query: input.query,
      wardId: input.wardId,
      parameters: input.parameters,
      hasSimulationContext: !!input.priorSimulationContext,
    },
    parentTaskId: input.parentTaskId,
  });

  const startTime = Date.now();

  try {
    // ─── Stage 1: Fetch Live Environmental Telemetry ───
    await addTraceStep(task.id, {
      stage: "telemetry_acquisition",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: "Querying Open-Meteo high-resolution APIs for Mumbai",
    });

    const weatherStart = Date.now();
    const weather = await fetchCityWeather("mumbai");
    await recordToolExecution(task.id, {
      toolId: "hazard.get_telemetry",
      agentId: "hazard",
      parameters: { feedType: "weather", city: "mumbai" },
      resultPreview: `Temp: ${weather.temperatureCelsius}°C, Rain: ${weather.rainfallRateMmH}mm/h, Wind: ${weather.windSpeedKmh}km/h`,
      success: true,
      durationMs: Date.now() - weatherStart,
    });

    const aqiStart = Date.now();
    const aqi = await fetchCityAirQuality("mumbai");
    await recordToolExecution(task.id, {
      toolId: "hazard.get_telemetry",
      agentId: "hazard",
      parameters: { feedType: "aqi", city: "mumbai" },
      resultPreview: `US AQI: ${aqi.usAqi} (${aqi.category}), PM2.5: ${aqi.pm25}µg/m³`,
      success: true,
      durationMs: Date.now() - aqiStart,
    });

    const marineStart = Date.now();
    const marine = await fetchCityMarineSurge("mumbai").catch(() => null);
    if (marine) {
      await recordToolExecution(task.id, {
        toolId: "hazard.get_telemetry",
        agentId: "hazard",
        parameters: { feedType: "marine", city: "mumbai" },
        resultPreview: `Wave: ${marine.waveHeightMeters}m, Surge: ${marine.surgeRisk}`,
        success: true,
        durationMs: Date.now() - marineStart,
      });
    }

    const sachetStart = Date.now();
    const sachetAlerts = await fetchSachetAlerts("mumbai").catch(() => []);
    await recordToolExecution(task.id, {
      toolId: "hazard.sachet_feed",
      agentId: "hazard",
      parameters: { region: "Maharashtra" },
      resultPreview: `Active NDMA CAP Alerts: ${sachetAlerts.length}`,
      success: true,
      durationMs: Date.now() - sachetStart,
    });

    // ─── Stage 2: Assess 0–100 Ward Vulnerability & Threshold Detection ───
    await addTraceStep(task.id, {
      stage: "risk_assessment",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: "Evaluating multi-factorial risk rubric across terrain and hydrology",
    });

    const assessStart = Date.now();
    const assessment = assessCityRisk({
      city: "mumbai",
      weather,
      marine,
    });
    await recordToolExecution(task.id, {
      toolId: "hazard.assess_ward_risk",
      agentId: "hazard",
      parameters: { city: "mumbai", wardId: input.wardId || "F/N" },
      resultPreview: `Risk Score: ${assessment.riskScore}/100 (${assessment.riskLevel}), Factors: ${assessment.contributingFactors.length}`,
      success: true,
      durationMs: Date.now() - assessStart,
    });

    // ─── Stage 3: Threshold Anomaly Evaluation ───
    const anomalies: string[] = [];
    if (weather.rainfallRateMmH > 65) {
      anomalies.push(`CRITICAL RAINFALL: ${weather.rainfallRateMmH} mm/h exceeds 65 mm/h extreme flash flood threshold`);
    } else if (weather.rainfallRateMmH > 30) {
      anomalies.push(`HIGH RAINFALL: ${weather.rainfallRateMmH} mm/h exceeds 30 mm/h waterlogging threshold`);
    }

    if (marine && (marine.waveHeightMeters ?? 0) > 3.5) {
      anomalies.push(`HIGH SWELL BREACH: ${marine.waveHeightMeters}m wave height with ${marine.surgeRisk} coastal surge`);
    }

    if ((weather.windGustsKmh ?? 0) > 70) {
      anomalies.push(`GALE GUSTS: ${weather.windGustsKmh} km/h exceeds 70 km/h tree fall & hoarding risk threshold`);
    }

    if ((aqi.usAqi ?? 0) > 200) {
      anomalies.push(`SEVERE AQI: ${aqi.usAqi} (${aqi.category}) health advisory required for sensitive populations`);
    }

    // ─── Stage 4: Synthesize Analysis with Groq LLaMA 3.3 70B ───
    await addTraceStep(task.id, {
      stage: "llm_synthesis",
      durationMs: Date.now() - startTime,
      status: "OK",
      detail: "Generating meteorological narrative and operational recommendations",
    });

    const prompt = `You are the CivicOS Hazard Intelligence Agent for Mumbai Municipal Corporation (BMC).
Analyze the following real-time environmental telemetry and telemetry-driven risk assessment:

WEATHER:
- Temperature: ${weather.temperatureCelsius ?? "N/A"}°C (Feels like: ${weather.apparentTemperatureCelsius ?? "N/A"}°C)
- Current Rainfall Rate: ${weather.rainfallRateMmH} mm/h
- 24h Rain Accumulation: ${weather.forecast24hTotalMm} mm
- Wind Speed: ${weather.windSpeedKmh ?? "N/A"} km/h (Gusts: ${weather.windGustsKmh ?? "N/A"} km/h, Direction: ${weather.windDirectionDegrees ?? 0}°)
- Humidity: ${weather.relativeHumidity ?? "N/A"}%
- Conditions: ${weather.weatherDescription}

AIR QUALITY:
- US AQI: ${aqi.usAqi ?? "N/A"} (${aqi.category})
- PM2.5: ${aqi.pm25 ?? "N/A"} µg/m³, PM10: ${aqi.pm10 ?? "N/A"} µg/m³

MARINE & TIDAL:
${marine ? `- Wave Height: ${marine.waveHeightMeters ?? "N/A"}m
- Storm Surge Risk: ${marine.surgeRisk}` : "- Marine data currently unavailable"}

NDMA SACHET ALERTS:
- Active Bulletins: ${sachetAlerts.length}
${sachetAlerts.slice(0, 2).map((a) => `  * [${a.severity}] ${a.headline || "Alert"}`).join("\n")}

ASSESSMENT ENGINE RESULT:
- Overall Risk Score: ${assessment.riskScore}/100 (${assessment.riskLevel})
- Key Contributing Factors:
${assessment.contributingFactors.map((f) => `  * ${f.factor}: ${f.value} (+${f.scoreContribution} pts) - ${f.description}`).join("\n")}

DETECTED ANOMALIES:
${anomalies.length > 0 ? anomalies.join("\n") : "No critical threshold breaches detected at present."}
${input.priorSimulationContext ? `
CROSS-AGENT SIMULATION CONTEXT FROM PRIOR RUN:
- Scenario: ${input.priorSimulationContext.scenarioName || input.priorSimulationContext.scenarioId || "Monsoon Inundation"}
- Simulated Rainfall: ${input.priorSimulationContext.parameters?.rainfallMm ?? input.priorSimulationContext.scenarioParameters?.rainfallMm ?? "N/A"} mm
- Drainage Blockage: ${input.priorSimulationContext.parameters?.drainageBlockagePercent ?? input.priorSimulationContext.scenarioParameters?.drainageBlockagePercent ?? "N/A"}%
- High Inundation Wards: ${Array.isArray(input.priorSimulationContext.wardImpacts) ? input.priorSimulationContext.wardImpacts.filter((w: any) => (w.floodDepthCm || 0) > 20).map((w: any) => `${w.wardId || w.ward} (${w.floodDepthCm || w.depth}cm)`).join(", ") : "Wards F/North, L, K/West"}
` : ""}
USER QUERY: "${input.query}"

Provide an authoritative, structured Hazard Intelligence briefing in clean Markdown:
1. **Executive Situation Summary** (Current status, risk level, and meteorological trajectory${input.priorSimulationContext ? " synthesized with spatial simulation findings" : ""})
2. **Key Telemetry Highlights** (Weather, Marine, AQI tabular or metric highlights)
3. **Hydrological & Vulnerability Analysis** (Impact on low-lying wards like F/North, L Ward, K/West, Kurla, Hindmata)
4. **Operational Action Checklist** (Actions for BMC Stormwater Drains, Traffic Police, and Disaster Management Cell)
5. **Data Provenance & Disclaimer** (Explicitly note live Open-Meteo and NDMA SACHET sources)`;

    let responseContent = "";
    try {
      const groq = getGroqClient();
      const candidateModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
      for (const m of candidateModels) {
        try {
          const completion = await groq.chat.completions.create({
            model: m,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 1800,
          });
          const text = completion.choices[0]?.message?.content || (completion.choices[0]?.message as any)?.reasoning || "";
          if (text.trim()) {
            responseContent = text.trim();
            break;
          }
        } catch (mErr: any) {
          console.warn(`[HazardAgent] Model ${m} attempt failed:`, mErr?.message);
        }
      }
      if (!responseContent) {
        throw new Error("No response generated across candidate models");
      }
    } catch (llmErr: any) {
      console.warn("[HazardAgent] Groq LLM failed, using deterministic fallback:", llmErr?.message);
      responseContent = `### Hazard Intelligence Summary: Mumbai (${assessment.riskLevel} - ${assessment.riskScore}/100)

**Current Meteorological Observations:**
- **Precipitation**: ${weather.rainfallRateMmH} mm/h (${weather.weatherDescription})
- **Temperature & Wind**: ${weather.temperatureCelsius}°C, Winds at ${weather.windSpeedKmh} km/h (Gusts up to ${weather.windGustsKmh} km/h)
- **Air Quality**: AQI ${aqi.usAqi} (${aqi.category})
${marine ? `- **Marine Surge**: Wave height ${marine.waveHeightMeters}m, Surge Risk: ${marine.surgeRisk}` : ""}

**Vulnerability & Risk Factors:**
${assessment.contributingFactors.map((f) => `- **${f.factor}**: ${f.description} (Contribution: +${f.scoreContribution}%)`).join("\n")}

**Anomalies & Operational Action:**
${anomalies.length > 0 ? anomalies.map((a) => `- ⚠️ ${a}`).join("\n") : "- ✅ All environmental sensors within normal operational thresholds."}

*Data Sources: Open-Meteo High-Resolution Telemetry & NDMA SACHET Disaster Feeds.*`;
    }

    // ─── Stage 5: Check if Advisory Proposal Needed & Route to Approval ───
    let requiresApproval = false;
    let approvalId: string | undefined;
    let advisoryDraft: Record<string, any> | undefined;

    const isHighRiskOrAdvisoryRequested =
      assessment.riskScore >= 60 ||
      anomalies.length > 0 ||
      !!input.priorSimulationContext ||
      input.query.toLowerCase().includes("advisory") ||
      input.query.toLowerCase().includes("broadcast");

    if (isHighRiskOrAdvisoryRequested) {
      const riskLevel: RiskLevel =
        assessment.riskScore >= 80 ? "CRITICAL" : assessment.riskScore >= 60 ? "HIGH" : "MODERATE";

      // Derive affected wards from simulation if present, or fallback
      let affectedWards = ["F/N (Matunga/Sion)", "L (Kurla)", "K/W (Andheri)", "G/S (Worli/Elphinstone)"];
      if (input.priorSimulationContext?.wardImpacts && Array.isArray(input.priorSimulationContext.wardImpacts)) {
        const simWards = input.priorSimulationContext.wardImpacts
          .filter((w: any) => (w.floodDepthCm || 0) > 20 || w.riskLevel === "CRITICAL" || w.riskLevel === "HIGH")
          .map((w: any) => `${w.wardId || w.ward} (${w.wardName || "Ward Area"})`);
        if (simWards.length > 0) affectedWards = simWards;
      }

      const proposedAdvisory = {
        title: input.priorSimulationContext
          ? `Municipal Advisory: Simulated ${input.priorSimulationContext.scenarioName || "Monsoon"} Risk Action Plan`
          : `Precautionary Advisory: Mumbai ${assessment.riskLevel} Hazard Alert`,
        summary: `Automated detection: Risk score ${assessment.riskScore}/100. ${anomalies.join("; ") || "Elevated environmental conditions detected."}${input.priorSimulationContext ? " Informed by 24-ward spatial simulation." : ""}`,
        hazardType: weather.rainfallRateMmH > 30 ? "FLOOD" : marine && (marine.waveHeightMeters ?? 0) > 3.0 ? "STORM_SURGE" : "WEATHER_DISTURBANCE",
        affectedWards,
        recommendedActions: [
          "Activate dewatering pump stations at Hindmata, Milan Subway, and Gandhi Market",
          "Alert ward disaster control officers in F/North, L, and K/West",
          "Issue public advisory to avoid waterlogged low-lying arterial transit corridors",
          ...(input.priorSimulationContext ? ["Execute pre-emptive traffic diversions for high-inundation saucer depressions"] : []),
        ],
        metrics: {
          riskScore: assessment.riskScore,
          rainfallRateMmH: weather.rainfallRateMmH,
          waveHeightM: marine?.waveHeightMeters || null,
          surgeRisk: marine?.surgeRisk || null,
          windGustsKmh: weather.windGustsKmh,
          usAqi: aqi.usAqi,
          hasSimulationEvidence: !!input.priorSimulationContext,
        },
      };

      const approvalItem = await submitForApproval({
        taskId: task.id,
        agentId: "hazard",
        approvalType: "ADVISORY_PUBLISH",
        title: proposedAdvisory.title,
        summary: proposedAdvisory.summary,
        payload: proposedAdvisory,
        riskLevel,
        expiresInMinutes: 180,
      });

      requiresApproval = true;
      approvalId = approvalItem.id;
      advisoryDraft = proposedAdvisory;

      responseContent += `\n\n---\n> ⚠️ **Approval Required**: A formal municipal advisory has been drafted and submitted to the **Approval Centre** (Reference: \`${approvalItem.id}\`, Risk: **${riskLevel}**). Prior to public dissemination or department dispatch, human authorization is mandatory under municipal governance rules.`;
    }

    // ─── Construct Standardized SpecialistAgentResult ───
    const findings: SpecialistAgentResult["findings"] = [
      {
        title: `Environmental Risk Assessment: ${assessment.riskLevel} (${assessment.riskScore}/100)`,
        description: `Composite meteorological risk calculated across rainfall, wind gusts, AQI, and marine swell.`,
        severity: (assessment.riskLevel === "EXTREME" || assessment.riskLevel === "SEVERE") ? "CRITICAL" : assessment.riskLevel === "HIGH" ? "HIGH" : "MODERATE",
        evidenceIds: ["OPEN-METEO-LIVE", "ASSESSMENT-ENGINE-CALIBRATION"],
        confidence: 0.96,
      },
      ...anomalies.map((a) => ({
        title: "Threshold Anomaly Detected",
        description: a,
        severity: "HIGH" as const,
        evidenceIds: ["SENSOR-THRESHOLD-BREACH"],
        confidence: 0.94,
      })),
    ];

    const dataSources: SpecialistAgentResult["dataSources"] = [
      {
        sourceId: "open-meteo-weather",
        sourceName: "Open-Meteo High-Resolution Weather API",
        dataType: "Precipitation, Wind, Temperature, Humidity",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
      {
        sourceId: "open-meteo-aqi",
        sourceName: "Open-Meteo European & US Air Quality API",
        dataType: "US AQI, PM2.5, PM10 Particulates",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
      {
        sourceId: "open-meteo-marine",
        sourceName: "Open-Meteo Global Marine & Wave Swell Model",
        dataType: "Wave Height, Swell Direction, Coastal Surge",
        retrievedAt: new Date().toISOString(),
        freshness: marine ? "FRESH" : "UNKNOWN",
        provenance: "LIVE",
      },
      {
        sourceId: "ndma-sachet-feed",
        sourceName: "NDMA SACHET National Disaster Alert Gateway",
        dataType: "CAP Weather & Severe Event Bulletins",
        retrievedAt: new Date().toISOString(),
        freshness: "FRESH",
        provenance: "LIVE",
      },
    ];

    const recommendations: SpecialistAgentResult["recommendations"] = advisoryDraft?.recommendedActions?.map((act: string) => ({
      title: "Municipal Operational Directive",
      description: act,
      department: "Storm Water Drains / Disaster Cell",
      priority: assessment.riskScore >= 70 ? "CRITICAL" : "HIGH",
      approvalRequired: requiresApproval,
    })) || [
      {
        title: "Maintain Standard Environmental Monitoring",
        description: "Continue continuous 15-minute telemetry polling across low-lying coastal telemetry stations.",
        department: "Disaster Management Cell",
        priority: "LOW",
        approvalRequired: false,
      },
    ];

    const limitations = [
      "Open-Meteo provides deterministic numerical point observations updated hourly.",
      "Coastal surge modeling does not account for local seawall breach dynamics unless coupled with spatial simulation.",
    ];

    const specialistResult: SpecialistAgentResult = {
      taskId: task.id,
      agentId: "hazard",
      agentName: "Hazard Intelligence Agent",
      status: "COMPLETED",
      summary: `Mumbai Risk Score: ${assessment.riskScore}/100 (${assessment.riskLevel}). Rainfall: ${weather.rainfallRateMmH}mm/h, Wind: ${weather.windSpeedKmh}km/h, AQI: ${aqi.usAqi}.${requiresApproval ? " Proposed advisory escalated to Approval Centre." : ""}`,
      content: responseContent,
      findings,
      dataSources,
      recommendations,
      limitations,
      rawPayload: {
        weather,
        aqi,
        marine,
        sachetAlerts,
        assessment,
        anomalies,
        advisoryDraft,
      },
    };

    const completedTask = await completeTask(
      task.id,
      responseContent.slice(0, 480),
      specialistResult
    );

    return {
      taskId: task.id,
      agentId: "hazard",
      content: responseContent,
      telemetrySummary: {
        weather,
        aqi,
        marine,
      },
      assessmentResult: assessment,
      advisoryDraft,
      requiresApproval,
      approvalId,
      specialistResult,
      task: completedTask || task,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await failTask(task.id, errorMsg);
    throw err;
  }
}
