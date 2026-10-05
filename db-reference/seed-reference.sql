-- Sample reference data so the app doesn't look empty on first run.
-- Run this AFTER schema.sql. Students/instructors/classes are left out
-- here because they need real auth.users rows — create those via the
-- Admin > Instructors page (invite flow) or Supabase Auth dashboard,
-- then insert matching `students` / `instructors` rows.

insert into departments (name, description) values
  ('Software Engineering', 'Full-stack web and mobile development'),
  ('Data Science', 'Data analysis, machine learning and statistics'),
  ('Cybersecurity', 'Network security and ethical hacking'),
  ('UI/UX Design', 'Product design and user research')
on conflict (name) do nothing;

insert into levels (name, sort_order) values
  ('Level 1', 1), ('Level 2', 2), ('Level 3', 3), ('Level 4', 4), ('Level 5', 5)
on conflict (name) do nothing;

-- Cohorts + courses reference the department/level rows above, so this
-- part is easiest to run from the SQL editor after the inserts above
-- have committed (or wrap the whole file in a single transaction).
do $$
declare
  se_id uuid;
  l1_id uuid;
begin
  select id into se_id from departments where name = 'Software Engineering';
  select id into l1_id from levels where name = 'Level 1';

  insert into cohorts (department_id, level_id, name, start_date)
  values (se_id, l1_id, 'August 2026', '2026-08-01')
  on conflict do nothing;

  insert into courses (department_id, name, code) values
    (se_id, 'HTML & CSS', 'SE101'),
    (se_id, 'JavaScript', 'SE102'),
    (se_id, 'React', 'SE201'),
    (se_id, 'Node.js', 'SE202'),
    (se_id, 'Databases', 'SE203'),
    (se_id, 'Git & GitHub', 'SE104')
  on conflict do nothing;
end $$;
