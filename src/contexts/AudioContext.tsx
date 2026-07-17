"use client";
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";
import { RECITER_EVERYAYAH } from "@/lib/constants";
import { absToSurahAyah } from "@/data/ayahs";
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
  currentTime: number;
  duration: number;
  speed: number;
  repeatCount: number;
  playAyah: (surahNumber: number, numberInSurah: number, absoluteNumber: number, surahName?: string, totalAyahs?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setSpeed: (speed: number) => void;
  setRepeatCount: (count: number) => void;
}

const AudioCtx = createContext<AudioContextType>({
  currentAyah: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  speed: 1,
  repeatCount: 1,
  playAyah: () => {},
  pause: () => {},
  resume: () => {},
  stop: () => {},
  playNext: () => {},
  playPrevious: () => {},
  seekTo: () => {},
  setSpeed: () => {},
  setRepeatCount: () => {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speedRef = useRef(1);
  const repeatCountRef = useRef(1);
  const remainingRef = useRef(1);

  const [currentAyah, setCurrentAyah] = useState<CurrentAyah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [repeatCount, setRepeatCountState] = useState(1);
  const { settings } = useSettings();

  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
  }

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  const setRepeatCount = useCallback((r: number) => {
    repeatCountRef.current = r;
    setRepeatCountState(r);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playAyah = useCallback(
    (surahNumber: number, numberInSurah: number, absoluteNumber: number, surahName?: string, totalAyahs?: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Build everyayah.com streaming URL (works for all reciters)
      const { surah, ayah } = absToSurahAyah(absoluteNumber);
      const folder   = RECITER_EVERYAYAH[settings.reciterEdition] ?? "Alafasy_128kbps";
      const filename = `${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
      const streamUrl = `https://everyayah.com/data/${folder}/${filename}`;
      const localUrl  = `/audio/${settings.reciterEdition}/${absoluteNumber}.mp3`;

      audio.playbackRate = speedRef.current;
      remainingRef.current = repeatCountRef.current;

      // Use local file if downloaded; stream from everyayah.com otherwise
      audio.onerror = null;
      audio.src = localUrl;
      audio.onerror = () => {
        audio.onerror = null;
        audio.src = streamUrl;
        audio.play().catch(() => {});
      };
      audio.play().catch(() => {});
      setCurrentAyah({ surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs });
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);

      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);

      audio.onended = () => {
        const infinite = repeatCountRef.current === 0;
        if (infinite || remainingRef.current > 1) {
          if (!infinite) remainingRef.current--;
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          if (totalAyahs && numberInSurah < totalAyahs) {
            playAyah(surahNumber, numberInSurah + 1, absoluteNumber + 1, surahName, totalAyahs);
          } else {
            setIsPlaying(false);
            setCurrentAyah(null);
            setCurrentTime(0);
            setDuration(0);
          }
        }
      };
    },
    [settings.reciterEdition]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speedRef.current;
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
      audio.onended = null;
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
    }
    setIsPlaying(false);
    setCurrentAyah(null);
    setCurrentTime(0);
    setDuration(0);
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
    <AudioCtx.Provider
      value={{
        currentAyah, isPlaying, currentTime, duration,
        speed, repeatCount,
        playAyah, pause, resume, stop, playNext, playPrevious,
        seekTo, setSpeed, setRepeatCount,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => useContext(AudioCtx);
