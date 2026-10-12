import { model, models, Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    class_id: { type: String, required: true },
    cohort_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    instructor_id: { type: String, required: true },
    class_date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    marked_by: { type: String, required: true },
    marked_at: { type: Date, required: true },
  },
  { timestamps: false },
);

attendanceSchema.index({ class_id: 1, student_id: 1 }, { unique: true });
attendanceSchema.index({ cohort_id: 1, class_date: -1 });
attendanceSchema.index({ student_id: 1, class_date: -1 });

export const AttendanceModel =
  models.Attendance || model("Attendance", attendanceSchema);
