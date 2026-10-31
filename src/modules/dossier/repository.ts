/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Simulation Dossier Repository
   Phase 3: Database & File-Backed Dual Persistence Layer
   ════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import type { CanonicalSimulationDossier } from "./contracts";
import { execute, query } from "@/lib/db";

export interface CanonicalSimulationDossierSummary {
  dossierId: string;
  generatedAtIso: string;
  scenarioId: string;
  scenarioTitle: string;
  timeStepHours: number;
  overallAlertLevel: string;
  selectedWardId?: string;
  peakWardName: string;
  peakScore: number;
  overallAIState: string;
}

const MEMORY_CACHE = new Map<string, CanonicalSimulationDossier>();
const FILE_DIR = path.resolve(process.cwd(), "data", "dossiers");

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(FILE_DIR)) {
      fs.mkdirSync(FILE_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

let dbInitialized = false;

async function ensureTableInitialized(): Promise<boolean> {
  if (dbInitialized) return true;
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS simulation_dossiers (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        city VARCHAR(50) NOT NULL DEFAULT 'mumbai',
        scenario_id VARCHAR(50) NOT NULL,
        scenario_title VARCHAR(200) NOT NULL,
        model_version VARCHAR(50) NOT NULL,
        input_hash VARCHAR(64) NOT NULL,
        time_step_hours DECIMAL(4, 2) NOT NULL,
        overall_alert_level VARCHAR(30) NOT NULL,
        selected_ward_id VARCHAR(50) NULL,
        ai_role1_status VARCHAR(30) NOT NULL,
        ai_role2_status VARCHAR(30) NOT NULL,
        ai_role3_status VARCHAR(30) NOT NULL,
        structured_report JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dossier_scenario (city, scenario_id, created_at),
        INDEX idx_dossier_hash (input_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    dbInitialized = true;
    return true;
  } catch (err) {
    // Database may be offline or credentials unconfigured
    return false;
  }
}

export async function saveDossier(dossier: CanonicalSimulationDossier): Promise<void> {
  // 1. Save in memory
  MEMORY_CACHE.set(dossier.dossierId, dossier);

  // 2. Save to file
  ensureDirectoryExists();
  try {
    const filePath = path.join(FILE_DIR, `${dossier.dossierId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dossier, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DossierRepository] Could not write to file:", err);
  }

  // 3. Attempt DB persistence
  try {
    const ok = await ensureTableInitialized();
    if (ok) {
      await execute(
        `INSERT INTO simulation_dossiers (
          id, city, scenario_id, scenario_title, model_version, input_hash,
          time_step_hours, overall_alert_level, selected_ward_id,
          ai_role1_status, ai_role2_status, ai_role3_status, structured_report
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          structured_report = VALUES(structured_report),
          overall_alert_level = VALUES(overall_alert_level)`,
        [
          dossier.dossierId,
          "mumbai",
          dossier.scenarioId,
          dossier.executiveSummary.scenarioTitle,
          dossier.methodologyAndCalculation.modelVersion,
          dossier.rawInputHash,
          dossier.timeStepHours,
          dossier.executiveSummary.overallAlertLevel,
          dossier.selectedWardId || null,
          dossier.limitationsAndGovernance.aiGovernance.role1EvidenceAnalyst.status,
          dossier.limitationsAndGovernance.aiGovernance.role2ImpactAnalyst.status,
          dossier.limitationsAndGovernance.aiGovernance.role3ReportEditor.status,
          JSON.stringify(dossier),
        ]
      );
    }
  } catch (err) {
    console.warn("[DossierRepository] DB write failed, fallback in place:", err);
  }
}

export async function getDossierById(
  dossierId: string
): Promise<CanonicalSimulationDossier | null> {
  // 1. Check memory cache
  if (MEMORY_CACHE.has(dossierId)) {
    return MEMORY_CACHE.get(dossierId)!;
  }

  // 2. Check file system
  ensureDirectoryExists();
  try {
    const filePath = path.join(FILE_DIR, `${dossierId}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data) as CanonicalSimulationDossier;
      MEMORY_CACHE.set(dossierId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("[DossierRepository] File read failed:", err);
  }

  // 3. Check DB
  try {
    const ok = await ensureTableInitialized();
    if (ok) {
      const rows = await query<{ structured_report: string | object }>(
        "SELECT structured_report FROM simulation_dossiers WHERE id = ? LIMIT 1",
        [dossierId]
      );
      if (rows && rows.length > 0) {
        const rep =
          typeof rows[0].structured_report === "string"
            ? JSON.parse(rows[0].structured_report)
            : rows[0].structured_report;
        MEMORY_CACHE.set(dossierId, rep as CanonicalSimulationDossier);
        return rep as CanonicalSimulationDossier;
      }
    }
  } catch (err) {
    console.warn("[DossierRepository] DB query failed:", err);
  }

  return null;
}

export async function listDossiers(filter?: {
  scenarioId?: string;
  limit?: number;
}): Promise<CanonicalSimulationDossierSummary[]> {
  const limit = filter?.limit || 20;
  const summaries: CanonicalSimulationDossierSummary[] = [];

  // Read from file system & memory
  ensureDirectoryExists();
  try {
    const files = fs
      .readdirSync(FILE_DIR)
      .filter((f) => f.endsWith(".json"))
      .slice(0, limit);

    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(FILE_DIR, f), "utf-8");
        const doc = JSON.parse(content) as CanonicalSimulationDossier;
        if (!filter?.scenarioId || doc.scenarioId === filter.scenarioId) {
          summaries.push({
            dossierId: doc.dossierId,
            generatedAtIso: doc.generatedAtIso,
            scenarioId: doc.scenarioId,
            scenarioTitle: doc.executiveSummary.scenarioTitle,
            timeStepHours: doc.timeStepHours,
            overallAlertLevel: doc.executiveSummary.overallAlertLevel,
            selectedWardId: doc.selectedWardId,
            peakWardName: doc.citywideAssessment.peakWard.wardName,
            peakScore: doc.citywideAssessment.peakWard.score,
            overallAIState: doc.limitationsAndGovernance.aiGovernance.overallAIState,
          });
        }
      } catch {
        // ignore broken file
      }
    }
  } catch {
    // ignore
  }

  return summaries.sort(
    (a, b) => new Date(b.generatedAtIso).getTime() - new Date(a.generatedAtIso).getTime()
  );
}
