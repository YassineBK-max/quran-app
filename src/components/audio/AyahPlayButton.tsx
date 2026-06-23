"use client";
import { useAudio } from "@/contexts/AudioContext";

interface AyahPlayButtonProps {
  surahNumber: number;
  numberInSurah: number;
  absoluteNumber: number;
  surahName: string;
  totalAyahs: number;
}

export function AyahPlayButton({ surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs }: AyahPlayButtonProps) {
  const { currentAyah, isPlaying, playAyah, pause, resume } = useAudio();

  const isThisAyah = currentAyah?.absoluteNumber === absoluteNumber;
  const isThisPlaying = isThisAyah && isPlaying;

  const handleClick = () => {
    if (isThisPlaying) {
      pause();
    } else if (isThisAyah) {
      resume();
    } else {
      playAyah(surahNumber, numberInSurah, absoluteNumber, surahName, totalAyahs);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-lg transition-colors ${isThisPlaying ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {isThisPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      )}
    </button>
  );
}
