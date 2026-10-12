import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeQuizTaker } from "@/components/practice/PracticeQuizTaker";
import { requireProfile } from "@/lib/auth";
import {
  getCourseName,
  getPracticeAttempts,
  getPracticeQuizzesVisibleTo,
  getStudentPracticeQuiz,
  startPracticeQuiz,
} from "@/lib/data/queries";

export default async function StudentPracticePage({
  searchParams,
}: {
  searchParams: { practiceId?: string };
}) {
  const profile = await requireProfile(["student"]);
  if (searchParams.practiceId) {
    const quiz = await getStudentPracticeQuiz(
      searchParams.practiceId,
      profile._id,
    );
    if (!quiz) notFound();
    const attempt = await startPracticeQuiz(quiz.id, profile._id);
    if (!attempt.success) notFound();
    const courseName = await getCourseName(quiz.course_id);
    const attempts = await getPracticeAttempts(quiz.id, profile._id);

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href="/student/practice"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Practice quizzes
        </Link>
        <div>
          <p className="text-xs text-gray-400">{courseName}</p>
          <h1 className="text-xl font-semibold">{quiz.title}</h1>
          {quiz.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
              {quiz.description}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {quiz.questions.length} questions · {quiz.duration_minutes} minutes
            · {quiz.total_marks} marks · repeat as often as you like
          </p>
        </div>
        <PracticeQuizTaker
          key={quiz.id}
          quiz={quiz}
          attemptId={attempt.attemptId}
          startedAt={attempt.startedAt}
        />
        {attempts.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-medium">Previous practice attempts</h2>
            <div className="mt-3 divide-y divide-gray-100">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex justify-between py-2 text-sm"
                >
                  <span className="text-gray-500">
                    {new Date(attempt.submitted_at).toLocaleString()}
                  </span>
                  <span className="font-medium">
                    {attempt.score}/{attempt.total_marks}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const quizzes = await getPracticeQuizzesVisibleTo(profile);
  const rows = await Promise.all(
    quizzes.map(async (quiz) => ({
      quiz,
      courseName: await getCourseName(quiz.course_id),
      attempts: await getPracticeAttempts(quiz.id, profile._id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Practice</h1>
        <p className="text-sm text-gray-500">
          Timed practice quizzes are always available and can be repeated
          anytime.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ quiz, courseName, attempts }) => (
          <article
            key={quiz.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs text-gray-400">{courseName}</p>
            <h2 className="mt-1 font-medium">{quiz.title}</h2>
            {quiz.description && (
              <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
            )}
            <p className="mt-3 text-xs text-gray-400">
              {quiz.questions.length} questions · {quiz.duration_minutes} min ·{" "}
              {quiz.total_marks} marks
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">
                {attempts.length} attempt(s)
              </span>
              <Link
                href={`/student/practice?practiceId=${encodeURIComponent(quiz.id)}`}
                className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Practice →
              </Link>
            </div>
            {attempts[0] && (
              <p className="mt-2 text-xs text-gray-400">
                Latest: {attempts[0].score}/{attempts[0].total_marks}
              </p>
            )}
          </article>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400">
            No practice quizzes are published for your cohort yet.
          </p>
        )}
      </div>
    </div>
  );
}
