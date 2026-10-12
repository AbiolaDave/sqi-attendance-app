"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  createAssessmentForInstructor,
  gradeAssessmentAttempt,
  setAssessmentPublished,
} from "@/lib/data/queries";
import type { QuestionType, TestQuestion } from "@/types";

const QUESTION_TYPES: QuestionType[] = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "coding",
];

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

function parseQuestions(raw: FormDataEntryValue | null): TestQuestion[] | null {
  if (typeof raw !== "string") return null;
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
  for (const item of parsed) {
    if (!item || typeof item !== "object") return null;
    const question = item as Record<string, unknown>;
    const type = question.type;
    const prompt =
      typeof question.prompt === "string" ? question.prompt.trim() : "";
    const marks = Number(question.marks);
    if (
      typeof type !== "string" ||
      !QUESTION_TYPES.includes(type as QuestionType) ||
      !prompt ||
      prompt.length > 5_000 ||
      !Number.isFinite(marks) ||
      marks <= 0 ||
      marks > 100
    ) {
      return null;
    }

    const options = Array.isArray(question.options)
      ? question.options.map((option) =>
          typeof option === "string" ? option.trim() : "",
        )
      : [];
    const correctAnswer =
      typeof question.correct_answer === "string"
        ? question.correct_answer.trim()
        : "";
    if (type === "multiple_choice") {
      if (
        options.length < 2 ||
        options.length > 8 ||
        options.some((option) => !option) ||
        !options.includes(correctAnswer)
      ) {
        return null;
      }
    } else if (type === "true_false") {
      if (!["True", "False"].includes(correctAnswer)) return null;
    } else if (options.length !== 0) {
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
          ? correctAnswer
          : undefined,
      marks,
    });
  }
  return questions;
}

export async function createAssessmentAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cohortId = String(formData.get("cohort_id") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes"));
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const questions = parseQuestions(formData.get("questions"));
  if (
    !title ||
    title.length > 160 ||
    description.length > 2_000 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 300 ||
    !isIsoDate(startDate) ||
    !isIsoDate(endDate) ||
    endDate < startDate ||
    !questions
  ) {
    return {
      success: false as const,
      message:
        "Check the assessment details. Add valid questions and ensure the dates and duration are valid.",
    };
  }

  const result = await createAssessmentForInstructor(profile._id, {
    title,
    description,
    cohortId,
    durationMinutes,
    startDate,
    endDate,
    questions,
  });
  if (!result.success) return result;
  revalidatePath("/instructor/tests");
  return { success: true as const, id: result.id };
}

export async function publishAssessmentAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const assessmentId = String(formData.get("assessment_id") ?? "");
  const published = formData.get("published") === "true";
  const result = await setAssessmentPublished(
    profile._id,
    assessmentId,
    published,
  );
  if (result.success) {
    revalidatePath("/instructor/tests");
    revalidatePath("/student/tests");
  }
  return result;
}

export async function gradeAssessmentAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const attemptId = String(formData.get("attempt_id") ?? "");
  const manualScore = Number(formData.get("manual_score"));
  const assessmentId = String(formData.get("assessment_id") ?? "");
  const result = await gradeAssessmentAttempt(
    profile._id,
    attemptId,
    manualScore,
  );
  if (!result.success) return result;
  revalidatePath(`/instructor/tests/${assessmentId}`);
  revalidatePath("/student/tests");
  return { success: true as const };
}
