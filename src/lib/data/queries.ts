import { Types } from "mongoose";
import {
  departments,
  levels,
  cohorts,
  courses,
  instructors,
  instructorAssignments,
  students,
  classes,
  attendance,
  balanceEntries,
  tests,
  testSubmissions,
  assignments,
  assignmentSubmissions,
  practiceQuestions,
  practiceProgress,
  interviewQuestions,
  notifications,
  cohortSchedules,
} from "@/lib/data/seed";
import { type UserType } from "@/lib/mock-auth/session";
import { CohortModel, CohortRecord } from "@/models/Cohort";
import { Department } from "@/models/Departments";
import { CourseModel, findOrCreateDepartmentCourse } from "@/models/Course";
import { User } from "@/models/User";
import { AttendanceModel } from "@/models/Attendance";
import { connectToDatabase } from "@/lib/mongodb";
import { AssessmentModel } from "@/models/Assessment";
import { AssessmentAttemptModel } from "@/models/AssessmentAttempt";
import { AssignmentModel } from "@/models/Assignment";
import { AssignmentSubmissionModel } from "@/models/AssignmentSubmission";
import { PracticeQuizModel } from "@/models/PracticeQuiz";
import { PracticeAttemptModel } from "@/models/PracticeAttempt";
import type {
  AttendanceStatus,
  BalanceStatus,
  Assignment,
  AssignmentSubmission,
  Test,
  TestSubmission,
  TestQuestion,
  PracticeQuiz,
  PracticeAttempt,
  DepartmentType,
  Profile,
} from "@/types";

type StoredAssignment = Omit<Assignment, "id" | "questions"> & {
  _id: Types.ObjectId;
  questions: TestQuestion[];
  created_by: string;
};

type StoredPracticeQuiz = Omit<PracticeQuiz, "id"> & {
  _id: Types.ObjectId;
  created_by: string;
};

// ---------------------------------------------------------------------
// This is the ONLY file the rest of the app imports data from. Every
// function here is written the way an API client would be — takes
// plain arguments, returns plain data, and (where it matters) takes
// the current user so it can enforce who's allowed to see what.
//
// Right now "enforcing" just means filtering an in-memory array, which
// is NOT real security — anyone with server access could import
// `seed.ts` directly and bypass it. When you build the real backend,
// each function below should become a `fetch("/api/...")` call, and
// the actual access control (the equivalent of the old Supabase RLS
// policies) needs to live there — never trust the frontend alone.
// The comments on each function say what rule it's standing in for.
// ---------------------------------------------------------------------

function delay<T>(value: T): Promise<T> {
  // Every function returns a Promise, even though the "database" here
  // is synchronous, so call sites already look like real API calls
  // and don't need to change when you wire up fetch().
  return Promise.resolve(value);
}

// --- Reference data -------------------------------------------------------

export async function getDepartments() {
  const allDepartments = await Department.find();
  // console.log(allDepartments);
  return delay(allDepartments);
}
export async function getLevels() {
  return delay(levels);
}
export async function getCohorts() {
  return delay(cohorts);
}
export async function getCourses(departmentId?: string) {
  await connectToDatabase();
  if (!departmentId) return [];
  const records = await CourseModel.find({ department_id: departmentId })
    .sort({ name: 1 })
    .lean();
  return records.map((course) => ({
    id: String(course._id),
    department_id: course.department_id,
    name: course.name,
  }));
}
export async function getDepartmentName(id: string) {
  const department = await Department.findById(id).lean<DepartmentType>();
  return department?.department ?? "—";
}
export async function getCohortName(id: string) {
  await connectToDatabase();
  const cohort = await CohortModel.findById(id).select("name").lean();
  return cohort?.name ?? "—";
}
export async function getLevelName(id: string) {
  return levels.find((l) => l.id === id)?.name ?? "—";
}
export async function getCourseName(id: string) {
  await connectToDatabase();
  const cohort = await CohortModel.findById(id).select("course_name").lean();
  return cohort?.course_name ?? "—";
}

async function getCourseForCohort(cohort: {
  _id: Types.ObjectId;
  department_id: string;
  course_id?: string;
  course_name?: string;
}) {
  if (cohort.course_id && Types.ObjectId.isValid(cohort.course_id)) {
    const course = await CourseModel.findOne({
      _id: cohort.course_id,
      department_id: cohort.department_id,
    });
    if (course) return course;
  }

  if (!cohort.course_name?.trim()) return null;

  const course = await findOrCreateDepartmentCourse(
    cohort.department_id,
    cohort.course_name,
  );
  await CohortModel.updateOne(
    { _id: cohort._id, department_id: cohort.department_id },
    { $set: { course_id: String(course._id), course_name: course.name } },
  );
  return course;
}

// --- People ----------------------------------------------------------------

export async function getProfile(id: string): Promise<Profile | undefined> {
  const profile = await User.findById(id).lean<Profile>();
  return profile ?? undefined;
}

export async function getInstructors() {
  const instructors = await User.find({ role: "instructor" }).lean();
  return delay(
    instructors.map((i) => ({
      id: String(i._id),
      full_name: i.full_name,
      email: i.email,
      department_id: String(i.department_id),
    })),
  );
}

export function getInstructorDepartment(instructorId: string) {
  return instructors.find((instructor) => instructor.id === instructorId)
    ?.department_id;
}

export function createCohort(input: {
  department_id: string;
  level_id: string;
  name: string;
  start_date?: string;
  instructor_id: string;
  schedule: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}) {
  const cohort = {
    id: `cohort-${cohorts.length + 1}`,
    department_id: input.department_id,
    level_id: input.level_id,
    name: input.name,
    start_date: input.start_date,
    instructor_id: input.instructor_id,
    instructor_ids: [input.instructor_id],
    schedule: input.schedule.map((entry, index) => ({
      id: `cohort-${cohorts.length + 1}-schedule-${index}`,
      cohort_id: `cohort-${cohorts.length + 1}`,
      instructor_id: input.instructor_id,
      ...entry,
    })),
  };
  cohorts.push(cohort);
  input.schedule.forEach((entry, index) => {
    cohortSchedules.push({
      id: `schedule-${cohortSchedules.length + index + 1}`,
      cohort_id: cohort.id,
      instructor_id: input.instructor_id,
      ...entry,
    });
  });
  instructorAssignments.push({
    id: `ia-${instructorAssignments.length + 1}`,
    instructor_id: input.instructor_id,
    department_id: input.department_id,
    level_id: input.level_id,
    cohort_id: cohort.id,
  });
  return cohort;
}

export async function getCohortIdsForInstructor(instructorId: string) {
  const cohortDocuments = await CohortModel.find({
    $or: [{ instructor_id: instructorId }, { instructor_ids: instructorId }],
  }).lean<CohortRecord[]>();
  return delay(cohortDocuments);
}

