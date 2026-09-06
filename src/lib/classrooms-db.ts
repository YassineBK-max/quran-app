/*
 * ─── Supabase Setup — run once in the SQL Editor (safe to re-run) ───────────
 *
 * create table if not exists courses (
 *   id          uuid primary key default gen_random_uuid(),
 *   name        text not null,
 *   description text,
 *   created_by  text not null,      -- User.id of creator
 *   created_at  timestamptz not null default now()
 * );
 *
 * create table if not exists classrooms (
 *   id            uuid primary key default gen_random_uuid(),
 *   course_id     uuid references courses(id) on delete set null,
 *   name          text not null,
 *   teacher_id    text not null,     -- User.id (legacy — may not resolve across devices)
 *   teacher_name  text not null,
 *   teacher_email text,              -- stable cross-device identity for the teacher
 *   description   text,
 *   join_code     text unique not null,
 *   hourly_rate   numeric,           -- pay rate for this class, admin-set
 *   created_at    timestamptz not null default now()
 * );
 * alter table classrooms add column if not exists teacher_email text;
 * alter table classrooms add column if not exists hourly_rate numeric;
 *
 * create table if not exists classroom_students (
 *   id            uuid primary key default gen_random_uuid(),
 *   classroom_id  uuid not null references classrooms(id) on delete cascade,
 *   student_id    text not null,    -- User.id (legacy — may not resolve across devices)
 *   student_name  text not null,
 *   student_email text,             -- stable cross-device identity for the student
 *   enrolled_at   timestamptz not null default now(),
 *   unique (classroom_id, student_id)
 * );
 *
 * create table if not exists classroom_assignments (
 *   id           uuid primary key default gen_random_uuid(),
 *   classroom_id uuid not null references classrooms(id) on delete cascade,
 *   title        text not null,
 *   description  text,
 *   due_date     date,
 *   created_at   timestamptz not null default now()
 * );
 *
 * create table if not exists classroom_attendance (
 *   id             uuid primary key default gen_random_uuid(),
 *   classroom_id   uuid not null references classrooms(id) on delete cascade,
 *   student_email  text not null,
 *   student_name   text not null,
 *   date           date not null,
 *   status         text not null check (status in ('present','late','absent','excused')),
 *   hours          numeric not null default 1,
 *   marked_by_email text,
 *   marked_at      timestamptz not null default now(),
 *   unique (classroom_id, student_email, date)
 * );
 *
 * create table if not exists classroom_progress_notes (
 *   classroom_id    uuid not null references classrooms(id) on delete cascade,
 *   student_email   text not null,
 *   completed       text,
 *   assigned        text,
 *   next_up         text,
 *   updated_by_email text,
 *   updated_at      timestamptz not null default now(),
 *   primary key (classroom_id, student_email)
 * );
 *
 * create table if not exists classroom_payments (
 *   id             uuid primary key default gen_random_uuid(),
 *   teacher_email  text not null,
 *   month          text not null,   -- 'YYYY-MM'
 *   amount         numeric not null,
 *   status         text not null check (status in ('pending','paid')),
 *   paid_at        timestamptz,
 *   paid_by_email  text,
 *   created_at     timestamptz not null default now(),
 *   unique (teacher_email, month)
 * );
 *
 * alter table courses                 enable row level security;
 * alter table classrooms              enable row level security;
 * alter table classroom_students      enable row level security;
 * alter table classroom_assignments   enable row level security;
 * alter table classroom_attendance    enable row level security;
 * alter table classroom_progress_notes enable row level security;
 * alter table classroom_payments      enable row level security;
 *
 * drop policy if exists "all_courses"     on courses;
 * drop policy if exists "all_rooms"       on classrooms;
 * drop policy if exists "all_enrollments" on classroom_students;
 * drop policy if exists "all_assignments" on classroom_assignments;
 * drop policy if exists "all_attendance"  on classroom_attendance;
 * drop policy if exists "all_progress"    on classroom_progress_notes;
 * drop policy if exists "all_payments"    on classroom_payments;
 * create policy "all_courses"     on courses                  for all using (true) with check (true);
 * create policy "all_rooms"       on classrooms                for all using (true) with check (true);
 * create policy "all_enrollments" on classroom_students        for all using (true) with check (true);
 * create policy "all_assignments" on classroom_assignments     for all using (true) with check (true);
 * create policy "all_attendance"  on classroom_attendance      for all using (true) with check (true);
 * create policy "all_progress"    on classroom_progress_notes  for all using (true) with check (true);
 * create policy "all_payments"    on classroom_payments        for all using (true) with check (true);
 *
 * do $$ begin
 *   alter publication supabase_realtime add table courses;
 *   alter publication supabase_realtime add table classrooms;
 *   alter publication supabase_realtime add table classroom_students;
 *   alter publication supabase_realtime add table classroom_assignments;
 *   alter publication supabase_realtime add table classroom_attendance;
 *   alter publication supabase_realtime add table classroom_progress_notes;
 *   alter publication supabase_realtime add table classroom_payments;
 * exception when duplicate_object then null; end $$;
 *
 * NOTE on identity: this app's accounts live in browser localStorage, not a
 * shared users table, so a person's User.id is different on every device
 * they sign up from. Anything that must resolve correctly across devices
 * (which teacher owns a class, which student is enrolled) is matched by
 * EMAIL, not by User.id — see teacher_email / student_email above and the
 * matching helpers in ClassroomsDbContext. User.id columns are kept only as
 * legacy/display fields.
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
  teacher_email: string | null;
  description: string | null;
  join_code: string;
  hourly_rate: number | null;
  created_at: string;
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
  student_email: string;
  student_name: string;
  date: string;
  status: DbAttendanceStatus;
  hours: number;
  marked_by_email: string | null;
  marked_at: string;
}

export interface DbProgressNote {
  classroom_id: string;
  student_email: string;
  completed: string | null;
  assigned: string | null;
  next_up: string | null;
  updated_by_email: string | null;
  updated_at: string;
}

export type DbPaymentStatus = "pending" | "paid";

export interface DbPayment {
  id: string;
  teacher_email: string;
  month: string;
  amount: number;
  status: DbPaymentStatus;
  paid_at: string | null;
  paid_by_email: string | null;
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

export async function fetchClassrooms(): Promise<DbClassroom[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("classrooms").select("*").order("created_at");
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

export async function fetchClassroomByCode(code: string): Promise<DbClassroom | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("classrooms").select("*").eq("join_code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateClassroomRate(id: string, hourlyRate: number): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("classrooms").update({ hourly_rate: hourlyRate }).eq("id", id);
  if (error) throw error;
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
  student_email: string;
  student_name: string;
  date: string;
  status: DbAttendanceStatus;
  hours: number;
  marked_by_email: string;
}): Promise<DbAttendanceRecord> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_attendance")
    .upsert(input, { onConflict: "classroom_id,student_email,date" })
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
  student_email: string;
  completed?: string | null;
  assigned?: string | null;
  next_up?: string | null;
  updated_by_email: string;
}): Promise<DbProgressNote> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_progress_notes")
    .upsert(input, { onConflict: "classroom_id,student_email" })
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
  teacher_email: string;
  month: string;
  amount: number;
  paid_by_email: string;
}): Promise<DbPayment> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("classroom_payments")
    .upsert(
      { ...input, status: "paid" as const, paid_at: new Date().toISOString() },
      { onConflict: "teacher_email,month" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
