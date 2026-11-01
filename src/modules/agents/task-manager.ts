/* ════════════════════════════════════════════════════════
   GeoNexus — Agent Task Manager
   Tracks execution traces, tool invocations, duration, and status.
   Handles database persistence with in-memory fallback.
   ════════════════════════════════════════════════════════ */

import { execute, query } from "@/lib/db";
import { generateULID as ulid } from "@/lib/ids";
import {
  AgentTask,
  ExecutionTraceStep,
  ToolCallRecord,
  TaskStatus,
  ApprovalQueueItem,
  RiskLevel,
  ApprovalType,
  AgentReportRecord,
  initAgentDatabase,
} from "@/db/schema/005-agents";
import { recordAgentMetrics } from "./registry";

// In-memory fallback cache (stores recent 200 tasks)
const taskMemoryStore = new Map<string, AgentTask>();
const approvalMemoryStore = new Map<string, ApprovalQueueItem>();

export interface CreateTaskParams {
  agentId: string;
  taskType: string;
  intent: string;
  inputPreview: string;
  inputPayload: Record<string, any>;
  parentTaskId?: string | null;
}

export async function createTask(params: CreateTaskParams): Promise<AgentTask> {
  const taskId = ulid();
  const now = new Date().toISOString();

  const task: AgentTask = {
    id: taskId,
    agentId: params.agentId,
    parentTaskId: params.parentTaskId || null,
    taskType: params.taskType,
    intent: params.intent,
    inputPreview: params.inputPreview.slice(0, 500),
    inputPayload: params.inputPayload,
    outputPreview: null,
    outputPayload: null,
    executionTrace: [
      {
        stage: "task_created",
        timestamp: now,
        durationMs: 0,
        status: "OK",
        detail: `Task initialized for agent ${params.agentId}`,
      },
    ],
    toolCalls: [],
    status: "RUNNING",
    durationMs: null,
    errorMessage: null,
    createdAt: now,
    completedAt: null,
  };

  taskMemoryStore.set(taskId, task);

  try {
    await initAgentDatabase();
    await execute(
      `INSERT INTO agent_tasks 
        (id, agent_id, parent_task_id, task_type, intent, input_preview, input_payload, execution_trace, tool_calls, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        task.id,
        task.agentId,
        task.parentTaskId ?? null,
        task.taskType,
        task.intent,
        task.inputPreview,
        JSON.stringify(task.inputPayload),
        JSON.stringify(task.executionTrace),
        JSON.stringify(task.toolCalls),
        task.status,
      ]
    );
  } catch (err: any) {
    console.warn(`[TaskManager] DB save warning for task ${taskId}:`, err?.message || err);
  }

  return task;
}

export async function addTraceStep(
  taskId: string,
  step: Omit<ExecutionTraceStep, "timestamp">
): Promise<void> {
  const fullStep: ExecutionTraceStep = {
    ...step,
    timestamp: new Date().toISOString(),
  };

  const task = taskMemoryStore.get(taskId);
  if (task) {
    task.executionTrace.push(fullStep);
  }

  try {
    if (task) {
      await execute(
        `UPDATE agent_tasks 
         SET execution_trace = ? 
         WHERE id = ?`,
        [JSON.stringify(task.executionTrace), taskId]
      );
    }
  } catch {
    // In-memory trace updated
  }
}

export async function recordToolExecution(
  taskId: string,
  toolCall: Omit<ToolCallRecord, "timestamp">
): Promise<void> {
  const fullRecord: ToolCallRecord = {
    ...toolCall,
    timestamp: new Date().toISOString(),
  };

  const task = taskMemoryStore.get(taskId);
  if (task) {
    task.toolCalls.push(fullRecord);
  }

  try {
    if (task) {
      await execute(
        `UPDATE agent_tasks 
         SET tool_calls = ? 
         WHERE id = ?`,
        [JSON.stringify(task.toolCalls), taskId]
      );
    }
  } catch {
    // In-memory record updated
  }
}

export async function completeTask(
  taskId: string,
  outputPreview: string,
  outputPayload: Record<string, any> = {}
): Promise<AgentTask | null> {
  const task = taskMemoryStore.get(taskId);
  const now = new Date();
  const completedAt = now.toISOString();

  let durationMs = 0;
  if (task) {
    durationMs = Math.max(0, now.getTime() - new Date(task.createdAt).getTime());
    task.status = "COMPLETED";
    task.completedAt = completedAt;
    task.durationMs = durationMs;
    task.outputPreview = outputPreview.slice(0, 500);
    task.outputPayload = outputPayload;
    task.executionTrace.push({
      stage: "task_completed",
      timestamp: completedAt,
      durationMs,
      status: "OK",
      detail: `Task completed successfully in ${durationMs}ms`,
    });

    await recordAgentMetrics(task.agentId, durationMs, false);
  }

  try {
    if (task) {
      await execute(
        `UPDATE agent_tasks 
         SET 
           status = 'COMPLETED',
           duration_ms = ?,
           output_preview = ?,
           output_payload = ?,
           execution_trace = ?,
           completed_at = NOW()
         WHERE id = ?`,
        [
          durationMs,
          task.outputPreview ?? null,
          JSON.stringify(task.outputPayload),
          JSON.stringify(task.executionTrace),
          taskId,
        ]
      );
    }
  } catch {
    // In-memory updated
  }

  return task || null;
}

export async function failTask(
  taskId: string,
  errorMessage: string
): Promise<AgentTask | null> {
  const task = taskMemoryStore.get(taskId);
  const now = new Date();
  const completedAt = now.toISOString();

  let durationMs = 0;
  if (task) {
    durationMs = Math.max(0, now.getTime() - new Date(task.createdAt).getTime());
    task.status = "FAILED";
    task.completedAt = completedAt;
    task.durationMs = durationMs;
    task.errorMessage = errorMessage;
    task.outputPreview = `ERROR: ${errorMessage.slice(0, 450)}`;
    task.executionTrace.push({
      stage: "task_failed",
      timestamp: completedAt,
      durationMs,
      status: "ERROR",
      detail: errorMessage,
    });

    await recordAgentMetrics(task.agentId, durationMs, true);
  }

  try {
    if (task) {
      await execute(
        `UPDATE agent_tasks 
         SET 
           status = 'FAILED',
           duration_ms = ?,
           error_message = ?,
           output_preview = ?,
           execution_trace = ?,
           completed_at = NOW()
         WHERE id = ?`,
        [
          durationMs,
          errorMessage,
          task.outputPreview ?? null,
          JSON.stringify(task.executionTrace),
          taskId,
        ]
      );
    }
  } catch {
    // In-memory updated
  }

  return task || null;
}

// ════════════════════════════════════════════════════════
// APPROVAL QUEUE INTEGRATION (HUMAN IN THE LOOP)
// ════════════════════════════════════════════════════════

export interface RequestApprovalParams {
  taskId: string;
  agentId: string;
  approvalType: ApprovalType;
  title: string;
  summary: string;
  payload: Record<string, any>;
  riskLevel: RiskLevel;
  expiresInMinutes?: number;
}

export async function submitForApproval(
  params: RequestApprovalParams
): Promise<ApprovalQueueItem> {
  const approvalId = ulid();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (params.expiresInMinutes || 120) * 60 * 1000
  ).toISOString();

  const item: ApprovalQueueItem = {
    id: approvalId,
    taskId: params.taskId,
    agentId: params.agentId,
    approvalType: params.approvalType,
    title: params.title,
    summary: params.summary,
    payload: params.payload,
    riskLevel: params.riskLevel,
    status: "PENDING",
    expiresAt,
    createdAt: now.toISOString(),
  };

  approvalMemoryStore.set(approvalId, item);

  // Update task status
  const task = taskMemoryStore.get(params.taskId);
  if (task) {
    task.status = "REQUIRES_APPROVAL";
    task.executionTrace.push({
      stage: "requires_human_approval",
      timestamp: now.toISOString(),
      durationMs: 0,
      status: "WARNING",
      detail: `Escalated to Approval Centre: ${params.title}`,
      metadata: { approvalId, riskLevel: params.riskLevel },
    });
  }

  try {
    await initAgentDatabase();
    await execute(
      `INSERT INTO approval_queue 
        (id, task_id, agent_id, approval_type, title, summary, payload, risk_level, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW())`,
      [
        item.id,
        item.taskId,
        item.agentId,
        item.approvalType,
        item.title,
        item.summary,
        JSON.stringify(item.payload),
        item.riskLevel,
        item.expiresAt,
      ]
    );

    await execute(
      `UPDATE agent_tasks 
       SET status = 'REQUIRES_APPROVAL', execution_trace = ? 
       WHERE id = ?`,
      [JSON.stringify(task?.executionTrace || []), params.taskId]
    );
  } catch (err: any) {
    console.warn(`[TaskManager] Approval queue save warning:`, err?.message || err);
  }

  return item;
}

export async function getApprovalItems(
  statusFilter?: string
): Promise<ApprovalQueueItem[]> {
  try {
    let sql = "SELECT * FROM approval_queue";
    const params: any[] = [];
    if (statusFilter && statusFilter !== "ALL") {
      sql += " WHERE status = ?";
      params.push(statusFilter);
    }
    sql += " ORDER BY created_at DESC LIMIT 50";

    const rows = await query<any>(sql, params);
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        taskId: r.task_id,
        agentId: r.agent_id,
        approvalType: r.approval_type as ApprovalType,
        title: r.title,
        summary: r.summary,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : (r.payload || {}),
        riskLevel: r.risk_level as RiskLevel,
        status: r.status,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
        reviewNotes: r.review_notes,
        expiresAt: new Date(r.expires_at).toISOString(),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    }
  } catch {
    // Fall back to memory store
  }

  const items = Array.from(approvalMemoryStore.values());
  if (statusFilter && statusFilter !== "ALL") {
    return items.filter((i) => i.status === statusFilter);
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function resolveApproval(
  approvalId: string,
  decision: "APPROVED" | "REJECTED",
  reviewedBy: string = "admin",
  notes?: string
): Promise<ApprovalQueueItem | null> {
  const item = approvalMemoryStore.get(approvalId);
  const now = new Date().toISOString();

  if (item) {
    item.status = decision;
    item.reviewedBy = reviewedBy;
    item.reviewedAt = now;
    item.reviewNotes = notes || null;

    // Also update parent task
    const task = taskMemoryStore.get(item.taskId);
    if (task) {
      task.status = decision === "APPROVED" ? "COMPLETED" : "CANCELLED";
      task.executionTrace.push({
        stage: `approval_${decision.toLowerCase()}`,
        timestamp: now,
        durationMs: 0,
        status: decision === "APPROVED" ? "OK" : "WARNING",
        detail: `Review by ${reviewedBy}: ${notes || decision}`,
      });
    }
  }

  let lastErr: any = null;
  try {
    let targetTaskId = item?.taskId;

    await execute(
      `UPDATE approval_queue 
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? 
       WHERE id = ?`,
      [decision, reviewedBy, notes ?? null, approvalId]
    );

    const rows = await query<any>("SELECT * FROM approval_queue WHERE id = ?", [approvalId]);

    if (rows && rows[0]) {
      const r = rows[0];
      targetTaskId = targetTaskId || r.task_id;
      if (targetTaskId) {
        try {
          await execute(
            `UPDATE agent_tasks 
             SET status = ? 
             WHERE id = ?`,
            [decision === "APPROVED" ? "COMPLETED" : "CANCELLED", targetTaskId]
          );
        } catch (taskErr: any) {
          console.warn("[TaskManager] Task status update warning:", taskErr?.message);
        }
      }

      const dbItem: ApprovalQueueItem = {
        id: r.id,
        taskId: r.task_id,
        agentId: r.agent_id,
        approvalType: r.approval_type as ApprovalType,
        title: r.title,
        summary: r.summary,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : (r.payload || {}),
        riskLevel: r.risk_level as RiskLevel,
        status: r.status,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
        reviewNotes: r.review_notes,
        expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : new Date().toISOString(),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      };
      approvalMemoryStore.set(approvalId, dbItem);
      return dbItem;
    }
  } catch (err: any) {
    lastErr = err?.message || String(err);
    console.error("[TaskManager] resolveApproval DB error:", lastErr);
  }

  if (lastErr) {
    throw new Error(`resolveApproval DB error: ${lastErr}`);
  }

  return item || null;
}

// ════════════════════════════════════════════════════════
// TASK QUERYING & RETRIEVAL
// ════════════════════════════════════════════════════════

export interface TaskQueryFilters {
  agentId?: string;
  status?: string;
  limit?: number;
}

export async function getRecentTasks(
  filters: TaskQueryFilters = {}
): Promise<AgentTask[]> {
  const limit = Math.min(filters.limit || 50, 100);

  try {
    let sql = "SELECT * FROM agent_tasks";
    const clauses: string[] = [];
    const params: any[] = [];

    if (filters.agentId && filters.agentId !== "all") {
      clauses.push("agent_id = ?");
      params.push(filters.agentId);
    }
    if (filters.status && filters.status !== "all") {
      clauses.push("status = ?");
      params.push(filters.status);
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    if (clauses.length > 0) {
      sql += " WHERE " + clauses.join(" AND ");
    }
    sql += ` ORDER BY created_at DESC LIMIT ${safeLimit}`;

    const rows = await query<any>(sql, params);
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        agentId: r.agent_id,
        parentTaskId: r.parent_task_id,
        taskType: r.task_type,
        intent: r.intent,
        inputPreview: r.input_preview,
        inputPayload: typeof r.input_payload === "string" ? JSON.parse(r.input_payload) : (r.input_payload || {}),
        outputPreview: r.output_preview,
        outputPayload: typeof r.output_payload === "string" ? JSON.parse(r.output_payload) : (r.output_payload || {}),
        executionTrace: typeof r.execution_trace === "string" ? JSON.parse(r.execution_trace) : (r.execution_trace || []),
        toolCalls: typeof r.tool_calls === "string" ? JSON.parse(r.tool_calls) : (r.tool_calls || []),
        status: r.status as TaskStatus,
        durationMs: r.duration_ms,
        errorMessage: r.error_message,
        createdAt: new Date(r.created_at).toISOString(),
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      }));
    }
  } catch {
    // Memory store fallback
  }

  let tasks = Array.from(taskMemoryStore.values());
  if (filters.agentId && filters.agentId !== "all") {
    tasks = tasks.filter((t) => t.agentId === filters.agentId);
  }
  if (filters.status && filters.status !== "all") {
    tasks = tasks.filter((t) => t.status === filters.status);
  }

  return tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getTaskById(taskId: string): Promise<AgentTask | null> {
  try {
    const rows = await query<any>("SELECT * FROM agent_tasks WHERE id = ? LIMIT 1", [taskId]);
    if (rows && rows[0]) {
      const r = rows[0];
      return {
        id: r.id,
        agentId: r.agent_id,
        parentTaskId: r.parent_task_id,
        taskType: r.task_type,
        intent: r.intent,
        inputPreview: r.input_preview,
        inputPayload: typeof r.input_payload === "string" ? JSON.parse(r.input_payload) : (r.input_payload || {}),
        outputPreview: r.output_preview,
        outputPayload: typeof r.output_payload === "string" ? JSON.parse(r.output_payload) : (r.output_payload || {}),
        executionTrace: typeof r.execution_trace === "string" ? JSON.parse(r.execution_trace) : (r.execution_trace || []),
        toolCalls: typeof r.tool_calls === "string" ? JSON.parse(r.tool_calls) : (r.tool_calls || []),
        status: r.status as TaskStatus,
        durationMs: r.duration_ms,
        errorMessage: r.error_message,
        createdAt: new Date(r.created_at).toISOString(),
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      };
    }
  } catch {
    // Memory store
  }

  return taskMemoryStore.get(taskId) || null;
}

export async function getChildTasks(parentTaskId: string): Promise<AgentTask[]> {
  try {
    const rows = await query<any>(
      "SELECT * FROM agent_tasks WHERE parent_task_id = ? ORDER BY created_at ASC",
      [parentTaskId]
    );
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        agentId: r.agent_id,
        parentTaskId: r.parent_task_id,
        taskType: r.task_type,
        intent: r.intent,
        inputPreview: r.input_preview,
        inputPayload: typeof r.input_payload === "string" ? JSON.parse(r.input_payload) : (r.input_payload || {}),
        outputPreview: r.output_preview,
        outputPayload: typeof r.output_payload === "string" ? JSON.parse(r.output_payload) : (r.output_payload || {}),
        executionTrace: typeof r.execution_trace === "string" ? JSON.parse(r.execution_trace) : (r.execution_trace || []),
        toolCalls: typeof r.tool_calls === "string" ? JSON.parse(r.tool_calls) : (r.tool_calls || []),
        status: r.status as TaskStatus,
        durationMs: r.duration_ms,
        errorMessage: r.error_message,
        createdAt: new Date(r.created_at).toISOString(),
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      }));
    }
  } catch {
    // Memory store fallback
  }

  return Array.from(taskMemoryStore.values()).filter((t) => t.parentTaskId === parentTaskId);
}

// ════════════════════════════════════════════════════════
// AGENT REPORTS PERSISTENCE & RETRIEVAL
// ════════════════════════════════════════════════════════

export async function saveAgentReport(
  report: Omit<AgentReportRecord, "id" | "createdAt">
): Promise<AgentReportRecord> {
  const reportId = ulid();
  const now = new Date().toISOString();

  const record: AgentReportRecord = {
    id: reportId,
    taskId: report.taskId,
    conversationId: report.conversationId ?? null,
    agentId: report.agentId,
    reportType: report.reportType,
    title: report.title,
    executiveSummary: report.executiveSummary,
    content: report.content,
    findings: report.findings || [],
    dataSources: report.dataSources || [],
    recommendations: report.recommendations || [],
    participatingAgents: report.participatingAgents || [],
    approvalRequired: report.approvalRequired || false,
    createdAt: now,
  };

  try {
    await initAgentDatabase();
    await execute(
      `INSERT INTO agent_reports 
        (id, task_id, conversation_id, agent_id, report_type, title, executive_summary, content, findings, data_sources, recommendations, participating_agents, approval_required, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        record.id,
        record.taskId,
        record.conversationId ?? null,
        record.agentId,
        record.reportType,
        record.title,
        record.executiveSummary,
        record.content,
        JSON.stringify(record.findings),
        JSON.stringify(record.dataSources),
        JSON.stringify(record.recommendations),
        record.participatingAgents ? JSON.stringify(record.participatingAgents) : null,
        record.approvalRequired ? 1 : 0,
      ]
    );
  } catch (err: any) {
    console.warn("[TaskManager] saveAgentReport DB warning:", err?.message || err);
  }

  return record;
}

