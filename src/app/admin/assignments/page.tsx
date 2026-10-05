import { requireProfile } from "@/lib/auth";
import { getAssignmentsVisibleTo, getSubmissionsForAssignment, getCourseName, getCohortName } from "@/lib/data/queries";

export default async function AdminAssignmentsPage() {
  const profile = await requireProfile(["super_admin"]);
  const assignments = await getAssignmentsVisibleTo(profile);

  const rows = await Promise.all(
    assignments.map(async (a) => ({
      assignment: a,
      courseName: await getCourseName(a.course_id),
      cohortName: await getCohortName(a.cohort_id),
      submissionCount: (await getSubmissionsForAssignment(a.id)).length,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">All Assignments</h1>
        <p className="text-sm text-gray-500">Every assignment across every department.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {rows.map(({ assignment, courseName, cohortName, submissionCount }) => (
          <div key={assignment.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{assignment.title}</p>
              <p className="text-xs text-gray-400">{courseName} · {cohortName}</p>
            </div>
            <span className="text-xs text-gray-500">{submissionCount} submission(s)</span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-sm text-gray-400">No assignments yet.</p>}
      </div>
    </div>
  );
}
