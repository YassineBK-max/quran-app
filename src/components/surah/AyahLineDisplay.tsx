"use client";
import { useState } from "react";
import { Ayah } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { AyahPlayButton } from "@/components/audio/AyahPlayButton";

interface AyahLineDisplayProps {
  ayahs: Ayah[];
  translations?: Ayah[];
  surahNumber: number;
  surahName: string;
}

export function AyahLineDisplay({ ayahs, translations, surahNumber, surahName }: AyahLineDisplayProps) {
  const { settings } = useSettings();
  const { getBookmark } = useBookmarks();
  const { currentAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();
  const [expandedAyahs, setExpandedAyahs] = useState<Set<number>>(new Set());

  const toggleTranslation = (num: number) => {
    if (!settings.tapToTranslate) return;
    setExpandedAyahs((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {ayahs.map((ayah) => {
        const bookmark = getBookmark(ayah.number);
        const isCurrentlyPlaying = currentAyah?.absoluteNumber === ayah.number;
        const memorized = isMemorized(surahNumber, ayah.numberInSurah);
        const translation = translations?.find((t) => t.numberInSurah === ayah.numberInSurah);
        const isExpanded = expandedAyahs.has(ayah.numberInSurah);

        return (
          <div
            key={ayah.number}
            id={`ayah-${ayah.numberInSurah}`}
            className={`rounded-xl border transition-colors ${
              isCurrentlyPlaying
                ? "border-primary/50 bg-primary/5"
                : "border-border"
            } ${
              memorized
                ? "memorized-row"
                : bookmark
                ? `bookmark-highlight-${bookmark.color}`
                : "bg-card"
            }`}
          >
            <div className="flex items-start gap-2 p-3">
              {/* Ayah number */}
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-1">
                {ayah.numberInSurah}
              </div>

              {/* Arabic text + translation */}
              <div className="flex-1 min-w-0">
                <div
                  className={`ayah-text ${settings.tapToTranslate ? "cursor-pointer select-none" : ""}`}
                  onClick={() => toggleTranslation(ayah.numberInSurah)}
                >
                  {ayah.text}
                </div>
                {settings.tapToTranslate && translation && (
                  <div className={`translation-enter ${isExpanded ? "open" : ""}`}>
                    <p className="text-sm text-muted-foreground pt-2 pb-1 leading-relaxed border-t border-border mt-2">
                      {translation.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                <AyahPlayButton
                  surahNumber={surahNumber}
                  numberInSurah={ayah.numberInSurah}
                  absoluteNumber={ayah.number}
                  surahName={surahName}
                  totalAyahs={ayahs.length}
                />
                <BookmarkButton
                  ayahNumber={ayah.number}
                  surahNumber={surahNumber}
                  numberInSurah={ayah.numberInSurah}
                  surahName={surahName}
                />
                {/* Memorization toggle — teacher or guest only; students see indicator */}
                {canToggle ? (
                  <button
                    onClick={() => toggleMemorized(surahNumber, {
                      numberInSurah: ayah.numberInSurah,
                      hizbQuarter: ayah.hizbQuarter,
                      page: ayah.page,
                    })}
                    title={memorized ? "Mark as not memorized" : "Mark as memorized"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      memorized
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                  >
                    {memorized ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    )}
                  </button>
                ) : memorized ? (
                  <div className="p-1.5 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