// RULE: a student can only ever be fetched by themself, an instructor
// assigned to their cohort, or an admin. Standing in for the
// `students_select` RLS policy from the earlier Supabase draft.
export async function getStudentsVisibleTo(user: Profile) {
  if (user.role === "super_admin") return delay(students);
  if (user.role === "instructor") {
    const cohortDocuments = await CohortModel.find({
      $or: [{ instructor_id: user._id }, { instructor_ids: user._id }],
    }).lean<CohortRecord[]>();
    const cohortsById = new Map(
      cohortDocuments.map((cohort) => [String(cohort._id), cohort]),
    );
    const cohortIds = [...cohortsById.keys()];
    const students = cohortIds.length
      ? await User.find({
          role: "student",
          cohort_id: { $in: cohortIds },
        })
          .select("_id full_name email cohort_id total_fee amount_paid")
          .sort({ full_name: 1 })
          .lean()
      : [];
    // console.log("All studentss", students);
    return delay(students);
    // const cohortIds = getCohortIdsForInstructor(user._id);
    // return delay(students.filter((s) => cohortIds.includes(s.cohort_id)));
  }
  return delay(students.filter((s) => s.id === user._id));
}

export async function getStudentById(id: string) {
  return students.find((s) => s.id === id);
}

export function balanceStatus(
  totalFee: number,
  amountPaid: number,
): BalanceStatus {
  if (amountPaid >= totalFee) return "fully_paid";
  if (amountPaid > 0) return "partially_paid";
  return "outstanding";
}

// RULE (the one you specifically asked for): a student sees only their
// own balance, an instructor only sees balances for their own
// students, admin sees everyone. Standing in for `balance_entries_select`.
export async function canViewBalance(user: Profile, studentId: string) {
  if (user.role === "super_admin") return true;
  if (user._id === studentId) return true;
  if (user.role === "instructor") {
    const student = students.find((s) => s.id === studentId);
    if (!student) return false;
    return (await getCohortIdsForInstructor(user._id)).some(
      (cohort) => String(cohort._id) === student.cohort_id,
    );
  }
  return false;
}

export async function getBalanceEntriesForStudent(
  user: Profile,
  studentId: string,
) {
  if (!canViewBalance(user, studentId)) return delay([]);
  return delay(
    balanceEntries
      .filter((b) => b.student_id === studentId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)),
  );
}

// RULE: same as above — only re-checked here too, since this is a
// write. An instructor recording a payment for a student outside
// their cohorts is rejected even if the UI never should have shown
// that option.
export async function recordPayment(
  user: Profile,
  studentId: string,
  amount: number,
  note?: string,
) {
  if (user.role === "student")
    return { success: false, message: "Students cannot record payments." };
  if (!canViewBalance(user, studentId))
    return {
      success: false,
      message: "You do not have access to this student.",
    };

  const student = students.find((s) => s.id === studentId);
  if (!student) return { success: false, message: "Student not found." };

  balanceEntries.push({
    id: `bal-${balanceEntries.length + 1}`,
    student_id: studentId,
    amount,
    note,
    recorded_by: user._id,
    recorded_at: new Date().toISOString(),
  });
  student.amount_paid += amount;

  return { success: true };
}

// --- Classes & schedule ------------------------------------------------

