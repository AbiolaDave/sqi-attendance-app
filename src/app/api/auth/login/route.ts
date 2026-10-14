import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/user-auth";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await authenticateAdmin(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user });
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken({
        id: user.id,
        role: user.role,
        sessionVersion: user.sessionVersion,
      }),
      getSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
