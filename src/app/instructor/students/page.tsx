import { requireProfile } from "@/lib/auth";
import { getStudentsVisibleTo, getProfile, getLevelName, getCohortName, balanceStatus } from "@/lib/data/queries";
import { BalanceBadge } from "@/components/ui/BalanceBadge";

export default async function InstructorStudentsPage() {
  const user = await requireProfile(["instructor"]);
  const students = await getStudentsVisibleTo(user);

  const rows = await Promise.all(
    students.map(async (s) => ({
      student: s,
      profile: await getProfile(s.id),
      level: await getLevelName(s.level_id),
      cohort: await getCohortName(s.cohort_id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Students</h1>
        <p className="text-sm text-gray-500">Students in cohorts assigned to you. You won&apos;t see other instructors&apos; students.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Level / Cohort</th>
              <th className="px-4 py-3 font-medium">Outstanding</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ student, profile, level, cohort }) => (
              <tr key={student.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400">{profile?.email}</p>
                </td>
                <td className="px-4 py-3">{level} · {cohort}</td>
                <td className="px-4 py-3">₦{(student.total_fee - student.amount_paid).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <BalanceBadge status={balanceStatus(student.total_fee, student.amount_paid)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No students assigned to you yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
