import { model, models, Schema, Types } from "mongoose";

export type CohortScheduleRecord = {
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type CohortRecord = {
  _id: Types.ObjectId;
  department_id: string;
  level_id: string;
  name: string;
  start_date?: string;
  course_id?: string;
  course_name?: string;
  instructor_id: string;
  instructor_ids: string[];
  schedule: CohortScheduleRecord[];
};

const cohortScheduleSchema = new Schema(
  {
    instructor_id: { type: String, required: true },
    day_of_week: { type: Number, required: true, min: 0, max: 6 },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
  },
  { _id: false },
);

const cohortSchema = new Schema(
  {
    department_id: { type: String, required: true, index: true },
    level_id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    start_date: { type: String },
    course_id: { type: String, index: true },
    course_name: { type: String, required: true, trim: true },
    instructor_id: { type: String, required: true },
    instructor_ids: { type: [String], required: true },
    schedule: { type: [cohortScheduleSchema], required: true },
  },
  { timestamps: true },
);

cohortSchema.index({ instructor_ids: 1 });

export const CohortModel = models.Cohort || model("Cohort", cohortSchema);
