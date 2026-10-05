import type {
  Department,
  Level,
  Cohort,
  CohortSchedule,
  Course,
  Student,
  Instructor,
  InstructorAssignment,
  SchoolClass,
  AttendanceRecord,
  BalanceEntry,
  Test,
  Assignment,
  AssignmentSubmission,
  PracticeQuestion,
  PracticeProgress,
  InterviewQuestion,
  Notification,
} from "@/types";

// ---------------------------------------------------------------------
// THIS FILE IS A STAND-IN FOR A DATABASE.
// ---------------------------------------------------------------------
// Everything below lives in server memory only: it resets whenever the
// dev server restarts or a new deploy happens, and it is NOT shared
// safely across concurrent users in production. It exists so every
// page in this app has real, connected data to render and mutate
// (mark attendance, record a payment, submit an assignment) while you
// build the real backend.
//
// When you're ready to wire up your own backend/database, replace the
// arrays in this file with real fetch calls in `src/lib/data/queries.ts`
// — that's the only file the rest of the app talks to, so pages
// themselves shouldn't need to change.
// ---------------------------------------------------------------------

export const departments: Department[] = [
  {
    id: "dept-se",
    name: "Software Engineering",
    description: "Full-stack web and mobile development",
  },
  {
    id: "dept-ds",
    name: "Data Science",
    description: "Data analysis, machine learning and statistics",
  },
  {
    id: "dept-cyber",
    name: "Cybersecurity",
    description: "Network security and ethical hacking",
  },
  {
    id: "dept-uiux",
    name: "UI/UX Design",
    description: "Product design and user research",
  },
];

export const levels: Level[] = [
  { id: "level-1", name: "Level 1", sort_order: 1 },
  { id: "level-2", name: "Level 2", sort_order: 2 },
  { id: "level-3", name: "Level 3", sort_order: 3 },
  { id: "level-4", name: "Level 4", sort_order: 4 },
  { id: "level-5", name: "Level 5", sort_order: 5 },
];

export const cohorts: Cohort[] = [
  {
    id: "cohort-se-l1-aug",
    department_id: "dept-se",
    level_id: "level-1",
    name: "August 2026",
    start_date: "2026-08-01",
  },
  {
    id: "cohort-se-l4-aug",
    department_id: "dept-se",
    level_id: "level-4",
    name: "August 2026",
    start_date: "2026-08-01",
  },
  {
    id: "cohort-ds-l1-aug",
    department_id: "dept-ds",
    level_id: "level-1",
    name: "August 2026",
    start_date: "2026-08-01",
  },
];

export const cohortSchedules: CohortSchedule[] = [
  {
    id: "schedule-1",
    cohort_id: "cohort-se-l1-aug",
    instructor_id: "instr-1",
    day_of_week: 1,
    start_time: "10:00",
    end_time: "12:00",
  },
  {
    id: "schedule-2",
    cohort_id: "cohort-se-l1-aug",
    instructor_id: "instr-1",
    day_of_week: 3,
    start_time: "10:00",
    end_time: "12:00",
  },
  {
    id: "schedule-3",
    cohort_id: "cohort-se-l1-aug",
    instructor_id: "instr-1",
    day_of_week: 5,
    start_time: "10:00",
    end_time: "12:00",
  },
];

export const courses: Course[] = [
  {
    id: "course-html-css",
    department_id: "dept-se",
    name: "HTML & CSS",
    code: "SE101",
  },
  {
    id: "course-js",
    department_id: "dept-se",
    name: "JavaScript",
    code: "SE102",
  },
  {
    id: "course-react",
    department_id: "dept-se",
    name: "React",
    code: "SE201",
  },
  {
    id: "course-node",
    department_id: "dept-se",
    name: "Node.js",
    code: "SE202",
  },
  {
    id: "course-git",
    department_id: "dept-se",
    name: "Git & GitHub",
    code: "SE104",
  },
  {
    id: "course-python-ds",
    department_id: "dept-ds",
    name: "Python for Data Science",
    code: "DS101",
  },
  {
    id: "course-stats",
    department_id: "dept-ds",
    name: "Statistics Fundamentals",
    code: "DS102",
  },
];

export const instructors: Instructor[] = [
  { id: "instr-1", department_id: "dept-se" },
  { id: "instr-2", department_id: "dept-ds" },
];

