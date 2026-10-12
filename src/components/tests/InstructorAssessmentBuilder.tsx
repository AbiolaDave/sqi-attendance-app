"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuestionType, TestQuestion } from "@/types";
import { createAssessmentAction } from "@/app/instructor/tests/actions";

type CohortOption = {
  id: string;
  name: string;
  course_name?: string;
};

type DraftQuestion = Omit<TestQuestion, "id"> & { id: string };

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / false" },
  { value: "short_answer", label: "Short answer (manual grade)" },
  { value: "coding", label: "Coding (manual grade)" },
];

const NEW_QUESTION: Omit<DraftQuestion, "id"> = {
  type: "multiple_choice",
  prompt: "",
  options: ["", "", "", ""],
  correct_answer: "",
  marks: 1,
};

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("A question has an unmatched quote.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function importCsv(source: string): DraftQuestion[] {
  const rows = parseCsv(source);
  const header = rows.shift()?.map((value) => value.toLowerCase());
  const expected = ["type", "prompt", "options", "correct_answer", "marks"];
  if (!header || expected.some((column) => !header.includes(column))) {
    throw new Error(
      "CSV needs these headers: type, prompt, options, correct_answer, marks.",
    );
  }
  const indexes = Object.fromEntries(
    expected.map((column) => [column, header.indexOf(column)]),
  );
  const imported = rows.map((row, index) => {
    const get = (column: string) => row[indexes[column]] ?? "";
    const typeInput = get("type").toLowerCase().replace(/[- ]/g, "_");
    const type =
      typeInput === "mcq"
        ? "multiple_choice"
        : typeInput === "truefalse"
          ? "true_false"
          : typeInput;
    if (
      !["multiple_choice", "true_false", "short_answer", "coding"].includes(
        type,
      )
    ) {
      throw new Error(`Question ${index + 1} has an unsupported type.`);
    }
    return {
      id: crypto.randomUUID(),
      type: type as QuestionType,
      prompt: get("prompt"),
      options:
        type === "multiple_choice"
          ? get("options").split("|").map((option) => option.trim())
          : type === "true_false"
            ? ["True", "False"]
            : undefined,
      correct_answer:
        type === "multiple_choice" || type === "true_false"
          ? get("correct_answer")
          : undefined,
      marks: Number(get("marks")),
    };
  });

  if (imported.length === 0) throw new Error("CSV contains no question rows.");
  if (imported.length > 100) throw new Error("Import at most 100 questions.");
  if (
    imported.some(
      (question) =>
        !question.prompt ||
        !Number.isFinite(question.marks) ||
        question.marks <= 0 ||
        question.marks > 100,
    )
  ) {
    throw new Error("Every CSV row needs a prompt and positive marks.");
  }
  if (
    imported.some(
      (question) =>
        question.type === "multiple_choice" &&
        ((question.options?.length ?? 0) < 2 ||
          question.options?.some((option) => !option) ||
          !question.options?.includes(question.correct_answer ?? "")),
    )
  ) {
    throw new Error(
      "Each multiple-choice row needs 2+ options separated by | and a matching correct_answer.",
    );
  }
  if (
    imported.some(
      (question) =>
        question.type === "true_false" &&
        !["True", "False"].includes(question.correct_answer ?? ""),
    )
  ) {
    throw new Error('True/false answers must be "True" or "False".');
  }
  return imported;
}

