"use server";

import { requireProfile } from "@/lib/auth";
import { submitAssignment as submitAssignmentQuery } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function submitAssignment(formData: FormData) {
  const profile = await requireProfile(["student"]);
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const fileName = String(formData.get("file_name") ?? "").trim();
  if (!assignmentId || !fileName) return;

  // NOTE: there's no real file upload here — just a text field
  // standing in for a filename. Wire this to real storage (S3,
  // Supabase Storage, your own upload endpoint, etc.) when you build
  // the backend.
  submitAssignmentQuery(assignmentId, profile.id, fileName);
  revalidatePath("/student/assignments");
}
