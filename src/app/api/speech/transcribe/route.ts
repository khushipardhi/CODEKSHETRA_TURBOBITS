/* ════════════════════════════════════════════════════════
   POST /api/speech/transcribe — Audio transcription endpoint
   Powered primarily by AssemblyAI Speech-to-Text
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const aaiKey = env.assemblyAiKey;
    const groqKey = env.groqApiKey;

    if (!aaiKey && !groqKey) {
      return NextResponse.json(
        { error: "Speech service not configured. Please type your report instead." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile || !audioFile.size) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    console.log(
      `[Transcribe] Audio received: ${audioFile.size}B, type: "${audioFile.type}"`
    );

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Primary Provider: AssemblyAI ───────────────────────
    if (aaiKey) {
      try {
        console.log("[Transcribe] Calling AssemblyAI transcription…");
        const start = Date.now();
        const { AssemblyAI } = await import("assemblyai");
        const client = new AssemblyAI({ apiKey: aaiKey });

        const transcriptObj = await client.transcripts.transcribe({
          audio: buffer,
          language_detection: true,
        });

        if (transcriptObj.status === "completed" && transcriptObj.text) {
          const transcript = transcriptObj.text.trim();
          console.log(
            `[Transcribe] AssemblyAI completed in ${Date.now() - start}ms: "${transcript.slice(0, 80)}"`
          );
          return NextResponse.json({ transcript });
        }

        if (transcriptObj.status === "error") {
          console.warn("[Transcribe] AssemblyAI error status:", transcriptObj.error);
          if (
            typeof transcriptObj.error === "string" &&
            transcriptObj.error.includes("no spoken audio")
          ) {
            return NextResponse.json({
              transcript: "",
              message: "No speech detected in audio.",
            });
          }
        }
      } catch (aaiErr) {
        console.error("[Transcribe] AssemblyAI transcription error:", aaiErr);
      }
    }

    // ── Secondary Fallback: Groq Whisper (if valid) ─────────
    if (groqKey) {
      try {
        console.log("[Transcribe] Attempting Groq Whisper fallback…");
        const ext = mimeToExt(audioFile.type);
        const groqForm = new FormData();
        const renamed = new File([audioFile], `audio.${ext}`, { type: audioFile.type });
        groqForm.append("file", renamed);
        groqForm.append("model", "whisper-large-v3-turbo");

        const groqRes = await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}` },
            body: groqForm,
          }
        );

        if (groqRes.ok) {
          const data = await groqRes.json();
          const transcript = (data.text || "").trim();
          console.log(`[Transcribe] Groq completed: "${transcript.slice(0, 80)}"`);
          return NextResponse.json({ transcript });
        } else {
          const errText = await groqRes.text().catch(() => "");
          console.warn(`[Transcribe] Groq failed (${groqRes.status}): ${errText}`);
        }
      } catch (groqErr) {
        console.error("[Transcribe] Groq fallback error:", groqErr);
      }
    }

    return NextResponse.json(
      { error: "Transcription service could not process the audio. Please try again or type your report." },
      { status: 500 }
    );
  } catch (err) {
    console.error("[Transcribe] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function mimeToExt(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  return "webm";
}
