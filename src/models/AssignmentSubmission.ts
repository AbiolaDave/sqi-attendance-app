import { model, models, Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    assignment_id: { type: String, required: true },
    student_id: { type: String, required: true },
    cohort_id: { type: String, required: true, index: true },
    submitted_at: { type: Date, required: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    auto_score: { type: Number, default: 0, required: true },
    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      required: true,
    },
    score: { type: Number },
    feedback: { type: String },
  },
  { timestamps: false },
);

submissionSchema.index(
  { assignment_id: 1, student_id: 1 },
  { unique: true },
);

export const AssignmentSubmissionModel =
  models.AssignmentSubmission ||
  model("AssignmentSubmission", submissionSchema);
