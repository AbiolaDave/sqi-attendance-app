"use server";

import { requireProfile } from "@/lib/auth";
import {
  getPracticeAttempts,
  startPracticeQuiz,
  submitPracticeQuiz,
} from "@/lib/data/queries";

export async function startPracticeQuizAction(practiceId: string) {
  const profile = await requireProfile(["student"]);
  return startPracticeQuiz(practiceId, profile._id);
}

export async function submitPracticeQuizAction(
  practiceId: string,
  attemptId: string,
  answers: Record<string, string>,
) {
  const profile = await requireProfile(["student"]);
  if (
    typeof practiceId !== "string" ||
    typeof attemptId !== "string" ||
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers) ||
    Object.values(answers).some(
      (answer) => typeof answer !== "string" || answer.length > 20_000,
    )
  ) {
    return { success: false as const, message: "Invalid practice submission." };
  }
  return submitPracticeQuiz(practiceId, profile._id, attemptId, answers);
}

export async function getPracticeQuizAttemptsAction(practiceId: string) {
  const profile = await requireProfile(["student"]);
  return getPracticeAttempts(practiceId, profile._id);
}
