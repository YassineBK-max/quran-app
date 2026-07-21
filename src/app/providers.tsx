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
import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { StreakProvider } from "@/contexts/StreakContext";
import { MilestoneTracker } from "@/components/calendar/MilestoneTracker";
import { supabase, ACTIVITY_CHANNEL } from "@/lib/supabase";

// Joins Supabase Presence channel while the user is logged in so the admin
// activity dashboard can show who is currently on the site.
function ActivityTracker() {
  const { user, isLoaded } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded || !user || !supabase) return;

    const ch = supabase.channel(ACTIVITY_CHANNEL);
    ch.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      ch.track({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        joinedAt: Date.now(),
      }).catch(() => {});
    });

    return () => {
      supabase!.removeChannel(ch);
    };
  }, [user?.id, isLoaded]);

  return null;
}

const STANDALONE_PAGES = ["/", "/login", "/signup"];
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/"];

// Pages where BottomNav/AudioPlayer are hidden
function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode } = useViewMode();
  const isStandalone = STANDALONE_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "?")
  );

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
      {!isStandalone && <ViewModeToggle />}
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
                          <ActivityTracker />
                          <StreakProvider>
                            <AuthGuard>
                              <Shell>
                                {children}
                              </Shell>
                            </AuthGuard>
                          </StreakProvider>
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
