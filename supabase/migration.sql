-- ═══════════════════════════════════════════════════════════════════════════
-- The Quran Academy — full schema, run once in the Supabase SQL Editor.
-- Safe to re-run (every statement is idempotent).
--
-- Accounts live entirely in Supabase Auth: passwords are hashed and verified
-- by Supabase itself, never by app code. Every table below is locked down
-- with real row-level security tied to auth.uid().
--
-- SECURITY NOTE (read this if you're diffing against an earlier version of
-- this file): the first version of this migration put `parent_code` on
-- `profiles` and `join_code`/`hourly_rate` on `classrooms`, both readable by
-- any authenticated user via a broad SELECT policy. Postgres RLS is
-- row-level only — it cannot hide a column for some rows and show it for
-- others — so that broad policy exposed every student's parent-linking
-- secret and every classroom's invite code and every teacher's pay rate to
-- every signed-in account. Those three fields now live in their own
-- narrowly-scoped tables (`parent_codes`, `classroom_private`) instead, so
-- the general roster/classroom-list policies can stay broad (which the app
-- needs, e.g. to show classmates or look up a classroom to join) without
-- ever exposing the secrets themselves.
--
-- IF THIS ERRORS WITH "operator does not exist: text = uuid": one of
-- courses / classrooms / classroom_students / availability_slots / bookings
-- already existed in your project from the app's ORIGINAL setup, back when
-- teacher_id/student_id/created_by were plain `text` holding old
-- localStorage-style ids instead of `uuid references profiles(id)`.
-- `create table if not exists` skips a table that's already there, so the
-- new uuid-typed policies below then get compared against the old text
-- column. Every other table here is new as of this migration and can't
-- have this problem. Fix (deletes whatever's currently in those 5 tables —
-- fine pre-launch, not fine if you have real data in them):
--   drop table if exists bookings cascade;
--   drop table if exists availability_slots cascade;
--   drop table if exists classroom_students cascade;
--   drop table if exists classrooms cascade;
--   drop table if exists courses cascade;
-- Then run this whole file again.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Profiles (1:1 with Supabase Auth users) ─────────────────────────────────

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  name             text not null,
  display_name     text,
  role             text not null default 'student' check (role in ('admin','teacher','student','parent')),
  profile_photo    text,                            -- base64 photo
  class_id         text,                             -- legacy local-classroom primary class (unrelated to Course Classrooms below)
  class_ids        text[] not null default '{}',
  parent_ids       uuid[] not null default '{}',      -- students: linked parent profile ids
  linked_child_id  uuid,                              -- parents: legacy-compat first linked child
  linked_child_ids uuid[] not null default '{}',      -- parents: all linked children
  created_at       timestamptz not null default now()
);
-- Drop the old parent_code column if it exists from an earlier run of this
-- file — the code now lives in parent_codes below.
alter table profiles drop column if exists parent_code;

alter table profiles enable row level security;

create or replace function is_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

-- Any signed-in user can read the roster (name/role/email/links) — matches
-- the app's existing behavior of showing classmates/teachers to each other.
-- Nobody who is only holding the public anon key (i.e. not signed in) can
-- read anything here. No secret lives on this table any more (see note above).
drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles
  for update using (is_admin(auth.uid()));

-- Blocks a non-admin from changing their own role/email via a plain UPDATE.
create or replace function protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.email is distinct from old.email)
     and not is_admin(auth.uid()) then
    raise exception 'Only an admin can change role or email.';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_columns_trigger on profiles;
create trigger protect_profile_columns_trigger
  before update on profiles for each row execute function protect_profile_columns();

-- parent_ids / linked_child_id / linked_child_ids must only ever change via
-- link_child_to_parent() below (which validates a real parent_code) — never
-- via a direct client UPDATE, which would let anyone declare themselves the
-- parent of any student they merely know the id of. Table owners (and so
-- SECURITY DEFINER functions owned by the table owner, like the one below)
-- are unaffected by this revoke, so link_child_to_parent keeps working.
revoke update (parent_ids, linked_child_id, linked_child_ids) on profiles from authenticated;

-- ── Parent-linking codes ─────────────────────────────────────────────────
-- Split out from `profiles` so the code is never exposed by the broad
-- roster SELECT policy above — only its owner (the student) can read it,
-- and link_child_to_parent() (SECURITY DEFINER) can look it up server-side.

create table if not exists parent_codes (
  student_id  uuid primary key references profiles(id) on delete cascade,
  code        text unique not null,
  created_at  timestamptz not null default now()
);
alter table parent_codes enable row level security;

