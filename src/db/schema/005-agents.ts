/* ════════════════════════════════════════════════════════
   GeoNexus — Multi-Agent System Schema (005)
   Tables:
     1. agent_registry       — Agent registration, status, model, tools
     2. agent_tasks          — Task execution lifecycle, traces, metrics
     3. agent_conversations  — Conversation persistence across sessions
     4. agent_messages       — Messages linked to conversations & tasks
     5. approval_queue       — Human-in-the-loop approval center
     6. tool_health_log      — Tool availability & latency tracking
   ════════════════════════════════════════════════════════ */

import { execute } from "@/lib/db";

export const AGENT_SCHEMA_VERSION = "005";

export type AgentStatus = "ACTIVE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE";
export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REQUIRES_APPROVAL";
export type ApprovalType = "ADVISORY_PUBLISH" | "ALERT_BROADCAST" | "DEPARTMENT_DISPATCH" | "REPORT_PUBLISH";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "AUTO_EXPIRED";
export type ToolHealthStatus = "HEALTHY" | "DEGRADED" | "UNREACHABLE" | "ERROR";

export interface ExecutionTraceStep {
  stage: string;
  timestamp: string;
  durationMs: number;
  status: "OK" | "WARNING" | "ERROR";
  detail?: string;
  metadata?: Record<string, any>;
}

export interface ToolCallRecord {
  toolId: string;
  agentId: string;
  parameters: Record<string, any>;
  resultPreview?: string;
  success: boolean;
  durationMs: number;
  timestamp: string;
}

