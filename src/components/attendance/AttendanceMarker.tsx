"use client";

import { useState, useTransition } from "react";
import type { AttendanceStatus } from "@/types";
import { saveAttendance } from "@/app/instructor/attendance/actions";
import Link from "next/link";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-orange-100 text-orange-700",
  excused: "bg-blue-100 text-blue-700",
};

export function AttendanceMarker({
  classId,
  cohortId,
  students,
  initialStatuses,
}: {
  classId: string;
  cohortId: string;
  students: { id: string; full_name: string; attendancePercent: number }[];
  initialStatuses: Record<string, AttendanceStatus>;
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(initialStatuses);
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function setAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (next[s.id] = status));
    setStatuses(next);
    setSavedMessage(null);
  }

  function handleSave() {
    const unmarkedCount = students.filter((student) => !statuses[student.id]).length;
    if (unmarkedCount > 0) {
      setSavedMessage(`Choose a status for all students (${unmarkedCount} unmarked).`);
      return;
    }

    startTransition(async () => {
      const entries = students.map((student) => ({
        studentId: student.id,
        status: statuses[student.id],
      }));
      const result = await saveAttendance(classId, entries);
      setSavedMessage(result.success ? "Attendance saved." : result.message ?? "Could not save attendance.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setAll(status)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 capitalize hover:bg-gray-50"
          >
            Mark All {status}
          </button>
        ))}
        <Link
          href={`/instructor/attendance?cohortId=${encodeURIComponent(cohortId)}`}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-brand-700 hover:bg-gray-50"
        >
          View cohort attendance history
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/instructor/attendance?studentId=${encodeURIComponent(s.id)}`}
                    className="hover:text-brand-700 hover:underline"
                  >
                    {s.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.attendancePercent}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={statuses[s.id] === status}
                        onClick={() => {
                          setStatuses((prev) => ({ ...prev, [s.id]: status }));
                          setSavedMessage(null);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full capitalize border ${
                          statuses[s.id] === status ? STATUS_STYLES[status] + " border-transparent" : "border-gray-200 text-gray-400"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            No students are enrolled in this cohort.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || students.length === 0}
          className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Attendance"}
        </button>
        {savedMessage && <span className="text-sm text-gray-500">{savedMessage}</span>}
      </div>
    </div>
  );
}
