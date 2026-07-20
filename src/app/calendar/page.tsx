"use client";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { useBooking } from "@/contexts/BookingContext";
import { useStreak } from "@/contexts/StreakContext";
import { useRow, ROW_TIERS } from "@/contexts/RowContext";
import { getMilestones, Milestone } from "@/components/calendar/MilestoneTracker";
import { CalendarEvent } from "@/lib/types";
import { useT } from "@/hooks/useT";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  session:  "bg-blue-500",
  meeting:  "bg-purple-500",
  deadline: "bg-red-500",
  goal:     "bg-primary",
};

const TYPE_BG: Record<CalendarEvent["type"], string> = {
  session:  "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  meeting:  "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  deadline: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  goal:     "bg-primary/10 text-primary border-primary/20",
};

const TYPE_HEX: Record<CalendarEvent["type"], string> = {
  session: "#3b82f6", deadline: "#ef4444", goal: "#22c55e", meeting: "#a855f7",
};


const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDateLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function friendlyDate(ymd: string) {
  return parseDateLabel(ymd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function shortDate(ymd: string) {
  return parseDateLabel(ymd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Event Form ───────────────────────────────────────────────────────────────

interface EventFormProps {
  date: string;
  classId: string;
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
  parents: { id: string; name: string; studentName: string }[];
  initial?: CalendarEvent;
  t: import("@/lib/i18n").Translations;
  onSave: (ev: Omit<CalendarEvent, "id" | "classId" | "createdAt">, classId: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function EventForm({ date, classId, classes, students, parents, initial, t, onSave, onCancel, onDelete }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<CalendarEvent["type"]>(initial?.type ?? "session");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [selectedClass, setSelectedClass] = useState(initial?.classId ?? classId ?? classes[0]?.id ?? "");

  // Audience — all student IDs selected, or "all"
  const allStudentIds = students.map((s) => s.id);
  const allParentIds = parents.map((p) => p.id);
  const initStudentIds: string[] =
    initial?.targetStudents === "all" ? allStudentIds :
    Array.isArray(initial?.targetStudents) ? initial.targetStudents :
    initial?.targetType === "user" && initial.targetUserId ? [initial.targetUserId] :
    allStudentIds; // default: all
  const initParentIds: string[] =
    initial?.targetParents === "all" ? allParentIds :
    Array.isArray(initial?.targetParents) ? initial.targetParents :
    []; // default: none
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initStudentIds);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>(initParentIds);

  const EVENT_TYPES: { type: CalendarEvent["type"]; label: string }[] = [
    { type: "session",  label: t.calendar_session },
    { type: "deadline", label: t.calendar_deadline },
    { type: "meeting",  label: t.calendar_meeting },
    { type: "goal",     label: t.calendar_goal },
  ];

  const toggle = (id: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSave = () => {
    if (!title.trim()) return;
    const targetStudents: CalendarEvent["targetStudents"] =
      selectedStudentIds.length === 0 ? undefined :
      selectedStudentIds.length === allStudentIds.length ? "all" :
      selectedStudentIds;
    const targetParents: CalendarEvent["targetParents"] =
      selectedParentIds.length === 0 ? undefined :
      selectedParentIds.length === allParentIds.length ? "all" :
      selectedParentIds;
    onSave({
      title: title.trim(), type, date,
      startTime: startTime || undefined,
      endTime: (type === "deadline" || type === "goal") ? undefined : (endTime || undefined),
      notes: notes || undefined, description: desc || undefined,
      targetStudents, targetParents,
    }, selectedClass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-sm">{initial ? t.calendar_edit_event : t.calendar_add_event}</h2>
            <p className="text-xs text-muted-foreground">{friendlyDate(date)}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_title_label}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.calendar_event_title} autoFocus
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_type_label}</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(({ type: et, label }) => (
                <button key={et} type="button" onClick={() => setType(et)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${type === et ? TYPE_BG[et] + " border-current/30" : "bg-muted text-muted-foreground border-border"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {type === "deadline" || type === "goal" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                {type === "deadline" ? t.calendar_deadline_time : t.calendar_goal_time}
              </label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_start_time}</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_end_time}</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
          {/* Class selector (when teacher has multiple classes) */}
          {classes.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_class}</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm">
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Audience checklist */}
          {(students.length > 0 || parents.length > 0) && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">{t.calendar_audience}</label>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/50">

                {/* ── Students group ── */}
                {/* ── Students ── */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t.calendar_audience_all_students}
                  </p>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
                    <input type="checkbox"
                      checked={selectedStudentIds.length === allStudentIds.length && allStudentIds.length > 0}
                      onChange={() => setSelectedStudentIds(
                        selectedStudentIds.length === allStudentIds.length ? [] : [...allStudentIds]
                      )}
                      className="accent-primary" />
                    All
                  </label>
                </div>
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggle(s.id, selectedStudentIds, setSelectedStudentIds)}
                      className="accent-primary" />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))}

                {/* ── Parents ── */}
                {parents.length > 0 && (<>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {t.calendar_audience_all_parents}
                    </p>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
                      <input type="checkbox"
                        checked={selectedParentIds.length === allParentIds.length && allParentIds.length > 0}
                        onChange={() => setSelectedParentIds(
                          selectedParentIds.length === allParentIds.length ? [] : [...allParentIds]
                        )}
                        className="accent-primary" />
                      All
                    </label>
                  </div>
                  {parents.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" checked={selectedParentIds.includes(p.id)}
                        onChange={() => toggle(p.id, selectedParentIds, setSelectedParentIds)}
                        className="accent-primary" />
                      <div>
                        <p className="text-sm">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.studentName}</p>
                      </div>
                    </label>
                  ))}
                </>)}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_description}</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.calendar_description}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.calendar_notes} rows={2}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none" />
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2 shrink-0">
          {onDelete && (
            <button onClick={onDelete} className="py-3 px-4 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 text-sm font-medium min-h-[48px]">{t.calendar_delete}</button>
          )}
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm min-h-[48px]">{t.assignment_cancel}</button>
          <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 min-h-[48px]">{t.calendar_add_btn}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature 4: Upcoming Sessions Widget ─────────────────────────────────────

