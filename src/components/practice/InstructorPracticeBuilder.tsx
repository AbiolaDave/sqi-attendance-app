"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPracticeQuizAction } from "@/app/instructor/practice/actions";

type PracticeQuestionDraft = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: string[];
  correct_answer: string;
  marks: number;
  explanation: string;
};

type CohortOption = { id: string; name: string; course_name?: string };

const newQuestion = (id: string): PracticeQuestionDraft => ({
  id,
  type: "multiple_choice",
  prompt: "",
  options: ["", "", "", ""],
  correct_answer: "",
  marks: 1,
  explanation: "",
});

export function InstructorPracticeBuilder({
  cohorts,
}: {
  cohorts: CohortOption[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<PracticeQuestionDraft[]>([
    newQuestion("practice-question-1"),
  ]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const serializedQuestions = useMemo(
    () => JSON.stringify(questions),
    [questions],
  );

  function update(id: string, changes: Partial<PracticeQuestionDraft>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...changes } : question,
      ),
    );
  }

  function submit(formData: FormData) {
    setError("");
    formData.set("questions", serializedQuestions);
    startTransition(async () => {
      const result = await createPracticeQuizAction(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setQuestions([newQuestion(crypto.randomUUID())]);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <input type="hidden" name="questions" value={serializedQuestions} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Practice quiz title
          <input
            name="title"
            required
            maxLength={160}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Cohort
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
          The practice course is matched to the selected cohort’s department
          course.
        </p>
        <label className="text-sm">
          Time limit (minutes)
          <input
            name="duration_minutes"
            type="number"
            min={1}
            max={300}
            defaultValue={15}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Instructions
          <textarea
            name="description"
            rows={2}
            maxLength={2_000}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-4">
        <div>
          <h3 className="font-medium">Questions</h3>
          <p className="text-xs text-gray-500">
            Practice is always available to students and can be repeated any
            number of times. Only objective questions are supported.
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
                    current.filter((item) => item.id !== question.id),
                  )
                }
                className="text-xs text-red-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_100px]">
              <label className="text-xs text-gray-600">
                Prompt
                <textarea
                  required
                  maxLength={5_000}
                  rows={2}
                  value={question.prompt}
                  onChange={(event) =>
                    update(question.id, { prompt: event.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                Type
                <select
                  value={question.type}
                  onChange={(event) => {
                    const type = event.target.value as PracticeQuestionDraft["type"];
                    update(question.id, {
                      type,
                      options:
                        type === "true_false" ? ["True", "False"] : ["", "", "", ""],
                      correct_answer: type === "true_false" ? "True" : "",
                    });
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / false</option>
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
                    update(question.id, { marks: Number(event.target.value) })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            {question.type === "multiple_choice" ? (
              <div className="grid gap-2 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`practice-correct-${question.id}`}
                      checked={!!option && question.correct_answer === option}
                      aria-label={`Option ${optionIndex + 1} is correct`}
                      onChange={() =>
                        update(question.id, { correct_answer: option })
                      }
                    />
                    <input
                      required
                      maxLength={500}
                      value={option}
                      onChange={(event) => {
                        const options = [...question.options];
                        const wasCorrect =
                          question.correct_answer === options[optionIndex];
                        options[optionIndex] = event.target.value;
                        update(question.id, {
                          options,
                          ...(wasCorrect
                            ? { correct_answer: event.target.value }
                            : {}),
                        });
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={question.options.length >= 8}
                  onClick={() =>
                    update(question.id, {
                      options: [...question.options, ""],
                    })
                  }
                  className="text-left text-xs text-brand-700 disabled:opacity-40"
                >
                  + Add option
                </button>
              </div>
            ) : (
              <label className="block max-w-xs text-xs text-gray-600">
                Correct answer
                <select
                  value={question.correct_answer}
                  onChange={(event) =>
                    update(question.id, {
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
              Explanation shown after answering (optional)
              <textarea
                rows={2}
                maxLength={2_000}
                value={question.explanation}
                onChange={(event) =>
                  update(question.id, { explanation: event.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </article>
        ))}
        <button
          type="button"
          onClick={() =>
            setQuestions((current) => [
              ...current,
              newQuestion(crypto.randomUUID()),
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
        {isPending ? "Creating…" : "Create practice quiz"}
      </button>
    </form>
  );
}
