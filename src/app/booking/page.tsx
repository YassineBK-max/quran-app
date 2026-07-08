"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { isSupabaseReady } from "@/lib/supabase";
import { AvailabilitySlot, CreateSlotInput } from "@/lib/booking";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(ymd: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(ymd + "T12:00:00").toLocaleDateString("en-US", opts ?? {
    weekday: "long", month: "long", day: "numeric",
  });
}

function fmtShortDate(ymd: string) {
  return new Date(ymd + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

type DotStyle = "gold" | "green" | "gray";

function CalendarGrid({
  year, month, selectedDay, todayYMD,
  dotsByDate,
  onSelectDay, onPrevMonth, onNextMonth, onTodayClick,
}: {
  year: number; month: number; selectedDay: string; todayYMD: string;
  dotsByDate: Record<string, DotStyle[]>;
  onSelectDay: (ymd: string) => void;
  onPrevMonth: () => void; onNextMonth: () => void; onTodayClick: () => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="p-2 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button onClick={onTodayClick} className="flex flex-col items-center">
          <span className="text-base font-bold">{MONTH_NAMES[month]} {year}</span>
          <span className="text-[11px] text-primary font-medium -mt-0.5">Today</span>
        </button>
        <button
          onClick={onNextMonth}
          aria-label="Next month"
          className="p-2 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border" dir="ltr">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7" dir="ltr">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e${i}`} className="aspect-square sm:aspect-auto sm:h-14 border-b border-r border-border/50 last:border-r-0" />;
          }
          const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = ymd === todayYMD;
          const isSelected = ymd === selectedDay;
          const isLastRow = i >= cells.length - 7;
          const dots = dotsByDate[ymd] ?? [];
          return (
            <button
              key={ymd}
              onClick={() => onSelectDay(ymd)}
              className={`aspect-square sm:aspect-auto sm:h-14 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors border-b border-r border-border/50 last:border-r-0 ${
                isLastRow ? "border-b-0" : ""
              } ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}
            >
              <span className={`text-xs sm:text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                isToday
                  ? "bg-primary text-primary-foreground font-bold"
                  : isSelected
                  ? "text-primary font-bold"
                  : "text-foreground"
              }`}>
                {day}
              </span>
              <div className="flex gap-0.5 justify-center">
                {dots.slice(0, 3).map((dot, di) => (
                  <span
                    key={di}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: dot === "gold" ? "var(--gold)" : dot === "green" ? "var(--primary)" : "var(--muted-foreground)" }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Slot Modal (Teacher) ─────────────────────────────────────────────────

function AddSlotModal({
  defaultDate,
  teacherId,
  teacherName,
  classes,
  onSave,
  onCancel,
}: {
  defaultDate: string;
  teacherId: string;
  teacherName: string;
  classes: { id: string; name: string }[];
  onSave: (input: CreateSlotInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("Study Session");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [maxBookings, setMaxBookings] = useState(1);
  const [notes, setNotes] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!title.trim() || !date || !startTime || !endTime) {
      setErr("Title, date, start and end time are required.");
      return;
    }
    if (startTime >= endTime) {
      setErr("End time must be after start time.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onSave({
        teacher_id: teacherId,
        teacher_name: teacherName,
        class_id: classId || null,
        class_name: classes.find((c) => c.id === classId)?.name ?? null,
        date,
        start_time: startTime,
        end_time: endTime,
        title: title.trim(),
        notes: notes.trim() || null,
        max_bookings: maxBookings,
      });
      onCancel();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-bold text-sm">Add Availability Slot</h2>
          <button onClick={onCancel} aria-label="Close" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">End time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Max bookings <span className="text-muted-foreground/60 font-normal">(how many students can book this slot)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMaxBookings((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-lg font-medium"
                aria-label="Decrease"
              >−</button>
              <span className="w-8 text-center font-bold text-base">{maxBookings}</span>
              <button
                type="button"
                onClick={() => setMaxBookings((n) => Math.min(20, n + 1))}
                className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-lg font-medium"
                aria-label="Increase"
              >+</button>
            </div>
          </div>

          {classes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Class (optional)</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">No class (open to all students)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring your Quran, chapter 2 focus..."
              rows={2}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {err && <p className="text-red-500 text-xs">{err}</p>}
        </div>

        <div className="p-4 border-t border-border flex gap-2 shrink-0">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm min-h-[48px]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-colors min-h-[48px]"
          >
            {saving ? "Saving…" : "Save slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Detail Sheet (Teacher) ──────────────────────────────────────────────

function SlotDetailSheet({
  slot,
  bookings,
  onDelete,
  onClose,
}: {
  slot: AvailabilitySlot;
  bookings: { id: string; student_name: string; created_at: string }[];
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try { await onDelete(); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-bold text-sm">{slot.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDate(slot.date, { weekday: "short", month: "short", day: "numeric" })} · {slot.start_time}–{slot.end_time}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-muted-foreground hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Bookings:</span>
            <span className="text-xs font-bold" style={{ color: bookings.length >= slot.max_bookings ? "var(--gold)" : "var(--primary)" }}>
              {bookings.length} / {slot.max_bookings}
            </span>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {b.student_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{b.student_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Booked {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slot.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground italic">{slot.notes}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 rounded-xl font-medium text-sm min-h-[48px] transition-colors disabled:opacity-40"
            style={{ background: confirm ? "rgb(239,68,68)" : "rgba(239,68,68,0.1)", color: confirm ? "#fff" : "rgb(239,68,68)" }}
          >
            {deleting ? "Deleting…" : confirm ? "Confirm delete" : "Delete slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Supabase Setup Required ──────────────────────────────────────────────────

function SetupRequired() {
  return (
    <>
      <Header title="Booking" />
      <main className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-3xl">🗓️</p>
          <h2 className="font-bold text-lg">Supabase required</h2>
          <p className="text-sm text-muted-foreground">
            The booking system stores availability slots and student bookings in Supabase.
            Add your credentials to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.local</code> to enable it.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-xs font-mono text-muted-foreground">
          <p className="font-semibold text-foreground text-sm">1. Add to .env.local</p>
          <pre className="bg-muted rounded-lg p-3 overflow-x-auto leading-relaxed">{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}</pre>
          <p className="font-semibold text-foreground text-sm pt-1">2. Run in Supabase SQL Editor</p>
          <pre className="bg-muted rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{`create table availability_slots (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   text not null,
  teacher_name text not null,
  class_id     text, class_name text,
  date         text not null,
  start_time   text not null,
  end_time     text not null,
  title        text not null default 'Study Session',
  notes        text,
  max_bookings smallint not null default 1,
  created_at   timestamptz not null default now()
);
create table bookings (
  id           uuid primary key default gen_random_uuid(),
  slot_id      uuid not null references availability_slots(id) on delete cascade,
  student_id   text not null,
  student_name text not null,
  status       text not null default 'confirmed'
               check (status in ('confirmed','cancelled')),
  notes        text,
  created_at   timestamptz not null default now(),
  unique (slot_id, student_id)
);
alter table availability_slots enable row level security;
alter table bookings enable row level security;
create policy "all_slots"    on availability_slots for all using (true) with check (true);
create policy "all_bookings" on bookings           for all using (true) with check (true);
alter publication supabase_realtime add table availability_slots;
alter publication supabase_realtime add table bookings;`}</pre>
        </div>
      </main>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { user } = useAuth();
  const { getTeacherClasses } = useClassroom();
  const {
    loading, addSlot, deleteSlot, bookSlot, cancelBooking,
    getSlotBookings, getMyBookings, getMySlots, getAvailableSlots,
    slotBookingCount, myBookingForSlot,
  } = useBooking();
  const router = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayYMD = useMemo(() => toYMD(new Date()), []);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(todayYMD);
  const [tab, setTab] = useState<"calendar" | "list">("calendar");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailSlot, setDetailSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingError, setBookingError] = useState<Record<string, string>>({});
  const [bookingLoading, setBookingLoading] = useState<Record<string, boolean>>({});

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const isStudent = user?.role === "student";

  // Data
  const mySlots = useMemo(() => getMySlots(), [getMySlots]);
  const availableSlots = useMemo(() => getAvailableSlots(), [getAvailableSlots]);
  const myBookings = useMemo(() => getMyBookings(), [getMyBookings]);
  const teacherClasses = useMemo(() => isTeacher ? getTeacherClasses().map((c) => ({ id: c.id, name: c.name })) : [], [isTeacher, getTeacherClasses]);

  // Calendar dots
  const dotsByDate = useMemo(() => {
    const map: Record<string, DotStyle[]> = {};
    if (isTeacher) {
      for (const s of mySlots) {
        const count = slotBookingCount(s.id);
        const dot: DotStyle = count >= s.max_bookings ? "gray" : count > 0 ? "gold" : "green";
        (map[s.date] = map[s.date] ?? []).push(dot);
      }
    } else {
      for (const s of availableSlots) {
        (map[s.date] = map[s.date] ?? []).push("green");
      }
      for (const b of myBookings.filter((b) => b.status === "confirmed")) {
        const date = b.slot?.date;
        if (date) (map[date] = map[date] ?? []).push("gold");
      }
    }
    return map;
  }, [isTeacher, mySlots, availableSlots, myBookings, slotBookingCount]);

  // Slots for selected day
  const slotsForDay = useMemo(() => {
    if (isTeacher) return mySlots.filter((s) => s.date === selectedDay);
    return availableSlots.filter((s) => s.date === selectedDay);
  }, [isTeacher, mySlots, availableSlots, selectedDay]);

  const myBookingsForDay = useMemo(
    () => myBookings.filter((b) => b.slot?.date === selectedDay && b.status === "confirmed"),
    [myBookings, selectedDay]
  );

  // Sorted lists for "list" tab
  const upcomingBookings = useMemo(
    () => myBookings
      .filter((b) => b.status === "confirmed" && (b.slot?.date ?? "") >= todayYMD)
      .sort((a, b) => (a.slot?.date ?? "").localeCompare(b.slot?.date ?? "")),
    [myBookings, todayYMD]
  );
  const pastBookings = useMemo(
    () => myBookings
      .filter((b) => b.status === "confirmed" && (b.slot?.date ?? "") < todayYMD)
      .sort((a, b) => (b.slot?.date ?? "").localeCompare(a.slot?.date ?? "")),
    [myBookings, todayYMD]
  );
  const allReceivedBookings = useMemo(() => {
    if (!isTeacher) return [];
    return mySlots.flatMap((s) => {
      const bs = getSlotBookings(s.id);
      return bs.map((b) => ({ ...b, slot: s }));
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [isTeacher, mySlots, getSlotBookings]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
  }, [month]);
  const goToday = useCallback(() => {
    const [y, m] = todayYMD.split("-").map(Number);
    setYear(y); setMonth(m - 1); setSelectedDay(todayYMD);
  }, [todayYMD]);

  const handleBook = useCallback(async (slotId: string) => {
    setBookingError((e) => ({ ...e, [slotId]: "" }));
    setBookingLoading((l) => ({ ...l, [slotId]: true }));
    try {
      await bookSlot(slotId);
    } catch (e) {
      setBookingError((prev) => ({ ...prev, [slotId]: e instanceof Error ? e.message : "Failed to book" }));
    } finally {
      setBookingLoading((l) => ({ ...l, [slotId]: false }));
    }
  }, [bookSlot]);

  const handleCancel = useCallback(async (bookingId: string) => {
    await cancelBooking(bookingId);
  }, [cancelBooking]);

  if (!isSupabaseReady) return <SetupRequired />;

  if (!user) {
    return (
      <>
        <Header title="Booking" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to view booking options.</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Sign in</button>
        </main>
      </>
    );
  }

  if (!isTeacher && !isStudent) {
    return (
      <>
        <Header title="Booking" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p className="text-3xl mb-3">🗓️</p>
          <p>Booking is available for teachers and students.</p>
        </main>
      </>
    );
  }

  const title = isTeacher ? "Availability" : "Book a Session";
  const tabs = isTeacher
    ? [{ id: "calendar", label: "My Slots" }, { id: "list", label: "Received Bookings" }]
    : [{ id: "calendar", label: "Available" }, { id: "list", label: "My Bookings" }];

  return (
    <>
      <Header title={title} />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-28">

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "calendar" | "list")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "calendar" && (
          <>
            {/* Legend */}
            <div className="flex gap-4 px-1">
              {isTeacher ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Open
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--gold)" }} /> Partial
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" /> Full
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--gold)" }} /> Booked by you
                  </span>
                </>
              )}
            </div>

            {/* Calendar */}
            <CalendarGrid
              year={year} month={month}
              selectedDay={selectedDay} todayYMD={todayYMD}
              dotsByDate={dotsByDate}
              onSelectDay={setSelectedDay}
              onPrevMonth={prevMonth} onNextMonth={nextMonth} onTodayClick={goToday}
            />

            {/* Day panel */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <p className="font-semibold text-sm">{fmtDate(selectedDay)}</p>
                  {selectedDay === todayYMD && <p className="text-xs text-primary font-medium">Today</p>}
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    aria-label="Add slot"
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                )}
              </div>

              {/* Teacher slots for day */}
              {isTeacher && (
                <>
                  {slotsForDay.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      <p className="text-2xl mb-2">🗓️</p>
                      <p>No slots on this day.</p>
                      <button onClick={() => setShowAddModal(true)} className="mt-3 text-primary text-xs font-medium hover:underline">
                        + Add a slot
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {slotsForDay.map((slot) => {
                        const count = slotBookingCount(slot.id);
                        const full = count >= slot.max_bookings;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setDetailSlot(slot)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                          >
                            <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                              style={{ background: full ? "var(--muted-foreground)" : count > 0 ? "var(--gold)" : "var(--primary)" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{slot.title}</p>
                              <p className="text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                              {slot.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{slot.notes}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold" style={{ color: full ? "var(--muted-foreground)" : count > 0 ? "var(--gold)" : "var(--primary)" }}>
                                {count}/{slot.max_bookings}
                              </p>
                              <p className="text-[10px] text-muted-foreground">booked</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Student slots for day */}
              {isStudent && (
                <>
                  {slotsForDay.length === 0 && myBookingsForDay.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      <p className="text-2xl mb-2">🕐</p>
                      <p>No available sessions on this day.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Available to book */}
                      {slotsForDay.map((slot) => {
                        const booked = !!myBookingForSlot(slot.id);
                        const count = slotBookingCount(slot.id);
                        const spotsLeft = slot.max_bookings - count;
                        const isLoading = bookingLoading[slot.id];
                        const err = bookingError[slot.id];
                        return (
                          <div key={slot.id} className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5 bg-primary" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold">{slot.title}</p>
                                    <p className="text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                                    <p className="text-xs text-muted-foreground">{slot.teacher_name}</p>
                                    {slot.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{slot.notes}</p>}
                                    <p className="text-xs font-medium mt-1" style={{ color: "var(--primary)" }}>
                                      {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                                    </p>
                                  </div>
                                  {booked ? (
                                    <span className="text-xs px-2.5 py-1.5 rounded-xl font-medium shrink-0"
                                      style={{ background: "rgba(200,147,42,0.15)", color: "var(--gold)" }}>
                                      ✓ Booked
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleBook(slot.id)}
                                      disabled={isLoading}
                                      className="text-xs px-3 py-2 rounded-xl font-semibold shrink-0 bg-primary text-primary-foreground disabled:opacity-50 min-h-[36px] min-w-[64px]"
                                    >
                                      {isLoading ? "…" : "Book"}
                                    </button>
                                  )}
                                </div>
                                {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Already booked by student for this day */}
                      {myBookingsForDay.map((b) => {
                        const alreadyShown = slotsForDay.some((s) => s.id === b.slot_id);
                        if (alreadyShown) return null;
                        return (
                          <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                            <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: "var(--gold)" }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{b.slot?.title ?? "Session"}</p>
                                  <p className="text-xs text-muted-foreground">{b.slot?.start_time} – {b.slot?.end_time}</p>
                                  <p className="text-xs text-muted-foreground">{b.slot?.teacher_name}</p>
                                </div>
                                <button
                                  onClick={() => handleCancel(b.id)}
                                  className="text-xs px-2.5 py-1.5 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors font-medium shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick upcoming summary */}
            {isStudent && upcomingBookings.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-3">Upcoming Bookings</h3>
                <div className="space-y-2">
                  {upcomingBookings.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{b.slot?.title ?? "Session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.slot?.date ? fmtShortDate(b.slot.date) : ""} · {b.slot?.start_time}–{b.slot?.end_time}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-xs text-red-500 hover:underline shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                  {upcomingBookings.length > 3 && (
                    <button onClick={() => setTab("list")} className="text-xs text-primary font-medium hover:underline">
                      See all {upcomingBookings.length} bookings →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LIST TAB ─── */}
        {tab === "list" && (
          <>
            {/* Teacher: received bookings */}
            {isTeacher && (
              <>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : allReceivedBookings.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    <p className="text-3xl mb-3">📭</p>
                    <p>No bookings received yet.</p>
                    <button onClick={() => setTab("calendar")} className="mt-3 text-primary text-xs font-medium hover:underline">
                      Add availability slots →
                    </button>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-sm">All Bookings</p>
                      <p className="text-xs text-muted-foreground">{allReceivedBookings.length} total</p>
                    </div>
                    <div className="divide-y divide-border">
                      {allReceivedBookings.map((b) => (
                        <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {b.student_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{b.student_name}</p>
                            <p className="text-xs text-muted-foreground">{b.slot.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtShortDate(b.slot.date)} · {b.slot.start_time}–{b.slot.end_time}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium shrink-0">
                            ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Student: my bookings */}
            {isStudent && (
              <>
                {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    <p className="text-3xl mb-3">📅</p>
                    <p>No bookings yet.</p>
                    <button onClick={() => setTab("calendar")} className="mt-3 text-primary text-xs font-medium hover:underline">
                      Browse available sessions →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.length > 0 && (
                      <section>
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Upcoming</h2>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                          {upcomingBookings.map((b) => (
                            <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                              <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: "var(--gold)" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{b.slot?.title ?? "Session"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {b.slot?.date ? fmtDate(b.slot.date, { weekday: "short", month: "short", day: "numeric" }) : ""} · {b.slot?.start_time}–{b.slot?.end_time}
                                </p>
                                <p className="text-xs text-muted-foreground">{b.slot?.teacher_name}</p>
                              </div>
                              <button
                                onClick={() => handleCancel(b.id)}
                                className="text-xs text-red-500 hover:underline shrink-0 mt-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {pastBookings.length > 0 && (
                      <section>
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Past</h2>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                          {pastBookings.map((b) => (
                            <div key={b.id} className="flex items-start gap-3 px-4 py-3 opacity-70">
                              <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5 bg-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{b.slot?.title ?? "Session"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {b.slot?.date ? fmtShortDate(b.slot.date) : ""} · {b.slot?.start_time}–{b.slot?.end_time}
                                </p>
                                <p className="text-xs text-muted-foreground">{b.slot?.teacher_name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Add slot modal */}
      {showAddModal && user && (
        <AddSlotModal
          defaultDate={selectedDay}
          teacherId={user.id}
          teacherName={user.name}
          classes={teacherClasses}
          onSave={addSlot}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Slot detail sheet */}
      {detailSlot && (
        <SlotDetailSheet
          slot={detailSlot}
          bookings={getSlotBookings(detailSlot.id)}
          onDelete={async () => {
            await deleteSlot(detailSlot.id);
            setDetailSlot(null);
          }}
          onClose={() => setDetailSlot(null)}
        />
      )}
    </>
  );
}
