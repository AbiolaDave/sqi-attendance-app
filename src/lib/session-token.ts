import jwt from "jsonwebtoken";
import type { UserRole } from "@/types";

export const SESSION_COOKIE = "sqi_session";
export const LEGACY_SESSION_COOKIE = "sqi_mock_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionUser = {
  id: string;
  role: UserRole;
  sessionVersion: number;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("The JWT_SECRET environment variable is not configured.");
  }
  return secret;
}

export function createSessionToken(user: SessionUser): string {
  return jwt.sign(
    { role: user.role, sessionVersion: user.sessionVersion },
    getJwtSecret(),
    {
      algorithm: "HS256",
      audience: "sqi-users",
      expiresIn: SESSION_DURATION_SECONDS,
      issuer: "sqi-attendance-app",
      subject: user.id,
    },
  );
}

export function getSessionClaims(
  token: string,
): { userId: string; sessionVersion: number } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      audience: "sqi-users",
      issuer: "sqi-attendance-app",
    });
    if (
      typeof payload === "string" ||
      !payload.sub ||
      !Number.isInteger(payload.sessionVersion) ||
      payload.sessionVersion < 0
    ) {
      return null;
    }
    return { userId: payload.sub, sessionVersion: payload.sessionVersion };
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      return null;
    }
    throw error;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
