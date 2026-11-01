"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// ─── Inline Lightweight SVG Icons (Zero Extra Dependencies) ───
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 1. Check standalone state and register Service Worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if running in PWA standalone window
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Register service worker for PWA installation compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration notice:", err);
        });
    }

    // Check if dismissed in this browser session
    const hasDismissed = sessionStorage.getItem("pwa-prompt-dismissed") === "true";

    // Show popup after 1.5 seconds if user has not dismissed it in this session
    let autoShowTimer: NodeJS.Timeout | null = null;
    if (!hasDismissed) {
      autoShowTimer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
    }

    // 2. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowModal(false);
      setDeferredPrompt(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (autoShowTimer) clearTimeout(autoShowTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
          setShowModal(false);
          setDeferredPrompt(null);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        } else {
          setShowModal(false);
        }
      } catch (err) {
        console.warn("[PWA] Prompt error:", err);
        setShowGuide(true);
      }
    } else {
      // Browser didn't trigger beforeinstallprompt (e.g. desktop Chrome/Edge/Firefox)
      // Show built-in visual guidance
      setShowGuide(true);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    setShowGuide(false);
    try {
      sessionStorage.setItem("pwa-prompt-dismissed", "true");
    } catch {}
  }, []);

  // Do not render anything if already installed / running in standalone mode
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* ─── 1. Success Toast after installation ─── */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">AGENTONE Installed!</div>
            <div className="text-xs text-emerald-300/80">CivicOS is now available on your home screen & desktop.</div>
          </div>
        </div>
      )}

      {/* ─── 2. Persistent Floating Install Badge (Always Available Across Dashboards) ─── */}
      {!showModal && (
        <button
          onClick={() => {
            setShowModal(true);
            setShowGuide(false);
          }}
          title="Install AGENTONE App"
          aria-label="Install AGENTONE App"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-sky-950/95 text-sky-400 hover:text-sky-300 border border-sky-500/40 hover:border-sky-400/60 shadow-xl shadow-sky-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <div className="relative">
            <DownloadIcon className="w-4 h-4 text-sky-400 group-hover:animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wide pr-1">Install App</span>
        </button>
      )}

      {/* ─── 3. Main PWA Installation Popup / Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-500/30 shadow-2xl shadow-sky-950/50 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

            {/* Close / Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10 cursor-pointer"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4" />
            </button>

            <div className="p-6 relative">
              {/* Header with App Icon */}
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-sky-500/40 shadow-lg shadow-sky-500/20 shrink-0">
                  <Image
                    src="/icons/icon-192.png"
                    alt="AGENTONE Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Official App
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Standalone PWA
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Install AGENTONE CivicOS</h3>
                  <p className="text-xs text-slate-400">Autonomous City Intelligence & Municipal Operations</p>
                </div>
              </div>

              {/* Guidance View or Feature Overview */}
              {showGuide ? (
                <div className="mt-5 p-4 rounded-xl bg-slate-800/80 border border-sky-500/20 space-y-3">
                  {isIOS ? (
                    <>
                      <div className="text-xs font-semibold text-sky-300 flex items-center gap-2">
                        <SmartphoneIcon className="w-4 h-4 text-sky-400" /> How to install on iOS Safari:
                      </div>
                      <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                        <li>
                          Tap the <strong className="text-sky-300">Share button</strong> (
                          <ShareIcon className="inline w-3.5 h-3.5 text-sky-400" /> icon) at the bottom of Safari.
                        </li>
                        <li>
                          Scroll down and tap <strong className="text-sky-300">Add to Home Screen</strong>.
                        </li>
                        <li>
                          Tap <strong className="text-emerald-400">Add</strong> in the top-right corner.
                        </li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-sky-300 flex items-center gap-2">
                        <GlobeIcon className="w-4 h-4 text-sky-400" /> Install from your browser:
                      </div>
                      <ul className="text-xs text-slate-300 space-y-2 pl-1">
                        <li className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>
                            <strong>Desktop (Chrome/Edge):</strong> Look for the install icon (
                            <span className="text-sky-300 font-mono">⊕</span> or computer icon) in the right side of the address bar, then click <strong>Install</strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>
                            <strong>Mobile (Android):</strong> Tap browser menu (<span className="text-sky-300">⋮</span>) and select <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install App&quot;</strong>.
                          </span>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                      <ZapIcon className="w-4 h-4 text-amber-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-300">Fast Launch</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                      <ShieldCheckIcon className="w-4 h-4 text-sky-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-300">Full Screen</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                      <BellIcon className="w-4 h-4 text-emerald-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-300">Hazard Alerts</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Install CivicOS directly to your device for instant offline access to hazard maps, autonomous agent
                    intelligence, and emergency reporting across Mumbai, Pune, and Nagpur.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <DownloadIcon className="w-4 h-4" />
                  {showGuide ? "Got It" : isIOS ? "Install on iOS" : "Install App"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium text-xs border border-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
