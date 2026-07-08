"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMessages } from "@/contexts/MessageContext";
import { useT } from "@/hooks/useT";
import { User, ClassRoom } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getTierForCount, ROW_TIERS, RowTier } from "@/contexts/RowContext";
import { RowPill } from "@/components/row/RowBadge";

type Tab = "overview" | "users" | "classes" | "messages";

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-red-500/10 text-red-600 border-red-500/20",
  teacher: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  student: "bg-primary/10 text-primary border-primary/20",
  parent:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const ROLE_AVATAR: Record<string, string> = {
  admin:   "bg-red-500/10 text-red-600",
  teacher: "bg-blue-500/10 text-blue-600",
  student: "bg-primary/10 text-primary",
  parent:  "bg-purple-500/10 text-purple-600",
};

// ─── Expel Confirmation ────────────────────────────────────────────────────────
function ExpelDialog({ target, onConfirm, onCancel }: { target: User; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 className="text-center font-bold text-base mb-2">Expel User</h2>
        <p className="text-center text-sm text-muted-foreground mb-1">
          Are you sure you want to expel{" "}
          <span className="font-semibold text-foreground">{target.name}</span>?
        </p>
        {target.role === "teacher" && (
          <p className="text-center text-xs text-red-500 mb-4 mt-2">
            ⚠️ All classes created by this teacher will be deleted and students will lose access.
          </p>
        )}
        {target.role !== "teacher" && <div className="mb-4" />}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
            Expel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Message Sheet ──────────────────────────────────────────────────────
function MessageSheet({ target, onClose, onSend }: { target: User; onClose: () => void; onSend: (content: string) => void }) {
  const [content, setContent] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${ROLE_AVATAR[target.role]}`}>
            {target.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{target.name}</p>
            <p className="text-xs text-muted-foreground">{target.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message to ${target.name}...`}
          rows={4}
          autoFocus
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => { if (content.trim()) { onSend(content.trim()); onClose(); } }}
          disabled={!content.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}

// ─── Class Detail Panel ───────────────────────────────────────────────────────
function ClassDetailPanel({
  cls,
  users,
  allMemoData,
  onClose,
}: {
  cls: ClassRoom;
  users: User[];
  allMemoData: Record<string, Record<number, unknown[]>>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"students" | "calendar">("students");
  const teacher = users.find((u) => u.id === cls.teacherId);

  const students = cls.studentIds
    .map((sid) => users.find((u) => u.id === sid))
    .filter(Boolean) as User[];

  const getCount = (uid: string) => {
    const ud = allMemoData[uid] ?? {};
    return Object.values(ud).reduce((s, arr) => s + (arr as unknown[]).length, 0);
  };

  const getParents = (student: User) => {
    const parentIds = student.parentIds ?? [];
    return parentIds
      .map((pid) => users.find((u) => u.id === pid))
      .filter(Boolean) as User[];
  };

  const upcomingAssignments = [...cls.assignments]
    .filter((a) => a.dueDate)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{cls.name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{cls.code}</span>
              <span className="text-xs text-muted-foreground">
                {teacher ? `👤 ${teacher.name}` : "⚠️ Teacher removed"}
              </span>
              <span className="text-[10px] text-muted-foreground">{students.length} طالب</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-muted/50 border-b border-border shrink-0">
          {(["students", "calendar"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "students" ? `الطلاب (${students.length})` : `المهام (${cls.assignments.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Students tab ───────────────────────────── */}
          {tab === "students" && (
            <div className="p-3 space-y-2">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا يوجد طلاب في هذا الفصل</p>
              ) : (
                students.map((s) => {
                  const count = getCount(s.id);
                  const tier = getTierForCount(count);
                  const parents = getParents(s);
                  const pct = tier.maxAyahs
                    ? Math.round(((count - tier.minAyahs) / ((tier.maxAyahs ?? count) - tier.minAyahs + 1)) * 100)
                    : 100;
                  return (
                    <div key={s.id} className="bg-muted rounded-xl p-3 space-y-2">
                      {/* Student row */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {s.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{s.displayName ?? s.name}</p>
                            <RowPill tier={tier} count={count} />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>الحفظ: {count} آية</span>
                          <span style={{ color: tier.color }}>{tier.nameAr} · الصف {tier.row}</span>
                        </div>
                        <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tier.color }} />
                        </div>
                        {tier.maxAyahs && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                            {tier.maxAyahs - count} آية للصف التالي
                          </p>
                        )}
                      </div>

                      {/* Parents */}
                      {parents.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground">الأولياء:</span>
                          {parents.map((p) => (
                            <span key={p.id} className="text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                              {p.displayName ?? p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Calendar / Assignments tab ─────────────── */}
          {tab === "calendar" && (
            <div className="p-3 space-y-2">
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد مهام مجدولة</p>
              ) : (
                upcomingAssignments.map((a) => {
                  const isPast = a.dueDate! < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={a.id} className={`rounded-xl p-3 border ${isPast ? "border-red-500/20 bg-red-500/5" : "border-border bg-muted"}`}>
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isPast ? "bg-red-500" : "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                          <p className={`text-[10px] mt-1 font-mono ${isPast ? "text-red-500" : "text-muted-foreground"}`}>
                            {isPast ? "منتهي · " : ""}{a.dueDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, users, teacherCode, setTeacherCode, deleteUser } = useAuth();
  const { classes, expelUserFromClasses } = useClassroom();
  const { sendMessage } = useMessages();
  const t = useT();
  const router = useRouter();

  const [allMemoData] = useLocalStorage<Record<string, Record<number, unknown[]>>>("quran-memorization-all-users", {});

  const [tab, setTab] = useState<Tab>("overview");
  const [newCode, setNewCode] = useState("");
  const [codeSaved, setCodeSaved] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgType, setMsgType] = useState<"user" | "class">("user");
  const [sent, setSent] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "student" | "parent">("all");
  const [expelTarget, setExpelTarget] = useState<User | null>(null);
  const [msgTarget, setMsgTarget] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [detailClass, setDetailClass] = useState<ClassRoom | null>(null);

  if (!user || user.role !== "admin") {
    return (
      <>
        <Header title={t.admin_title} />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">{t.admin_access_denied}</p>
          <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm">
            {t.back_home}
          </button>
        </main>
      </>
    );
  }

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");
  const parents  = users.filter((u) => u.role === "parent");

  const handleSaveCode = () => {
    if (!newCode.trim()) return;
    setTeacherCode(newCode.trim());
    setNewCode("");
    setCodeSaved(true);
    setTimeout(() => setCodeSaved(false), 3000);
  };

  const handleSend = () => {
    if (!msgContent.trim() || !msgRecipient) return;
    sendMessage(msgRecipient, msgType, msgContent.trim(), true);
    setMsgContent(""); setMsgRecipient(""); setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleExpelConfirm = () => {
    if (!expelTarget) return;
    expelUserFromClasses(expelTarget.id, expelTarget.role);
    deleteUser(expelTarget.id);
    setExpelTarget(null);
  };

  const getClassInfoForUser = (u: User) => {
    if (u.role === "student") {
      const allIds = u.classIds ?? (u.classId ? [u.classId] : []);
      const cls = classes.filter((c) => allIds.includes(c.id));
      return cls.length > 0 ? cls.map((c) => c.name).join(", ") : null;
    }
    if (u.role === "teacher") {
      const cls = classes.filter((c) => c.teacherId === u.id);
      return cls.length > 0 ? cls.map((c) => c.name).join(", ") : null;
    }
    if (u.role === "parent") {
      const childIds = u.linkedChildIds ?? (u.linkedChildId ? [u.linkedChildId] : []);
      const names = childIds.map((cid) => users.find((x) => x.id === cid)?.name).filter(Boolean);
      return names.length > 0 ? names.join(", ") : null;
    }
    return null;
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: t.admin_overview },
    { id: "users",    label: t.admin_users_tab },
    { id: "classes",  label: t.admin_classes_tab },
    { id: "messages", label: t.admin_messages_tab },
  ];

  const roleFilterLabels: Record<string, string> = {
    all: t.admin_all, admin: t.admin_admins,
    teacher: t.admin_teachers, student: t.admin_students, parent: t.admin_parents,
  };

  const filteredUsers = users
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  return (
    <>
      <Header title={t.admin_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 bg-muted rounded-xl p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: t.admin_teachers,      count: teachers.length },
                { label: t.admin_students,      count: students.length },
                { label: t.admin_parents_count, count: parents.length },
                { label: t.admin_classes_count, count: classes.length },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Live Activity shortcut */}
          <Link
            href="/admin/activity"
            className="flex items-center gap-3 p-4 rounded-xl transition-colors"
            style={{ border: "1.5px solid rgba(200,147,42,0.35)", background: "linear-gradient(135deg, rgba(200,147,42,0.07), rgba(30,96,64,0.07))" }}
          >
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--gold)" }} />
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "var(--gold)" }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Live Activity Dashboard</p>
              <p className="text-xs text-muted-foreground">Real-time sign-ups, logins &amp; who&apos;s online now</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gold)" }} className="shrink-0"><path d="m9 18 6-6-6-6"/></svg>
          </Link>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold">{t.admin_teacher_code_title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t.admin_teacher_code_desc}</p>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-primary flex-1 tracking-wider text-sm">{teacherCode}</span>
                <button onClick={() => navigator.clipboard?.writeText(teacherCode)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Copy">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
              <div className="flex gap-2">
                <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder={t.admin_new_code}
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
                <button onClick={handleSaveCode} disabled={!newCode.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40">
                  {t.update}
                </button>
              </div>
              {codeSaved && <p className="text-primary text-xs">{t.admin_code_saved}</p>}
            </div>
          </div>
        )}

        {/* ── Users Database ── */}
        {tab === "users" && (
          <div className="space-y-3">
            {/* Search + filters */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">{filteredUsers.length} users</span>
              {(["all", "admin", "teacher", "student", "parent"] as const).map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors min-h-[32px] ${
                    roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                  {roleFilterLabels[r]}
                </button>
              ))}
            </div>

            {/* User rows */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t.admin_no_users}</p>
              ) : (
                filteredUsers.map((u) => {
                  const classInfo = getClassInfoForUser(u);
                  const isSelf = u.id === user.id;
                  return (
                    <div key={u.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                      {/* Row 1: avatar + name/email + role badge */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${ROLE_AVATAR[u.role]}`}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{u.name}</p>
                            <span className={`text-[10px] border px-1.5 py-0.5 rounded capitalize font-medium shrink-0 ${ROLE_COLORS[u.role]}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          {classInfo && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                              {u.role === "student" ? "📚 " : u.role === "parent" ? "👤 " : "🏫 "}
                              {classInfo}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground shrink-0 self-start">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                        </p>
                      </div>

                      {/* Row 2: action buttons */}
                      {!isSelf && (
                        <div className="flex gap-2 pt-1 border-t border-border/50">
                          <button
                            onClick={() => setMsgTarget(u)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors min-h-[36px]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Message
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={() => setExpelTarget(u)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-500/20 transition-colors min-h-[36px]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                              Expel
                            </button>
                          )}
                        </div>
                      )}
                      {isSelf && (
                        <p className="text-[10px] text-muted-foreground/50 text-center">You</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Classes ── */}
        {tab === "classes" && (
          <div className="space-y-2">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.admin_no_classes}</p>
            ) : (
              classes.map((c) => {
                const teacher = users.find((u) => u.id === c.teacherId);
                const studentCount = c.studentIds.length;
                // Compute average memorization across enrolled students
                const totalMemo = c.studentIds.reduce((sum, sid) => {
                  const ud = allMemoData[sid] ?? {};
                  return sum + Object.values(ud).reduce((s, arr) => s + (arr as unknown[]).length, 0);
                }, 0);
                const avgMemo = studentCount > 0 ? Math.round(totalMemo / studentCount) : 0;
                const topTier = (() => {
                  let best: RowTier = ROW_TIERS[0];
                  for (const sid of c.studentIds) {
                    const ud = allMemoData[sid] ?? {};
                    const cnt = Object.values(ud).reduce((s, arr) => s + (arr as unknown[]).length, 0);
                    const t = getTierForCount(cnt);
                    if (t.row > best.row) best = t;
                  }
                  return best;
                })();

                return (
                  <button
                    key={c.id}
                    onClick={() => setDetailClass(c)}
                    className="w-full text-left p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{c.code}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.classroom_teacher} {c.teacherName}</p>
                    {!teacher && <p className="text-xs text-red-500 mt-0.5">Teacher account removed</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{studentCount} {t.admin_students_label}</span>
                      <span className="text-xs text-muted-foreground">{c.assignments.length} {t.admin_assignments_label}</span>
                      {studentCount > 0 && (
                        <span className="text-xs text-muted-foreground">متوسط الحفظ: {avgMemo} آية</span>
                      )}
                    </div>
                    {studentCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-muted-foreground">أعلى صف:</span>
                        <RowPill tier={topTier} />
                        <span className="text-[10px] text-muted-foreground ml-auto">اضغط لعرض التفاصيل →</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ── Messages ── */}
        {tab === "messages" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">{t.admin_send_message}</h2>
            <div className="flex gap-2">
              {(["user", "class"] as const).map((mt) => (
                <button key={mt} onClick={() => setMsgType(mt)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${msgType === mt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {mt === "user" ? t.admin_user_recipient : t.admin_class_recipient}
                </button>
              ))}
            </div>
            <select value={msgRecipient} onChange={(e) => setMsgRecipient(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="">{t.admin_select_recipient}</option>
              {msgType === "user"
                ? users.filter((u) => u.id !== user.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role}) — {u.email}</option>
                  ))
                : classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>
            <textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)}
              placeholder={t.admin_message_content} rows={3}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none" />
            {sent && <p className="text-primary text-xs">{t.admin_sent}</p>}
            <button onClick={handleSend} disabled={!msgContent.trim() || !msgRecipient}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40">
              {t.send}
            </button>
          </div>
        )}
      </main>

      {/* Expel confirmation dialog */}
      {expelTarget && (
        <ExpelDialog
          target={expelTarget}
          onConfirm={handleExpelConfirm}
          onCancel={() => setExpelTarget(null)}
        />
      )}

      {/* Quick message sheet */}
      {msgTarget && (
        <MessageSheet
          target={msgTarget}
          onClose={() => setMsgTarget(null)}
          onSend={(content) => sendMessage(msgTarget.id, "user", content, true)}
        />
      )}

      {/* Class detail panel */}
      {detailClass && (
        <ClassDetailPanel
          cls={detailClass}
          users={users}
          allMemoData={allMemoData}
          onClose={() => setDetailClass(null)}
        />
      )}
    </>
  );
}
