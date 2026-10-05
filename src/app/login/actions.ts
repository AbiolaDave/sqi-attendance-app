"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authenticateAdmin } from "@/lib/user-auth";
import { SESSION_COOKIE } from "@/lib/mock-auth/session";

export type SignInState = {
  error: string | null;
  loading: boolean | null;
};

export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  let user;
  try {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    user = await authenticateAdmin(email, password);

    if (!user) {
      return { error: "Invalid email or password.", loading: false };
    }
  } catch (err) {
    console.error("Error during sign-in:", err);
    return {
      error: "An error occurred during sign-in. Please try again.",
      loading: false,
    };
  }

  cookies().set(SESSION_COOKIE, `admin:${user.id}`, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (user.role === "super_admin" || user.role === "admin") {
    redirect("/admin");
  } else if (user.role === "instructor") {
    redirect("/instructor");
  } else {
    redirect("/student");
  }
}
