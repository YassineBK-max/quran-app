"use client";
import { useState } from "react";
import { Ayah } from "@/lib/types";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAudio } from "@/contexts/AudioContext";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { AyahPlayButton } from "@/components/audio/AyahPlayButton";

interface MushafDisplayProps {
  ayahs: Ayah[];
  surahNumber: number;
  surahName: string;
}

const toArabicNumeral = (n: number): string => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((d) => arabicDigits[parseInt(d)]).join("");
};

export function MushafDisplay({ ayahs, surahNumber, surahName }: MushafDisplayProps) {
  const { getBookmark } = useBookmarks();
  const { currentAyah } = useAudio();
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);

  return (
    <div className="relative">
      <div className="mushaf-text p-4 bg-card rounded-xl border border-border">
        {ayahs.map((ayah) => {
          const bookmark = getBookmark(ayah.number);
          const isPlaying = currentAyah?.absoluteNumber === ayah.number;
          const isSelected = selectedAyah?.number === ayah.number;

          return (
            <span
              key={ayah.number}
              id={`ayah-${ayah.numberInSurah}`}
              onClick={() => setSelectedAyah(isSelected ? null : ayah)}
              className={`cursor-pointer rounded px-0.5 transition-colors ${
                isPlaying ? "bg-primary/10 underline decoration-primary decoration-2 underline-offset-4" : ""
              } ${bookmark ? `bookmark-highlight-${bookmark.color}` : ""} ${
                isSelected ? "bg-primary/5 ring-1 ring-primary/30" : ""
              }`}
            >
              {ayah.text} ﴿{toArabicNumeral(ayah.numberInSurah)}﴾{" "}
            </span>
          );
        })}
      </div>

      {selectedAyah && (
        <div className="sticky bottom-20 mt-3 flex items-center justify-center gap-2 p-2 bg-card border border-border rounded-xl shadow-lg mx-auto w-fit">
          <span className="text-xs text-muted-foreground px-2">
            Ayah {selectedAyah.numberInSurah}
          </span>
          <AyahPlayButton
            surahNumber={surahNumber}
            numberInSurah={selectedAyah.numberInSurah}
            absoluteNumber={selectedAyah.number}
            surahName={surahName}
            totalAyahs={ayahs.length}
          />
          <BookmarkButton
            ayahNumber={selectedAyah.number}
            surahNumber={surahNumber}
            numberInSurah={selectedAyah.numberInSurah}
            surahName={surahName}
          />
          <button
            onClick={() => setSelectedAyah(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
