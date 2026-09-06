"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import {
  Course,
  DbClassroom,
  ClassroomEnrollment,
  DbAssignment,
  DbAttendanceRecord,
  DbAttendanceStatus,
  DbProgressNote,
  DbPayment,
  genJoinCode,
  fetchCourses,
  fetchClassrooms,
  fetchEnrollments,
  insertCourse,
  deleteCourseById,
  insertClassroom,
  deleteClassroomById,
  fetchClassroomByCode,
  updateClassroomRate,
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

// A classroom/enrollment row "belongs" to the current user if its email
// column matches — falling back to the legacy per-device User.id only for
// rows created before the email columns existed. See the identity note at
// the top of classrooms-db.ts.
function ownsClassroom(c: DbClassroom, email: string, id: string): boolean {
  return c.teacher_email ? c.teacher_email.toLowerCase() === email.toLowerCase() : c.teacher_id === id;
}
function ownsEnrollment(e: ClassroomEnrollment, email: string, id: string): boolean {
  return e.student_email ? e.student_email.toLowerCase() === email.toLowerCase() : e.student_id === id;
}

interface ClassroomsDbContextType {
  courses: Course[];
  classrooms: DbClassroom[];
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
  markAttendance: (classroomId: string, studentEmail: string, studentName: string, date: string, status: DbAttendanceStatus, hours: number) => Promise<void>;
  getAttendanceForClassroom: (classroomId: string) => DbAttendanceRecord[];
  getAttendanceRecord: (classroomId: string, studentEmail: string, date: string) => DbAttendanceRecord | undefined;
  getStudentCompletedHours: (classroomId: string, studentEmail: string, month?: string) => number;
  getClassroomHeldHours: (classroomId: string, month?: string) => number;
  // Progress notes
  getProgressNote: (classroomId: string, studentEmail: string) => DbProgressNote | undefined;
  setProgressNote: (classroomId: string, studentEmail: string, patch: { completed?: string; assigned?: string; next_up?: string }) => Promise<void>;
  // Payments
  getPaymentsForTeacher: (teacherEmail: string) => DbPayment[];
  getPaymentForMonth: (teacherEmail: string, month: string) => DbPayment | undefined;
  getClassroomDueForMonth: (classroomId: string, month: string) => number;
  getTeacherDueForMonth: (teacherEmail: string, month: string) => number;
  markPaid: (teacherEmail: string, month: string, amount: number) => Promise<void>;
}

