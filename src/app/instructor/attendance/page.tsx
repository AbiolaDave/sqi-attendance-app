import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  getAttendanceForClass,
  getAttendanceForCohort,
  getAttendanceForStudent,
  getClassesForInstructor,
} from "@/lib/data/queries";
import { CohortModel, type CohortRecord } from "@/models/Cohort";
import { User } from "@/models/User";
import type { AttendanceStatus } from "@/types";

type AttendancePageProps = {
  searchParams: {
    classId?: string;
    cohortId?: string;
    studentId?: string;
  };
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-orange-100 text-orange-700",
  excused: "bg-blue-100 text-blue-700",
};

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const profile = await requireProfile(["instructor"]);
  await connectToDatabase();

  const cohortDocuments = await CohortModel.find({
    $or: [
      { instructor_id: profile._id },
      { instructor_ids: profile._id },
    ],
  }).lean<CohortRecord[]>();
  const cohortsById = new Map(
    cohortDocuments.map((cohort) => [String(cohort._id), cohort]),
  );
  const cohortIds = [...cohortsById.keys()];

  if (searchParams.studentId) {
    if (!mongoose.isValidObjectId(searchParams.studentId)) notFound();
    const student = await User.findOne({
      _id: searchParams.studentId,
      role: "student",
      cohort_id: { $in: cohortIds },
    })
      .select("_id full_name cohort_id")
      .lean();
    if (!student) notFound();

    const studentId = String(student._id);
    const studentCohortId = student.cohort_id ?? "";
    const cohort = cohortsById.get(studentCohortId);
    const attendance = (await getAttendanceForStudent(studentId)).filter(
      (record) => cohortsById.has(record.cohort_id),
    );

    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/instructor/attendance?cohortId=${encodeURIComponent(studentCohortId)}`}
            className="text-sm text-brand-700 hover:underline"
          >
            ← {cohort?.name ?? "Cohort attendance"}
          </Link>
          <h1 className="mt-3 text-xl font-semibold">
            {student.full_name}&apos;s attendance
          </h1>
          <p className="text-sm text-gray-500">
            Individual attendance records for cohorts assigned to you.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">{record.class_date}</td>
                  <td className="px-4 py-3">
                    {cohortsById.get(record.cohort_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {record.start_time}–{record.end_time}
                  </td>
                  <td className="px-4 py-3">
                    <AttendanceStatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No attendance records for this student yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (searchParams.cohortId) {
    const cohort = cohortsById.get(searchParams.cohortId);
    if (!cohort) notFound();
    const [records, students] = await Promise.all([
      getAttendanceForCohort(searchParams.cohortId),
      User.find({ role: "student", cohort_id: searchParams.cohortId })
        .select("_id full_name")
        .sort({ full_name: 1 })
        .lean(),
    ]);
    const studentNames = new Map(
      students.map((student) => [String(student._id), student.full_name]),
    );

    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/instructor/attendance"
            className="text-sm text-brand-700 hover:underline"
          >
            ← Take attendance
          </Link>
          <h1 className="mt-3 text-xl font-semibold">
            {cohort.name} attendance history
          </h1>
          <p className="text-sm text-gray-500">
            All saved attendance records for this cohort.
          </p>
        </div>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-medium">Individual student records</h2>
          {students.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {students.map((student) => (
                <Link
                  key={String(student._id)}
                  href={`/instructor/attendance?studentId=${encodeURIComponent(String(student._id))}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50"
                >
                  {student.full_name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">
              No students are enrolled in this cohort.
            </p>
          )}
        </section>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">{record.class_date}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/instructor/attendance?studentId=${encodeURIComponent(record.student_id)}`}
                      className="font-medium hover:text-brand-700 hover:underline"
                    >
                      {studentNames.get(record.student_id) ?? "Student"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {record.start_time}–{record.end_time}
                  </td>
                  <td className="px-4 py-3">
                    <AttendanceStatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No attendance records have been saved for this cohort yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const classesToday = await getClassesForInstructor(profile._id, today);
  const activeClass = searchParams.classId
    ? classesToday.find((classItem) => classItem.id === searchParams.classId)
    : classesToday[0];
  const activeCohort = activeClass
    ? cohortsById.get(activeClass.cohort_id)
    : undefined;

  let studentsWithInfo: {
    id: string;
    full_name: string;
    attendancePercent: number;
  }[] = [];
  let initialStatuses: Record<string, AttendanceStatus> = {};

  if (activeClass && activeCohort) {
    const cohortStudents = await User.find({
      role: "student",
      cohort_id: activeClass.cohort_id,
    })
      .select("_id full_name")
      .sort({ full_name: 1 })
      .lean();
    const cohortAttendance = await getAttendanceForCohort(activeClass.cohort_id);
    studentsWithInfo = cohortStudents.map((student) => {
      const studentId = String(student._id);
      const records = cohortAttendance.filter(
        (record) => record.student_id === studentId,
      );
      const present = records.filter(
        (record) => record.status === "present" || record.status === "late",
      ).length;
      return {
        id: studentId,
        full_name: student.full_name,
        attendancePercent: records.length
          ? Math.round((present / records.length) * 100)
          : 100,
      };
    });

    const existing = await getAttendanceForClass(activeClass.id);
    initialStatuses = Object.fromEntries(
      existing.map((record) => [record.student_id, record.status]),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Attendance</h1>
        <p className="text-sm text-gray-500">
          Mark today&apos;s class and review saved cohort or student records.
        </p>
      </div>

      {cohortDocuments.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-medium">Attendance by cohort</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cohortDocuments.map((cohort) => (
              <Link
                key={String(cohort._id)}
                href={`/instructor/attendance?cohortId=${encodeURIComponent(String(cohort._id))}`}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50"
              >
                {cohort.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!activeClass || !activeCohort ? (
        <p className="rounded-2xl border border-gray-100 bg-white px-5 py-6 text-sm text-gray-500">
          {classesToday.length === 0
            ? "You have no classes scheduled today."
            : "The selected class is not available."}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                {activeCohort.name} attendance
              </h2>
              <p className="text-sm text-gray-500">
                {new Date(`${today}T00:00:00.000Z`).toLocaleDateString(
                  "en-NG",
                  { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
                )}{" "}
                · {activeClass.start_time}–{activeClass.end_time}
              </p>
            </div>
            {classesToday.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {classesToday.map((classItem) => (
                  <Link
                    key={classItem.id}
                    href={`/instructor/attendance?classId=${encodeURIComponent(classItem.id)}`}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      classItem.id === activeClass.id
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {cohortsById.get(classItem.cohort_id)?.name ?? "Class"} ·{" "}
                    {classItem.start_time}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <AttendanceMarker
            classId={activeClass.id}
            cohortId={activeClass.cohort_id}
            students={studentsWithInfo}
            initialStatuses={initialStatuses}
          />
        </>
      )}
    </div>
  );
}
