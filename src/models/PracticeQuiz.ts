import { model, models, Schema } from "mongoose";

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false"],
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correct_answer: { type: String, required: true },
    marks: { type: Number, required: true, min: 1 },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const practiceQuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    department_id: { type: String, required: true, index: true },
    level_id: { type: String, required: true },
    cohort_id: { type: String, required: true, index: true },
    course_id: { type: String, required: true },
    created_by: { type: String, required: true, index: true },
    duration_minutes: { type: Number, required: true, min: 1 },
    total_marks: { type: Number, required: true, min: 1 },
    questions: { type: [questionSchema], required: true },
    published: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

export const PracticeQuizModel =
  models.PracticeQuiz || model("PracticeQuiz", practiceQuizSchema);
