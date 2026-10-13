"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Test } from "@/types";
import {
  saveTestDraftAction,
  submitTestAction,
} from "@/app/student/tests/actions";

type SubmissionResult = {
  score: number;
  total: number;
  gradingStatus: "in_progress" | "needs_review" | "graded";
};

export function TestTaker({
  test,
  startedAt,
  initialAnswers,
}: {
  test: Test;
  startedAt: string;
  initialAnswers: Record<string, string>;
}) {
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(
      0,
      Math.ceil(
        (new Date(startedAt).getTime() +
          test.duration_minutes * 60_000 -
          Date.now()) /
          1000,
      ),
    ),
  );
  const [isPending, startTransition] = useTransition();
  const initialSave = useRef(true);
  const saveSequence = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const submit = useCallback(() => {
    if (isPending || result) return;
    setError("");
    startTransition(async () => {
      const response = await submitTestAction(test.id, answers);
      if (response.success) {
        setResult({
          score: response.score,
          total: response.total,
          gradingStatus: response.gradingStatus,
        });
      } else {
        setError(response.message);
      }
    });
  }, [answers, isPending, result, test.id]);

  useEffect(() => {
    const updateTimer = () => {
      const deadline =
        new Date(startedAt).getTime() + test.duration_minutes * 60_000;
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, test.duration_minutes]);

  useEffect(() => {
    if (initialSave.current) {
      initialSave.current = false;
      return;
    }
    if (result) return;

    const sequence = ++saveSequence.current;
    const timeout = window.setTimeout(() => {
      setSaveStatus("Saving progress…");
      const queuedSave = saveQueue.current.then(async () => {
        const response = await saveTestDraftAction(test.id, answers);
        if (sequence !== saveSequence.current) return;
        if (response.success) {
          setSaveStatus("Progress saved");
          setError("");
        } else {
          setSaveStatus("");
          setError(response.message);
        }
      });
      saveQueue.current = queuedSave.catch((reason: unknown) => {
        if (sequence !== saveSequence.current) return;
        setSaveStatus("");
        setError(
          reason instanceof Error
            ? `Could not save progress: ${reason.message}`
            : "Could not save progress. Check your connection and try again.",
        );
      });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [answers, result, test.id]);

  useEffect(() => {
    if (remainingSeconds === 0 && !result && !isPending) submit();
  }, [remainingSeconds, result, isPending, submit]);

  if (result) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          {result.gradingStatus === "graded"
            ? "Assessment submitted"
            : result.gradingStatus === "needs_review"
              ? "Assessment submitted — instructor review pending"
              : "Assessment in progress"}
        </p>
        <p className="mt-2 text-4xl font-semibold text-brand-600">
          {result.score} / {result.total}
        </p>
        {result.gradingStatus === "needs_review" && (
          <p className="mt-2 text-sm text-gray-500">
            Your short-answer and coding responses will be graded by your
            instructor.
          </p>
        )}
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="space-y-4">
      <div
        className={`sticky top-2 z-10 rounded-xl border p-3 text-center text-sm font-semibold shadow-sm ${
          remainingSeconds <= 60
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-gray-200 bg-white text-gray-700"
        }`}
        aria-live="polite"
      >
        Time remaining: {minutes}:{String(seconds).padStart(2, "0")}
      </div>

      {test.questions.map((question, index) => (
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
          {(question.type === "multiple_choice" ||
            question.type === "true_false") && (
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label
                  key={`${question.id}-${optionIndex}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
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
            </div>
          )}
          {(question.type === "short_answer" || question.type === "coding") && (
            <textarea
              rows={question.type === "coding" ? 10 : 4}
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${
                question.type === "coding"
                  ? "font-mono"
                  : ""
              }`}
              placeholder={
                question.type === "coding"
                  ? "Write your code here. It will be reviewed by your instructor."
                  : "Your answer…"
              }
            />
          )}
        </section>
      ))}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {saveStatus && (
        <p role="status" className="text-right text-xs text-gray-500">
          {saveStatus}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit assessment"}
      </button>
    </div>
  );
}
