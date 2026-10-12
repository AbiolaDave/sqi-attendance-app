import { model, models, Schema } from "mongoose";

const practiceAttemptSchema = new Schema(
  {
    practice_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    cohort_id: { type: String, required: true, index: true },
    started_at: { type: Date, required: true },
    submitted_at: { type: Date },
    answers: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, required: true },
    total_marks: { type: Number, required: true },
  },
  { timestamps: false },
);

export const PracticeAttemptModel =
  models.PracticeAttempt || model("PracticeAttempt", practiceAttemptSchema);
