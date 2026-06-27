"use client";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useNotifications } from "@/contexts/NotificationContext";
import { useT } from "@/hooks/useT";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  deadline: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  message: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  award: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
};

export default function NotificationsPage() {
  const t = useT();
  const { notifications, markRead, markAllRead } = useNotifications();
  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <Header title={t.notifications_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {sorted.length > 0 && (
          <div className="flex justify-end">
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">
              {t.notifications_mark_all}
            </button>
          </div>
        )}
        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">{t.notifications_empty}</p>
        ) : (
          sorted.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors flex gap-3 ${
                !n.read ? "border-primary/40 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="mt-0.5 shrink-0">{TYPE_ICONS[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {n.link && (
                <Link href={n.link} onClick={(e) => e.stopPropagation()} className="text-primary text-xs hover:underline shrink-0 self-center">
                  {t.notifications_view}
                </Link>
              )}
            </button>
          ))
        )}
      </main>
    </>
  );
}
