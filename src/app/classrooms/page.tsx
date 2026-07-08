"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroomsDb } from "@/contexts/ClassroomsDbContext";
import { isSupabaseReady } from "@/lib/supabase";
import { DbClassroom, ClassroomEnrollment, Course } from "@/lib/classrooms-db";

// ─── Setup Required ───────────────────────────────────────────────────────────

function SetupRequired() {
  return (
    <>
      <Header title="Classrooms" />
      <main className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-3xl">🏫</p>
          <h2 className="font-bold text-lg">Supabase required</h2>
          <p className="text-sm text-muted-foreground">
            The classrooms system stores courses, classrooms, and enrollments in Supabase.
            Add your credentials to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.local</code>, then run the SQL below.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-xs font-mono">
          <p className="font-semibold text-sm text-foreground">SQL Editor — run once</p>
          <pre className="bg-muted rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap text-muted-foreground">{`create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  created_by text not null,
  created_at timestamptz not null default now()
);
create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  name text not null,
  teacher_id text not null, teacher_name text not null,
  description text, join_code text unique not null,
  created_at timestamptz not null default now()
);
create table if not exists classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  student_id text not null, student_name text not null,
  student_email text,
  enrolled_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);
alter table courses            enable row level security;
alter table classrooms         enable row level security;
alter table classroom_students enable row level security;
create policy "all_courses"     on courses            for all using (true) with check (true);
create policy "all_rooms"       on classrooms         for all using (true) with check (true);
create policy "all_enrollments" on classroom_students for all using (true) with check (true);
alter publication supabase_realtime add table courses;
alter publication supabase_realtime add table classrooms;
alter publication supabase_realtime add table classroom_students;`}</pre>
        </div>
      </main>
    </>
  );
}

// ─── Create Course Modal ──────────────────────────────────────────────────────

