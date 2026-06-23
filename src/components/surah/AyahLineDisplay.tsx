"use client";
import { useState } from "react";
import { Ayah } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
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
        const translation = translations?.find((t) => t.numberInSurah === ayah.numberInSurah);
        const isExpanded = expandedAyahs.has(ayah.numberInSurah);

        return (
          <div
            key={ayah.number}
            id={`ayah-${ayah.numberInSurah}`}
            className={`rounded-xl border transition-colors ${
              isCurrentlyPlaying ? "border-primary/50 bg-primary/5" : "border-border"
            } ${bookmark ? `bookmark-highlight-${bookmark.color}` : "bg-card"}`}
          >
            <div className="flex items-start gap-2 p-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-1">
                {ayah.numberInSurah}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`ayah-text ${settings.tapToTranslate ? "cursor-pointer" : ""}`}
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
              <div className="flex flex-col gap-0.5 shrink-0">
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