export async function getClassesForInstructor(
  instructorId: string,
  date?: string,
) {
  const classDate = date ?? new Date().toISOString().slice(0, 10);
  const dayOfWeek =
    (new Date(`${classDate}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  await connectToDatabase();
  const cohortsForDate = await CohortModel.find({
    $and: [
      {
        $or: [
          { instructor_id: instructorId },
          { instructor_ids: instructorId },
        ],
      },
      {
        $or: [
          { start_date: { $exists: false } },
          { start_date: { $lte: classDate } },
        ],
      },
    ],
  }).lean();
  const scheduledClasses = cohortsForDate.flatMap((cohort) => {
    const cohortId = String(cohort._id);
    const assignment = instructorAssignments.find(
      (item) =>
        item.cohort_id === cohortId && item.instructor_id === instructorId,
    );

    return cohort.schedule.flatMap(
      (
        entry: {
          instructor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        },
        index: number,
      ) => {
        if (
          entry.instructor_id !== instructorId ||
          entry.day_of_week !== dayOfWeek
        ) {
          return [];
        }

        return [
          {
            id: `${cohortId}-${classDate}-${index}`,
            department_id: cohort.department_id,
            level_id: cohort.level_id,
            cohort_id: cohortId,
            course_id: assignment?.course_id ?? "",
            instructor_id: instructorId,
            class_date: classDate,
            start_time: entry.start_time,
            end_time: entry.end_time,
          },
        ];
      },
    );
  });
  return delay(scheduledClasses);
}

export async function getClassesForCohort(cohortId: string, fromDate?: string) {
  await connectToDatabase();
  const cohort = await CohortModel.findById(cohortId)
    .select("schedule department_id level_id start_date")
    .lean();

  if (!cohort) {
    return { upcomingClasses: [], schedule: [] };
  }

  const schedule = cohort.schedule;
  const now = new Date();
  const startDate = fromDate
    ? new Date(`${fromDate}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDate = new Date(startDate);

  if (cohort.start_date) {
    const cohortStart = new Date(`${cohort.start_date}T00:00:00`);
    if (cohortStart > firstDate) {
      firstDate.setTime(cohortStart.getTime());
    }
  }

  const upcomingClasses = [];
  for (let offset = 0; offset < 35 && upcomingClasses.length < 5; offset += 1) {
    const classDay = new Date(firstDate);
    classDay.setDate(firstDate.getDate() + offset);
    const classDate = [
      classDay.getFullYear(),
      String(classDay.getMonth() + 1).padStart(2, "0"),
      String(classDay.getDate()).padStart(2, "0"),
    ].join("-");
    const dayOfWeek = (classDay.getDay() + 6) % 7;

    for (const [index, entry] of schedule.entries()) {
      if (entry.day_of_week !== dayOfWeek) continue;

      const [hours, minutes] = entry.start_time.split(":").map(Number);
      const startsAt = new Date(
        classDay.getFullYear(),
        classDay.getMonth(),
        classDay.getDate(),
        hours,
        minutes,
      );
      if (startsAt <= now) continue;

      const assignment = instructorAssignments.find(
        (item) =>
          item.cohort_id === cohortId &&
          item.instructor_id === entry.instructor_id,
      );
      upcomingClasses.push({
        id: `${cohortId}-${classDate}-${index}`,
        department_id: cohort.department_id,
        level_id: cohort.level_id,
        cohort_id: cohortId,
        course_id: assignment?.course_id ?? "",
        instructor_id: entry.instructor_id,
        class_date: classDate,
        start_time: entry.start_time,
        end_time: entry.end_time,
      });
    }
  }

  upcomingClasses.sort((a, b) =>
    `${a.class_date}${a.start_time}`.localeCompare(
      `${b.class_date}${b.start_time}`,
    ),
  );

  return delay({ upcomingClasses: upcomingClasses.slice(0, 5), schedule });
}

export async function getClassById(id: string) {
  return classes.find((c) => c.id === id);
}

export function createClass(input: {
  department_id: string;
  level_id: string;
  cohort_id: string;
  course_id: string;
  instructor_id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_link?: string;
}) {
  const newClass = { id: `class-${classes.length + 1}`, ...input };
  classes.push(newClass);
  return newClass;
}

// Standing in for the has_schedule_conflict() Postgres function.
export function findScheduleConflicts(params: {
  instructorId: string;
  cohortId: string;
  classDate: string;
  startTime: string;
  endTime: string;
  excludeClassId?: string;
}) {
  const overlaps = (
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string,
  ) => aStart < bEnd && bStart < aEnd;

  return classes.filter(
    (c) =>
      c.id !== params.excludeClassId &&
      c.class_date === params.classDate &&
      overlaps(params.startTime, params.endTime, c.start_time, c.end_time) &&
      (c.instructor_id === params.instructorId ||
        c.cohort_id === params.cohortId),
  );
}

// --- Attendance --------------------------------------------------------

export async function getAttendanceForClass(classId: string) {
  await connectToDatabase();
  const records = await AttendanceModel.find({ class_id: classId })
    .sort({ student_id: 1 })
    .lean();
  return records.map((record) => ({
    id: String(record._id),
    class_id: record.class_id,
    student_id: record.student_id,
    status: record.status as AttendanceStatus,
    marked_by: record.marked_by,
    marked_at: record.marked_at.toISOString(),
    cohort_id: record.cohort_id,
    class_date: record.class_date,
  }));
}

export async function getAttendanceForStudent(studentId: string) {
  await connectToDatabase();
  const records = await AttendanceModel.find({ student_id: studentId })
    .sort({ class_date: -1, start_time: -1 })
    .lean();
  return records.map((record) => ({
    id: String(record._id),
    class_id: record.class_id,
    student_id: record.student_id,
    status: record.status as AttendanceStatus,
    marked_by: record.marked_by,
    marked_at: record.marked_at.toISOString(),
    cohort_id: record.cohort_id,
    class_date: record.class_date,
    start_time: record.start_time,
    end_time: record.end_time,
  }));
}

export async function getAttendanceForCohort(cohortId: string) {
  await connectToDatabase();
  const records = await AttendanceModel.find({ cohort_id: cohortId })
    .sort({ class_date: -1, start_time: -1, student_id: 1 })
    .lean();
  return records.map((record) => ({
    id: String(record._id),
    class_id: record.class_id,
    student_id: record.student_id,
    status: record.status as AttendanceStatus,
    marked_by: record.marked_by,
    marked_at: record.marked_at.toISOString(),
    cohort_id: record.cohort_id,
    class_date: record.class_date,
    start_time: record.start_time,
    end_time: record.end_time,
  }));
}

export async function saveAttendance(
  classInfo: {
    id: string;
    cohort_id: string;
    class_date: string;
    start_time: string;
    end_time: string;
  },
  markedBy: string,
  entries: { studentId: string; status: AttendanceStatus }[],
) {
  if (
    entries.some(
      (entry) =>
        !["present", "absent", "late", "excused"].includes(entry.status),
    )
  ) {
    return { success: false, message: "Invalid attendance status." };
  }
  if (
    new Set(entries.map((entry) => entry.studentId)).size !== entries.length
  ) {
    return {
      success: false,
      message: "A student was included more than once.",
    };
  }

  await connectToDatabase();
  const studentIds = entries.map((entry) => entry.studentId);
  const cohortStudents = await User.find({
    _id: { $in: studentIds },
    role: "student",
    cohort_id: classInfo.cohort_id,
  })
    .select("_id")
    .lean();
  if (cohortStudents.length !== studentIds.length) {
    return {
      success: false,
      message: "Attendance can only be marked for students in this cohort.",
    };
  }

  const markedAt = new Date();
  await AttendanceModel.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { class_id: classInfo.id, student_id: entry.studentId },
        update: {
          $set: {
            cohort_id: classInfo.cohort_id,
            instructor_id: markedBy,
            class_date: classInfo.class_date,
            start_time: classInfo.start_time,
            end_time: classInfo.end_time,
            status: entry.status,
            marked_by: markedBy,
            marked_at: markedAt,
          },
        },
        upsert: true,
      },
    })),
  );
  return { success: true };
}

export function attendancePercentFor(studentId: string): number {
  const rows = attendance.filter((a) => a.student_id === studentId);
  if (rows.length === 0) return 100;
  const present = rows.filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  return Math.round((present / rows.length) * 100);
}

// --- Tests / assessments (Phase 2) --------------------------------------

type AssessmentRecord = Test & {
  _id: Types.ObjectId;
  created_by: string;
};

type AssessmentAttemptRecord = {
  _id: Types.ObjectId;
  assessment_id: string;
  student_id: string;
  cohort_id: string;
  started_at: Date;
  submitted_at?: Date;
  answers: Record<string, string>;
  auto_score: number;
  score: number;
  grading_status: "in_progress" | "needs_review" | "graded";
};

function toTest(record: AssessmentRecord, hideAnswers = false): Test {
  return {
    id: String(record._id),
    title: record.title,
    description: record.description,
    department_id: record.department_id,
    level_id: record.level_id,
    cohort_id: record.cohort_id,
    course_id: record.course_id,
    duration_minutes: record.duration_minutes,
    start_date: record.start_date,
    end_date: record.end_date,
    total_marks: record.total_marks,
    published: record.published,
    questions: record.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correct_answer: hideAnswers ? undefined : question.correct_answer,
      marks: question.marks,
      explanation: question.explanation,
    })),
  };
}

function toTestSubmission(record: AssessmentAttemptRecord): TestSubmission {
  return {
    id: String(record._id),
    test_id: record.assessment_id,
    student_id: record.student_id,
    submitted_at: record.submitted_at?.toISOString() ?? "",
    score: record.score,
    answers: record.answers ?? {},
    grading_status: record.grading_status,
    started_at: record.started_at.toISOString(),
  };
}

export async function getTestsVisibleTo(user: Profile): Promise<Test[]> {
  await connectToDatabase();
  if (user.role === "super_admin") {
    const records = await AssessmentModel.find().lean<AssessmentRecord[]>();
    return records.map((record) => toTest(record));
  }
  if (user.role === "instructor") {
    const cohortsForInstructor = await CohortModel.find({
      $or: [{ instructor_id: user._id }, { instructor_ids: user._id }],
    })
      .select("_id")
      .lean();
    const cohortIds = cohortsForInstructor.map((cohort) => String(cohort._id));
    if (cohortIds.length === 0) return [];
    const records = await AssessmentModel.find({
      cohort_id: { $in: cohortIds },
      created_by: user._id,
    }).lean<AssessmentRecord[]>();
    return records.map((record) => toTest(record));
  }
  const student = await User.findById(user._id).select("cohort_id").lean();
  console.log("Student details", student);
  if (!student?.cohort_id) return [];
  const records = await AssessmentModel.find({
    cohort_id: student.cohort_id,
    published: true,
  }).lean<AssessmentRecord[]>();
  return records.map((record) => toTest(record, true));
}

