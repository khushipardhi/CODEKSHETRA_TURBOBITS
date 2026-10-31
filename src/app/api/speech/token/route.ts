/* ════════════════════════════════════════════════════════
   AssemblyAI Token Endpoint — Streaming v3
   Generates a short-lived temporary token for the client
   using the v3 Streaming API endpoint.
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const apiKey = env.assemblyAiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured", fallback: true },
        { status: 503 }
      );
    }

    // Use the v3 Streaming API to create a temporary token
    // expires_in_seconds is in seconds; 300 = 5 minutes
    const res = await fetch(
      "https://streaming.assemblyai.com/v3/token?expires_in_seconds=300",
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Speech API] AssemblyAI v3 token request failed (${res.status}): ${errorText}`
      );
      return NextResponse.json(
        { error: "Speech service unavailable", fallback: true },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err) {
    console.error("[Speech API] Failed to generate token:", err);
    return NextResponse.json(
      { error: "Failed to generate speech token", fallback: true },
      { status: 503 }
    );
  }
}
