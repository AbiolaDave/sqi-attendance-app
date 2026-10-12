import { requireProfile } from "@/lib/auth";
import {
  getCohortIdsForInstructor,
  getClassesForInstructor,
  getStudentsVisibleTo,
  getCourseName,
  getCohortName,
  getInstructors,
  getLevels,
} from "@/lib/data/queries";
import { StatCard } from "@/components/dashboard/StatCard";
import { CohortModal } from "@/components/modal/CohortModal";

export default async function InstructorDashboard() {
  const profile = await requireProfile(["instructor"]);
  const today = new Date().toISOString().slice(0, 10);

  const cohortIds = await getCohortIdsForInstructor(profile._id);

  const [students, todaysClasses, instructors, levels] = await Promise.all([
    getStudentsVisibleTo(profile),
    getClassesForInstructor(profile._id, today),
    getInstructors(),
    getLevels(),
  ]);
  const currentInstructor = instructors.find(
    (instructor) => instructor.id === profile._id,
  );

  const classRows = await Promise.all(
    todaysClasses.map(async (c) => ({
      ...c,
      courseName: await getCourseName(c.cohort_id),
      cohortName: await getCohortName(c.cohort_id),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl text-blue-600 font-semibold">
            Welcome back, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500">
            Here&apos;s what&apos;s on today.
          </p>
        </div>
        {currentInstructor && (
          <CohortModal levels={levels} instructor={currentInstructor} />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Students" value={students.length} />
        <StatCard label="Today's Classes" value={classRows.length} />
        <StatCard label="Cohorts Taught" value={cohortIds.length} />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-indigo-600 text-sm">
            Today&apos;s Schedule
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {classRows.map((c) => (
            <div
              key={c.id}
              className="px-5 py-3 flex items-center text-blue-500 justify-between text-sm"
            >
              <span>
                {c.courseName} — {c.cohortName}
              </span>
              <span className="text-blue-400">
                {c.start_time}–{c.end_time}
              </span>
            </div>
          ))}
          {classRows.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400">
              No classes scheduled for today.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
