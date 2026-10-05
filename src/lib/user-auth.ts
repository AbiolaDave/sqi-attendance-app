import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { connectDb } from "./db/connectDb";
import { User } from "@/models/User";

export const DEFAULT_ADMIN = {
  name: "Adaeze Obi (Admin)",
  email: "admin@sqi.edu.ng",
  phone: "+2348000000000",
  role: "super_admin" as const,
};

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await connectDb();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!(await bcrypt.compare(password, user.password))) return null;

  user.lastLoginAt = new Date();
  await user.save();



  return {
    id: String(user._id),
    role: user.role === "admin" ? "super_admin" : user.role,
    full_name: user.full_name,
    email: user.email,
  };
}
