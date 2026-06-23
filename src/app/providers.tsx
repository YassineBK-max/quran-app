"use client";
import { ReactNode } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { PinnedSurahsProvider } from "@/contexts/PinnedSurahsContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <BookmarkProvider>
        <PinnedSurahsProvider>
          <AudioProvider>
            <div className="min-h-screen pb-28">
              {children}
            </div>
            <AudioPlayer />
            <BottomNav />
          </AudioProvider>
        </PinnedSurahsProvider>
      </BookmarkProvider>
    </SettingsProvider>
  );
}
