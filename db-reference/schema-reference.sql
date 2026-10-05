-- =====================================================================
-- SQI College of ICT — Academic Management Platform
-- Phase 1 Schema: Auth, Departments, Levels, Cohorts, Courses,
--                  Students, Instructors, Classes, Schedules,
--                  Attendance, Student Balances
-- Target: Supabase (Postgres + Row Level Security)
-- =====================================================================
-- Run this in the Supabase SQL editor, or via `supabase db push`.
-- This file is idempotent-ish (uses IF NOT EXISTS / drop-then-create
-- for policies) so it can be re-run while iterating.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. ROLES / PROFILES
-- ---------------------------------------------------------------------
-- Supabase Auth already gives us `auth.users`. We attach a `profiles`
-- row to every auth user to carry role + display info.

create type user_role as enum ('super_admin', 'instructor', 'student');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. DEPARTMENTS / LEVELS / COHORTS / COURSES
-- ---------------------------------------------------------------------

create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists levels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,               -- e.g. "Level 1"
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (name)
);

create table if not exists cohorts (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid not null references departments(id) on delete cascade,
  level_id uuid not null references levels(id) on delete cascade,
  name text not null,                -- e.g. "August 2026"
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (department_id, level_id, name)
);

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. STUDENTS / INSTRUCTORS (extend profiles)
-- ---------------------------------------------------------------------

create table if not exists students (
  id uuid primary key references profiles(id) on delete cascade,
  department_id uuid not null references departments(id),
  level_id uuid not null references levels(id),
  cohort_id uuid not null references cohorts(id),
  total_fee numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists instructors (
  id uuid primary key references profiles(id) on delete cascade,
  department_id uuid not null references departments(id),
  created_at timestamptz not null default now()
);

-- Which level/cohort/course combinations an instructor teaches.
-- This is the join table that drives "instructor can only see THEIR
-- students" everywhere in the app, including balances.
create table if not exists instructor_assignments (
  id uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references instructors(id) on delete cascade,
  department_id uuid not null references departments(id),
  level_id uuid not null references levels(id),
  cohort_id uuid not null references cohorts(id),
  course_id uuid references courses(id),
  created_at timestamptz not null default now(),
  unique (instructor_id, cohort_id, course_id)
);

-- ---------------------------------------------------------------------
-- 4. CLASSES / SCHEDULES
-- ---------------------------------------------------------------------

create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid not null references departments(id),
  level_id uuid not null references levels(id),
  cohort_id uuid not null references cohorts(id),
  course_id uuid not null references courses(id),
  instructor_id uuid not null references instructors(id),
  class_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  meeting_link text,
  created_at timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);

create index if not exists idx_classes_instructor_date on classes (instructor_id, class_date);
create index if not exists idx_classes_cohort_date on classes (cohort_id, class_date);

-- ---------------------------------------------------------------------
-- 5. ATTENDANCE
-- ---------------------------------------------------------------------

create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null,
  marked_by uuid not null references instructors(id),
  marked_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists idx_attendance_student on attendance (student_id);

-- ---------------------------------------------------------------------
-- 6. STUDENT BALANCES (manual fee tracking — NOT a payment processor)
-- ---------------------------------------------------------------------
-- `students.total_fee` / `students.amount_paid` hold the running
-- totals shown on dashboards. `balance_entries` is the audit trail of
-- each manual adjustment an instructor/admin records (e.g. "paid
-- ₦50,000 on 2026-09-10"). Outstanding balance is always derived,
-- never stored redundantly, so it can't drift out of sync.

create table if not exists balance_entries (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(12,2) not null,       -- positive = payment recorded
  note text,
  recorded_by uuid not null references profiles(id),
  recorded_at timestamptz not null default now()
);

create index if not exists idx_balance_entries_student on balance_entries (student_id);

-- Convenience view: outstanding balance + status per student
create or replace view student_balance_summary as
select
  s.id as student_id,
  s.total_fee,
  s.amount_paid,
  (s.total_fee - s.amount_paid) as outstanding,
  case
    when s.amount_paid >= s.total_fee then 'fully_paid'
    when s.amount_paid > 0 then 'partially_paid'
    else 'outstanding'
  end as status
from students s;

-- ---------------------------------------------------------------------
-- 7. HELPER FUNCTIONS (used by RLS policies below)
-- ---------------------------------------------------------------------

create or replace function current_role_is(check_role user_role)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = check_role
  );
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
  select current_role_is('super_admin');
$$;

