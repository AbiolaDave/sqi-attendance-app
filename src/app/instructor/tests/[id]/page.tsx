import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getAssessmentResults } from "@/lib/data/queries";
import { AssessmentResults } from "@/components/tests/AssessmentResults";

export default async function InstructorAssessmentResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile(["instructor"]);
  const results = await getAssessmentResults(profile._id, params.id);
  if (!results) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/instructor/tests"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Assessments
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{results.assessment.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {results.assessment.description}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs ${
              results.assessment.published
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {results.assessment.published ? "Published" : "Draft"}
          </span>
        </div>
      </div>
      <AssessmentResults
        assessment={results.assessment}
        attempts={results.attempts.map((attempt) => ({
          ...attempt,
          grading_status: attempt.grading_status ?? "needs_review",
        }))}
      />
    </div>
  );
}
