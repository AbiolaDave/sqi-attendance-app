"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { saveTestDraft, submitTest } from "@/lib/data/queries";

function isValidAnswers(answers: unknown): answers is Record<string, string> {
  return (
    !!answers &&
    typeof answers === "object" &&
    !Array.isArray(answers) &&
    Object.values(answers).every(
      (answer) => typeof answer === "string" && answer.length <= 20_000,
    )
  );
}

export async function saveTestDraftAction(
  testId: string,
  answers: Record<string, string>,
) {
  const profile = await requireProfile(["student"]);
  if (typeof testId !== "string" || !isValidAnswers(answers)) {
    return { success: false as const, message: "Invalid assessment answers." };
  }
  return saveTestDraft(testId, profile._id, answers);
}

export async function submitTestAction(
  testId: string,
  answers: Record<string, string>,
) {
  const profile = await requireProfile(["student"]);
  if (typeof testId !== "string" || !isValidAnswers(answers)) {
    return { success: false as const, message: "Invalid assessment answers." };
  }
  const result = await submitTest(testId, profile._id, answers);
  if (result.success) {
    revalidatePath("/student/tests");
    revalidatePath(`/student/tests/${testId}`);
  }
  return result;
}
