"use server";

import { requireProfile } from "@/lib/auth";
import { saveAttendance as saveAttendanceQuery } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@/types";

export async function saveAttendance(classId: string, entries: { studentId: string; status: AttendanceStatus }[]) {
  const profile = await requireProfile(["instructor"]);
  // TODO(backend): re-verify server-side that `classId` actually
  // belongs to this instructor before writing — the old Supabase draft
  // did this via RLS on the `attendance` table. There is no such check
  // here since this in-memory store has no concept of ownership.
  const result = await saveAttendanceQuery(classId, profile.id, entries);
  revalidatePath("/instructor/attendance");
  return { success: result.success, message: result.success ? undefined : "Could not save attendance." };
}
