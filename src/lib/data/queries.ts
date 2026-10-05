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
import { MOCK_USERS, type MockUser } from "@/lib/mock-auth/session";
import type {
  AttendanceStatus,
  BalanceStatus,
  Assignment,
  AssignmentSubmission,
  Test,
} from "@/types";

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
  return delay(departments);
}
export async function getLevels() {
  return delay(levels);
}
export async function getCohorts() {
  return delay(cohorts);
}
export async function getCourses() {
  return delay(courses);
}
export async function getDepartmentName(id: string) {
  return departments.find((d) => d.id === id)?.name ?? "—";
}
export async function getCohortName(id: string) {
  return cohorts.find((c) => c.id === id)?.name ?? "—";
}
export async function getLevelName(id: string) {
  return levels.find((l) => l.id === id)?.name ?? "—";
}
export async function getCourseName(id: string) {
  return courses.find((c) => c.id === id)?.name ?? "—";
}

// --- People ----------------------------------------------------------------

export async function getProfile(id: string): Promise<MockUser | undefined> {
  return MOCK_USERS.find((u) => u.id === id);
}

export async function getInstructors() {
  return delay(
    instructors.map((i) => ({
      ...i,
      profile: MOCK_USERS.find((u) => u.id === i.id),
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

export function getCohortIdsForInstructor(instructorId: string): string[] {
  return [
    ...new Set(
      instructorAssignments
        .filter((a) => a.instructor_id === instructorId)
        .map((a) => a.cohort_id),
    ),
  ];
}

// RULE: a student can only ever be fetched by themself, an instructor
// assigned to their cohort, or an admin. Standing in for the
// `students_select` RLS policy from the earlier Supabase draft.
export async function getStudentsVisibleTo(user: MockUser) {
  if (user.role === "super_admin") return delay(students);
  if (user.role === "instructor") {
    const cohortIds = getCohortIdsForInstructor(user.id);
    return delay(students.filter((s) => cohortIds.includes(s.cohort_id)));
  }
  return delay(students.filter((s) => s.id === user.id));
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
export function canViewBalance(user: MockUser, studentId: string): boolean {
  if (user.role === "super_admin") return true;
  if (user.id === studentId) return true;
  if (user.role === "instructor") {
    const student = students.find((s) => s.id === studentId);
    if (!student) return false;
    return getCohortIdsForInstructor(user.id).includes(student.cohort_id);
  }
  return false;
}

export async function getBalanceEntriesForStudent(
  user: MockUser,
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
  user: MockUser,
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
    recorded_by: user.id,
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
  return delay(
    classes.filter(
      (c) =>
        c.instructor_id === instructorId && (!date || c.class_date === date),
    ),
  );
}

export async function getClassesForCohort(cohortId: string, fromDate?: string) {
  return delay(
    classes
      .filter(
        (c) =>
          c.cohort_id === cohortId && (!fromDate || c.class_date >= fromDate),
      )
      .sort((a, b) =>
        (a.class_date + a.start_time).localeCompare(
          b.class_date + b.start_time,
        ),
      ),
  );
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
  return delay(attendance.filter((a) => a.class_id === classId));
}

export async function getAttendanceForStudent(studentId: string) {
  return delay(attendance.filter((a) => a.student_id === studentId));
}

export async function saveAttendance(
  classId: string,
  markedBy: string,
  entries: { studentId: string; status: AttendanceStatus }[],
) {
  entries.forEach((entry) => {
    const existing = attendance.find(
      (a) => a.class_id === classId && a.student_id === entry.studentId,
    );
    if (existing) {
      existing.status = entry.status;
      existing.marked_at = new Date().toISOString();
    } else {
      attendance.push({
        id: `att-${attendance.length + 1}`,
        class_id: classId,
        student_id: entry.studentId,
        status: entry.status,
        marked_by: markedBy,
        marked_at: new Date().toISOString(),
      });
    }
  });
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

// RULE: students only see tests for their own department/level/cohort
// that are published; instructors only see tests for cohorts they
// teach; admin sees all.
export async function getTestsVisibleTo(user: MockUser): Promise<Test[]> {
  if (user.role === "super_admin") return delay(tests);
  if (user.role === "instructor") {
    const cohortIds = getCohortIdsForInstructor(user.id);
    return delay(tests.filter((t) => cohortIds.includes(t.cohort_id)));
  }
  const student = students.find((s) => s.id === user.id);
  if (!student) return delay([]);
  return delay(
    tests.filter((t) => t.cohort_id === student.cohort_id && t.published),
  );
}

export async function getTestById(id: string) {
  return tests.find((t) => t.id === id);
}

export function getTestSubmission(testId: string, studentId: string) {
  return testSubmissions.find(
    (s) => s.test_id === testId && s.student_id === studentId,
  );
}

export function submitTest(
  testId: string,
  studentId: string,
  answers: Record<string, string>,
) {
  const test = tests.find((t) => t.id === testId);
  if (!test) return { success: false, message: "Test not found." };

  let score = 0;
  test.questions.forEach((q) => {
    if (q.correct_answer && answers[q.id] === q.correct_answer)
      score += q.marks;
  });

  testSubmissions.push({
    id: `ts-${testSubmissions.length + 1}`,
    test_id: testId,
    student_id: studentId,
    score,
    submitted_at: new Date().toISOString(),
  });

  return { success: true, score, total: test.total_marks };
}

// --- Assignments (Phase 2) ----------------------------------------------

export async function getAssignmentsVisibleTo(
  user: MockUser,
): Promise<Assignment[]> {
  if (user.role === "super_admin") return delay(assignments);
  if (user.role === "instructor") {
    const cohortIds = getCohortIdsForInstructor(user.id);
    return delay(assignments.filter((a) => cohortIds.includes(a.cohort_id)));
  }
  const student = students.find((s) => s.id === user.id);
  if (!student) return delay([]);
  return delay(assignments.filter((a) => a.cohort_id === student.cohort_id));
}

export async function getSubmissionsForAssignment(
  assignmentId: string,
): Promise<AssignmentSubmission[]> {
  return delay(
    assignmentSubmissions.filter((s) => s.assignment_id === assignmentId),
  );
}

export function getSubmissionForStudent(
  assignmentId: string,
  studentId: string,
) {
  return assignmentSubmissions.find(
    (s) => s.assignment_id === assignmentId && s.student_id === studentId,
  );
}

export function submitAssignment(
  assignmentId: string,
  studentId: string,
  fileName: string,
) {
  const assignment = assignments.find((a) => a.id === assignmentId);
  if (!assignment) return { success: false };
  const isLate = new Date() > new Date(assignment.due_date);

  const existing = getSubmissionForStudent(assignmentId, studentId);
  if (existing) {
    existing.submitted_at = new Date().toISOString();
    existing.file_name = fileName;
    existing.status = isLate ? "late" : "submitted";
  } else {
    assignmentSubmissions.push({
      id: `as-${assignmentSubmissions.length + 1}`,
      assignment_id: assignmentId,
      student_id: studentId,
      submitted_at: new Date().toISOString(),
      file_name: fileName,
      status: isLate ? "late" : "submitted",
    });
  }
  return { success: true };
}

export function gradeSubmission(
  submissionId: string,
  score: number,
  feedback?: string,
) {
  const submission = assignmentSubmissions.find((s) => s.id === submissionId);
  if (!submission) return { success: false };
  submission.score = score;
  submission.feedback = feedback;
  submission.status = "graded";
  return { success: true };
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
