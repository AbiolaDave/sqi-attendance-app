import { requireProfile } from "@/lib/auth";
import {
  getClassesForInstructor,
  getStudentsVisibleTo,
  getAttendanceForClass,
  getAttendanceForStudent,
  getProfile,
  getCourseName,
  getCohortName,
} from "@/lib/data/queries";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import type { AttendanceStatus } from "@/types";

export default async function AttendancePage({ searchParams }: { searchParams: { classId?: string } }) {
  const profile = await requireProfile(["instructor"]);
  const today = new Date().toISOString().slice(0, 10);

  const classesToday = await getClassesForInstructor(profile.id, today);
  const activeClass = searchParams.classId
    ? classesToday.find((c) => c.id === searchParams.classId)
    : classesToday[0];

  if (!activeClass) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Attendance</h1>
        <p className="text-sm text-gray-400">You have no classes scheduled today.</p>
      </div>
    );
  }

  const allMyStudents = await getStudentsVisibleTo(profile);
  const cohortStudents = allMyStudents.filter((s) => s.cohort_id === activeClass.cohort_id);

  const studentsWithInfo = await Promise.all(
    cohortStudents.map(async (s) => {
      const attendanceRows = await getAttendanceForStudent(s.id);
      const present = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
      const pct = attendanceRows.length ? Math.round((present / attendanceRows.length) * 100) : 100;
      const p = await getProfile(s.id);
      return { id: s.id, full_name: p?.full_name ?? "Unnamed student", attendancePercent: pct };
    })
  );

  const existing = await getAttendanceForClass(activeClass.id);
  const initialStatuses: Record<string, AttendanceStatus> = {};
  existing.forEach((row) => (initialStatuses[row.student_id] = row.status));

  const courseName = await getCourseName(activeClass.course_id);
  const cohortName = await getCohortName(activeClass.cohort_id);

  const classRows = await Promise.all(
    classesToday.map(async (c) => ({ ...c, courseName: await getCourseName(c.course_id) }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">{cohortName} — {courseName}</h1>
          <p className="text-sm text-gray-500">
            {new Date(today).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {classRows.length > 1 && (
          <div className="flex gap-2">
            {classRows.map((c) => (
              <a
                key={c.id}
                href={`/instructor/attendance?classId=${c.id}`}
                className={`text-xs px-3 py-1.5 rounded-lg border ${
                  c.id === activeClass.id ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-500"
                }`}
              >
                {c.courseName}
              </a>
            ))}
          </div>
        )}
      </div>

      <AttendanceMarker classId={activeClass.id} students={studentsWithInfo} initialStatuses={initialStatuses} />
    </div>
  );
}
