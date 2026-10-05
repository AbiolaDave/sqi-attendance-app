import { requireProfile } from "@/lib/auth";
import { getStudentById, getPracticeQuestions, getPracticeProgress } from "@/lib/data/queries";
import { PracticeQuiz } from "@/components/practice/PracticeQuiz";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function StudentPracticePage() {
  const profile = await requireProfile(["student"]);
  const student = await getStudentById(profile.id);
  const questions = student ? await getPracticeQuestions(student.department_id) : [];
  const progress = getPracticeProgress(profile.id);
  const accuracy = progress.attempted ? Math.round((progress.correct / progress.attempted) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Practice</h1>
        <p className="text-sm text-gray-500">Sharpen your skills outside of formal tests.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Attempted" value={progress.attempted} />
        <StatCard label="Accuracy" value={`${accuracy}%`} />
        <StatCard label="Streak" value={progress.streak} />
      </div>

      {questions.length > 0 ? (
        <PracticeQuiz questions={questions} />
      ) : (
        <p className="text-sm text-gray-400">No practice questions available for your department yet.</p>
      )}
    </div>
  );
}
