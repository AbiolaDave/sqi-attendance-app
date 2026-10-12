import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentTaker } from "@/components/assignments/AssignmentTaker";
import { requireProfile } from "@/lib/auth";
import {
  getAssignmentsVisibleTo,
  getCourseName,
  getSubmissionForStudent,
} from "@/lib/data/queries";

export default async function StudentAssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile(["student"]);
  const assignments = await getAssignmentsVisibleTo(profile);
  const assignment = assignments.find((item) => item.id === params.id);
  if (!assignment) notFound();
  const [courseName, submission] = await Promise.all([
    getCourseName(assignment.course_id),
    getSubmissionForStudent(assignment.id, profile._id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/student/assignments"
        className="text-sm text-brand-700 hover:underline"
      >
        ← Assignments
      </Link>
      <div>
        <p className="text-xs text-gray-400">{courseName}</p>
        <h1 className="mt-1 text-xl font-semibold">{assignment.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500">
          {assignment.description}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Due {assignment.due_date} · {assignment.max_score} marks
        </p>
      </div>
      {submission ? (
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium">
              Submitted {submission.submitted_at
                ? new Date(submission.submitted_at).toLocaleString()
                : ""}
            </p>
            <p className="text-lg font-semibold text-brand-700">
              {submission.score ?? 0} / {assignment.max_score}
            </p>
            {submission.feedback && (
              <p className="mt-1 text-sm text-gray-500">
                Instructor feedback: {submission.feedback}
              </p>
            )}
          </div>
          {(assignment.questions ?? []).map((question, index) => (
            <div key={question.id} className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium">
                {index + 1}. {question.prompt}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-gray-600">
                {submission.answers?.[question.id] || "No answer"}
              </p>
              {question.explanation && (
                <p className="mt-2 text-xs text-gray-500">
                  {question.explanation}
                </p>
              )}
            </div>
          ))}
        </section>
      ) : new Date().toISOString().slice(0, 10) > assignment.due_date ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          This assignment is past its due date and can no longer be submitted.
        </p>
      ) : (
        <AssignmentTaker assignment={assignment} />
      )}
    </div>
  );
}
