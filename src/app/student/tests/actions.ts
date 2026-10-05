"use server";

import { requireProfile } from "@/lib/auth";
import { submitTest } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function submitTestAction(testId: string, answers: Record<string, string>) {
  const profile = await requireProfile(["student"]);
  const result = submitTest(testId, profile.id, answers);
  revalidatePath(`/student/tests/${testId}`);
  return result;
}