export async function getTestById(id: string) {
  if (!Types.ObjectId.isValid(id)) return undefined;
  await connectToDatabase();
  const record = await AssessmentModel.findById(id).lean<AssessmentRecord>();
  return record ? toTest(record, true) : undefined;
}

export async function getStudentAssessment(testId: string, studentId: string) {
  if (!Types.ObjectId.isValid(testId)) return undefined;
  await connectToDatabase();
  const [record, student] = await Promise.all([
    AssessmentModel.findById(testId).lean<AssessmentRecord>(),
    User.findById(studentId).select("role isActive cohort_id").lean(),
  ]);
  if (
    !record ||
    !record.published ||
    !student ||
    student.role !== "student" ||
    !student.isActive ||
    student.cohort_id !== record.cohort_id
  ) {
    return undefined;
  }
  return toTest(record, true);
}

export async function getTestSubmission(testId: string, studentId: string) {
  await connectToDatabase();
  const record = await AssessmentAttemptModel.findOne({
    assessment_id: testId,
    student_id: studentId,
  }).lean<AssessmentAttemptRecord>();
  return record ? toTestSubmission(record) : undefined;
}

export async function startTestAttempt(testId: string, studentId: string) {
  if (!Types.ObjectId.isValid(testId)) {
    return { success: false as const, message: "Assessment not found." };
  }
  await connectToDatabase();
  const [assessment, student] = await Promise.all([
    AssessmentModel.findById(testId).lean<AssessmentRecord>(),
    User.findById(studentId).select("_id cohort_id role isActive").lean(),
  ]);
  if (
    !assessment ||
    !assessment.published ||
    !student ||
    student.role !== "student" ||
    !student.isActive ||
    student.cohort_id !== assessment.cohort_id
  ) {
    return {
      success: false as const,
      message: "Assessment is not available to you.",
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (today < assessment.start_date || today > assessment.end_date) {
    return { success: false as const, message: "This assessment is not open." };
  }

  const attempt = await AssessmentAttemptModel.findOneAndUpdate(
    { assessment_id: testId, student_id: studentId },
    {
      $setOnInsert: {
        assessment_id: testId,
        student_id: studentId,
        cohort_id: assessment.cohort_id,
        started_at: new Date(),
        answers: {},
        auto_score: 0,
        score: 0,
        grading_status: "in_progress",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<AssessmentAttemptRecord>();
  if (!attempt) {
    return { success: false as const, message: "Could not start assessment." };
  }
  if (attempt.submitted_at) {
    return {
      success: false as const,
      message: "You have already submitted this assessment.",
    };
  }

  return {
    success: true as const,
    attemptId: String(attempt._id),
    startedAt: attempt.started_at.toISOString(),
  };
}

export async function saveTestDraft(
  testId: string,
  studentId: string,
  answers: Record<string, string>,
) {
  if (!Types.ObjectId.isValid(testId)) {
    return { success: false as const, message: "Assessment not found." };
  }
  await connectToDatabase();
  const [assessment, attempt, student] = await Promise.all([
    AssessmentModel.findById(testId).lean<AssessmentRecord>(),
    AssessmentAttemptModel.findOne({
      assessment_id: testId,
      student_id: studentId,
      submitted_at: { $exists: false },
    }).lean<AssessmentAttemptRecord>(),
    User.findOne({
      _id: studentId,
      role: "student",
      isActive: true,
    })
      .select("_id cohort_id")
      .lean(),
  ]);
  if (
    !assessment ||
    !attempt ||
    !student ||
    student.cohort_id !== assessment.cohort_id
  ) {
    return {
      success: false as const,
      message: "Assessment attempt not found.",
    };
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (
    today < assessment.start_date ||
    today > assessment.end_date ||
    now.getTime() >
      attempt.started_at.getTime() +
        assessment.duration_minutes * 60_000 +
        60_000
  ) {
    return { success: false as const, message: "The assessment is closed." };
  }

  const allowedQuestionIds = new Set(
    assessment.questions.map((question) => question.id),
  );
  for (const [questionId, answer] of Object.entries(answers)) {
    if (
      !allowedQuestionIds.has(questionId) ||
      typeof answer !== "string" ||
      answer.length > 20_000
    ) {
      return {
        success: false as const,
        message: "Invalid assessment answers.",
      };
    }
  }
  const result = await AssessmentAttemptModel.updateOne(
    { _id: attempt._id, submitted_at: { $exists: false } },
    { $set: { answers } },
  );
  if (result.matchedCount === 0) {
    return {
      success: false as const,
      message: "Assessment attempt is no longer active.",
    };
  }
  return { success: true as const };
}

export async function submitTest(
  testId: string,
  studentId: string,
  answers: Record<string, string>,
) {
  if (!Types.ObjectId.isValid(testId)) {
    return { success: false as const, message: "Assessment not found." };
  }
  await connectToDatabase();
  const [assessment, attempt] = await Promise.all([
    AssessmentModel.findById(testId).lean<AssessmentRecord>(),
    AssessmentAttemptModel.findOne({
      assessment_id: testId,
      student_id: studentId,
    }).lean<AssessmentAttemptRecord>(),
  ]);
  if (!assessment || !assessment.published || !attempt) {
    return {
      success: false as const,
      message: "Start this assessment before submitting.",
    };
  }
  if (attempt.submitted_at) {
    return {
      success: false as const,
      message: "This assessment was already submitted.",
    };
  }
  const student = await User.findOne({
    _id: studentId,
    role: "student",
    cohort_id: assessment.cohort_id,
    isActive: true,
  })
    .select("_id")
    .lean();
  if (!student) {
    return {
      success: false as const,
      message: "You are not assigned to this assessment.",
    };
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (today < assessment.start_date || today > assessment.end_date) {
    return { success: false as const, message: "This assessment is closed." };
  }
  if (
    now.getTime() >
    attempt.started_at.getTime() + assessment.duration_minutes * 60_000 + 60_000
  ) {
    return {
      success: false as const,
      message: "The assessment time has expired.",
    };
  }

  const allowedQuestionIds = new Set(assessment.questions.map((q) => q.id));
  const cleanedAnswers: Record<string, string> = {};
  for (const [questionId, answer] of Object.entries(answers)) {
    if (!allowedQuestionIds.has(questionId) || typeof answer !== "string") {
      return {
        success: false as const,
        message: "Invalid assessment answers.",
      };
    }
    cleanedAnswers[questionId] = answer.slice(0, 20_000);
  }

  let autoScore = 0;
  let hasManualQuestions = false;
  for (const question of assessment.questions) {
    if (question.type === "multiple_choice" || question.type === "true_false") {
      if (
        question.correct_answer &&
        cleanedAnswers[question.id] === question.correct_answer
      ) {
        autoScore += question.marks;
      }
    } else {
      hasManualQuestions = true;
    }
  }

  const submittedAttempt = await AssessmentAttemptModel.findOneAndUpdate(
    {
      _id: attempt._id,
      submitted_at: { $exists: false },
    },
    {
      $set: {
        answers: cleanedAnswers,
        auto_score: autoScore,
        score: autoScore,
        submitted_at: now,
        grading_status: hasManualQuestions ? "needs_review" : "graded",
      },
    },
    { new: true },
  ).lean<AssessmentAttemptRecord>();
  if (!submittedAttempt) {
    return {
      success: false as const,
      message: "This assessment was already submitted.",
    };
  }
  return {
    success: true as const,
    score: autoScore,
    total: assessment.total_marks,
    gradingStatus: submittedAttempt.grading_status,
  };
}

export async function createAssessmentForInstructor(
  instructorId: string,
  input: {
    title: string;
    description: string;
    cohortId: string;
    durationMinutes: number;
    startDate: string;
    endDate: string;
    questions: TestQuestion[];
  },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(input.cohortId)) {
    return { success: false as const, message: "Choose a valid cohort." };
  }
  const cohort = await CohortModel.findOne({
    _id: input.cohortId,
    $or: [{ instructor_id: instructorId }, { instructor_ids: instructorId }],
  }).lean();
  if (!cohort) {
    return {
      success: false as const,
      message: "You are not assigned to this cohort.",
    };
  }
  const course = await getCourseForCohort(cohort);
  if (!course) {
    return {
      success: false as const,
      message: "Choose a cohort with a valid department course.",
    };
  }
  const totalMarks = input.questions.reduce(
    (total, question) => total + question.marks,
    0,
  );
  const assessment = await AssessmentModel.create({
    title: input.title,
    description: input.description,
    department_id: cohort.department_id,
    level_id: cohort.level_id,
    cohort_id: String(cohort._id),
    course_id: String(course._id),
    created_by: instructorId,
    duration_minutes: input.durationMinutes,
    start_date: input.startDate,
    end_date: input.endDate,
    total_marks: totalMarks,
    published: false,
    questions: input.questions,
  });
  return { success: true as const, id: String(assessment._id) };
}

export async function setAssessmentPublished(
  instructorId: string,
  assessmentId: string,
  published: boolean,
) {
  if (!Types.ObjectId.isValid(assessmentId)) {
    return { success: false as const, message: "Assessment not found." };
  }
  await connectToDatabase();
  const assessment = await AssessmentModel.findOne({
    _id: assessmentId,
    created_by: instructorId,
  });
  if (!assessment) {
    return { success: false as const, message: "Assessment not found." };
  }
  if (published && assessment.questions.length === 0) {
    return {
      success: false as const,
      message: "Add at least one question before publishing.",
    };
  }
  assessment.published = published;
  await assessment.save();
  return { success: true as const };
}

export async function getInstructorAssessment(
  instructorId: string,
  assessmentId: string,
) {
  if (!Types.ObjectId.isValid(assessmentId)) return undefined;
  await connectToDatabase();
  const record = await AssessmentModel.findOne({
    _id: assessmentId,
    created_by: instructorId,
  }).lean<AssessmentRecord>();
  return record ? toTest(record) : undefined;
}

export async function getAssessmentResults(
  instructorId: string,
  assessmentId: string,
) {
  const assessment = await getInstructorAssessment(instructorId, assessmentId);
  if (!assessment) return undefined;
  const attempts = await AssessmentAttemptModel.find({
    assessment_id: assessmentId,
  })
    .sort({ submitted_at: -1, started_at: -1 })
    .lean<AssessmentAttemptRecord[]>();
  const studentIds = attempts.map((attempt) => attempt.student_id);
  const studentRecords = studentIds.length
    ? await User.find({ _id: { $in: studentIds } })
        .select("_id full_name email")
        .lean()
    : [];
  const studentsById = new Map(
    studentRecords.map((student) => [
      String(student._id),
      { full_name: student.full_name, email: student.email },
    ]),
  );
  return {
    assessment,
    attempts: attempts.map((attempt) => ({
      ...toTestSubmission(attempt),
      started_at: attempt.started_at.toISOString(),
      auto_score: attempt.auto_score,
      manual_score: attempt.score - attempt.auto_score,
      student: studentsById.get(attempt.student_id) ?? {
        full_name: "Unknown student",
        email: "",
      },
    })),
  };
}

export async function gradeAssessmentAttempt(
  instructorId: string,
  attemptId: string,
  manualScore: number,
) {
  if (!Types.ObjectId.isValid(attemptId) || !Number.isFinite(manualScore)) {
    return { success: false as const, message: "Enter a valid score." };
  }
  await connectToDatabase();
  const attempt =
    await AssessmentAttemptModel.findById(
      attemptId,
    ).lean<AssessmentAttemptRecord>();
  if (!attempt || !attempt.submitted_at) {
    return { success: false as const, message: "Submitted attempt not found." };
  }
  const assessment = await AssessmentModel.findOne({
    _id: attempt.assessment_id,
    created_by: instructorId,
  }).lean<AssessmentRecord>();
  if (!assessment) {
    return { success: false as const, message: "Assessment not found." };
  }
  const manualMaximum = assessment.questions.reduce(
    (total, question) =>
      total +
      (question.type === "short_answer" || question.type === "coding"
        ? question.marks
        : 0),
    0,
  );
  if (manualScore < 0 || manualScore > manualMaximum) {
    return {
      success: false as const,
      message: `Enter a score from 0 to ${manualMaximum}.`,
    };
  }
  await AssessmentAttemptModel.updateOne(
    { _id: attemptId },
    {
      $set: {
        score: attempt.auto_score + manualScore,
        grading_status: "graded",
      },
    },
  );
  return { success: true as const };
}

// --- Assignments (Phase 2) ----------------------------------------------

export async function getAssignmentsVisibleTo(
  user: Profile,
): Promise<Assignment[]> {
  await connectToDatabase();
  if (user.role === "super_admin") {
    const records = await AssignmentModel.find().lean<StoredAssignment[]>();
    return records.map((record) => ({
      id: String(record._id),
      title: record.title,
      description: record.description,
      course_id: record.course_id,
      department_id: record.department_id,
      level_id: record.level_id,
      cohort_id: record.cohort_id,
      due_date: record.due_date,
      max_score: record.max_score,
      questions: record.questions,
    }));
  }
  if (user.role === "instructor") {
    const instructorCohorts = await CohortModel.find({
      $or: [{ instructor_id: user._id }, { instructor_ids: user._id }],
    })
      .select("_id")
      .lean();
    const cohortIds = instructorCohorts.map((cohort) => String(cohort._id));
    if (cohortIds.length === 0) return [];
    const records = await AssignmentModel.find({
      cohort_id: { $in: cohortIds },
      created_by: user._id,
    }).lean<StoredAssignment[]>();
    return records.map((record) => ({
      id: String(record._id),
      title: record.title,
      description: record.description,
      course_id: record.course_id,
      department_id: record.department_id,
      level_id: record.level_id,
      cohort_id: record.cohort_id,
      due_date: record.due_date,
      max_score: record.max_score,
      questions: record.questions,
    }));
  }
  const student = await User.findById(user._id).select("cohort_id").lean();
  if (!student?.cohort_id) return [];
  const records = await AssignmentModel.find({
    cohort_id: student.cohort_id,
  }).lean<StoredAssignment[]>();
  return records.map((record) => ({
    id: String(record._id),
    title: record.title,
    description: record.description,
    course_id: record.course_id,
    department_id: record.department_id,
    level_id: record.level_id,
    cohort_id: record.cohort_id,
    due_date: record.due_date,
    max_score: record.max_score,
    questions: record.questions.map((question) => ({
      ...question,
      correct_answer: undefined,
    })),
  }));
}

export async function getSubmissionsForAssignment(
  assignmentId: string,
): Promise<AssignmentSubmission[]> {
  if (!Types.ObjectId.isValid(assignmentId)) {
    return assignmentSubmissions.filter(
      (s) => s.assignment_id === assignmentId,
    );
  }
  await connectToDatabase();
  const records = await AssignmentSubmissionModel.find({
    assignment_id: assignmentId,
  }).lean();
  const studentsById = new Map(
    (
      await User.find({
        _id: { $in: records.map((record) => record.student_id) },
      })
        .select("_id full_name")
        .lean()
    ).map((student) => [String(student._id), student.full_name]),
  );
  return records.map((record) => ({
    id: String(record._id),
    assignment_id: record.assignment_id,
    student_id: record.student_id,
    submitted_at: record.submitted_at.toISOString(),
    status: record.status,
    score: record.score,
    auto_score: record.auto_score,
    feedback: record.feedback,
    answers: record.answers ?? {},
    student_name: studentsById.get(record.student_id) ?? "Unknown student",
  }));
}

export async function getSubmissionForStudent(
  assignmentId: string,
  studentId: string,
) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    return assignmentSubmissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId,
    );
  }
  await connectToDatabase();
  const record = await AssignmentSubmissionModel.findOne({
    assignment_id: assignmentId,
    student_id: studentId,
  }).lean();
  return record
    ? {
        id: String(record._id),
        assignment_id: record.assignment_id,
        student_id: record.student_id,
        submitted_at: record.submitted_at.toISOString(),
        status: record.status,
        score: record.score,
        auto_score: record.auto_score,
        feedback: record.feedback,
        answers: record.answers ?? {},
      }
    : undefined;
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  answers: Record<string, string>,
) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment)
      return { success: false, message: "Assignment not found." };
    return {
      success: false,
      message: "This legacy assignment does not accept question answers.",
    };
  }
  await connectToDatabase();
  const [assignment, student] = await Promise.all([
    AssignmentModel.findById(assignmentId).lean<StoredAssignment>(),
    User.findOne({ _id: studentId, role: "student", isActive: true })
      .select("_id cohort_id")
      .lean(),
  ]);
  if (!assignment || !student || student.cohort_id !== assignment.cohort_id) {
    return {
      success: false,
      message: "Assignment not found for this student.",
    };
  }
  if (new Date().toISOString().slice(0, 10) > assignment.due_date) {
    return { success: false, message: "The assignment due date has passed." };
  }
  if (
    await AssignmentSubmissionModel.exists({
      assignment_id: assignmentId,
      student_id: studentId,
    })
  ) {
    return {
      success: false,
      message: "This assignment has already been submitted.",
    };
  }

  const questionIds = new Set(
    assignment.questions.map((question) => question.id),
  );
  if (
    Object.entries(answers).some(
      ([questionId, answer]) =>
        !questionIds.has(questionId) ||
        typeof answer !== "string" ||
        answer.length > 20_000,
    )
  ) {
    return { success: false, message: "Invalid assignment answers." };
  }
  const hasManualQuestions = assignment.questions.some(
    (question) =>
      question.type === "short_answer" || question.type === "coding",
  );
  let score = 0;
  assignment.questions.forEach((question) => {
    if (
      (question.type === "multiple_choice" || question.type === "true_false") &&
      answers[question.id] === question.correct_answer
    ) {
      score += question.marks;
    }
  });

  const now = new Date();
  const submission = await AssignmentSubmissionModel.findOneAndUpdate(
    { assignment_id: assignmentId, student_id: studentId },
    {
      $set: {
        cohort_id: assignment.cohort_id,
        submitted_at: now,
        answers,
        status: hasManualQuestions ? "submitted" : "graded",
        score,
        auto_score: score,
      },
      $setOnInsert: { assignment_id: assignmentId, student_id: studentId },
    },
    { upsert: true, new: true },
  ).lean();
  return {
    success: true,
    message: hasManualQuestions
      ? "Assignment submitted. Your instructor will grade the written answers."
      : `Assignment submitted. Your score is ${submission.score}/${assignment.max_score}.`,
  };
}

