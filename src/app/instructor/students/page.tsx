import { BalanceBadge } from "@/components/ui/BalanceBadge";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getLevelName, balanceStatus } from "@/lib/data/queries";
import { CohortModel, type CohortRecord } from "@/models/Cohort";
import { User } from "@/models/User";

export default async function InstructorStudentsPage() {
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
  const students = cohortIds.length
    ? await User.find({
        role: "student",
        cohort_id: { $in: cohortIds },
      })
        .select("_id full_name email cohort_id total_fee amount_paid")
        .sort({ full_name: 1 })
        .lean()
    : [];
  const rows = await Promise.all(
    students.map(async (student) => {
      const cohort = cohortsById.get(student.cohort_id ?? "");
      return {
        id: String(student._id),
        full_name: student.full_name,
        email: student.email,
        total_fee: student.total_fee ?? 0,
        amount_paid: student.amount_paid ?? 0,
        level: cohort ? await getLevelName(cohort.level_id) : "—",
        cohort: cohort?.name ?? "—",
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Students</h1>
        <p className="text-sm text-gray-500">
          Students in cohorts assigned to you. You won&apos;t see other instructors&apos; students.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-left text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Level / Cohort</th>
              <th className="px-4 py-3 font-medium">Outstanding</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </td>
                <td className="px-4 py-3">
                  {student.level} · {student.cohort}
                </td>
                <td className="px-4 py-3">
                  ₦{(student.total_fee - student.amount_paid).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <BalanceBadge
                    status={balanceStatus(student.total_fee, student.amount_paid)}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No students assigned to you yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
