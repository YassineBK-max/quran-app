"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { StreakFlame } from "@/components/ui/StreakFlame";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  extra?: React.ReactNode;
}

export function Header({ title, showBack, showHome = true, extra }: HeaderProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md gold-border-b">
      {/* Gold top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />

      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {showHome && !showBack && (
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        )}

        <h1
          className="text-base font-semibold truncate flex-1 tracking-wide"
          style={{ fontFamily: '"Cairo", sans-serif' }}
        >
          {title}
        </h1>

        {extra && <div className="shrink-0">{extra}</div>}

        {user && <StreakFlame />}

        {user && (
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] text-[9px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
