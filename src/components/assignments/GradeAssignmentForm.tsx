"use client";

import { useState, useTransition } from "react";
import { gradeSubmissionAction } from "@/app/instructor/assignments/actions";

export function GradeAssignmentForm({
  submissionId,
  currentScore,
  maxScore,
  canGrade,
  feedback: initialFeedback,
}: {
  submissionId: string;
  currentScore?: number;
  maxScore: number;
  canGrade: boolean;
  feedback?: string;
}) {
  const [score, setScore] = useState(String(currentScore ?? ""));
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await gradeSubmissionAction(
        submissionId,
        Number(score),
        feedback,
      );
      setMessage(
        result.success ? "Grade saved." : result.message,
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        max={maxScore}
        step="any"
        required
        value={score}
        onChange={(event) => setScore(event.target.value)}
        aria-label="Score"
        placeholder={`Score / ${maxScore}`}
        className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        value={feedback}
        maxLength={2_000}
        onChange={(event) => setFeedback(event.target.value)}
        aria-label="Feedback"
        placeholder="Feedback (optional)"
        className="min-w-40 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={save}
        disabled={isPending || !canGrade}
        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Saving…" : canGrade ? "Save grade" : "Auto-graded"}
      </button>
      {message && (
        <span role="status" className="w-full text-xs text-gray-500">
          {message}
        </span>
      )}
    </div>
  );
}
