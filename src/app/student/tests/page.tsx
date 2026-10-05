import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getTestsVisibleTo, getTestSubmission, getCourseName } from "@/lib/data/queries";

export default async function StudentTestsPage() {
  const profile = await requireProfile(["student"]);
  const tests = await getTestsVisibleTo(profile);

  const rows = await Promise.all(
    tests.map(async (t) => ({
      test: t,
      courseName: await getCourseName(t.course_id),
      submission: getTestSubmission(t.id, profile.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-gray-500">Tests available for your cohort.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(({ test, courseName, submission }) => (
          <div key={test.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">{courseName}</p>
            <h2 className="font-medium">{test.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{test.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">{test.duration_minutes} min · {test.total_marks} marks</span>
              {submission ? (
                <span className="text-sm font-medium text-green-600">Scored {submission.score}/{test.total_marks}</span>
              ) : (
                <Link href={`/student/tests/${test.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                  Start Test →
                </Link>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">No assessments available right now.</p>}
      </div>
    </div>
  );
}
