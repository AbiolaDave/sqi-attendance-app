"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Department } from "@/models/Departments";

export type CreateDepartmentState = {
  error: string | null;
  success: string | null;
  loading: boolean | null;
};

export async function createDepartment(
  _previousState: CreateDepartmentState,
  formData: FormData,
): Promise<CreateDepartmentState> {
  try {
    await requireProfile(["super_admin"]);
    await connectToDatabase();

    let department = String(formData.get("name") ?? "").trim();
    let description = String(formData.get("description") ?? "").trim();

    if (!department) {
      department = "";
      description = "";
      return {
        error: "Department name is required.",
        success: null,
        loading: false,
      };
    }

    const newDepartment = await Department.create({ department, description });

    if (!newDepartment) {
      department = "";
      description = "";
      return {
        error: "Error creating department",
        success: null,
        loading: false,
      };
    }

    department = "";
    description = "";
    revalidatePath("/admin/departments");
    return {
      error: null,
      success: "Department created successfully.",
      loading: false,
    };
  } catch (err) {
    console.error("Failed to create department:", err);
    return {
      error: "An error occurred during creation. Please try again.",
      success: null,
      loading: false,
    };
  }
}
