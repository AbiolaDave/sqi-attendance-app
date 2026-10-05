import { getDepartments, getInstructors, getStudentsVisibleTo, getCohorts } from "@/lib/data/queries";
import { requireProfile } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function AdminDashboard() {
  const user = await requireProfile(["super_admin"]);
  const [departments, instructors, students, cohorts] = await Promise.all([
    getDepartments(),
    getInstructors(),
    getStudentsVisibleTo(user),
    getCohorts(),
  ]);

  const totalOutstanding = students.reduce((sum, s) => sum + (s.total_fee - s.amount_paid), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Institution Overview</h1>
        <p className="text-sm text-gray-500">A snapshot across every department and cohort.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Departments" value={departments.length} />
        <StatCard label="Instructors" value={instructors.length} />
        <StatCard label="Students" value={students.length} />
        <StatCard label="Active Cohorts" value={cohorts.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Outstanding Fees (institution-wide)"
          value={`₦${totalOutstanding.toLocaleString()}`}
          hint="Sum of every student's unpaid balance"
        />
      </div>

      <p className="text-xs text-gray-400">
        Attendance, tests and leaderboard summaries land here in Phase 2–4 once those modules are built.
      </p>
    </div>
  );
}
