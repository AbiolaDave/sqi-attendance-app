import { requireProfile } from "@/lib/auth";
import { getAssignmentsVisibleTo, getSubmissionsForAssignment, getProfile, getCourseName } from "@/lib/data/queries";
import { gradeSubmission } from "./actions";

export default async function InstructorAssignmentsPage() {
  const profile = await requireProfile(["instructor"]);
  const assignments = await getAssignmentsVisibleTo(profile);

  const rows = await Promise.all(
    assignments.map(async (a) => ({
      assignment: a,
      courseName: await getCourseName(a.course_id),
      submissions: await getSubmissionsForAssignment(a.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assignments</h1>
        <p className="text-sm text-gray-500">Submissions for assignments in your cohorts.</p>
      </div>

      <div className="space-y-4">
        {rows.map(({ assignment, courseName, submissions }) => (
          <div key={assignment.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1">{courseName}</p>
              <h2 className="font-medium">{assignment.title}</h2>
              <p className="text-xs text-gray-400 mt-1">Due {new Date(assignment.due_date).toLocaleDateString()} · {submissions.length} submission(s)</p>
            </div>
            <div className="divide-y divide-gray-100">
              {await Promise.all(
                submissions.map(async (s) => {
                  const studentProfile = await getProfile(s.student_id);
                  return (
                    <div key={s.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-medium">{studentProfile?.full_name}</p>
                        <p className="text-xs text-gray-400">
                          {s.file_name} · <span className="capitalize">{s.status}</span>
                        </p>
                      </div>
                      {s.status === "graded" ? (
                        <span className="text-sm font-medium text-green-600">{s.score}/{assignment.max_score}</span>
                      ) : (
                        <form action={gradeSubmission} className="flex gap-2 items-center">
                          <input type="hidden" name="submission_id" value={s.id} />
                          <input name="score" type="number" max={assignment.max_score} placeholder="Score" required className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                          <input name="feedback" placeholder="Feedback (optional)" className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                          <button type="submit" className="rounded-lg bg-brand-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-brand-600">
                            Grade
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })
              )}
              {submissions.length === 0 && <p className="p-4 text-sm text-gray-400">No submissions yet.</p>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">No assignments yet.</p>}
      </div>
    </div>
  );
}
