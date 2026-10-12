"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CohortStudent = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  cohort_id: string;
  total_fee: number;
  amount_paid: number;
};

export function CohortStudentPanel({
  cohortId,
  initialStudents,
}: {
  cohortId: string;
  initialStudents: CohortStudent[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const studenentObj = { ...payload, cohort_id: cohortId };

    try {
      const response = await fetch(`/api/cohorts/${cohortId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studenentObj),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Unable to add this student.");
        return;
      }
      if (result.student?.cohort_id !== cohortId) {
        setError("The student account was not linked to this cohort.");
        return;
      }

      setStudents((current) => [
        {
          ...result.student,
          id: result.student.id,
          total_fee: Number(result.student.total_fee),
          amount_paid: Number(result.student.amount_paid),
        },
        ...current.filter((student) => student.id !== result.student.id),
      ]);
      setSuccess(`${result.student.full_name} was added to this cohort.`);
      form.reset();
      router.refresh();
    } catch (requestError) {
      console.error("Failed to add cohort student:", requestError);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="font-semibold">Add a student</h2>
          <p className="mt-1 text-sm text-gray-500">
            The student account will be created in this cohort and its
            department.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-gray-700">
            Full name
            <input
              name="full_name"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Phone (optional)
            <input
              name="phone"
              type="tel"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Student ID (optional)
            <input
              name="student_id"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Initial password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Total fee
            <input
              name="total_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Amount paid
            <input
              name="amount_paid"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            {success}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Adding student..." : "Add student"}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-semibold">Students ({students.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium">{student.full_name}</p>
                <p className="text-xs text-gray-500">
                  {student.email}
                  {student.student_id ? ` · ${student.student_id}` : ""}
                </p>
                {student.phone && (
                  <p className="text-xs text-gray-500">{student.phone}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p>Fee: ₦{student.total_fee.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  Paid: ₦{student.amount_paid.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <p className="p-5 text-sm text-gray-500">
              No students have been added to this cohort.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
