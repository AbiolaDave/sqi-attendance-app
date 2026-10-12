import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  getAssignmentsVisibleTo,
  getCourses,
  getSubmissionsForAssignment,
} from "@/lib/data/queries";
import { CohortModel } from "@/models/Cohort";
import { InstructorAssignmentBuilder } from "@/components/assignments/InstructorAssignmentBuilder";
import { GradeAssignmentForm } from "@/components/assignments/GradeAssignmentForm";

export default async function InstructorAssignmentsPage() {
  const profile = await requireProfile(["instructor"]);
  await connectToDatabase();
  const [assignments, courses, cohorts] = await Promise.all([
    getAssignmentsVisibleTo(profile),
    getCourses(profile.department_id),
    CohortModel.find({
      $or: [
        { instructor_id: profile._id },
        { instructor_ids: profile._id },
      ],
    })
      .select("_id name course_id course_name")
      .sort({ name: 1 })
      .lean(),
  ]);
  const cohortNames = new Map(
    cohorts.map((cohort) => [String(cohort._id), cohort.name]),
  );
  const courseNames = new Map(courses.map((course) => [course.id, course.name]));
  const rows = await Promise.all(
    assignments.map(async (assignment) => ({
      assignment,
      submissions: await getSubmissionsForAssignment(assignment.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assignments</h1>
        <p className="text-sm text-gray-500">
          Write an assignment with questions and select one of the cohorts you
          teach. Students answer in the app.
        </p>
      </div>

      <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium">
          <span>Create an assignment</span>
          <span className="float-right text-sm text-brand-700 group-open:hidden">
            + New
          </span>
          <span className="float-right hidden text-sm text-gray-500 group-open:inline">
            Close
          </span>
        </summary>
        <div className="border-t border-gray-100 p-5">
          {cohorts.length ? (
            <InstructorAssignmentBuilder
              cohorts={cohorts.map((cohort) => ({
                id: String(cohort._id),
                name: cohort.name,
                course_name:
                  cohort.course_name ??
                  (cohort.course_id ? courseNames.get(cohort.course_id) : undefined),
              }))}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Create or join a cohort before creating an assignment.
            </p>
          )}
        </div>
      </details>

      <section className="space-y-4">
        {rows.map(({ assignment, submissions }) => {
          const canGrade = (assignment.questions ?? []).some(
            (question) =>
              question.type === "short_answer" ||
              question.type === "coding",
          );
          return (
            <article
              key={assignment.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <header className="border-b border-gray-100 p-5">
                <p className="text-xs text-gray-400">
                  {courseNames.get(assignment.course_id) ?? "Course"} ·{" "}
                  {cohortNames.get(assignment.cohort_id) ?? "Cohort"}
                </p>
                <h2 className="mt-1 font-medium">{assignment.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                  {assignment.description}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Due {assignment.due_date} · {assignment.questions?.length ?? 0}{" "}
                  questions · {assignment.max_score} marks ·{" "}
                  {submissions.length} submission(s)
                </p>
              </header>
              <div className="divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <div key={submission.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {submission.student_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleString()
                            : "Not submitted"}{" "}
                          · <span className="capitalize">{submission.status}</span>
                        </p>
                      </div>
                      <GradeAssignmentForm
                        submissionId={submission.id}
                        currentScore={
                          submission.score !== undefined &&
                          submission.auto_score !== undefined
                            ? submission.score - submission.auto_score
                            : undefined
                        }
                        maxScore={
                          (assignment.questions ?? []).reduce(
                            (total, question) =>
                              total +
                              (question.type === "short_answer" ||
                              question.type === "coding"
                                ? question.marks
                                : 0),
                            0,
                          )
                        }
                        canGrade={canGrade}
                        feedback={submission.feedback}
                      />
                    </div>
                    <div className="space-y-2">
                      {(assignment.questions ?? []).map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-lg bg-gray-50 p-3 text-sm"
                        >
                          <p className="font-medium">
                            {index + 1}. {question.prompt} ({question.marks}{" "}
                            marks)
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-gray-600">
                            {submission.answers?.[question.id] || "No answer"}
                          </p>
                          {(question.type === "multiple_choice" ||
                            question.type === "true_false") && (
                            <p className="mt-1 text-xs text-gray-400">
                              Correct: {question.correct_answer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <p className="p-4 text-sm text-gray-400">
                    No submissions yet.
                  </p>
                )}
              </div>
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400">No assignments yet.</p>
        )}
      </section>
    </div>
  );
}
