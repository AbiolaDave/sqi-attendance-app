"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
  type PasswordActionState,
} from "@/lib/actions/password";

const initialState: PasswordActionState = { error: null, message: null };
const inputClass =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}

function Feedback({ state }: { state: PasswordActionState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {state.message}
        </p>
      )}
    </>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-gray-700">
        Current password
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className={inputClass}
        />
      </label>
      <SubmitButton label="Change password" />
    </form>
  );
}

export function RequestPasswordResetForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-gray-700">
        Account email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </label>
      <SubmitButton label="Send reset link" />
      <Link href="/login" className="block text-center text-sm text-brand-700 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPassword, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <Feedback state={state} />
      {state.done ? (
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-brand-700 hover:underline"
        >
          Go to sign in
        </Link>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <label className="block text-sm font-medium text-gray-700">
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className={inputClass}
            />
          </label>
          <SubmitButton label="Reset password" />
        </>
      )}
    </form>
  );
}
