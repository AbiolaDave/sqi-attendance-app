"use client";

import { useState, useTransition } from "react";
import type { Test } from "@/types";
import { gradeAssessmentAction } from "@/app/instructor/tests/actions";

type AttemptResult = {
  id: string;
  submitted_at: string;
  started_at: string;
  score: number;
  auto_score: number;
  manual_score: number;
  grading_status: "in_progress" | "needs_review" | "graded";
  answers: Record<string, string>;
  student: { full_name: string; email: string };
};

function Status({ status }: { status: AttemptResult["grading_status"] }) {
  const label =
    status === "in_progress"
      ? "In progress"
      : status === "needs_review"
        ? "Needs review"
        : "Graded";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${
        status === "graded"
          ? "bg-green-50 text-green-700"
          : status === "needs_review"
            ? "bg-amber-50 text-amber-700"
            : "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}

export function AssessmentResults({
  assessment,
  attempts,
}: {
  assessment: Test;
  attempts: AttemptResult[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const submitted = attempts.filter((attempt) => !!attempt.submitted_at);
  const average = submitted.length
    ? Math.round(
        submitted.reduce((total, attempt) => total + attempt.score, 0) /
          submitted.length,
      )
    : 0;
  const manualMaximum = assessment.questions.reduce(
    (total, question) =>
      total +
      (question.type === "short_answer" || question.type === "coding"
        ? question.marks
        : 0),
    0,
  );

  function grade(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await gradeAssessmentAction(formData);
      if (!result.success) {
        setMessage(result.message);
      } else {
        setMessage("Score saved.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Attempts started</p>
          <p className="mt-1 text-xl font-semibold">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="mt-1 text-xl font-semibold">{submitted.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Average score</p>
          <p className="mt-1 text-xl font-semibold">
            {average} / {assessment.total_marks}
          </p>
        </div>
      </section>

      {message && (
        <p role="status" className="text-sm text-gray-600">
          {message}
        </p>
      )}

      {attempts.map((attempt) => (
        <article
          key={attempt.id}
          className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{attempt.student.full_name}</h2>
              <p className="text-xs text-gray-500">{attempt.student.email}</p>
              <p className="mt-1 text-xs text-gray-400">
                {attempt.submitted_at
                  ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}`
                  : `Started ${new Date(attempt.started_at).toLocaleString()}`}
              </p>
            </div>
            <div className="text-right">
              <Status status={attempt.grading_status} />
              {attempt.submitted_at && (
                <p className="mt-2 text-sm font-medium">
                  {attempt.score} / {assessment.total_marks}
                </p>
              )}
            </div>
          </div>

          {attempt.submitted_at && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {assessment.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-lg bg-gray-50 p-3 text-sm"
                >
                  <p className="font-medium">
                    {index + 1}. {question.prompt}{" "}
                    <span className="font-normal text-gray-400">
                      ({question.marks} marks)
                    </span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-gray-700">
                    {attempt.answers[question.id] || "No answer"}
                  </p>
                  {(question.type === "short_answer" ||
                    question.type === "coding") && (
                    <p className="mt-1 text-xs text-gray-500">
                      Manual question · {question.marks} marks
                    </p>
                  )}
                  {(question.type === "multiple_choice" ||
                    question.type === "true_false") && (
                    <p className="mt-1 text-xs text-gray-500">
                      Correct answer: {question.correct_answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {attempt.submitted_at && manualMaximum > 0 && (
            <form
              action={grade}
              className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
            >
              <input type="hidden" name="attempt_id" value={attempt.id} />
              <input
                type="hidden"
                name="assessment_id"
                value={assessment.id}
              />
              <label className="text-sm">
                Manual score (max {manualMaximum})
                <input
                  name="manual_score"
                  type="number"
                  min={0}
                  max={manualMaximum}
                  step="any"
                  required
                  defaultValue={attempt.manual_score}
                  className="mt-1 block w-36 rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save manual grade"}
              </button>
            </form>
          )}
        </article>
      ))}

      {attempts.length === 0 && (
        <p className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
          No students have started this assessment yet.
        </p>
      )}
    </div>
  );
}
