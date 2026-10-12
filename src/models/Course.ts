import { model, models, Schema } from "mongoose";

const courseSchema = new Schema(
  {
    department_id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    name_key: { type: String, required: true },
  },
  { timestamps: true },
);

courseSchema.index({ department_id: 1, name_key: 1 }, { unique: true });

export const CourseModel = models.Course || model("Course", courseSchema);

export function normalizeCourseName(name: string) {
  return name.trim().toLowerCase();
}

export async function findOrCreateDepartmentCourse(
  departmentId: string,
  name: string,
) {
  const trimmedName = name.trim();
  const nameKey = normalizeCourseName(trimmedName);
  const filter = { department_id: departmentId, name_key: nameKey };
  try {
    return await CourseModel.findOneAndUpdate(
      filter,
      { $setOnInsert: { name: trimmedName } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existingCourse = await CourseModel.findOne(filter);
      if (existingCourse) return existingCourse;
    }
    throw error;
  }
}
