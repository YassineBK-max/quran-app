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
import { CalendarProvider } from "@/contexts/CalendarContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AwardProvider } from "@/contexts/AwardContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { AwardModal } from "@/components/awards/AwardModal";
import { useAuth } from "@/contexts/AuthContext";

const STANDALONE_PAGES = ["/", "/login", "/signup"];
const PUBLIC_PATHS = ["/login", "/signup", "/auth/"];

// Pages where BottomNav/AudioPlayer are hidden
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
        <AuthProvider>
          <BookmarkProvider>
            <PinnedSurahsProvider>
              <AudioProvider>
                <MemorizationProvider>
                  <ClassroomProvider>
                    <CalendarProvider>
                      <MessageProvider>
                        <NotificationProvider>
                          <AuthGuard>
                            <Shell>
                              {children}
                            </Shell>
                          </AuthGuard>
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
    </SessionProvider>
  );
}