export async function gradeSubmission(
  instructorId: string,
  submissionId: string,
  score: number,
  feedback?: string,
) {
  if (!Types.ObjectId.isValid(submissionId)) return { success: false };
  await connectToDatabase();
  const submission = await AssignmentSubmissionModel.findById(submissionId);
  if (!submission) return { success: false };
  const assignment = await AssignmentModel.findOne({
    _id: submission.assignment_id,
    created_by: instructorId,
  });
  if (!assignment || score < 0) {
    return { success: false };
  }
  const manualMaximum = assignment.questions.reduce(
    (total: number, question: TestQuestion) =>
      total +
      (question.type === "short_answer" || question.type === "coding"
        ? question.marks
        : 0),
    0,
  );
  if (manualMaximum === 0 || score > manualMaximum) {
    return { success: false };
  }
  submission.score = submission.auto_score + score;
  submission.feedback = feedback;
  submission.status = "graded";
  await submission.save();
  return { success: true };
}

export async function createAssignmentForInstructor(
  instructorId: string,
  input: {
    title: string;
    description: string;
    cohortId: string;
    dueDate: string;
    questions: TestQuestion[];
  },
) {
  if (!Types.ObjectId.isValid(input.cohortId)) {
    return { success: false as const, message: "Choose a valid cohort." };
  }
  await connectToDatabase();
  const cohort = await CohortModel.findOne({
    _id: input.cohortId,
    $or: [{ instructor_id: instructorId }, { instructor_ids: instructorId }],
  }).lean();
  if (!cohort) {
    return {
      success: false as const,
      message: "You are not assigned to this cohort.",
    };
  }
  const course = await getCourseForCohort(cohort);
  if (!course) {
    return {
      success: false as const,
      message: "Choose a cohort with a valid department course.",
    };
  }
  const maxScore = input.questions.reduce(
    (total, question) => total + question.marks,
    0,
  );
  const assignment = await AssignmentModel.create({
    title: input.title,
    description: input.description,
    department_id: cohort.department_id,
    level_id: cohort.level_id,
    cohort_id: String(cohort._id),
    course_id: String(course._id),
    created_by: instructorId,
    due_date: input.dueDate,
    max_score: maxScore,
    questions: input.questions,
  });
  return { success: true as const, id: String(assignment._id) };
}

