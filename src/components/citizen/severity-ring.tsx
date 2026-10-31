/* ════════════════════════════════════════════════════════
   Severity Ring — Circular SVG gauge for priority score
   0-100, color changes by severity
   ════════════════════════════════════════════════════════ */

"use client";

interface SeverityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function SeverityRing({
  score,
  size = 64,
  strokeWidth = 5,
  className = "",
}: SeverityRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color = getColor(clamped);
  const bgColor = getBgColor(clamped);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Score number */}
      <span
        className="absolute text-sm font-bold"
        style={{ color }}
      >
        {clamped}
      </span>
    </div>
  );
}

function getColor(score: number): string {
  if (score >= 80) return "#ba1a1a"; // Critical red
  if (score >= 60) return "#c05600"; // High orange
  if (score >= 40) return "#8a6d00"; // Medium amber
  return "#006e06"; // Low green
}

function getBgColor(score: number): string {
  if (score >= 80) return "rgba(186, 26, 26, 0.12)";
  if (score >= 60) return "rgba(192, 86, 0, 0.12)";
  if (score >= 40) return "rgba(138, 109, 0, 0.12)";
  return "rgba(0, 110, 6, 0.12)";
}