export async function getAgentReports(
  filters: { agentId?: string; reportType?: string; limit?: number } = {}
): Promise<AgentReportRecord[]> {
  const limit = Math.min(filters.limit || 50, 100);
  try {
    let sql = "SELECT * FROM agent_reports";
    const clauses: string[] = [];
    const params: any[] = [];

    if (filters.agentId && filters.agentId !== "all") {
      clauses.push("agent_id = ?");
      params.push(filters.agentId);
    }
    if (filters.reportType && filters.reportType !== "all") {
      clauses.push("report_type = ?");
      params.push(filters.reportType);
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    if (clauses.length > 0) {
      sql += " WHERE " + clauses.join(" AND ");
    }
    sql += ` ORDER BY created_at DESC LIMIT ${safeLimit}`;

    const rows = await query<any>(sql, params);
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        taskId: r.task_id,
        conversationId: r.conversation_id,
        agentId: r.agent_id,
        reportType: r.report_type,
        title: r.title,
        executiveSummary: r.executive_summary,
        content: r.content,
        findings: typeof r.findings === "string" ? JSON.parse(r.findings) : (r.findings || []),
        dataSources: typeof r.data_sources === "string" ? JSON.parse(r.data_sources) : (r.data_sources || []),
        recommendations: typeof r.recommendations === "string" ? JSON.parse(r.recommendations) : (r.recommendations || []),
        participatingAgents: typeof r.participating_agents === "string" ? JSON.parse(r.participating_agents) : (r.participating_agents || null),
        approvalRequired: Boolean(r.approval_required),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    }
  } catch (err: any) {
    console.warn("[TaskManager] getAgentReports DB warning:", err?.message || err);
  }

  return [];
}

export async function getReportById(reportId: string): Promise<AgentReportRecord | null> {
  try {
    const rows = await query<any>("SELECT * FROM agent_reports WHERE id = ? LIMIT 1", [reportId]);
    if (rows && rows[0]) {
      const r = rows[0];
      return {
        id: r.id,
        taskId: r.task_id,
        conversationId: r.conversation_id,
        agentId: r.agent_id,
        reportType: r.report_type,
        title: r.title,
        executiveSummary: r.executive_summary,
        content: r.content,
        findings: typeof r.findings === "string" ? JSON.parse(r.findings) : (r.findings || []),
        dataSources: typeof r.data_sources === "string" ? JSON.parse(r.data_sources) : (r.data_sources || []),
        recommendations: typeof r.recommendations === "string" ? JSON.parse(r.recommendations) : (r.recommendations || []),
        participatingAgents: typeof r.participating_agents === "string" ? JSON.parse(r.participating_agents) : (r.participating_agents || null),
        approvalRequired: Boolean(r.approval_required),
        createdAt: new Date(r.created_at).toISOString(),
      };
    }
  } catch (err: any) {
    console.warn("[TaskManager] getReportById DB warning:", err?.message || err);
  }

  return null;
}

