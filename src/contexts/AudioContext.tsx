"use client";
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";
import { AUDIO_CDN } from "@/lib/constants";
import { useSettings } from "./SettingsContext";

interface CurrentAyah {
  surahNumber: number;
  numberInSurah: number;
  absoluteNumber: number;
  surahName?: string;
  totalAyahs?: number;
}

interface AudioContextType {
  currentAyah: CurrentAyah | null;
  isPlaying: boolean;
  playAyah: (surahNumber: number, numberInSurah: number, absoluteNumber: number, surahName?: string, totalAyahs?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

const AudioCtx = createContext<AudioContextType>({
  currentAyah: null,
  isPlaying: false,
  playAyah: () => {},
  pause: () => {},
  resume: () => {},
  stop: () => {},
  playNext: () => {},
  playPrevious: () => {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAyah, setCurrentAyah] = useState<CurrentAyah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useSettings();

  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
  }

  const playAyah = useCallback((surahNumber: number, numberInSurah: number, absoluteNumber: number, surahName?: string, totalAyahs?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = `${AUDIO_CDN}/${settings.reciterEdition}/${absoluteNumber}.mp3`;
    audio.src = url;
    audio.play().catch(() => {});
    setCurrentAyah({ surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs });
    setIsPlaying(true);

    audio.onended = () => {
      if (totalAyahs && numberInSurah < totalAyahs) {
        playAyah(surahNumber, numberInSurah + 1, absoluteNumber + 1, surahName, totalAyahs);
      } else {
        setIsPlaying(false);
        setCurrentAyah(null);
      }
    };
  }, [settings.reciterEdition]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
      audio.onended = null;
    }
    setIsPlaying(false);
    setCurrentAyah(null);
  }, []);

  const playNext = useCallback(() => {
    if (!currentAyah) return;
    const { surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs } = currentAyah;
    if (totalAyahs && numberInSurah < totalAyahs) {
      playAyah(surahNumber, numberInSurah + 1, absoluteNumber + 1, surahName, totalAyahs);
    }
  }, [currentAyah, playAyah]);

  const playPrevious = useCallback(() => {
    if (!currentAyah) return;
    const { surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs } = currentAyah;
    if (numberInSurah > 1) {
      playAyah(surahNumber, numberInSurah - 1, absoluteNumber - 1, surahName, totalAyahs);
    }
  }, [currentAyah, playAyah]);

  return (
    <AudioCtx.Provider value={{ currentAyah, isPlaying, playAyah, pause, resume, stop, playNext, playPrevious }}>
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => useContext(AudioCtx);
