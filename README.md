# SQI College of ICT — Academic Management Platform (Frontend)

A Next.js frontend for the academic management platform. Most academic
data is still backed by a small in-memory mock layer, while admin
authentication is backed by MongoDB.

**This is a frontend scaffold you build your backend under, not a
finished product.** Read "Wiring up your own backend" below before you
start.

## Getting started

```bash
npm install
npm run dev
```

Set `URI` in `.env`, seed the MongoDB admin, and then open
`http://localhost:3000`:

```bash
npm run seed:admin
npm run dev
```

The seeded admin signs in with `admin@sqi.edu.ng` and `admin123`.
Other roles can sign in when their active accounts exist in MongoDB;
academic records remain mock data for now.

## How auth currently works

Admin login verifies a bcrypt password hash in MongoDB and stores a
signed JWT in the `sqi_session` HttpOnly cookie. Set `JWT_SECRET` to a
strong, private value in `.env.local` (and the deployment environment).
Tokens expire after seven days; each request verifies the JWT and loads
the active user from MongoDB. Run `npm run seed:admin` once to create
the default admin; the command is safe to run again.

Signing out removes the JWT and any legacy session cookie. The dashboard
uses a server action, and API clients can sign out with
`POST /api/auth/logout`. Every page calls `requireProfile()` from
`src/lib/auth.ts`, which delegates to `src/lib/mock-auth/session.ts`.

## Password changes and reset email

Active admins, instructors, and students can change their password from
the dashboard after confirming their current password, or request a
one-hour reset link from the sign-in page. Reset tokens are stored only
as hashes. Changing or resetting a password invalidates the user's
other JWT sessions.

Configure these private environment variables for Gmail OAuth2 email
delivery and the reset-link origin:

```env
APP_URL=https://your-app.example
GMAIL_USER=your-sender@gmail.com
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REFRESH_TOKEN=your-google-oauth-refresh-token
```

Use your real application URL in `APP_URL`, and keep the credentials in
`.env.local` locally and in your deployment's secret manager. The
existing Gmail app-password setting is not used by this OAuth2
transporter.

## How data currently works (and doesn't)

`src/lib/data/seed.ts` holds every "table" as a plain in-memory array
(departments, students, classes, attendance, tests, and so on).
`src/lib/data/queries.ts` is the only file that touches those arrays —
every page imports functions like `getStudentsVisibleTo()` or
`recordPayment()` from there, never `seed.ts` directly.

This matters for you because **`queries.ts` is the entire surface area
you need to replace.** Each function is already written the way an API
client would be (plain arguments in, plain data out, returns a
Promise), and the comment on each one says what real access-control
rule it's standing in for. To wire up your backend:

1. Stand up your database + API (REST, tRPC, GraphQL, whatever you
   pick — the app doesn't care).
2. Rewrite the body of each function in `queries.ts` to call your API
   (`fetch(...)`) instead of filtering the in-memory arrays.
3. Delete `seed.ts` once nothing imports it anymore.

Because pages only ever call `queries.ts`, this is a mechanical
swap — you shouldn't need to touch page components, only the data
layer underneath them.

## The balance-privacy rule, specifically

This was the one hard requirement: fee balances are a manual tracker
(no payment processor involved), and:

- A **student** can see only their own balance and payment history.
- An **instructor** can see balances only for students in cohorts
  they're assigned to (via `instructorAssignments`) — never another
  instructor's students.
- The **Super Admin** can see everyone's balance.

Right now this is enforced by `canViewBalance()` in `queries.ts`,
which every balance-related function checks before returning or
writing anything. **This is not real security** — it's a plain JS
function, so anyone with server access could bypass it by importing
`seed.ts` directly. When you build the real backend, this exact rule
needs to be enforced there too — as a database-level policy (Postgres
Row Level Security, if you go that route) or as an authorization check
in every relevant API handler. See `db-reference/schema-reference.sql`
for one worked example of doing this as Postgres RLS, left over from
an earlier draft of this project.

## What's built

**Phase 1 — Core**

- Departments, instructors, students rosters (admin)
- Class scheduling with conflict detection (`/api/classes`,
  `findScheduleConflicts()` — checks instructor double-booking and
  cohort double-booking on the same day)
- Attendance marking (instructor) and history (student)
- Manual balance/payment recording (instructor, admin) and read-only
  balance view (student), with the privacy rule above

**Phase 2 — Academic activities**

- Tests: student take-a-test flow with auto-grading of objective
  questions; instructor/admin listing
- Assignments: student submission flow; instructor grading with
  feedback; admin overview
- Practice questions: one-question-at-a-time quiz with
  attempted/accuracy/streak tracking
- Interview prep: department-scoped question bank with an
  expand-for-tips accordion

**Phase 4 — Leaderboards**

- Computed from tests (40%), assignments (25%), practice (20%), and
  attendance (15%) — weights live in `queries.ts` (`WEIGHTS`) and are
  meant to become an admin-configurable setting later
- Students only ever see their own department's board; instructors and
  admin can switch between departments

**Not built:** notifications are listed and readable but nothing
currently generates new ones automatically (e.g. "a test was
published" doesn't yet create a notification row) — that logic belongs
in your backend once actions like publishing a test go through a real
API. CSV/PDF export and admin-configurable leaderboard weights (Phase
3/4 extras) also aren't built.

## Project layout

```
db-reference/          Leftover Supabase schema from an earlier draft —
                        reference only, not wired up (see its own README)
src/
  app/
    login/              Demo user picker
    admin/               Super Admin pages
    instructor/          Instructor pages
    student/              Student pages
    api/classes/          Schedule-conflict-checked class creation
  components/            Shared UI (StatCard, DashboardShell, AttendanceMarker,
                          BalanceBadge, TestTaker, PracticeQuiz, LeaderboardTable, etc.)
  lib/
    data/
      seed.ts             The in-memory "database" — replace this
      queries.ts          The data-access layer every page calls — rewrite this
    mock-auth/session.ts  Placeholder auth — replace this
    auth.ts               requireProfile() — the one function pages call for auth
    actions/notifications.ts  Shared server action
  types/                 Shared TypeScript types
```

## A note on the in-memory data

Because `seed.ts` is just JS arrays living in server memory, anything
you "save" (mark attendance, record a payment, submit a test) really
does persist for as long as the dev server keeps running — that's
what makes the demo feel real. But it resets on every restart, and in
a production deploy with multiple server instances, different
requests could hit different copies of the data. Don't ship this data
layer as-is; it's a stand-in, not a lightweight database.
