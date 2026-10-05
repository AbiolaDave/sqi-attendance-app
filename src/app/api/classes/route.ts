import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { findScheduleConflicts, createClass } from "@/lib/data/queries";

// POST /api/classes
// Body: { department_id, level_id, cohort_id, course_id, instructor_id,
//         class_date, start_time, end_time, location?, meeting_link? }
//
// Runs findScheduleConflicts() BEFORE creating a class — checks both
// instructor double-booking and cohort double-booking on the same
// day. Admins can pass `override: true` to force-save despite a
// conflict, matching "Do not allow the conflicting schedule to be
// saved unless an administrator overrides it" from the spec.
//
// NOTE: this writes to the in-memory `classes` array in
// src/lib/data/seed.ts, which resets on server restart and isn't
// shared safely across concurrent requests in production. When you
// build the real backend, port the conflict-check logic in
// `findScheduleConflicts` (src/lib/data/queries.ts) — it's plain JS,
// easy to translate into a SQL query or ORM call — and swap this
// route to write to your real database.
export async function POST(request: Request) {
  const profile = await requireProfile(["super_admin", "instructor"]);
  const body = await request.json();

  const {
    department_id,
    level_id,
    cohort_id,
    course_id,
    instructor_id,
    class_date,
    start_time,
    end_time,
    location,
    meeting_link,
    override,
  } = body;

  if (!department_id || !level_id || !cohort_id || !course_id || !instructor_id || !class_date || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (profile.role === "instructor" && instructor_id !== profile.id) {
    return NextResponse.json({ error: "You can only schedule your own classes." }, { status: 403 });
  }

  const conflicts = findScheduleConflicts({
    instructorId: instructor_id,
    cohortId: cohort_id,
    classDate: class_date,
    startTime: start_time,
    endTime: end_time,
  });

  if (conflicts.length > 0 && !(override && profile.role === "super_admin")) {
    return NextResponse.json(
      {
        error: "Schedule conflict detected.",
        conflicts: conflicts.map((c) => ({ id: c.id, instructor_id: c.instructor_id, cohort_id: c.cohort_id, start_time: c.start_time, end_time: c.end_time })),
      },
      { status: 409 }
    );
  }

  const created = createClass({
    department_id,
    level_id,
    cohort_id,
    course_id,
    instructor_id,
    class_date,
    start_time,
    end_time,
    location,
    meeting_link,
  });

  return NextResponse.json({ class: created });
}
