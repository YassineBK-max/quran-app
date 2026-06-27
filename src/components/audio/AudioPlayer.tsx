"use client";
import { useState } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { PLAYBACK_SPEEDS, REPEAT_OPTIONS } from "@/lib/constants";
import { useT } from "@/hooks/useT";

export function AudioPlayer() {
  const {
    currentAyah, isPlaying,
    currentTime, duration,
    speed, repeatCount,
    pause, resume, stop, playNext, playPrevious,
    seekTo, setSpeed, setRepeatCount,
  } = useAudio();
  const t = useT();

  const [expanded, setExpanded] = useState(false);

  if (!currentAyah) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const speedLabel = speed === 1 ? "1×" : `${speed}×`;
  const repeatLabel = REPEAT_OPTIONS.find((o) => o.value === repeatCount)?.label ?? "1×";

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Main row */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{currentAyah.surahName}</p>
            <p className="text-[10px] text-muted-foreground">
              {t.audio_ayah} {currentAyah.numberInSurah}
              {currentAyah.totalAyahs ? ` / ${currentAyah.totalAyahs}` : ""}
            </p>
          </div>

          {/* Speed + Repeat badges */}
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{speedLabel}</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{repeatLabel}</span>

          {/* Core controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={playPrevious}
              disabled={currentAyah.numberInSurah <= 1}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              title="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={isPlaying ? pause : resume}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!currentAyah.totalAyahs || currentAyah.numberInSurah >= currentAyah.totalAyahs}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              title="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={stop}
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Stop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Seek bar */}
        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span>{fmt(currentTime)}</span>
            <div
              className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekTo(pct * duration);
              }}
            >
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Expanded controls */}
        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
            {/* Speed */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Playback Speed</p>
              <div className="flex gap-1.5 flex-wrap">
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      speed === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Ayah Repetition</p>
              <div className="flex gap-1.5 flex-wrap">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRepeatCount(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      repeatCount === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
