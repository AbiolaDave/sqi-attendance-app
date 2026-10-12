"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuestionType, TestQuestion } from "@/types";
import { createAssignmentAction } from "@/app/instructor/assignments/actions";

type CohortOption = { id: string; name: string; course_name?: string };
type DraftQuestion = Omit<TestQuestion, "id"> & { id: string };

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / false" },
  { value: "short_answer", label: "Short answer (manual grade)" },
  { value: "coding", label: "Coding (manual grade)" },
];

const INITIAL_QUESTION: Omit<DraftQuestion, "id"> = {
  type: "multiple_choice",
  prompt: "",
  options: ["", "", "", ""],
  correct_answer: "",
  marks: 1,
  explanation: "",
};

export function InstructorAssignmentBuilder({
  cohorts,
}: {
  cohorts: CohortOption[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { ...INITIAL_QUESTION, id: "assignment-question-1" },
  ]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const questionsJson = useMemo(() => JSON.stringify(questions), [questions]);
  const maxScore = questions.reduce(
    (total, question) => total + (Number(question.marks) || 0),
    0,
  );

  function updateQuestion(id: string, update: Partial<DraftQuestion>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...update } : question,
      ),
    );
  }

  function updateType(question: DraftQuestion, type: QuestionType) {
    updateQuestion(question.id, {
      type,
      options:
        type === "multiple_choice"
          ? ["", "", "", ""]
          : type === "true_false"
            ? ["True", "False"]
            : undefined,
      correct_answer:
        type === "multiple_choice"
          ? ""
          : type === "true_false"
            ? "True"
            : undefined,
    });
  }

  function handleSubmit(formData: FormData) {
    setError("");
    formData.set("questions", questionsJson);
    startTransition(async () => {
      const result = await createAssignmentAction(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
      setQuestions([{ ...INITIAL_QUESTION, id: crypto.randomUUID() }]);
      setError("");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="questions" value={questionsJson} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Assignment title
          <input
            name="title"
            required
            maxLength={160}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Build a responsive portfolio"
          />
        </label>
        <label className="text-sm">
          Cohort you teach
          <select
            name="cohort_id"
            required
            defaultValue=""
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="" disabled>
              Select a cohort
            </option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} — {cohort.course_name || "Course not set"}
              </option>
            ))}
          </select>
        </label>
        <p className="self-center text-sm text-gray-500">
          The assignment course is matched to the selected cohort’s department
          course.
        </p>
        <label className="text-sm">
          Due date
          <input
            name="due_date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Instructions
          <textarea
            name="description"
            rows={3}
            maxLength={2_000}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Describe what students need to complete and submit."
          />
        </label>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-5">
        <div>
          <h3 className="font-medium">Assignment questions</h3>
          <p className="text-xs text-gray-500">
            {questions.length} question(s) · {maxScore} marks. Objective
            questions are scored automatically; written and coding work is
            reviewed by you.
          </p>
        </div>
        {questions.map((question, index) => (
          <article
            key={question.id}
            className="space-y-3 rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Question {index + 1}</h4>
              <button
                type="button"
                disabled={questions.length === 1}
                onClick={() =>
                  setQuestions((current) =>
                    current.filter((entry) => entry.id !== question.id),
                  )
                }
                className="text-xs text-red-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_220px_110px]">
              <label className="text-xs text-gray-600">
                Question prompt
                <textarea
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(question.id, { prompt: event.target.value })
                  }
                  maxLength={5_000}
                  rows={2}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                Type
                <select
                  value={question.type}
                  onChange={(event) =>
                    updateType(question, event.target.value as QuestionType)
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Marks
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={question.marks}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      marks: Number(event.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            {question.type === "multiple_choice" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Fill at least two options, then select the correct answer.
                </p>
                {question.options?.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      aria-label={`Option ${optionIndex + 1} is correct`}
                      checked={!!option && question.correct_answer === option}
                      onChange={() =>
                        updateQuestion(question.id, { correct_answer: option })
                      }
                    />
                    <input
                      required
                      maxLength={500}
                      value={option}
                      onChange={(event) => {
                        const nextOptions = [...(question.options ?? [])];
                        const selected =
                          question.correct_answer === nextOptions[optionIndex];
                        nextOptions[optionIndex] = event.target.value;
                        updateQuestion(question.id, {
                          options: nextOptions,
                          ...(selected
                            ? { correct_answer: event.target.value }
                            : {}),
                        });
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={(question.options?.length ?? 0) >= 8}
                  onClick={() =>
                    updateQuestion(question.id, {
                      options: [...(question.options ?? []), ""],
                    })
                  }
                  className="text-xs text-brand-700 disabled:opacity-40"
                >
                  + Add option
                </button>
              </div>
            )}
            {question.type === "true_false" && (
              <label className="block max-w-xs text-xs text-gray-600">
                Correct answer
                <select
                  value={question.correct_answer ?? "True"}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      correct_answer: event.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option>True</option>
                  <option>False</option>
                </select>
              </label>
            )}
            <label className="block text-xs text-gray-600">
              Explanation shown after submission (optional)
              <textarea
                rows={2}
                maxLength={2_000}
                value={question.explanation ?? ""}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    explanation: event.target.value,
                  })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            {(question.type === "short_answer" ||
              question.type === "coding") && (
              <p className="text-xs text-amber-700">
                Student responses will be manually graded by you.
              </p>
            )}
          </article>
        ))}
        <button
          type="button"
          onClick={() =>
            setQuestions((current) => [
              ...current,
              { ...INITIAL_QUESTION, id: crypto.randomUUID() },
            ])
          }
          className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
        >
          + Add question
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || cohorts.length === 0}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create assignment"}
      </button>
    </form>
  );
}
