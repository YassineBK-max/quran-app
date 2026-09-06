-- Course Classrooms schema — run this once in the Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent (create-if-not-exists,
-- add-column-if-not-exists, drop-then-create policies, DO block around the
-- realtime publication so re-adding an already-added table doesn't error).
--
-- This is a generated copy of the canonical schema documented in the
-- comment block at the top of src/lib/classrooms-db.ts — keep the two in
-- sync if you change one.

create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  text not null,      -- User.id of creator
  created_at  timestamptz not null default now()
);

create table if not exists classrooms (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid references courses(id) on delete set null,
  name          text not null,
  teacher_id    text not null,     -- User.id (legacy — may not resolve across devices)
  teacher_name  text not null,
  teacher_email text,              -- stable cross-device identity for the teacher
  description   text,
  join_code     text unique not null,
  hourly_rate   numeric,           -- pay rate for this class, admin-set
  created_at    timestamptz not null default now()
);
alter table classrooms add column if not exists teacher_email text;
alter table classrooms add column if not exists hourly_rate numeric;

create table if not exists classroom_students (
  id            uuid primary key default gen_random_uuid(),
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    text not null,    -- User.id (legacy — may not resolve across devices)
  student_name  text not null,
  student_email text,             -- stable cross-device identity for the student
  enrolled_at   timestamptz not null default now(),
  unique (classroom_id, student_id)
);

create table if not exists classroom_assignments (
  id           uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     date,
  created_at   timestamptz not null default now()
);

create table if not exists classroom_attendance (
  id             uuid primary key default gen_random_uuid(),
  classroom_id   uuid not null references classrooms(id) on delete cascade,
  student_email  text not null,
  student_name   text not null,
  date           date not null,
  status         text not null check (status in ('present','late','absent','excused')),
  hours          numeric not null default 1,
  marked_by_email text,
  marked_at      timestamptz not null default now(),
  unique (classroom_id, student_email, date)
);

create table if not exists classroom_progress_notes (
  classroom_id    uuid not null references classrooms(id) on delete cascade,
  student_email   text not null,
  completed       text,
  assigned        text,
  next_up         text,
  updated_by_email text,
  updated_at      timestamptz not null default now(),
  primary key (classroom_id, student_email)
);

create table if not exists classroom_payments (
  id             uuid primary key default gen_random_uuid(),
  teacher_email  text not null,
  month          text not null,   -- 'YYYY-MM'
  amount         numeric not null,
  status         text not null check (status in ('pending','paid')),
  paid_at        timestamptz,
  paid_by_email  text,
  created_at     timestamptz not null default now(),
  unique (teacher_email, month)
);

alter table courses                 enable row level security;
alter table classrooms              enable row level security;
alter table classroom_students      enable row level security;
alter table classroom_assignments   enable row level security;
alter table classroom_attendance    enable row level security;
alter table classroom_progress_notes enable row level security;
alter table classroom_payments      enable row level security;

drop policy if exists "all_courses"     on courses;
drop policy if exists "all_rooms"       on classrooms;
drop policy if exists "all_enrollments" on classroom_students;
drop policy if exists "all_assignments" on classroom_assignments;
drop policy if exists "all_attendance"  on classroom_attendance;
drop policy if exists "all_progress"    on classroom_progress_notes;
drop policy if exists "all_payments"    on classroom_payments;
create policy "all_courses"     on courses                  for all using (true) with check (true);
create policy "all_rooms"       on classrooms                for all using (true) with check (true);
create policy "all_enrollments" on classroom_students        for all using (true) with check (true);
create policy "all_assignments" on classroom_assignments     for all using (true) with check (true);
create policy "all_attendance"  on classroom_attendance      for all using (true) with check (true);
create policy "all_progress"    on classroom_progress_notes  for all using (true) with check (true);
create policy "all_payments"    on classroom_payments        for all using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table courses;
  alter publication supabase_realtime add table classrooms;
  alter publication supabase_realtime add table classroom_students;
  alter publication supabase_realtime add table classroom_assignments;
  alter publication supabase_realtime add table classroom_attendance;
  alter publication supabase_realtime add table classroom_progress_notes;
  alter publication supabase_realtime add table classroom_payments;
exception when duplicate_object then null; end $$;

-- NOTE on identity: this app's accounts live in browser localStorage, not a
-- shared users table, so a person's User.id is different on every device
-- they sign up from. Anything that must resolve correctly across devices
-- (which teacher owns a class, which student is enrolled) is matched by
-- EMAIL, not by User.id -- see teacher_email / student_email above and the
-- matching helpers in ClassroomsDbContext. User.id columns are kept only as
-- legacy/display fields.
