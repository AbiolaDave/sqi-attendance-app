import { requireUser, type UserType } from "@/lib/mock-auth/session";
import type { UserRole } from "@/types";

// Thin wrapper kept so every page/layout can keep calling
// `requireProfile(...)` — when you swap in a real backend, this is
// the one function to repoint (it currently delegates to the mock
// cookie-based session in src/lib/mock-auth/session.ts).
export async function requireProfile(allowedRoles?: UserRole[]): Promise<UserType> {
  return requireUser(allowedRoles);
}
