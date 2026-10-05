import { requireProfile } from "@/lib/auth";
import { getTestsVisibleTo, getCourseName, getCohortName, getDepartmentName } from "@/lib/data/queries";

export default async function AdminTestsPage() {
  const profile = await requireProfile(["super_admin"]);
  const tests = await getTestsVisibleTo(profile);

  const rows = await Promise.all(
    tests.map(async (t) => ({
      test: t,
      courseName: await getCourseName(t.course_id),
      cohortName: await getCohortName(t.cohort_id),
      departmentName: await getDepartmentName(t.department_id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">All Assessments</h1>
        <p className="text-sm text-gray-500">Every test across every department.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {rows.map(({ test, courseName, cohortName, departmentName }) => (
          <div key={test.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{test.title}</p>
              <p className="text-xs text-gray-400">{departmentName} · {courseName} · {cohortName}</p>
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
