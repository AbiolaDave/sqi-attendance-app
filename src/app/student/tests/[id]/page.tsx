import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getTestById, getTestSubmission } from "@/lib/data/queries";
import { TestTaker } from "@/components/tests/TestTaker";

export default async function TakeTestPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile(["student"]);
  const test = await getTestById(params.id);
  if (!test) notFound();

  const existing = getTestSubmission(test.id, profile.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">{test.title}</h1>
        <p className="text-sm text-gray-500">{test.description}</p>
      </div>

      {existing ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500 mb-1">You already submitted this test</p>
          <p className="text-4xl font-semibold text-brand-600">{existing.score} / {test.total_marks}</p>
        </div>
      ) : (
        <TestTaker test={test} />
      )}
    </div>
  );
}