-- Own code, or an admin (e.g. to help a parent who lost it — teachers don't
-- get this: which students belong to which teacher lives only in the app's
-- separate local classroom list, not in a table Postgres can check).
drop policy if exists "parent_codes_select_own" on parent_codes;
create policy "parent_codes_select_own" on parent_codes
  for select using (student_id = auth.uid() or is_admin(auth.uid()));
-- No insert/update/delete policy for clients: rows are created only by
-- handle_new_user() below (SECURITY DEFINER, bypasses RLS as table owner).

-- 8-char parent-linking code, same alphabet the app used to generate client-side.
create or replace function generate_parent_code()
returns text language plpgsql volatile as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- Fires when Supabase Auth creates a new account (email+password signup).
-- Nobody can self-assign 'admin' -- only the two seeded emails get it,
-- exactly like the old SEEDED_ADMIN_EMAILS list. Edit the emails below to
-- change who the admins are.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'student');
  final_role text;
  attempt int;
begin
  if lower(new.email) = any (array[
    'kassab.salaheddine@gmail.com',
    'yassinebouaoudatekhaffane@gmail.com'
  ]) then
    final_role := 'admin';
  elsif requested_role in ('teacher','student','parent') then
    final_role := requested_role;
  else
    final_role := 'student';
  end if;

  insert into profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    final_role
  )
  on conflict (id) do nothing;

  -- generate_parent_code() picks from a ~2.8e12-combination space, so a
  -- collision with an existing student's code is very unlikely at this
  -- app's scale, but "unlikely" isn't "never" once enough people sign up —
  -- and unlike `on conflict (student_id)` below (which only covers a retry
  -- of the SAME signup), a collision with SOMEONE ELSE's code hits the
  -- `code unique` constraint instead, which nothing here was catching, so
  -- it would abort this entire signup with an opaque error. Retry with a
  -- fresh code a few times before giving up for real.
  if final_role = 'student' then
    attempt := 0;
    loop
      begin
        insert into parent_codes (student_id, code)
        values (new.id, generate_parent_code())
        on conflict (student_id) do nothing;
        exit;
      exception when unique_violation then
        attempt := attempt + 1;
        if attempt >= 10 then
          raise exception 'Could not generate a unique parent code — please try signing up again.';
        end if;
      end;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- Admin-only account deletion. Removing the auth.users row cascades to
