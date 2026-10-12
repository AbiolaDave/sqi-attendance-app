import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CohortManager } from "@/components/instructor/CohortManager";
import { getLevels } from "@/lib/data/queries";
import { CohortModel, type CohortRecord } from "@/models/Cohort";
import { User } from "@/models/User";
import type { Cohort, CohortSchedule } from "@/types";

export default async function InstructorCohortsPage() {
  const profile = await requireProfile(["instructor"]);
  await connectToDatabase();

  const currentInstructor = await User.findOne({
    _id: profile._id,
    role: "instructor",
    isActive: true,
  }).select("_id department_id");
  if (!currentInstructor?.department_id) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Your instructor account must be assigned to a department before you can
        manage cohorts.
      </div>
    );
  }

  const [instructorDocuments, cohortDocuments, levels] = await Promise.all([
    User.find({
      role: "instructor",
      isActive: true,
      department_id: currentInstructor.department_id,
    })
      .select("_id full_name email")
      .sort({ full_name: 1 })
      .lean(),
    CohortModel.find({
      department_id: currentInstructor.department_id,
      $or: [{ instructor_id: profile._id }, { instructor_ids: profile._id }],
    })
      .sort({ createdAt: -1 })
      .lean<CohortRecord[]>(),
    getLevels(),
  ]);

  const instructors = instructorDocuments.map((instructor) => ({
    id: String(instructor._id),
    full_name: instructor.full_name,
    email: instructor.email,
  }));
  const cohorts: Cohort[] = cohortDocuments.map((cohort) => {
    const cohortId = String(cohort._id);
    return {
      id: cohortId,
      department_id: cohort.department_id,
      level_id: cohort.level_id,
      name: cohort.name,
      start_date: cohort.start_date,
      course_id: cohort.course_id,
      course_name: cohort.course_name,
      instructor_id: cohort.instructor_id,
      instructor_ids: cohort.instructor_ids,
      schedule: cohort.schedule.map((entry, index) => ({
        id: `${cohortId}-schedule-${index}`,
        cohort_id: cohortId,
        instructor_id: entry.instructor_id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
      })) satisfies CohortSchedule[],
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl text-indigo-600 font-semibold">Cohorts</h1>
        <p className="text-sm text-gray-500">
          Create department cohorts, assign instructors, set weekly class times,
          and manage students.
        </p>
      </div>
      <CohortManager
        levels={levels}
        instructors={instructors}
        cohorts={cohorts}
      />
    </div>
  );
}
