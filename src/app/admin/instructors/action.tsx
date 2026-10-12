"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { User } from "@/models/User";

export type CreateInstructorState = {
  error: string | null;
  success: string | null;
  loading: boolean | null;
};

export async function createInstructor(
  _previousState: CreateInstructorState,
  formData: FormData,
): Promise<CreateInstructorState> {
  try {
    const full_name = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const department_id = String(formData.get("department_id") ?? "").trim();
    const role = "instructor";
    const password = "defaultPassword123";

    if (!full_name || !email) {
      return {
        error: "Full name and email are required.",
        success: null,
        loading: false,
      };
    }

    if (department_id == "") {
      
      return {
        error: "Department is required.",
        success: null,
        loading: false,
      };
    }

    const newUser = await User.create({
      full_name,
      email,
    department_id,
      role,
      password,
    });

    if (!newUser) {
      return {
        error: "Error creating instructor",
        success: null,
        loading: false,
      };
    }

    revalidatePath("/admin/instructors");
    return {
      error: null,
      success: "Instructor invited successfully.",
      loading: false,
    };
  } catch (err) {
    console.error("Failed to create instructor:", err);
    return {
      error: "An error occurred during creation. Please try again.",
      success: null,
      loading: false,
    };
  }
}
