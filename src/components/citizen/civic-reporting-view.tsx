/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Civic Reporting View
   Dedicated destination for reporting and tracking civic problems.
   Preserves full 3-stage AI analysis, classification, routing, and submission.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CategoryGrid } from "@/components/citizen/category-grid";
import { DraftPreview } from "@/components/citizen/draft-preview";
import { ReportAnalysis } from "@/components/citizen/report-analysis";
import { ReportSuccess } from "@/components/citizen/report-success";
import { DeptMismatch } from "@/components/citizen/dept-mismatch";
import { DeptQuestions } from "@/components/citizen/dept-questions";
import { useSpeech } from "@/modules/speech/use-speech";
import { mergeTranscripts } from "@/modules/speech/types";
import { useIncidentDraft } from "@/modules/incidents/use-incident-draft";
import { getOrCreateGuestId, citizenHeaders } from "@/lib/guest-id";
import { useCityContext } from "@/components/providers/city-provider";
import { isLocationInCity, detectCityFromCoords, CITIES } from "@/lib/city-context";
import { useAreaContext } from "@/components/citizen/area-context";
import type { AnalysisResult } from "@/modules/ai/engine";
import type { AIFinalReport } from "@/modules/ai/groq-provider";
import type { GeoRoutingResult } from "@/modules/geo/types";

type ReportingView =
  | "categories"
  | "composing"
  | "preview"
  | "analyzing"
  | "mismatch"
  | "analysis"
  | "dept_questions"
  | "finalizing"
  | "final_review"
  | "submitting"
  | "success";

interface ActiveReport {
  publicReference: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
}

interface CreatedIncident {
  publicReference: string;
  title: string;
  severity: string;
  priorityScore: number;
  priorityBand: string;
  isEmergency: boolean;
  departments: Array<{ code: string; name: string }>;
  createdAt: string;
}

export interface CivicReportingViewProps {
  initialCategory?: string;
  initialLocation?: string;
  initialSummary?: string;
}

