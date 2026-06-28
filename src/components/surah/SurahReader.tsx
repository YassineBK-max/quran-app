"use client";
import { useEffect, useState } from "react";
import { Surah } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { useAudio } from "@/contexts/AudioContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { fetchSurahTranslation } from "@/lib/api";
import { DisplayModeToggle } from "./DisplayModeToggle";
import { AyahLineDisplay } from "./AyahLineDisplay";
import { MushafDisplay } from "./MushafDisplay";
import { useT } from "@/hooks/useT";

interface SurahReaderProps {
  surah: Surah;
}

export function SurahReader({ surah }: SurahReaderProps) {
  const { settings } = useSettings();
  const t = useT();
  const { currentAyah, isPlaying, playAyah, pause, resume, stop } = useAudio();
  const { getProgress, getMemorizedCount } = useMemorization();
  const [translations, setTranslations] = useState<Surah | null>(null);

  const memorizedCount = getMemorizedCount(surah.number);
  const progress = getProgress(surah.number, surah.numberOfAyahs);

  const isThisSurahPlaying =
    currentAyah?.surahNumber === surah.number && isPlaying;
  const isThisSurahLoaded = currentAyah?.surahNumber === surah.number;

  const handlePlaySurah = () => {
    if (isThisSurahPlaying) {
      pause();
    } else if (isThisSurahLoaded) {
      resume();
    } else {
      const firstAyah = surah.ayahs[0];
      if (firstAyah) {
        playAyah(
          surah.number,
          1,
          firstAyah.number,
          surah.englishName,
          surah.numberOfAyahs
        );
      }
    }
  };

  const handleStopSurah = () => {
    if (isThisSurahLoaded) stop();
  };

  useEffect(() => {
    fetchSurahTranslation(surah.number, settings.translationEdition)
      .then(setTranslations)
      .catch(() => {});
  }, [surah.number, settings.translationEdition]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ayahNum = params.get("ayah");
    if (ayahNum) {
      setTimeout(() => {
        document.getElementById(`ayah-${ayahNum}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-arabic text-2xl" style={{ fontFamily: '"Amiri", serif' }}>{surah.name}</h2>
            <button
              onClick={handlePlaySurah}
              title={isThisSurahPlaying ? t.surah_pause : t.surah_play}
              className={`p-1.5 rounded-lg transition-colors ${
                isThisSurahPlaying
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              {isThisSurahPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            {isThisSurahLoaded && (
              <button
                onClick={handleStopSurah}
                title={t.surah_stop}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {surah.englishNameTranslation} · {surah.numberOfAyahs} {t.surah_ayahs} · {surah.revelationType === "Meccan" ? t.surahs_meccan : t.surahs_medinan}
          </p>

          {memorizedCount > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">{t.surah_memorized}</span>
                <span className="text-[10px] font-semibold text-primary">
                  {memorizedCount} / {surah.numberOfAyahs} ({progress}%)
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <DisplayModeToggle />
      </div>

      {settings.displayMode === "ayah-per-line" && surah.number !== 1 && surah.number !== 9 && (
        <div className="text-center py-3">
          <p className="text-muted-foreground" style={{ fontFamily: '"Amiri", serif', fontSize: "1.2rem" }}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

      {settings.displayMode === "ayah-per-line" ? (
        <AyahLineDisplay
          ayahs={surah.ayahs}
          translations={translations?.ayahs}
          surahNumber={surah.number}
          surahName={surah.englishName}
        />
      ) : (
        <MushafDisplay
          ayahs={surah.ayahs}
          surahNumber={surah.number}
          surahName={surah.name}
          surahEnglishName={surah.englishName}
        />
      )}
    </div>
  );
}
