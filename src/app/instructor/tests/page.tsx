import { requireProfile } from "@/lib/auth";
import { getTestsVisibleTo, getCourseName, getCohortName } from "@/lib/data/queries";

// NOTE: there's no write function for creating a new test in
// queries.ts — building a full question-builder UI is a bigger job
// than this scaffold covers. This page shows the read side (list +
// basic stats) so the shape of the feature is clear; wire "Create
// Test" up to your backend once it exists.
async function createTest() {
  "use server";
  await requireProfile(["instructor"]);
  // TODO: call your backend, e.g. POST /api/tests
}

export default async function InstructorTestsPage() {
  const profile = await requireProfile(["instructor"]);
  const tests = await getTestsVisibleTo(profile);

  const rows = await Promise.all(
    tests.map(async (t) => ({
      test: t,
      courseName: await getCourseName(t.course_id),
      cohortName: await getCohortName(t.cohort_id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-gray-500">Tests for cohorts assigned to you.</p>
      </div>

      <form action={createTest} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-3 items-center">
        <input placeholder="Test title" className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Create Test
        </button>
        <span className="text-xs text-gray-400 w-full">UI-only placeholder — see the comment at the top of this file.</span>
      </form>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {rows.map(({ test, courseName, cohortName }) => (
          <div key={test.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{test.title}</p>
              <p className="text-xs text-gray-400">{courseName} · {cohortName}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${test.published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
              {test.published ? "Published" : "Draft"}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-sm text-gray-400">No tests created yet.</p>}
      </div>
    </div>
  );
}
