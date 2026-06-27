"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { CalendarEvent } from "@/lib/types";

const EVENT_TYPES: { type: CalendarEvent["type"]; label: string; colors: string }[] = [
  { type: "session",  label: "Session",  colors: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { type: "meeting",  label: "Meeting",  colors: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { type: "deadline", label: "Deadline", colors: "bg-red-500/10 text-red-600 border-red-500/20" },
  { type: "goal",     label: "Goal",     colors: "bg-primary/10 text-primary border-primary/20" },
];

const TYPE_COLORS: Record<CalendarEvent["type"], string> = Object.fromEntries(
  EVENT_TYPES.map((e) => [e.type, e.colors])
) as Record<CalendarEvent["type"], string>;

const TYPE_ICONS: Record<CalendarEvent["type"], string> = {
  session:  "📚",
  meeting:  "🤝",
  deadline: "⏰",
  goal:     "🎯",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const { myClass, getTeacherClasses } = useClassroom();
  const { getEventsForClass, getEventsForUser, addEvent, removeEvent } = useCalendar();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("session");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  if (!user) {
    return (
      <>
        <Header title="Calendar" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to access the calendar.</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Sign In</button>
        </main>
      </>
    );
  }

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
    addEvent(activeClassId, { title: title.trim(), type, date, time: time || undefined, description: desc || undefined });
    setTitle(""); setDate(""); setTime(""); setDesc("");
  };

  return (
    <>
      <Header title="Calendar" />
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Teacher: class selector + add form */}
        {isTeacher && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">Add Event</h2>

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
              placeholder="Event title"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
            />

            {/* Event type selector */}
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(({ type: t, label, colors }) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    type === t ? colors : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <span>{TYPE_ICONS[t]}</span>
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
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-28 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!title.trim() || !date}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
            >
              Add Event
            </button>
          </div>
        )}

        {/* Events list */}
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {isTeacher ? "No events yet. Add one above." : "No events scheduled yet."}
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
                            {event.type}
                          </span>
                        </div>
                        {event.time && <p className="text-xs opacity-70 mt-0.5">{event.time}</p>}
                        {event.description && <p className="text-xs opacity-70 mt-1">{event.description}</p>}
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