function toPracticeQuiz(
  record: {
    _id: Types.ObjectId;
    title: string;
    description: string;
    department_id: string;
    level_id: string;
    cohort_id: string;
    course_id: string;
    duration_minutes: number;
    total_marks: number;
    questions: TestQuestion[];
    published: boolean;
  },
  hideAnswers = false,
): PracticeQuiz {
  return {
    id: String(record._id),
    title: record.title,
    description: record.description,
    department_id: record.department_id,
    level_id: record.level_id,
    cohort_id: record.cohort_id,
    course_id: record.course_id,
    duration_minutes: record.duration_minutes,
    total_marks: record.total_marks,
    published: record.published,
    questions: record.questions.map((question) => ({
      ...question,
      correct_answer: hideAnswers ? undefined : question.correct_answer,
    })),
  };
}

export async function getPracticeQuizzesVisibleTo(user: Profile) {
  await connectToDatabase();
  if (user.role === "instructor") {
    const instructorCohorts = await CohortModel.find({
      $or: [{ instructor_id: user._id }, { instructor_ids: user._id }],
    })
      .select("_id")
      .lean();
    const cohortIds = instructorCohorts.map((cohort) => String(cohort._id));
    if (cohortIds.length === 0) return [];
    const records = await PracticeQuizModel.find({
      cohort_id: { $in: cohortIds },
      created_by: user._id,
    }).lean<StoredPracticeQuiz[]>();
    return records.map((record) => toPracticeQuiz(record));
  }
  if (user.role === "super_admin") {
    const records = await PracticeQuizModel.find().lean<StoredPracticeQuiz[]>();
    return records.map((record) => toPracticeQuiz(record));
  }
  const student = await User.findById(user._id).select("cohort_id").lean();
  if (!student?.cohort_id) return [];
  const records = await PracticeQuizModel.find({
    cohort_id: student.cohort_id,
    published: true,
  }).lean<StoredPracticeQuiz[]>();
  return records.map((record) => toPracticeQuiz(record, true));
}

