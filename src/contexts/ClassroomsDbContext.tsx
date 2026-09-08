"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import {
  Course,
  DbClassroom,
  ClassroomPrivate,
  ClassroomEnrollment,
  DbAssignment,
  DbAttendanceRecord,
  DbAttendanceStatus,
  DbProgressNote,
  DbPayment,
  genJoinCode,
  fetchCourses,
  fetchCoursesByIds,
  fetchClassrooms,
  fetchClassroomsForTeacher,
  fetchClassroomsByIds,
  fetchEnrollments,
  insertCourse,
  deleteCourseById,
  insertClassroom,
  deleteClassroomById,
  fetchClassroomPrivates,
  insertClassroomPrivate,
  updateClassroomRate,
  joinClassroomByCode,
  insertEnrollment,
  deleteEnrollmentById,
  fetchAssignments,
  insertAssignment,
  updateAssignmentById,
  deleteAssignmentById,
  fetchAttendance,
  upsertAttendance,
  fetchProgressNotes,
  upsertProgressNote,
  fetchPayments,
  markPaymentPaid,
} from "@/lib/classrooms-db";
import { useAuth } from "./AuthContext";

interface ClassroomsDbContextType {
  courses: Course[];
  classrooms: DbClassroom[];
  classroomPrivates: ClassroomPrivate[];
  enrollments: ClassroomEnrollment[];
  assignments: DbAssignment[];
  attendance: DbAttendanceRecord[];
  progressNotes: DbProgressNote[];
  payments: DbPayment[];
  loading: boolean;
  error: string | null;
  schemaReady: boolean;
  createCourse: (name: string, description?: string) => Promise<Course>;
  removeCourse: (id: string) => Promise<void>;
  createClassroom: (input: { courseId?: string; name: string; description?: string }) => Promise<DbClassroom>;
  removeClassroom: (id: string) => Promise<void>;
  enrollStudent: (classroomId: string, studentId: string, studentName: string, studentEmail?: string) => Promise<void>;
  unenrollStudent: (enrollmentId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<DbClassroom>;
  updateRate: (classroomId: string, hourlyRate: number) => Promise<void>;
  getClassroomPrivate: (classroomId: string) => ClassroomPrivate | undefined;
  getClassroomStudents: (classroomId: string) => ClassroomEnrollment[];
  getMyEnrollments: () => ClassroomEnrollment[];
  getMyClassrooms: () => DbClassroom[];
  getTeacherClassrooms: () => DbClassroom[];
  getCourseClassrooms: (courseId: string) => DbClassroom[];
  getStandaloneClassrooms: () => DbClassroom[];
  isEnrolled: (classroomId: string) => boolean;
  isMyClassroom: (classroom: DbClassroom) => boolean;
  refresh: () => Promise<void>;
  // Assignments
  addAssignment: (classroomId: string, title: string, description?: string, dueDate?: string) => Promise<void>;
  editAssignment: (id: string, patch: { title?: string; description?: string; dueDate?: string }) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  getAssignmentsForClassroom: (classroomId: string) => DbAssignment[];
  // Attendance
  markAttendance: (classroomId: string, studentId: string, studentName: string, date: string, status: DbAttendanceStatus, hours: number) => Promise<void>;
  getAttendanceForClassroom: (classroomId: string) => DbAttendanceRecord[];
  getAttendanceRecord: (classroomId: string, studentId: string, date: string) => DbAttendanceRecord | undefined;
  getStudentCompletedHours: (classroomId: string, studentId: string, month?: string) => number;
  getClassroomHeldHours: (classroomId: string, month?: string) => number;
  // Progress notes
  getProgressNote: (classroomId: string, studentId: string) => DbProgressNote | undefined;
  setProgressNote: (classroomId: string, studentId: string, patch: { completed?: string; assigned?: string; next_up?: string }) => Promise<void>;
  // Payments
  getPaymentsForTeacher: (teacherId: string) => DbPayment[];
  getPaymentForMonth: (teacherId: string, month: string) => DbPayment | undefined;
  getClassroomDueForMonth: (classroomId: string, month: string) => number;
  getTeacherDueForMonth: (teacherId: string, month: string) => number;
  markPaid: (teacherId: string, month: string, amount: number) => Promise<void>;
}

const ClassroomsDbCtx = createContext<ClassroomsDbContextType>({
  courses: [], classrooms: [], classroomPrivates: [], enrollments: [], assignments: [], attendance: [], progressNotes: [], payments: [],
  loading: false, error: null, schemaReady: true,
  createCourse: async () => { throw new Error("not ready"); },
  removeCourse: async () => {},
  createClassroom: async () => { throw new Error("not ready"); },
  removeClassroom: async () => {},
  enrollStudent: async () => {},
  unenrollStudent: async () => {},
  joinByCode: async () => { throw new Error("not ready"); },
  updateRate: async () => {},
  getClassroomPrivate: () => undefined,
  getClassroomStudents: () => [],
  getMyEnrollments: () => [],
  getMyClassrooms: () => [],
  getTeacherClassrooms: () => [],
  getCourseClassrooms: () => [],
  getStandaloneClassrooms: () => [],
  isEnrolled: () => false,
  isMyClassroom: () => false,
  refresh: async () => {},
  addAssignment: async () => {},
  editAssignment: async () => {},
  removeAssignment: async () => {},
  getAssignmentsForClassroom: () => [],
  markAttendance: async () => {},
  getAttendanceForClassroom: () => [],
  getAttendanceRecord: () => undefined,
  getStudentCompletedHours: () => 0,
  getClassroomHeldHours: () => 0,
  getProgressNote: () => undefined,
  setProgressNote: async () => {},
  getPaymentsForTeacher: () => [],
  getPaymentForMonth: () => undefined,
  getClassroomDueForMonth: () => 0,
  getTeacherDueForMonth: () => 0,
  markPaid: async () => {},
});

// Supabase returns this when a table referenced by the app hasn't been created
// in the connected project yet (i.e. supabase/migration.sql was never run).
function isMissingTableError(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === "PGRST205" || !!err?.message?.includes("schema cache");
}

export function ClassroomsDbProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<DbClassroom[]>([]);
  const [classroomPrivates, setClassroomPrivates] = useState<ClassroomPrivate[]>([]);
  const [enrollments, setEnrollments] = useState<ClassroomEnrollment[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [attendance, setAttendance] = useState<DbAttendanceRecord[]>([]);
  const [progressNotes, setProgressNotes] = useState<DbProgressNote[]>([]);
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseReady || !user) return;
    // Course Classrooms has no UI for parents (or any other role) at all —
    // don't fetch a dataset nothing will read. Admins get everything;
    // teachers/students get only what's theirs, so the payload stays
    // proportional to that one person's actual involvement rather than
    // growing with the whole platform.
    if (user.role !== "admin" && user.role !== "teacher" && user.role !== "student") {
      setLoading(false);
      setSchemaReady(true);
      return;
    }
    setLoading(true);
    try {
      // classroom_students' RLS already scopes this to "my own enrollments"
      // (student) or "enrollments in classes I manage" (teacher/admin)
      // regardless of query shape, so one fetch covers everyone — and gives
      // students the classroom ids needed to scope the fetch below.
      const e = await fetchEnrollments();

      let r: DbClassroom[];
      let c: Course[];
      if (user.role === "admin") {
        [r, c] = await Promise.all([fetchClassrooms(), fetchCourses()]);
      } else if (user.role === "teacher") {
        r = await fetchClassroomsForTeacher(user.id);
        const courseIds = Array.from(new Set(r.map((x) => x.course_id).filter((id): id is string => !!id)));
        c = await fetchCoursesByIds(courseIds);
      } else {
        const myClassroomIds = Array.from(new Set(e.map((x) => x.classroom_id)));
        r = await fetchClassroomsByIds(myClassroomIds);
        const courseIds = Array.from(new Set(r.map((x) => x.course_id).filter((id): id is string => !!id)));
        c = await fetchCoursesByIds(courseIds);
      }

      const [cp, a, att, pn, pay] = await Promise.all([
        fetchClassroomPrivates(), fetchAssignments(), fetchAttendance(), fetchProgressNotes(), fetchPayments(),
      ]);
      setCourses(c);
      setClassrooms(r);
      setClassroomPrivates(cp);
      setEnrollments(e);
      setAssignments(a);
      setAttendance(att);
      setProgressNotes(pn);
      setPayments(pay);
      setError(null);
      setSchemaReady(true);
    } catch (e) {
      if (isMissingTableError(e)) {
        setSchemaReady(false);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Latest state for the realtime handlers below to read without needing to
  // tear down and recreate the subscription every time one of these changes
  // (the effect only depends on `user`, so a plain closure over the state
  // variables would go stale after the first render).
  const classroomsRef = useRef(classrooms);
  const coursesRef = useRef(courses);
  const enrollmentsRef = useRef(enrollments);
  useEffect(() => { classroomsRef.current = classrooms; }, [classrooms]);
  useEffect(() => { coursesRef.current = courses; }, [courses]);
  useEffect(() => { enrollmentsRef.current = enrollments; }, [enrollments]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !isSupabaseReady || !user) return;
    if (user.role !== "admin" && user.role !== "teacher" && user.role !== "student") return;

    // courses_select/classrooms_select grant any authenticated user SELECT
    // on every row (needed for e.g. join-by-code lookups), so unlike the
    // per-user-scoped tables below, RLS alone won't stop this channel from
    // delivering every OTHER teacher's new classroom too — filter those out
    // client-side so a non-admin's local state doesn't quietly re-accumulate
    // the whole-platform dataset that `load()` above deliberately avoided
    // fetching in the first place. Updates/deletes to something already in
    // local state are still applied either way (harmless either way,
    // needed if it's actually relevant).
    const isRelevantClassroom = (row: DbClassroom) =>
      user.role === "admin" ||
      row.teacher_id === user.id ||
      classroomsRef.current.some((c) => c.id === row.id) ||
      enrollmentsRef.current.some((e) => e.classroom_id === row.id && e.student_id === user.id);
    const isRelevantCourse = (row: Course) =>
      user.role === "admin" ||
      coursesRef.current.some((c) => c.id === row.id) ||
      classroomsRef.current.some((c) => c.course_id === row.id);

    const ch = supabase
      .channel("classrooms-db-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, (p) => {
        if (p.eventType === "DELETE") {
          setCourses((prev) => prev.filter((c) => c.id !== (p.old as { id: string }).id));
          return;
        }
        const row = p.new as Course;
        if (!isRelevantCourse(row)) return;
        setCourses((prev) => {
          const idx = prev.findIndex((c) => c.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classrooms" }, (p) => {
        if (p.eventType === "DELETE") {
          setClassrooms((prev) => prev.filter((c) => c.id !== (p.old as { id: string }).id));
          return;
        }
        const row = p.new as DbClassroom;
        if (!isRelevantClassroom(row)) return;
        setClassrooms((prev) => {
          const idx = prev.findIndex((c) => c.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_private" }, (p) => {
        if (p.eventType === "DELETE") {
          const oldId = (p.old as { classroom_id: string }).classroom_id;
          setClassroomPrivates((prev) => prev.filter((cp) => cp.classroom_id !== oldId));
          return;
        }
        const row = p.new as ClassroomPrivate;
        setClassroomPrivates((prev) => {
          const idx = prev.findIndex((cp) => cp.classroom_id === row.classroom_id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_students" }, (p) => {
        if (p.eventType === "DELETE") {
          setEnrollments((prev) => prev.filter((e) => e.id !== (p.old as { id: string }).id));
          return;
        }
        const row = p.new as ClassroomEnrollment;
        setEnrollments((prev) => {
          const idx = prev.findIndex((e) => e.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_assignments" }, (p) => {
        if (p.eventType === "DELETE") {
          setAssignments((prev) => prev.filter((a) => a.id !== (p.old as { id: string }).id));
          return;
        }
        const row = p.new as DbAssignment;
        setAssignments((prev) => {
          const idx = prev.findIndex((a) => a.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_attendance" }, (p) => {
        if (p.eventType === "DELETE") {
          setAttendance((prev) => prev.filter((a) => a.id !== (p.old as { id: string }).id));
          return;
        }
        const row = p.new as DbAttendanceRecord;
        setAttendance((prev) => {
          const idx = prev.findIndex((a) => a.id === row.id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_progress_notes" }, (p) => {
        if (p.eventType === "DELETE") return;
        const row = p.new as DbProgressNote;
        setProgressNotes((prev) => {
          const idx = prev.findIndex((n) => n.classroom_id === row.classroom_id && n.student_id === row.student_id);
          if (idx < 0) return [...prev, row];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_payments" }, (p) => {
        if (p.eventType === "DELETE") return;
        const row = p.new as DbPayment;
        setPayments((prev) => {
          const idx = prev.findIndex((x) => x.id === row.id);
          if (idx < 0) return [row, ...prev];
          const next = [...prev]; next[idx] = row; return next;
        });
      })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, [user]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCourse = useCallback(async (name: string, description?: string): Promise<Course> => {
    if (!user) throw new Error("Not logged in");
    try {
      const c = await insertCourse(name, description ?? null, user.id);
      setCourses((prev) => [...prev, c]);
      return c;
    } catch (e) {
      if (isMissingTableError(e)) setSchemaReady(false);
      throw e;
    }
  }, [user]);

  const removeCourse = useCallback(async (id: string) => {
    await deleteCourseById(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setClassrooms((prev) => prev.filter((c) => c.course_id !== id));
  }, []);

  const createClassroom = useCallback(async ({
    courseId, name, description,
  }: { courseId?: string; name: string; description?: string }): Promise<DbClassroom> => {
    if (!user) throw new Error("Not logged in");
    try {
      const room = await insertClassroom({
        course_id: courseId ?? null,
        name,
        teacher_id: user.id,
        teacher_name: user.name,
        description: description ?? null,
      });
      setClassrooms((prev) => [...prev, room]);

      // genJoinCode()'s keyspace is large but finite — as more classrooms
      // get created, an actual collision with someone else's code becomes
      // a matter of when, not if. Retry a few times with a fresh code
      // rather than erroring out on the first unlucky draw.
      let priv = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 5 && !priv; attempt++) {
        try {
          priv = await insertClassroomPrivate(room.id, genJoinCode());
        } catch (e) {
          lastError = e;
          if ((e as { code?: string } | null)?.code !== "23505") throw e; // not a collision — don't retry
        }
      }
      if (!priv) {
        // Out of retries — don't leave this classroom stuck with no way to
        // ever get a join code; remove it and surface a clear error instead.
        await deleteClassroomById(room.id).catch(() => {});
        setClassrooms((prev) => prev.filter((c) => c.id !== room.id));
        throw lastError instanceof Error ? lastError : new Error("Could not create the classroom — please try again.");
      }

      setClassroomPrivates((prev) => [...prev, priv!]);
      return room;
    } catch (e) {
      if (isMissingTableError(e)) setSchemaReady(false);
      throw e;
    }
  }, [user]);

  const removeClassroom = useCallback(async (id: string) => {
    await deleteClassroomById(id);
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.classroom_id !== id));
  }, []);

  const enrollStudent = useCallback(async (
    classroomId: string, studentId: string, studentName: string, studentEmail?: string
  ) => {
    const e = await insertEnrollment(classroomId, studentId, studentName, studentEmail);
    setEnrollments((prev) => [...prev, e]);
  }, []);

  const unenrollStudent = useCallback(async (enrollmentId: string) => {
    await deleteEnrollmentById(enrollmentId);
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
  }, []);

  // The code is validated server-side (join_classroom_by_code RPC) — the
  // client never reads classroom_private, so there's nothing to check
  // client-side beyond "did the server accept it." The resulting enrollment
  // row arrives via the realtime subscription below rather than being
  // inserted into local state here, to avoid a duplicate entry once it does.
  const joinByCode = useCallback(async (code: string): Promise<DbClassroom> => {
    if (!user) throw new Error("Not logged in");
    const classroomId = await joinClassroomByCode(code);
    const room = classrooms.find((c) => c.id === classroomId);
    if (room) return room;
    // Joined successfully but this classroom wasn't in our already-loaded
    // list yet (edge case, since classrooms_select is visible to everyone
    // regardless of enrollment this shouldn't normally happen) — fetch fresh
    // rather than trust the stale closure over `classrooms`.
    const fresh = await fetchClassrooms();
    setClassrooms(fresh);
    const found = fresh.find((c) => c.id === classroomId);
    if (!found) throw new Error("Joined, but couldn't load the classroom details. Try refreshing.");
    return found;
  }, [user, classrooms]);

  const updateRate = useCallback(async (classroomId: string, hourlyRate: number) => {
    await updateClassroomRate(classroomId, hourlyRate);
    setClassroomPrivates((prev) => prev.map((cp) => cp.classroom_id === classroomId ? { ...cp, hourly_rate: hourlyRate } : cp));
  }, []);

  const getClassroomPrivate = useCallback(
    (classroomId: string) => classroomPrivates.find((cp) => cp.classroom_id === classroomId),
    [classroomPrivates]
  );

  // ── Assignments ──────────────────────────────────────────────────────────

  const addAssignment = useCallback(async (classroomId: string, title: string, description?: string, dueDate?: string) => {
    const a = await insertAssignment({ classroom_id: classroomId, title, description, due_date: dueDate });
    setAssignments((prev) => [...prev, a]);
  }, []);

  const editAssignment = useCallback(async (id: string, patch: { title?: string; description?: string; dueDate?: string }) => {
    await updateAssignmentById(id, { title: patch.title, description: patch.description ?? null, due_date: patch.dueDate ?? null });
    setAssignments((prev) => prev.map((a) => a.id === id ? {
      ...a,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      description: patch.description ?? null,
      due_date: patch.dueDate ?? null,
    } : a));
  }, []);

  const removeAssignment = useCallback(async (id: string) => {
    await deleteAssignmentById(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAssignmentsForClassroom = useCallback(
    (classroomId: string) => assignments.filter((a) => a.classroom_id === classroomId),
    [assignments]
  );

  // ── Attendance ───────────────────────────────────────────────────────────

  const markAttendance = useCallback(async (
    classroomId: string, studentId: string, studentName: string, date: string, status: DbAttendanceStatus, hours: number
  ) => {
    if (!user) return;
    const rec = await upsertAttendance({
      classroom_id: classroomId, student_id: studentId, student_name: studentName,
      date, status, hours, marked_by: user.id,
    });
    setAttendance((prev) => {
      const idx = prev.findIndex((r) => r.classroom_id === classroomId && r.student_id === studentId && r.date === date);
      if (idx < 0) return [...prev, rec];
      const next = [...prev]; next[idx] = rec; return next;
    });
  }, [user]);

  const getAttendanceForClassroom = useCallback(
    (classroomId: string) => attendance.filter((r) => r.classroom_id === classroomId),
    [attendance]
  );

  const getAttendanceRecord = useCallback(
    (classroomId: string, studentId: string, date: string) =>
      attendance.find((r) => r.classroom_id === classroomId && r.student_id === studentId && r.date === date),
    [attendance]
  );

  const getStudentCompletedHours = useCallback(
    (classroomId: string, studentId: string, month?: string) =>
      attendance
        .filter((r) =>
          r.classroom_id === classroomId &&
          r.student_id === studentId &&
          (r.status === "present" || r.status === "late") &&
          (!month || r.date.startsWith(month))
        )
        .reduce((sum, r) => sum + Number(r.hours), 0),
    [attendance]
  );

  // Hours the class has actually held so far = one "hours" value per distinct
  // date (a whole-class session), not summed per student — otherwise a
  // 1-hour session with 5 students would count as 5 hours taught.
  const getClassroomHeldHours = useCallback(
    (classroomId: string, month?: string) => {
      const byDate = new Map<string, number>();
      for (const r of attendance) {
        if (r.classroom_id !== classroomId) continue;
        if (month && !r.date.startsWith(month)) continue;
        if (!byDate.has(r.date)) byDate.set(r.date, Number(r.hours));
      }
      return Array.from(byDate.values()).reduce((sum, h) => sum + h, 0);
    },
    [attendance]
  );

  // ── Progress notes ───────────────────────────────────────────────────────

  const getProgressNote = useCallback(
    (classroomId: string, studentId: string) =>
      progressNotes.find((n) => n.classroom_id === classroomId && n.student_id === studentId),
    [progressNotes]
  );

  const setProgressNote = useCallback(async (
    classroomId: string, studentId: string, patch: { completed?: string; assigned?: string; next_up?: string }
  ) => {
    if (!user) return;
    const note = await upsertProgressNote({
      classroom_id: classroomId, student_id: studentId,
      completed: patch.completed, assigned: patch.assigned, next_up: patch.next_up,
      updated_by: user.id,
    });
    setProgressNotes((prev) => {
      const idx = prev.findIndex((n) => n.classroom_id === classroomId && n.student_id === studentId);
      if (idx < 0) return [...prev, note];
      const next = [...prev]; next[idx] = note; return next;
    });
  }, [user]);

  // ── Payments ─────────────────────────────────────────────────────────────

  const getPaymentsForTeacher = useCallback(
    (teacherId: string) => payments.filter((p) => p.teacher_id === teacherId),
    [payments]
  );

  const getPaymentForMonth = useCallback(
    (teacherId: string, month: string) =>
      payments.find((p) => p.teacher_id === teacherId && p.month === month),
    [payments]
  );

  const getClassroomDueForMonth = useCallback(
    (classroomId: string, month: string) => {
      const rate = classroomPrivates.find((cp) => cp.classroom_id === classroomId)?.hourly_rate;
      if (!rate) return 0;
      return getClassroomHeldHours(classroomId, month) * rate;
    },
    [classroomPrivates, getClassroomHeldHours]
  );

  const getTeacherDueForMonth = useCallback(
    (teacherId: string, month: string) => {
      const taught = classrooms.filter((c) => c.teacher_id === teacherId);
      return taught.reduce((sum, c) => sum + getClassroomDueForMonth(c.id, month), 0);
    },
    [classrooms, getClassroomDueForMonth]
  );

  const markPaid = useCallback(async (teacherId: string, month: string, amount: number) => {
    if (!user) return;
    const p = await markPaymentPaid({ teacher_id: teacherId, month, amount, paid_by: user.id });
    setPayments((prev) => {
      const idx = prev.findIndex((x) => x.teacher_id === teacherId && x.month === month);
      if (idx < 0) return [p, ...prev];
      const next = [...prev]; next[idx] = p; return next;
    });
  }, [user]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const getClassroomStudents = useCallback(
    (classroomId: string) => enrollments.filter((e) => e.classroom_id === classroomId),
    [enrollments]
  );

  const getMyEnrollments = useCallback(
    () => (user ? enrollments.filter((e) => e.student_id === user.id) : []),
    [enrollments, user]
  );

  const getMyClassrooms = useCallback((): DbClassroom[] => {
    if (!user) return [];
    const ids = new Set(getMyEnrollments().map((e) => e.classroom_id));
    return classrooms.filter((c) => ids.has(c.id));
  }, [classrooms, getMyEnrollments, user]);

  const getTeacherClassrooms = useCallback(
    () => (user ? classrooms.filter((c) => c.teacher_id === user.id) : []),
    [classrooms, user]
  );

  const getCourseClassrooms = useCallback(
    (courseId: string) => classrooms.filter((c) => c.course_id === courseId),
    [classrooms]
  );

  const getStandaloneClassrooms = useCallback(
    () => classrooms.filter((c) => !c.course_id),
    [classrooms]
  );

  const isEnrolled = useCallback(
    (classroomId: string) => !!user && enrollments.some((e) => e.classroom_id === classroomId && e.student_id === user.id),
    [enrollments, user]
  );

  const isMyClassroom = useCallback(
    (classroom: DbClassroom) => !!user && classroom.teacher_id === user.id,
    [user]
  );

  const value = useMemo(() => ({
    courses, classrooms, classroomPrivates, enrollments, assignments, attendance, progressNotes, payments,
    loading, error, schemaReady,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode, updateRate, getClassroomPrivate,
    getClassroomStudents, getMyEnrollments, getMyClassrooms,
    getTeacherClassrooms, getCourseClassrooms, getStandaloneClassrooms,
    isEnrolled, isMyClassroom, refresh: load,
    addAssignment, editAssignment, removeAssignment, getAssignmentsForClassroom,
    markAttendance, getAttendanceForClassroom, getAttendanceRecord, getStudentCompletedHours, getClassroomHeldHours,
    getProgressNote, setProgressNote,
    getPaymentsForTeacher, getPaymentForMonth, getClassroomDueForMonth, getTeacherDueForMonth, markPaid,
  }), [
    courses, classrooms, classroomPrivates, enrollments, assignments, attendance, progressNotes, payments,
    loading, error, schemaReady,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode, updateRate, getClassroomPrivate,
    getClassroomStudents, getMyEnrollments, getMyClassrooms,
    getTeacherClassrooms, getCourseClassrooms, getStandaloneClassrooms,
    isEnrolled, isMyClassroom, load,
    addAssignment, editAssignment, removeAssignment, getAssignmentsForClassroom,
    markAttendance, getAttendanceForClassroom, getAttendanceRecord, getStudentCompletedHours, getClassroomHeldHours,
    getProgressNote, setProgressNote,
    getPaymentsForTeacher, getPaymentForMonth, getClassroomDueForMonth, getTeacherDueForMonth, markPaid,
  ]);

  return <ClassroomsDbCtx.Provider value={value}>{children}</ClassroomsDbCtx.Provider>;
}

export const useClassroomsDb = () => useContext(ClassroomsDbCtx);
