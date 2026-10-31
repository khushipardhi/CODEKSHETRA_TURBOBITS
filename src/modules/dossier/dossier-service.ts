/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Canonical Simulation Dossier Service
   Phase 3: High-Level Orchestration & API Facade
   ════════════════════════════════════════════════════════ */

import type { SimulationTimeStepOutput } from "../simulation/contracts";
import type { CanonicalSimulationDossier } from "./contracts";
import { orchestrateSimulationDossier } from "./orchestrator";
import { saveDossier, getDossierById, listDossiers } from "./repository";
import { runSimulationTimeStep } from "../simulation/engine";
import { exportDossierToMarkdown, exportDossierToCSV } from "./export-utils";

export interface GenerateDossierRequest {
  scenarioId: string;
  parametersApplied?: Record<string, number>;
  timeStepHours?: number;
  selectedWardId?: string;
  forceDeterministic?: boolean;
}

export class SimulationDossierService {
  /** Generate a new canonical simulation dossier */
  async generateDossier(req: GenerateDossierRequest): Promise<CanonicalSimulationDossier> {
    const timeStep = req.timeStepHours ?? 2.0;

    // 1. Run deterministic simulation engine
    const simOutput = runSimulationTimeStep({
      scenarioId: req.scenarioId,
      timeStepHours: timeStep,
      customParameters: req.parametersApplied,
      selectedWardId: req.selectedWardId,
    });

    // 2. Orchestrate 8-step evidence pipeline
    const dossier = await orchestrateSimulationDossier({
      simOutput,
      selectedWardId: req.selectedWardId,
      forceDeterministic: req.forceDeterministic,
    });

    // 3. Persist to repository (DB + file store)
    await saveDossier(dossier);

    return dossier;
  }

  /** Retrieve an existing dossier by ID */
  async getDossier(dossierId: string): Promise<CanonicalSimulationDossier | null> {
    return getDossierById(dossierId);
  }

  /** List recent dossiers */
  async listRecentDossiers(filter?: { scenarioId?: string; limit?: number }) {
    return listDossiers(filter);
  }

  /** Export dossier in requested format */
  exportDossier(dossier: CanonicalSimulationDossier, format: "markdown" | "json" | "csv"): string {
    switch (format) {
      case "markdown":
        return exportDossierToMarkdown(dossier);
      case "json":
        return JSON.stringify(dossier, null, 2);
      case "csv":
        return exportDossierToCSV(dossier);
      default:
        return JSON.stringify(dossier, null, 2);
    }
  }
}

export const simulationDossierService = new SimulationDossierService();
