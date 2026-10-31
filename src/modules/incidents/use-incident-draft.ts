/* ════════════════════════════════════════════════════════
   useIncidentDraft — React hook for draft lifecycle
   Pure client state — no API calls
   ════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback } from "react";
import {
  type IncidentDraft,
  createEmptyDraft,
  isDraftReadyForAnalysis,
} from "./incident-draft";

export function useIncidentDraft() {
  const [draft, setDraft] = useState<IncidentDraft>(createEmptyDraft());

  const updateText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, text }));
  }, []);

  const appendText = useCallback((text: string) => {
    setDraft((prev) => ({
      ...prev,
      text: prev.text ? prev.text + " " + text : text,
    }));
  }, []);

  const setSource = useCallback((source: IncidentDraft["source"]) => {
    setDraft((prev) => ({ ...prev, source }));
  }, []);

  const addPhoto = useCallback((file: File) => {
    setDraft((prev) => {
      if (prev.photos.length >= 3) return prev;
      return { ...prev, photos: [...prev.photos, file] };
    });
  }, []);

  const removePhoto = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  const setPhotos = useCallback((photos: File[]) => {
    setDraft((prev) => ({ ...prev, photos: photos.slice(0, 3) }));
  }, []);

  const setLocation = useCallback(
    (locationText: string, lat?: number | null, lng?: number | null) => {
      setDraft((prev) => ({
        ...prev,
        locationText,
        latitude: lat ?? null,
        longitude: lng ?? null,
      }));
    },
    []
  );

  const setCategory = useCallback((slug: string | null) => {
    setDraft((prev) => ({ ...prev, selectedCategory: slug }));
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
  }, []);

  return {
    draft,
    updateText,
    appendText,
    setSource,
    addPhoto,
    removePhoto,
    setPhotos,
    setLocation,
    setCategory,
    reset,
    isReadyForAnalysis: isDraftReadyForAnalysis(draft),
  };
}
