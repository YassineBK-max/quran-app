"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { CalendarEvent } from "@/lib/types";
import { useT } from "@/hooks/useT";

const TYPE_ICONS: Record<CalendarEvent["type"], string> = {
  session:  "📚",
  meeting:  "🤝",
  deadline: "⏰",
  goal:     "🎯",
};

const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  session:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  meeting:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  deadline: "bg-red-500/10 text-red-600 border-red-500/20",
  goal:     "bg-primary/10 text-primary border-primary/20",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const { myClass, getTeacherClasses } = useClassroom();
  const { getEventsForClass, getEventsForUser, addEvent, removeEvent } = useCalendar();
  const t = useT();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("session");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

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

  const EVENT_TYPES: { type: CalendarEvent["type"]; label: string }[] = [
    { type: "session",  label: t.calendar_session },
    { type: "meeting",  label: t.calendar_meeting },
    { type: "deadline", label: t.calendar_deadline },
    { type: "goal",     label: t.calendar_goal },
  ];

  const isTeacher = user.role === "teacher" || user.role === "admin";
  const teacherClasses = isTeacher ? getTeacherClasses() : [];
  const activeClassId = selectedClassId || (teacherClasses[0]?.id ?? myClass?.id ?? "");

  const events = isTeacher
    ? getEventsForClass(activeClassId)
    : getEventsForUser();

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] ?? []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  const handleAdd = () => {
    if (!title.trim() || !date || !activeClassId) return;
    if (type === "session" && (!startTime || !endTime)) return;
    addEvent(activeClassId, {
      title: title.trim(),
      type,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      notes: notes || undefined,
      description: desc || undefined,
    });
    setTitle(""); setDate(""); setStartTime(""); setEndTime(""); setDesc(""); setNotes("");
  };

  return (
    <>
      <Header title={t.calendar_title} />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {isTeacher && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">{t.calendar_add_event}</h2>

            {teacherClasses.length > 1 && (
              <select
                value={activeClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calendar_event_title}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t.calendar_description}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />

            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(({ type: et, label }) => (
                <button
                  key={et}
                  onClick={() => setType(et)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    type === et ? TYPE_COLORS[et] : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <span>{TYPE_ICONS[et]}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            {type === "session" && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">{t.calendar_start_time}</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">{t.calendar_end_time}</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {type === "session" && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.calendar_notes}
                rows={2}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            )}

            <button
              onClick={handleAdd}
              disabled={!title.trim() || !date || (type === "session" && (!startTime || !endTime))}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
            >
              {t.calendar_add_btn}
            </button>
          </div>
        )}

        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {isTeacher ? t.calendar_empty_teacher : t.calendar_empty_student}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map((d) => (
              <div key={d}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div className="space-y-2">
                  {grouped[d].map((event) => (
                    <div key={event.id} className={`rounded-xl border p-3 flex items-start gap-3 ${TYPE_COLORS[event.type]}`}>
                      <span className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[event.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{event.title}</p>
                          <span className="text-[10px] capitalize opacity-70 border border-current/30 px-1.5 py-0.5 rounded">
                            {EVENT_TYPES.find((et) => et.type === event.type)?.label ?? event.type}
                          </span>
                        </div>
                        {(event.startTime || event.time) && (
                          <p className="text-xs opacity-70 mt-0.5">
                            🕐 {event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : event.time}
                          </p>
                        )}
                        {event.description && <p className="text-xs opacity-70 mt-1">{event.description}</p>}
                        {event.notes && (
                          <div className="mt-1.5 pt-1.5 border-t border-current/20">
                            <p className="text-xs opacity-80 italic">{event.notes}</p>
                          </div>
                        )}
                      </div>
                      {isTeacher && (
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="opacity-50 hover:opacity-100 transition-opacity shrink-0 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
