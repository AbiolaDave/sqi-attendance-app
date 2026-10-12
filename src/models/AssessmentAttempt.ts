import { model, models, Schema } from "mongoose";

const attemptSchema = new Schema(
  {
    assessment_id: { type: String, required: true },
    student_id: { type: String, required: true },
    cohort_id: { type: String, required: true },
    started_at: { type: Date, required: true },
    submitted_at: { type: Date },
    answers: { type: Schema.Types.Mixed, default: {} },
    auto_score: { type: Number, default: 0, required: true },
    manual_scores: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, default: 0, required: true },
    grading_status: {
      type: String,
      enum: ["in_progress", "needs_review", "graded"],
      default: "in_progress",
      required: true,
    },
  },
  { timestamps: true },
);

attemptSchema.index(
  { assessment_id: 1, student_id: 1 },
  { unique: true },
);
attemptSchema.index({ assessment_id: 1, submitted_at: 1 });

export const AssessmentAttemptModel =
  models.AssessmentAttempt || model("AssessmentAttempt", attemptSchema);