export const instructorAssignments: InstructorAssignment[] = [
  {
    id: "ia-1",
    instructor_id: "instr-1",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    course_id: "course-js",
  },
  {
    id: "ia-2",
    instructor_id: "instr-1",
    department_id: "dept-se",
    level_id: "level-4",
    cohort_id: "cohort-se-l4-aug",
    course_id: "course-react",
  },
  {
    id: "ia-3",
    instructor_id: "instr-2",
    department_id: "dept-ds",
    level_id: "level-1",
    cohort_id: "cohort-ds-l1-aug",
    course_id: "course-python-ds",
  },
];

// Balance data lives directly on the student record (running totals),
// exactly like it did in the Supabase draft, so the privacy rule you
// asked for ("students never see each other's balance, instructors
// only see their own students' balance, admin sees all") is easy to
// carry over — see the visibility helpers in queries.ts.
export const students: Student[] = [
  {
    id: "stud-1",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    total_fee: 300000,
    amount_paid: 200000,
  },
  {
    id: "stud-2",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    total_fee: 300000,
    amount_paid: 300000,
  },
  {
    id: "stud-3",
    department_id: "dept-ds",
    level_id: "level-1",
    cohort_id: "cohort-ds-l1-aug",
    total_fee: 250000,
    amount_paid: 0,
  },
];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const classes: SchoolClass[] = [
  {
    id: "class-1",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    course_id: "course-js",
    instructor_id: "instr-1",
    class_date: todayPlus(0),
    start_time: "10:00",
    end_time: "12:00",
    location: "Lab 2",
  },
  {
    id: "class-2",
    department_id: "dept-se",
    level_id: "level-4",
    cohort_id: "cohort-se-l4-aug",
    course_id: "course-react",
    instructor_id: "instr-1",
    class_date: todayPlus(0),
    start_time: "13:00",
    end_time: "15:00",
    location: "Lab 1",
  },
  {
    id: "class-3",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    course_id: "course-js",
    instructor_id: "instr-1",
    class_date: todayPlus(2),
    start_time: "10:00",
    end_time: "12:00",
    location: "Lab 2",
  },
  {
    id: "class-4",
    department_id: "dept-ds",
    level_id: "level-1",
    cohort_id: "cohort-ds-l1-aug",
    course_id: "course-python-ds",
    instructor_id: "instr-2",
    class_date: todayPlus(1),
    start_time: "09:00",
    end_time: "11:00",
    location: "Lab 3",
  },
];

export const attendance: AttendanceRecord[] = [
  {
    id: "att-1",
    class_id: "class-1",
    student_id: "stud-1",
    status: "present",
    marked_by: "instr-1",
    marked_at: new Date().toISOString(),
  },
  {
    id: "att-2",
    class_id: "class-1",
    student_id: "stud-2",
    status: "late",
    marked_by: "instr-1",
    marked_at: new Date().toISOString(),
  },
];

export const balanceEntries: BalanceEntry[] = [
  {
    id: "bal-1",
    student_id: "stud-1",
    amount: 200000,
    note: "Initial deposit",
    recorded_by: "instr-1",
    recorded_at: "2026-08-05T10:00:00Z",
  },
  {
    id: "bal-2",
    student_id: "stud-2",
    amount: 300000,
    note: "Paid in full",
    recorded_by: "instr-1",
    recorded_at: "2026-08-03T10:00:00Z",
  },
];

// --- Phase 2: tests & assignments ---------------------------------------

export const tests: Test[] = [
  {
    id: "test-1",
    title: "JavaScript Fundamentals Quiz",
    description: "Covers variables, functions, and array methods.",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    course_id: "course-js",
    duration_minutes: 30,
    start_date: todayPlus(-1),
    end_date: todayPlus(6),
    total_marks: 20,
    published: true,
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "Which keyword declares a block-scoped variable?",
        options: ["var", "let", "function", "global"],
        correct_answer: "let",
        marks: 5,
      },
      {
        id: "q2",
        type: "true_false",
        prompt: "Arrays in JavaScript are zero-indexed.",
        options: ["True", "False"],
        correct_answer: "True",
        marks: 5,
      },
      {
        id: "q3",
        type: "multiple_choice",
        prompt: "Which method adds an item to the end of an array?",
        options: ["push", "shift", "pop", "unshift"],
        correct_answer: "push",
        marks: 5,
      },
      {
        id: "q4",
        type: "short_answer",
        prompt: "What does '===' check that '==' doesn't?",
        marks: 5,
      },
    ],
  },
];

