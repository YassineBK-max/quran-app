"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { useBooking } from "@/contexts/BookingContext";
import { isSupabaseReady } from "@/lib/supabase";
import { useT } from "@/hooks/useT";

export default function SessionsPage() {
  const { user, users } = useAuth();
  const { getSessions } = useCalendar();
  const { getAvailableSlots, getMyBookings } = useBooking();
  const t = useT();
  const router = useRouter();

  if (!user) {
    return (
      <>
        <Header title={t.sessions_title} />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.signin_required}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">{t.signin}</button>
        </main>
      </>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const sessions = getSessions();
  const past = sessions.filter((s) => s.date < today).reverse();
  const upcoming = sessions.filter((s) => s.date >= today);

  const hasClass = user.role === "student"
    ? !!user.classId
    : user.role === "parent"
    ? !!(user.linkedChildId && users.find((u) => u.id === user.linkedChildId)?.classId)
    : false;

  const formatTime = (start?: string, end?: string) => {
    if (!start && !end) return null;
    if (start && end) return `${start} – ${end}`;
    if (start) return `${t.sessions_from} ${start}`;
    return null;
  };

  const SessionCard = ({ session, isPast }: { session: ReturnType<typeof getSessions>[number]; isPast: boolean }) => (
    <div className={`rounded-xl border p-4 space-y-1.5 ${isPast ? "border-border bg-card opacity-80" : "border-primary/40 bg-primary/5"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{session.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(session.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {!isPast && (
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium shrink-0">
            {t.sessions_upcoming}
          </span>
        )}
      </div>
      {formatTime(session.startTime, session.endTime) && (
        <p className="text-xs text-muted-foreground">
          🕐 {formatTime(session.startTime, session.endTime)}
        </p>
      )}
      {session.description && (
        <p className="text-xs text-muted-foreground">{session.description}</p>
      )}
      {session.notes && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.sessions_notes}</p>
          <p className="text-xs text-foreground">{session.notes}</p>
        </div>
      )}
    </div>
  );

  const noClass = !hasClass && (user.role === "student" || user.role === "parent");

  return (
    <>
      <Header title={t.sessions_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Booking banner — only for students with Supabase enabled */}
        {isSupabaseReady && user?.role === "student" && (() => {
          const available = getAvailableSlots();
          const booked = getMyBookings().filter((b) => b.status === "confirmed");
          return (
            <Link
              href="/booking"
              className="flex items-center gap-4 bg-card border rounded-2xl p-4 hover:bg-muted/40 transition-colors group"
              style={{ borderColor: "rgba(200,147,42,0.4)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: "rgba(200,147,42,0.12)" }}>
                🗓️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Book a Session</p>
                <p className="text-xs text-muted-foreground">
                  {available.length > 0
                    ? `${available.length} slot${available.length !== 1 ? "s" : ""} available from your teacher`
                    : booked.length > 0
                    ? `${booked.length} session${booked.length !== 1 ? "s" : ""} booked`
                    : "View your teacher's available slots"}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          );
        })()}

        {noClass ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <p className="text-3xl mb-4">📅</p>
            <p>{t.sessions_no_class}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <p className="text-3xl mb-4">📅</p>
            <p>{t.sessions_empty}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.sessions_upcoming}</h2>
                {upcoming.map((s) => <SessionCard key={s.id} session={s} isPast={false} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.sessions_past}</h2>
                {past.map((s) => <SessionCard key={s.id} session={s} isPast={true} />)}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
