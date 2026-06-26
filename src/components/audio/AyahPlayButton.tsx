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
      title={isThisPlaying ? "Pause recitation" : "Recite this ayah"}
      className={`p-1.5 rounded-lg transition-colors ${
        isThisPlaying
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
      }`}
    >
      {isThisPlaying ? (
        /* Pause icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        /* Speaker icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