export function CivicReportingView({
  initialCategory,
  initialLocation,
  initialSummary,
}: CivicReportingViewProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { city, cityConfig } = useCityContext();
  const { selectedArea, areaCoords } = useAreaContext();

  const effectiveCat =
    initialCategory || searchParams?.get("category") || undefined;
  const effectiveLoc =
    initialLocation || searchParams?.get("location") || (searchParams?.get("ward") ? `Ward ${searchParams.get("ward")}, Mumbai` : undefined);
  const effectiveSummary =
    initialSummary || searchParams?.get("summary") || undefined;

  const normalizedCategory =
    effectiveCat === "drainage_waterlogging" ? "water_drainage" : effectiveCat;
  const hasPrefill = Boolean(normalizedCategory || effectiveLoc || effectiveSummary);

  const [view, setView] = useState<ReportingView>(hasPrefill ? "composing" : "categories");
  const [activeTab, setActiveTab] = useState<"report" | "nearby">("report");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [createdIncident, setCreatedIncident] = useState<CreatedIncident | null>(null);
  const [geoRouting, setGeoRouting] = useState<GeoRoutingResult | null>(null);
  const [activeReports, setActiveReports] = useState<ActiveReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deptAnswers, setDeptAnswers] = useState<Record<string, string | string[]>>({});
  const [finalReport, setFinalReport] = useState<AIFinalReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [prefillNotice, setPrefillNotice] = useState<{
    obsId?: string;
    scenarioId?: string;
    note: string;
  } | null>(null);

  const speech = useSpeech("en-IN");
  const draft = useIncidentDraft();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize guest identity + fetch nearby/active reports
  useEffect(() => {
    getOrCreateGuestId().then(() => {
      fetchActiveReports();
    });
  }, [city]);

  const fetchActiveReports = async () => {
    try {
      const res = await fetch(`/api/incidents/mine?city=${city}`, {
        headers: {
          ...citizenHeaders(),
          "x-city": city,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveReports(
          (data.incidents || []).map((i: Record<string, unknown>) => ({
            publicReference: (i.publicReference as string) || (i.public_reference as string),
            title: i.title as string,
            status: i.status as string,
            severity: i.severity as string,
            createdAt: (i.createdAt as string) || (i.created_at as string),
          }))
        );
      }
    } catch {
      // Non-critical
    }
  };

  // Check URL query parameters for prefill actions (e.g. from Hazard Map or AI suggestions)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get("category");
    const loc = urlParams.get("location");
    const ward = urlParams.get("ward");
    const summary = urlParams.get("summary");
    const obs = urlParams.get("obs") || urlParams.get("obsId");
    const scenario = urlParams.get("scenario") || urlParams.get("scenarioId");
    const lat = urlParams.get("lat") ? parseFloat(urlParams.get("lat")!) : undefined;
    const lon = urlParams.get("lon") ? parseFloat(urlParams.get("lon")!) : undefined;

    if (cat || loc || ward || summary || obs || scenario) {
      draft.reset();
      speech.resetTranscript();
      setError(null);
      setDeptAnswers({});
      setAnalysisResult(null);
      setFinalReport(null);
      draft.setSource("text");

      setPrefillNotice({
        obsId: obs || undefined,
        scenarioId: scenario || undefined,
        note: "Prefilled from Sentinel Environmental Intelligence. A rainfall forecast or high susceptibility score is NOT proof of current ground flooding. Please confirm the exact conditions you observe before submitting.",
      });

      const normalizedCat = cat === "drainage_waterlogging" ? "water_drainage" : (cat || "water_drainage");
      draft.setCategory(normalizedCat);
      const locText = loc || (ward ? `Ward ${ward}, ${cityConfig.name}` : selectedArea || "Ward F/North, Mumbai");
      draft.setLocation(locText, lat || (areaCoords ? areaCoords[0] : 19.0269), lon || (areaCoords ? areaCoords[1] : 72.8553));

      if (summary) {
        draft.updateText(summary);
      } else {
        draft.updateText(`Waterlogging and drainage obstruction observed in ${locText}. Water is accumulating on the carriageway.`);
      }

      setView("composing");
    }
  }, [cityConfig.name, selectedArea, areaCoords]);

  const handleLocationCoordinates = useCallback(
    (lat: number, lng: number) => {
      const inCity = isLocationInCity(lat, lng, city);
      if (!inCity) {
        const detectedSlug = detectCityFromCoords(lat, lng);
        const detectedName = detectedSlug && CITIES[detectedSlug] ? CITIES[detectedSlug].name : "outside " + cityConfig.name;
        setGpsNotice(
          `Device GPS is near ${detectedName}, but you are reporting for ${cityConfig.name}. You can tap a ${cityConfig.name} locality below or keep GPS.`
        );
      } else {
        setGpsNotice(null);
      }
      draft.setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng);
    },
    [city, cityConfig, draft]
  );

  const startComposing = useCallback(
    (source: "text" | "voice" | "category", categorySlug?: string) => {
      draft.reset();
      speech.resetTranscript();
      setError(null);
      setDeptAnswers({});
      setAnalysisResult(null);
      setGeoRouting(null);
      setGpsNotice(null);
      draft.setSource(source);

      if (categorySlug) {
        draft.setCategory(categorySlug);
      }

      // Default location to current selected area
      if (selectedArea && areaCoords) {
        draft.setLocation(selectedArea, areaCoords[0], areaCoords[1]);
      }

      if (source === "voice") {
        speech.startRecording();
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            handleLocationCoordinates(pos.coords.latitude, pos.coords.longitude);
          },
          () => {},
          { timeout: 8000, maximumAge: 60000 }
        );
      }

      setView("composing");
    },
    [draft, speech, handleLocationCoordinates, selectedArea, areaCoords]
  );

  const stopRecordingAndPreview = useCallback(() => {
    speech.stopRecording();
    if (speech.transcript) {
      draft.updateText(mergeTranscripts(draft.draft.text, speech.transcript));
      speech.resetTranscript();
    }
  }, [speech, draft]);

  useEffect(() => {
    if (
      view === "composing" &&
      !speech.isRecording &&
      speech.state === "idle" &&
      speech.transcript
    ) {
      draft.updateText(mergeTranscripts(draft.draft.text, speech.transcript));
      speech.resetTranscript();
    }
  }, [view, speech.state, speech.isRecording, speech.transcript, draft]);

  const goToPreview = useCallback(() => setView("preview"), []);
  const goBackToComposing = useCallback(() => setView("composing"), []);

  const goCategories = useCallback(() => {
    setView("categories");
    draft.reset();
    speech.resetTranscript();
    setError(null);
    setAnalysisResult(null);
    setCreatedIncident(null);
    setGeoRouting(null);
    setDeptAnswers({});
    setFinalReport(null);
  }, [draft, speech]);

  // AI Analysis
  const runAnalysis = useCallback(
    async (overrideDept?: string) => {
      setError(null);
      setView("analyzing");

      const deptToSend = overrideDept ?? draft.draft.selectedCategory ?? undefined;

      try {
        const res = await fetch("/api/incidents/analyze", {
          method: "POST",
          headers: citizenHeaders(),
          body: JSON.stringify({
            text: draft.draft.text,
            locationContext: draft.draft.locationText || undefined,
            selectedDepartment: deptToSend,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message || `Analysis failed (${res.status})`);
        }

        const data = await res.json();
        const result: AnalysisResult = data.analysis;
        setAnalysisResult(result);

        if (result.mismatch && deptToSend) {
          setView("mismatch");
        } else {
          setView("analysis");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to analyze. Please try again.");
        setView("preview");
      }
    },
    [draft.draft]
  );

  const handleGoToCorrectDept = useCallback(
    (correctSlug: string) => {
      draft.setCategory(correctSlug);
      runAnalysis(correctSlug);
    },
    [draft, runAnalysis]
  );

  const handleOverrideMismatch = useCallback(() => {
    setView("analysis");
  }, []);

  const handleAnalysisContinue = useCallback(() => {
    if (!analysisResult) return;
    if (analysisResult.deptQuestions && analysisResult.deptQuestions.length > 0) {
      setView("dept_questions");
    } else {
      setView("finalizing");
      fetch("/api/incidents/finalize", {
        method: "POST",
        headers: citizenHeaders(),
        body: JSON.stringify({
          originalText: draft.draft.text,
          analysis: analysisResult,
          answers: {},
          locationText: draft.draft.locationText || null,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.success && data.finalReport) {
            setFinalReport(data.finalReport);
          }
          setView("final_review");
        })
        .catch(() => setView("final_review"));
    }
  }, [analysisResult, draft.draft]);

  const handleAnswersSubmitted = useCallback(
    async (answers: Record<string, string | string[]>) => {
      if (!analysisResult) return;
      setDeptAnswers(answers);
      setError(null);
      setView("finalizing");

      try {
        const res = await fetch("/api/incidents/finalize", {
          method: "POST",
          headers: citizenHeaders(),
          body: JSON.stringify({
            originalText: draft.draft.text,
            analysis: analysisResult,
            answers,
            locationText: draft.draft.locationText || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.finalReport) {
            setFinalReport(data.finalReport);
          }
        }
        setView("final_review");
      } catch {
        setView("final_review");
      }
    },
    [analysisResult, draft.draft]
  );

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleProceed = useCallback(
    async (answers: Record<string, string | string[]>) => {
      if (!analysisResult || isSubmitting) return;
      const effectiveAnswers = Object.keys(answers).length > 0 ? answers : deptAnswers;
      setError(null);
      setIsSubmitting(true);
      setView("submitting");

      try {
        const aiConversation =
          analysisResult.deptQuestions
            ?.map((q, idx) => ({
              questionId: q.id,
              questionText: q.question,
              questionType: q.type,
              questionOptions: q.options || null,
              answerValue: (() => {
                const raw = effectiveAnswers[q.id];
                return Array.isArray(raw) ? raw.join(", ") : raw || "";
              })(),
              required: q.required,
              sortOrder: idx,
            }))
            .filter((item) => item.answerValue) || [];

        const attachments = await Promise.all(
          (draft.draft.photos || []).map(async (file) => {
            try {
              const dataUrl = await fileToDataUrl(file);
              return {
                fileName: file.name,
                mimeType: file.type || "image/jpeg",
                fileSize: file.size,
                storageUrl: dataUrl,
                purpose: "evidence",
              };
            } catch {
              return null;
            }
          })
        );
        const validAttachments = attachments.filter((a): a is NonNullable<typeof a> => a !== null);

        const res = await fetch("/api/incidents/create", {
          method: "POST",
          headers: {
            ...citizenHeaders(),
            "x-city": city,
          },
          body: JSON.stringify({
            cityId: city,
            originalText: draft.draft.text,
            analysis: analysisResult,
            locationText: draft.draft.locationText || analysisResult.location.text,
            latitude: draft.draft.latitude,
            longitude: draft.draft.longitude,
            departmentAnswers: effectiveAnswers,
            selectedDepartment: draft.draft.selectedCategory || null,
            aiConversation,
            finalReport: finalReport || null,
            attachments: validAttachments,
            telemetryObservationId: prefillNotice?.obsId || null,
            simulationRunId: prefillNotice?.scenarioId || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message || `Failed to create incident (${res.status})`);
        }

        const data = await res.json();
        setCreatedIncident(data.incident);
        if (data.geoRouting) setGeoRouting(data.geoRouting);
        setView("success");
        fetchActiveReports();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit report. Please try again.");
        setView("final_review");
      } finally {
        setIsSubmitting(false);
      }
    },
    [analysisResult, draft.draft, deptAnswers, finalReport, city, isSubmitting, prefillNotice]
  );

  const handleAddPhoto = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          draft.addPhoto(files[i]);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [draft]
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      draft.setLocation("Location not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationCoordinates(pos.coords.latitude, pos.coords.longitude);
      },
      () => draft.setLocation("Could not detect location"),
      { timeout: 10000 }
    );
  }, [draft, handleLocationCoordinates]);

  return (
    <div className="space-y-6 fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Destination Navigation Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Citizen Civic Reporting</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Log, verify, and route municipal issues to responsible {cityConfig.name} departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${city}/my-reports`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-1 border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shadow-xs"
          >
            <span>My Reports</span>
            {activeReports.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {activeReports.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Sub-Tabs: New Report vs Nearby Community Reports */}
      {view === "categories" && (
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-accent text-white shadow-xs"
                : "text-text-secondary hover:bg-surface-2"
            }`}
          >
            ➕ Log New Incident
          </button>
          <button
            onClick={() => setActiveTab("nearby")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "nearby"
                ? "bg-accent text-white shadow-xs"
                : "text-text-secondary hover:bg-surface-2"
            }`}
          >
            📍 Nearby Reports ({activeReports.length})
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-error-bg border border-error-border rounded-2xl p-4 fade-in">
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-error font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-text-tertiary mt-1 hover:text-text-primary cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 1. CATEGORIES VIEW ═══ */}
      {view === "categories" && activeTab === "report" && (
        <div className="space-y-6 fade-in">
          {/* Quick Voice / Text Reporter Box */}
          <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-primary">Instant Voice or Text Report</span>
              <span className="text-[10px] text-text-tertiary">Direct AI triage & auto-routing</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startComposing("text")}
                className="flex-1 bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-xs text-text-tertiary text-left hover:border-accent/40 transition-colors cursor-pointer"
              >
                Describe what happened, where, and when...
              </button>
              <button
                onClick={() => startComposing("voice")}
                className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent-hover transition-all active:scale-95 cursor-pointer flex-shrink-0"
                aria-label="Start voice report"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          {/* Select Category Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Or Select a Municipal Category
              </h2>
              <span className="text-[10px] text-text-tertiary">17 Specialized Municipal Desks</span>
            </div>
            <CategoryGrid onSelect={(slug) => startComposing("category", slug)} />
          </div>
        </div>
      )}

      {/* Nearby Reports List */}
      {view === "categories" && activeTab === "nearby" && (
        <div className="space-y-3 fade-in">
          <div className="p-3 bg-surface-1 rounded-xl text-xs text-text-secondary border border-border">
            Showing verified civic complaints and incident dispatches in {cityConfig.name}. Sensitive caller identities are protected.
          </div>
          {activeReports.length > 0 ? (
            activeReports.map((report) => (
              <div
                key={report.publicReference}
                className="p-3.5 bg-surface-0 border border-border rounded-xl flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent">{report.publicReference}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-text-primary mt-1">{report.title}</p>
                </div>
                <Link
                  href={`/${city}/dashboard/${report.publicReference}`}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  Track →
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-surface-0 border border-border rounded-2xl text-text-secondary text-xs">
              No recent reports in this locality. Everything appears clear.
            </div>
          )}
        </div>
      )}

      {/* ═══ 2. COMPOSING VIEW ═══ */}
      {view === "composing" && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              {speech.isRecording ? "Listening..." : "Describe the Issue"}
            </h2>
            <button
              onClick={goCategories}
              className="text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Prompt 8: Sentinel Environmental Intelligence Prefill Callout */}
          {prefillNotice && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <span>🌧️</span>
                  <span>Prefilled from Sentinel Environmental Intelligence</span>
                </span>
                {prefillNotice.obsId && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300">
                    Ref: {prefillNotice.obsId}
                  </span>
                )}
              </div>
              <p className="text-text-secondary leading-relaxed">
                {prefillNotice.note}
              </p>
            </div>
          )}

          {/* Selected dept badge */}
          {(draft.draft.selectedCategory || normalizedCategory) && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                Category: {(draft.draft.selectedCategory || normalizedCategory || "").replace(/_/g, " ")}
              </span>
              <button
                onClick={() => {
                  draft.setCategory("");
                  setView("categories");
                }}
                className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                Change
              </button>
            </div>
          )}

          {/* Voice recording state */}
          {(speech.isRecording || speech.state === "processing") && (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-3 flex items-center justify-center animate-pulse">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              </div>
              <p className="text-sm text-accent font-medium mb-1">
                {speech.state === "processing" ? "Transcribing speech..." : "Speak now — explaining your hazard..."}
              </p>
              {(speech.interimTranscript || speech.transcript) && (
                <div className="mt-3 p-3 rounded-xl bg-surface-1 border border-border/50 text-left">
                  <p className="text-xs text-text-tertiary mb-1 font-semibold uppercase tracking-wider">Live Transcript:</p>
                  <p className="text-sm text-text-primary leading-relaxed font-medium">
                    {speech.interimTranscript || speech.transcript}
                  </p>
                </div>
              )}
              {speech.isRecording && (
                <button
                  onClick={stopRecordingAndPreview}
                  className="mt-4 px-6 py-2.5 bg-accent text-white rounded-full text-sm font-bold cursor-pointer hover:bg-accent-hover transition-all"
                >
                  Stop Recording
                </button>
              )}
            </div>
          )}

          {/* Text input */}
          {!speech.isRecording && speech.state !== "processing" && (
            <>
              <textarea
                ref={textareaRef}
                value={
                  draft.draft.text ||
                  (hasPrefill
                    ? (effectiveSummary || `Waterlogging and drainage obstruction observed in ${effectiveLoc || "Ward F/North"}. Water is accumulating on the carriageway.`)
                    : "")
                }
                onChange={(e) => draft.updateText(e.target.value)}
                placeholder="Describe what happened, exact street or landmark, and severity..."
                className="w-full bg-surface-1 border border-border rounded-2xl p-4 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                rows={5}
                autoFocus
              />

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleAddPhoto}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-1 border border-border rounded-full text-xs font-medium text-text-secondary hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  Photo Evidence{draft.draft.photos.length > 0 ? ` (${draft.draft.photos.length})` : ""}
                </button>
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-1 border border-border rounded-full text-xs font-medium text-text-secondary hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {draft.draft.locationText ? `📍 ${draft.draft.locationText.split(",")[0]}` : "Detect Location"}
                </button>
                <button
                  onClick={() => {
                    draft.setSource("voice");
                    speech.startRecording();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-1 border border-border rounded-full text-xs font-medium text-text-secondary hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                  Add Voice
                </button>
              </div>

              {/* Photo previews */}
              {draft.draft.photos.length > 0 && (
                <div className="flex gap-2">
                  {draft.draft.photos.map((photo, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                      <img src={URL.createObjectURL(photo)} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => draft.removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Locality Quick Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                  <span>Quick Area / Locality:</span>
                  {draft.draft.locationText && (
                    <span className="text-accent font-medium truncate max-w-[200px]">📍 {draft.draft.locationText}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {cityConfig.localities.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        draft.setLocation(loc.name, loc.coords[0], loc.coords[1]);
                        setGpsNotice(null);
                      }}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        draft.draft.locationText === loc.name
                          ? "bg-accent text-white border-accent"
                          : "bg-surface-1 border-border text-text-secondary hover:border-accent/40"
                      }`}
                    >
                      {loc.name.split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {draft.draft.text.trim().length > 0 && draft.draft.text.trim().length < 10 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-1">
                  ℹ️ Please provide at least 10 characters describing the observed hazard before proceeding.
                </p>
              )}

              <button
                onClick={goToPreview}
                disabled={!draft.isReadyForAnalysis}
                className="w-full py-3.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md mb-8"
              >
                Review Report Details →
              </button>
            </>
          )}
        </div>
      )}

      {/* ═══ 3. PREVIEW VIEW ═══ */}
      {view === "preview" && (
        <DraftPreview
          draft={draft.draft}
          onEditText={goBackToComposing}
          onRecordAgain={() => {
            speech.resetTranscript();
            draft.updateText("");
            speech.startRecording();
            setView("composing");
          }}
          onRemovePhoto={(i) => draft.removePhoto(i)}
          onAddPhoto={handleAddPhoto}
          onEditLocation={requestLocation}
          onAnalyze={() => runAnalysis()}
          onCancel={goCategories}
          isAnalyzing={false}
        />
      )}

      {/* ═══ 4. ANALYZING VIEW ═══ */}
      {view === "analyzing" && (
        <div className="flex flex-col items-center justify-center py-16 fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--color-accent)" strokeWidth="4" />
              <path className="opacity-75" fill="var(--color-accent)" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">AI Classification & Routing</h2>
          <p className="text-sm text-text-tertiary">Analyzing severity, department jurisdiction, and priority...</p>
        </div>
      )}

      {/* ═══ 5. MISMATCH VIEW ═══ */}
      {view === "mismatch" && analysisResult && draft.draft.selectedCategory && (
        <DeptMismatch
          analysis={analysisResult}
          selectedDepartmentSlug={draft.draft.selectedCategory}
          onGoToCorrect={handleGoToCorrectDept}
          onOverride={handleOverrideMismatch}
          onBack={() => setView("preview")}
        />
      )}

      {/* ═══ 6. ANALYSIS VIEW ═══ */}
      {view === "analysis" && analysisResult && (
        <ReportAnalysis
          analysis={analysisResult}
          onContinue={handleAnalysisContinue}
          onBack={() => setView("preview")}
        />
      )}

      {/* ═══ 7. DEPT QUESTIONS VIEW ═══ */}
      {view === "dept_questions" && analysisResult && (
        <DeptQuestions
          analysis={analysisResult}
          onSubmit={handleAnswersSubmitted}
          onBack={() => setView("analysis")}
        />
      )}

      {/* ═══ 8. FINALIZING VIEW ═══ */}
      {view === "finalizing" && (
        <div className="flex flex-col items-center justify-center py-16 fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--color-accent)" strokeWidth="4" />
              <path className="opacity-75" fill="var(--color-accent)" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Synthesizing Final Incident Report</h2>
          <p className="text-sm text-text-tertiary">Structuring dispatch order...</p>
        </div>
      )}

      {/* ═══ 9. FINAL REVIEW VIEW ═══ */}
      {view === "final_review" && analysisResult && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("dept_questions")}
              className="w-9 h-9 rounded-full hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-text-primary">Confirm & Submit Incident</h2>
          </div>

          <div className="bg-surface-0 border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent">
                {(finalReport?.severity || analysisResult.severity.level).toUpperCase()}
              </span>
              <span className="text-xs text-text-tertiary">
                Priority: {finalReport?.priorityScore ?? analysisResult.priority.score}/100
              </span>
            </div>

            <p className="text-sm text-text-primary leading-relaxed">
              {finalReport?.finalSummary || analysisResult.summary}
            </p>

            {analysisResult.departments.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Assigned Departments</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.departments.map((d) => (
                    <span key={d.code} className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleProceed(deptAnswers)}
            disabled={isSubmitting}
            className="w-full py-4 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Submitting to Municipal Desk...</span>
              </>
            ) : (
              <>
                <span>Submit Official Report</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ 10. SUBMITTING VIEW ═══ */}
      {view === "submitting" && (
        <div className="flex flex-col items-center justify-center py-16 fade-in">
          <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--color-success)" strokeWidth="4" />
              <path className="opacity-75" fill="var(--color-success)" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Creating Your Incident</h2>
          <p className="text-sm text-text-tertiary">Transmitting to municipal dispatch...</p>
        </div>
      )}

      {/* ═══ 11. SUCCESS VIEW ═══ */}
      {view === "success" && createdIncident && (
        <ReportSuccess
          incident={createdIncident}
          geoRouting={geoRouting}
          onViewReport={() => router.push(`/${city}/my-reports`)}
          onReportAnother={() => {
            goCategories();
            startComposing("text");
          }}
          onGoHome={goCategories}
        />
      )}
    </div>
  );
}
