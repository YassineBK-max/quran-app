"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  supabase,
  isSupabaseReady,
  ACTIVITY_CHANNEL,
  ActivityPayload,
  PresenceUser,
} from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  admin:   { bg: "rgba(239,68,68,0.1)",   text: "#dc2626", dot: "#ef4444" },
  teacher: { bg: "rgba(59,130,246,0.1)",  text: "#2563eb", dot: "#3b82f6" },
  student: { bg: "rgba(30,96,64,0.1)",    text: "var(--primary)", dot: "var(--primary)" },
  parent:  { bg: "rgba(168,85,247,0.1)",  text: "#9333ea", dot: "#a855f7" },
};

const EVENT_META: Record<string, { label: string; icon: string; color: string }> = {
  signup:  { label: "Signed Up",   icon: "✦", color: "#d4a843" },
  login:   { label: "Logged In",   icon: "→", color: "var(--primary)" },
  logout:  { label: "Logged Out",  icon: "←", color: "#7aaa8a" },
  visit:   { label: "Visited",     icon: "◎", color: "#7aaa8a" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: '"Cairo", sans-serif' }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--gold)" }}>{sub}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: "var(--muted)", text: "var(--foreground)", dot: "var(--muted-foreground)" };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: c.bg, color: c.text }}
    >
      {role}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const { user, isLoaded, users } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<ActivityPayload[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser[]>>({});
  const [connected, setConnected] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Route protection — redirect any non-admin immediately after auth loads
  useEffect(() => {
    if (!isLoaded) return;
    if (!user || user.role !== "admin") {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  // Supabase realtime subscription — keyed on user.id so it only re-runs on user change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded || !user || user.role !== "admin") return;
    if (!supabase) return;

    const ch = supabase
      .channel(ACTIVITY_CHANNEL, { config: { presence: { key: user.id } } })
      .on("broadcast", { event: "user_activity" }, ({ payload }) => {
        const p = payload as ActivityPayload;
        const id = `${p.ts}-${p.userId}`;
        setEvents((prev) => [p, ...prev].slice(0, 100));
        setFlashId(id);
        setTimeout(() => setFlashId(null), 1200);
      })
      .on("presence", { event: "sync" }, () => {
        const raw = ch.presenceState() as Record<string, unknown[]>;
        const parsed: Record<string, PresenceUser[]> = {};
        for (const [key, list] of Object.entries(raw)) {
          parsed[key] = list as PresenceUser[];
        }
        setOnlineUsers(parsed);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          // track admin's own presence
          ch.track({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            joinedAt: Date.now(),
          }).catch(() => {});
        }
      });

    channelRef.current = ch;

    return () => {
      supabase!.removeChannel(ch);
      channelRef.current = null;
    };
  }, [isLoaded, user?.id]);

  // Don't render anything until auth resolves
  if (!isLoaded || !user || user.role !== "admin") return null;

  // ── Stats from localStorage ──
  const now = Date.now();
  const todayStart = now - 24 * 60 * 60 * 1000;
  const newToday = users.filter((u) => u.createdAt > todayStart).length;
  const byRole = {
    teacher: users.filter((u) => u.role === "teacher").length,
    student: users.filter((u) => u.role === "student").length,
    parent:  users.filter((u) => u.role === "parent").length,
  };

  // Online users: flatten presence state
  const onlineList: PresenceUser[] = Object.values(onlineUsers).flat();
  const onlineCount = onlineList.length;

  // Recent signups from localStorage (newest first)
  const recentUsers = [...users]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);

  return (
    <>
      <Header title="Live Activity" showBack />

      <main className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-5">

        {/* ── Realtime status ── */}
        {!isSupabaseReady ? (
          <div
            className="rounded-xl px-4 py-3 text-sm flex items-center gap-2.5"
            style={{ background: "rgba(200,147,42,0.1)", border: "1px solid rgba(200,147,42,0.3)", color: "var(--gold)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>
              <strong>Supabase not configured.</strong> Add{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="text-xs">.env.local</code> to enable live updates.
              Historical data below is from local storage.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {connected && (
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: "var(--primary)" }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ background: connected ? "var(--primary)" : "var(--muted-foreground)" }}
                />
              </span>
              <span className="text-xs font-medium" style={{ fontFamily: '"Cairo", sans-serif' }}>
                {connected ? "Realtime connected" : "Connecting…"}
              </span>
            </div>
            {onlineCount > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(30,96,64,0.12)", color: "var(--primary)" }}
              >
                {onlineCount} online now
              </span>
            )}
          </div>
        )}

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total Users"  value={users.length} />
          <StatCard label="New Today"    value={newToday} sub={newToday > 0 ? "last 24h" : undefined} />
          <StatCard label="Teachers"     value={byRole.teacher} />
          <StatCard label="Students"     value={byRole.student} />
        </div>

        {/* ── Online Now (Presence) ── */}
        {isSupabaseReady && (
          <section>
            <div className="islamic-divider mb-3">
              <span>Online Now</span>
            </div>

            {onlineList.length === 0 ? (
              <div
                className="rounded-xl px-4 py-6 text-center text-sm text-muted-foreground"
                style={{ border: "1px dashed var(--border)" }}
              >
                No users online yet — waiting for connections
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {onlineList.map((p, i) => {
                  const c = ROLE_COLORS[p.userRole] ?? ROLE_COLORS.student;
                  return (
                    <div
                      key={`${p.userId}-${i}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {/* Online indicator */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }}
                      />
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {p.userName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.userName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Joined {relativeTime(p.joinedAt)}
                        </p>
                      </div>
                      <RoleBadge role={p.userRole} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Live Activity Feed (Broadcast) ── */}
        {isSupabaseReady && (
          <section>
            <div className="islamic-divider mb-3">
              <span>Live Activity Feed</span>
            </div>

            <div
              ref={feedRef}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--card)" }}
            >
              {/* Feed header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  This session
                </span>
                {events.length > 0 && (
                  <button
                    onClick={() => setEvents([])}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {events.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Waiting for activity…</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Events appear here when users sign up or log in
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ ["--tw-divide-opacity" as string]: "1", borderColor: "var(--border)" }}>
                  {events.map((ev) => {
                    const id = `${ev.ts}-${ev.userId}`;
                    const meta = EVENT_META[ev.type] ?? EVENT_META.visit;
                    const rc = ROLE_COLORS[ev.userRole] ?? ROLE_COLORS.student;
                    const isFlashing = flashId === id;

                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors duration-700"
                        style={{
                          background: isFlashing ? "rgba(200,147,42,0.06)" : "transparent",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {/* Event type icon */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                          style={{ background: `${meta.color}18`, color: meta.color }}
                        >
                          {meta.icon}
                        </div>

                        {/* User avatar */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: rc.bg, color: rc.text }}
                        >
                          {ev.userName?.[0]?.toUpperCase() ?? "?"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold truncate">{ev.userName}</span>
                            <RoleBadge role={ev.userRole} />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{ev.userEmail}</p>
                        </div>

                        {/* Right side */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold" style={{ color: meta.color }}>
                            {meta.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(ev.ts)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Recent Signups (from localStorage, always visible) ── */}
        <section>
          <div className="islamic-divider mb-3">
            <span>All Users — Newest First</span>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Table header */}
            <div
              className="grid gap-3 px-4 py-2"
              style={{
                gridTemplateColumns: "1fr auto auto",
                background: "var(--muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">User</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Role</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Joined</span>
            </div>

            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentUsers.map((u) => {
                const isNew = u.createdAt > todayStart;
                return (
                  <div
                    key={u.id}
                    className="grid items-center gap-3 px-4 py-3"
                    style={{
                      gridTemplateColumns: "1fr auto auto",
                      background: isNew ? "rgba(200,147,42,0.03)" : "var(--card)",
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{u.name}</p>
                        {isNew && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: "rgba(200,147,42,0.15)", color: "var(--gold)" }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                    <p className="text-[10px] text-muted-foreground text-right whitespace-nowrap">
                      {relativeTime(u.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
