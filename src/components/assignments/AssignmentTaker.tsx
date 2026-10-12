"use client";

import { useState, useTransition } from "react";
import type { Assignment } from "@/types";
import { submitAssignmentAction } from "@/app/student/assignments/actions";

export function AssignmentTaker({
  assignment,
}: {
  assignment: Assignment;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await submitAssignmentAction(assignment.id, answers);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {(assignment.questions ?? []).map((question, index) => (
        <section
          key={question.id}
          className="rounded-xl border border-gray-200 p-4"
        >
          <p className="mb-3 text-sm font-medium">
            {index + 1}. {question.prompt}{" "}
            <span className="text-xs font-normal text-gray-400">
              ({question.marks} marks)
            </span>
          </p>
          {question.type === "multiple_choice" ||
          question.type === "true_false" ? (
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label
                  key={`${question.id}-${optionIndex}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
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
            </div>
          ) : (
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
                question.type === "coding" ? "font-mono" : ""
              }`}
              placeholder={
                question.type === "coding"
                  ? "Write your code here."
                  : "Your answer…"
              }
            />
          )}
        </section>
      ))}
      {message && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit assignment"}
      </button>
    </div>
  );
}
