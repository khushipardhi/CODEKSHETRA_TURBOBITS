/* ════════════════════════════════════════════════════════
   Omnibar — Fixed bottom input bar
   Attachment · Text · Mic · Send
   Glassmorphic, pill-shaped, mobile-first
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useRef } from "react";

interface OmnibarProps {
  onSubmit: (text: string) => void;
  onMicPress?: () => void;
  onAttachPress?: () => void;
  isRecording?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function Omnibar({
  onSubmit,
  onMicPress,
  onAttachPress,
  isRecording = false,
  isLoading = false,
  placeholder = "Tell us what happened",
}: OmnibarProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] pb-[env(safe-area-inset-bottom)]">
      <div className="glass border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2 max-w-[720px] mx-auto bg-surface-0 rounded-full border border-border shadow-md px-1.5 py-1 transition-all focus-within:border-accent focus-within:shadow-lg">
          {/* Attach */}
          <button
            onClick={onAttachPress}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Attach file"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-tertiary min-w-0 py-2"
            aria-label="Describe what happened"
          />

          {/* Mic */}
          <button
            onClick={onMicPress}
            className={`
              w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full
              transition-all cursor-pointer
              ${isRecording
                ? "bg-critical text-white animate-recording"
                : "text-text-tertiary hover:text-accent hover:bg-accent/10"
              }
            `}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Send */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className={`
              w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full
              transition-all cursor-pointer
              ${text.trim()
                ? "bg-accent text-white shadow-md hover:bg-accent-hover"
                : "bg-surface-2 text-text-tertiary"
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
            aria-label="Send report"
            type="button"
          >
            {isLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