-- profiles (and, via foreign keys below, to that person's classrooms/
-- enrollments/etc). If this errors with a permissions message in your
-- project, delete the user from the Supabase Dashboard's Authentication ->
-- Users page instead -- same end result.
create or replace function admin_delete_user(target_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'Admin only.';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

-- Lets a signed-in parent link a student to their account by the student's
-- parent_code. SECURITY DEFINER so it can both read parent_codes (owned by
-- the student, not the caller) and write parent_ids on the STUDENT's row
-- (which the parent doesn't own, so a direct UPDATE is correctly refused by
-- profiles_update_own) as well as their own linked_child_ids.
create or replace function link_child_to_parent(code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
  target_student_id uuid;
begin
  select role into caller_role from profiles where id = auth.uid();
  if caller_role is distinct from 'parent' then
    raise exception 'You must be logged in as a parent.';
  end if;

  select student_id into target_student_id from parent_codes where code = upper(code);
  if target_student_id is null then
    raise exception 'No student found with that code.';
  end if;
  if target_student_id = auth.uid() then
    raise exception 'You cannot link yourself.';
  end if;

  update profiles
    set parent_ids = case when auth.uid() = any(parent_ids) then parent_ids else array_append(parent_ids, auth.uid()) end
    where id = target_student_id;

  update profiles
    set linked_child_ids = case when target_student_id = any(linked_child_ids) then linked_child_ids else array_append(linked_child_ids, target_student_id) end,
        linked_child_id = coalesce(linked_child_id, target_student_id)
    where id = auth.uid();
end;
$$;

-- ── Courses ──────────────────────────────────────────────────────────────

create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table courses enable row level security;

drop policy if exists "courses_select" on courses;
create policy "courses_select" on courses for select using (auth.role() = 'authenticated');
drop policy if exists "courses_insert" on courses;
create policy "courses_insert" on courses for insert with check (
  created_by = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
drop policy if exists "courses_delete" on courses;
create policy "courses_delete" on courses for delete using (is_admin(auth.uid()));

-- ── Classrooms ───────────────────────────────────────────────────────────
-- Public fields only (name, description, teacher). The invite code and pay
-- rate are NOT here — see classroom_private below.

create table if not exists classrooms (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references courses(id) on delete set null,
  name         text not null,
  teacher_id   uuid not null references profiles(id) on delete cascade,
  teacher_name text not null,
  description  text,
  created_at   timestamptz not null default now()
);
-- Drop columns left over from an earlier run of this file.
alter table classrooms drop column if exists join_code;
alter table classrooms drop column if exists hourly_rate;

alter table classrooms enable row level security;

-- "is this classroom mine to manage" — defined here (right after classrooms)
-- since everything below depends on it, including classroom_private's policy.
create or replace function can_manage_classroom(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classrooms where id = cid and teacher_id = auth.uid()) or is_admin(auth.uid());
$$;

drop policy if exists "classrooms_select" on classrooms;
create policy "classrooms_select" on classrooms for select using (auth.role() = 'authenticated');
drop policy if exists "classrooms_insert" on classrooms;
create policy "classrooms_insert" on classrooms for insert with check (
  teacher_id = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
drop policy if exists "classrooms_update" on classrooms;
create policy "classrooms_update" on classrooms for update using (is_admin(auth.uid()));
drop policy if exists "classrooms_delete" on classrooms;
create policy "classrooms_delete" on classrooms for delete using (
  teacher_id = auth.uid() or is_admin(auth.uid())
);

-- ── Classroom private data (invite code + pay rate) ─────────────────────
-- Only the teacher(s) who manage a classroom (or an admin) can see its
-- join_code or hourly_rate. Nobody can read another classroom's invite code
-- by browsing — the only way to enroll with a code you weren't directly
-- given is through join_classroom_by_code() below, which never returns the
-- code table to the client.

create table if not exists classroom_private (
  classroom_id uuid primary key references classrooms(id) on delete cascade,
  join_code    text unique not null,
  hourly_rate  numeric
);
alter table classroom_private enable row level security;

drop policy if exists "classroom_private_select" on classroom_private;
create policy "classroom_private_select" on classroom_private for select using (
  can_manage_classroom(classroom_id)
);
drop policy if exists "classroom_private_insert" on classroom_private;
create policy "classroom_private_insert" on classroom_private for insert with check (
  exists (select 1 from classrooms where id = classroom_id and teacher_id = auth.uid())
);
drop policy if exists "classroom_private_update" on classroom_private;
create policy "classroom_private_update" on classroom_private for update using (
  is_admin(auth.uid())
);

-- ── Enrollments ──────────────────────────────────────────────────────────

create table if not exists classroom_students (
  id            uuid primary key default gen_random_uuid(),
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  student_name  text not null,
  student_email text,
  enrolled_at   timestamptz not null default now(),
  unique (classroom_id, student_id)
);
alter table classroom_students enable row level security;

create or replace function is_enrolled_in(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classroom_students where classroom_id = cid and student_id = auth.uid());
$$;

drop policy if exists "enrollments_select" on classroom_students;
create policy "enrollments_select" on classroom_students for select using (
  student_id = auth.uid() or can_manage_classroom(classroom_id)
);
-- Students can no longer self-insert here directly (that let anyone
-- enumerate classroom ids via classrooms_select and join without ever
-- knowing the invite code). Self-enrollment now only happens through
-- join_classroom_by_code() below. Teachers/admins can still add a student
-- to their own classroom manually.
drop policy if exists "enrollments_insert" on classroom_students;
create policy "enrollments_insert" on classroom_students for insert with check (
  can_manage_classroom(classroom_id)
);
drop policy if exists "enrollments_delete" on classroom_students;
create policy "enrollments_delete" on classroom_students for delete using (
  can_manage_classroom(classroom_id)
);

-- Validates a join code server-side and enrolls the caller — the only path
-- for a student to join a classroom they weren't manually added to.
create or replace function join_classroom_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target_classroom_id uuid;
  caller_name text;
  caller_email text;
begin
  select classroom_id into target_classroom_id from classroom_private where join_code = upper(p_code);
  if target_classroom_id is null then
    raise exception 'Classroom not found. Check the code and try again.';
  end if;

  if exists (select 1 from classroom_students where classroom_id = target_classroom_id and student_id = auth.uid()) then
    raise exception 'You are already enrolled in this classroom.';
  end if;

  select coalesce(display_name, name), email into caller_name, caller_email from profiles where id = auth.uid();

  insert into classroom_students (classroom_id, student_id, student_name, student_email)
  values (target_classroom_id, auth.uid(), coalesce(caller_name, 'Student'), caller_email);

  return target_classroom_id;
end;
$$;

-- ── Assignments ──────────────────────────────────────────────────────────

create table if not exists classroom_assignments (
  id           uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     date,
  created_at   timestamptz not null default now()
);
alter table classroom_assignments enable row level security;

drop policy if exists "assignments_select" on classroom_assignments;
create policy "assignments_select" on classroom_assignments for select using (
  is_enrolled_in(classroom_id) or can_manage_classroom(classroom_id)
);
drop policy if exists "assignments_write" on classroom_assignments;
create policy "assignments_write" on classroom_assignments for all using (
  can_manage_classroom(classroom_id)
) with check (
  can_manage_classroom(classroom_id)
);

-- ── Attendance ───────────────────────────────────────────────────────────

create table if not exists classroom_attendance (
  id            uuid primary key default gen_random_uuid(),
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  student_name  text not null,
  date          date not null,
  status        text not null check (status in ('present','late','absent','excused')),
  hours         numeric not null default 1,
  marked_by     uuid references profiles(id) on delete set null,
  marked_at     timestamptz not null default now(),
  unique (classroom_id, student_id, date)
);
alter table classroom_attendance enable row level security;

drop policy if exists "attendance_select" on classroom_attendance;
create policy "attendance_select" on classroom_attendance for select using (
  student_id = auth.uid() or can_manage_classroom(classroom_id)
);
drop policy if exists "attendance_write" on classroom_attendance;
create policy "attendance_write" on classroom_attendance for all using (
  can_manage_classroom(classroom_id)
) with check (
  can_manage_classroom(classroom_id)
);

-- ── Progress notes ───────────────────────────────────────────────────────

create table if not exists classroom_progress_notes (
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  completed     text,
  assigned      text,
  next_up       text,
  updated_by    uuid references profiles(id) on delete set null,
  updated_at    timestamptz not null default now(),
  primary key (classroom_id, student_id)
);
alter table classroom_progress_notes enable row level security;

drop policy if exists "progress_select" on classroom_progress_notes;
create policy "progress_select" on classroom_progress_notes for select using (
  student_id = auth.uid() or can_manage_classroom(classroom_id)
);
drop policy if exists "progress_write" on classroom_progress_notes;
create policy "progress_write" on classroom_progress_notes for all using (
  can_manage_classroom(classroom_id)
) with check (
  can_manage_classroom(classroom_id)
);

-- ── Payments ─────────────────────────────────────────────────────────────

create table if not exists classroom_payments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references profiles(id) on delete cascade,
  month        text not null,   -- 'YYYY-MM'
  amount       numeric not null,
  status       text not null check (status in ('pending','paid')),
  paid_at      timestamptz,
  paid_by      uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (teacher_id, month)
);
alter table classroom_payments enable row level security;

drop policy if exists "payments_select" on classroom_payments;
create policy "payments_select" on classroom_payments for select using (
  teacher_id = auth.uid() or is_admin(auth.uid())
);
-- Only admins record a deposit ("mark as paid").
drop policy if exists "payments_write" on classroom_payments;
create policy "payments_write" on classroom_payments for all using (
  is_admin(auth.uid())
) with check (
  is_admin(auth.uid())
);

-- ── Booking (teacher availability + student bookings) ───────────────────
-- Full detail/rationale lives in the comment header of src/lib/booking.ts.
-- This used to ship with "using (true) with check (true)" on both tables —
-- meaning literally anyone holding the public anon key, logged in or not,
-- could read, create, or delete any teacher's availability or any student's
-- booking. Locked down here the same way as everything else above.

create table if not exists availability_slots (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references profiles(id) on delete cascade,
  teacher_name text not null,
  class_id     text,   -- opaque id from the app's separate local classroom list, not a real FK
  class_name   text,
  date         text not null,        -- YYYY-MM-DD
  start_time   text not null,        -- HH:MM
  end_time     text not null,        -- HH:MM
  title        text not null default 'Study Session',
  notes        text,
  max_bookings smallint not null default 1,
  booked_count integer not null default 0,  -- kept in sync by sync_slot_booked_count() below
  created_at   timestamptz not null default now()
);
alter table availability_slots enable row level security;

drop policy if exists "all_slots" on availability_slots;
drop policy if exists "slots_select" on availability_slots;
create policy "slots_select" on availability_slots for select using (auth.role() = 'authenticated');
drop policy if exists "slots_insert" on availability_slots;
create policy "slots_insert" on availability_slots for insert with check (
  teacher_id = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
drop policy if exists "slots_update" on availability_slots;
create policy "slots_update" on availability_slots for update using (
  teacher_id = auth.uid() or is_admin(auth.uid())
);
drop policy if exists "slots_delete" on availability_slots;
create policy "slots_delete" on availability_slots for delete using (
  teacher_id = auth.uid() or is_admin(auth.uid())
);

create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  slot_id      uuid not null references availability_slots(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  student_name text not null,
  status       text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  notes        text,
  created_at   timestamptz not null default now(),
  unique (slot_id, student_id)
);
alter table bookings enable row level security;

drop policy if exists "all_bookings" on bookings;
drop policy if exists "bookings_select" on bookings;
create policy "bookings_select" on bookings for select using (
  student_id = auth.uid()
  or exists (select 1 from availability_slots s where s.id = slot_id and s.teacher_id = auth.uid())
  or is_admin(auth.uid())
);
drop policy if exists "bookings_insert" on bookings;
create policy "bookings_insert" on bookings for insert with check (student_id = auth.uid());

-- The app checks max_bookings client-side before booking, but nothing
-- server-side enforced it — a direct API call, or two students racing for
-- the last spot, could overbook a slot past its stated capacity.
create or replace function enforce_slot_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap smallint;
  current_count integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;
  -- FOR UPDATE locks the slot row so two students racing for the last spot
  -- can't both read "1 left" before either commits — the classic
  -- check-then-act race. The second transaction blocks here until the
  -- first's insert commits, then re-checks against the now-current count.
  select max_bookings into cap from availability_slots where id = new.slot_id for update;
  if cap is null then
    raise exception 'Slot not found.';
  end if;
  select count(*) into current_count from bookings where slot_id = new.slot_id and status = 'confirmed';
  if current_count >= cap then
    raise exception 'No spots left in this slot.';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_slot_capacity_trigger on bookings;
create trigger enforce_slot_capacity_trigger
  before insert on bookings
  for each row execute function enforce_slot_capacity();
drop policy if exists "bookings_update" on bookings;
create policy "bookings_update" on bookings for update using (
  student_id = auth.uid()
  or exists (select 1 from availability_slots s where s.id = slot_id and s.teacher_id = auth.uid())
  or is_admin(auth.uid())
);
-- Needed even though the app never deletes a booking directly: when a
-- teacher deletes one of their own slots, the FK cascade deletes its
-- bookings too, and a cascade delete still has to pass the referencing
-- table's own RLS for the role doing the deleting.
drop policy if exists "bookings_delete" on bookings;
create policy "bookings_delete" on bookings for delete using (
  exists (select 1 from availability_slots s where s.id = slot_id and s.teacher_id = auth.uid())
  or is_admin(auth.uid())
);

-- bookings_select above correctly limits a student to seeing only their OWN
-- booking rows (not who else booked a shared slot) — but the app still
-- needs an accurate "N of M booked" count for every slot to know what's
-- full, including for students who can't see those other rows. Denormalized
-- onto availability_slots (already broadly readable) and kept in sync here,
-- rather than exposing everyone's individual bookings just to make a count.
create or replace function sync_slot_booked_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  affected_slot_id uuid := coalesce(new.slot_id, old.slot_id);
begin
  update availability_slots
    set booked_count = (select count(*) from bookings where slot_id = affected_slot_id and status = 'confirmed')
    where id = affected_slot_id;
  return null;
end;
$$;
drop trigger if exists sync_slot_booked_count_trigger on bookings;
create trigger sync_slot_booked_count_trigger
  after insert or update or delete on bookings
  for each row execute function sync_slot_booked_count();

-- ── Realtime ─────────────────────────────────────────────────────────────

do $$ begin
  alter publication supabase_realtime add table courses;
  alter publication supabase_realtime add table classrooms;
  alter publication supabase_realtime add table classroom_private;
  alter publication supabase_realtime add table classroom_students;
  alter publication supabase_realtime add table classroom_assignments;
  alter publication supabase_realtime add table classroom_attendance;
  alter publication supabase_realtime add table classroom_progress_notes;
  alter publication supabase_realtime add table classroom_payments;
  alter publication supabase_realtime add table availability_slots;
  alter publication supabase_realtime add table bookings;
exception when duplicate_object then null; end $$;
