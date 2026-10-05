"use server";

import { requireProfile } from "@/lib/auth";
import { gradeSubmission as gradeSubmissionQuery } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function gradeSubmission(formData: FormData) {
  await requireProfile(["instructor", "super_admin"]);
  const submissionId = String(formData.get("submission_id") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!submissionId) return;

  gradeSubmissionQuery(submissionId, score, feedback || undefined);
  revalidatePath("/instructor/assignments");
}
