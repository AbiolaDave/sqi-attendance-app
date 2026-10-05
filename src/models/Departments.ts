import { model, models, type InferSchemaType, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const departmentSchema = new Schema(
  {
    department: { type: String, required: true, unique: true, trim: true },
    description: {
      type: String,

      required: true,
      trim: true,
    },
 
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

export type departmentDocument = InferSchemaType<typeof departmentSchema>;
export const Department = models.Department || model("Department", departmentSchema);
