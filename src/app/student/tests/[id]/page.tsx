import Link from "next/link";
import { notFound } from "next/navigation";
import { TestTaker } from "@/components/tests/TestTaker";
import { requireProfile } from "@/lib/auth";
import {
  getStudentAssessment,
  getTestSubmission,
  startTestAttempt,
} from "@/lib/data/queries";

export default async function TakeTestPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile(["student"]);
  const test = await getStudentAssessment(params.id, profile._id);
  if (!test) notFound();

  const existing = await getTestSubmission(test.id, profile._id);
  if (existing?.submitted_at) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/student/tests"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Assessments
        </Link>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">{test.title}</h1>
          <p className="mt-3 text-sm text-gray-500">
            {existing.grading_status === "needs_review"
              ? "Your objective questions have been scored. Your instructor still needs to review your written or coding answers."
              : "You have completed this assessment."}
          </p>
          <p className="mt-2 text-4xl font-semibold text-brand-600">
            {existing.score} / {test.total_marks}
          </p>
        </div>
      </div>
    );
  }

  const attempt =
    existing?.started_at
      ? { success: true as const, startedAt: existing.started_at }
      : await startTestAttempt(test.id, profile._id);
  if (!attempt.success) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/student/tests"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Assessments
        </Link>
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          {attempt.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/student/tests"
        className="text-sm text-brand-700 hover:underline"
      >
        ← Assessments
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{test.title}</h1>
        {test.description && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
            {test.description}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {test.questions.length} questions · {test.total_marks} marks ·{" "}
          {test.duration_minutes} minutes. Submitting is final.
        </p>
      </div>
      <TestTaker
        test={test}
        startedAt={attempt.startedAt}
        initialAnswers={existing?.answers ?? {}}
      />
    </div>
  );
}
