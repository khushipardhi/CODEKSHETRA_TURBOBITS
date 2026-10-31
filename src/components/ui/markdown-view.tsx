/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Secure Markdown & Table Renderer
   Phase 7 Production Edition: Resilient Rich Rendering & Mobile Card Conversion
   
   Supports:
   - Headings (H1 to H4) with hierarchy, clean typography and dark mode surfaces
   - Bold, Italic, Strikethrough, and Inline Monospace Code
   - Unordered (- / *) and Ordered (1. / 2.) Lists with spacing
   - Responsive Markdown Tables with horizontal scroll AND Mobile Card transformation
   - Structured Safety Callouts (ALERT, WARNING, CAUTION, NOTE)
   - Code Blocks (fenced with ```) with language badges and Copy button
   - Sanitized URLs (http, https, tel, relative routes)
   - XSS sanitization (disallowing raw scripts, iframes, data: and javascript: URIs)
   - Safe parsing of raw error JSON, exceptions, and stack traces into citizen-friendly alerts
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState } from "react";

interface MarkdownViewProps {
  content: string;
  className?: string;
  onRetry?: () => void;
}

/** Sanitize URLs to prevent javascript: or unsafe URI schemes */
function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return "#";
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // Explicitly block javascript: and data: URIs
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "#";
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }

  // Relative link fallback
  return `/${trimmed.replace(/^\.\//, "")}`;
}

/** Strip dangerous raw HTML tags and arbitrary scripts */
function sanitizeHtmlString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
}

/** Parse inline tokens: bold (**text**), italic (*text*), code (`text`), link ([text](url)) */
function parseInline(text: string): React.ReactNode[] {
  const sanitized = sanitizeHtmlString(text);
  const tokens: React.ReactNode[] = [];
  let remaining = sanitized;
  let key = 0;

  // Regex pattern for bold, italic, code, link
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/;

  while (remaining) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      // Clean any accidental dangling markers
      const cleanRemaining = remaining.replace(/\*\*/g, "");
      tokens.push(cleanRemaining);
      break;
    }

    if (match.index > 0) {
      tokens.push(remaining.substring(0, match.index).replace(/\*\*/g, ""));
    }

    const full = match[0];
    const isBold = full.startsWith("**") && full.endsWith("**");
    const isItalic = !isBold && full.startsWith("*") && full.endsWith("*");
    const isCode = full.startsWith("`") && full.endsWith("`");
    const isLink = full.startsWith("[") && full.includes("](");

    if (isBold) {
      const boldText = full.slice(2, -2);
      tokens.push(
        <strong key={`b-${key++}`} className="font-bold text-text-primary">
          {boldText}
        </strong>
      );
    } else if (isItalic) {
      const italicText = full.slice(1, -1);
      tokens.push(
        <em key={`i-${key++}`} className="italic text-text-secondary">
          {italicText}
        </em>
      );
    } else if (isCode) {
      const codeText = full.slice(1, -1);
      tokens.push(
        <code
          key={`c-${key++}`}
          className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-surface-2 dark:bg-slate-800 text-accent border border-border"
        >
          {codeText}
        </code>
      );
    } else if (isLink) {
      const linkMatch = full.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const safeHref = sanitizeUrl(linkMatch[2]);
        tokens.push(
          <a
            key={`a-${key++}`}
            href={safeHref}
            target={safeHref.startsWith("http") ? "_blank" : undefined}
            rel={safeHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-accent hover:underline font-semibold transition-colors inline-flex items-center gap-0.5"
          >
            <span>{linkText}</span>
            {safeHref.startsWith("http") && <span className="text-[10px]">↗</span>}
          </a>
        );
      } else {
        tokens.push(full);
      }
    } else {
      tokens.push(full);
    }

    remaining = remaining.substring(match.index + full.length);
  }

  return tokens;
}

/** Check if a line is a markdown table delimiter (e.g. |---|:---:|---:|) */
function isTableDelimiter(line: string): boolean {
  const cleaned = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const parts = cleaned.split("|");
  return parts.length >= 2 && parts.every((p) => /^\s*:?-+:?\s*$/.test(p));
}

/** Check if a line could be a table row */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("|") && (trimmed.startsWith("|") || trimmed.includes(" | "));
}

/** Parse table row into cell strings */
function parseCells(line: string): string[] {
  let cleaned = line.trim();
  if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
  if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
  return cleaned.split("|").map((c) => c.trim());
}

