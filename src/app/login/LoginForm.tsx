"use client";

import { useFormState, useFormStatus } from "react-dom";

import { signIn, type SignInState } from "./actions";

const initialState: SignInState = { error: null, loading: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Signing in...
        </span>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {state.error}
        </p>
      )}
      <label className="block text-sm font-medium text-gray-700">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </label>
      <SubmitButton />
    </form>
  );
}