export async function createPracticeQuizForInstructor(
  instructorId: string,
  input: {
    title: string;
    description: string;
    cohortId: string;
    durationMinutes: number;
    questions: TestQuestion[];
  },
) {
  if (!Types.ObjectId.isValid(input.cohortId)) {
    return { success: false as const, message: "Choose a valid cohort." };
  }
  await connectToDatabase();
  const cohort = await CohortModel.findOne({
    _id: input.cohortId,
    $or: [{ instructor_id: instructorId }, { instructor_ids: instructorId }],
  }).lean();
  if (!cohort) {
    return {
      success: false as const,
      message: "You are not assigned to this cohort.",
    };
  }
  const course = await getCourseForCohort(cohort);
  if (!course) {
    return {
      success: false as const,
      message: "Choose a cohort with a valid department course.",
    };
  }
  const totalMarks = input.questions.reduce(
    (total, question) => total + question.marks,
    0,
  );
  const practice = await PracticeQuizModel.create({
    title: input.title,
    description: input.description,
    department_id: cohort.department_id,
    level_id: cohort.level_id,
    cohort_id: String(cohort._id),
    course_id: String(course._id),
    created_by: instructorId,
    duration_minutes: input.durationMinutes,
    total_marks: totalMarks,
    questions: input.questions,
    published: false,
  });
  return { success: true as const, id: String(practice._id) };
}

export async function setPracticeQuizPublished(
  instructorId: string,
  practiceId: string,
  published: boolean,
) {
  if (!Types.ObjectId.isValid(practiceId)) {
    return { success: false as const, message: "Practice quiz not found." };
  }
  await connectToDatabase();
  const practice = await PracticeQuizModel.findOne({
    _id: practiceId,
    created_by: instructorId,
  });
  if (!practice) {
    return { success: false as const, message: "Practice quiz not found." };
  }
  practice.published = published;
  await practice.save();
  return { success: true as const };
}

export async function getStudentPracticeQuiz(
  practiceId: string,
  studentId: string,
) {
  if (!Types.ObjectId.isValid(practiceId)) return undefined;
  await connectToDatabase();
  const [practice, student] = await Promise.all([
    PracticeQuizModel.findById(practiceId).lean<StoredPracticeQuiz>(),
    User.findById(studentId).select("cohort_id role isActive").lean(),
  ]);
  if (
    !practice ||
    !practice.published ||
    !student ||
    student.role !== "student" ||
    !student.isActive ||
    student.cohort_id !== practice.cohort_id
  ) {
    return undefined;
  }
  return toPracticeQuiz(practice, true);
}

export async function getPracticeAttempts(
  practiceId: string,
  studentId: string,
): Promise<PracticeAttempt[]> {
  await connectToDatabase();
  const records = await PracticeAttemptModel.find({
    practice_id: practiceId,
    student_id: studentId,
    submitted_at: { $exists: true },
  })
    .sort({ submitted_at: -1 })
    .lean();
  return records.map((record) => ({
    id: String(record._id),
    practice_id: record.practice_id,
    student_id: record.student_id,
    score: record.score,
    total_marks: record.total_marks,
    answers: record.answers ?? {},
    submitted_at: record.submitted_at.toISOString(),
  }));
}

