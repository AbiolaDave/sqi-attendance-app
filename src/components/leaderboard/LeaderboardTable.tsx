import { getProfile } from "@/lib/data/queries";
import type { LeaderboardEntry } from "@/types";

export async function LeaderboardTable({ entries, highlightStudentId }: { entries: LeaderboardEntry[]; highlightStudentId?: string }) {
  const rows = await Promise.all(entries.map(async (e) => ({ ...e, profile: await getProfile(e.student_id) })));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-gray-400 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Tests</th>
            <th className="px-4 py-3 font-medium">Assignments</th>
            <th className="px-4 py-3 font-medium">Practice</th>
            <th className="px-4 py-3 font-medium">Attendance</th>
            <th className="px-4 py-3 font-medium">Overall</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.student_id} className={r.student_id === highlightStudentId ? "bg-brand-50" : ""}>
              <td className="px-4 py-3 font-medium">#{r.rank}</td>
              <td className="px-4 py-3">{r.profile?.full_name ?? "—"}</td>
              <td className="px-4 py-3 text-gray-500">{r.test_score}%</td>
              <td className="px-4 py-3 text-gray-500">{r.assignment_score}%</td>
              <td className="px-4 py-3 text-gray-500">{r.practice_score}%</td>
              <td className="px-4 py-3 text-gray-500">{r.attendance_score}%</td>
              <td className="px-4 py-3 font-semibold text-brand-700">{r.overall_score}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-400">No data yet for this department.</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-4 py-3 border-t border-gray-100">
        Overall = 40% tests + 25% assignments + 20% practice + 15% attendance (weights configurable in{" "}
        <code>src/lib/data/queries.ts</code>).
      </p>
    </div>
  );
}