function UpcomingWidget({ events, todayYMD, t }: { events: CalendarEvent[]; todayYMD: string; t: import("@/lib/i18n").Translations }) {
  const upcoming = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 14);
    const cutoffStr = toYMD(cutoff);
    return events
      .filter((e) => e.date >= todayYMD && e.date <= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
  }, [events, todayYMD]);

  if (upcoming.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0.5">{t.calendar_upcoming}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {upcoming.map((ev) => {
          const isToday = ev.date === todayYMD;
          return (
            <div
              key={ev.id}
              className="flex-shrink-0 w-32 rounded-xl border border-border bg-card p-2.5 flex flex-col gap-1"
              style={{ borderLeftWidth: 3, borderLeftColor: ev.type === "session" ? "#3b82f6" : ev.type === "deadline" ? "#ef4444" : ev.type === "meeting" ? "#a855f7" : "var(--primary)" }}
            >
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">
                {isToday ? t.calendar_today : shortDate(ev.date)}
              </p>
              <p className="text-xs font-medium leading-tight line-clamp-2">{ev.title}</p>
              {ev.startTime && (
                <p className="text-[9px] text-muted-foreground">{ev.startTime}{ev.endTime ? `–${ev.endTime}` : ""}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Feature 5: Timeline View ─────────────────────────────────────────────────

type TimelineItem =
  | { kind: "event"; date: string; ev: CalendarEvent }
  | { kind: "milestone"; date: string; ms: Milestone };

function TimelineView({ events, milestones, t }: { events: CalendarEvent[]; milestones: Milestone[]; t: import("@/lib/i18n").Translations }) {
  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [
      ...events.map((ev) => ({ kind: "event" as const, date: ev.date, ev })),
      ...milestones.map((ms) => ({ kind: "milestone" as const, date: ms.date, ms })),
    ];
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [events, milestones]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-sm">{t.calendar_no_activity}</p>
        <p className="text-xs mt-1">{t.calendar_no_activity_desc}</p>
      </div>
    );
  }

  let lastMonth = "";

  return (
    <div className="space-y-0 relative">
      {/* Vertical line */}
      <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />

      {items.map((item, idx) => {
        const monthLabel = parseDateLabel(item.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const showMonth = monthLabel !== lastMonth;
        lastMonth = monthLabel;

        return (
          <div key={idx}>
            {showMonth && (
              <div className="flex items-center gap-3 py-3 pl-12">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{monthLabel}</p>
              </div>
            )}
            <div className="flex items-start gap-3 py-1.5">
              {/* Timeline dot */}
              <div className="shrink-0 w-11 flex items-center justify-center pt-1">
                {item.kind === "milestone" ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{ background: ROW_TIERS[item.ms.tierRow - 1]?.ring ?? "#94a3b820", border: `2px solid ${ROW_TIERS[item.ms.tierRow - 1]?.color ?? "#94a3b8"}` }}>
                    {item.ms.tierIcon}
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full ${TYPE_COLORS[item.ev.type]}`} />
                )}
              </div>

              {/* Content card */}
              <div className="flex-1 bg-card border border-border rounded-xl p-3 mb-1">
                {item.kind === "milestone" ? (
                  <>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold" style={{ color: ROW_TIERS[item.ms.tierRow - 1]?.color }}>
                        {t.calendar_reached} {item.ms.tierName}!
                      </p>
                      <span className="text-[9px] text-muted-foreground">{friendlyDate(item.ms.date)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.ms.ayahs} {t.calendar_ayahs_memorized}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold">{item.ev.title}</p>
                      <span className="text-[9px] text-muted-foreground">{friendlyDate(item.ev.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${TYPE_BG[item.ev.type]} capitalize`}>
                        {item.ev.type}
                      </span>
                      {(item.ev.startTime || item.ev.endTime) && (
                        <span className="text-[9px] text-muted-foreground">
                          {item.ev.startTime}{item.ev.endTime ? `–${item.ev.endTime}` : ""}
                        </span>
                      )}
                    </div>
                    {item.ev.description && <p className="text-[10px] text-muted-foreground mt-1">{item.ev.description}</p>}
                    {item.ev.notes && <p className="text-[10px] italic text-muted-foreground/70 mt-0.5">{item.ev.notes}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

interface DayModalProps {
  date: string;
  events: CalendarEvent[];
  milestones: Milestone[];
  isTeacher: boolean;
  activeDates: string[];
  todayYMD: string;
  users: { id: string; name: string }[];
  totalSlots: number;
  freeSlots: number;
  t: import("@/lib/i18n").Translations;
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (ev: CalendarEvent) => void;
}

function DayDetailModal({ date, events, milestones, isTeacher, activeDates, todayYMD, users, totalSlots, freeSlots, t, onClose, onAddEvent, onEditEvent }: DayModalProps) {
  const parsedDate = parseDateLabel(date);
  const isToday = date === todayYMD;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <p className="font-semibold text-sm">
              {parsedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            {isToday && <p className="text-xs text-primary font-medium">{t.calendar_today}</p>}
            {!isTeacher && activeDates.includes(date) && (
              <p className="text-[10px] text-orange-500 font-medium mt-0.5">{t.calendar_streak_recorded}</p>
            )}
            {milestones.map((ms, i) => (
              <p key={i} className="text-[10px] font-medium mt-0.5" style={{ color: ROW_TIERS[ms.tierRow - 1]?.color }}>
                {ms.tierIcon} {t.calendar_reached} {ms.tierName} · {ms.ayahs} {t.calendar_ayahs_memorized}
              </p>
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Slot summary (teachers) */}
        {isTeacher && totalSlots > 0 && (
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs shrink-0">
            <span className="text-muted-foreground">{t.calendar_booking_slots}</span>
            <span className="font-semibold">{freeSlots} {t.calendar_slots_free}</span>
            <span className="text-muted-foreground">/ {totalSlots} {t.calendar_slots_total}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden ml-2">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.round(((totalSlots - freeSlots) / totalSlots) * 100)}%`, background: freeSlots === 0 ? "#ef4444" : "#22c55e" }} />
            </div>
          </div>
        )}

        {/* Add event prompt (teachers) */}
        {isTeacher && (
          <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t.calendar_add_event_prompt}</p>
            <button onClick={onAddEvent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              {t.calendar_add_event}
            </button>
          </div>
        )}

        {/* Events list */}
        <div className="overflow-y-auto flex-1">
          {events.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <p>{isTeacher ? t.calendar_empty_teacher : t.calendar_empty_student}</p>
              {isTeacher && (
                <button onClick={onAddEvent} className="mt-3 text-primary text-xs font-medium hover:underline">
                  + {t.calendar_add_event}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((ev) => {
                const targetUser = ev.targetUserId ? users.find((u) => u.id === ev.targetUserId) : null;
                return (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3"
                    onClick={() => isTeacher && onEditEvent(ev)}
                    role={isTeacher ? "button" : undefined}
                    tabIndex={isTeacher ? 0 : undefined}
                    style={{ cursor: isTeacher ? "pointer" : "default" }}>
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${TYPE_COLORS[ev.type]}`} />
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{ev.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_BG[ev.type]} capitalize shrink-0`}>
                          {ev.type}
                        </span>
                      </div>
                      {(ev.startTime || ev.endTime) && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</p>
                      )}
                      {targetUser && <p className="text-xs text-muted-foreground mt-0.5">{targetUser.name}</p>}
                      {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                      {ev.notes && <p className="text-xs italic text-muted-foreground/80 mt-1">{ev.notes}</p>}
                    </div>
                    {isTeacher && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0 mt-1"><path d="m9 18 6-6-6-6"/></svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar Page ────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user, users } = useAuth();
  const { getTeacherClasses } = useClassroom();
  const { events, addEvent, removeEvent, updateEvent, getEventsForUser } = useCalendar();
  const { slots, slotBookingCount } = useBooking();
  const { activeDates } = useStreak();
  const { currentTier } = useRow();
  const t = useT();
  const router = useRouter();

  const today = new Date();
  const todayYMD = toYMD(today);

  const [view, setView] = useState<"calendar" | "timeline">("calendar");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(todayYMD);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const allTeacherClasses = useMemo(() => isTeacher ? getTeacherClasses() : [], [isTeacher, getTeacherClasses]);
  const defaultClassId = allTeacherClasses[0]?.id ?? "";

  const teacherStudents = useMemo(() => {
    if (!isTeacher) return [];
    const studentIds = allTeacherClasses.flatMap((c) => c.studentIds);
    return users.filter((u) => studentIds.includes(u.id)).map((u) => ({ id: u.id, name: u.name }));
  }, [isTeacher, allTeacherClasses, users]);

  const teacherParents = useMemo(() => {
    if (!isTeacher) return [];
    const result: { id: string; name: string; studentName: string }[] = [];
    const seen = new Set<string>();
    for (const student of teacherStudents) {
      const studentUser = users.find((u) => u.id === student.id);
      for (const pid of studentUser?.parentIds ?? []) {
        if (seen.has(pid)) continue;
        seen.add(pid);
        const parent = users.find((u) => u.id === pid);
        if (parent) result.push({ id: parent.id, name: parent.name, studentName: student.name });
      }
    }
    return result;
  }, [isTeacher, teacherStudents, users]);

  const visibleEvents = useMemo(() => {
    if (isTeacher) {
      const classIds = allTeacherClasses.map((c) => c.id);
      return events.filter((e) => classIds.includes(e.classId));
    }
    return getEventsForUser();
  }, [isTeacher, allTeacherClasses, events, getEventsForUser]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of visibleEvents) (map[ev.date] = map[ev.date] ?? []).push(ev);
    return map;
  }, [visibleEvents]);

  // Feature 3: heatmap data — slots per date for teachers
  const slotsByDate = useMemo(() => {
    if (!isTeacher) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    for (const slot of slots) {
      const avail = slot.max_bookings - slotBookingCount(slot.id);
      map[slot.date] = (map[slot.date] ?? 0) + avail;
    }
    return map;
  }, [isTeacher, slots, slotBookingCount]);

  const totalSlotsByDate = useMemo(() => {
    if (!isTeacher) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    for (const slot of slots) map[slot.date] = (map[slot.date] ?? 0) + slot.max_bookings;
    return map;
  }, [isTeacher, slots]);

  // Feature 2: milestones from localStorage
  useEffect(() => {
    if (user) setMilestones(getMilestones(user.id));
  }, [user, currentTier.row]);

  const milestonesByDate = useMemo(() => {
    const map: Record<string, Milestone[]> = {};
    for (const ms of milestones) (map[ms.date] = map[ms.date] ?? []).push(ms);
    return map;
  }, [milestones]);

  const nowMs = Date.now();
  const studentUpcoming = useMemo(
    () => isTeacher ? [] : visibleEvents.filter((e) => e.date >= todayYMD).sort((a, b) => a.date.localeCompare(b.date)),
    [isTeacher, visibleEvents, todayYMD]
  );

  if (!user) {
    return (
      <>
        <Header title={t.calendar_title} />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.signin_required}</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">{t.signin}</button>
        </main>
      </>
    );
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const dayEvents = eventsByDate[selectedDay] ?? [];
  const selectedDate = parseDateLabel(selectedDay);

  const handleSaveEvent = (ev: Omit<CalendarEvent, "id" | "classId" | "createdAt">, classId: string) => {
    if (editingEvent) updateEvent(editingEvent.id, { ...ev, classId });
    else addEvent(classId || defaultClassId, ev);
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <>
      <Header title={t.calendar_title} />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* Teacher availability quick-link */}
        {isTeacher && (
          <Link href="/booking"
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition-colors group"
            style={{ borderColor: "rgba(200,147,42,0.4)", background: "rgba(200,147,42,0.05)" }}>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.calendar_manage_avail}</p>
              <p className="text-xs text-muted-foreground">{t.calendar_manage_avail_desc}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground shrink-0"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        )}

        {/* Feature 4: Upcoming sessions widget */}
        <UpcomingWidget events={visibleEvents} todayYMD={todayYMD} t={t} />

        {/* Student upcoming events — boxed list with 24h red highlighting */}
        {!isTeacher && studentUpcoming.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">{t.classroom_events}</h3>
            <div className="space-y-2">
              {studentUpcoming.map((ev) => {
                const timeStr = ev.startTime ?? ev.time ?? "23:59";
                const evMs = new Date(`${ev.date}T${timeStr}:00`).getTime();
                const urgent = evMs >= nowMs && evMs - nowMs <= 86400000;
                const color = TYPE_HEX[ev.type];
                const displayTime = ev.startTime ?? ev.time;
                const displayDate = new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={ev.id}
                    className={`rounded-xl p-3 border ${urgent ? "border-red-500/50 bg-red-500/5" : "border-border"}`}
                    style={{ borderLeftWidth: 4, borderLeftColor: urgent ? "#ef4444" : color }}>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {urgent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                          {t.classroom_urgent_soon}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: color + "22", color }}>
                        {t[`calendar_type_${ev.type}` as keyof typeof t] as string}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{ev.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayDate}{displayTime ? ` · ${displayTime}` : ""}
                    </p>
                    {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
          <button onClick={() => setView("calendar")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.calendar_view_calendar}
          </button>
          <button onClick={() => setView("timeline")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.calendar_view_timeline}
          </button>
        </div>

        {/* ── CALENDAR VIEW ─────────────────────────────────────────────── */}
        {view === "calendar" && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(todayYMD); }} className="flex flex-col items-center">
                <span className="text-lg font-bold">{MONTH_NAMES[month]} {year}</span>
                <span className="text-xs text-primary font-medium -mt-0.5">{t.calendar_today}</span>
              </button>
              <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap text-[9px] text-muted-foreground">
              {!isTeacher && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{t.calendar_legend_streak}</span>}
              {milestones.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{t.calendar_legend_milestone}</span>}
              {isTeacher && slots.length > 0 && <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/40 inline-block border border-green-500/40" />{t.calendar_legend_free}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/30 inline-block border border-red-500/30" />{t.calendar_legend_booked}</span>
              </>}
            </div>

            {/* Calendar grid */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden" dir="ltr">
              <div className="grid grid-cols-7 border-b border-border">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2.5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null) {
                    return <div key={`e${i}`} className="aspect-square sm:aspect-auto sm:h-16 border-b border-r border-border/50 last:border-r-0" />;
                  }
                  const ymd = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isToday = ymd === todayYMD;
                  const isSelected = ymd === selectedDay;
                  const dayEvs = eventsByDate[ymd] ?? [];
                  const isLastRow = i >= cells.length - 7;

                  // Feature 1: streak overlay
                  const hasStreak = activeDates.includes(ymd);
                  // Feature 2: milestone overlay
                  const hasMilestone = (milestonesByDate[ymd] ?? []).length > 0;
                  // Feature 3: heatmap (teachers only)
                  const totalSlots = totalSlotsByDate[ymd] ?? 0;
                  const freeSlots = slotsByDate[ymd] ?? 0;
                  const heatmapStyle: React.CSSProperties = isTeacher && totalSlots > 0 ? {
                    background: freeSlots === 0
                      ? "rgba(239,68,68,0.12)"
                      : freeSlots < totalSlots
                        ? "rgba(251,191,36,0.15)"
                        : "rgba(34,197,94,0.12)",
                  } : {};

                  return (
                    <button key={ymd} onClick={() => { setSelectedDay(ymd); setShowDayModal(true); }}
                      style={!isSelected ? heatmapStyle : undefined}
                      className={`aspect-square sm:aspect-auto sm:h-16 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors border-b border-r border-border/50 last:border-r-0 relative ${isLastRow ? "border-b-0" : ""} ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}>

                      {/* Feature 3: heatmap right-edge bar for teachers */}
                      {isTeacher && totalSlots > 0 && (
                        <span className="absolute top-0 right-0 w-[3px] h-full rounded-r"
                          style={{ background: freeSlots === 0 ? "#ef4444" : freeSlots < totalSlots ? "#f59e0b" : "#22c55e", opacity: 0.6 }} />
                      )}

                      <span className={`text-xs sm:text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground font-bold" : isSelected ? "text-primary font-bold" : "text-foreground"}`}>
                        {day}
                      </span>

                      {/* Event dots + streak flame + milestone star */}
                      <div className="flex gap-0.5 flex-wrap justify-center items-center px-0.5">
                        {dayEvs.slice(0, 2).map((ev) => (
                          <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type]}`} />
                        ))}
                        {dayEvs.length > 2 && <span className="text-[7px] text-muted-foreground">+{dayEvs.length - 2}</span>}
                        {/* Feature 1: streak dot (not shown for teachers) */}
                        {hasStreak && !isTeacher && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                        )}
                        {/* Feature 2: milestone dot */}
                        {hasMilestone && (
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day panel */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <p className="font-semibold text-sm">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  {selectedDay === todayYMD && <p className="text-xs text-primary font-medium">{t.calendar_today}</p>}
                  {/* Feature 1: streak info (hidden for teachers) */}
                  {!isTeacher && activeDates.includes(selectedDay) && (
                    <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                      {t.calendar_streak_recorded}
                    </p>
                  )}
                  {/* Feature 2: milestone info */}
                  {(milestonesByDate[selectedDay] ?? []).map((ms, i) => (
                    <p key={i} className="text-[10px] font-medium mt-0.5" style={{ color: ROW_TIERS[ms.tierRow - 1]?.color }}>
                      {ms.tierIcon} {t.calendar_reached} {ms.tierName} · {ms.ayahs} {t.calendar_ayahs_memorized}
                    </p>
                  ))}
                </div>
                {isTeacher && (
                  <button onClick={() => { setEditingEvent(null); setShowForm(true); }}
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90"
                    aria-label={t.calendar_add_event}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                )}
              </div>

              {/* Feature 3: slot summary for selected day (teachers) */}
              {isTeacher && (totalSlotsByDate[selectedDay] ?? 0) > 0 && (
                <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{t.calendar_booking_slots}</span>
                  <span className="font-semibold">{slotsByDate[selectedDay] ?? 0} {t.calendar_slots_free}</span>
                  <span className="text-muted-foreground">/ {totalSlotsByDate[selectedDay]} {t.calendar_slots_total}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden ml-2">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((totalSlotsByDate[selectedDay] - (slotsByDate[selectedDay] ?? 0)) / totalSlotsByDate[selectedDay]) * 100)}%`,
                        background: (slotsByDate[selectedDay] ?? 0) === 0 ? "#ef4444" : "#22c55e",
                      }} />
                  </div>
                </div>
              )}

              {dayEvents.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <p>{isTeacher ? t.calendar_empty_teacher : t.calendar_empty_student}</p>
                  {isTeacher && (
                    <button onClick={() => { setEditingEvent(null); setShowForm(true); }}
                      className="mt-3 text-primary text-xs font-medium hover:underline">
                      + {t.calendar_add_event}
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {dayEvents.map((ev) => {
                    const targetUser = ev.targetUserId ? users.find((u) => u.id === ev.targetUserId) : null;
                    return (
                      <div key={ev.id} className="flex items-start gap-3 px-4 py-3"
                        onClick={() => isTeacher && (setEditingEvent(ev), setShowForm(true))}
                        role={isTeacher ? "button" : undefined}
                        tabIndex={isTeacher ? 0 : undefined}
                        style={{ cursor: isTeacher ? "pointer" : "default" }}>
                        <div className={`w-1 self-stretch rounded-full shrink-0 ${TYPE_COLORS[ev.type]}`} />
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{ev.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_BG[ev.type]} capitalize shrink-0`}>
                              {ev.type}
                            </span>
                          </div>
                          {(ev.startTime || ev.endTime) && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</p>
                          )}
                          {targetUser && <p className="text-xs text-muted-foreground mt-0.5">{targetUser.name}</p>}
                          {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                          {ev.notes && <p className="text-xs italic text-muted-foreground/80 mt-1">{ev.notes}</p>}
                        </div>
                        {isTeacher && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0 mt-1"><path d="m9 18 6-6-6-6"/></svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TIMELINE VIEW ─────────────────────────────────────────────── */}
        {view === "timeline" && (
          <TimelineView events={visibleEvents} milestones={milestones} t={t} />
        )}

      </main>

      {showDayModal && !showForm && (
        <DayDetailModal
          date={selectedDay}
          events={dayEvents}
          milestones={milestonesByDate[selectedDay] ?? []}
          isTeacher={isTeacher}
          activeDates={activeDates}
          todayYMD={todayYMD}
          users={users}
          totalSlots={totalSlotsByDate[selectedDay] ?? 0}
          freeSlots={slotsByDate[selectedDay] ?? 0}
          t={t}
          onClose={() => setShowDayModal(false)}
          onAddEvent={() => { setEditingEvent(null); setShowDayModal(false); setShowForm(true); }}
          onEditEvent={(ev) => { setEditingEvent(ev); setShowDayModal(false); setShowForm(true); }}
        />
      )}

      {showForm && (
        <EventForm
          date={selectedDay}
          classId={defaultClassId}
          classes={allTeacherClasses.map((c) => ({ id: c.id, name: c.name }))}
          students={teacherStudents}
          parents={teacherParents}
          initial={editingEvent ?? undefined}
          t={t}
          onSave={handleSaveEvent}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          onDelete={editingEvent ? () => { removeEvent(editingEvent.id); setShowForm(false); setEditingEvent(null); } : undefined}
        />
      )}
    </>
  );
}
