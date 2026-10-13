import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/mock-auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    // const user = await authenticateAdmin(email, password);
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, `admin:${user.id}`, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { error: "Unable to connect to the authentication service." },
      { status: 500 },
    );
  }
}
