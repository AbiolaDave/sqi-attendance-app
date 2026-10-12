"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { PracticeQuiz } from "@/types";
import { submitPracticeQuizAction } from "@/app/student/practice/actions";

export function PracticeQuizTaker({
  quiz,
  attemptId,
  startedAt,
}: {
  quiz: PracticeQuiz;
  attemptId: string;
  startedAt: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    answers: Record<string, string>;
    correctAnswers: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(quiz.duration_minutes * 60);
  const [isPending, startTransition] = useTransition();
  const autoSubmitted = useRef(false);

  const submit = useCallback(() => {
    if (isPending || result) return;
    startTransition(async () => {
      const response = await submitPracticeQuizAction(
        quiz.id,
        attemptId,
        answers,
      );
      if (!response.success) {
        setError(response.message);
        return;
      }
      setResult({
        score: response.attempt.score,
        total: response.attempt.total_marks,
        answers: response.attempt.answers,
        correctAnswers: response.attempt.correctAnswers,
      });
    });
  }, [answers, attemptId, isPending, quiz.id, result, startedAt]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const end =
        new Date(startedAt).getTime() + quiz.duration_minutes * 60_000;
      const next = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, [quiz.duration_minutes, startedAt]);

  useEffect(() => {
    if (
      remaining === 0 &&
      !result &&
      !isPending &&
      !autoSubmitted.current
    ) {
      autoSubmitted.current = true;
      submit();
    }
  }, [isPending, remaining, result, submit]);

  if (result) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-500">Practice score</p>
          <p className="mt-1 text-3xl font-semibold text-brand-600">
            {result.score} / {result.total}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            This is a practice run; you can try again whenever you like.
          </p>
        </div>
        <div className="space-y-3">
          {quiz.questions.map((question, index) => {
            const correct =
              result.answers[question.id] ===
              result.correctAnswers[question.id];
            return (
              <div key={question.id} className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    correct ? "text-green-700" : "text-red-700"
                  }`}
                >
                  Your answer: {result.answers[question.id] ?? "No answer"}
                </p>
                {!correct && (
                  <p className="text-sm text-green-700">
                    Correct answer: {result.correctAnswers[question.id]}
                  </p>
                )}
                {question.explanation && (
                  <p className="mt-1 text-xs text-gray-600">
                    {question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/student/practice";
          }}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Done
        </button>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="space-y-4">
      <div
        className={`sticky top-2 z-10 rounded-xl border p-3 text-center text-sm font-semibold ${
          remaining <= 60
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-gray-200 bg-white"
        }`}
      >
        Time remaining: {minutes}:{String(seconds).padStart(2, "0")}
      </div>
      {quiz.questions.map((question, index) => (
        <section
          key={question.id}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-medium">
            {index + 1}. {question.prompt}{" "}
            <span className="text-xs font-normal text-gray-400">
              ({question.marks} marks)
            </span>
          </p>
          {question.options?.map((option, optionIndex) => (
            <label
              key={`${question.id}-${optionIndex}`}
              className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
            >
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === option}
                onChange={() =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: option,
                  }))
                }
              />
              {option}
            </label>
          ))}
        </section>
      ))}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit practice"}
      </button>
    </div>
  );
}
