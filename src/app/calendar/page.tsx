"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCalendar } from "@/contexts/CalendarContext";
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

const TYPE_ICONS: Record<CalendarEvent["type"], string> = {
  session:  "📚",
  meeting:  "🤝",
  deadline: "⏰",
  goal:     "🎯",
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

// ─── Add/Edit Event Modal ──────────────────────────────────────────────────────

interface EventFormProps {
  date: string;
  classId: string;
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
  initial?: CalendarEvent;
  canAssignPerson: boolean;
  t: Record<string, string>;
  onSave: (ev: Omit<CalendarEvent, "id" | "classId" | "createdAt">, classId: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function EventForm({ date, classId, classes, students, initial, canAssignPerson, t, onSave, onCancel, onDelete }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<CalendarEvent["type"]>(initial?.type ?? "session");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [targetType, setTargetType] = useState<"class" | "user">(initial?.targetType ?? "class");
  const [targetUserId, setTargetUserId] = useState(initial?.targetUserId ?? "");
  const [selectedClass, setSelectedClass] = useState(initial?.classId ?? classId ?? classes[0]?.id ?? "");

  const EVENT_TYPES: { type: CalendarEvent["type"]; label: string }[] = [
    { type: "session",  label: t.calendar_session },
    { type: "deadline", label: t.calendar_deadline },
    { type: "meeting",  label: t.calendar_meeting },
    { type: "goal",     label: t.calendar_goal },
  ];

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      notes: notes || undefined,
      description: desc || undefined,
      targetType,
      targetUserId: targetType === "user" ? targetUserId : undefined,
    }, selectedClass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-sm">{initial ? t.calendar_edit_event : t.calendar_add_event}</h2>
            <p className="text-xs text-muted-foreground">
              {parseDateLabel(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calendar_event_title}
              autoFocus
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(({ type: et, label }) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => setType(et)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    type === et ? TYPE_BG[et] + " border-current/30" : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <span>{TYPE_ICONS[et]}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
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

          {/* Assign to */}
          {canAssignPerson && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_assign_to}</label>
              <div className="flex gap-2 mb-2">
                {(["class", "user"] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTargetType(tt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                      targetType === tt ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {tt === "class" ? t.calendar_class : t.calendar_person}
                  </button>
                ))}
              </div>
              {targetType === "class" && classes.length > 1 && (
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {targetType === "user" && (
                <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm">
                  <option value="">{t.calendar_select_person}</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_description}</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.calendar_description}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t.calendar_notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.calendar_notes} rows={2}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2 shrink-0">
          {onDelete && (
            <button onClick={onDelete} className="py-3 px-4 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 text-sm font-medium transition-colors min-h-[48px]">
              Delete
            </button>
          )}
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm transition-colors min-h-[48px]">
            {t.assignment_cancel}
          </button>
          <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-colors min-h-[48px]">
            {t.calendar_add_btn}
          </button>
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
  const t = useT();
  const router = useRouter();

  const today = new Date();
  const todayYMD = toYMD(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(todayYMD);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const allTeacherClasses = useMemo(() => isTeacher ? getTeacherClasses() : [], [isTeacher, getTeacherClasses]);
  const defaultClassId = allTeacherClasses[0]?.id ?? "";

  const teacherStudents = useMemo(() => {
    if (!isTeacher) return [];
    const studentIds = allTeacherClasses.flatMap((c) => c.studentIds);
    return users.filter((u) => studentIds.includes(u.id)).map((u) => ({ id: u.id, name: u.name }));
  }, [isTeacher, allTeacherClasses, users]);

  const visibleEvents = useMemo(() => {
    if (isTeacher) {
      const classIds = allTeacherClasses.map((c) => c.id);
      return events.filter((e) => classIds.includes(e.classId));
    }
    return getEventsForUser();
  }, [isTeacher, allTeacherClasses, events, getEventsForUser]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of visibleEvents) {
      (map[ev.date] = map[ev.date] ?? []).push(ev);
    }
    return map;
  }, [visibleEvents]);

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

  const teacherClasses = allTeacherClasses;

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const dayEvents = eventsByDate[selectedDay] ?? [];
  const selectedDate = parseDateLabel(selectedDay);

  const handleSaveEvent = (ev: Omit<CalendarEvent, "id" | "classId" | "createdAt">, classId: string) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, { ...ev, classId });
    } else {
      addEvent(classId || defaultClassId, ev);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <>
      <Header title={t.calendar_title} />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(todayYMD); }}
            className="flex flex-col items-center"
          >
            <span className="text-lg font-bold">{MONTH_NAMES[month]} {year}</span>
            <span className="text-xs text-primary font-medium -mt-0.5">{t.calendar_today}</span>
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden" dir="ltr">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2.5">{d}</div>
            ))}
          </div>

          {/* Day cells */}
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
              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDay(ymd)}
                  className={`aspect-square sm:aspect-auto sm:h-16 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors border-b border-r border-border/50 last:border-r-0 relative ${
                    isLastRow ? "border-b-0" : ""
                  } ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}
                >
                  <span className={`text-xs sm:text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground font-bold" : isSelected ? "text-primary font-bold" : "text-foreground"
                  }`}>
                    {day}
                  </span>
                  {/* Event dots */}
                  <div className="flex gap-0.5 flex-wrap justify-center px-1">
                    {dayEvs.slice(0, 3).map((ev) => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type]}`} />
                    ))}
                    {dayEvs.length > 3 && <span className="text-[8px] text-muted-foreground leading-none">+{dayEvs.length - 3}</span>}
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
              {selectedDay === todayYMD && (
                <p className="text-xs text-primary font-medium">{t.calendar_today}</p>
              )}
            </div>
            {isTeacher && (
              <button
                onClick={() => { setEditingEvent(null); setShowForm(true); }}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                aria-label={t.calendar_add_event}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            )}
          </div>

          {dayEvents.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <p className="text-2xl mb-2">📅</p>
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
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 px-4 py-3"
                    onClick={() => isTeacher && (setEditingEvent(ev), setShowForm(true))}
                    role={isTeacher ? "button" : undefined}
                    tabIndex={isTeacher ? 0 : undefined}
                    style={{ cursor: isTeacher ? "pointer" : "default" }}
                  >
                    {/* Color stripe */}
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${TYPE_COLORS[ev.type]}`} />
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{ev.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_BG[ev.type]} capitalize shrink-0`}>
                          {TYPE_ICONS[ev.type]} {ev.type}
                        </span>
                      </div>
                      {(ev.startTime || ev.endTime) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}
                        </p>
                      )}
                      {targetUser && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          👤 {targetUser.name}
                        </p>
                      )}
                      {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                      {ev.notes && <p className="text-xs italic text-muted-foreground/80 mt-1">{ev.notes}</p>}
                    </div>
                    {isTeacher && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0 mt-1">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit modal */}
      {showForm && (
        <EventForm
          date={selectedDay}
          classId={defaultClassId}
          classes={teacherClasses.map((c) => ({ id: c.id, name: c.name }))}
          students={teacherStudents}
          initial={editingEvent ?? undefined}
          canAssignPerson={isTeacher && teacherStudents.length > 0}
          t={t as Record<string, string>}
          onSave={handleSaveEvent}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          onDelete={editingEvent ? () => { removeEvent(editingEvent.id); setShowForm(false); setEditingEvent(null); } : undefined}
        />
      )}
    </>
  );
}
