import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CohortModel } from "@/models/Cohort";
import { findOrCreateDepartmentCourse } from "@/models/Course";
import { User } from "@/models/User";

const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type ScheduleInput = {
  day_of_week?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  instructor_id?: unknown;
};

export async function POST(request: Request) {
  const profile = await requireProfile(["instructor"]);
  let body: {
    level_id?: unknown;
    name?: unknown;
    course_name?: unknown;
    start_date?: unknown;
    instructor_id?: unknown;
    instructor_ids?: unknown;
    schedule?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const courseName =
    typeof body.course_name === "string" ? body.course_name.trim() : "";
  const levelId = typeof body.level_id === "string" ? body.level_id.trim() : "";
  const startDate =
    typeof body.start_date === "string" ? body.start_date.trim() : "";
  const parsedStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
  if (
    !name ||
    !courseName ||
    courseName.length > 160 ||
    !levelId ||
    (body.start_date !== undefined && typeof body.start_date !== "string") ||
    (startDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !parsedStartDate ||
        Number.isNaN(parsedStartDate.getTime()) ||
        parsedStartDate?.toISOString().slice(0, 10) !== startDate))
  ) {
    return NextResponse.json(
      { error: "Enter a cohort name, course name, level, and valid start date." },
      { status: 400 },
    );
  }

  const scheduleInput = Array.isArray(body.schedule)
    ? (body.schedule as ScheduleInput[])
    : [];
  if (scheduleInput.length === 0) {
    return NextResponse.json(
      { error: "Add at least one class day to the schedule." },
      { status: 400 },
    );
  }
  if (
    scheduleInput.some(
      (entry) =>
        typeof entry !== "object" ||
        entry === null ||
        typeof entry.day_of_week !== "number" ||
        !validDays.has(entry.day_of_week) ||
        typeof entry.start_time !== "string" ||
        !timePattern.test(entry.start_time) ||
        typeof entry.end_time !== "string" ||
        !timePattern.test(entry.end_time) ||
        entry.start_time >= entry.end_time,
    )
  ) {
    return NextResponse.json(
      { error: "Each class day needs a valid start and end time." },
      { status: 400 },
    );
  }

  if (
    body.instructor_ids !== undefined &&
    !Array.isArray(body.instructor_ids)
  ) {
    return NextResponse.json(
      { error: "Assigned instructors must be provided as a list." },
      { status: 400 },
    );
  }
  const requestedInstructorIds = Array.isArray(body.instructor_ids)
    ? body.instructor_ids
    : [body.instructor_id ?? profile._id];
  const instructorIds = [
    ...new Set(
      requestedInstructorIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  ];
  if (
    instructorIds.length === 0 ||
    requestedInstructorIds.some(
      (id) => typeof id !== "string" || !id.trim(),
    )
  ) {
    return NextResponse.json(
      { error: "Assign at least one valid instructor to the cohort." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const creator = await User.findOne({
    _id: profile._id,
    role: "instructor",
    isActive: true,
  }).select("_id department_id");
  if (!creator?.department_id) {
    return NextResponse.json(
      { error: "Your instructor profile must have a department." },
      { status: 400 },
    );
  }

  const eligibleInstructors = await User.find({
    _id: { $in: instructorIds },
    role: "instructor",
    isActive: true,
    department_id: creator.department_id,
  }).select("_id");
  if (eligibleInstructors.length !== instructorIds.length) {
    return NextResponse.json(
      { error: "You can only assign active instructors from your department." },
      { status: 403 },
    );
  }

  const schedule = scheduleInput.map((entry) => {
    const assignedInstructorId =
      typeof entry.instructor_id === "string" && entry.instructor_id.trim()
        ? entry.instructor_id.trim()
        : instructorIds[0];
    return {
      day_of_week: entry.day_of_week as number,
      start_time: entry.start_time as string,
      end_time: entry.end_time as string,
      instructor_id: assignedInstructorId,
    };
  });
  if (schedule.some((entry) => !instructorIds.includes(entry.instructor_id))) {
    return NextResponse.json(
      { error: "Schedule instructors must be assigned to the cohort." },
      { status: 400 },
    );
  }

  const course = await findOrCreateDepartmentCourse(
    String(creator.department_id),
    courseName,
  );
  const cohort = await CohortModel.create({
    department_id: String(creator.department_id),
    level_id: levelId,
    name,
    course_id: String(course._id),
    course_name: course.name,
    start_date: startDate || undefined,
    instructor_id: profile._id,
    instructor_ids: instructorIds,
    schedule,
  });
  return NextResponse.json(
    {
      cohort: {
        id: String(cohort._id),
        department_id: cohort.department_id,
        level_id: cohort.level_id,
        name: cohort.name,
        course_id: cohort.course_id,
        course_name: cohort.course_name,
        start_date: cohort.start_date,
        instructor_id: cohort.instructor_id,
        instructor_ids: cohort.instructor_ids,
        schedule: cohort.schedule,
      },
    },
    { status: 201 },
  );
}
