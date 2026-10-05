# Reference schema (not wired up)

These two files are leftover from an earlier Supabase-based draft of
this project. They are NOT connected to the app anymore — the
frontend now runs entirely on mock in-memory data (see
`src/lib/data/`).

They're kept here purely as a reference for entity shapes and
relationships (departments → levels → cohorts → courses → classes →
students/instructors, attendance, balance_entries, etc.) in case
they're useful while designing your own backend/database. In
particular, `schema-reference.sql` shows one way to model:

- the instructor ↔ cohort assignment table that drives "an instructor
  only sees their own students"
- the balance-privacy rule (student sees own balance only, instructor
  sees only their students' balances, admin sees all) as Postgres
  Row Level Security policies
- a schedule-conflict-detection function (instructor double-booking +
  cohort double-booking)

Feel free to delete this folder once you've designed your own schema.
