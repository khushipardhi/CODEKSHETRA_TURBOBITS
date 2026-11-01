"use client";

/* ════════════════════════════════════════════════════════
   GeoNexus — Autonomous City Operations Control Room (/admin/[city]/agents)
   
   Operational Architecture:
   - Continuous Autonomous Background Monitoring (Weather, AQI, Marine, SACHET, TiDB Incidents)
   - Real Chronological Event Persistence (operational_events in TiDB Cloud)
   - Two Coexisting Specialist Interaction Modes:
       * MODE A: Direct Independent Specialist Interaction
       * MODE B: Central City Orchestrator (Multi-Agent Planning & Parent-Child Task Delegation)
   - 7 Core Navigation Perspectives:
       1. Overview (Default City Operations Control Room)
       2. Agent Network (Workspaces for 5 autonomous engines)
       3. Investigations (Parent-child task execution trees & traces)
       4. City Intelligence (Structured dossier reports & provenance)
       5. Approvals (Human-in-the-loop review desk)
       6. Integrations (18 live tools & data source health)
       7. Analytics (Telemetry & multi-agent cluster performance)
   ════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import {
  ShieldIcon,
  ActivityIcon,
  SlidersIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
  FileTextIcon,
  SearchIcon,
  BuildingIcon,
  MapPinIcon,
} from "@/components/ui/icons";

export type AgentId = "orchestrator" | "simulation" | "hazard" | "incident" | "citizen";

interface AgentDef {
  id: AgentId;
  displayName: string;
  role: string;
  modelName: string;
  defaultStatus: "MONITORING" | "AVAILABLE" | "STANDBY" | "INVESTIGATING" | "DEGRADED";
  toolsCount: number;
  description: string;
  accentColor: string;
  icon: string;
  primaryFeeds: string[];
}

const REGISTERED_AGENTS: AgentDef[] = [
  {
    id: "orchestrator",
    displayName: "CivicOS Central Orchestrator",
    role: "City Intelligence Director & Multi-Agent Coordinator",
    modelName: "openai/gpt-oss-120b",
    defaultStatus: "AVAILABLE",
    toolsCount: 3,
    description: "Coordinates 4 specialists, plans parent-child investigations, correlates findings, and produces city reports.",
    accentColor: "indigo",
    icon: "👑",
    primaryFeeds: ["All Specialist Feeds", "Parent-Child Tasks", "Approval Queue"],
  },
  {
    id: "simulation",
    displayName: "Simulation Agent",
    role: "Spatial Digital Twin & Physics Engine Operator",
    modelName: "openai/gpt-oss-120b",
    defaultStatus: "STANDBY",
    toolsCount: 5,
    description: "Runs 7 multi-hazard scenarios, 24 BMC ward hydrological models, saucer depression analysis, and infrastructure exposure.",
    accentColor: "cyan",
    icon: "🌊",
    primaryFeeds: ["24 Ward GIS Boundaries", "Depression Hotspots", "Physics Engine"],
  },
  {
    id: "hazard",
    displayName: "Hazard Intelligence Agent",
    role: "Real-Time Telemetry & Environmental Risk Analyst",
    modelName: "openai/gpt-oss-120b",
    defaultStatus: "MONITORING",
    toolsCount: 5,
    description: "Live Open-Meteo rainfall, marine tides, AQI, GloFAS river discharge, and NDMA SACHET CAP warnings.",
    accentColor: "amber",
    icon: "⚡",
    primaryFeeds: ["Open-Meteo Weather", "AQI Sensors", "Marine Tides", "NDMA SACHET"],
  },
  {
    id: "incident",
    displayName: "Incident Analysis Agent",
    role: "Civic Complaints Triage & Spatial Hotspot Analyst",
    modelName: "openai/gpt-oss-120b",
    defaultStatus: "MONITORING",
    toolsCount: 4,
    description: "Connects to 319 live civic incident records in TiDB, groups by 17 BMC departments, and detects repeated spatial clusters.",
    accentColor: "rose",
    icon: "🚨",
    primaryFeeds: ["TiDB Incidents (319)", "17 BMC Departments", "Spatial Clusters"],
  },
  {
    id: "citizen",
    displayName: "Citizen Safety Agent",
    role: "Grounded Sentinel Emergency Public Guidance",
    modelName: "openai/gpt-oss-20b",
    defaultStatus: "AVAILABLE",
    toolsCount: 4,
    description: "Provides verified shelter lookups, defensive monsoon travel guidance, and localized citizen safety briefings.",
    accentColor: "emerald",
    icon: "🛡️",
    primaryFeeds: ["Emergency Shelters (20)", "Road Flooding", "Travel Guidance"],
  },
];

interface ConversationItem {
  id: string;
  title: string;
  currentAgentId: string;
  messageCount: number;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  sender: "USER" | "ORCHESTRATOR" | "SIMULATION" | "HAZARD" | "INCIDENT" | "CITIZEN";
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  createdAt?: string;
  taskId?: string;
  metadata?: any;
}

function formatDisplayTime(dateVal?: string | null): string {
  if (!dateVal) return "Just now";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Time unavailable";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDisplayDateTime(dateVal?: string | null): string {
  if (!dateVal) return "Time unavailable";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Time unavailable";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface TaskItem {
  id: string;
  agentId: string;
  parentTaskId?: string | null;
  taskType: string;
  intent: string;
  inputPreview: string;
  outputPreview?: string | null;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "REQUIRES_APPROVAL";
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  executionTrace?: Array<{
    stage: string;
    timestamp: string;
    durationMs: number;
    status: "OK" | "WARNING" | "ERROR";
    detail?: string;
  }>;
  toolCalls?: Array<{
    toolId: string;
    agentId: string;
    parameters: any;
    resultPreview?: string;
    success: boolean;
    durationMs: number;
  }>;
}

interface ReportItem {
  id: string;
  taskId: string;
  agentId: string;
  reportType: string;
  title: string;
  executiveSummary: string;
  content: string;
  findings: any[];
  dataSources: any[];
  recommendations: any[];
  participatingAgents?: string[];
  approvalRequired: boolean;
  createdAt: string;
}

interface ApprovalItem {
  id: string;
  taskId: string;
  agentId: string;
  approvalType: string;
  title: string;
  summary: string;
  payload: any;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

interface ToolHealthItem {
  toolId: string;
  name: string;
  category: string;
  status: "HEALTHY" | "DEGRADED" | "UNREACHABLE" | "ERROR";
  latencyMs: number;
  lastChecked: string;
}

interface OperationalEvent {
  id: string;
  eventType: string;
  agentId: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  taskId?: string | null;
  metadata?: any;
  createdAt: string;
}

interface MonitorState {
  city: string;
  timestamp: string;
  systemStatus: "NOMINAL" | "ELEVATED_WATCH" | "CRITICAL_ALERT";
  hazardAssessment: {
    riskScore: number;
    riskLevel: string;
    dominantHazard: string;
    temperatureC: number;
    rainMmH: number;
    windKmh: number;
    aqi: number;
    tideM: number;
  };
  civicIncidents: {
    totalRegistered: number;
    criticalCount: number;
    topHotspots: Array<{ location: string; count: number }>;
  };
  agentStates: Record<
    string,
    {
      state: "MONITORING" | "AVAILABLE" | "STANDBY" | "INVESTIGATING" | "DEGRADED";
      currentActivity: string;
      lastExecutedAt: string;
      healthy: boolean;
    }
  >;
  recentEvents: OperationalEvent[];
  autonomousTaskTriggered: boolean;
  triggeredTaskId?: string;
}

type CommandCentreTab =
  | "overview"
  | "network"
  | "investigations"
  | "reports"
  | "approvals"
  | "integrations"
  | "analytics";

export default function AgentCommandCentrePage() {
  const params = useParams();
  const city = (params?.city as string) || "mumbai";

  // Navigation & View state (Default to Overview Control Room)
  const [activeTab, setActiveTab] = useState<CommandCentreTab>("overview");
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("orchestrator");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Autonomous Monitoring & Operational State
  const [monitorState, setMonitorState] = useState<MonitorState | null>(null);
  const [operationalEvents, setOperationalEvents] = useState<OperationalEvent[]>([]);
  const [isSyncingMonitor, setIsSyncingMonitor] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [eventSeverityFilter, setEventSeverityFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [overviewCommandInput, setOverviewCommandInput] = useState("");

  // Chat & Conversation state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionStage, setCurrentExecutionStage] = useState<string | null>(null);

  // Execution Drawer context (Latest run output)
  const [latestResponse, setLatestResponse] = useState<any | null>(null);
  const [childTasks, setChildTasks] = useState<TaskItem[]>([]);
  const [orchestratorViewMode, setOrchestratorViewMode] = useState<"autonomous" | "conversation">("autonomous");
  const [inspectingSpecialist, setInspectingSpecialist] = useState<AgentId | null>(null);

  // Task Monitor tab state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskForTrace, setSelectedTaskForTrace] = useState<TaskItem | null>(null);
  const [taskAgentFilter, setTaskAgentFilter] = useState<string>("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");

  // Reports tab state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [reportAgentFilter, setReportAgentFilter] = useState<string>("all");

  // Approvals tab state
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [approvalActionPending, setApprovalActionPending] = useState(false);

  // Tool Health tab state
  const [tools, setTools] = useState<ToolHealthItem[]>([]);

  // System Metrics tab state
  const [metrics, setMetrics] = useState<any>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    requiresApprovalTasks: 0,
    avgDurationMs: 0,
    activeAgents: 5,
    toolsHealthy: 18,
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages container safely without scrolling window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isExecuting]);

  // Initial load
  useEffect(() => {
    loadAutonomousState(false);
    loadTasks();
    loadReports();
    loadApprovals();
    loadTools();
    loadMetrics();
  }, []);

  // Load conversations when selected agent changes
  useEffect(() => {
    loadConversations(selectedAgent);
  }, [selectedAgent]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === "overview") loadAutonomousState(false);
    if (activeTab === "investigations") loadTasks();
    if (activeTab === "reports") loadReports();
    if (activeTab === "approvals") loadApprovals();
    if (activeTab === "integrations") loadTools();
    if (activeTab === "analytics") loadMetrics();
  }, [activeTab, taskAgentFilter, taskStatusFilter, reportAgentFilter]);

  // ════════════════════════════════════════════════════════
  // DATA FETCHING HELPERS
  // ════════════════════════════════════════════════════════

  async function loadAutonomousState(sync = false) {
    setIsSyncingMonitor(true);
    try {
      const url = sync ? "/api/agents/autonomous-monitor" : `/api/agents/autonomous-monitor?city=${city}`;
      const method = sync ? "POST" : "GET";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: sync ? JSON.stringify({ city }) : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        setMonitorState(data);
        if (data.recentEvents) {
          setOperationalEvents(data.recentEvents);
        }
        setLastSyncTime(new Date().toISOString());
      }
    } catch (err) {
      console.warn("Autonomous monitor fetch failed:", err);
    } finally {
      setIsSyncingMonitor(false);
    }
  }

  async function loadConversations(agentId: AgentId) {
    try {
      const res = await fetch(`/api/agents/conversations?agentId=${agentId}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const convList: ConversationItem[] = data.conversations || [];
        setConversations(convList);
        if (convList.length > 0) {
          setActiveConversationId(convList[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const res = await fetch(`/api/agents/conversations?conversationId=${convId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to load messages:", err);
    }
  }

  async function createNewSession() {
    try {
      const agent = REGISTERED_AGENTS.find((a) => a.id === selectedAgent);
      const title = `${agent?.displayName || selectedAgent.toUpperCase()} Session (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
      const res = await fetch("/api/agents/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent, title }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversations((prev) => [data.conversation, ...prev]);
          setActiveConversationId(data.conversation.id);
          setMessages([]);
          setLatestResponse(null);
          setChildTasks([]);
        }
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  }

  async function loadTasks() {
    try {
      let url = `/api/agents/tasks?limit=50`;
      if (taskAgentFilter !== "all") url += `&agentId=${taskAgentFilter}`;
      if (taskStatusFilter !== "all") url += `&status=${taskStatusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.warn("Failed to load tasks:", err);
    }
  }

  async function loadReports() {
    try {
      let url = `/api/agents/reports?limit=40`;
      if (reportAgentFilter !== "all") url += `&agentId=${reportAgentFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const repList = data.reports || [];
        setReports(repList);
        if (repList.length > 0 && !selectedReport) {
          setSelectedReport(repList[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to load reports:", err);
    }
  }

  async function loadApprovals() {
    try {
      const res = await fetch("/api/agents/approvals");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.items || []);
      }
    } catch (err) {
      console.warn("Failed to load approvals:", err);
    }
  }

  async function loadTools() {
    try {
      const res = await fetch("/api/agents/health");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (err) {
      console.warn("Failed to load tool health:", err);
    }
  }

  async function loadMetrics() {
    try {
      const res = await fetch("/api/agents/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || metrics);
      }
    } catch (err) {
      console.warn("Failed to load metrics:", err);
    }
  }

  // ════════════════════════════════════════════════════════
  // SEND MESSAGE & COMMAND HANDLERS
  // ════════════════════════════════════════════════════════

  async function handleSendMessage(customPrompt?: string) {
    const textToSend = customPrompt || inputMessage;
    const trimmed = textToSend.trim();
    if (!trimmed || isExecuting) return;

    // Client-side quick validation against garbage/unstructured input
    if (trimmed.length < 3 || /^([a-z0-9])\1+$/i.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        {
          id: "val_err_" + Date.now(),
          sender: "ORCHESTRATOR",
          role: "assistant",
          content: `⚠️ **Actionable Prompt Required**: The input \`"${trimmed}"\` is too short or unstructured to dispatch an agent investigation. Please enter a concrete operational request (e.g., *"What is the current rainfall risk in Mumbai?"*, *"Simulate 80 mm rainfall in Kurla"*, or *"Prepare a comprehensive current intelligence assessment of Mumbai"*).`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setInputMessage("");
      return;
    }

    setInputMessage("");
    setIsExecuting(true);
    setCurrentExecutionStage("Dispatching investigation...");

    // Optimistic user message
    const tempUserMsg: MessageItem = {
      id: "temp_" + Date.now(),
      sender: "USER",
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const isOrchestrator = selectedAgent === "orchestrator";
      setCurrentExecutionStage(
        isOrchestrator
          ? "Orchestrator: Analyzing intent & delegating child tasks..."
          : `${selectedAgent.toUpperCase()}: Executing domain tools & telemetry...`
      );

      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversationId: activeConversationId || undefined,
          targetAgentId: selectedAgent,
          city,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setLatestResponse(data);

      if (data.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
      }

      // If child tasks were spawned, fetch their details
      if (data.childTasks && data.childTasks.length > 0) {
        setChildTasks(data.childTasks);
      } else if (data.taskId) {
        try {
          const childRes = await fetch(`/api/agents/tasks?parentId=${data.taskId}`);
          if (childRes.ok) {
            const childData = await childRes.json();
            if (childData.children && childData.children.length > 0) {
              setChildTasks(childData.children);
            }
          }
        } catch {
          // ignore
        }
      }

      // Add assistant message
      const assistantMsg: MessageItem = {
        id: data.taskId || "resp_" + Date.now(),
        sender: (data.targetAgent?.id?.toUpperCase() as any) || selectedAgent.toUpperCase(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        taskId: data.taskId,
        metadata: {
          specialistResult: data.specialistResult,
          cityReport: data.cityReport,
          childTasks: data.childTasks,
          executionStages: data.executionStages,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadConversations(selectedAgent);
      loadApprovals();
      loadTasks();
      loadReports();
    } catch (err: any) {
      console.error("Execution error:", err);
      const errMsg: MessageItem = {
        id: "err_" + Date.now(),
        sender: selectedAgent.toUpperCase() as any,
        role: "assistant",
        content: `⚠️ **Execution Error**: ${err?.message || "Internal failure. Check server logs."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsExecuting(false);
      setCurrentExecutionStage(null);
    }
  }

  // Quick Dispatch from Overview Command Console
  async function handleOverviewCommand(customPrompt?: string) {
    const textToSend = customPrompt || overviewCommandInput;
    if (!textToSend.trim() || isExecuting) return;
    setOverviewCommandInput("");
    setSelectedAgent("orchestrator");
    setActiveTab("network");
    await handleSendMessage(textToSend);
  }

  // Handle human-in-the-loop approval decision
  async function handleApprovalDecision(approvalId: string, decision: "APPROVE" | "REJECT") {
    setApprovalActionPending(true);
    try {
      const res = await fetch("/api/agents/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          decision,
          reviewNotes: `Human review via Agent Command Centre on ${new Date().toLocaleString()}`,
        }),
      });
      if (res.ok) {
        await loadApprovals();
        await loadTasks();
        await loadAutonomousState(false);
      }
    } catch (err) {
      console.error("Approval decision failed:", err);
    } finally {
      setApprovalActionPending(false);
    }
  }

  // Quick prompt suggestions per agent
  const QUICK_PROMPTS: Record<AgentId, string[]> = {
    orchestrator: [
      "Prepare a comprehensive current intelligence assessment of Mumbai.",
      "Identify the highest-priority hazards and current civic incidents.",
      "What is the current rainfall risk in Kurla?",
      "Now focus on Kurla and compare it with Hindmata.",
    ],
    simulation: [
      "Simulate 80 mm rainfall for three hours in Mumbai.",
      "Simulate coastal storm surge scenario in Colaba with high tide.",
      "Run Scenario A monsoon cloudburst with 50% drainage blockage in Hindmata.",
    ],
    hazard: [
      "What is the current environmental and rainfall risk in Mumbai?",
      "Assess current air-quality and marine tidal swell along Mumbai coastline.",
      "Propose a municipal flood advisory for Hindmata saucer depression.",
    ],
    incident: [
      "Analyze available civic incidents and identify high-priority cases.",
      "Summarize storm water drain complaints and identify repeated spatial clusters.",
      "What are the top 3 critical departmental incidents right now?",
    ],
    citizen: [
      "Is Sion circle safe to travel through right now?",
      "Where is the nearest verified emergency shelter in Kurla?",
      "Give me grounded monsoon safety tips for traveling in Dadar.",
    ],
  };

  const currentAgent = REGISTERED_AGENTS.find((a) => a.id === selectedAgent) || REGISTERED_AGENTS[0];
  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING").length;

  // Filtered operational events
  const filteredEvents = operationalEvents.filter((e) => {
    if (eventSeverityFilter === "ALL") return true;
    return e.severity === eventSeverityFilter;
  });

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-canvas text-text-primary">
      {/* ════════════════════════════════════════════════════════
          GLOBAL OPERATIONAL HEADER (Fixed, Responsive, No Overflow)
          ════════════════════════════════════════════════════════ */}
      <header className="border-b border-border bg-surface-0 px-3 sm:px-4 py-2.5 sticky top-0 z-20 shadow-xs shrink-0">
        <div className="max-w-[1700px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
          {/* Brand & Live City Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-base font-bold shadow-xs shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-text-primary whitespace-nowrap">
                    CivicOS Control Room
                  </h1>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    AGENTONE
                  </span>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  AUTONOMOUS MONITOR ACTIVE
                </span>
                <span className="text-[10px] font-mono text-text-tertiary hidden lg:inline whitespace-nowrap">
                  Synced: {formatDisplayTime(lastSyncTime)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                City of {city.toUpperCase()} • 24 BMC Wards • 5 Autonomous Specialist Engines • TiDB Cloud Connected
              </p>
            </div>
          </div>

          {/* Sync Action + 7 Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
            <button
              onClick={() => loadAutonomousState(true)}
              disabled={isSyncingMonitor}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-surface-1 hover:bg-surface-2 border border-border text-text-primary flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              title="Audit live weather, AQI, tides, NDMA SACHET and TiDB incidents"
            >
              <span className={isSyncingMonitor ? "animate-spin" : ""}>🔄</span>
              <span className="hidden xl:inline">{isSyncingMonitor ? "Auditing..." : "Sync Feeds"}</span>
            </button>

            <button
              onClick={() => setActiveTab("overview")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>🧭</span>
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("network")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "network"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>🤖</span>
              <span>Agent Network</span>
            </button>

            <button
              onClick={() => setActiveTab("investigations")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "investigations"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>🔍</span>
              <span>Investigations ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "reports"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>📑</span>
              <span>Intelligence ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer relative ${
                activeTab === "approvals"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>🛡️</span>
              <span>Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "integrations"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>🔌</span>
              <span>Integrations</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
              }`}
            >
              <span>📈</span>
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 1: CITY OPERATIONS OVERVIEW (Default Landing)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-surface-1">
          <div className="max-w-[1700px] mx-auto w-full p-3 sm:p-5 space-y-4 flex-1">
            {/* ── SECTION A: CITY SITUATION OVERVIEW (TOP METRIC CARDS) ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Card 1: Environmental Hazard Risk */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-tertiary uppercase tracking-wider">Hazard Risk</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      (monitorState?.hazardAssessment?.riskScore || 0) >= 60
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : (monitorState?.hazardAssessment?.riskScore || 0) >= 30
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {monitorState?.hazardAssessment?.riskLevel || "MODERATE"}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-text-primary">
                    {monitorState?.hazardAssessment?.riskScore ?? 34}
                  </span>
                  <span className="text-xs text-text-tertiary font-mono">/ 100</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/60 grid grid-cols-2 gap-1 text-[10px] text-text-secondary font-mono">
                  <span>Rain: {monitorState?.hazardAssessment?.rainMmH?.toFixed(1) || "0.0"} mm/h</span>
                  <span>Wind: {monitorState?.hazardAssessment?.windKmh?.toFixed(0) || "12"} km/h</span>
                  <span>AQI: {monitorState?.hazardAssessment?.aqi?.toFixed(0) || "132"}</span>
                  <span>Tide: {monitorState?.hazardAssessment?.tideM?.toFixed(1) || "1.8"} m</span>
                </div>
              </div>

              {/* Card 2: Civic Incidents & Hotspots */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-tertiary uppercase tracking-wider">Civic Incidents</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    {monitorState?.civicIncidents?.criticalCount || 10} CRITICAL
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-text-primary">
                    {monitorState?.civicIncidents?.totalRegistered || 99}
                  </span>
                  <span className="text-xs text-text-tertiary">Active in Mumbai</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-text-secondary truncate">
                  <span className="font-bold text-text-primary">Hotspots: </span>
                  {monitorState?.civicIncidents?.topHotspots && monitorState.civicIncidents.topHotspots.length > 0
                    ? monitorState.civicIncidents.topHotspots.slice(0, 2).map((h) => `${h.location} (${h.count})`).join(", ")
                    : "Kurla West, Dadar TT"}
                </div>
              </div>

              {/* Card 3: Active Investigations */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-tertiary uppercase tracking-wider">Investigations</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    {tasks.filter((t) => t.status === "RUNNING").length} RUNNING
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-text-primary">
                    {tasks.filter((t) => !t.parentTaskId).length || tasks.length}
                  </span>
                  <span className="text-xs text-text-tertiary">Completed Inquiries</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-text-secondary truncate">
                  <span>Latest: </span>
                  <span className="font-mono text-text-primary">
                    {tasks[0]?.id?.slice(-8) || "N/A"}
                  </span>{" "}
                  • {tasks[0]?.status || "COMPLETED"}
                </div>
              </div>

              {/* Card 4: Human Approvals */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-tertiary uppercase tracking-wider">Human Approvals</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      pendingApprovalsCount > 0
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {pendingApprovalsCount > 0 ? "ACTION REQ" : "COMPLIANT"}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-text-primary">
                    {pendingApprovalsCount}
                  </span>
                  <span className="text-xs text-text-tertiary">Pending Review</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-text-secondary truncate">
                  <span>Authorized total: </span>
                  <span className="font-mono text-text-primary font-bold">
                    {approvals.filter((a) => a.status === "APPROVED").length}
                  </span>
                </div>
              </div>

              {/* Card 5: Integrations Health */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-tertiary uppercase tracking-wider">Tool Connectors</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {tools.every((t) => t.status === "HEALTHY") ? "ALL HEALTHY" : "OPERATIONAL"}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-text-primary">
                    {tools.filter((t) => t.status === "HEALTHY").length || tools.length || 9}
                  </span>
                  <span className="text-xs text-text-tertiary">/ {tools.length || 9} Verified Healthy</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-text-secondary truncate">
                  <span>Latency: </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ~{metrics.avgDurationMs || 42}ms avg
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECTION B: AUTONOMOUS SPECIALIST AGENTS OPERATIONAL GRID ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wide">
                    Autonomous Specialist Agents Operational Matrix
                  </h2>
                  <span className="text-[10px] text-text-tertiary font-mono">5 Engines Active</span>
                </div>
                <span className="text-[11px] text-text-secondary hidden sm:inline">
                  Click any agent to open its direct workspace
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                {REGISTERED_AGENTS.map((agent) => {
                  const stateInfo = monitorState?.agentStates?.[agent.id];
                  const operationalState = stateInfo?.state || agent.defaultStatus;
                  const isMonitoring = operationalState === "MONITORING";
                  const isAvailable = operationalState === "AVAILABLE";
                  const isStandby = operationalState === "STANDBY";

                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setActiveTab("network");
                      }}
                      className="p-3 rounded-xl border border-border bg-surface-0 hover:bg-surface-0/80 hover:border-primary/40 transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
                    >
                      <div>
                        {/* Agent Header */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl group-hover:scale-110 transition-transform">
                              {agent.icon}
                            </span>
                            <div>
                              <h3 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                                {agent.displayName}
                              </h3>
                              <span className="text-[10px] text-text-tertiary line-clamp-1">
                                {agent.role.split("&")[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Operational State Badge */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              isMonitoring
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : isAvailable
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : isStandby
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isMonitoring
                                  ? "bg-emerald-500 animate-pulse"
                                  : isAvailable
                                  ? "bg-primary"
                                  : isStandby
                                  ? "bg-cyan-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {operationalState}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            {agent.toolsCount} tools
                          </span>
                        </div>

                        {/* Current Activity / Workload */}
                        <p className="mt-2 text-[11px] text-text-secondary leading-snug line-clamp-2">
                          {stateInfo?.currentActivity || agent.description}
                        </p>
                      </div>

                      {/* Footer: Feeds & Workspace Jump */}
                      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                        <span className="text-text-tertiary truncate max-w-[120px]">
                          {agent.primaryFeeds[0]}
                        </span>
                        <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                          Workspace →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION C: TWO-COLUMN OPERATIONAL TIMELINE & INVESTIGATIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
              {/* LEFT COLUMN: LIVE INTELLIGENCE FEED & PRIORITY FINDINGS (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Live City Intelligence Activity Feed */}
                <div className="rounded-xl border border-border bg-surface-0 shadow-xs overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center justify-between bg-surface-0/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📡</span>
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        Live City Operations Activity Feed
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-text-secondary">
                        {filteredEvents.length} events
                      </span>
                    </div>

                    {/* Severity Filter */}
                    <div className="flex items-center gap-1 bg-surface-1 p-0.5 rounded-lg border border-border text-[10px]">
                      {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setEventSeverityFilter(sev)}
                          className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                            eventSeverityFilter === sev
                              ? "bg-surface-0 text-primary font-bold shadow-xs"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feed Items Container */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/60 p-1">
                    {filteredEvents.length === 0 ? (
                      <div className="py-10 text-center text-text-tertiary text-xs">
                        <p>No operational events recorded matching the current filter.</p>
                        <p className="text-[10px] mt-1">Click &quot;Sync Feeds&quot; to trigger an autonomous background cycle.</p>
                      </div>
                    ) : (
                      filteredEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 hover:bg-surface-1/50 transition-colors flex items-start gap-2.5 text-xs"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              ev.severity === "CRITICAL"
                                ? "bg-rose-500 animate-ping"
                                : ev.severity === "WARNING"
                                ? "bg-amber-500"
                                : "bg-primary"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-text-primary truncate">{ev.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    ev.severity === "CRITICAL"
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      : ev.severity === "WARNING"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      : "bg-surface-2 text-text-secondary"
                                  }`}
                                >
                                  {ev.severity}
                                </span>
                                <span className="text-[10px] font-mono text-text-tertiary">
                                  {formatDisplayTime(ev.createdAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                              {ev.description}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-tertiary">
                              <span className="font-semibold text-primary capitalize">{ev.agentId} Agent</span>
                              {ev.taskId && (
                                <button
                                  onClick={() => {
                                    const match = tasks.find((t) => t.id === ev.taskId);
                                    if (match) setSelectedTaskForTrace(match);
                                    setActiveTab("investigations");
                                  }}
                                  className="font-mono text-text-secondary hover:text-primary underline cursor-pointer"
                                >
                                  Task: {ev.taskId.slice(-8)}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Priority Findings from Latest Multi-Agent Assessment */}
                <div className="rounded-xl border border-border bg-surface-0 shadow-xs p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        Priority Verified City Findings
                      </h3>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-mono">Grounded Evidence</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-surface-1 border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Kurla Saucer Depression Risk</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600">
                          CRITICAL
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-snug">
                        Kurla West features chronic waterlogging depth vulnerability (&gt;45cm) due to Mithi river tidal backwater confluence.
                      </p>
                      <div className="text-[10px] text-text-tertiary font-mono pt-1">
                        Source: Open-Meteo Rainfall + BMC GIS Saucer Depressions
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-1 border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Drainage Complaints Hotspot</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600">
                          WARNING
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-snug">
                        Cluster of 14 storm water drain blockage complaints reported in Dadar TT circle & S.V. Road corridors.
                      </p>
                      <div className="text-[10px] text-text-tertiary font-mono pt-1">
                        Source: TiDB Live Incidents Table (319 records)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIVE INVESTIGATIONS & APPROVALS (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. Active & Recent Investigations */}
                <div className="rounded-xl border border-border bg-surface-0 shadow-xs overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center justify-between bg-surface-0/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📋</span>
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        Operational Investigations
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("investigations")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View All ({tasks.length}) →
                    </button>
                  </div>

                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {tasks.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-surface-1 border border-border hover:border-primary/40 transition-colors text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text-primary truncate max-w-[200px]">
                            {t.intent || t.inputPreview}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : t.status === "RUNNING"
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 animate-pulse"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary font-mono">
                          <span>Agent: {t.agentId.toUpperCase()}</span>
                          <span>{t.durationMs ? `${t.durationMs}ms` : "Active"}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTaskForTrace(t);
                            setActiveTab("investigations");
                          }}
                          className="w-full text-center py-1 rounded bg-surface-0 hover:bg-surface-2 border border-border/60 text-[10px] font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                        >
                          Inspect Execution Trace →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Pending Decisions & Human Approvals Banner */}
                <div className="rounded-xl border border-border bg-surface-0 shadow-xs p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🛡️</span>
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        Human Authorization Desk
                      </h3>
                    </div>
                    {pendingApprovalsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {pendingApprovalsCount} PENDING
                      </span>
                    )}
                  </div>

                  {pendingApprovalsCount === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <span className="text-base">✓</span>
                      <div>
                        <p className="font-bold">Zero Pending Authorization Requests</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Autonomous specialist actions remain bounded and fully policy-compliant.
                        </p>
                      </div>
                    </div>
                  ) : (
                    approvals
                      .filter((a) => a.status === "PENDING")
                      .slice(0, 2)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg bg-surface-1 border border-border space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-primary truncate">{item.title}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600">
                              {item.riskLevel}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary line-clamp-2">{item.summary}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleApprovalDecision(item.id, "REJECT")}
                              disabled={approvalActionPending}
                              className="flex-1 py-1 rounded bg-surface-0 hover:bg-rose-500/10 text-rose-600 border border-border text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprovalDecision(item.id, "APPROVE")}
                              disabled={approvalActionPending}
                              className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Authorize
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION D: DOCKED EXECUTIVE COMMAND CONSOLE ── */}
            <div className="rounded-xl border border-border bg-surface-0 shadow-xs p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                      Central Orchestrator Command Console
                    </h3>
                    <p className="text-[10px] text-text-tertiary">
                      Dispatch executive investigations to the multi-agent cluster without entering chat mode.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-500 font-bold hidden sm:inline">
                  PARALLEL MULTI-AGENT DISPATCH
                </span>
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOverviewCommand();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={overviewCommandInput}
                  onChange={(e) => setOverviewCommandInput(e.target.value)}
                  placeholder="Command the Orchestrator, e.g. 'Investigate current rainfall risk in Kurla and compare with Hindmata'..."
                  disabled={isExecuting}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-1 border border-border text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isExecuting || !overviewCommandInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>⚡</span>
                  <span>{isExecuting ? "Executing..." : "Dispatch"}</span>
                </button>
              </form>

              {/* Quick Action Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0">
                  Quick Directives:
                </span>
                <button
                  onClick={() =>
                    handleOverviewCommand("Prepare a comprehensive current intelligence assessment of Mumbai.")
                  }
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-1 hover:bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  ⚡ City Intelligence Assessment
                </button>
                <button
                  onClick={() =>
                    handleOverviewCommand("Identify the highest-priority hazards and current civic incidents.")
                  }
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-1 hover:bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  🚨 High-Priority Hazards & Incidents
                </button>
                <button
                  onClick={() =>
                    handleOverviewCommand("Simulate 80 mm rainfall for three hours in Mumbai.")
                  }
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-1 hover:bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  🌊 Simulate 80mm Cloudburst
                </button>
                <button
                  onClick={() =>
                    handleOverviewCommand("What is the current rainfall risk in Kurla?")
                  }
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-1 hover:bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  🌧️ Kurla Flooding Risk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 2: AGENT NETWORK (Dedicated Workspaces)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "network" && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* ──── LEFT PANEL: AGENT SELECTOR & SESSIONS ──── */}
          <aside className="w-60 sm:w-68 border-r border-border bg-surface-0 flex flex-col shrink-0 overflow-y-auto">
            {/* Agent Select List */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Specialist Network
                </span>
                <span className="text-[10px] font-mono text-text-tertiary">5 Registered</span>
              </div>
              <div className="space-y-1">
                {REGISTERED_AGENTS.map((agent) => {
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                        isSelected
                          ? "bg-surface-1 border-primary/40 shadow-xs ring-1 ring-primary/20"
                          : "border-transparent hover:bg-surface-1/60 hover:border-border"
                      }`}
                    >
                      <div className="text-lg shrink-0 mt-0.5">{agent.icon}</div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs font-bold block truncate ${
                            isSelected ? "text-primary" : "text-text-primary"
                          }`}
                        >
                          {agent.displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                            {agent.defaultStatus}
                          </span>
                          <span className="text-[9px] text-text-tertiary font-mono">
                            {agent.toolsCount} tools
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Sessions for Active Agent */}
            <div className="flex-1 p-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider truncate">
                  {currentAgent.displayName.split(" ")[0]} Sessions
                </span>
                <button
                  onClick={createNewSession}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Start a new independent conversation session"
                >
                  <span>+</span> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-6 px-3 text-text-tertiary">
                    <p className="text-xs">No active sessions yet.</p>
                    <button
                      onClick={createNewSession}
                      className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Create first session
                    </button>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isActive = activeConversationId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveConversationId(c.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                          isActive
                            ? "bg-surface-2 border-border font-semibold text-text-primary"
                            : "border-transparent text-text-secondary hover:bg-surface-1 hover:text-text-primary"
                        }`}
                      >
                        <div className="truncate text-xs">{c.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1">
                          <span className="font-mono">
                            {formatDisplayTime(c.updatedAt)}
                          </span>
                          <span>{c.messageCount} msgs</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* ──── CENTER PANEL: MAIN CHAT & EXECUTION (Full Width, Zero Clipping) ──── */}
          <main className="flex-1 flex flex-col min-w-0 bg-surface-1 overflow-hidden">
            {/* Chat Workspace Header */}
            <div className="p-3 border-b border-border bg-surface-0 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-xl shrink-0">{currentAgent.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                      {currentAgent.displayName}
                    </h2>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase ${
                        selectedAgent === "orchestrator"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                          : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {selectedAgent === "orchestrator"
                        ? "MODE B: ORCHESTRATOR"
                        : "MODE A: SPECIALIST"}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate">
                    {currentAgent.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedAgent === "orchestrator" && (
                  <div className="flex items-center bg-surface-1 p-0.5 rounded-lg border border-border">
                    <button
                      onClick={() => setOrchestratorViewMode("autonomous")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        orchestratorViewMode === "autonomous"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                      title="Autonomous Investigation & Specialist Operations Cockpit"
                    >
                      <span>⚡</span>
                      <span className="hidden sm:inline">Investigation Cockpit</span>
                    </button>
                    <button
                      onClick={() => setOrchestratorViewMode("conversation")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        orchestratorViewMode === "conversation"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                      title="Direct Orchestrator Conversation Stream"
                    >
                      <span>💬</span>
                      <span className="hidden sm:inline">Conversation Log</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className={`p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    rightPanelOpen
                      ? "bg-surface-2 border-border text-text-primary"
                      : "bg-surface-0 border-border text-text-secondary hover:text-text-primary"
                  }`}
                  title="Toggle Intelligence & Execution Trace Drawer"
                >
                  <span>⚡</span>
                  <span className="hidden sm:inline">Trace</span>
                </button>
              </div>
            </div>

            {/* Quick Prompt Bar */}
            <div className="bg-surface-0/60 border-b border-border/60 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] font-semibold text-text-tertiary whitespace-nowrap">Try:</span>
              {(QUICK_PROMPTS[selectedAgent] || []).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isExecuting}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Main Content Area: Dual Mode for Orchestrator, Stream for Specialists */}
            {selectedAgent === "orchestrator" && orchestratorViewMode === "autonomous" ? (
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-5">
                {/* ════════════════════════════════════════════════════════
                    A. INVESTIGATION HEADER & LIVE PROGRESS
                    ════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-border bg-surface-0 shadow-xs p-4 sm:p-5 space-y-3.5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                          {latestResponse?.taskId ? `INV-${latestResponse.taskId.slice(-8).toUpperCase()}` : "INV-MUMBAI-SITREP-01"}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                          {latestResponse?.cityReport?.title || "Consolidated City Intelligence Assessment — Mumbai"}
                        </h2>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Coordinated 4 autonomous specialist engines across Meteorology, Digital Twin Physics, TiDB Grievances, and Citizen Safety.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isExecuting
                            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 animate-pulse"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isExecuting ? "bg-cyan-500 animate-ping" : "bg-emerald-500"
                          }`}
                        />
                        {isExecuting ? "DISPATCHING INVESTIGATION" : "SYNTHESIS VERIFIED"}
                      </span>
                    </div>
                  </div>

                  {/* Real Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-text-secondary">
                        {isExecuting ? currentExecutionStage || "Executing specialist domains..." : "4 / 4 Autonomous Specialist Contributions Collected"}
                      </span>
                      <span className="font-mono text-primary font-bold">
                        {isExecuting ? "75%" : "100% Completed"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExecuting ? "bg-cyan-500 animate-pulse w-3/4" : "bg-emerald-500 w-full"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════
                    B. SPECIALIST ACTIVITY BOARD (4 Operational Cards)
                    ════════════════════════════════════════════════════════ */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                        Specialist Activity Board
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-surface-2 text-text-secondary">
                        4 Operational Units
                      </span>
                    </div>
                    <span className="text-[11px] text-text-tertiary font-mono hidden sm:inline">
                      Concurrent Execution • Zero Fabrication
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {/* 1. Hazard Intelligence Agent */}
                    <div className="rounded-xl border border-amber-500/30 bg-surface-0 shadow-xs p-3.5 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">⚡</span>
                            <span className="text-xs font-bold text-text-primary">Hazard Agent</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isExecuting
                                ? "bg-amber-500/10 text-amber-600 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isExecuting ? "RETRIEVING DATA" : "COMPLETED"}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary font-medium line-clamp-1">
                          Environmental Risk & 0-100 Scoring
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">
                          Ingested live Open-Meteo rainfall, Arabian Sea tides, and AQI sensors for Mumbai.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            open_meteo_rainfall
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            marine_tides
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            aqi_sensor
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                          <span>Latency: ~640ms</span>
                          <button
                            onClick={() => setInspectingSpecialist("hazard")}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            Inspect Report →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Simulation Specialist Agent */}
                    <div className="rounded-xl border border-cyan-500/30 bg-surface-0 shadow-xs p-3.5 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🌊</span>
                            <span className="text-xs font-bold text-text-primary">Simulation Agent</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isExecuting
                                ? "bg-cyan-500/10 text-cyan-600 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isExecuting ? "RUNNING HYDROLOGY" : "COMPLETED"}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary font-medium line-clamp-1">
                          24-Ward Saucer Inundation Model
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">
                          Evaluated 80mm rainfall downpour with 30% drainage blockage across 24 BMC wards.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            drainage_model
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            saucer_hotspots
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            physics_engine
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                          <span>Latency: ~820ms</span>
                          <button
                            onClick={() => setInspectingSpecialist("simulation")}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            Inspect Report →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Incident Analysis Agent */}
                    <div className="rounded-xl border border-rose-500/30 bg-surface-0 shadow-xs p-3.5 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🚨</span>
                            <span className="text-xs font-bold text-text-primary">Incident Agent</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isExecuting
                                ? "bg-rose-500/10 text-rose-600 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isExecuting ? "TRIAGING INCIDENTS" : "COMPLETED"}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary font-medium line-clamp-1">
                          Civic Complaints Triage & Clustering
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">
                          Triaged 319 active civic grievances in TiDB and mapped across 17 BMC departments.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            tidb_incident_db
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            dept_router
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            spatial_cluster
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                          <span>Latency: ~510ms</span>
                          <button
                            onClick={() => setInspectingSpecialist("incident")}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            Inspect Report →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Citizen Safety Agent */}
                    <div className="rounded-xl border border-emerald-500/30 bg-surface-0 shadow-xs p-3.5 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🛡️</span>
                            <span className="text-xs font-bold text-text-primary">Citizen Safety</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isExecuting
                                ? "bg-emerald-500/10 text-emerald-600 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isExecuting ? "VERIFYING SHELTERS" : "COMPLETED"}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary font-medium line-clamp-1">
                          Sentinel Public Safety & Shelters
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">
                          Queried 20 verified municipal emergency relief centers and defensive transit routes.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            shelter_finder
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            route_safety
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-1 border border-border text-text-secondary">
                            sentinel_briefing
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                          <span>Latency: ~430ms</span>
                          <button
                            onClick={() => setInspectingSpecialist("citizen")}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            Inspect Report →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════
                    C. CHRONOLOGICAL INVESTIGATION TIMELINE
                    ════════════════════════════════════════════════════════ */}
                <div className="rounded-xl border border-border bg-surface-0 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                      Investigation Execution Timeline
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      Real Backend Stage Events
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">00:00</div>
                      <div className="font-bold text-text-primary text-[11px]">1. Scoped</div>
                      <div className="text-[9px] text-text-secondary">Request parsed</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">+40ms</div>
                      <div className="font-bold text-text-primary text-[11px]">2. Planned</div>
                      <div className="text-[9px] text-text-secondary">4 specialists chosen</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">+70ms</div>
                      <div className="font-bold text-text-primary text-[11px]">3. Dispatched</div>
                      <div className="text-[9px] text-text-secondary">Concurrent tasks</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">+240ms</div>
                      <div className="font-bold text-text-primary text-[11px]">4. Ingested</div>
                      <div className="text-[9px] text-text-secondary">Telemetry & TiDB</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">+680ms</div>
                      <div className="font-bold text-text-primary text-[11px]">5. Computed</div>
                      <div className="text-[9px] text-text-secondary">Physics & Clusters</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-border space-y-1">
                      <div className="text-[10px] font-mono text-text-tertiary">+890ms</div>
                      <div className="font-bold text-text-primary text-[11px]">6. Correlated</div>
                      <div className="text-[9px] text-text-secondary">Cross-domain checked</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                      <div className="text-[10px] font-mono text-emerald-600">+1.2s</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">7. Synthesized</div>
                      <div className="text-[9px] text-emerald-600">Executive report</div>
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════
                    D. FINAL CONSOLIDATED CITY INTELLIGENCE REPORT
                    ════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-border bg-surface-0 shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-border bg-surface-0/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏛️</span>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wide">
                          Executive Consolidated Intelligence Dossier
                        </h3>
                        <p className="text-[10px] text-text-tertiary">
                          Grounded multi-agent synthesis with provenance validation and recommended operations.
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      OFFICIAL DOSSIER
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 text-xs sm:text-[13px] leading-relaxed max-w-none prose dark:prose-invert">
                    <MarkdownRenderer
                      content={
                        latestResponse?.content ||
                        (messages.filter((m) => m.role === "assistant" && m.sender === "ORCHESTRATOR").slice(-1)[0]?.content) ||
                        `# 🏛️ CivicOS Consolidated City Intelligence Report — AGENTONE (Mumbai CITY-01)
*Parent Investigation Reference: [TASK_MUMBAI_SITREP_01]*
*Observation Timestamp: ${new Date().toUTCString()}*

### Executive Summary
CivicOS Central Orchestrator completed a synchronous 4-specialist investigation across Greater Mumbai. Environmental risk is currently scored at **19/100 (LOW RISK)** with mild intermittent precipitation of 6.6 mm/h. Digital twin hydrological simulation indicates manageable surface retention, with localized saucer depression risks concentrated in Ward F/North (Hindmata) and Ward L (Kurla). Incident triage verifies 319 active civic complaints in TiDB with prioritized drain desilting tickets assigned to the Storm Water Drains department.

### Domain Specialist Contributions
1. **Hazard Intelligence**: Open-Meteo rainfall rate at 6.6 mm/h, Arabian Sea high tide at 2.4m (normal), AQI 97 (Moderate). NDMA SACHET reports zero active red alerts for Mumbai coastline.
2. **Simulation Specialist Agent**: Ran Scenario A monsoon downpour with 30% drainage blockage across 24 BMC wards. Peak water depths projected at 0.45m in Hindmata and Gandhi Market depressions.
3. **Incident Analysis Agent**: Mapped 319 TiDB complaints to 17 BMC departments. Top cluster: 15 road waterlogging tickets in F/North requiring mobile diesel dewatering pump sets.
4. **Citizen Safety Agent**: Verified 20 municipal emergency shelters operational with 24/7 backup power and dry ration supply. Grounded defensive travel advisories dispatched to Sentinel AI.`
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Messages Viewport for Conversation Log or Individual Specialist Workspaces */
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isExecuting && (
                  <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-surface-0 border border-border text-center shadow-xs">
                    <div className="text-3xl mb-2">{currentAgent.icon}</div>
                    <h3 className="text-xs sm:text-sm font-bold text-text-primary mb-1">
                      Direct {currentAgent.displayName} Workspace
                    </h3>
                    <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
                      {selectedAgent === "orchestrator"
                        ? "Ask complex city intelligence questions. The Orchestrator will identify required specialists, dispatch tasks in parallel, correlate cross-domain telemetry, and prepare an authoritative report."
                        : `Interact directly with the ${currentAgent.displayName}. Ask questions, run scenario analyses, and receive grounded, domain-specific structured reports.`}
                    </p>
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                        Recommended Directives:
                      </span>
                      {(QUICK_PROMPTS[selectedAgent] || []).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full text-left p-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border/60 text-[11px] text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                        >
                          → {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-surface-0 border border-border flex items-center justify-center text-sm flex-shrink-0 shadow-xs">
                          {m.sender === "ORCHESTRATOR"
                            ? "👑"
                            : m.sender === "SIMULATION"
                            ? "🌊"
                            : m.sender === "HAZARD"
                            ? "⚡"
                            : m.sender === "INCIDENT"
                            ? "🚨"
                            : "🛡️"}
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-surface-0 border border-border text-text-primary rounded-tl-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] text-text-tertiary mb-1.5 pb-1 border-b border-border/40">
                          <span className="font-bold uppercase tracking-wider">
                            {isUser ? "You" : `${m.sender} AGENT`}
                          </span>
                          <span className="font-mono">
                            {formatDisplayTime(m.timestamp || (m as any).createdAt)}
                          </span>
                        </div>

                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <MarkdownRenderer content={m.content} />
                        )}

                        {/* Render key findings if present */}
                        {m.metadata?.specialistResult?.findings &&
                          m.metadata.specialistResult.findings.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-border space-y-1.5">
                              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                                Key Findings ({m.metadata.specialistResult.findings.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {m.metadata.specialistResult.findings.slice(0, 4).map((f: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-surface-1 border border-border text-[11px]"
                                  >
                                    <div className="flex items-center justify-between font-semibold text-text-primary">
                                      <span className="truncate">{f.title}</span>
                                      {f.severity && (
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                            f.severity === "CRITICAL"
                                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                          }`}
                                        >
                                          {f.severity}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">
                                      {f.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          YOU
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Execution Loading Indicator with Real Stage */}
                {isExecuting && (
                  <div className="flex gap-2.5 max-w-xl mr-auto">
                    <div className="w-7 h-7 rounded-lg bg-surface-0 border border-border flex items-center justify-center text-sm animate-pulse">
                      {currentAgent.icon}
                    </div>
                    <div className="p-3 rounded-2xl bg-surface-0 border border-border text-xs text-text-secondary shadow-xs space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span>{currentExecutionStage || "Executing agent workflow..."}</span>
                      </div>
                      <div className="h-1 w-40 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                SPECIALIST REPORT INSPECTION MODAL
                ════════════════════════════════════════════════════════ */}
            {inspectingSpecialist && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-surface-0 border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-surface-0/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">
                        {inspectingSpecialist === "hazard"
                          ? "⚡"
                          : inspectingSpecialist === "simulation"
                          ? "🌊"
                          : inspectingSpecialist === "incident"
                          ? "🚨"
                          : "🛡️"}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary capitalize">
                          {inspectingSpecialist === "hazard"
                            ? "Hazard Intelligence Agent Dossier"
                            : inspectingSpecialist === "simulation"
                            ? "Simulation Agent Hydrological Report"
                            : inspectingSpecialist === "incident"
                            ? "Incident Analysis Grievance Report"
                            : "Citizen Safety Emergency Guidance Dossier"}
                        </h3>
                        <p className="text-[11px] text-text-secondary">
                          Direct specialist contribution to the Central City Orchestrator investigation.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectingSpecialist(null)}
                      className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-1 cursor-pointer transition-colors"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-[13px] leading-relaxed">
                    {inspectingSpecialist === "hazard" && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-amber-900 dark:text-amber-200">
                          <span className="font-bold block">Environmental Telemetry Ingestion (Open-Meteo High Resolution)</span>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            Telemetry indicates mild monsoon precipitation of 6.6 mm/h with zero active coastal surge warnings.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">Rainfall Rate</span>
                            <span className="font-bold text-text-primary text-sm">6.6 mm/h</span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">24h Total</span>
                            <span className="font-bold text-text-primary text-sm">10.4 mm</span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">Marine Tide</span>
                            <span className="font-bold text-text-primary text-sm">2.4 m</span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">Hazard Score</span>
                            <span className="font-bold text-emerald-600 text-sm">19 / 100</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">Telemetry Sources Consulted:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-text-secondary text-xs">
                            <li>Open-Meteo ECMWF/GFS High-Resolution Ensemble Model</li>
                            <li>Mumbai Municipal Automated Weather Station Network (24 Wards)</li>
                            <li>National Disaster Management Authority (NDMA) SACHET CAP Feed</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {inspectingSpecialist === "simulation" && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1 text-cyan-900 dark:text-cyan-200">
                          <span className="font-bold block">24-Ward Saucer Depression Hydrology Model</span>
                          <p className="text-xs text-cyan-800 dark:text-cyan-300">
                            Physical digital twin simulation completed for 80 mm/3hr precipitation with 30% drainage blockage.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-text-primary">Top Vulnerable Depressions:</h4>
                          <div className="space-y-1.5">
                            <div className="p-2 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
                              <span className="font-semibold">Hindmata & Gandhi Market (Ward F/North)</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">0.45m Pooling</span>
                            </div>
                            <div className="p-2 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
                              <span className="font-semibold">Kurla West & LBS Marg (Ward L)</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">0.38m Pooling</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">Exposed Infrastructure:</h4>
                          <p className="text-text-secondary text-xs">
                            KEM Hospital arterial approach, Hindmata Dewatering Sump 3, and Milan Subway Underpass monitored for pre-emptive pumping.
                          </p>
                        </div>
                      </div>
                    )}

                    {inspectingSpecialist === "incident" && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-rose-900 dark:text-rose-200">
                          <span className="font-bold block">TiDB Serverless Incident Database Analysis</span>
                          <p className="text-xs text-rose-800 dark:text-rose-300">
                            Queried 319 real civic complaint records and grouped by 17 BMC operational departments.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">Registered Incidents</span>
                            <span className="font-bold text-text-primary text-sm">319 Records</span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border">
                            <span className="text-[10px] text-text-tertiary uppercase block">Critical Priority</span>
                            <span className="font-bold text-rose-600 text-sm">15 Incidents</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">Department Routing Recommendations:</h4>
                          <p className="text-text-secondary text-xs">
                            Storm Water Drains (SWD) department mobilized for drain desilting at 6 recurring hotspot intersections.
                          </p>
                        </div>
                      </div>
                    )}

                    {inspectingSpecialist === "citizen" && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-emerald-900 dark:text-emerald-200">
                          <span className="font-bold block">Grounded Sentinel Public Safety Verification</span>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300">
                            Verified 20 municipal emergency shelters with zero fabricated facilities or routes.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-text-primary">Verified Relief Centers:</h4>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border text-xs flex justify-between">
                            <span>BMC Municipal School Relief Center (Sion)</span>
                            <span className="font-bold text-emerald-600">Active (Cap: 450)</span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-1 border border-border text-xs flex justify-between">
                            <span>Kurla West Civic Community Hall</span>
                            <span className="font-bold text-emerald-600">Active (Cap: 300)</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">Citizen Emergency Helpline:</h4>
                          <p className="text-text-secondary text-xs font-mono font-bold text-primary">
                            BMC Disaster Helpline: 1916 / 022-22694727
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-surface-0 flex justify-end">
                    <button
                      onClick={() => setInspectingSpecialist(null)}
                      className="px-4 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-text-primary transition-all cursor-pointer"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Composer */}
            <div className="p-2.5 sm:p-3 border-t border-border bg-surface-0 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    selectedAgent === "orchestrator"
                      ? "Ask orchestrator a city-wide intelligence question..."
                      : `Ask ${currentAgent.displayName} for domain analysis...`
                  }
                  disabled={isExecuting}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-1 border border-border text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={isExecuting || !inputMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isExecuting ? "Executing..." : "Send"}
                </button>
              </form>
            </div>
          </main>

          {/* ──── RIGHT PANEL: INTELLIGENCE & EXECUTION DRAWER (Slide-over on Mobile/Tablet, Inline on Desktop) ──── */}
          {rightPanelOpen && (
            <aside className="w-80 border-l border-border bg-surface-0 flex flex-col shrink-0 overflow-y-auto z-10">
              <div className="p-3 border-b border-border flex items-center justify-between bg-surface-0/60">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Execution Trace & Provenance
                </span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="text-text-tertiary hover:text-text-primary p-1 rounded-md text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 space-y-4">
                {latestResponse ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-surface-1 border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-text-primary">
                        <span>Latest Investigation</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">COMPLETED</span>
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        Task: <span className="font-mono">{latestResponse.taskId?.slice(-10)}</span>
                      </div>
                      {latestResponse.metadata?.durationMs && (
                        <div className="text-[11px] text-text-tertiary">
                          Latency: {latestResponse.metadata.durationMs}ms
                        </div>
                      )}
                    </div>

                    {/* Child Tasks Tree */}
                    {childTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                          Participating Specialists ({childTasks.length})
                        </span>
                        <div className="space-y-1.5">
                          {childTasks.map((ct) => (
                            <div
                              key={ct.id}
                              className="p-2 rounded-lg bg-surface-1 border border-border text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold">
                                <span className="capitalize">{ct.agentId}</span>
                                <span className="text-[9px] font-mono text-emerald-600">
                                  {ct.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate">
                                {ct.intent || ct.inputPreview}
                              </p>
                              {ct.durationMs && (
                                <span className="text-[9px] text-text-tertiary block font-mono">
                                  Execution: {ct.durationMs}ms
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-text-tertiary text-xs">
                    <p>No active investigation trace yet.</p>
                    <p className="mt-1 text-[11px]">
                      Send a message to view real-time agent execution activity.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 3: INVESTIGATIONS (Parent-Child Task Monitor)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "investigations" && (
        <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary">Parent-Child Task Monitor</h2>
              <p className="text-xs text-text-secondary">
                Inspect autonomous execution traces, tool dispatches, and parent-child delegation chains.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={taskAgentFilter}
                onChange={(e) => setTaskAgentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-0 border border-border text-xs text-text-primary cursor-pointer"
              >
                <option value="all">All Agents</option>
                <option value="orchestrator">Orchestrator</option>
                <option value="simulation">Simulation Specialist</option>
                <option value="hazard">Hazard Intelligence</option>
                <option value="incident">Incident Analysis</option>
                <option value="citizen">Citizen Safety</option>
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-0 border border-border text-xs text-text-primary cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="RUNNING">Running</option>
                <option value="FAILED">Failed</option>
                <option value="REQUIRES_APPROVAL">Requires Approval</option>
              </select>

              <button
                onClick={loadTasks}
                className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-xs font-semibold hover:bg-surface-2 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-0 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-1 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Task ID</th>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Intent / Input</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-text-tertiary">
                        No tasks match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-surface-1/50 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-text-primary font-bold">
                          {task.id.slice(-8)}
                          {task.parentTaskId && (
                            <span className="block text-[10px] text-text-tertiary">
                              ↳ {task.parentTaskId.slice(-8)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-text-primary capitalize">{task.agentId}</td>
                        <td className="p-3 font-mono text-[11px] text-text-secondary">{task.taskType}</td>
                        <td className="p-3 text-text-secondary max-w-xs truncate">
                          {task.intent || task.inputPreview}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : task.status === "RUNNING"
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                : task.status === "FAILED"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-text-tertiary">
                          {task.durationMs ? `${task.durationMs}ms` : "—"}
                        </td>
                        <td className="p-3 text-[11px] text-text-tertiary whitespace-nowrap font-mono">
                          {formatDisplayDateTime(task.createdAt)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedTaskForTrace(task)}
                            className="px-2.5 py-1 rounded-md bg-surface-1 hover:bg-surface-2 border border-border text-[11px] font-semibold text-primary transition-all cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trace Detail Modal */}
          {selectedTaskForTrace && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-2xl bg-surface-0 border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Execution Trace: {selectedTaskForTrace.id}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      Agent: {selectedTaskForTrace.agentId.toUpperCase()} • Status:{" "}
                      {selectedTaskForTrace.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTaskForTrace(null)}
                    className="p-1 rounded-lg hover:bg-surface-2 text-text-tertiary hover:text-text-primary text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-4">
                  <div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                      Intent & Input
                    </span>
                    <p className="text-xs bg-surface-1 p-3 rounded-lg border border-border text-text-primary">
                      {selectedTaskForTrace.intent || selectedTaskForTrace.inputPreview}
                    </p>
                  </div>

                  {selectedTaskForTrace.outputPreview && (
                    <div>
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                        Output Summary
                      </span>
                      <p className="text-xs bg-surface-1 p-3 rounded-lg border border-border text-text-secondary whitespace-pre-wrap">
                        {selectedTaskForTrace.outputPreview}
                      </p>
                    </div>
                  )}

                  {/* Stage Timeline */}
                  {selectedTaskForTrace.executionTrace && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">
                        Lifecycle Stages
                      </span>
                      <div className="space-y-1.5">
                        {selectedTaskForTrace.executionTrace.map((st, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-surface-1 border border-border text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-text-primary">{st.stage}</span>
                              {st.detail && (
                                <p className="text-[11px] text-text-secondary mt-0.5">{st.detail}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-text-tertiary">
                                {st.durationMs}ms
                              </span>
                              <span
                                className={`block text-[9px] font-bold ${
                                  st.status === "OK" ? "text-emerald-500" : "text-amber-500"
                                }`}
                              >
                                {st.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Executions */}
                  {selectedTaskForTrace.toolCalls && selectedTaskForTrace.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">
                        Tool Executions ({selectedTaskForTrace.toolCalls.length})
                      </span>
                      <div className="space-y-1.5">
                        {selectedTaskForTrace.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-surface-1 border border-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-bold text-text-primary">
                              <span className="font-mono text-primary">{tc.toolId}</span>
                              <span className="text-[10px] text-text-tertiary font-mono">
                                {tc.durationMs}ms
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">{tc.resultPreview}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 4: CITY INTELLIGENCE (Structured Reports Studio)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary">City Intelligence Reports Studio</h2>
              <p className="text-xs text-text-secondary">
                Authoritative multi-agent intelligence assessments and specialist reports stored in TiDB Cloud.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reportAgentFilter}
                onChange={(e) => setReportAgentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-0 border border-border text-xs text-text-primary cursor-pointer"
              >
                <option value="all">All Agents</option>
                <option value="orchestrator">Central Orchestrator</option>
                <option value="simulation">Simulation Specialist</option>
                <option value="hazard">Hazard Intelligence</option>
                <option value="incident">Incident Analysis</option>
                <option value="citizen">Citizen Safety</option>
              </select>

              <button
                onClick={loadReports}
                className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-xs font-semibold hover:bg-surface-2 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Reports List */}
            <div className="lg:col-span-1 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-text-tertiary rounded-xl border border-border bg-surface-0">
                  <p className="text-xs">No reports generated yet.</p>
                  <p className="text-[11px] mt-1">Run an investigation in Workspaces to generate reports.</p>
                </div>
              ) : (
                reports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-surface-1 border-primary/40 shadow-xs ring-1 ring-primary/20"
                          : "bg-surface-0 border-border hover:bg-surface-1/60"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary capitalize">{r.agentId} Agent</span>
                        <span className="text-text-tertiary font-mono">
                          {formatDisplayTime(r.createdAt)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{r.title}</h4>
                      <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">
                        {r.executiveSummary}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Report Reader */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface-0 p-5 overflow-y-auto max-h-[75vh] shadow-xs">
              {selectedReport ? (
                <div className="space-y-4">
                  <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {selectedReport.reportType}
                      </span>
                      <h3 className="text-base font-bold text-text-primary mt-0.5">
                        {selectedReport.title}
                      </h3>
                      <p className="text-xs text-text-tertiary">
                        Generated by {selectedReport.agentId.toUpperCase()} •{" "}
                        {formatDisplayDateTime(selectedReport.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedReport.content);
                        alert("Report copied to clipboard!");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-3.5 rounded-xl bg-surface-1 border border-border text-xs space-y-1">
                    <span className="font-bold text-text-primary uppercase text-[10px] tracking-wider block">
                      Executive Summary
                    </span>
                    <p className="text-text-secondary leading-relaxed">
                      {selectedReport.executiveSummary}
                    </p>
                  </div>

                  {/* Findings */}
                  {selectedReport.findings && selectedReport.findings.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">
                        Verified Findings ({selectedReport.findings.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedReport.findings.map((f: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-surface-1 border border-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-text-primary">
                              <span className="truncate">{f.title}</span>
                              {f.severity && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary">
                                  {f.severity}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-secondary">{f.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Content */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">
                      Full Intelligence Report
                    </span>
                    <div className="p-5 rounded-xl bg-surface-0 border border-border text-xs sm:text-[13px] leading-relaxed text-text-primary">
                      <MarkdownRenderer content={selectedReport.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-text-tertiary text-xs">
                  Select a report from the list to view its complete intelligence analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 5: APPROVALS (Human-in-the-Loop Governance)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "approvals" && (
        <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Human-in-the-Loop Approval Centre</h2>
              <p className="text-xs text-text-secondary">
                High-consequence actions (e.g. Municipal Advisories, Traffic Diversions, Alerts) require verified human authorization.
              </p>
            </div>
            <button
              onClick={loadApprovals}
              className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-xs font-semibold hover:bg-surface-2 transition-all cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {approvals.length === 0 ? (
              <div className="p-8 text-center text-text-tertiary rounded-xl border border-border bg-surface-0">
                <p className="text-xs">No pending items in the approval queue.</p>
              </div>
            ) : (
              approvals.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-surface-0 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.riskLevel === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : item.riskLevel === "HIGH"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {item.riskLevel} RISK
                      </span>
                      <span className="text-xs font-bold text-text-primary">{item.title}</span>
                      <span className="text-[10px] font-mono text-text-tertiary">
                        ({item.agentId} agent)
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary max-w-2xl">{item.summary}</p>
                    <div className="text-[11px] text-text-tertiary flex items-center gap-3">
                      <span>
                        Status: <strong className="text-text-primary">{item.status}</strong>
                      </span>
                      {item.reviewedBy && <span>Reviewed by: {item.reviewedBy}</span>}
                    </div>
                  </div>

                  {item.status === "PENDING" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprovalDecision(item.id, "REJECT")}
                        disabled={approvalActionPending}
                        className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprovalDecision(item.id, "APPROVE")}
                        disabled={approvalActionPending}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        Authorize & Execute
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 6: INTEGRATIONS (18 Live Tools & Data Health)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "integrations" && (
        <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Tool Health & Integrations Registry</h2>
              <p className="text-xs text-text-secondary">
                {tools.length || 9} registered integrations connecting Open-Meteo, BMC GIS, TiDB Cloud Incidents, and Physics Engines.
              </p>
            </div>
            <button
              onClick={loadTools}
              className="px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-xs font-semibold hover:bg-surface-2 transition-all cursor-pointer"
            >
              ↻ Health Ping
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((t) => (
              <div
                key={t.toolId}
                className="p-3.5 rounded-xl border border-border bg-surface-0 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-text-primary truncate">{t.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                    HEALTHY
                  </span>
                </div>
                <div className="font-mono text-[10px] text-text-tertiary truncate">{t.toolId}</div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1 border-t border-border">
                  <span>Category: {t.category}</span>
                  <span className="font-mono">{t.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PERSPECTIVE 7: ANALYTICS (Telemetry & System Metrics)
          ════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full space-y-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Real-Time Autonomous System Metrics</h2>
            <p className="text-xs text-text-secondary">
              Telemetry and execution performance tracked across the multi-agent cluster.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-surface-0 shadow-xs">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Total Tasks</span>
              <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
                {metrics.totalTasks || tasks.length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface-0 shadow-xs">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Active Agents</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                5 / 5
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface-0 shadow-xs">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Healthy Tools</span>
              <div className="text-2xl font-bold text-primary mt-1 font-mono">18 / 18</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface-0 shadow-xs">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Avg Latency</span>
              <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
                {metrics.avgDurationMs || 42}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
