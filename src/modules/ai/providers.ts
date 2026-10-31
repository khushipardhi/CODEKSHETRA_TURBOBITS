/* ════════════════════════════════════════════════════════
   AI Provider Interfaces
   Provider-agnostic contracts for STT and incident analysis
   ════════════════════════════════════════════════════════ */

import type { IncidentAnalysis } from "../incidents/domain/types";

/** Speech-to-Text provider contract */
export interface SpeechToTextProvider {
  readonly providerName: string;

  /** Transcribe audio from a storage reference */
  transcribe(params: {
    audioStorageKey: string;
    mimeType: string;
    languageHint?: string;
  }): Promise<TranscriptionResult>;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  durationMs: number;
  provider: string;
}

/** Incident Analysis provider contract */
export interface IncidentAnalysisProvider {
  readonly providerName: string;

  /** Analyze text input and return structured analysis */
  analyze(params: {
    transcript: string;
    locationContext?: string;
    existingEntities?: Record<string, unknown>;
    schemaVersion: string;
  }): Promise<AnalysisProviderResult>;
}

export interface AnalysisProviderResult {
  analysis: IncidentAnalysis;
  provider: string;
  model: string;
  promptVersion: string;
  rawConfidence: number;
  processingTimeMs: number;
}

/** Deterministic fixture provider for development/demo */
export class FixtureSpeechToTextProvider implements SpeechToTextProvider {
  readonly providerName = "fixture";

  async transcribe(): Promise<TranscriptionResult> {
    return {
      text: "There is a large pothole on the main road near Dharampeth. It has been there for several days and is causing damage to vehicles.",
      language: "en",
      confidence: 0.95,
      durationMs: 8500,
      provider: "fixture",
    };
  }
}

export class FixtureIncidentAnalysisProvider
  implements IncidentAnalysisProvider
{
  readonly providerName = "fixture";

  async analyze(): Promise<AnalysisProviderResult> {
    return {
      analysis: {
        categorySlug: "road-damage",
        subcategorySlug: "pothole",
        title: "Large pothole on main road causing traffic hazard",
        citizenSummary:
          "We understood your problem as a large pothole on the road near your described location. This is causing traffic disruption and could potentially damage vehicles.",
        internalSummary:
          "Citizen reports a significant pothole on a main road in Dharampeth area, present for multiple days. Vehicle damage reported. Likely requires Roads & Public Works response.",
        entities: {
          locationText: "Main road near Dharampeth",
          infrastructure: ["road surface"],
          blockage: false,
        },
        severity: "MEDIUM",
        priorityFactors: {
          vehicleDamageRisk: true,
          multiDayPresence: true,
          mainRoad: true,
        },
        proposedPriorityScore: 52,
        proposedDepartmentCodes: ["ROADS"],
        requiredInformation: [
          {
            field: "location",
            requirement: "REQUIRED",
            reason:
              "Please provide a more specific location (nearest landmark, road name)",
          },
        ],
        privacyProposal: "PUBLIC",
        emergencyAssessment: {
          isPotentialEmergency: false,
          requiresImmediateContactPrompt: false,
        },
        confidence: 0.82,
        uncertaintyNotes: ["Exact location not specified"],
      },
      provider: "fixture",
      model: "fixture-v1",
      promptVersion: "1.0.0",
      rawConfidence: 0.82,
      processingTimeMs: 150,
    };
  }
}

export const AI_ANALYSIS_SCHEMA_VERSION = "1.0.0";

/** Factory: get the appropriate analysis provider */
export function getAnalysisProvider(): IncidentAnalysisProvider {
  // Dynamic import to avoid loading Groq SDK on client
  const { env } = require("@/lib/env");
  if (env.groqApiKey) {
    const { GroqIncidentAnalysisProvider } = require("./groq-provider");
    return new GroqIncidentAnalysisProvider();
  }
  console.warn("[AI] No Groq API key found, using fixture provider");
  return new FixtureIncidentAnalysisProvider();
}

/** Factory: get the appropriate STT provider */
export function getSpeechProvider(): SpeechToTextProvider {
  return new FixtureSpeechToTextProvider();
}
