"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/contexts/MessageContext";
import { useT } from "@/hooks/useT";
import { useViewMode } from "@/contexts/ViewModeContext";

function BookIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
}
function SearchIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}
function BookmarkIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>;
}
function SettingsIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function ClassroomIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function CalendarIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function SessionsIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function MessageIcon({ badge }: { badge?: number }) {
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] text-[8px] flex items-center justify-center font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </div>
  );
}
function AdminIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useMessages();
  const t = useT();
  const { mode } = useViewMode();

  let tabs: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: "/surahs",    label: t.nav_quran,     icon: <BookIcon /> },
    { href: "/search",    label: t.nav_search,    icon: <SearchIcon /> },
    { href: "/bookmarks", label: t.nav_bookmarks, icon: <BookmarkIcon /> },
    { href: "/settings",  label: t.nav_settings,  icon: <SettingsIcon /> },
  ];

  if (user?.role === "student") {
    tabs = [
      { href: "/surahs",    label: t.nav_quran,     icon: <BookIcon /> },
      { href: "/sessions",  label: t.nav_sessions,  icon: <SessionsIcon /> },
      { href: "/classroom", label: t.nav_classroom, icon: <ClassroomIcon /> },
      { href: "/messages",  label: t.nav_messages,  icon: <MessageIcon badge={unreadCount} /> },
      { href: "/settings",  label: t.nav_settings,  icon: <SettingsIcon /> },
    ];
  } else if (user?.role === "teacher") {
    tabs = [
      { href: "/surahs",    label: t.nav_quran,     icon: <BookIcon /> },
      { href: "/classroom", label: t.nav_classroom, icon: <ClassroomIcon /> },
      { href: "/calendar",  label: t.nav_calendar,  icon: <CalendarIcon /> },
      { href: "/messages",  label: t.nav_messages,  icon: <MessageIcon badge={unreadCount} /> },
      { href: "/settings",  label: t.nav_settings,  icon: <SettingsIcon /> },
    ];
  } else if (user?.role === "admin") {
    tabs = [
      { href: "/surahs",   label: t.nav_quran,    icon: <BookIcon /> },
      { href: "/admin",    label: t.nav_admin,    icon: <AdminIcon /> },
      { href: "/messages", label: t.nav_messages, icon: <MessageIcon badge={unreadCount} /> },
      { href: "/settings", label: t.nav_settings, icon: <SettingsIcon /> },
    ];
  } else if (user?.role === "parent") {
    tabs = [
      { href: "/surahs",   label: t.nav_quran,    icon: <BookIcon /> },
      { href: "/sessions", label: t.nav_sessions, icon: <SessionsIcon /> },
      { href: "/messages", label: t.nav_messages, icon: <MessageIcon badge={unreadCount} /> },
      { href: "/settings", label: t.nav_settings, icon: <SettingsIcon /> },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      {/* Gold top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-40" />

      <div className={`${mode === "desktop" ? "max-w-3xl" : "max-w-[480px]"} mx-auto flex justify-around items-center h-14`}>
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl transition-colors min-w-[40px] min-h-[40px] justify-center ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Gold indicator bar above active icon */}
              {active && (
                <span
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "var(--gold)" }}
                />
              )}
              {tab.icon}
              <span className="text-[9px] sm:text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
