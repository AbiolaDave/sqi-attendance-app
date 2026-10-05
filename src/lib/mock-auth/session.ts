import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// ---------------------------------------------------------------------
// Student and instructor sessions remain mock data while admin sessions use
// the MongoDB Admin collection.
// ---------------------------------------------------------------------
// This remembers which mock student or instructor is active in a plain,
// readable cookie so the role-based pages/nav have something to key off.
//
// Admin sessions are issued by the real login endpoint and resolved from
// MongoDB below. The remaining mock identities can be replaced as the other
// roles move to the database.
// ---------------------------------------------------------------------

export const SESSION_COOKIE = "sqi_mock_session";

export interface MockUser {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
}

// Demo identities for the roles that are not database-backed yet.
export const MOCK_USERS: MockUser[] = [
  {
    id: "instr-1",
    role: "instructor",
    full_name: "John Doe",
    email: "john.doe@sqi.edu.ng",
  },
  {
    id: "instr-2",
    role: "instructor",
    full_name: "Grace Nwosu",
    email: "grace.nwosu@sqi.edu.ng",
  },
  {
    id: "stud-1",
    role: "student",
    full_name: "Michael Smith",
    email: "michael.smith@student.sqi.edu.ng",
  },
  {
    id: "stud-2",
    role: "student",
    full_name: "Jane Doe",
    email: "jane.doe@student.sqi.edu.ng",
  },
  {
    id: "stud-3",
    role: "student",
    full_name: "Michael Smith II",
    email: "michael.smith2@student.sqi.edu.ng",
  },
];

export async function getCurrentUser(): Promise<MockUser | null> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  if (sessionId.startsWith("admin:")) {
    try {
      await connectToDatabase();
      const user = await User.findById(sessionId.slice("admin:".length));
      if (!user || !user.isActive) return null;
      return {
        id: String(user._id),
        role: "super_admin",
        full_name: user.full_name,
        email: user.email,
      };
    } catch {
      return null;
    }
  }

  return MOCK_USERS.find((u) => u.id === sessionId) ?? null;
}

export async function requireUser(
  allowedRoles?: UserRole[],
): Promise<MockUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(user.role === "super_admin" ? "/admin" : `/${user.role}`);
  }
  return user;
}