-- Is the currently-authenticated instructor assigned to this student's
-- cohort (i.e. do they teach this student)?
create or replace function instructor_teaches_student(target_student_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from students st
    join instructor_assignments ia
      on ia.cohort_id = st.cohort_id
    where st.id = target_student_id
      and ia.instructor_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table departments enable row level security;
alter table levels enable row level security;
alter table cohorts enable row level security;
alter table courses enable row level security;
alter table students enable row level security;
alter table instructors enable row level security;
alter table instructor_assignments enable row level security;
alter table classes enable row level security;
alter table attendance enable row level security;
alter table balance_entries enable row level security;

-- --- profiles: everyone can read their own profile; admin reads all
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles
  for all using (is_admin()) with check (is_admin());

-- --- reference tables: readable by anyone authenticated, writable by admin only
drop policy if exists departments_read on departments;
create policy departments_read on departments for select using (auth.role() = 'authenticated');
drop policy if exists departments_admin_write on departments;
create policy departments_admin_write on departments for all using (is_admin()) with check (is_admin());

drop policy if exists levels_read on levels;
create policy levels_read on levels for select using (auth.role() = 'authenticated');
drop policy if exists levels_admin_write on levels;
create policy levels_admin_write on levels for all using (is_admin()) with check (is_admin());

drop policy if exists cohorts_read on cohorts;
create policy cohorts_read on cohorts for select using (auth.role() = 'authenticated');
drop policy if exists cohorts_admin_write on cohorts;
create policy cohorts_admin_write on cohorts for all using (is_admin()) with check (is_admin());

drop policy if exists courses_read on courses;
create policy courses_read on courses for select using (auth.role() = 'authenticated');
drop policy if exists courses_admin_write on courses;
create policy courses_admin_write on courses for all using (is_admin()) with check (is_admin());

-- --- students: a student sees only themself; an instructor sees only
-- students in a cohort they are assigned to; admin sees all.
drop policy if exists students_select on students;
create policy students_select on students
  for select using (
    id = auth.uid()
    or is_admin()
    or exists (
      select 1 from instructor_assignments ia
      where ia.instructor_id = auth.uid() and ia.cohort_id = students.cohort_id
    )
  );

drop policy if exists students_admin_write on students;
create policy students_admin_write on students for all using (is_admin()) with check (is_admin());

-- --- instructors: readable by all authenticated (needed for schedules
-- to show instructor names); writable by admin only.
drop policy if exists instructors_read on instructors;
create policy instructors_read on instructors for select using (auth.role() = 'authenticated');
drop policy if exists instructors_admin_write on instructors;
create policy instructors_admin_write on instructors for all using (is_admin()) with check (is_admin());

drop policy if exists instructor_assignments_read on instructor_assignments;
create policy instructor_assignments_read on instructor_assignments
  for select using (instructor_id = auth.uid() or is_admin());
drop policy if exists instructor_assignments_admin_write on instructor_assignments;
create policy instructor_assignments_admin_write on instructor_assignments
  for all using (is_admin()) with check (is_admin());

-- --- classes: a student sees classes for their own cohort; an
-- instructor sees their own classes; admin sees all.
drop policy if exists classes_select on classes;
create policy classes_select on classes
  for select using (
    is_admin()
    or instructor_id = auth.uid()
    or exists (
      select 1 from students st
      where st.id = auth.uid() and st.cohort_id = classes.cohort_id
    )
  );

drop policy if exists classes_instructor_write on classes;
create policy classes_instructor_write on classes
  for insert with check (instructor_id = auth.uid() or is_admin());
drop policy if exists classes_instructor_update on classes;
create policy classes_instructor_update on classes
  for update using (instructor_id = auth.uid() or is_admin());
drop policy if exists classes_admin_delete on classes;
create policy classes_admin_delete on classes
  for delete using (is_admin());

-- --- attendance: student sees only their own rows; instructor sees
-- rows for classes they teach; admin sees all.
drop policy if exists attendance_select on attendance;
create policy attendance_select on attendance
  for select using (
    student_id = auth.uid()
    or is_admin()
    or exists (select 1 from classes c where c.id = attendance.class_id and c.instructor_id = auth.uid())
  );

drop policy if exists attendance_instructor_write on attendance;
create policy attendance_instructor_write on attendance
  for insert with check (
    is_admin()
    or exists (select 1 from classes c where c.id = attendance.class_id and c.instructor_id = auth.uid())
  );
drop policy if exists attendance_instructor_update on attendance;
create policy attendance_instructor_update on attendance
  for update using (
    is_admin()
    or exists (select 1 from classes c where c.id = attendance.class_id and c.instructor_id = auth.uid())
  );

-- --- balance_entries: THIS is the core privacy rule from the brief.
--   * A student may see only their own balance entries.
--   * An instructor may see entries only for students they teach —
--     never another instructor's students.
--   * Admin sees everything.
drop policy if exists balance_entries_select on balance_entries;
create policy balance_entries_select on balance_entries
  for select using (
    student_id = auth.uid()
    or is_admin()
    or instructor_teaches_student(student_id)
  );

drop policy if exists balance_entries_insert on balance_entries;
create policy balance_entries_insert on balance_entries
  for insert with check (
    is_admin()
    or instructor_teaches_student(student_id)
  );

-- Students table itself also carries total_fee/amount_paid — the same
-- students_select policy above already restricts who can read a given
-- student row, so the balance fields on `students` inherit the same
-- protection automatically. No separate policy needed.

-- ---------------------------------------------------------------------
-- 9. SCHEDULE CONFLICT CHECK (server-side function, called from API
--    before inserting/updating a class)
-- ---------------------------------------------------------------------

create or replace function has_schedule_conflict(
  p_instructor_id uuid,
  p_cohort_id uuid,
  p_class_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_class_id uuid default null
) returns table (conflict_type text, conflicting_class_id uuid) as $$
begin
  return query
  select 'instructor'::text, c.id
  from classes c
  where c.instructor_id = p_instructor_id
    and c.class_date = p_class_date
    and (c.id != p_exclude_class_id or p_exclude_class_id is null)
    and (p_start_time, p_end_time) overlaps (c.start_time, c.end_time)
  union all
  select 'cohort'::text, c.id
  from classes c
  where c.cohort_id = p_cohort_id
    and c.class_date = p_class_date
    and (c.id != p_exclude_class_id or p_exclude_class_id is null)
    and (p_start_time, p_end_time) overlaps (c.start_time, c.end_time);
end;
$$ language plpgsql stable;