function downloadCsvTemplate() {
  const content = [
    "type,prompt,options,correct_answer,marks",
    'multiple_choice,"What does Array.map() return?","The same array|A new array|An object","A new array",2',
    'true_false,"JavaScript arrays are zero-indexed.",,"True",1',
    'short_answer,"Explain what a closure is.",,,5',
    'coding,"Write a function that reverses a string.",,,10',
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "assessment-questions-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function InstructorAssessmentBuilder({
  cohorts,
}: {
  cohorts: CohortOption[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { ...NEW_QUESTION, id: "question-1" },
  ]);
  const [pendingImport, setPendingImport] = useState<DraftQuestion[] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const questionsJson = useMemo(() => JSON.stringify(questions), [questions]);

  function updateQuestion(
    questionId: string,
    update: Partial<DraftQuestion>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, ...update } : question,
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
        type === "true_false"
          ? "True"
          : type === "multiple_choice"
            ? ""
            : undefined,
    });
  }

  function handleCsvUpload(file?: File) {
    if (!file) return;
    setError("");
    void file
      .text()
      .then((text) => setPendingImport(importCsv(text)))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not read the CSV file.",
        );
      });
  }

  function handleSubmit(formData: FormData) {
    setError("");
    formData.set("questions", questionsJson);
    startTransition(async () => {
      const result = await createAssessmentAction(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.push(`/instructor/tests/${result.id}`);
      router.refresh();
    });
  }

  const totalMarks = questions.reduce(
    (total, question) => total + (Number(question.marks) || 0),
    0,
  );

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="questions" value={questionsJson} />
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Assessment details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Title
            <input
              name="title"
              required
              maxLength={160}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="JavaScript fundamentals"
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
            The assessment course is matched to the selected cohort’s
            department course.
          </p>
          <label className="text-sm">
            Time limit (minutes)
            <input
              name="duration_minutes"
              type="number"
              min={1}
              max={300}
              defaultValue={30}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Opens on
            <input
              name="start_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Closes on
            <input
              name="end_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
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
              placeholder="Optional instructions for students"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Questions</h2>
            <p className="text-xs text-gray-500">
              {questions.length} question(s) · {totalMarks} marks total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50"
            >
              Download CSV template
            </button>
            <label className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50">
              Import questions CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => handleCsvUpload(event.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          CSV columns: <code>type,prompt,options,correct_answer,marks</code>.
          Separate multiple-choice options with |. Short-answer and coding
          questions are reviewed and graded by you.
        </p>

        {pendingImport && (
          <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <div>
              <h3 className="text-sm font-medium">
                Preview {pendingImport.length} imported question(s)
              </h3>
              <p className="text-xs text-gray-600">
                Importing will replace the questions currently in this draft.
              </p>
            </div>
            <ol className="max-h-40 list-inside list-decimal space-y-1 overflow-y-auto text-xs text-gray-700">
              {pendingImport.map((question) => (
                <li key={question.id}>{question.prompt}</li>
              ))}
            </ol>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuestions(pendingImport);
                  setPendingImport(null);
                  setError("");
                }}
                className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
              >
                Replace questions
              </button>
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {questions.map((question, index) => (
          <article
            key={question.id}
            className="space-y-3 rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Question {index + 1}</h3>
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
            <div className="grid gap-3 md:grid-cols-[1fr_220px_120px]">
              <label className="text-xs text-gray-600 md:col-span-1">
                Prompt
                <textarea
                  value={question.prompt}
                  required
                  rows={2}
                  maxLength={5_000}
                  onChange={(event) =>
                    updateQuestion(question.id, { prompt: event.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                Question type
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
              <div className="grid gap-3 md:grid-cols-2">
                {question.options?.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      aria-label={`Mark option ${optionIndex + 1} correct`}
                      checked={question.correct_answer === option && !!option}
                      onChange={() =>
                        updateQuestion(question.id, { correct_answer: option })
                      }
                    />
                    <input
                      value={option}
                      required
                      maxLength={500}
                      onChange={(event) => {
                        const nextOptions = [...(question.options ?? [])];
                        const wasCorrect =
                          question.correct_answer === nextOptions[optionIndex];
                        nextOptions[optionIndex] = event.target.value;
                        updateQuestion(question.id, {
                          options: nextOptions,
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
                  disabled={(question.options?.length ?? 0) >= 8}
                  onClick={() =>
                    updateQuestion(question.id, {
                      options: [...(question.options ?? []), ""],
                    })
                  }
                  className="text-left text-xs text-brand-700 disabled:opacity-40"
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
            {(question.type === "short_answer" || question.type === "coding") && (
              <p className="text-xs text-amber-700">
                Students&apos; responses will be saved for your manual review.
              </p>
            )}
          </article>
        ))}

        <button
          type="button"
          onClick={() =>
            setQuestions((current) => [
              ...current,
              { ...NEW_QUESTION, id: crypto.randomUUID() },
            ])
          }
          className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          + Add question
        </button>
      </section>

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
        {isPending ? "Saving assessment…" : "Save as draft"}
      </button>
    </form>
  );
}
