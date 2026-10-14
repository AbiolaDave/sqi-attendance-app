"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session-token";

export async function signOut() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(LEGACY_SESSION_COOKIE);
  redirect("/login");
}
