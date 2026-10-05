"use server";

import { requireProfile } from "@/lib/auth";
import { recordPayment as recordPaymentQuery } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function recordPayment(formData: FormData) {
  const profile = await requireProfile(["instructor", "super_admin"]);
  const studentId = String(formData.get("student_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  if (!studentId || !amount) return;

  // `recordPaymentQuery` re-checks that this instructor is actually
  // assigned to this student's cohort before writing anything — see
  // `canViewBalance` in src/lib/data/queries.ts. That check needs to
  // be re-implemented server-side (not just in this JS function) once
  // there's a real backend, or an instructor could call the API
  // directly and bypass it.
  await recordPaymentQuery(profile, studentId, amount, note || undefined);

  revalidatePath("/instructor/payments");
  revalidatePath("/instructor/students");
}
