import bcrypt from "bcryptjs";


import { connectDb } from "./db/connectDb";
import { User } from "@/models/User";



export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await connectDb();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +sessionVersion",
  );

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(password, user.password))
  ) {
    return null;
  }

  user.lastLoginAt = new Date();
  await user.save();



  return {
    id: String(user._id),
    role: user.role === "admin" ? "super_admin" : user.role,
    full_name: user.full_name,
    email: user.email,
    sessionVersion: user.sessionVersion ?? 0,
  };
}
