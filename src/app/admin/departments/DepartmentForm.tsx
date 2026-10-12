"use client";

import { useFormState, useFormStatus } from "react-dom";

import { createDepartment, type CreateDepartmentState } from "./actions";

const initialState: CreateDepartmentState = {
  error: null,
  success: null,
  loading: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      //   className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Creating Department...
        </span>
      ) : (
        "Add Department"
      )}
    </button>
  );
}

const DepartmentForm = () => {
  const [state, formAction] = useFormState(createDepartment, initialState);
  return (
    <div>
      <form
        action={formAction}
        className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row gap-3"
      >
        {state.error && (
          <p
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            role="status"
            className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
          >
            {state.success}
          </p>
        )}
        <input
          name="name"
          placeholder="Department name"
          required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <SubmitButton />
        
      </form>
    </div>
  );
};

export default DepartmentForm;
