import { requireProfile } from "@/lib/auth";
import {
  getStudentById,
  getCohortName,
  getAttendanceForStudent,
  getClassesForCohort,
  getCourseName,
  balanceStatus,
} from "@/lib/data/queries";
import { StatCard } from "@/components/dashboard/StatCard";
import { BalanceBadge } from "@/components/ui/BalanceBadge";

export default async function StudentDashboard() {
  const profile = await requireProfile(["student"]);
  console.log("Student profile:", profile);
  const student = await getStudentById(profile._id);
  console.log("Student data:", student);
  if (!profile)
    return <p className="text-sm text-gray-400">No student record found.</p>;
  if (!profile.cohort_id)
    return <p className="text-sm text-gray-400">No cohort assigned.</p>;

  const cohortName = await getCohortName(profile.cohort_id);
  console.log("Cohort name:", cohortName);
  const attendanceRows = await getAttendanceForStudent(profile._id);
  console.log("Attendance rows:", attendanceRows);
  const total = attendanceRows.length;
  const present = attendanceRows.filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  const attendancePercent = total ? Math.round((present / total) * 100) : 100;

  const { upcomingClasses, schedule } = await getClassesForCohort(
    profile.cohort_id,
  );
  const upcomingWithCourse = await Promise.all(
    upcomingClasses.map(async (c) => ({
      ...c,
      courseName: await getCourseName(c.cohort_id),
    })),
  );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  let outstanding = 0;

  if (!profile.total_fee || !profile.amount_paid) {
    return (
      <p className="text-sm text-gray-400">No fee information available.</p>
    );
  }

  outstanding = profile.total_fee - profile.amount_paid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          Welcome, {profile.full_name.split(" ")[0]}
        </h1>
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
              <div
                key={c.id}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                <span>{c.courseName}</span>
                <span className="text-gray-400">
                  {c.class_date} · {c.start_time}
                </span>
              </div>
            ))}
            {upcomingWithCourse.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400">
                No upcoming classes.
              </p>
            )}
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <h3 className="font-medium text-sm">Weekly Schedule</h3>
            <div className="mt-2 space-y-1">
              {schedule.map(
                (
                  entry: {
                    day_of_week: number;
                    start_time: string;
                    end_time: string;
                  },
                  index: number,
                ) => (
                  <p
                    key={`${entry.day_of_week}-${entry.start_time}-${index}`}
                    className="text-xs text-gray-500"
                  >
                    {days[entry.day_of_week]} · {entry.start_time}–
                    {entry.end_time}
                  </p>
                ),
              )}
              {schedule.length === 0 && (
                <p className="text-xs text-gray-400">No schedule available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-medium text-sm mb-3">Fee Balance</h2>
            <p className="text-2xl font-semibold">
              ₦{outstanding.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              outstanding of ₦{profile.total_fee.toLocaleString()}
            </p>
          </div>
          <div className="mt-4">
            <BalanceBadge
              status={balanceStatus(profile.total_fee, profile.amount_paid)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
