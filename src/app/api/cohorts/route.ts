import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createCohort, getInstructorDepartment } from "@/lib/data/queries";

const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);

export async function POST(request: Request) {
  const profile = await requireProfile(["instructor"]);
  const body = await request.json();
  const { level_id, name, start_date, instructor_id, schedule } = body;
  const department_id = getInstructorDepartment(profile.id);

  if (
    !department_id ||
    !level_id ||
    !name?.trim() ||
    !instructor_id ||
    !Array.isArray(schedule) ||
    schedule.length === 0
  ) {
    return NextResponse.json(
      { error: "Complete the cohort details and add at least one class day." },
      { status: 400 },
    );
  }

  if (
    instructor_id !== profile.id ||
    getInstructorDepartment(instructor_id) !== department_id
  ) {
    return NextResponse.json(
      { error: "You can only assign an instructor from your department." },
      { status: 403 },
    );
  }

  const hasInvalidSchedule = schedule.some(
    (entry: { day_of_week?: number; start_time?: string; end_time?: string }) =>
      !validDays.has(entry.day_of_week ?? -1) ||
      !entry.start_time ||
      !entry.end_time ||
      entry.start_time >= entry.end_time,
  );
  if (hasInvalidSchedule) {
    return NextResponse.json(
      { error: "Each class day needs a valid start and end time." },
      { status: 400 },
    );
  }

  const cohort = createCohort({
    department_id,
    level_id,
    name: name.trim(),
    start_date,
    instructor_id,
    schedule,
  });
  return NextResponse.json({ cohort }, { status: 201 });
}
