/* ════════════════════════════════════════════════════════
   AI Incident Engine — Orchestrator
   Stage 1: AI analysis + dept mismatch detection
   Stage 2: Department-specific questions (max 4)
   Single entry point for all incident analysis
   ════════════════════════════════════════════════════════ */

import { GroqIncidentAnalysisProvider, type AIRawAnalysis, type AIQuestionSet } from "./groq-provider";
import {
  resolveDepartments,
  getPriorityBand,
  formatDepartmentName,
  getDepartmentByCode,
  type PriorityBand,
} from "./department-routing";
import { getCategoryBySlug } from "@/modules/incidents/category-taxonomy";
import { DEPARTMENTS } from "@/modules/ai/department-routing";

/** Interactive question for citizen (from Stage 2) */
export interface DeptQuestion {
  id: string;
  question: string;
  type: "chip" | "multi_chip" | "yesno" | "text";
  options?: string[];
  placeholder?: string;
  required: boolean;
}

/** Final validated analysis result returned to the UI */
export interface AnalysisResult {
  // Classification
  mainCategory: string;
  mainCategoryName: string;
  subcategory: string;
  incidentType: string;

  // Citizen-facing
  summary: string;

  // Severity — validated by app rules
  severity: {
    level: string;
    score: number;
    reason: string;
    band: PriorityBand;
  };

  // Priority — app rules applied
  priority: {
    score: number;
    band: PriorityBand;
  };

  affectedPeople: number | null;

  // Location
  location: {
    required: boolean;
    provided: boolean;
    text: string | null;
  };

  // Attachments
  attachments: {
    required: boolean;
    recommended: boolean;
    reason: string;
  };

  // Privacy
  privacy: {
    level: "normal" | "restricted" | "sensitive";
    protectIdentity: boolean;
  };

  // Departments — merged from AI + routing rules
  departments: Array<{
    code: string;
    name: string;
    reason: string;
  }>;

  // Confidence
  confidence: {
    overall: number;
    category: number;
    severity: number;
    departmentRouting: number;
  };

  // Department mismatch (NEW)
  mismatch: boolean;
  suggestedCategory: string | null;
  suggestedCategoryName: string | null;
  mismatchReason: string | null;

  // Department-specific questions (NEW — from Stage 2)
  deptQuestions: DeptQuestion[];

  // Legacy: text-only questions (kept for backward compat, usually empty now)
  questionsForCitizen: Array<{
    question: string;
    reason: string;
  }>;

  // Emergency flag
  isEmergency: boolean;

  // Meta
  aiProvider: string;
  aiModel: string;
  processingTimeMs: number;
}

/**
 * Analyze an incident report.
 * Stage 1: Full AI analysis with optional dept context + mismatch check
 * Stage 2: If no mismatch, generate dept-specific questions
 */
export async function analyzeIncident(params: {
  text: string;
  locationContext?: string;
  selectedDepartment?: string;
}): Promise<AnalysisResult> {
  const provider = new GroqIncidentAnalysisProvider();
  const startTotal = Date.now();

  // Stage 1: Full analysis
  const { analysis: raw, model } = await provider.analyze({
    text: params.text,
    locationContext: params.locationContext,
    selectedDepartment: params.selectedDepartment,
  });

  // Post-process with deterministic rules
  const result = postProcess(raw, model, Date.now() - startTotal);

  // Stage 2: Generate dept-specific questions (only when no mismatch)
  if (!result.mismatch) {
    const effectiveDept = params.selectedDepartment || result.mainCategory;
    const deptInfo = DEPARTMENTS.find((d) => d.code === effectiveDept);

    if (deptInfo) {
      try {
        const questionSet: AIQuestionSet = await provider.generateDeptQuestions({
          summary: result.summary,
          departmentSlug: effectiveDept,
          departmentName: deptInfo.name,
          originalText: params.text,
        });
        result.deptQuestions = questionSet.questions || [];
      } catch {
        // Stage 2 failure is non-fatal — fallback to no questions
        result.deptQuestions = [];
      }
    }
  }

  result.processingTimeMs = Date.now() - startTotal;
  return result;
}

/**
 * Post-process raw AI output with deterministic application rules.
 */
