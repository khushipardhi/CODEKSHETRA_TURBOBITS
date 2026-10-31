/* ════════════════════════════════════════════════════════
   Photo Uploader — Touch-friendly image upload
   Camera icon · Preview thumbnails · Up to 3 photos
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useRef } from "react";

interface PhotoUploaderProps {
  maxPhotos?: number;
  onPhotosChange?: (files: File[]) => void;
}

export function PhotoUploader({ maxPhotos = 3, onPhotosChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPhotos = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);
    onPhotosChange?.(updated.map((p) => p.file));

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onPhotosChange?.(updated.map((p) => p.file));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Visual Evidence</span>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {/* Upload button */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-text-tertiary hover:border-accent hover:text-accent transition-colors cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-[10px] font-medium">Upload</span>
          </button>
        )}

        {/* Previews */}
        {photos.map((photo, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
            <img
              src={photo.preview}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
              aria-label="Remove photo"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxPhotos - photos.length - 1) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-20 h-20 rounded-xl bg-surface-1 border border-border flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-tertiary mt-2">
        Upload up to {maxPhotos} photos showing the issue.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
