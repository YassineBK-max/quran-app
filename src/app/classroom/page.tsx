"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useBooking } from "@/contexts/BookingContext";
import { useMemorization } from "@/contexts/MemorizationContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { isSupabaseReady } from "@/lib/supabase";
import { useT } from "@/hooks/useT";
import { Assignment } from "@/lib/types";

// ─── Assignment card with inline edit ─────────────────────────────────────────
function AssignmentCard({ assignment, classId, canEdit, t, onUpdate, onDelete }: {
  assignment: Assignment; classId: string; canEdit: boolean;
  t: Record<string, string>;
  onUpdate: (classId: string, id: string, patch: { title?: string; description?: string; dueDate?: string }) => void;
  onDelete: (classId: string, id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [desc, setDesc] = useState(assignment.description ?? "");
  const [due, setDue] = useState(assignment.dueDate ?? "");

  if (editing) {
    return (
      <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.classroom_assignment_desc}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium min-h-[44px]">{t.assignment_cancel}</button>
          <button onClick={() => { if (!title.trim()) return; onUpdate(classId, assignment.id, { title: title.trim(), description: desc || undefined, dueDate: due || undefined }); setEditing(false); }}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold min-h-[44px]">{t.assignment_save}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 border border-border rounded-xl p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{assignment.title}</p>
        {assignment.description && <p className="text-xs text-muted-foreground mt-0.5">{assignment.description}</p>}
        {assignment.dueDate && (
          <p className="text-xs text-primary mt-1 font-medium">
            📅 {t.due} {new Date(assignment.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={() => onDelete(classId, assignment.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ClassroomPage() {
  const { user, users } = useAuth();
  const { myClasses, createClass, joinClass, leaveClass, getTeacherClasses, removeAssignment, updateAssignment } = useClassroom();
  const { getAvailableSlots, getMyBookings, getMySlots, slotBookingCount } = useBooking();
  const { setStudentId } = useMemorization();
  const { getEventsForUser } = useCalendar();
  const t = useT();
  const router = useRouter();

  const [newClassName, setNewClassName] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [parentsMenu, setParentsMenu] = useState<string | null>(null);
  // Join additional class
  const [addCode, setAddCode] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  if (!user) {
    return (
      <>
        <Header title={t.classroom_title} />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.classroom_signin_required}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">{t.signin}</button>
        </main>
      </>
    );
  }

  // ── STUDENT VIEW ─────────────────────────────────────────────
  if (user.role === "student") {
    const activeClass = selectedClassId
      ? myClasses.find((c) => c.id === selectedClassId) ?? myClasses[0]
      : myClasses[0];

    const todayStr = new Date().toISOString().split("T")[0];
    const upcomingEvents = activeClass
      ? getEventsForUser()
          .filter((e) => e.classId === activeClass.id && e.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 10)
      : [];

    return (
      <>
        <Header title={t.classroom_title} />
        <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {/* DB Classrooms entry point */}
          {isSupabaseReady && (
            <Link href="/classrooms"
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition-colors group"
              style={{ borderColor: "rgba(200,147,42,0.4)", background: "rgba(200,147,42,0.05)" }}>
              <span className="text-base">🏫</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Course Classrooms</p>
                <p className="text-xs text-muted-foreground">Database-backed classrooms with courses</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground shrink-0"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          )}

          {/* Join class code input — always visible at top */}
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {myClasses.length > 0 ? "Join another class" : t.classroom_join_class}
            </p>
            <div className="flex gap-2">
              <input
                value={addCode}
                onChange={(e) => { setAddCode(e.target.value.toUpperCase()); setAddError(""); setAddSuccess(""); }}
                placeholder="Class code (e.g. ABC123)"
                maxLength={6}
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest uppercase"
              />
              <button
                onClick={() => {
                  setAddError(""); setAddSuccess("");
                  const err = joinClass(addCode);
                  if (err) setAddError(err);
                  else { setAddSuccess("Joined!"); setAddCode(""); setTimeout(() => setAddSuccess(""), 2000); }
                }}
                disabled={addCode.length < 6}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 min-h-[44px]"
              >
                Join
              </button>
            </div>
            {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
            {addSuccess && <p className="text-primary text-xs mt-1">✓ {addSuccess}</p>}
          </div>

          {myClasses.length === 0 ? (
            // Legacy join form if no classes yet
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-center py-8">
              <p className="text-3xl mb-2">🎓</p>
              <p className="text-sm text-muted-foreground">Enter a class code above to join your first class.</p>
            </div>
          ) : (
            <>
              {/* Class tabs */}
              {myClasses.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {myClasses.map((c) => (
                    <button key={c.id} onClick={() => setSelectedClassId(c.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] shrink-0 ${
                        (activeClass?.id) === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {activeClass && (
                <>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.classroom_your_class}</p>
                        <h2 className="text-xl font-bold mt-0.5">{activeClass.name}</h2>
                        <p className="text-sm text-muted-foreground">{t.classroom_teacher} {activeClass.teacherName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.classroom_code} <span className="font-mono font-bold tracking-widest text-primary">{activeClass.code}</span>
                        </p>
                      </div>
                      <button onClick={() => { leaveClass(activeClass.id); setSelectedClassId(null); }}
                        className="text-xs text-red-500 hover:underline mt-1 shrink-0">
                        Leave
                      </button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-3">{t.classroom_classmates} ({activeClass.studentIds.length})</h3>
                    <div className="space-y-2">
                      {activeClass.studentIds.map((sid) => {
                        const student = users.find((u) => u.id === sid);
                        return (
                          <div key={sid} className="flex items-center gap-2 text-sm">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                              {(student?.name ?? "?")[0].toUpperCase()}
                            </div>
                            <span>{student?.name ?? t.unknown}</span>
                            {sid === user.id && <span className="text-xs text-muted-foreground">{t.you}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {activeClass.assignments.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-3">{t.classroom_assignments} ({activeClass.assignments.length})</h3>
                      <div className="space-y-2">
                        {activeClass.assignments.map((a) => (
                          <div key={a.id} className="border border-border rounded-lg p-3">
                            <p className="text-sm font-medium">{a.title}</p>
                            {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                            {a.dueDate && <p className="text-xs text-primary mt-1">{t.due} {a.dueDate}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming events */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-3">{t.calendar_upcoming}</h3>
                    {upcomingEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">{t.calendar_no_activity}</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingEvents.map((ev) => {
                          const color = { session: "#3b82f6", deadline: "#ef4444", goal: "#22c55e", meeting: "#a855f7" }[ev.type] ?? "#6b7280";
                          const displayTime = ev.startTime ?? ev.time;
                          const displayDate = new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return (
                            <div key={ev.id} className="flex items-start gap-3 border border-border rounded-lg p-3" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">{ev.title}</p>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: color + "22", color }}>
                                    {ev.type}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {displayDate}{displayTime ? ` · ${displayTime}` : ""}
                                </p>
                                {ev.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Book a Session widget */}
                  {isSupabaseReady && (() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const available = getAvailableSlots().filter((s) => s.date >= todayStr);
                    const booked = getMyBookings().filter((b) => b.status === "confirmed" && (b.slot?.date ?? "") >= todayStr);
                    return (
                      <Link
                        href="/booking"
                        className="flex items-center gap-4 bg-card border rounded-xl p-4 hover:bg-muted/40 transition-colors group"
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
                              ? `${booked.length} upcoming session${booked.length !== 1 ? "s" : ""} booked`
                              : "View your teacher's available time slots"}
                          </p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                      </Link>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </main>
      </>
    );
  }

  // ── TEACHER / ADMIN VIEW ──────────────────────────────────────
  const teacherClasses = getTeacherClasses();
  const activeClass = selectedClassId ? teacherClasses.find((c) => c.id === selectedClassId) : teacherClasses[0];

  return (
    <>
      <Header title={t.classroom_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* DB Classrooms entry point */}
        {isSupabaseReady && (
          <Link href="/classrooms"
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition-colors group"
            style={{ borderColor: "rgba(200,147,42,0.4)", background: "rgba(200,147,42,0.05)" }}>
            <span className="text-base">🏫</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Course Classrooms</p>
              <p className="text-xs text-muted-foreground">Manage database-backed courses and classrooms</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground shrink-0"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        )}

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t.classroom_create_class}</h2>
          <div className="flex gap-2">
            <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
              placeholder={t.classroom_class_name}
              className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
            <button onClick={() => {
              if (!newClassName.trim()) return;
              createClass(newClassName.trim()); setNewClassName("");
              setSuccess("Class created!"); setTimeout(() => setSuccess(""), 2500);
            }} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium min-h-[44px]">
              {t.classroom_create_btn}
            </button>
          </div>
          {success && <p className="text-primary text-xs">{success}</p>}
        </div>

        {teacherClasses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p className="text-3xl mb-3">🏫</p>
            <p>{t.classroom_no_classes}</p>
          </div>
        ) : (
          <>
            {teacherClasses.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {teacherClasses.map((c) => (
                  <button key={c.id} onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                      (activeClass?.id ?? teacherClasses[0].id) === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {activeClass && (
              <>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">{activeClass.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeClass.studentIds.length} {t.admin_students_label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.classroom_join_code}</p>
                      <p className="font-mono font-bold text-xl tracking-widest text-primary">{activeClass.code}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">{t.classroom_students}</h3>
                  {activeClass.studentIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.classroom_no_students}</p>
                  ) : (
                    <div className="space-y-2">
                      {activeClass.studentIds.map((sid) => {
                        const student = users.find((u) => u.id === sid);
                        const studentParents = users.filter(
                          (u) => u.role === "parent" && (u.linkedChildIds?.includes(sid) || u.linkedChildId === sid)
                        );
                        const isMenuOpen = parentsMenu === sid;
                        return (
                          <div key={sid} className="relative">
                            <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                              <button onClick={() => { setStudentId(sid); router.push("/surahs"); }}
                                className="flex items-center gap-3 flex-1 text-left min-h-[44px]">
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                                  {(student?.name ?? "?")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{student?.name ?? t.unknown}</p>
                                  <p className="text-xs text-muted-foreground">{t.classroom_view_progress}</p>
                                </div>
                              </button>
                              <button onClick={() => setParentsMenu(isMenuOpen ? null : sid)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                                </svg>
                              </button>
                            </div>
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full z-10 mt-1 min-w-56 bg-card border border-border rounded-xl shadow-lg p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">{t.classroom_parents}</p>
                                {studentParents.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">{t.classroom_no_parents}</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {studentParents.map((p) => (
                                      <div key={p.id} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                          {p.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium">{p.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{p.email}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {student?.parentCode && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <p className="text-[10px] text-muted-foreground">
                                      {t.classroom_parent_code}: <span className="font-mono font-bold text-primary">{student.parentCode}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">{t.classroom_assignments}</h3>
                    <button onClick={() => router.push("/calendar")}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                      + {t.calendar_add_event}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                  {activeClass.assignments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <p className="text-2xl mb-2">📝</p>
                      <p>{t.classroom_no_assignments}</p>
                      <button onClick={() => router.push("/calendar")} className="mt-2 text-primary text-xs font-medium hover:underline">
                        {t.calendar_add_event} →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeClass.assignments.map((a) => (
                        <AssignmentCard key={a.id} assignment={a} classId={activeClass.id} canEdit
                          t={t as Record<string, string>} onUpdate={updateAssignment} onDelete={removeAssignment} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Availability widget */}
                {isSupabaseReady && (() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const myUpcomingSlots = getMySlots().filter((s) => s.date >= todayStr);
                  const totalBookings = myUpcomingSlots.reduce((sum, s) => sum + slotBookingCount(s.id), 0);
                  return (
                    <Link
                      href="/booking"
                      className="flex items-center gap-4 bg-card border rounded-xl p-4 hover:bg-muted/40 transition-colors group"
                      style={{ borderColor: "rgba(200,147,42,0.4)" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                        style={{ background: "rgba(200,147,42,0.12)" }}>
                        🗓️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">My Availability</p>
                        <p className="text-xs text-muted-foreground">
                          {myUpcomingSlots.length > 0
                            ? `${myUpcomingSlots.length} upcoming slot${myUpcomingSlots.length !== 1 ? "s" : ""} · ${totalBookings} booking${totalBookings !== 1 ? "s" : ""}`
                            : "No upcoming slots — add your availability"}
                        </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                    </Link>
                  );
                })()}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
