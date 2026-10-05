import { requireProfile } from "@/lib/auth";
import { getAssignmentsVisibleTo, getSubmissionForStudent, getCourseName } from "@/lib/data/queries";
import { submitAssignment } from "./actions";

export default async function StudentAssignmentsPage() {
  const profile = await requireProfile(["student"]);
  const assignments = await getAssignmentsVisibleTo(profile);

  const rows = await Promise.all(
    assignments.map(async (a) => ({
      assignment: a,
      courseName: await getCourseName(a.course_id),
      submission: getSubmissionForStudent(a.id, profile.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assignments</h1>
        <p className="text-sm text-gray-500">Due dates and submission status for your cohort.</p>
      </div>

      <div className="space-y-4">
        {rows.map(({ assignment, courseName, submission }) => (
          <div key={assignment.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">{courseName}</p>
                <h2 className="font-medium">{assignment.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
                <p className="text-xs text-gray-400 mt-2">Due {new Date(assignment.due_date).toLocaleDateString()} · {assignment.max_score} points</p>
              </div>

              {submission?.status === "graded" ? (
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">{submission.score}/{assignment.max_score}</p>
                  {submission.feedback && <p className="text-xs text-gray-400 max-w-xs">{submission.feedback}</p>}
                </div>
              ) : submission ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                  {submission.status.replace("_", " ")}
                </span>
              ) : null}
            </div>

            {!submission && (
              <form action={submitAssignment} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="assignment_id" value={assignment.id} />
                <input
                  name="file_name"
                  placeholder="e.g. my-submission.zip"
                  required
                  className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
                  Submit
                </button>
              </form>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">No assignments yet.</p>}
      </div>
    </div>
  );
}
