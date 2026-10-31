/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — AI Role Configuration & Credentials
   Phase 3: Three Independent Server-Side Groq Configurations
   ════════════════════════════════════════════════════════ */

import Groq from "groq-sdk";
import { env } from "@/lib/env";

export interface AIRoleClientConfig {
  roleIndex: 1 | 2 | 3;
  roleName: "Evidence Analyst" | "Impact & Operations Analyst" | "Report Editor & Quality Reviewer";
  envVarName: string;
  configuredModels: string[];
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
}

export const AI_ROLE_CONFIGS: Record<1 | 2 | 3, AIRoleClientConfig> = {
  1: {
    roleIndex: 1,
    roleName: "Evidence Analyst",
    envVarName: "GROQ_ROLE1_API_KEY / GROQ_LLAMA_API_KEY",
    configuredModels: [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
    temperature: 0.1,
    maxTokens: 1600,
    timeoutMs: 12000,
    maxRetries: 1,
  },
  2: {
    roleIndex: 2,
    roleName: "Impact & Operations Analyst",
    envVarName: "GROQ_ROLE2_API_KEY / GROQ_API_KEY",
    configuredModels: [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
    temperature: 0.2,
    maxTokens: 2000,
    timeoutMs: 12000,
    maxRetries: 1,
  },
  3: {
    roleIndex: 3,
    roleName: "Report Editor & Quality Reviewer",
    envVarName: "GROQ_ROLE3_API_KEY / GROQ_API_KEY_3 / GROQ_THIRD_API_KEY",
    configuredModels: [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
    temperature: 0.1,
    maxTokens: 4096,
    timeoutMs: 15000,
    maxRetries: 1,
  },
};

/** Get the server-side API key for a specific role without exposing secrets */
export function getRoleApiKey(roleIndex: 1 | 2 | 3): string {
  switch (roleIndex) {
    case 1:
      return env.groqRole1ApiKey;
    case 2:
      return env.groqRole2ApiKey;
    case 3:
      return env.groqRole3ApiKey;
    default:
      return "";
  }
}

/** Check credential presence and validity status safely */
export function inspectRoleCredentialStatus(roleIndex: 1 | 2 | 3): {
  isConfigured: boolean;
  envVar: string;
  hasKeyPrefix: boolean;
} {
  const key = getRoleApiKey(roleIndex);
  const cfg = AI_ROLE_CONFIGS[roleIndex];
  return {
    isConfigured: Boolean(key && key.trim().length > 10),
    envVar: cfg.envVarName,
    hasKeyPrefix: Boolean(key && key.trim().startsWith("gsk_")),
  };
}

/** Create an isolated Groq client for a specific role */
export function createRoleGroqClient(roleIndex: 1 | 2 | 3): Groq | null {
  const apiKey = getRoleApiKey(roleIndex);
  if (!apiKey || apiKey.trim().length < 10) {
    return null;
  }
  return new Groq({ apiKey });
}

/** Execute a role completion with bounded model fallback and strict JSON parsing */
export async function executeRoleChatCompletion<T>(params: {
  roleIndex: 1 | 2 | 3;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{
  data: T | null;
  modelUsed: string;
  executionTimeMs: number;
  error?: string;
}> {
  const config = AI_ROLE_CONFIGS[params.roleIndex];
  const client = createRoleGroqClient(params.roleIndex);
  const t0 = Date.now();

  if (!client) {
    return {
      data: null,
      modelUsed: "none",
      executionTimeMs: Date.now() - t0,
      error: `Missing or empty credential for Role ${params.roleIndex} (${config.envVarName})`,
    };
  }

  let lastError: Error | null = null;

  for (const model of config.configuredModels) {
    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          response_format: { type: "json_object" },
        },
        {
          signal: AbortSignal.timeout(config.timeoutMs),
        }
      );

      const content = response.choices?.[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        throw new Error(`Empty response content from model ${model}`);
      }

      const parsed = JSON.parse(content) as T;
      return {
        data: parsed,
        modelUsed: model,
        executionTimeMs: Date.now() - t0,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = err instanceof Error ? err : new Error(errMsg);
      // If unauthorized (401), trying other models with same key will also fail
      if (errMsg.includes("401") || errMsg.includes("invalid_api_key")) {
        return {
          data: null,
          modelUsed: model,
          executionTimeMs: Date.now() - t0,
          error: `Authentication failed (401 invalid_api_key) for Role ${params.roleIndex}`,
        };
      }
      // Otherwise try next model in fallback list
      continue;
    }
  }

  return {
    data: null,
    modelUsed: "exhausted_fallbacks",
    executionTimeMs: Date.now() - t0,
    error: lastError ? lastError.message : "All configured models failed to respond.",
  };
}
