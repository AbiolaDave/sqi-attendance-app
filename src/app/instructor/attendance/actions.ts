"use server";

import mongoose from "mongoose";
import { requireProfile } from "@/lib/auth";
import {
  getClassesForInstructor,
  saveAttendance as saveAttendanceQuery,
} from "@/lib/data/queries";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@/types";

export async function saveAttendance(
  classId: string,
  entries: { studentId: string; status: AttendanceStatus }[],
) {
  const profile = await requireProfile(["instructor"]);
  const validStatuses: AttendanceStatus[] = [
    "present",
    "absent",
    "late",
    "excused",
  ];
  if (
    typeof classId !== "string" ||
    !Array.isArray(entries) ||
    entries.length === 0 ||
    entries.some(
      (entry) =>
        !entry ||
        typeof entry.studentId !== "string" ||
        !mongoose.isValidObjectId(entry.studentId) ||
        !validStatuses.includes(entry.status),
    )
  ) {
    return { success: false, message: "Invalid attendance submission." };
  }

  const classDate = new Date().toISOString().slice(0, 10);
  const instructorClasses = await getClassesForInstructor(
    profile._id,
    classDate,
  );
  const classInfo = instructorClasses.find((item) => item.id === classId);
  if (!classInfo) {
    return {
      success: false,
      message: "This class is not scheduled for you today.",
    };
  }

  const result = await saveAttendanceQuery(classInfo, profile._id, entries);
  if (!result.success) return result;
  revalidatePath("/instructor/attendance");
  return { success: true };
}
