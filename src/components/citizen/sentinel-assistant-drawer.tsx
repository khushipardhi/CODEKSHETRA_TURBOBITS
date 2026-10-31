/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen AI Hazard Assistant Drawer
   Interactive RAG chat grounded in real-time telemetry, active warnings,
   and municipal emergency shelters. Powered by Groq SDK.
   Includes Actionable Contextual Triggers & Human Confirmation before submission.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCityContext } from "@/components/providers/city-provider";
import { useAreaContext } from "@/components/citizen/area-context";
import { MarkdownView } from "@/components/ui/markdown-view";
import type {
  SentinelSuggestedAction,
  SentinelFollowUpAction,
  SentinelPrefillReportData,
} from "@/modules/ai/sentinel-engine";

interface Message {
  role: "user" | "assistant";
  content: string;
  groundingSources?: Array<{
    name: string;
    timestamp: string;
    type: string;
  }>;
  nearestShelters?: Array<{
    name: string;
    address: string;
    phone: string;
  }>;
  uncertaintyNotes?: string;
  suggestedAction?: SentinelSuggestedAction;
  followUpActions?: SentinelFollowUpAction[];
}

export function SentinelAssistantDrawer({
  isOpen,
  onClose,
  onPrefillReport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPrefillReport?: (data: SentinelPrefillReportData) => void;
}) {
  const router = useRouter();
  const { city, cityConfig } = useCityContext();
  const { selectedArea, areaCoords } = useAreaContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am your Sentinel Safety Assistant for **${cityConfig.name}** (${cityConfig.municipalBody}).\n\nI provide location-aware safety briefings, real-time rainfall observations, flood risk signals, active municipal alerts, and verified shelter locations.\n\n*How can I help you stay informed and safe today?*`,
      followUpActions: [
        { label: "📍 What is happening in my area?", action: "BRIEFING" },
        { label: "🌧️ 24h Rain & Flood Outlook", action: "RAIN_FORECAST" },
        { label: "🏛️ Verified Municipal Shelters", action: "VIEW_SHELTERS" },
        { label: "⚠️ Active Official Warnings", action: "WARNINGS" },
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    `What is happening in my area right now?`,
    `Is there flood or waterlogging risk tonight?`,
    `What is the 24-hour rainfall forecast?`,
    `Where is the nearest verified emergency shelter?`,
    `Are any municipal warnings active?`,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch(`/api/hazards/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          locality: selectedArea,
          coords: areaCoords,
          message: text,
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const assistantMsg: Message = {
            role: "assistant",
            content: json.data.reply,
            groundingSources: json.data.groundingSources,
            nearestShelters: json.data.nearestShelters,
            uncertaintyNotes: json.data.uncertaintyNotes,
            suggestedAction: json.data.suggestedAction,
            followUpActions: json.data.followUpActions,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          throw new Error(json.error?.message || "Failed to process query");
        }
      } else {
        throw new Error(`HTTP error ${res.status}`);
      }
    } catch (err) {
      console.error("[SentinelAssistant] Query error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm having trouble retrieving live telemetry right now. For emergency assistance in ${cityConfig.name}, please contact the municipal disaster cell directly at **${cityConfig.hazardCapabilities.emergencyHelpline}**.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAction = (action: SentinelSuggestedAction) => {
    if (action.type === "REPORT_ISSUE" && action.prefillData) {
      if (onPrefillReport) {
        onPrefillReport(action.prefillData);
        onClose();
      } else {
        const p = action.prefillData;
        const url = `/${city}/report?category=${encodeURIComponent(p.categorySlug)}&location=${encodeURIComponent(p.locationText)}&summary=${encodeURIComponent(p.prefillSummary)}`;
        router.push(url);
        onClose();
      }
    } else if (action.type === "VIEW_MAP") {
      router.push(`/${city}/dashboard#hazard-map`);
      onClose();
    }
  };

  const handleFollowUpClick = (act: SentinelFollowUpAction) => {
    if (act.url) {
      if (act.url.startsWith("tel:") || act.url.startsWith("http")) {
        window.open(act.url, "_blank");
      } else {
        router.push(act.url);
        onClose();
      }
    } else if (act.action === "BRIEFING") {
      handleSend("What is happening in my area right now?");
    } else if (act.action === "RAIN_FORECAST") {
      handleSend("What is the 24-hour rainfall forecast?");
    } else if (act.action === "VIEW_SHELTERS") {
      handleSend("Where is the nearest verified emergency shelter / muster center?");
    } else if (act.action === "WARNINGS") {
      handleSend("Are any official municipal warnings in effect?");
    } else {
      handleSend(act.label);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="sentinel-assistant-title">
      {/* ─── Backdrop: Dims background content without dimming foreground modal/drawer ─── */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ─── Drawer Container ─── */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
        {/* ─── Drawer Header ─── */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              🛡️
            </div>
            <div>
              <h3 id="sentinel-assistant-title" className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2">
                <span>Sentinel Safety AI</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grounded Municipal Intelligence · {cityConfig.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center font-bold transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            ✕
          </button>
        </div>

      {/* ─── Messages Scroll Area ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[94%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-xs shadow-sm"
                  : "bg-surface-1 border border-border text-text-primary rounded-bl-xs"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-line">{msg.content}</div>
              ) : (
                <MarkdownView content={msg.content} />
              )}

              {/* Actionable Contextual Report Card */}
              {msg.suggestedAction && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 mb-1">
                    <span>⚡ Contextual Civic Action</span>
                    <span className="text-[10px] font-normal opacity-80">(Requires Confirmation)</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug mb-2.5">
                    {msg.suggestedAction.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => msg.suggestedAction && handleTriggerAction(msg.suggestedAction)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>📝</span>
                    <span>{msg.suggestedAction.label}</span>
                    <span>→</span>
                  </button>
                  <p className="text-[10px] text-text-tertiary text-center mt-1">
                    Note: Risk signal does not confirm flooding until field-verified.
                  </p>
                </div>
              )}

              {/* Verified Shelters Card */}
              {msg.nearestShelters && msg.nearestShelters.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">
                    🏛️ Verified Municipal Muster Points:
                  </p>
                  <div className="space-y-1.5">
                    {msg.nearestShelters.slice(0, 2).map((s, sIdx) => (
                      <div key={sIdx} className="p-2 rounded-xl bg-surface-0 border border-border/80 text-[11px]">
                        <p className="font-bold text-text-primary">{s.name}</p>
                        <p className="text-text-tertiary">{s.address}</p>
                        <a
                          href={`tel:${s.phone}`}
                          className="font-bold text-accent hover:underline mt-0.5 inline-block"
                        >
                          📞 Call: {s.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Quick Action Chips */}
              {msg.followUpActions && msg.followUpActions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                  {msg.followUpActions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => handleFollowUpClick(act)}
                      className="px-2.5 py-1 rounded-full bg-surface-0 border border-border hover:border-accent/40 text-[10px] text-text-secondary hover:text-accent font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Grounding Provenance Footer */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/50 text-[10px] text-text-tertiary">
                  <span className="font-semibold text-text-secondary">Grounding Sources: </span>
                  {msg.groundingSources.map((s) => s.name).slice(0, 3).join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-surface-1 rounded-2xl border border-border w-fit text-xs text-text-tertiary animate-pulse">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Consulting real-time telemetry, model cells, and spatial assets...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Quick Suggestion Chips ─── */}
      <div className="px-4 py-2 border-t border-border bg-surface-0/60 overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-[11px] text-text-secondary hover:text-text-primary whitespace-nowrap cursor-pointer transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ─── Input Bar ─── */}
      <div className="p-3 border-t border-border bg-surface-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask about weather, flood risks, shelters in ${cityConfig.name}...`}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-surface-0 border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  </div>
  );
}
