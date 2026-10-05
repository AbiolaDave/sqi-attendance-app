import { requireProfile } from "@/lib/auth";
import { getDepartments, getLeaderboard } from "@/lib/data/queries";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export default async function LeaderboardsPage({ searchParams }: { searchParams: { dept?: string } }) {
  await requireProfile(["instructor", "super_admin"]);
  const departments = await getDepartments();
  const activeDeptId = searchParams.dept ?? departments[0]?.id;
  const entries = activeDeptId ? await getLeaderboard(activeDeptId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Leaderboards</h1>
        <p className="text-sm text-gray-500">Ranked by overall score within a department.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {departments.map((d) => (
          <a
            key={d.id}
            href={`?dept=${d.id}`}
            className={`text-xs px-3 py-1.5 rounded-lg border ${
              d.id === activeDeptId ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-500"
            }`}
          >
            {d.name}
          </a>
        ))}
      </div>

      <LeaderboardTable entries={entries} />
    </div>
  );
}
