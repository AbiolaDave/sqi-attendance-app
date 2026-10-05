import { model, models, type InferSchemaType, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: {
      type: String,

      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "instructor", "student"],
      default: "super_admin",
      required: true,
    },
    password: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.validatePassword = function (
  password: string,
  callback: (err: Error | null, same?: boolean) => void,
) {
  bcrypt.compare(password, this.password, (err, same) => {
    callback(err, same);
  });
};

export type AdminDocument = InferSchemaType<typeof userSchema>;
export const User = models.User || model("User", userSchema);