function CreateCourseModal({
  onSave,
  onCancel,
}: {
  onSave: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setErr("");
    try { await onSave(name.trim(), desc.trim()); onCancel(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Create Course" onClose={onCancel}>
      <div className="space-y-4 p-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quran Memorization Level 1"
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description (optional)</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Brief overview of the course…"
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none" />
        </div>
        {err && <p className="text-red-500 text-xs">{err}</p>}
      </div>
      <ModalFooter onCancel={onCancel} onSave={handleSave} saving={saving} disabled={!name.trim()} label="Create course" />
    </Modal>
  );
}

// ─── Create Classroom Modal ───────────────────────────────────────────────────

function CreateClassroomModal({
  courses,
  defaultCourseId,
  onSave,
  onCancel,
}: {
  courses: Course[];
  defaultCourseId?: string;
  onSave: (courseId: string, name: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setErr("");
    try { await onSave(courseId, name.trim(), desc.trim()); onCancel(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Create Classroom" onClose={onCancel}>
      <div className="space-y-4 p-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course (optional)</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm">
            <option value="">No course — standalone classroom</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Classroom name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Group A"
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description (optional)</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes about this classroom…"
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm" />
        </div>
        {err && <p className="text-red-500 text-xs">{err}</p>}
      </div>
      <ModalFooter onCancel={onCancel} onSave={handleSave} saving={saving} disabled={!name.trim()} label="Create classroom" />
    </Modal>
  );
}

// ─── Add Student Modal ────────────────────────────────────────────────────────

function AddStudentModal({
  classroom,
  existingStudentIds,
  allStudents,
  onSave,
  onCancel,
}: {
  classroom: DbClassroom;
  existingStudentIds: Set<string>;
  allStudents: { id: string; name: string; email: string }[];
  onSave: (studentId: string, studentName: string, studentEmail: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const available = useMemo(() =>
    allStudents
      .filter((s) => !existingStudentIds.has(s.id))
      .filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase())),
    [allStudents, existingStudentIds, query]
  );

  const handleAdd = async (s: typeof allStudents[number]) => {
    setSaving(s.id);
    setErr("");
    try { await onSave(s.id, s.name, s.email); onCancel(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(null); }
  };

  return (
    <Modal title={`Add student to ${classroom.name}`} onClose={onCancel}>
      <div className="p-4 space-y-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
          placeholder="Search by name or email…"
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        {err && <p className="text-red-500 text-xs">{err}</p>}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {allStudents.length === 0 ? "No students have signed up yet." : "No matching students."}
            </p>
          ) : available.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/30">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {s.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
              </div>
              <button
                onClick={() => handleAdd(s)}
                disabled={!!saving}
                className="text-xs px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 shrink-0 min-h-[36px]"
              >
                {saving === s.id ? "…" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <button onClick={onCancel} className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm min-h-[48px]">
          Close
        </button>
      </div>
    </Modal>
  );
}

// ─── Classroom Detail Sheet ───────────────────────────────────────────────────

function ClassroomDetailSheet({
  classroom,
  course,
  students,
  canManage,
  onAddStudent,
  onRemoveStudent,
  onDeleteClassroom,
  onClose,
}: {
  classroom: DbClassroom;
  course: Course | undefined;
  students: ClassroomEnrollment[];
  canManage: boolean;
  onAddStudent: () => void;
  onRemoveStudent: (enrollmentId: string) => void;
  onDeleteClassroom: () => void;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base">{classroom.name}</h2>
            {course && <p className="text-xs text-muted-foreground mt-0.5">{course.name}</p>}
            <p className="text-xs text-muted-foreground">{classroom.teacher_name}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Join code */}
        <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl bg-muted/60 shrink-0">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Join Code</p>
            <p className="font-mono font-bold text-xl tracking-widest text-primary">{classroom.join_code}</p>
          </div>
          <button onClick={copyCode}
            className="ml-auto text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors font-medium min-h-[36px]">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <p className="text-sm font-semibold">Students ({students.length})</p>
            {canManage && (
              <button onClick={onAddStudent}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Add student
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <p className="text-2xl mb-2">👥</p>
              <p>No students enrolled yet.</p>
              {canManage && (
                <button onClick={onAddStudent} className="mt-2 text-primary text-xs font-medium hover:underline">
                  Add a student →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border mx-0">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {s.student_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.student_name}</p>
                    {s.student_email && <p className="text-xs text-muted-foreground truncate">{s.student_email}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      Enrolled {new Date(s.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => onRemoveStudent(s.id)}
                      aria-label={`Remove ${s.student_name}`}
                      className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete classroom */}
        {canManage && (
          <div className="p-4 border-t border-border shrink-0">
            <button
              onClick={() => { if (confirmDelete) onDeleteClassroom(); else setConfirmDelete(true); }}
              className="w-full py-3 rounded-xl font-medium text-sm min-h-[48px] transition-colors"
              style={{
                background: confirmDelete ? "rgb(239,68,68)" : "rgba(239,68,68,0.08)",
                color: confirmDelete ? "#fff" : "rgb(239,68,68)",
              }}
            >
              {confirmDelete ? "Confirm — delete classroom" : "Delete classroom"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-bold text-sm">{title}</h2>
          <button onClick={onClose} aria-label="Close"
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
// Re-export ReactNode from react for Modal
import type { ReactNode } from "react";

function ModalFooter({
  onCancel, onSave, saving, disabled, label,
}: {
  onCancel: () => void; onSave: () => void; saving: boolean; disabled: boolean; label: string;
}) {
  return (
    <div className="p-4 border-t border-border flex gap-2 shrink-0">
      <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm min-h-[48px]">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving || disabled}
        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 min-h-[48px]">
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

// ─── Classroom Card (teacher / list view) ─────────────────────────────────────

function ClassroomCard({
  classroom,
  studentCount,
  onClick,
}: {
  classroom: DbClassroom;
  studentCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base font-bold">
        {classroom.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{classroom.name}</p>
        <p className="text-xs text-muted-foreground">
          {studentCount} student{studentCount !== 1 ? "s" : ""} · Code: <span className="font-mono font-bold text-primary">{classroom.join_code}</span>
        </p>
        {classroom.description && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{classroom.description}</p>
        )}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClassroomsPage() {
  const { user, users } = useAuth();
  const {
    courses, classrooms, loading, error,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode,
    getClassroomStudents, getMyClassrooms, getTeacherClassrooms,
    getCourseClassrooms, getStandaloneClassrooms,
  } = useClassroomsDb();
  const router = useRouter();

  // UI state
  const [tab, setTab] = useState<"main" | "create">("main");
  const [selectedRoom, setSelectedRoom] = useState<DbClassroom | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [defaultCourseId, setDefaultCourseId] = useState<string | undefined>();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  // All students (from localStorage users)
  const allStudentUsers = useMemo(
    () => users.filter((u) => u.role === "student").map((u) => ({ id: u.id, name: u.name, email: u.email })),
    [users]
  );

  // For the selected room
  const selectedRoomStudents = useMemo(
    () => selectedRoom ? getClassroomStudents(selectedRoom.id) : [],
    [selectedRoom, getClassroomStudents]
  );

  const selectedRoomCourse = useMemo(
    () => selectedRoom ? courses.find((c) => c.id === selectedRoom.course_id) : undefined,
    [selectedRoom, courses]
  );

  const canManageSelected = useMemo(
    () => !!selectedRoom && (isAdmin || (isTeacher && selectedRoom.teacher_id === user?.id)),
    [selectedRoom, isAdmin, isTeacher, user]
  );

  // Teacher's classrooms (and all if admin)
  const myTeacherClassrooms = useMemo(
    () => isAdmin ? classrooms : isTeacher ? getTeacherClassrooms() : [],
    [isAdmin, isTeacher, classrooms, getTeacherClassrooms]
  );

  // Student's enrolled classrooms
  const myStudentClassrooms = useMemo(
    () => isStudent ? getMyClassrooms() : [],
    [isStudent, getMyClassrooms]
  );

  // Handlers
  const handleCreateCourse = useCallback(async (name: string, description: string) => {
    await createCourse(name, description || undefined);
  }, [createCourse]);

  const handleCreateClassroom = useCallback(async (courseId: string, name: string, description: string) => {
    await createClassroom({ courseId: courseId || undefined, name, description: description || undefined });
  }, [createClassroom]);

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");
    setJoinSuccess("");
    try {
      const room = await joinByCode(joinCode.trim());
      setJoinSuccess(`Joined "${room.name}" successfully!`);
      setJoinCode("");
      setTimeout(() => setJoinSuccess(""), 3000);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }, [joinCode, joinByCode]);

  const handleRemoveStudent = useCallback(async (enrollmentId: string) => {
    if (removeConfirm !== enrollmentId) { setRemoveConfirm(enrollmentId); return; }
    await unenrollStudent(enrollmentId);
    setRemoveConfirm(null);
  }, [removeConfirm, unenrollStudent]);

  const handleDeleteClassroom = useCallback(async () => {
    if (!selectedRoom) return;
    await removeClassroom(selectedRoom.id);
    setSelectedRoom(null);
  }, [selectedRoom, removeClassroom]);

  if (!isSupabaseReady) return <SetupRequired />;

  if (!user) {
    return (
      <>
        <Header title="Classrooms" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to access classrooms.</p>
          <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">
            Sign in
          </button>
        </main>
      </>
    );
  }

  if (!isTeacher && !isStudent) {
    return (
      <>
        <Header title="Classrooms" />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p className="text-3xl mb-3">🏫</p>
          <p>Classrooms are available for teachers and students.</p>
        </main>
      </>
    );
  }

  const standalone = isAdmin ? getStandaloneClassrooms() : isTeacher ? getTeacherClassrooms().filter((c) => !c.course_id) : [];
  const teacherCourses = isAdmin ? courses : courses.filter((c) => {
    if (!isTeacher) return false;
    return classrooms.some((r) => r.course_id === c.id && r.teacher_id === user!.id);
  });

  return (
    <>
      <Header title="Classrooms" />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4">

        {/* Loading / error */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ─── TEACHER / ADMIN VIEW ─────────────────────────────────────── */}
        {isTeacher && !loading && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button
                onClick={() => setTab("main")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${tab === "main" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                My Classrooms
              </button>
              <button
                onClick={() => setTab("create")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${tab === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                + Create
              </button>
            </div>

            {/* Main tab — course-grouped classrooms */}
            {tab === "main" && (
              <>
                {myTeacherClassrooms.length === 0 && teacherCourses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    <p className="text-3xl mb-3">🏫</p>
                    <p>No classrooms yet.</p>
                    <button onClick={() => setTab("create")} className="mt-3 text-primary text-xs font-medium hover:underline">
                      Create your first classroom →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Courses with their classrooms */}
                    {teacherCourses.map((course) => {
                      const courseRooms = isAdmin
                        ? getCourseClassrooms(course.id)
                        : getCourseClassrooms(course.id).filter((r) => r.teacher_id === user!.id);
                      if (courseRooms.length === 0 && !isAdmin) return null;
                      return (
                        <section key={course.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                          <div className="flex items-start justify-between px-4 py-3 border-b border-border">
                            <div>
                              <h2 className="font-semibold text-sm">{course.name}</h2>
                              {course.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => { setDefaultCourseId(course.id); setShowRoomModal(true); }}
                                className="text-xs text-primary font-medium hover:underline"
                              >
                                + Classroom
                              </button>
                              {isAdmin && (
                                <button onClick={() => removeCourse(course.id)}
                                  className="text-xs text-red-500 hover:underline">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            {courseRooms.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">No classrooms in this course.</p>
                            ) : courseRooms.map((room) => (
                              <ClassroomCard
                                key={room.id}
                                classroom={room}
                                studentCount={getClassroomStudents(room.id).length}
                                onClick={() => setSelectedRoom(room)}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    })}

                    {/* Standalone classrooms (no course) */}
                    {standalone.length > 0 && (
                      <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                          <h2 className="font-semibold text-sm text-muted-foreground">Standalone Classrooms</h2>
                        </div>
                        <div className="p-3 space-y-2">
                          {standalone.map((room) => (
                            <ClassroomCard
                              key={room.id}
                              classroom={room}
                              studentCount={getClassroomStudents(room.id).length}
                              onClick={() => setSelectedRoom(room)}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Create tab */}
            {tab === "create" && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">📚</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">Create a Course</p>
                    <p className="text-xs text-muted-foreground">A course groups related classrooms (e.g. &ldquo;Quran Memorization Level 2&rdquo;)</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                </button>

                <button
                  onClick={() => { setDefaultCourseId(undefined); setShowRoomModal(true); }}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">🏫</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">Create a Classroom</p>
                    <p className="text-xs text-muted-foreground">A classroom has one teacher and a list of enrolled students</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── STUDENT VIEW ──────────────────────────────────────────────── */}
        {isStudent && !loading && (
          <div className="space-y-4">
            {/* Join classroom */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold">Join a Classroom</h2>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); setJoinSuccess(""); }}
                  placeholder="Enter join code (e.g. AB12CD)"
                  maxLength={6}
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6 || joining}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 min-h-[44px]"
                >
                  {joining ? "…" : "Join"}
                </button>
              </div>
              {joinError && <p className="text-red-500 text-xs">{joinError}</p>}
              {joinSuccess && <p className="text-primary text-xs font-medium">✓ {joinSuccess}</p>}
            </div>

            {/* Enrolled classrooms */}
            {myStudentClassrooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p className="text-3xl mb-3">🎓</p>
                <p>You haven&apos;t joined any classrooms yet.</p>
                <p className="text-xs mt-1">Enter a join code from your teacher above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  My Classrooms ({myStudentClassrooms.length})
                </h2>
                {myStudentClassrooms.map((room) => {
                  const course = courses.find((c) => c.id === room.course_id);
                  const students = getClassroomStudents(room.id);
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold shrink-0">
                          {room.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{room.name}</p>
                          {course && <p className="text-xs text-muted-foreground">{course.name}</p>}
                          <p className="text-xs text-muted-foreground">
                            Teacher: {room.teacher_name} · {students.length} student{students.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1"><path d="m9 18 6-6-6-6"/></svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showCourseModal && (
        <CreateCourseModal onSave={handleCreateCourse} onCancel={() => setShowCourseModal(false)} />
      )}
      {showRoomModal && (
        <CreateClassroomModal
          courses={isAdmin ? courses : courses.filter((c) => classrooms.some((r) => r.course_id === c.id && r.teacher_id === user?.id) || true)}
          defaultCourseId={defaultCourseId}
          onSave={handleCreateClassroom}
          onCancel={() => setShowRoomModal(false)}
        />
      )}
      {showAddStudentModal && selectedRoom && (
        <AddStudentModal
          classroom={selectedRoom}
          existingStudentIds={new Set(selectedRoomStudents.map((s) => s.student_id))}
          allStudents={allStudentUsers}
          onSave={(id, name, email) => enrollStudent(selectedRoom.id, id, name, email)}
          onCancel={() => setShowAddStudentModal(false)}
        />
      )}

      {/* Classroom detail sheet */}
      {selectedRoom && (
        <ClassroomDetailSheet
          classroom={selectedRoom}
          course={selectedRoomCourse}
          students={selectedRoomStudents}
          canManage={canManageSelected}
          onAddStudent={() => setShowAddStudentModal(true)}
          onRemoveStudent={handleRemoveStudent}
          onDeleteClassroom={handleDeleteClassroom}
          onClose={() => { setSelectedRoom(null); setRemoveConfirm(null); }}
        />
      )}
    </>
  );
}
