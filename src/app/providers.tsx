"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { PinnedSurahsProvider } from "@/contexts/PinnedSurahsContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { MemorizationProvider } from "@/contexts/MemorizationContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";

const STANDALONE_PAGES = ["/", "/hadith", "/adhkar"];

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_PAGES.includes(pathname);

  return (
    <SettingsProvider>
      <BookmarkProvider>
        <PinnedSurahsProvider>
          <AudioProvider>
            <MemorizationProvider>
              <div className={`min-h-screen ${isStandalone ? "" : "pb-28"}`}>
                {children}
              </div>
              {!isStandalone && <AudioPlayer />}
              {!isStandalone && <BottomNav />}
            </MemorizationProvider>
          </AudioProvider>
        </PinnedSurahsProvider>
      </BookmarkProvider>
    </SettingsProvider>
  );
}
