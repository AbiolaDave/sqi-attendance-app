import { requireProfile } from "@/lib/auth";
import { getStudentById, getInterviewQuestions } from "@/lib/data/queries";
import { InterviewQuestionList } from "@/components/interview/InterviewQuestionList";

export default async function StudentInterviewPage() {
  const profile = await requireProfile(["student"]);
  const student = await getStudentById(profile.id);
  const questions = student ? await getInterviewQuestions(student.department_id) : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Interview Prep</h1>
        <p className="text-sm text-gray-500">Questions relevant to your department. Tap a question to reveal tips.</p>
      </div>
      <InterviewQuestionList questions={questions} />
    </div>
  );
}
