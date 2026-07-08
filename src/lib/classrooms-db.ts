/*
 * ─── Supabase Setup — run once in the SQL Editor ────────────────────────────
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
 *   id           uuid primary key default gen_random_uuid(),
 *   course_id    uuid references courses(id) on delete set null,
 *   name         text not null,
 *   teacher_id   text not null,     -- User.id
 *   teacher_name text not null,
 *   description  text,
 *   join_code    text unique not null,
 *   created_at   timestamptz not null default now()
 * );
 *
 * create table if not exists classroom_students (
 *   id            uuid primary key default gen_random_uuid(),
 *   classroom_id  uuid not null references classrooms(id) on delete cascade,
 *   student_id    text not null,    -- User.id
 *   student_name  text not null,
 *   student_email text,
 *   enrolled_at   timestamptz not null default now(),
 *   unique (classroom_id, student_id)
 * );
 *
 * alter table courses            enable row level security;
 * alter table classrooms         enable row level security;
 * alter table classroom_students enable row level security;
 * create policy "all_courses"    on courses            for all using (true) with check (true);
 * create policy "all_rooms"      on classrooms         for all using (true) with check (true);
 * create policy "all_enrollments"on classroom_students for all using (true) with check (true);
 *
 * alter publication supabase_realtime add table courses;
 * alter publication supabase_realtime add table classrooms;
 * alter publication supabase_realtime add table classroom_students;
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "./supabase";

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
  join_code: string;
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

export function genJoinCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
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
