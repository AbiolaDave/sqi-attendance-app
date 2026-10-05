"use server";

import { requireProfile } from "@/lib/auth";
import { recordPracticeAttempt } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function submitPracticeAnswer(wasCorrect: boolean) {
  const profile = await requireProfile(["student"]);
  const progress = recordPracticeAttempt(profile.id, wasCorrect);
  revalidatePath("/student/practice");
  return progress;
}
