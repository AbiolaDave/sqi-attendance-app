import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import {
  getCourseName,
  getTestSubmission,
  getTestsVisibleTo,
} from "@/lib/data/queries";

export default async function StudentTestsPage() {
  const profile = await requireProfile(["student"]);
  const assessments = await getTestsVisibleTo(profile);
  const today = new Date().toISOString().slice(0, 10);
  const rows = await Promise.all(
    assessments.map(async (assessment) => ({
      assessment,
      courseName: await getCourseName(assessment.course_id),
      attempt: await getTestSubmission(assessment.id, profile._id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-gray-500">
          Published assessments for your cohort. Your attempt and score are
          saved to your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ assessment, courseName, attempt }) => {
          const isOpen =
            today >= assessment.start_date && today <= assessment.end_date;
          const isSubmitted = !!attempt?.submitted_at;
          const status = isSubmitted
            ? attempt.grading_status === "needs_review"
              ? "Awaiting instructor review"
              : "Submitted"
            : attempt
              ? "In progress"
              : today < assessment.start_date
                ? `Opens ${assessment.start_date}`
                : today > assessment.end_date
                  ? "Closed"
                  : "Ready";

          return (
            <article
              key={assessment.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="mb-1 text-xs text-gray-400">{courseName}</p>
              <h2 className="font-medium">{assessment.title}</h2>
              {assessment.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                  {assessment.description}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-400">
                {assessment.questions.length} questions ·{" "}
                {assessment.duration_minutes} minutes ·{" "}
                {assessment.total_marks} marks
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-500">{status}</span>
                {isSubmitted ? (
                  <span className="text-sm font-medium text-brand-700">
                    Score so far: {attempt.score}/{assessment.total_marks}
                  </span>
                ) : attempt || isOpen ? (
                  <Link
                    href={`/student/tests/${assessment.id}`}
                    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    {attempt ? "Continue assessment" : "Start assessment"} →
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400">
            There are no published assessments for your cohort yet.
          </p>
        )}
      </div>
    </div>
  );
}
