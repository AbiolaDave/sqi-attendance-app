"use client";

import { useState, useTransition } from "react";
import type { Test } from "@/types";
import { submitTestAction } from "@/app/student/tests/actions";

export function TestTaker({ test }: { test: Test }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitTestAction(test.id, answers);
      if (res.success) setResult({ score: res.score!, total: res.total! });
    });
  }

  if (result) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-sm text-gray-500 mb-1">Your score</p>
        <p className="text-4xl font-semibold text-brand-600">{result.score} / {result.total}</p>
        <p className="text-sm text-gray-400 mt-2">Short-answer questions aren&apos;t auto-graded and are excluded from this score.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {test.questions.map((q, idx) => (
        <div key={q.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-medium mb-3">
            {idx + 1}. {q.prompt} <span className="text-xs text-gray-400 font-normal">({q.marks} marks)</span>
          </p>

          {(q.type === "multiple_choice" || q.type === "true_false") && (
            <div className="space-y-2">
              {q.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {(q.type === "short_answer" || q.type === "coding") && (
            <textarea
              rows={q.type === "coding" ? 6 : 2}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
              placeholder="Your answer…"
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-lg bg-brand-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit Test"}
      </button>
    </div>
  );
}
