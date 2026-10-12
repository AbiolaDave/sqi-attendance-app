"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  createAssignmentForInstructor,
  gradeSubmission as gradeSubmissionQuery,
} from "@/lib/data/queries";
import type { QuestionType, TestQuestion } from "@/types";

const QUESTION_TYPES: QuestionType[] = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "coding",
];

function parseQuestions(raw: string): TestQuestion[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 100) {
    return null;
  }
  const questions: TestQuestion[] = [];
  for (const value of parsed) {
    if (!value || typeof value !== "object") return null;
    const input = value as Record<string, unknown>;
    const type = input.type;
    const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
    const marks = Number(input.marks);
    const options = Array.isArray(input.options)
      ? input.options.map((option) =>
          typeof option === "string" ? option.trim() : "",
        )
      : [];
    const answer =
      typeof input.correct_answer === "string"
        ? input.correct_answer.trim()
        : "";
    if (
      typeof type !== "string" ||
      !QUESTION_TYPES.includes(type as QuestionType) ||
      !prompt ||
      prompt.length > 5_000 ||
      !Number.isInteger(marks) ||
      marks < 1 ||
      marks > 100
    ) {
      return null;
    }
    if (
      (type === "multiple_choice" &&
        (options.length < 2 ||
          options.length > 8 ||
          options.some((option) => !option) ||
          !options.includes(answer))) ||
      (type === "true_false" && !["True", "False"].includes(answer)) ||
      (type !== "multiple_choice" &&
        type !== "true_false" &&
        options.length > 0)
    ) {
      return null;
    }
    questions.push({
      id: crypto.randomUUID(),
      type: type as QuestionType,
      prompt,
      options:
        type === "multiple_choice"
          ? options
          : type === "true_false"
            ? ["True", "False"]
            : undefined,
      correct_answer:
        type === "multiple_choice" || type === "true_false"
          ? answer
          : undefined,
      marks,
      explanation:
        typeof input.explanation === "string"
          ? input.explanation.slice(0, 2_000)
          : "",
    });
  }
  return questions;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

export async function createAssignmentAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cohortId = String(formData.get("cohort_id") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const rawQuestions = formData.get("questions");
  const questions =
    typeof rawQuestions === "string" ? parseQuestions(rawQuestions) : null;
  if (
    !title ||
    title.length > 160 ||
    description.length > 2_000 ||
    !validDate(dueDate) ||
    !questions
  ) {
    return {
      success: false as const,
      message:
        "Add a title and at least one valid question, and check the cohort, course, and due date.",
    };
  }
  const result = await createAssignmentForInstructor(profile._id, {
    title,
    description,
    cohortId,
    dueDate,
    questions,
  });
  if (result.success) revalidatePath("/instructor/assignments");
  return result;
}

export async function gradeSubmissionAction(
  submissionId: string,
  score: number,
  feedback: string,
) {
  const profile = await requireProfile(["instructor"]);
  if (
    typeof submissionId !== "string" ||
    !Number.isFinite(score) ||
    typeof feedback !== "string" ||
    feedback.length > 2_000
  ) {
    return { success: false as const, message: "Enter a valid score and feedback." };
  }
  const result = await gradeSubmissionQuery(
    profile._id,
    submissionId,
    score,
    feedback.trim() || undefined,
  );
  if (result.success) {
    revalidatePath("/instructor/assignments");
    revalidatePath("/student/assignments");
  }
  return result.success
    ? { success: true as const }
    : { success: false as const, message: "Could not save grade. Check the score and assignment." };
}
