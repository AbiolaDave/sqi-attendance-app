import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getCourses, getTestsVisibleTo } from "@/lib/data/queries";
import { CohortModel } from "@/models/Cohort";
import { InstructorAssessmentBuilder } from "@/components/tests/InstructorAssessmentBuilder";
import { AssessmentPublishButton } from "@/components/tests/AssessmentPublishButton";

function AssessmentStatus({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs ${
        published
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default async function InstructorTestsPage() {
  const profile = await requireProfile(["instructor"]);
  await connectToDatabase();
  const [assessments, courses, cohorts] = await Promise.all([
    getTestsVisibleTo(profile),
    getCourses(profile.department_id),
    CohortModel.find({
      $or: [{ instructor_id: profile._id }, { instructor_ids: profile._id }],
    })
      .select("_id name course_id course_name")
      .sort({ name: 1 })
      .lean(),
  ]);
  const cohortNames = new Map(
    cohorts.map((cohort) => [String(cohort._id), cohort.name]),
  );
  const courseNames = new Map(
    courses.map((course) => [course.id, course.name]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-gray-500">
          Build an assessment, import questions from CSV, and review student
          submissions.
        </p>
      </div>

      <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium marker:hidden">
          <span>Create an assessment</span>
          <span className="float-right text-sm text-brand-700 group-open:hidden">
            + New
          </span>
          <span className="float-right hidden text-sm text-gray-500 group-open:inline">
            Close
          </span>
        </summary>
        <div className="border-t border-gray-100 p-5">
          {cohorts.length > 0 ? (
            <InstructorAssessmentBuilder
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
              Create or join a cohort before creating an assessment.
            </p>
          )}
        </div>
      </details>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-medium">Your assessments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{assessment.title}</h3>
                  <AssessmentStatus published={assessment.published} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {courseNames.get(assessment.course_id) ?? "Course"} ·{" "}
                  {cohortNames.get(assessment.cohort_id) ?? "Cohort"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {assessment.questions.length} questions ·{" "}
                  {assessment.total_marks} marks · {assessment.duration_minutes}{" "}
                  minutes · Open {assessment.start_date} to{" "}
                  {assessment.end_date}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/instructor/tests/${assessment.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-700 hover:bg-gray-50"
                >
                  View results
                </Link>
                <AssessmentPublishButton
                  assessmentId={assessment.id}
                  published={assessment.published}
                />
              </div>
            </div>
          ))}
          {assessments.length === 0 && (
            <p className="p-5 text-sm text-gray-400">
              No assessments yet. Create one above to get started.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
