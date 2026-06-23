"use client";
import { useEffect, useState } from "react";
import { Surah } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { fetchSurahTranslation } from "@/lib/api";
import { DisplayModeToggle } from "./DisplayModeToggle";
import { AyahLineDisplay } from "./AyahLineDisplay";
import { MushafDisplay } from "./MushafDisplay";

interface SurahReaderProps {
  surah: Surah;
}

export function SurahReader({ surah }: SurahReaderProps) {
  const { settings } = useSettings();
  const [translations, setTranslations] = useState<Surah | null>(null);

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-arabic text-2xl">{surah.name}</h2>
          <p className="text-xs text-muted-foreground">
            {surah.englishNameTranslation} &middot; {surah.numberOfAyahs} ayahs &middot; {surah.revelationType}
          </p>
        </div>
        <DisplayModeToggle />
      </div>

      {surah.number !== 1 && surah.number !== 9 && (
        <div className="text-center py-3">
          <p className="font-arabic text-xl text-muted-foreground">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
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
          surahName={surah.englishName}
        />
      )}
    </div>
  );
}
