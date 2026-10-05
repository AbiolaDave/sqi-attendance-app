import { requireProfile } from "@/lib/auth";
import { getStudentById, getCohortName, getAttendanceForStudent, getClassesForCohort, getCourseName, balanceStatus } from "@/lib/data/queries";
import { StatCard } from "@/components/dashboard/StatCard";
import { BalanceBadge } from "@/components/ui/BalanceBadge";

export default async function StudentDashboard() {
  const profile = await requireProfile(["student"]);
  const student = await getStudentById(profile.id);
  if (!student) return <p className="text-sm text-gray-400">No student record found.</p>;

  const cohortName = await getCohortName(student.cohort_id);
  const attendanceRows = await getAttendanceForStudent(profile.id);
  const total = attendanceRows.length;
  const present = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
  const attendancePercent = total ? Math.round((present / total) * 100) : 100;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = await getClassesForCohort(student.cohort_id, today);
  const upcomingWithCourse = await Promise.all(
    upcoming.slice(0, 5).map(async (c) => ({ ...c, courseName: await getCourseName(c.course_id) }))
  );

  const outstanding = student.total_fee - student.amount_paid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {profile.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">{cohortName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Attendance" value={`${attendancePercent}%`} />
        <StatCard label="Classes Attended" value={present} />
        <StatCard label="Classes Missed" value={total - present} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-sm">Upcoming Classes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingWithCourse.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <span>{c.courseName}</span>
                <span className="text-gray-400">{c.class_date} · {c.start_time}</span>
              </div>
            ))}
            {upcomingWithCourse.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">No upcoming classes.</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-medium text-sm mb-3">Fee Balance</h2>
            <p className="text-2xl font-semibold">₦{outstanding.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">outstanding of ₦{student.total_fee.toLocaleString()}</p>
          </div>
          <div className="mt-4">
            <BalanceBadge status={balanceStatus(student.total_fee, student.amount_paid)} />
          </div>
        </div>
      </div>
    </div>
  );
}
