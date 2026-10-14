"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  getApplicationUrl,
  sendPasswordResetEmail,
} from "@/lib/mailer";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session-token";
import { User } from "@/models/User";

export type PasswordActionState = {
  error: string | null;
  message: string | null;
  done?: boolean;
};

const PASSWORD_MIN_LENGTH = 12;
const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  "If an active account matches that email, a password reset link will be sent shortly.";

function readNewPassword(formData: FormData): string | null {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (password.length < PASSWORD_MIN_LENGTH) return null;
  if (password !== confirmation) return null;
  return password;
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function changePassword(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const user = await requireProfile();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = readNewPassword(formData);
  if (!currentPassword) {
    return { error: "Enter your current password.", message: null };
  }
  if (!newPassword) {
    return {
      error:
        "Use at least 12 characters and make sure both new-password fields match.",
      message: null,
    };
  }
  if (currentPassword === newPassword) {
    return {
      error: "Your new password must be different from your current password.",
      message: null,
    };
  }

  try {
    await connectToDatabase();
    const account = await User.findById(user._id).select(
      "+password +sessionVersion",
    );
    if (!account || !account.isActive) {
      return { error: "Your account is unavailable.", message: null };
    }
    if (!(await bcrypt.compare(currentPassword, account.password))) {
      return { error: "Your current password is incorrect.", message: null };
    }

    const sessionVersion = (account.sessionVersion ?? 0) + 1;
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const update = await User.updateOne(
      {
        _id: account._id,
        password: account.password,
        isActive: true,
      },
      {
        $set: { password: passwordHash },
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
        $inc: { sessionVersion: 1 },
      },
    );
    if (update.modifiedCount !== 1) {
      return {
        error: "Your password changed in another request. Please sign in again.",
        message: null,
      };
    }

    cookies().set(
      SESSION_COOKIE,
      createSessionToken({
        id: String(account._id),
        role: account.role === "admin" ? "super_admin" : account.role,
        sessionVersion,
      }),
      getSessionCookieOptions(),
    );
    return {
      error: null,
      message: "Your password has been changed.",
    };
  } catch (error) {
    console.error("Authenticated password change failed", error);
    return {
      error: "Unable to change your password right now. Please try again.",
      message: null,
    };
  }
}

export async function requestPasswordReset(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address.", message: null };
  }

  try {
    await connectToDatabase();
    const account = await User.findOne({ email, isActive: true });
    if (account) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(token);
      account.passwordResetTokenHash = tokenHash;
      account.passwordResetExpiresAt = new Date(
        Date.now() + RESET_TOKEN_LIFETIME_MS,
      );
      await account.save();

      const resetUrl = new URL(
        `/reset-password?token=${encodeURIComponent(token)}`,
        getApplicationUrl(),
      ).toString();
      try {
        await sendPasswordResetEmail(account.email, resetUrl);
      } catch (error) {
        await User.updateOne(
          { _id: account._id, passwordResetTokenHash: tokenHash },
          { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } },
        );
        throw error;
      }
    }
  } catch (error) {
    console.error("Password reset email request failed", error);
  }

  return { error: null, message: GENERIC_RESET_MESSAGE };
}

export async function resetPassword(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = readNewPassword(formData);
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return {
      error: "This password reset link is invalid or has expired.",
      message: null,
    };
  }
  if (!newPassword) {
    return {
      error:
        "Use at least 12 characters and make sure both new-password fields match.",
      message: null,
    };
  }

  try {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const result = await User.updateOne(
      {
        passwordResetTokenHash: hashResetToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
        isActive: true,
      },
      {
        $set: { password: passwordHash },
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
        $inc: { sessionVersion: 1 },
      },
    );
    if (result.modifiedCount !== 1) {
      return {
        error: "This password reset link is invalid or has expired.",
        message: null,
      };
    }

    return {
      error: null,
      message: "Your password has been reset. You can now sign in.",
      done: true,
    };
  } catch (error) {
    console.error("Password reset failed", error);
    return {
      error: "Unable to reset your password right now. Please try again.",
      message: null,
    };
  }
}
