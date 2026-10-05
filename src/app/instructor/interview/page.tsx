import { requireProfile } from "@/lib/auth";
import { getDepartments, getInterviewQuestions } from "@/lib/data/queries";
import { InterviewQuestionList } from "@/components/interview/InterviewQuestionList";

async function addInterviewQuestion() {
  "use server";
  await requireProfile(["instructor", "super_admin"]);
  // TODO: call your backend, e.g. POST /api/interview-questions
}

export default async function InterviewQuestionsPage() {
  await requireProfile(["instructor", "super_admin"]);
  const departments = await getDepartments();
  const firstDept = departments[0];
  const questions = firstDept ? await getInterviewQuestions(firstDept.id) : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Interview Questions</h1>
        <p className="text-sm text-gray-500">Manage the interview-prep bank for {firstDept?.name}.</p>
      </div>

      <form action={addInterviewQuestion} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-3 items-center">
        <input placeholder="Question" className="flex-1 min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Add Question
        </button>
        <span className="text-xs text-gray-400 w-full">UI-only placeholder — see the comment at the top of this file.</span>
      </form>

      <InterviewQuestionList questions={questions} />
    </div>
  );
}
