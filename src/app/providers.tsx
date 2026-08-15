"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { PinnedSurahsProvider } from "@/contexts/PinnedSurahsContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { MemorizationProvider } from "@/contexts/MemorizationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { ClassroomsDbProvider } from "@/contexts/ClassroomsDbContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { RowProvider } from "@/contexts/RowContext";
import { ViewModeProvider, useViewMode } from "@/contexts/ViewModeContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { StreakProvider } from "@/contexts/StreakContext";
import { MilestoneTracker } from "@/components/calendar/MilestoneTracker";
import { ActivityProvider } from "@/contexts/ActivityContext";

const STANDALONE_EXACT = ["/", "/login", "/signup"];
const STANDALONE_PREFIXES = ["/auth/"];
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/"];

// Pages where BottomNav/AudioPlayer are hidden
function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode } = useViewMode();
  const isStandalone =
    STANDALONE_EXACT.some((p) => pathname === p || pathname.startsWith(p + "?")) ||
    STANDALONE_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <RowProvider>
      <div
        className={`min-h-screen ${isStandalone ? "" : "pb-28"} ${
          mode === "desktop" ? "w-full" : "max-w-[480px] mx-auto overflow-x-hidden"
        }`}
      >
        {children}
      </div>
      {!isStandalone && <AudioPlayer />}
      {!isStandalone && <BottomNav />}
      <MilestoneTracker />
    </RowProvider>
  );
}

// Redirect unauthenticated users to /login
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p)
  ) || pathname.startsWith("/api/");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user && !isPublic) {
      router.replace("/login");
    }
  }, [isLoaded, user, isPublic, router]);

  // While auth state is loading, show nothing (useLayoutEffect makes this sub-frame)
  if (!isLoaded) return null;

  // Not logged in on a protected page — already redirecting, show nothing
  if (!user && !isPublic) return null;

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        <ViewModeProvider>
        <AuthProvider>
          <BookmarkProvider>
            <PinnedSurahsProvider>
              <AudioProvider>
                <MemorizationProvider>
                  <ClassroomProvider>
                    <ClassroomsDbProvider>
                    <BookingProvider>
                    <CalendarProvider>
                      <MessageProvider>
                        <NotificationProvider>
                          <ActivityProvider>
                            <StreakProvider>
                              <AuthGuard>
                                <Shell>
                                  {children}
                                </Shell>
                              </AuthGuard>
                            </StreakProvider>
                          </ActivityProvider>
                        </NotificationProvider>
                      </MessageProvider>
                    </CalendarProvider>
                    </BookingProvider>
                    </ClassroomsDbProvider>
                  </ClassroomProvider>
                </MemorizationProvider>
              </AudioProvider>
            </PinnedSurahsProvider>
          </BookmarkProvider>
        </AuthProvider>
        </ViewModeProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
