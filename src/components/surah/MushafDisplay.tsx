"use client";
import { useState } from "react";
import { Ayah } from "@/lib/types";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { AyahPlayButton } from "@/components/audio/AyahPlayButton";

interface MushafDisplayProps {
  ayahs: Ayah[];
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
}

const toArabicNumeral = (n: number): string => {
  const d = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((c) => d[parseInt(c)] ?? c)
    .join("");
};

export function MushafDisplay({
  ayahs,
  surahNumber,
  surahName,
  surahEnglishName,
}: MushafDisplayProps) {
  const { getBookmark } = useBookmarks();
  const { currentAyah } = useAudio();
  const { isMemorized, toggleMemorized, canToggle } = useMemorization();
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);

  return (
    <div className="relative">
      {/* Outer book page */}
      <div className="mushaf-page">
        {/* Inner decorative border */}
        <div className="mushaf-inner">

          {/* Surah header */}
          <div className="mushaf-header">
            <span className="mushaf-ornament">❧</span>
            <p className="mushaf-name">{surahName}</p>
            <span className="mushaf-ornament">❧</span>
          </div>

          {/* Bismillah — not for Al-Fatiha (1) or At-Tawbah (9) */}
          {surahNumber !== 1 && surahNumber !== 9 && (
            <p className="mushaf-bismillah">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          )}

          {/* Continuous text */}
          <div className="mushaf-text">
            {ayahs.map((ayah) => {
              const bookmark = getBookmark(ayah.number);
              const isPlaying = currentAyah?.absoluteNumber === ayah.number;
              const isSelected = selectedAyah?.number === ayah.number;
              const memorized = isMemorized(surahNumber, ayah.numberInSurah);

              return (
                <span
                  key={ayah.number}
                  id={`ayah-${ayah.numberInSurah}`}
                  onClick={() => setSelectedAyah(isSelected ? null : ayah)}
                  className={[
                    "mushaf-word",
                    isPlaying ? "mushaf-playing" : "",
                    memorized ? "mushaf-memorized" : "",
                    isSelected ? "mushaf-selected" : "",
                    bookmark ? `bookmark-highlight-${bookmark.color}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {ayah.text}{" "}
                  <span className="mushaf-verse-end">
                    ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                  </span>{" "}
                </span>
              );
            })}
          </div>

          {/* Footer rule */}
          <div className="mushaf-footer">
            <span className="mushaf-ornament">— {surahEnglishName} —</span>
          </div>
        </div>
      </div>

      {/* Action bar when an ayah is tapped */}
      {selectedAyah && (
        <div className="sticky bottom-20 mt-3 flex items-center justify-center gap-1.5 p-2 bg-card border border-border rounded-xl shadow-lg mx-auto w-fit">
          <span className="text-xs text-muted-foreground px-2 font-arabic" style={{ fontFamily: '"Amiri", serif' }}>
            آية {toArabicNumeral(selectedAyah.numberInSurah)}
          </span>

          <AyahPlayButton
            surahNumber={surahNumber}
            numberInSurah={selectedAyah.numberInSurah}
            absoluteNumber={selectedAyah.number}
            surahName={surahEnglishName}
            totalAyahs={ayahs.length}
          />

          <BookmarkButton
            ayahNumber={selectedAyah.number}
            surahNumber={surahNumber}
            numberInSurah={selectedAyah.numberInSurah}
            surahName={surahEnglishName}
          />

          {canToggle && (
            <button
              onClick={() => {
                toggleMemorized(surahNumber, selectedAyah);
                setSelectedAyah(null);
              }}
              title={
                isMemorized(surahNumber, selectedAyah.numberInSurah)
                  ? "Mark as not memorized"
                  : "Mark as memorized"
              }
              className={`p-1.5 rounded-lg transition-colors ${
                isMemorized(surahNumber, selectedAyah.numberInSurah)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={
                  isMemorized(surahNumber, selectedAyah.numberInSurah)
                    ? "currentColor"
                    : "none"
                }
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setSelectedAyah(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