export function MarkdownView({ content, className = "", onRetry }: MarkdownViewProps) {
  const [tableCardModes, setTableCardModes] = useState<Record<number, boolean>>({});
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  if (!content || typeof content !== "string") {
    return (
      <div className="text-xs text-text-tertiary italic">
        No information available.
      </div>
    );
  }

  // Check if content is accidental raw JSON, error payload or stack trace
  const trimmedContent = content.trim();
  if (
    (trimmedContent.startsWith("{") && trimmedContent.endsWith("}")) ||
    trimmedContent.includes('"error":') ||
    trimmedContent.startsWith("Error:") ||
    trimmedContent.includes("at Object.<anonymous>")
  ) {
    try {
      const parsed = JSON.parse(trimmedContent);
      if (parsed.error || parsed.message) {
        return (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <span>⚠️</span>
              <span>Telemetry Notification</span>
            </div>
            <p className="text-text-secondary">
              {parsed.error?.message || parsed.message || "The service returned a structured notification."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                Retry Query
              </button>
            )}
          </div>
        );
      }
    } catch {
      // If it's a raw stack trace, wrap in friendly card
      if (trimmedContent.includes("at Object.") || trimmedContent.startsWith("Error:")) {
        return (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-800 dark:text-rose-200">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <span>🚨</span>
              <span>Service Notification</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              An unexpected response was received. Telemetry fallback is active.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
              >
                Retry
              </button>
            )}
          </div>
        );
      }
    }
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Blocks (```code```)
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      const lang = trimmed.slice(3).trim();
      const codeBlockIdx = key;
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```

      const codeString = codeLines.join("\n");

      elements.push(
        <div key={`code-${key++}`} className="my-3 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {lang || "Code"}
            </span>
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(codeString);
                  setCopiedCodeIdx(codeBlockIdx);
                  setTimeout(() => setCopiedCodeIdx(null), 2000);
                }
              }}
              className="text-[10px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
            >
              {copiedCodeIdx === codeBlockIdx ? "Copied! ✓" : "Copy"}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed max-w-full">
            <code>{codeString}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. Markdown Table Detection & Responsive Transformation
    if (isTableRow(trimmed) && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const headerRow = parseCells(trimmed);
      i += 2; // skip header and delimiter

      const bodyRows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        // Skip stray delimiter rows
        if (isTableDelimiter(lines[i])) {
          i++;
          continue;
        }
        bodyRows.push(parseCells(lines[i]));
        i++;
      }

      if (headerRow.length > 0) {
        const tableIdx = key++;
        const isCardsMode = Boolean(tableCardModes[tableIdx]);

        elements.push(
          <div key={`table-${tableIdx}`} className="my-3 space-y-1.5 max-w-full">
            {/* View Switcher Controls (Table vs Card transformation for mobile) */}
            <div className="flex items-center justify-between text-[11px] text-text-tertiary px-1">
              <span className="font-mono text-[10px]">{bodyRows.length} data rows</span>
              <button
                type="button"
                onClick={() =>
                  setTableCardModes((prev) => ({
                    ...prev,
                    [tableIdx]: !prev[tableIdx],
                  }))
                }
                className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-surface-2 hover:bg-surface-3 text-text-secondary transition-colors"
              >
                {isCardsMode ? "Switch to Table ⇄" : "Switch to Cards 📱"}
              </button>
            </div>

            {isCardsMode ? (
              // Mobile Cards Transformation View (Zero horizontal overflow)
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bodyRows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-xl border border-border bg-surface-0 space-y-1.5 shadow-2xs text-xs"
                  >
                    {row.map((cell, cIdx) => (
                      <div key={cIdx} className="flex items-start justify-between gap-2 border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0">
                          {headerRow[cIdx] || `Col ${cIdx + 1}`}
                        </span>
                        <span className="text-text-primary text-right font-medium">
                          {parseInline(cell)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // Standard Table View with Inner Horizontal Scroll
              <div className="overflow-x-auto w-full max-w-full rounded-xl border border-border bg-surface-0 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[320px]">
                  <thead className="bg-surface-1 border-b border-border font-bold text-text-primary text-[11px] uppercase tracking-wider">
                    <tr>
                      {headerRow.map((h, colIdx) => (
                        <th key={colIdx} className="p-2.5 whitespace-nowrap">
                          {parseInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bodyRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? "bg-surface-0" : "bg-surface-1/40 hover:bg-surface-1/70 transition-colors"}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-text-secondary leading-normal text-xs whitespace-nowrap sm:whitespace-normal">
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
        continue;
      }
    }

    // 4. Headings
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h5 key={`h5-${key++}`} className="text-xs font-bold text-text-primary mt-3 mb-1">
          {parseInline(trimmed.replace(/^####\s+/, ""))}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${key++}`} className="text-xs font-bold uppercase tracking-wider text-accent mt-3.5 mb-1.5 font-mono">
          {parseInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${key++}`} className="text-sm font-black text-text-primary mt-4 mb-2 tracking-tight flex items-center gap-1.5">
          {parseInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h2-${key++}`} className="text-base font-black text-text-primary mt-4 mb-2 tracking-tight">
          {parseInline(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      i++;
      continue;
    }

    // 5. Blockquotes and Structured Safety Notes (> )
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.replace(/^>\s+/, "");
      const isCritical = /WARNING|DANGER|ALERT|EVACUATION|EMERGENCY/i.test(quoteText);
      const isNotice = /NOTE|DISCLAIMER|NOTICE|LIMITATION/i.test(quoteText);

      elements.push(
        <blockquote
          key={`quote-${key++}`}
          className={`my-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
            isCritical
              ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200 font-medium"
              : isNotice
              ? "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200"
              : "bg-surface-1 border-border text-text-secondary italic"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm shrink-0">{isCritical ? "🚨" : isNotice ? "ℹ️" : "💬"}</span>
            <div className="flex-1">{parseInline(quoteText)}</div>
          </div>
        </blockquote>
      );
      i++;
      continue;
    }

    // 6. Unordered Lists (- , * , + )
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("+ "))
      ) {
        listItems.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc pl-5 my-2 space-y-1.5 text-xs text-text-secondary leading-relaxed">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Ordered Lists (1. , 2. )
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${key++}`} className="list-decimal pl-5 my-2 space-y-1.5 text-xs text-text-secondary leading-relaxed">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. Regular Paragraph (with word-break and text wrapping to prevent container blowout)
    elements.push(
      <p key={`p-${key++}`} className="text-xs sm:text-sm text-text-primary leading-relaxed my-1.5 break-words">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return (
    <div className={`space-y-1.5 max-w-full overflow-hidden break-words ${className}`}>
      {elements}
    </div>
  );
}