export interface AgentRecord {
  id: string;
  displayName: string;
  role: string;
  status: AgentStatus;
  modelName: string;
  apiKeyRef: string; // Environment variable name, NEVER the actual key
  capabilities: string[];
  tools: string[];
  systemPrompt?: string;
  totalTasksCompleted: number;
  totalErrors: number;
  avgDurationMs: number;
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  parentTaskId?: string | null;
  taskType: string;
  intent: string;
  inputPreview: string;
  inputPayload: Record<string, any>;
  outputPreview?: string | null;
  outputPayload?: Record<string, any> | null;
  executionTrace: ExecutionTraceStep[];
  toolCalls: ToolCallRecord[];
  status: TaskStatus;
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AgentConversation {
  id: string;
  userId?: string | null;
  userRole: "ADMIN" | "CITIZEN" | "DEPARTMENT" | "SYSTEM";
  title: string;
  currentAgentId: string;
  scenarioId?: string | null;
  wardId?: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  sender: "USER" | "ORCHESTRATOR" | "SIMULATION" | "HAZARD" | "INCIDENT" | "CITIZEN" | "SYSTEM";
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, any> | null;
  taskId?: string | null;
  createdAt: string;
  timestamp?: string;
}

export interface ApprovalQueueItem {
  id: string;
  taskId: string;
  agentId: string;
  approvalType: ApprovalType;
  title: string;
  summary: string;
  payload: Record<string, any>;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ToolHealthRecord {
  id: string;
  toolId: string;
  status: ToolHealthStatus;
  responseTimeMs?: number | null;
  errorMessage?: string | null;
  checkedAt: string;
}

export interface SpecialistAgentResult {
  taskId: string;
  agentId: string;
  agentName?: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  summary: string;
  content: string; // Structured Markdown narrative
  findings: Array<{
    title: string;
    description: string;
    severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    location?: {
      name?: string;
      wardId?: string;
      latitude?: number;
      longitude?: number;
    };
    evidenceIds?: string[];
    confidence?: number;
  }>;
  dataSources: Array<{
    sourceId: string;
    sourceName: string;
    dataType: string;
    observedAt?: string;
    retrievedAt: string;
    freshness: "FRESH" | "STALE" | "UNKNOWN";
    provenance: "LIVE" | "HISTORICAL" | "FORECAST" | "DERIVED" | "SIMULATED";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    department?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    approvalRequired: boolean;
  }>;
  limitations: string[];
  rawPayload?: Record<string, any>;
  reportId?: string;
}

export interface CityIntelligenceReport {
  id: string;
  taskId: string;
  conversationId?: string | null;
  title: string;
  executiveSummary: string;
  overallSituation: string;
  hazardIntelligence: {
    summary: string;
    riskScore: number;
    riskLevel: string;
    telemetry: Record<string, any>;
    anomalies: string[];
  };
  incidentIntelligence: {
    summary: string;
    totalActive: number;
    criticalCount: number;
    highPriorityIncidents: Array<any>;
    departmentBreakdown: Record<string, number>;
  };
  simulationImpact: {
    summary: string;
    scenariosEvaluated: string[];
    vulnerableWards: string[];
    criticalInfrastructureExposed: number;
    peakWaterDepthM: number;
  };
  crossDomainCorrelations: Array<{
    title: string;
    description: string;
    domains: string[];
    confidence: number;
    severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  }>;
  priorityAreas: Array<{
    areaName: string;
    wardId?: string;
    severity: string;
    reasons: string[];
    uncertainty?: string;
  }>;
  departmentalActions: Array<{
    title: string;
    description: string;
    department: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    approvalRequired: boolean;
  }>;
  approvalRequirements: Array<{
    approvalId?: string;
    type: string;
    title: string;
    riskLevel: string;
  }>;
  dataProvenance: Array<{
    sourceName: string;
    dataType: string;
    observedAt?: string;
    freshness: string;
    provenance: string;
    confidence?: number;
  }>;
  participatingAgents: Array<{
    agentId: string;
    displayName: string;
    status: string;
    taskId: string;
    durationMs: number;
  }>;
  contentMarkdown: string;
  createdAt: string;
}

export interface AgentReportRecord {
  id: string;
  taskId: string;
  conversationId?: string | null;
  agentId: string;
  reportType: "CITY_INTELLIGENCE" | "HAZARD_ASSESSMENT" | "SIMULATION_IMPACT" | "INCIDENT_TRIAGE" | "CITIZEN_SAFETY";
  title: string;
  executiveSummary: string;
  content: string;
  findings: any[];
  dataSources: any[];
  recommendations: any[];
  participatingAgents?: any[];
  approvalRequired: boolean;
  createdAt: string;
}

export interface OperationalEvent {
  id: string;
  eventType: string;
  agentId: string;
  title: string;
  description: string;
  severity: "INFO" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  taskId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// ════════════════════════════════════════════════════════
// DDL STATEMENTS
// ════════════════════════════════════════════════════════

export const AGENT_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS operational_events (
    id CHAR(26) NOT NULL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('INFO', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    task_id CHAR(26) NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_events_created (created_at),
    KEY idx_events_agent (agent_id, created_at),
    KEY idx_events_severity (severity, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS agent_reports (
    id CHAR(26) NOT NULL PRIMARY KEY,
    task_id CHAR(26) NOT NULL,
    conversation_id CHAR(26) NULL,
    agent_id VARCHAR(50) NOT NULL,
    report_type ENUM('CITY_INTELLIGENCE', 'HAZARD_ASSESSMENT', 'SIMULATION_IMPACT', 'INCIDENT_TRIAGE', 'CITIZEN_SAFETY') NOT NULL,
    title VARCHAR(300) NOT NULL,
    executive_summary TEXT NOT NULL,
    content MEDIUMTEXT NOT NULL,
    findings JSON NOT NULL,
    data_sources JSON NOT NULL,
    recommendations JSON NOT NULL,
    participating_agents JSON NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_reports_agent (agent_id, created_at),
    KEY idx_reports_type (report_type, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS agent_registry (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status ENUM('ACTIVE', 'DEGRADED', 'OFFLINE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    model_name VARCHAR(100) NOT NULL,
    api_key_ref VARCHAR(50) NOT NULL,
    capabilities JSON NOT NULL,
    tools JSON NOT NULL,
    system_prompt TEXT NULL,
    total_tasks_completed INT NOT NULL DEFAULT 0,
    total_errors INT NOT NULL DEFAULT 0,
    avg_duration_ms INT NOT NULL DEFAULT 0,
    last_heartbeat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS agent_tasks (
    id CHAR(26) NOT NULL PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL,
    parent_task_id CHAR(26) NULL,
    task_type VARCHAR(100) NOT NULL,
    intent VARCHAR(100) NOT NULL,
    input_preview VARCHAR(500) NOT NULL,
    input_payload JSON NOT NULL,
    output_preview VARCHAR(500) NULL,
    output_payload JSON NULL,
    execution_trace JSON NOT NULL,
    tool_calls JSON NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REQUIRES_APPROVAL') NOT NULL DEFAULT 'PENDING',
    duration_ms INT NULL,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    KEY idx_tasks_agent (agent_id, created_at),
    KEY idx_tasks_status (status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS agent_conversations (
    id CHAR(26) NOT NULL PRIMARY KEY,
    user_id VARCHAR(100) NULL,
    user_role ENUM('ADMIN', 'CITIZEN', 'DEPARTMENT', 'SYSTEM') NOT NULL DEFAULT 'ADMIN',
    title VARCHAR(200) NOT NULL,
    current_agent_id VARCHAR(50) NOT NULL DEFAULT 'orchestrator',
    scenario_id VARCHAR(50) NULL,
    ward_id VARCHAR(50) NULL,
    message_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_conv_user (user_id, updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS agent_messages (
    id CHAR(26) NOT NULL PRIMARY KEY,
    conversation_id CHAR(26) NOT NULL,
    sender ENUM('USER', 'ORCHESTRATOR', 'SIMULATION', 'HAZARD', 'INCIDENT', 'CITIZEN', 'SYSTEM') NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    metadata JSON NULL,
    task_id CHAR(26) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_messages_conv (conversation_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS approval_queue (
    id CHAR(26) NOT NULL PRIMARY KEY,
    task_id CHAR(26) NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    approval_type ENUM('ADVISORY_PUBLISH', 'ALERT_BROADCAST', 'DEPARTMENT_DISPATCH', 'REPORT_PUBLISH') NOT NULL,
    title VARCHAR(300) NOT NULL,
    summary TEXT NOT NULL,
    payload JSON NOT NULL,
    risk_level ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL') NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'AUTO_EXPIRED') NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(100) NULL,
    reviewed_at DATETIME NULL,
    review_notes TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_approval_status (status, risk_level, created_at),
    KEY idx_approval_agent (agent_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS tool_health_log (
    id CHAR(26) NOT NULL PRIMARY KEY,
    tool_id VARCHAR(100) NOT NULL,
    status ENUM('HEALTHY', 'DEGRADED', 'UNREACHABLE', 'ERROR') NOT NULL,
    response_time_ms INT NULL,
    error_message TEXT NULL,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tool_health (tool_id, checked_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
];

let tablesInitialized = false;

export async function initAgentDatabase(): Promise<boolean> {
  if (tablesInitialized) return true;
  try {
    for (const sql of AGENT_DDL_STATEMENTS) {
      await execute(sql);
    }
    tablesInitialized = true;
    console.log("[Agents DB] Schema 005 initialized successfully.");
    return true;
  } catch (err: any) {
    console.warn("[Agents DB] Database not ready or offline, using resilient in-memory fallback:", err?.message || err);
    return false;
  }
}
