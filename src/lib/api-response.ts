/* ════════════════════════════════════════════════════════
   Centralized Error & Response Format
   Consistent problem-detail errors and success responses
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    cursor?: string;
  };
}

/** Generate a correlation ID for request tracing */
export function generateCorrelationId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Standard error response */
export function errorResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        correlationId: error.correlationId || generateCorrelationId(),
      },
    },
    { status: error.status }
  );
}

/** Standard success response */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccess["meta"],
  status: number = 200
): NextResponse {
  return NextResponse.json({ data, meta }, { status });
}

/** Common error factories */
export const Errors = {
  unauthorized: (message = "Authentication required"): ApiError => ({
    status: 401,
    code: "UNAUTHORIZED",
    message,
  }),

  forbidden: (message = "Insufficient permissions"): ApiError => ({
    status: 403,
    code: "FORBIDDEN",
    message,
  }),

  notFound: (resource = "Resource"): ApiError => ({
    status: 404,
    code: "NOT_FOUND",
    message: `${resource} not found`,
  }),

  validation: (
    message: string,
    details?: Record<string, unknown>
  ): ApiError => ({
    status: 422,
    code: "VALIDATION_ERROR",
    message,
    details,
  }),

  conflict: (message: string): ApiError => ({
    status: 409,
    code: "CONFLICT",
    message,
  }),

  rateLimited: (): ApiError => ({
    status: 429,
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  }),

  internal: (correlationId?: string): ApiError => ({
    status: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred. Please try again.",
    correlationId,
  }),
} as const;
