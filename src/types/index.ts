export type UserRole = "super_admin" | "instructor" | "student";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type BalanceStatus = "fully_paid" | "partially_paid" | "outstanding";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Level {
  id: string;
  name: string;
  sort_order: number;
}

export interface Cohort {
  id: string;
  department_id: string;
  level_id: string;
  name: string;
  start_date?: string;
}

export interface CohortSchedule {
  id: string;
  cohort_id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Course {
  id: string;
  department_id: string;
  name: string;
  code?: string;
}

export interface Student {
  id: string;
  department_id: string;
  level_id: string;
  cohort_id: string;
  total_fee: number;
  amount_paid: number;
}

export interface Instructor {
  id: string;
  department_id: string;
}

export interface InstructorAssignment {
  id: string;
  instructor_id: string;
  department_id: string;
  level_id: string;
  cohort_id: string;
  course_id?: string;
}

export interface SchoolClass {
  id: string;
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
}

export interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by: string;
  marked_at: string;
}

export interface BalanceEntry {
  id: string;
  student_id: string;
  amount: number;
  note?: string;
  recorded_by: string;
  recorded_at: string;
}

// --- Phase 2: tests & assignments -------------------------------------

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "coding";

export interface TestQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  department_id: string;
  level_id: string;
  cohort_id: string;
  course_id: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  total_marks: number;
  published: boolean;
  questions: TestQuestion[];
}

export interface TestSubmission {
  id: string;
  test_id: string;
  student_id: string;
  submitted_at: string;
  score: number;
  answers: Record<string, string>;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  department_id: string;
  level_id: string;
  cohort_id: string;
  due_date: string;
  max_score: number;
}

export type SubmissionStatus =
  | "not_submitted"
  | "submitted"
  | "late"
  | "graded";

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at?: string;
  file_name?: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
}

// --- Practice & interview prep -----------------------------------------

export interface PracticeQuestion {
  id: string;
  department_id: string;
  course_id: string;
  topic: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface PracticeProgress {
  student_id: string;
  attempted: number;
  correct: number;
  streak: number;
  topics_completed: string[];
}

export type InterviewDifficulty = "easy" | "medium" | "hard";

export interface InterviewQuestion {
  id: string;
  department_id: string;
  category: string;
  question: string;
  difficulty: InterviewDifficulty;
  expected_answer?: string;
  explanation?: string;
  tips?: string;
}

// --- Notifications -------------------------------------------------------

export type NotificationType =
  | "assignment"
  | "test"
  | "attendance"
  | "schedule"
  | "payment"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

// --- Leaderboard -----------------------------------------------------------

export interface LeaderboardEntry {
  student_id: string;
  department_id: string;
  cohort_id: string;
  test_score: number;
  assignment_score: number;
  practice_score: number;
  attendance_score: number;
  overall_score: number;
  rank: number;
}
