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
  genJoinCode,
  fetchCourses,
  fetchClassrooms,
  fetchEnrollments,
  insertCourse,
  deleteCourseById,
  insertClassroom,
  deleteClassroomById,
  fetchClassroomByCode,
  insertEnrollment,
  deleteEnrollmentById,
} from "@/lib/classrooms-db";
import { useAuth } from "./AuthContext";

interface ClassroomsDbContextType {
  courses: Course[];
  classrooms: DbClassroom[];
  enrollments: ClassroomEnrollment[];
  loading: boolean;
  error: string | null;
  createCourse: (name: string, description?: string) => Promise<Course>;
  removeCourse: (id: string) => Promise<void>;
  createClassroom: (input: {
    courseId?: string;
    name: string;
    description?: string;
  }) => Promise<DbClassroom>;
  removeClassroom: (id: string) => Promise<void>;
  enrollStudent: (classroomId: string, studentId: string, studentName: string, studentEmail?: string) => Promise<void>;
  unenrollStudent: (enrollmentId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<DbClassroom>;
  getClassroomStudents: (classroomId: string) => ClassroomEnrollment[];
  getMyEnrollments: () => ClassroomEnrollment[];
  getMyClassrooms: () => DbClassroom[];
  getTeacherClassrooms: () => DbClassroom[];
  getCourseClassrooms: (courseId: string) => DbClassroom[];
  getStandaloneClassrooms: () => DbClassroom[];
  isEnrolled: (classroomId: string) => boolean;
  refresh: () => Promise<void>;
}

const ClassroomsDbCtx = createContext<ClassroomsDbContextType>({
  courses: [],
  classrooms: [],
  enrollments: [],
  loading: false,
  error: null,
  createCourse: async () => { throw new Error("not ready"); },
  removeCourse: async () => {},
  createClassroom: async () => { throw new Error("not ready"); },
  removeClassroom: async () => {},
  enrollStudent: async () => {},
  unenrollStudent: async () => {},
  joinByCode: async () => { throw new Error("not ready"); },
  getClassroomStudents: () => [],
  getMyEnrollments: () => [],
  getMyClassrooms: () => [],
  getTeacherClassrooms: () => [],
  getCourseClassrooms: () => [],
  getStandaloneClassrooms: () => [],
  isEnrolled: () => false,
  refresh: async () => {},
});

export function ClassroomsDbProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<DbClassroom[]>([]);
  const [enrollments, setEnrollments] = useState<ClassroomEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseReady) return;
    setLoading(true);
    try {
      const [c, r, e] = await Promise.all([fetchCourses(), fetchClassrooms(), fetchEnrollments()]);
      setCourses(c);
      setClassrooms(r);
      setEnrollments(e);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
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
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCourse = useCallback(async (name: string, description?: string): Promise<Course> => {
    if (!user) throw new Error("Not logged in");
    const c = await insertCourse(name, description ?? null, user.id);
    setCourses((prev) => [...prev, c]);
    return c;
  }, [user]);

  const removeCourse = useCallback(async (id: string) => {
    await deleteCourseById(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setClassrooms((prev) => prev.filter((c) => c.course_id !== id));
  }, []);

  const createClassroom = useCallback(async ({
    courseId,
    name,
    description,
  }: {
    courseId?: string;
    name: string;
    description?: string;
  }): Promise<DbClassroom> => {
    if (!user) throw new Error("Not logged in");
    const room = await insertClassroom({
      course_id: courseId ?? null,
      name,
      teacher_id: user.id,
      teacher_name: user.name,
      description: description ?? null,
      join_code: genJoinCode(),
    });
    setClassrooms((prev) => [...prev, room]);
    return room;
  }, [user]);

  const removeClassroom = useCallback(async (id: string) => {
    await deleteClassroomById(id);
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.classroom_id !== id));
  }, []);

  const enrollStudent = useCallback(async (
    classroomId: string,
    studentId: string,
    studentName: string,
    studentEmail?: string
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
    const alreadyIn = enrollments.some((e) => e.classroom_id === room.id && e.student_id === user.id);
    if (alreadyIn) throw new Error("You are already enrolled in this classroom.");
    await enrollStudent(room.id, user.id, user.name, user.email);
    return room;
  }, [user, enrollments, enrollStudent]);

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
    const ids = new Set(enrollments.filter((e) => e.student_id === user.id).map((e) => e.classroom_id));
    return classrooms.filter((c) => ids.has(c.id));
  }, [classrooms, enrollments, user]);

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

  const value = useMemo(() => ({
    courses, classrooms, enrollments, loading, error,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode,
    getClassroomStudents, getMyEnrollments, getMyClassrooms,
    getTeacherClassrooms, getCourseClassrooms, getStandaloneClassrooms,
    isEnrolled, refresh: load,
  }), [
    courses, classrooms, enrollments, loading, error,
    createCourse, removeCourse, createClassroom, removeClassroom,
    enrollStudent, unenrollStudent, joinByCode,
    getClassroomStudents, getMyEnrollments, getMyClassrooms,
    getTeacherClassrooms, getCourseClassrooms, getStandaloneClassrooms,
    isEnrolled, load,
  ]);

  return <ClassroomsDbCtx.Provider value={value}>{children}</ClassroomsDbCtx.Provider>;
}

export const useClassroomsDb = () => useContext(ClassroomsDbCtx);
