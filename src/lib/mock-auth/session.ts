import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const SESSION_COOKIE = "sqi_mock_session";

export interface UserType {
  _id: string;
  role: UserRole;
  full_name: string;
  email: string;
  department_id?: string;
  cohort_id?: string;
  staff_id?: string;
  student_id?: string;
  total_fee?: number;
  amount_paid?: number;
  level_id?: string;
}

export async function getCurrentUser(): Promise<UserType | null> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  await connectToDatabase();

  if (sessionId.startsWith("admin:")) {
    const user = await User.findById(sessionId.slice("admin:".length));
    if (!user || !user.isActive) return null;
    return {
      _id: String(user._id),
      role: user.role === "admin" ? "super_admin" : user.role,
      full_name: user.full_name,
      email: user.email,
      department_id: user.department_id,
      cohort_id: user.cohort_id,
      staff_id: user.staff_id,
      student_id: user.student_id,
      total_fee: user.total_fee,
      amount_paid: user.amount_paid,
      level_id: user.level_id,
    };
  }

  return User.findById(sessionId);
}

export async function requireUser(
  allowedRoles?: UserRole[],
): Promise<UserType> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(user.role === "super_admin" ? "/admin" : `/${user.role}`);
  }
  return user;
}
