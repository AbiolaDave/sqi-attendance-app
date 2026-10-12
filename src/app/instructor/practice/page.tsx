import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getCourses, getPracticeQuizzesVisibleTo } from "@/lib/data/queries";
import { CohortModel } from "@/models/Cohort";
import { InstructorPracticeBuilder } from "@/components/practice/InstructorPracticeBuilder";
import { PracticePublishButton } from "@/components/practice/PracticePublishButton";

export default async function InstructorPracticePage() {
  const profile = await requireProfile(["instructor"]);
  await connectToDatabase();
  const [practiceQuizzes, courses, cohorts] = await Promise.all([
    getPracticeQuizzesVisibleTo(profile),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Practice Questions</h1>
        <p className="text-sm text-gray-500">
          Create reusable, timed quizzes for your cohorts. Students can practice
          whenever they want and repeat quizzes freely.
        </p>
      </div>

      <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium">
          <span>Create a practice quiz</span>
          <span className="float-right text-sm text-brand-700 group-open:hidden">
            + New
          </span>
          <span className="float-right hidden text-sm text-gray-500 group-open:inline">
            Close
          </span>
        </summary>
        <div className="border-t border-gray-100 p-5">
          {cohorts.length ? (
            <InstructorPracticeBuilder
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
              Create or join a cohort before making a practice quiz.
            </p>
          )}
        </div>
      </details>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-medium">Your practice quizzes</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {practiceQuizzes.map((practice) => (
            <div
              key={practice.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{practice.title}</h3>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      practice.published
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {practice.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {courseNames.get(practice.course_id) ?? "Course"} ·{" "}
                  {cohortNames.get(practice.cohort_id) ?? "Cohort"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {practice.questions.length} questions ·{" "}
                  {practice.duration_minutes} minutes · {practice.total_marks}{" "}
                  marks · no availability dates
                </p>
              </div>
              <PracticePublishButton
                practiceId={practice.id}
                published={practice.published}
              />
            </div>
          ))}
          {practiceQuizzes.length === 0 && (
            <p className="p-5 text-sm text-gray-400">
              No practice quizzes yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
