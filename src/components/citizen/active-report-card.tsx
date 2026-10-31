/* ════════════════════════════════════════════════════════
   Active Report Card — Shows user's active/recent reports
   Reference badge · Title · Date · Progress stepper
   ════════════════════════════════════════════════════════ */

"use client";

interface ActiveReportCardProps {
  publicReference: string;
  title: string;
  status: string;
  createdAt: string;
  onClick?: () => void;
}

const STATUS_STEPS = ["Submitted", "Received", "Assigned", "In Progress", "Resolved"];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    DRAFT: 0,
    CONFIRMED: 0,
    ROUTED: 0,
    RECEIVED: 1,
    ASSIGNED: 2,
    IN_PROGRESS: 3,
    ESCALATED: 3,
    PENDING_VERIFICATION: 3,
    WORK_COMPLETED: 3,
    RESOLVED: 4,
    CLOSED: 4,
  };
  return map[status] ?? 0;
}

export function ActiveReportCard({
  publicReference,
  title,
  status,
  createdAt,
  onClick,
}: ActiveReportCardProps) {
  const currentStep = getStepIndex(status);
  const timeAgo = formatTimeAgo(createdAt);

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface-0 border border-border rounded-2xl p-4 text-left hover:border-border-hover hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="inline-flex px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
          {publicReference}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-0.5 line-clamp-2">{title}</h3>
      <p className="text-xs text-text-tertiary mb-4">Submitted {timeAgo}</p>

      {/* Progress stepper */}
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${isCompleted
                      ? "bg-accent text-white"
                      : isCurrent
                        ? "bg-accent/20 border-2 border-accent text-accent"
                        : "bg-surface-2 text-text-tertiary"
                    }
                  `}
                >
                  {isCompleted ? "✓" : ""}
                </div>
                <span className={`text-[9px] mt-1 whitespace-nowrap ${isCurrent ? "text-accent font-semibold" : "text-text-tertiary"}`}>
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-0.5 rounded
                    ${i < currentStep ? "bg-accent" : "bg-surface-3"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