export const testSubmissions: {
  id: string;
  test_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
}[] = [
  {
    id: "ts-1",
    test_id: "test-1",
    student_id: "stud-2",
    score: 15,
    submitted_at: "2026-09-12T09:00:00Z",
  },
];

export const assignments: Assignment[] = [
  {
    id: "assign-1",
    title: "Build a Todo List App",
    description:
      "Use vanilla JS to build a todo list with add/delete/complete functionality.",
    course_id: "course-js",
    department_id: "dept-se",
    level_id: "level-1",
    cohort_id: "cohort-se-l1-aug",
    due_date: todayPlus(5),
    max_score: 100,
  },
  {
    id: "assign-2",
    title: "React Component Library",
    description:
      "Build 3 reusable React components with props and basic styling.",
    course_id: "course-react",
    department_id: "dept-se",
    level_id: "level-4",
    cohort_id: "cohort-se-l4-aug",
    due_date: todayPlus(10),
    max_score: 100,
  },
];

export const assignmentSubmissions: AssignmentSubmission[] = [
  {
    id: "as-1",
    assignment_id: "assign-1",
    student_id: "stud-2",
    submitted_at: "2026-09-11T14:00:00Z",
    file_name: "todo-app.zip",
    status: "graded",
    score: 92,
    feedback: "Clean structure, nice edge-case handling.",
  },
];

// --- Practice & interview prep -------------------------------------------

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "pq-1",
    department_id: "dept-se",
    course_id: "course-js",
    topic: "Functions",
    type: "multiple_choice",
    prompt: "What does a function that has no return statement return?",
    options: ["null", "undefined", "0", "an error"],
    correct_answer: "undefined",
    explanation: "Functions without an explicit return return undefined.",
  },
  {
    id: "pq-2",
    department_id: "dept-se",
    course_id: "course-js",
    topic: "Functions",
    type: "true_false",
    prompt: "Arrow functions have their own 'this' binding.",
    options: ["True", "False"],
    correct_answer: "False",
    explanation: "Arrow functions inherit 'this' from their enclosing scope.",
  },
  {
    id: "pq-3",
    department_id: "dept-se",
    course_id: "course-html-css",
    topic: "Flexbox",
    type: "multiple_choice",
    prompt: "Which property aligns flex items along the cross axis?",
    options: ["justify-content", "align-items", "flex-direction", "gap"],
    correct_answer: "align-items",
  },
];

export const practiceProgress: PracticeProgress[] = [
  {
    student_id: "stud-1",
    attempted: 12,
    correct: 9,
    streak: 3,
    topics_completed: ["Functions"],
  },
  {
    student_id: "stud-2",
    attempted: 20,
    correct: 18,
    streak: 6,
    topics_completed: ["Functions", "Flexbox"],
  },
];

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "iq-1",
    department_id: "dept-se",
    category: "JavaScript",
    question: "Explain the difference between let, const, and var.",
    difficulty: "easy",
    expected_answer: "Scope and reassignment differences.",
    tips: "Mention block scope vs function scope.",
  },
  {
    id: "iq-2",
    department_id: "dept-se",
    category: "React",
    question: "What problem do React keys solve?",
    difficulty: "medium",
    tips: "Talk about reconciliation and list diffing.",
  },
  {
    id: "iq-3",
    department_id: "dept-se",
    category: "General",
    question:
      "Walk me through what happens when you type a URL into a browser.",
    difficulty: "hard",
  },
];

// --- Notifications ----------------------------------------------------------

export const notifications: Notification[] = [
  {
    id: "notif-1",
    user_id: "stud-1",
    type: "assignment",
    title: "New assignment posted",
    message: "Build a Todo List App is due in 5 days.",
    created_at: new Date().toISOString(),
    read: false,
  },
  {
    id: "notif-2",
    user_id: "stud-1",
    type: "attendance",
    title: "Attendance recorded",
    message: "You were marked present for JavaScript today.",
    created_at: new Date().toISOString(),
    read: true,
  },
  {
    id: "notif-3",
    user_id: "instr-1",
    type: "test",
    title: "New test submission",
    message: "Jane Doe submitted JavaScript Fundamentals Quiz.",
    created_at: new Date().toISOString(),
    read: false,
  },
];