export async function startPracticeQuiz(practiceId: string, studentId: string) {
  if (!Types.ObjectId.isValid(practiceId)) {
    return { success: false as const, message: "Practice quiz not found." };
  }
  await connectToDatabase();
  const [practice, student] = await Promise.all([
    PracticeQuizModel.findById(practiceId).lean<StoredPracticeQuiz>(),
    User.findOne({
      _id: studentId,
      role: "student",
      isActive: true,
    })
      .select("cohort_id")
      .lean(),
  ]);
  if (
    !practice ||
    !practice.published ||
    !student ||
    student.cohort_id !== practice.cohort_id
  ) {
    return { success: false as const, message: "Practice quiz not found." };
  }

  const now = new Date();
  let attempt = await PracticeAttemptModel.findOne({
    practice_id: practiceId,
    student_id: studentId,
    submitted_at: { $exists: false },
  }).sort({ started_at: -1 });
  if (
    !attempt ||
    now.getTime() >
      attempt.started_at.getTime() + practice.duration_minutes * 60_000 + 60_000
  ) {
    attempt = await PracticeAttemptModel.create({
      practice_id: practiceId,
      student_id: studentId,
      cohort_id: practice.cohort_id,
      started_at: now,
      answers: {},
      score: 0,
      total_marks: practice.total_marks,
    });
  }
  return {
    success: true as const,
    attemptId: String(attempt._id),
    startedAt: attempt.started_at.toISOString(),
  };
}

export async function submitPracticeQuiz(
  practiceId: string,
  studentId: string,
  attemptId: string,
  answers: Record<string, string>,
) {
  if (
    !Types.ObjectId.isValid(practiceId) ||
    !Types.ObjectId.isValid(attemptId)
  ) {
    return { success: false as const, message: "Practice quiz not found." };
  }
  await connectToDatabase();
  const [practice, attempt, student] = await Promise.all([
    PracticeQuizModel.findById(practiceId).lean<StoredPracticeQuiz>(),
    PracticeAttemptModel.findOne({
      _id: attemptId,
      practice_id: practiceId,
      student_id: studentId,
      submitted_at: { $exists: false },
    }),
    User.findOne({ _id: studentId, role: "student", isActive: true })
      .select("cohort_id")
      .lean(),
  ]);
  if (
    !practice ||
    !practice.published ||
    !attempt ||
    !student ||
    student.cohort_id !== practice.cohort_id
  ) {
    return { success: false as const, message: "Practice quiz not found." };
  }
  const now = new Date();
  if (
    now.getTime() >
    attempt.started_at.getTime() + practice.duration_minutes * 60_000 + 60_000
  ) {
    return { success: false as const, message: "Practice quiz time expired." };
  }
  const questionIds = new Set(
    practice.questions.map((question) => question.id),
  );
  if (
    Object.entries(answers).some(
      ([questionId, answer]) =>
        !questionIds.has(questionId) ||
        typeof answer !== "string" ||
        answer.length > 20_000,
    )
  ) {
    return { success: false as const, message: "Invalid practice answers." };
  }
  const score = practice.questions.reduce(
    (total, question) =>
      total +
      (answers[question.id] === question.correct_answer ? question.marks : 0),
    0,
  );
  const submittedAttempt = await PracticeAttemptModel.findOneAndUpdate(
    {
      _id: attempt._id,
      submitted_at: { $exists: false },
    },
    {
      $set: {
        submitted_at: now,
        answers,
        score,
      },
    },
    { new: true },
  ).lean();
  if (!submittedAttempt) {
    return {
      success: false as const,
      message: "This practice attempt has already been submitted.",
    };
  }
  return {
    success: true as const,
    attempt: {
      id: String(submittedAttempt._id),
      practice_id: practiceId,
      student_id: studentId,
      score,
      total_marks: practice.total_marks,
      answers,
      submitted_at: now.toISOString(),
      correctAnswers: Object.fromEntries(
        practice.questions.map((question) => [
          question.id,
          question.correct_answer,
        ]),
      ),
    },
  };
}

// --- Practice questions ---------------------------------------------------

export async function getPracticeQuestions(
  departmentId: string,
  courseId?: string,
) {
  return delay(
    practiceQuestions.filter(
      (q) =>
        q.department_id === departmentId &&
        (!courseId || q.course_id === courseId),
    ),
  );
}

export function getPracticeProgress(studentId: string) {
  return (
    practiceProgress.find((p) => p.student_id === studentId) ?? {
      student_id: studentId,
      attempted: 0,
      correct: 0,
      streak: 0,
      topics_completed: [],
    }
  );
}

export function recordPracticeAttempt(studentId: string, wasCorrect: boolean) {
  let progress = practiceProgress.find((p) => p.student_id === studentId);
  if (!progress) {
    progress = {
      student_id: studentId,
      attempted: 0,
      correct: 0,
      streak: 0,
      topics_completed: [],
    };
    practiceProgress.push(progress);
  }
  progress.attempted += 1;
  if (wasCorrect) {
    progress.correct += 1;
    progress.streak += 1;
  } else {
    progress.streak = 0;
  }
  return progress;
}

// --- Interview prep ---------------------------------------------------------

export async function getInterviewQuestions(
  departmentId: string,
  category?: string,
) {
  return delay(
    interviewQuestions.filter(
      (q) =>
        q.department_id === departmentId &&
        (!category || q.category === category),
    ),
  );
}

// --- Notifications ------------------------------------------------------

export async function getNotificationsForUser(userId: string) {
  return delay(
    notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export function markNotificationRead(id: string) {
  const n = notifications.find((n) => n.id === id);
  if (n) n.read = true;
}

// --- Leaderboard (Phase 4) ------------------------------------------------

const WEIGHTS = {
  tests: 0.4,
  assignments: 0.25,
  practice: 0.2,
  attendance: 0.15,
};

// RULE: a student may only request their OWN department's leaderboard;
// an instructor may request any department; admin, anything. The page
// calling this is responsible for enforcing that — see
// app/*/leaderboard*/page.tsx.
export async function getLeaderboard(departmentId: string) {
  const deptStudents = students.filter((s) => s.department_id === departmentId);

  const rows = deptStudents.map((s) => {
    const studentTests = testSubmissions.filter((t) => t.student_id === s.id);
    const testAvg = studentTests.length
      ? (studentTests.reduce((sum, t) => sum + t.score, 0) /
          studentTests.length /
          20) *
        100
      : 0;

    const studentAssignments = assignmentSubmissions.filter(
      (a) => a.student_id === s.id && a.score !== undefined,
    );
    const assignmentAvg = studentAssignments.length
      ? studentAssignments.reduce((sum, a) => sum + (a.score ?? 0), 0) /
        studentAssignments.length
      : 0;

    const progress = getPracticeProgress(s.id);
    const practiceScore = progress.attempted
      ? (progress.correct / progress.attempted) * 100
      : 0;

    const attendanceScore = attendancePercentFor(s.id);

    const overall =
      testAvg * WEIGHTS.tests +
      assignmentAvg * WEIGHTS.assignments +
      practiceScore * WEIGHTS.practice +
      attendanceScore * WEIGHTS.attendance;

    return {
      student_id: s.id,
      department_id: s.department_id,
      cohort_id: s.cohort_id,
      test_score: Math.round(testAvg),
      assignment_score: Math.round(assignmentAvg),
      practice_score: Math.round(practiceScore),
      attendance_score: attendanceScore,
      overall_score: Math.round(overall),
    };
  });

  return rows
    .sort((a, b) => b.overall_score - a.overall_score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
