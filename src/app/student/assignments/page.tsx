import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import {
  getAssignmentsVisibleTo,
  getCourseName,
  getSubmissionForStudent,
} from "@/lib/data/queries";

export default async function StudentAssignmentsPage() {
  const profile = await requireProfile(["student"]);
  const assignments = await getAssignmentsVisibleTo(profile);
  const today = new Date().toISOString().slice(0, 10);
  const rows = await Promise.all(
    assignments.map(async (assignment) => ({
      assignment,
      courseName: await getCourseName(assignment.course_id),
      submission: await getSubmissionForStudent(assignment.id, profile._id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assignments</h1>
        <p className="text-sm text-gray-500">
          Complete and submit assignments from your cohort.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ assignment, courseName, submission }) => {
          const isOverdue = today > assignment.due_date;
          return (
            <article
              key={assignment.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs text-gray-400">{courseName}</p>
              <h2 className="mt-1 font-medium">{assignment.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                {assignment.description}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Due {assignment.due_date} · {assignment.questions?.length ?? 0}{" "}
                questions · {assignment.max_score} marks
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                {submission ? (
                  <span className="text-sm text-green-700">
                    Submitted · {submission.score ?? 0}/{assignment.max_score}
                  </span>
                ) : (
                  <span
                    className={`text-sm ${
                      isOverdue ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {isOverdue ? "Past due date" : "Not submitted"}
                  </span>
                )}
                <Link
                  href={`/student/assignments/${assignment.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50"
                >
                  {submission ? "View submission" : "Open assignment"} →
                </Link>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400">
            No assignments are available for your cohort yet.
          </p>
        )}
      </div>
    </div>
  );
}
