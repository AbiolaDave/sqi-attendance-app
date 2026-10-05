"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "sqi_mock_session";

export async function signOutMock() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
