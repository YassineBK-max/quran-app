"use client";
import { useAudio } from "@/contexts/AudioContext";

export function AudioPlayer() {
  const { currentAyah, isPlaying, pause, resume, stop, playNext, playPrevious } = useAudio();

  if (!currentAyah) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-3 flex items-center gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-foreground">{currentAyah.surahName}</p>
          <p className="text-[10px] text-muted-foreground">
            Ayah {currentAyah.numberInSurah}
            {currentAyah.totalAyahs ? ` / ${currentAyah.totalAyahs}` : ""}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={playPrevious}
            title="Previous ayah"
            disabled={currentAyah.numberInSurah <= 1}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={isPlaying ? pause : resume}
            title={isPlaying ? "Pause" : "Play"}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            title="Next ayah"
            disabled={!currentAyah.totalAyahs || currentAyah.numberInSurah >= currentAyah.totalAyahs}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Stop */}
          <button
            onClick={stop}
            title="Stop"
            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
