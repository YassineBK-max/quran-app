"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { PinnedSurahsProvider } from "@/contexts/PinnedSurahsContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { MemorizationProvider } from "@/contexts/MemorizationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AwardProvider } from "@/contexts/AwardContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { AwardModal } from "@/components/awards/AwardModal";

const STANDALONE_PAGES = ["/", "/login", "/signup"];

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "?")
  );

  return (
    <AwardProvider surahTotals={{}}>
      <div className={`min-h-screen ${isStandalone ? "" : "pb-28"}`}>
        {children}
      </div>
      <AwardModal />
      {!isStandalone && <AudioPlayer />}
      {!isStandalone && <BottomNav />}
    </AwardProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BookmarkProvider>
          <PinnedSurahsProvider>
            <AudioProvider>
              <MemorizationProvider>
                {/* ClassroomProvider must wrap Calendar/Message/Notification so they can useClassroom() */}
                <ClassroomProvider>
                  <CalendarProvider>
                    <MessageProvider>
                      <NotificationProvider>
                        <Shell>
                          {children}
                        </Shell>
                      </NotificationProvider>
                    </MessageProvider>
                  </CalendarProvider>
                </ClassroomProvider>
              </MemorizationProvider>
            </AudioProvider>
          </PinnedSurahsProvider>
        </BookmarkProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
