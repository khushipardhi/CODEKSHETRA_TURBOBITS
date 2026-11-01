/* ════════════════════════════════════════════════════════
   GeoNexus — Agent & Tool Registry
   Authoritative registry for Orchestrator and 4 Specialist Agents.
   Handles database synchronization with robust in-memory fallback.
   ════════════════════════════════════════════════════════ */

import { execute, query } from "@/lib/db";
import {
  AgentRecord,
  AgentStatus,
  initAgentDatabase,
} from "@/db/schema/005-agents";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  agentId: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  category: "SIMULATION" | "TELEMETRY" | "INCIDENT" | "CITIZEN" | "ORCHESTRATION";
  dataSource: string;
}

// ════════════════════════════════════════════════════════
// CANONICAL AGENT DEFINITIONS
// ════════════════════════════════════════════════════════

export const CANONICAL_AGENTS: AgentRecord[] = [
  {
    id: "orchestrator",
    displayName: "Central City Orchestrator",
    role: "Master routing, multi-agent task coordination & session context manager",
    status: "ACTIVE",
    modelName: "openai/gpt-oss-120b",
    apiKeyRef: "GROQ_ORCHESTRATOR_API_KEY",
    capabilities: [
      "Natural language intent decomposition",
      "Specialist agent dispatching & routing",
      "Context retention across multi-turn sessions",
      "Human-in-the-loop approval escalation",
      "Cross-agent workflow synthesis",
    ],
    tools: [
      "orchestrator.route_intent",
      "orchestrator.delegate_task",
      "orchestrator.manage_context",
    ],
    systemPrompt:
      "You are the Central City Orchestrator for CivicOS (AGENTONE) Mumbai. You direct inquiries to specialist agents and maintain unified municipal intelligence.",
    totalTasksCompleted: 0,
    totalErrors: 0,
    avgDurationMs: 0,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "simulation",
    displayName: "Simulation Specialist Agent",
    role: "Spatial simulation workspace controller & 7-scenario physical engine",
    status: "ACTIVE",
    modelName: "openai/gpt-oss-120b",
    apiKeyRef: "GROQ_API_KEY",
    capabilities: [
      "7 canonical multi-hazard scenario execution (A–G)",
      "24 BMC ward deterministic risk calculation",
      "Natural language parameter modulation (rainfall, tide, wind, breach)",
      "Multi-simulation run comparison & delta analysis",
      "Spatial asset exposure query (hospitals, pumps, nullahs)",
      "Automated dossier and PDF engineering export",
    ],
    tools: [
      "simulation.run_scenario",
      "simulation.configure_parameters",
      "simulation.compare_runs",
      "simulation.query_assets",
      "simulation.export_report",
    ],
    systemPrompt:
      "You are the CivicOS Simulation Specialist Agent. You manage the physical simulation workspace across 24 Mumbai BMC wards and 23 GIS layers.",
    totalTasksCompleted: 0,
    totalErrors: 0,
    avgDurationMs: 0,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "hazard",
    displayName: "Hazard Intelligence Agent",
    role: "Live environmental telemetry, 0–100 risk scoring, anomaly detection & advisory generation",
    status: "ACTIVE",
    modelName: "openai/gpt-oss-120b",
    apiKeyRef: "GROQ_THIRD_API_KEY",
    capabilities: [
      "Real-time Open-Meteo telemetry (weather, marine tide, AQI, GloFAS river discharge)",
      "NDMA SACHET CAP emergency bulletin parsing",
      "Multi-factorial 0–100 ward vulnerability scoring",
      "Critical threshold alerting & anomaly detection",
      "Automated advisory proposal generation for human sign-off",
    ],
    tools: [
      "hazard.get_telemetry",
      "hazard.assess_ward_risk",
      "hazard.detect_anomalies",
      "hazard.propose_advisory",
      "hazard.sachet_feed",
    ],
    systemPrompt:
      "You are the Hazard Intelligence Agent for Mumbai. You continuously monitor real-time sensor streams, weather models, and generate defensive municipal advisories.",
    totalTasksCompleted: 0,
    totalErrors: 0,
    avgDurationMs: 0,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "incident",
    displayName: "Incident Analysis Agent",
    role: "Citizen incident triage, 17-department routing, priority scoring & dossier compilation",
    status: "ACTIVE",
    modelName: "openai/gpt-oss-120b",
    apiKeyRef: "GROQ_API_KEY",
    capabilities: [
      "Multi-modal citizen incident report triage & deduplication",
      "17-department BMC operational routing & dispatch",
      "Dynamic severity scoring and priority band assignment",
      "Operational dossier compilation for disaster management teams",
    ],
    tools: [
      "incident.analyze_report",
      "incident.route_department",
      "incident.generate_dossier",
      "incident.check_priority",
    ],
    systemPrompt:
      "You are the Incident Analysis Agent for Mumbai Municipal Corporation. You analyze emergency reports, compute operational impact, and route work orders.",
    totalTasksCompleted: 0,
    totalErrors: 0,
    avgDurationMs: 0,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "citizen",
    displayName: "Citizen Safety Agent (Sentinel)",
    role: "RAG-grounded citizen safety briefings, localized shelter lookup & defensive guidance",
    status: "ACTIVE",
    modelName: "openai/gpt-oss-20b / qwen3.8-27b",
    apiKeyRef: "GROQ_API_KEY",
    capabilities: [
      "Grounded conversational safety briefings for citizens in distress",
      "Nearest shelter, hospital, and emergency contact lookup per ward",
      "Flood depth and route hazard warnings",
      "Actionable safety cards (evacuation, do's & don'ts, helpline numbers)",
    ],
    tools: [
      "citizen.safety_briefing",
      "citizen.find_shelter",
      "citizen.evacuation_guidance",
      "citizen.emergency_contacts",
    ],
    systemPrompt:
      "You are the Citizen Sentinel AI for Mumbai residents. You provide empathetic, factual, grounded emergency safety information and guidance.",
    totalTasksCompleted: 0,
    totalErrors: 0,
    avgDurationMs: 0,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ════════════════════════════════════════════════════════
// CANONICAL TOOL DEFINITIONS
// ════════════════════════════════════════════════════════

export const CANONICAL_TOOLS: ToolDefinition[] = [
  // Orchestrator Tools
  {
    id: "orchestrator.route_intent",
    name: "Route User Intent",
    description: "Determines the target specialist agent based on semantics and context",
    agentId: "orchestrator",
    category: "ORCHESTRATION",
    dataSource: "LLaMA 3.3 Classifier + Keyword Rubric",
    parameters: {
      message: { type: "string", description: "User input query", required: true },
      sessionHistory: { type: "array", description: "Previous conversation context" },
    },
  },
  {
    id: "orchestrator.delegate_task",
    name: "Delegate to Specialist",
    description: "Dispatches payload to specialist agent and records task lifecycle",
    agentId: "orchestrator",
    category: "ORCHESTRATION",
    dataSource: "Internal Agent Bus",
    parameters: {
      targetAgent: { type: "string", description: "Agent ID (simulation, hazard, incident, citizen)", required: true },
      taskPayload: { type: "object", description: "Input parameters", required: true },
    },
  },
  // Simulation Tools
  {
    id: "simulation.run_scenario",
    name: "Execute Spatial Scenario",
    description: "Runs deterministic 24-ward physical simulation across 7 hazard scenarios",
    agentId: "simulation",
    category: "SIMULATION",
    dataSource: "23 GIS Layers + Copernicus DEM + BRIMSTOWAD",
    parameters: {
      scenarioId: { type: "string", description: "A, B, C, D, E, F, or G", required: true },
      parameters: { type: "object", description: "Scenario-specific numerical modulations" },
      targetWards: { type: "array", description: "Subset of 24 BMC wards (optional)" },
    },
  },
  {
    id: "simulation.configure_parameters",
    name: "Configure Parameters",
    description: "Modulates rainfall intensity, tide height, wind speed, or drainage failure",
    agentId: "simulation",
    category: "SIMULATION",
    dataSource: "Scenario Parameter Contracts",
    parameters: {
      modulations: { type: "object", description: "Key-value parameter adjustments", required: true },
    },
  },
  {
    id: "simulation.compare_runs",
    name: "Compare Simulation Runs",
    description: "Calculates delta matrix, population at risk shifts, and ward severity diffs",
    agentId: "simulation",
    category: "SIMULATION",
    dataSource: "Run History Cache",
    parameters: {
      runIdA: { type: "string", description: "Base run ID", required: true },
      runIdB: { type: "string", description: "Comparison run ID", required: true },
    },
  },
  {
    id: "simulation.query_assets",
    name: "Query Spatial Assets",
    description: "Intersects simulated hazard extent with critical assets (hospitals, pumps, roads)",
    agentId: "simulation",
    category: "SIMULATION",
    dataSource: "Mumbai Assets GeoPackage & OSM Vectors",
    parameters: {
      assetType: { type: "string", description: "hospitals | dewatering_pumps | nullahs | underpasses" },
      wardId: { type: "string", description: "BMC ward code (e.g. F/N, K/W, H/E)" },
    },
  },
  {
    id: "simulation.export_report",
    name: "Export Dossier / PDF",
    description: "Generates multi-page engineering dossier and executive summary",
    agentId: "simulation",
    category: "SIMULATION",
    dataSource: "Dossier Orchestrator",
    parameters: {
      scenarioId: { type: "string", description: "Scenario ID", required: true },
      format: { type: "string", description: "pdf | json" },
    },
  },
  // Hazard Tools
  {
    id: "hazard.get_telemetry",
    name: "Fetch Live Telemetry",
    description: "Queries Open-Meteo for real-time weather, marine swell, AQI, and river discharge",
    agentId: "hazard",
    category: "TELEMETRY",
    dataSource: "Open-Meteo API (High-Resolution Mumbai Coordinates)",
    parameters: {
      feedType: { type: "string", description: "weather | aqi | marine | flood", required: true },
    },
  },
  {
    id: "hazard.assess_ward_risk",
    name: "Compute 0–100 Ward Risk",
    description: "Evaluates multi-hazard risk rubric with terrain elevation and drainage factors",
    agentId: "hazard",
    category: "TELEMETRY",
    dataSource: "Assessment Engine + Mumbai Ward GeoJSON",
    parameters: {
      wardId: { type: "string", description: "BMC ward identifier" },
    },
  },
  {
    id: "hazard.detect_anomalies",
    name: "Detect Threshold Breaches",
    description: "Identifies rainfall >65mm/hr, tide >4.5m, wind >70km/h, or AQI >300",
    agentId: "hazard",
    category: "TELEMETRY",
    dataSource: "Parameter Registry Thresholds",
    parameters: {
      lookbackHours: { type: "number", description: "Hours of data to inspect" },
    },
  },
  {
    id: "hazard.propose_advisory",
    name: "Propose Municipal Advisory",
    description: "Drafts formal public advisory and routes to Approval Centre",
    agentId: "hazard",
    category: "TELEMETRY",
    dataSource: "Workflow Manager",
    parameters: {
      hazardType: { type: "string", description: "FLOOD | STORM_SURGE | CYCLONE | AQI", required: true },
      severity: { type: "string", description: "MODERATE | HIGH | CRITICAL", required: true },
      affectedWards: { type: "array", description: "List of ward names", required: true },
    },
  },
  {
    id: "hazard.sachet_feed",
    name: "Ingest NDMA SACHET Feed",
    description: "Reads live Common Alerting Protocol warnings for Maharashtra",
    agentId: "hazard",
    category: "TELEMETRY",
    dataSource: "NDMA SACHET RSS Feed",
    parameters: {
      region: { type: "string", description: "Maharashtra" },
    },
  },
  // Incident Tools
  {
    id: "incident.analyze_report",
    name: "Analyze Incident Text",
    description: "Extracts location, urgency, category, and evidence links using Groq",
    agentId: "incident",
    category: "INCIDENT",
    dataSource: "Groq LLaMA 3.3 70B",
    parameters: {
      reportText: { type: "string", description: "Citizen text or voice transcription", required: true },
    },
  },
  {
    id: "incident.route_department",
    name: "Route to Department",
    description: "Maps report to one of 17 BMC departments with priority score",
    agentId: "incident",
    category: "INCIDENT",
    dataSource: "Department Routing Engine",
    parameters: {
      categorySlug: { type: "string", description: "Incident category", required: true },
      wardId: { type: "string", description: "BMC ward location" },
    },
  },
  // Citizen Tools
  {
    id: "citizen.safety_briefing",
    name: "Generate Safety Briefing",
    description: "Produces RAG-grounded safety guidance for citizen's current location",
    agentId: "citizen",
    category: "CITIZEN",
    dataSource: "Sentinel Engine + Live Observations",
    parameters: {
      query: { type: "string", description: "Citizen query", required: true },
      ward: { type: "string", description: "Citizen ward location" },
    },
  },
  {
    id: "citizen.find_shelter",
    name: "Locate Nearest Shelter",
    description: "Identifies designated BMC relief shelters and high-ground facilities",
    agentId: "citizen",
    category: "CITIZEN",
    dataSource: "BMC Emergency Assets Index",
    parameters: {
      latitude: { type: "number", description: "Current user latitude" },
      longitude: { type: "number", description: "Current user longitude" },
      wardId: { type: "string", description: "BMC ward code" },
    },
  },
];

// ════════════════════════════════════════════════════════
// IN-MEMORY CACHE FOR INSTANT RESPONSES
// ════════════════════════════════════════════════════════

const agentMemoryStore = new Map<string, AgentRecord>();

// Initialize memory store with canonical agents
for (const agent of CANONICAL_AGENTS) {
  agentMemoryStore.set(agent.id, { ...agent });
}

// ════════════════════════════════════════════════════════
// REGISTRY ACCESSORS & SYNC
// ════════════════════════════════════════════════════════

export async function syncRegistryWithDb(): Promise<void> {
  const isDbReady = await initAgentDatabase();
  if (!isDbReady) return;

  try {
    for (const agent of CANONICAL_AGENTS) {
      await execute(
        `INSERT INTO agent_registry 
          (id, display_name, role, status, model_name, api_key_ref, capabilities, tools, system_prompt, total_tasks_completed, total_errors, avg_duration_ms, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
          display_name = VALUES(display_name),
          role = VALUES(role),
          model_name = VALUES(model_name),
          api_key_ref = VALUES(api_key_ref),
          capabilities = VALUES(capabilities),
          tools = VALUES(tools),
          system_prompt = VALUES(system_prompt),
          last_heartbeat = NOW()`,
        [
          agent.id,
          agent.displayName,
          agent.role,
          agent.status,
          agent.modelName,
          agent.apiKeyRef,
          JSON.stringify(agent.capabilities),
          JSON.stringify(agent.tools),
          agent.systemPrompt || null,
          agent.totalTasksCompleted,
          agent.totalErrors,
          agent.avgDurationMs,
        ]
      );
    }
  } catch (err: any) {
    console.warn("[AgentRegistry] DB sync warning:", err?.message || err);
  }
}

export async function getAllAgents(): Promise<AgentRecord[]> {
  try {
    const rows = await query<any>("SELECT * FROM agent_registry ORDER BY id ASC");
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        displayName: r.display_name,
        role: r.role,
        status: r.status as AgentStatus,
        modelName: r.model_name,
        apiKeyRef: r.api_key_ref,
        capabilities: typeof r.capabilities === "string" ? JSON.parse(r.capabilities) : (r.capabilities || []),
        tools: typeof r.tools === "string" ? JSON.parse(r.tools) : (r.tools || []),
        systemPrompt: r.system_prompt,
        totalTasksCompleted: Number(r.total_tasks_completed) || 0,
        totalErrors: Number(r.total_errors) || 0,
        avgDurationMs: Number(r.avg_duration_ms) || 0,
        lastHeartbeat: r.last_heartbeat ? new Date(r.last_heartbeat).toISOString() : new Date().toISOString(),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }
  } catch {
    // Fall back to in-memory store
  }

  return Array.from(agentMemoryStore.values());
}

export async function getAgentById(agentId: string): Promise<AgentRecord | null> {
  const agents = await getAllAgents();
  return agents.find((a) => a.id === agentId) || agentMemoryStore.get(agentId) || null;
}

export function getAllTools(): ToolDefinition[] {
  return CANONICAL_TOOLS;
}

export function getToolsByAgent(agentId: string): ToolDefinition[] {
  return CANONICAL_TOOLS.filter((t) => t.agentId === agentId);
}

export async function recordAgentMetrics(
  agentId: string,
  durationMs: number,
  isError: boolean = false
): Promise<void> {
  const memAgent = agentMemoryStore.get(agentId);
  if (memAgent) {
    memAgent.totalTasksCompleted += isError ? 0 : 1;
    memAgent.totalErrors += isError ? 1 : 0;
    const count = Math.max(1, memAgent.totalTasksCompleted);
    memAgent.avgDurationMs = Math.round((memAgent.avgDurationMs * (count - 1) + durationMs) / count);
    memAgent.lastHeartbeat = new Date().toISOString();
  }

  try {
    await execute(
      `UPDATE agent_registry
       SET 
         total_tasks_completed = total_tasks_completed + ?,
         total_errors = total_errors + ?,
         avg_duration_ms = CASE 
           WHEN total_tasks_completed = 0 THEN ? 
           ELSE ROUND((avg_duration_ms * total_tasks_completed + ?) / (total_tasks_completed + 1))
         END,
         last_heartbeat = NOW()
       WHERE id = ?`,
      [isError ? 0 : 1, isError ? 1 : 0, durationMs, durationMs, agentId]
    );
  } catch {
    // In-memory already updated
  }
}