const ClassroomsDbCtx = createContext<ClassroomsDbContextType>({
  courses: [], classrooms: [], enrollments: [], assignments: [], attendance: [], progressNotes: [], payments: [],
  loading: false, error: null, schemaReady: true,
  createCourse: async () => { throw new Error("not ready"); },
  removeCourse: async () => {},
  createClassroom: async () => { throw new Error("not ready"); },
  removeClassroom: async () => {},
  enrollStudent: async () => {},
  unenrollStudent: async () => {},
  joinByCode: async () => { throw new Error("not ready"); },
  updateRate: async () => {},
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
// in the connected project yet (i.e. the setup SQL at the top of classrooms-db.ts
// was never run) — distinguish that from a real runtime/network error.
function isMissingTableError(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === "PGRST205" || !!err?.message?.includes("schema cache");
}

export function ClassroomsDbProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<DbClassroom[]>([]);
  const [enrollments, setEnrollments] = useState<ClassroomEnrollment[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [attendance, setAttendance] = useState<DbAttendanceRecord[]>([]);
  const [progressNotes, setProgressNotes] = useState<DbProgressNote[]>([]);
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseReady) return;
    setLoading(true);
    try {
      const [c, r, e, a, att, pn, pay] = await Promise.all([
        fetchCourses(), fetchClassrooms(), fetchEnrollments(),
        fetchAssignments(), fetchAttendance(), fetchProgressNotes(), fetchPayments(),
      ]);
      setCourses(c);
      setClassrooms(r);
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
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !isSupabaseReady) return;
    const ch = supabase
      .channel("classrooms-db-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, (p) => {
        if (p.eventType === "INSERT") setCourses((prev) => [...prev, p.new as Course]);
        else if (p.eventType === "DELETE") setCourses((prev) => prev.filter((c) => c.id !== (p.old as { id: string }).id));
        else if (p.eventType === "UPDATE") setCourses((prev) => prev.map((c) => c.id === (p.new as Course).id ? p.new as Course : c));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classrooms" }, (p) => {
        if (p.eventType === "INSERT") setClassrooms((prev) => [...prev, p.new as DbClassroom]);
        else if (p.eventType === "DELETE") setClassrooms((prev) => prev.filter((c) => c.id !== (p.old as { id: string }).id));
        else if (p.eventType === "UPDATE") setClassrooms((prev) => prev.map((c) => c.id === (p.new as DbClassroom).id ? p.new as DbClassroom : c));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_students" }, (p) => {
        if (p.eventType === "INSERT") setEnrollments((prev) => [...prev, p.new as ClassroomEnrollment]);
        else if (p.eventType === "DELETE") setEnrollments((prev) => prev.filter((e) => e.id !== (p.old as { id: string }).id));
        else if (p.eventType === "UPDATE") setEnrollments((prev) => prev.map((e) => e.id === (p.new as ClassroomEnrollment).id ? p.new as ClassroomEnrollment : e));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_assignments" }, (p) => {
        if (p.eventType === "INSERT") setAssignments((prev) => [...prev, p.new as DbAssignment]);
        else if (p.eventType === "DELETE") setAssignments((prev) => prev.filter((a) => a.id !== (p.old as { id: string }).id));
        else if (p.eventType === "UPDATE") setAssignments((prev) => prev.map((a) => a.id === (p.new as DbAssignment).id ? p.new as DbAssignment : a));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_attendance" }, (p) => {
        if (p.eventType === "INSERT") setAttendance((prev) => [...prev, p.new as DbAttendanceRecord]);
        else if (p.eventType === "DELETE") setAttendance((prev) => prev.filter((a) => a.id !== (p.old as { id: string }).id));
        else if (p.eventType === "UPDATE") setAttendance((prev) => prev.map((a) => a.id === (p.new as DbAttendanceRecord).id ? p.new as DbAttendanceRecord : a));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_progress_notes" }, (p) => {
        if (p.eventType === "DELETE") return;
        const row = p.new as DbProgressNote;
        setProgressNotes((prev) => {
          const idx = prev.findIndex((n) => n.classroom_id === row.classroom_id && n.student_email === row.student_email);
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
  }, []);

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
        teacher_email: user.email,
        description: description ?? null,
        join_code: genJoinCode(),
        hourly_rate: null,
      });
      setClassrooms((prev) => [...prev, room]);
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

  const joinByCode = useCallback(async (code: string): Promise<DbClassroom> => {
    if (!user) throw new Error("Not logged in");
    const room = await fetchClassroomByCode(code);
    if (!room) throw new Error("Classroom not found. Check the code and try again.");
    const alreadyIn = enrollments.some((e) => e.classroom_id === room.id && ownsEnrollment(e, user.email, user.id));
    if (alreadyIn) throw new Error("You are already enrolled in this classroom.");
    await enrollStudent(room.id, user.id, user.name, user.email);
    return room;
  }, [user, enrollments, enrollStudent]);

  const updateRate = useCallback(async (classroomId: string, hourlyRate: number) => {
    await updateClassroomRate(classroomId, hourlyRate);
    setClassrooms((prev) => prev.map((c) => c.id === classroomId ? { ...c, hourly_rate: hourlyRate } : c));
  }, []);

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
    classroomId: string, studentEmail: string, studentName: string, date: string, status: DbAttendanceStatus, hours: number
  ) => {
    if (!user) return;
    const rec = await upsertAttendance({
      classroom_id: classroomId, student_email: studentEmail, student_name: studentName,
      date, status, hours, marked_by_email: user.email,
    });
    setAttendance((prev) => {
      const idx = prev.findIndex((r) => r.classroom_id === classroomId && r.student_email === studentEmail && r.date === date);
      if (idx < 0) return [...prev, rec];
      const next = [...prev]; next[idx] = rec; return next;
    });
  }, [user]);

  const getAttendanceForClassroom = useCallback(
    (classroomId: string) => attendance.filter((r) => r.classroom_id === classroomId),
    [attendance]
  );

  const getAttendanceRecord = useCallback(
    (classroomId: string, studentEmail: string, date: string) =>
      attendance.find((r) => r.classroom_id === classroomId && r.student_email.toLowerCase() === studentEmail.toLowerCase() && r.date === date),
    [attendance]
  );

  const getStudentCompletedHours = useCallback(
    (classroomId: string, studentEmail: string, month?: string) =>
      attendance
        .filter((r) =>
          r.classroom_id === classroomId &&
          r.student_email.toLowerCase() === studentEmail.toLowerCase() &&
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
    (classroomId: string, studentEmail: string) =>
      progressNotes.find((n) => n.classroom_id === classroomId && n.student_email.toLowerCase() === studentEmail.toLowerCase()),
    [progressNotes]
  );

  const setProgressNote = useCallback(async (
    classroomId: string, studentEmail: string, patch: { completed?: string; assigned?: string; next_up?: string }
  ) => {
    if (!user) return;
    const note = await upsertProgressNote({
      classroom_id: classroomId, student_email: studentEmail,
      completed: patch.completed, assigned: patch.assigned, next_up: patch.next_up,
      updated_by_email: user.email,
    });
    setProgressNotes((prev) => {
      const idx = prev.findIndex((n) => n.classroom_id === classroomId && n.student_email === studentEmail);
      if (idx < 0) return [...prev, note];
      const next = [...prev]; next[idx] = note; return next;
    });
  }, [user]);

  // ── Payments ─────────────────────────────────────────────────────────────

  const getPaymentsForTeacher = useCallback(
    (teacherEmail: string) => payments.filter((p) => p.teacher_email.toLowerCase() === teacherEmail.toLowerCase()),
    [payments]
  );

  const getPaymentForMonth = useCallback(
    (teacherEmail: string, month: string) =>
      payments.find((p) => p.teacher_email.toLowerCase() === teacherEmail.toLowerCase() && p.month === month),
    [payments]
  );

  const getClassroomDueForMonth = useCallback(
    (classroomId: string, month: string) => {
      const room = classrooms.find((c) => c.id === classroomId);
      if (!room?.hourly_rate) return 0;
      return getClassroomHeldHours(classroomId, month) * room.hourly_rate;
    },
    [classrooms, getClassroomHeldHours]
  );

  const getTeacherDueForMonth = useCallback(
    (teacherEmail: string, month: string) => {
      const taught = classrooms.filter((c) => ownsClassroom(c, teacherEmail, ""));
      return taught.reduce((sum, c) => sum + getClassroomDueForMonth(c.id, month), 0);
    },
    [classrooms, getClassroomDueForMonth]
  );

  const markPaid = useCallback(async (teacherEmail: string, month: string, amount: number) => {
    if (!user) return;
    const p = await markPaymentPaid({ teacher_email: teacherEmail, month, amount, paid_by_email: user.email });
    setPayments((prev) => {
      const idx = prev.findIndex((x) => x.teacher_email === teacherEmail && x.month === month);
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
    () => (user ? enrollments.filter((e) => ownsEnrollment(e, user.email, user.id)) : []),
    [enrollments, user]
  );

  const getMyClassrooms = useCallback((): DbClassroom[] => {
    if (!user) return [];
    const ids = new Set(getMyEnrollments().map((e) => e.classroom_id));
    return classrooms.filter((c) => ids.has(c.id));
  }, [classrooms, getMyEnrollments, user]);

  const getTeacherClassrooms = useCallback(
    () => (user ? classrooms.filter((c) => ownsClassroom(c, user.email, user.id)) : []),
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
    (classroomId: string) => !!user && enrollments.some((e) => e.classroom_id === classroomId && ownsEnrollment(e, user.email, user.id)),
    [enrollments, user]
  );

  const isMyClassroom = useCallback(
    (classroom: DbClassroom) => !!user && ownsClassroom(classroom, user.email, user.id),
    [user]
  );

  const value = useMemo(() => ({
    courses, classrooms, enrollments, assignments, attendance, progressNotes, payments,
    loading, error, schemaReady,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode, updateRate,
    getClassroomStudents, getMyEnrollments, getMyClassrooms,
    getTeacherClassrooms, getCourseClassrooms, getStandaloneClassrooms,
    isEnrolled, isMyClassroom, refresh: load,
    addAssignment, editAssignment, removeAssignment, getAssignmentsForClassroom,
    markAttendance, getAttendanceForClassroom, getAttendanceRecord, getStudentCompletedHours, getClassroomHeldHours,
    getProgressNote, setProgressNote,
    getPaymentsForTeacher, getPaymentForMonth, getClassroomDueForMonth, getTeacherDueForMonth, markPaid,
  }), [
    courses, classrooms, enrollments, assignments, attendance, progressNotes, payments,
    loading, error, schemaReady,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode, updateRate,
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
