"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { submitAssignment as submitAssignmentQuery } from "@/lib/data/queries";

export async function submitAssignmentAction(
  assignmentId: string,
  answers: Record<string, string>,
) {
  const profile = await requireProfile(["student"]);
  if (
    typeof assignmentId !== "string" ||
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers) ||
    Object.values(answers).some(
      (answer) => typeof answer !== "string" || answer.length > 20_000,
    )
  ) {
    return { success: false as const, message: "Invalid assignment response." };
  }
  const result = await submitAssignmentQuery(
    assignmentId,
    profile._id,
    answers,
  );
  if (result.success) {
    revalidatePath("/student/assignments");
    revalidatePath("/instructor/assignments");
  }
  return result;
}
