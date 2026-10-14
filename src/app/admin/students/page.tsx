import {
  getStudentsVisibleTo,
  getDepartmentName,
  getLevelName,
  getCohortName,
  balanceStatus,
  getDepartments,
  getLevels,
  getCohorts,
} from "@/lib/data/queries";
import { requireProfile } from "@/lib/auth";
import { BalanceBadge } from "@/components/ui/BalanceBadge";
import Modal from "@/components/modal/Modal";

export default async function AdminStudentsPage() {
  const user = await requireProfile(["super_admin"]);
  const [students, departments, levels, cohorts] = await Promise.all([
    getStudentsVisibleTo(user),
    getDepartments(),
    getLevels(),
    getCohorts(),
  ]);

  const rows = await Promise.all(
    students.map(async (s) => ({
      student: s,
      department: await getDepartmentName(s.department_id),
      level: await getLevelName(s.level_id),
      cohort: await getCohortName(s.cohort_id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center  justify-between">
          <h1 className="text-xl font-semibold">All Students</h1>
          <div>
            <Modal
              departments={departments}
              levels={levels}
              cohorts={cohorts.map((cohort) => ({
                ...cohort,
                  id: String(cohort._id),
                schedule: cohort.schedule.map((entry, index) => ({
                  ...entry,
                  id: `${cohort._id}-${index}`,
                  cohort_id: String(cohort._id),
                })),
              }))}
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          As Super Admin you see every student&apos;s balance. Instructors only
          see balances for students in cohorts assigned to them, and students
          only see their own.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Level / Cohort</th>
              <th className="px-4 py-3 font-medium">Outstanding</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ student, department, level, cohort }) => (
              <tr key={student.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{student.full_name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </td>
                <td className="px-4 py-3">{department}</td>
                <td className="px-4 py-3">
                  {level} · {cohort}
                </td>
                <td className="px-4 py-3">
                  ₦{(student.total_fee - student.amount_paid).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <BalanceBadge
                    status={balanceStatus(
                      student.total_fee,
                      student.amount_paid,
                    )}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
