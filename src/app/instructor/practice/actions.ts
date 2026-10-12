"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  createPracticeQuizForInstructor,
  setPracticeQuizPublished,
} from "@/lib/data/queries";
import type { TestQuestion } from "@/types";

export async function createPracticeQuizAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cohortId = String(formData.get("cohort_id") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes"));
  let rawQuestions: unknown;
  try {
    rawQuestions = JSON.parse(String(formData.get("questions") ?? ""));
  } catch {
    return { success: false as const, message: "Invalid question data." };
  }

  if (
    !title ||
    title.length > 160 ||
    description.length > 2_000 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 300 ||
    !Array.isArray(rawQuestions) ||
    rawQuestions.length === 0 ||
    rawQuestions.length > 100
  ) {
    return {
      success: false as const,
      message:
        "Enter valid quiz details, a time limit, and at least one question.",
    };
  }

  const questions: TestQuestion[] = [];
  for (const value of rawQuestions) {
    if (!value || typeof value !== "object") {
      return { success: false as const, message: "Invalid question data." };
    }
    const question = value as Record<string, unknown>;
    const type = question.type;
    const prompt =
      typeof question.prompt === "string" ? question.prompt.trim() : "";
    const marks = Number(question.marks);
    const options = Array.isArray(question.options)
      ? question.options.map((option) =>
          typeof option === "string" ? option.trim() : "",
        )
      : [];
    const correctAnswer =
      typeof question.correct_answer === "string"
        ? question.correct_answer.trim()
        : "";
    if (
      (type !== "multiple_choice" && type !== "true_false") ||
      !prompt ||
      prompt.length > 5_000 ||
      !Number.isInteger(marks) ||
      marks < 1 ||
      marks > 100 ||
      (type === "multiple_choice" &&
        (options.length < 2 ||
          options.length > 8 ||
          options.some((option) => !option) ||
          !options.includes(correctAnswer))) ||
      (type === "true_false" && !["True", "False"].includes(correctAnswer))
    ) {
      return {
        success: false as const,
        message:
          "Each practice question must have a prompt, valid marks, options, and a correct answer.",
      };
    }
    questions.push({
      id: crypto.randomUUID(),
      type,
      prompt,
      options: type === "multiple_choice" ? options : ["True", "False"],
      correct_answer: correctAnswer,
      marks,
      explanation:
        typeof question.explanation === "string"
          ? question.explanation.slice(0, 2_000)
          : "",
    });
  }

  const result = await createPracticeQuizForInstructor(profile._id, {
    title,
    description,
    cohortId,
    durationMinutes,
    questions,
  });
  if (result.success) revalidatePath("/instructor/practice");
  return result;
}

export async function publishPracticeQuizAction(formData: FormData) {
  const profile = await requireProfile(["instructor"]);
  const practiceId = String(formData.get("practice_id") ?? "");
  const published = formData.get("published") === "true";
  const result = await setPracticeQuizPublished(
    profile._id,
    practiceId,
    published,
  );
  if (result.success) {
    revalidatePath("/instructor/practice");
    revalidatePath("/student/practice");
  }
  return result;
}
