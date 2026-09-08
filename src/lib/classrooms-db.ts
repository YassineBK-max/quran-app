/*
 * ─── Database schema ─────────────────────────────────────────────────────────
 * The full, canonical schema (tables, RLS policies, triggers) lives in
 * supabase/migration.sql — run that once in the Supabase SQL Editor. It's
 * idempotent, so re-running it after a future change is always safe.
 *
 * Everything below assumes real Supabase Auth: teacher_id/student_id/
 * created_by/teacher_id columns are auth.users ids (== profiles.id ==
 * User.id in the app), not the localStorage ids the app used before.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "./supabase";
import { generateCode } from "./crypto";

export interface Course {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface DbClassroom {
  id: string;
  course_id: string | null;
  name: string;
  teacher_id: string;
  teacher_name: string;
  description: string | null;
  created_at: string;
}

// Only readable by the classroom's teacher(s) or an admin (see
// classroom_private's RLS policy in migration.sql) — never merged into
// DbClassroom, which any authenticated user can read in full.
export interface ClassroomPrivate {
  classroom_id: string;
  join_code: string;
  hourly_rate: number | null;
}

export interface ClassroomEnrollment {
  id: string;
  classroom_id: string;
  student_id: string;
  student_name: string;
  student_email: string | null;
  enrolled_at: string;
}

export type DbAttendanceStatus = "present" | "late" | "absent" | "excused";

export interface DbAssignment {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export interface DbAttendanceRecord {
  id: string;
  classroom_id: string;
  student_id: string;
  student_name: string;
  date: string;
  status: DbAttendanceStatus;
  hours: number;
  marked_by: string | null;
  marked_at: string;
}

export interface DbProgressNote {
  classroom_id: string;
  student_id: string;
  completed: string | null;
  assigned: string | null;
  next_up: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type DbPaymentStatus = "pending" | "paid";

export interface DbPayment {
  id: string;
  teacher_id: string;
  month: string;
  amount: number;
  status: DbPaymentStatus;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
}

export function genJoinCode(): string {
  return generateCode(6);
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<Course[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("courses").select("*").order("created_at");
  if (error) throw error;
  return data ?? [];
}

// Scoped variant: only courses referenced by the classrooms passed in (a
// teacher/student's own), instead of every course on the platform — see the
// scoping note above fetchClassroomsForTeacher/fetchClassroomsByIds below.
export async function fetchCoursesByIds(ids: string[]): Promise<Course[]> {
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase.from("courses").select("*").in("id", ids).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function insertCourse(name: string, description: string | null, created_by: string): Promise<Course> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.from("courses").insert({ name, description, created_by }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCourseById(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

// ── Classrooms ────────────────────────────────────────────────────────────────

// Unscoped — every classroom on the platform. classrooms_select's RLS is
// broad (any authenticated user, so lookups like "join by code" still
// resolve), but that doesn't mean every client should request the whole
// table on every load: reserved for admins, who actually need the full
// picture. Teachers/students use the scoped variants below instead, so a
// growing platform doesn't mean a growing payload for people uninvolved
// with most of it.
export async function fetchClassrooms(): Promise<DbClassroom[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classrooms").select("*").order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function fetchClassroomsForTeacher(teacherId: string): Promise<DbClassroom[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classrooms").select("*").eq("teacher_id", teacherId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function fetchClassroomsByIds(ids: string[]): Promise<DbClassroom[]> {
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase.from("classrooms").select("*").in("id", ids).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function insertClassroom(input: Omit<DbClassroom, "id" | "created_at">): Promise<DbClassroom> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.from("classrooms").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClassroomById(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classrooms").delete().eq("id", id);
  if (error) throw error;
}

// ── Classroom private data (join code + pay rate) ───────────────────────────
// Only visible to the classroom's own teacher(s) or an admin — see the
// security note at the top of migration.sql for why these aren't columns on
// `classrooms` itself.

export async function fetchClassroomPrivates(): Promise<ClassroomPrivate[]> {
  if (!supabase) return [];
  // RLS scopes this to classrooms the caller manages; a student sees none.
  const { data, error } = await supabase.from("classroom_private").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function insertClassroomPrivate(classroomId: string, joinCode: string): Promise<ClassroomPrivate> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_private")
    .insert({ classroom_id: classroomId, join_code: joinCode, hourly_rate: null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClassroomRate(classroomId: string, hourlyRate: number): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classroom_private").update({ hourly_rate: hourlyRate }).eq("classroom_id", classroomId);
  if (error) throw error;
}

// Validates the code server-side and enrolls the caller — never exposes
// classroom_private to the client (see join_classroom_by_code in migration.sql).
export async function joinClassroomByCode(code: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.rpc("join_classroom_by_code", { p_code: code.toUpperCase() });
  if (error) throw error;
  return data as string; // the classroom id
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export async function fetchEnrollments(): Promise<ClassroomEnrollment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classroom_students").select("*").order("enrolled_at");
  if (error) throw error;
  return data ?? [];
}

export async function insertEnrollment(
  classroom_id: string,
  student_id: string,
  student_name: string,
  student_email?: string
): Promise<ClassroomEnrollment> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_students")
    .insert({ classroom_id, student_id, student_name, student_email: student_email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEnrollmentById(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classroom_students").delete().eq("id", id);
  if (error) throw error;
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function fetchAssignments(): Promise<DbAssignment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classroom_assignments").select("*").order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function insertAssignment(input: {
  classroom_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
}): Promise<DbAssignment> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_assignments")
    .insert({ ...input, description: input.description ?? null, due_date: input.due_date ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAssignmentById(
  id: string,
  patch: { title?: string; description?: string | null; due_date?: string | null }
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classroom_assignments").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAssignmentById(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classroom_assignments").delete().eq("id", id);
  if (error) throw error;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function fetchAttendance(): Promise<DbAttendanceRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classroom_attendance").select("*").order("date");
  if (error) throw error;
  return data ?? [];
}

export async function upsertAttendance(input: {
  classroom_id: string;
  student_id: string;
  student_name: string;
  date: string;
  status: DbAttendanceStatus;
  hours: number;
  marked_by: string;
}): Promise<DbAttendanceRecord> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_attendance")
    .upsert(input, { onConflict: "classroom_id,student_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Progress notes ────────────────────────────────────────────────────────────

export async function fetchProgressNotes(): Promise<DbProgressNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classroom_progress_notes").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function upsertProgressNote(input: {
  classroom_id: string;
  student_id: string;
  completed?: string | null;
  assigned?: string | null;
  next_up?: string | null;
  updated_by: string;
}): Promise<DbProgressNote> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_progress_notes")
    .upsert(input, { onConflict: "classroom_id,student_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function fetchPayments(): Promise<DbPayment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classroom_payments").select("*").order("month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markPaymentPaid(input: {
  teacher_id: string;
  month: string;
  amount: number;
  paid_by: string;
}): Promise<DbPayment> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_payments")
    .upsert(
      { ...input, status: "paid" as const, paid_at: new Date().toISOString() },
      { onConflict: "teacher_id,month" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
