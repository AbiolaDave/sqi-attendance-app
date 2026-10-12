"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createInstructor, type CreateInstructorState } from "./action";

const initialState: CreateInstructorState = {
  error: null,
  success: null,
  loading: null,
};

type DepartmentOption = {
  _id: string;
  name: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Inviting Instructor...
        </span>
      ) : (
        "Add Instructor"
      )}
    </button>
  );
}

const InstructorForm = ({
  departments,
}: {
  departments: DepartmentOption[];
}) => {
  const [state, formAction] = useFormState(createInstructor, initialState);

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
          name="full_name"
          placeholder="Full name"
          required
          className="rounded-lg flex-1 border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-lg flex-1 border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="department_id"
          className="rounded-lg flex-1 border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Department…</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name || "Department"}
            </option>
          ))}
        </select>

        <SubmitButton />
      </form>
    </div>
  );
};

export default InstructorForm;
