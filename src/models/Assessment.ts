import { model, models, Schema } from "mongoose";

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer", "coding"],
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    options: { type: [String], default: undefined },
    correct_answer: { type: String },
    marks: { type: Number, required: true, min: 1 },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const assessmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    department_id: { type: String, required: true, index: true },
    level_id: { type: String, required: true },
    cohort_id: { type: String, required: true, index: true },
    course_id: { type: String, required: true },
    created_by: { type: String, required: true, index: true },
    duration_minutes: { type: Number, required: true, min: 1 },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    total_marks: { type: Number, required: true, min: 1 },
    published: { type: Boolean, default: false, required: true },
    questions: { type: [questionSchema], required: true },
  },
  { timestamps: true },
);

export const AssessmentModel =
  models.Assessment || model("Assessment", assessmentSchema);
