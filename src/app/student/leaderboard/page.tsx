import { requireProfile } from "@/lib/auth";
import { getStudentById, getLeaderboard, getDepartmentName } from "@/lib/data/queries";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export default async function StudentLeaderboardPage() {
  const profile = await requireProfile(["student"]);
  const student = await getStudentById(profile._id);
  if (!student) return <p className="text-sm text-gray-400">No student record found.</p>;

  // RULE: students may only ever see their OWN department's
  // leaderboard — there is no department selector on this page at all,
  // unlike the instructor/admin versions.
  const entries = await getLeaderboard(student.department_id);
  const departmentName = await getDepartmentName(student.department_id);
  const myRank = entries.find((e) => e.student_id === profile._id)?.rank;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{departmentName} Leaderboard</h1>
        <p className="text-sm text-gray-500">
          {myRank ? `You're ranked #${myRank}.` : "Complete a test, assignment, or practice session to appear here."}
        </p>
      </div>
      <LeaderboardTable entries={entries} highlightStudentId={profile._id} />
    </div>
  );
}
