"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Cohort, Level } from "@/types";

type InstructorOption = {
  id: string;
  full_name: string;
  email: string;
};

type ScheduleRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  instructor_id: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function CohortManager({
  levels,
  instructors,
  cohorts,
}: {
  levels: Level[];
  instructors: InstructorOption[];
  cohorts: Cohort[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [instructorIds, setInstructorIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleInstructor(id: string) {
    setInstructorIds((current) =>
      current.includes(id)
        ? current.filter((instructorId) => instructorId !== id)
        : [...current, id],
    );
  }

  function addScheduleRow() {
    setSchedule((rows) => [
      ...rows,
      {
        day_of_week: 0,
        start_time: "08:00",
        end_time: "10:00",
        instructor_id: instructorIds[0] ?? "",
      },
    ]);
  }

  function updateScheduleRow(
    index: number,
    field: keyof ScheduleRow,
    value: string,
  ) {
    setSchedule((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === "day_of_week" ? Number(value) : value,
            }
          : row,
      ),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          course_name: courseName,
          level_id: levelId,
          start_date: startDate || undefined,
          instructor_ids: instructorIds,
          schedule,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Unable to create cohort.");
        return;
      }

      setName("");
      setCourseName("");
      setStartDate("");
      setInstructorIds([]);
      setSchedule([]);
      router.refresh();
    } catch (requestError) {
      console.error("Failed to create cohort:", requestError);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="space-y-6 rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl"
      >
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">
            Department
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Create a cohort</h2>
          <p className="text-sm text-slate-500">
            Assign instructors and define the weekly class schedule.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Cohort name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="October 2026"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Course name
            </span>
            <input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              required
              maxLength={160}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="Introduction to programming"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Level
            </span>
            <select
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </div>

        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">
            Assigned instructors
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {instructors.map((instructor) => (
              <label
                key={instructor.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={instructorIds.includes(instructor.id)}
                  onChange={() => toggleInstructor(instructor.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  {instructor.full_name}
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {instructor.email}
                  </span>
                </span>
              </label>
            ))}
            {instructors.length === 0 && (
              <p className="text-sm text-slate-500">
                No active instructors are available in your department.
              </p>
            )}
          </div>
        </fieldset>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Weekly schedule
              </h3>
              <p className="text-xs text-slate-500">
                Add a separate row for every class day and time.
              </p>
            </div>
            <button
              type="button"
              onClick={addScheduleRow}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              + Add class day
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {schedule.map((row, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_1.5fr_auto]"
              >
                <label className="text-xs text-slate-500">
                  Day
                  <select
                    value={row.day_of_week}
                    onChange={(event) =>
                      updateScheduleRow(
                        index,
                        "day_of_week",
                        event.target.value,
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    {DAYS.map((day, dayIndex) => (
                      <option key={day} value={dayIndex}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-500">
                  Starts
                  <input
                    type="time"
                    value={row.start_time}
                    onChange={(event) =>
                      updateScheduleRow(index, "start_time", event.target.value)
                    }
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="text-xs text-slate-500">
                  Ends
                  <input
                    type="time"
                    value={row.end_time}
                    onChange={(event) =>
                      updateScheduleRow(index, "end_time", event.target.value)
                    }
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="text-xs text-slate-500">
                  Instructor
                  <select
                    value={row.instructor_id}
                    onChange={(event) =>
                      updateScheduleRow(
                        index,
                        "instructor_id",
                        event.target.value,
                      )
                    }
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select an instructor</option>
                    {instructors
                      .filter((instructor) =>
                        instructorIds.includes(instructor.id),
                      )
                      .map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.full_name}
                        </option>
                      ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setSchedule((rows) =>
                      rows.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  className="self-end rounded-lg px-2 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
                  aria-label="Remove class day"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || levels.length === 0 || instructors.length === 0}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create cohort"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Your department cohorts
        </h2>

        {cohorts.map((cohort) => (
          <Link
            key={cohort.id}
            href={`/instructor/cohorts/${cohort.id}`}
            className="block rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:border-indigo-200 hover:shadow-[0_18px_40px_rgba(79,70,229,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{cohort.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {levels.find((level) => level.id === cohort.level_id)?.name ??
                    cohort.level_id}
                  {cohort.start_date ? ` · Starts ${cohort.start_date}` : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-indigo-700">
                Manage cohort →
              </span>
            </div>

            {cohort.course_name && (
              <p className="mt-3 text-sm text-slate-600">
                Course: {cohort.course_name}
              </p>
            )}

            <p className="mt-3 text-xs text-slate-500">
              {cohort.schedule
                .map(
                  (entry) =>
                    `${DAYS[entry.day_of_week]} ${entry.start_time}–${entry.end_time}`,
                )
                .join(" · ")}
            </p>
          </Link>
        ))}

        {cohorts.length === 0 && (
          <p className="rounded-[24px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-500">
            No cohorts have been created for your department yet.
          </p>
        )}
      </section>
    </div>
  );
}
