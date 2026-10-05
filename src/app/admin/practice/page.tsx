import { requireProfile } from "@/lib/auth";
import { getDepartments, getPracticeQuestions } from "@/lib/data/queries";

async function addPracticeQuestion() {
  "use server";
  await requireProfile(["instructor", "super_admin"]);
  // TODO: call your backend, e.g. POST /api/practice-questions
}

export default async function PracticeQuestionsPage() {
  await requireProfile(["instructor", "super_admin"]);
  const departments = await getDepartments();
  const questionsByDept = await Promise.all(
    departments.map(async (d) => ({ department: d, questions: await getPracticeQuestions(d.id) }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Practice Questions</h1>
        <p className="text-sm text-gray-500">Question bank organized by department, course, and topic.</p>
      </div>

      <form action={addPracticeQuestion} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-3 items-center">
        <input placeholder="Question prompt" className="flex-1 min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Add Question
        </button>
        <span className="text-xs text-gray-400 w-full">UI-only placeholder — see the comment at the top of this file.</span>
      </form>

      {questionsByDept.map(({ department, questions }) =>
        questions.length > 0 ? (
          <div key={department.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium text-sm">{department.name}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {questions.map((q) => (
                <div key={q.id} className="px-5 py-3 text-sm">
                  <p>{q.prompt}</p>
                  <p className="text-xs text-gray-400 mt-1">{q.topic} · {q.type.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