function postProcess(
  raw: AIRawAnalysis,
  model: string,
  processingTimeMs: number
): AnalysisResult {
  // Validate and clamp severity score
  const severityScore = Math.max(0, Math.min(100, raw.severity?.score ?? 50));
  const severityBand = getPriorityBand(severityScore);
  const severityLevel = raw.severity?.level || "medium";

  // Priority score
  let priorityScore = severityScore;
  const category = getCategoryBySlug(raw.mainCategory);
  if (category?.isEmergency) {
    priorityScore = Math.max(priorityScore, 81);
  }
  if (raw.affectedPeople && raw.affectedPeople > 0) {
    priorityScore = Math.min(100, priorityScore + 10);
  }
  const priorityBand = getPriorityBand(priorityScore);

  // Departments
  const aiDeptCodes = (raw.requiredDepartments || []).map((d) => d.departmentType);
  const resolvedDeptCodes = resolveDepartments(raw.subcategory, aiDeptCodes);
  const aiDeptReasons = new Map(
    (raw.requiredDepartments || []).map((d) => [d.departmentType, d.reason])
  );
  const departments = resolvedDeptCodes.map((code) => ({
    code,
    name: formatDepartmentName(code),
    reason: aiDeptReasons.get(code) || "Required by routing rules",
  }));

  // Emergency flag
  const isEmergency =
    category?.isEmergency ||
    raw.mainCategory === "emergency" ||
    raw.mainCategory === "ambulance" ||
    raw.mainCategory === "fire_brigade" ||
    severityLevel === "critical" ||
    priorityScore >= 81;

  const dept = getDepartmentByCode(raw.mainCategory);
  const mainCategoryName = dept?.name || category?.name || formatDepartmentName(raw.mainCategory);

  // Confidence
  const confidence = {
    overall: clamp01(raw.confidence?.overall ?? 0.7),
    category: clamp01(raw.confidence?.category ?? 0.7),
    severity: clamp01(raw.confidence?.severity ?? 0.7),
    departmentRouting: clamp01(raw.confidence?.departmentRouting ?? 0.7),
  };

  // Mismatch — resolve suggested department/category name
  const suggestedDept = raw.suggestedCategory
    ? getDepartmentByCode(raw.suggestedCategory) || getCategoryBySlug(raw.suggestedCategory)
    : null;
  const suggestedCategoryName = suggestedDept?.name || (raw.suggestedCategory ? formatDepartmentName(raw.suggestedCategory) : null);

  return {
    mainCategory: raw.mainCategory || "unknown",
    mainCategoryName,
    subcategory: raw.subcategory || raw.incidentType || "unknown",
    incidentType: raw.incidentType || raw.subcategory || "unknown",

    summary: raw.summary || "We received your report and are processing it.",

    severity: {
      level: severityLevel,
      score: severityScore,
      reason: raw.severity?.reason || "Assessment based on report details",
      band: severityBand,
    },

    priority: {
      score: priorityScore,
      band: priorityBand,
    },

    affectedPeople: raw.affectedPeople ?? null,

    location: {
      required: raw.location?.required ?? true,
      provided: raw.location?.provided ?? false,
      text: raw.location?.text ?? null,
    },

    attachments: {
      required: raw.attachments?.required ?? false,
      recommended: raw.attachments?.recommended ?? true,
      reason: raw.attachments?.reason || "Visual evidence helps assessment",
    },

    privacy: {
      level: raw.privacy?.level || "normal",
      protectIdentity: raw.privacy?.protectIdentity ?? false,
    },

    departments,
    confidence,

    // Mismatch fields
    mismatch: raw.mismatch ?? false,
    suggestedCategory: raw.suggestedCategory ?? null,
    suggestedCategoryName: suggestedCategoryName ?? null,
    mismatchReason: raw.mismatchReason ?? null,

    // Stage 2 questions — populated after postProcess by analyzeIncident()
    deptQuestions: [],

    // Legacy text questions (kept for compat)
    questionsForCitizen: raw.questionsForCitizen || [],

    isEmergency,

    aiProvider: "groq",
    aiModel: model,
    processingTimeMs,
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export async function testEngine(text: string): Promise<AnalysisResult> {
  return analyzeIncident({ text });
}
