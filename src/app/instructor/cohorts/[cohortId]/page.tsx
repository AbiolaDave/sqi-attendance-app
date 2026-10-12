import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { CohortStudentPanel } from "@/components/instructor/CohortStudentPanel";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CohortModel, type CohortRecord } from "@/models/Cohort";
import { User } from "@/models/User";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function InstructorCohortPage({
  params,
}: {
  params: { cohortId: string };
}) {
  const profile = await requireProfile(["instructor"]);
  if (!mongoose.isValidObjectId(params.cohortId)) notFound();
  await connectToDatabase();

  const cohort = await CohortModel.findById(params.cohortId).lean<CohortRecord>();
  if (
    !cohort ||
    (cohort.instructor_id !== profile._id &&
      !cohort.instructor_ids.includes(profile._id))
  ) {
    notFound();
  }
  const instructor = await User.findOne({
    _id: profile._id,
    role: "instructor",
    isActive: true,
    department_id: cohort.department_id,
  }).select("_id");
  if (!instructor) notFound();

  const [studentDocuments, assignedInstructors] = await Promise.all([
    User.find({ role: "student", cohort_id: String(cohort._id) })
      .select("_id full_name email phone student_id total_fee amount_paid")
      .sort({ full_name: 1 })
      .lean(),
    User.find({ _id: { $in: cohort.instructor_ids } })
      .select("_id full_name")
      .lean(),
  ]);
  const students = studentDocuments.map((student) => ({
    id: String(student._id),
    full_name: student.full_name,
    email: student.email,
    phone: student.phone,
    student_id: student.student_id,
    cohort_id: student.cohort_id,
    total_fee: student.total_fee ?? 0,
    amount_paid: student.amount_paid ?? 0,
  }));
  const instructorNames = new Map(
    assignedInstructors.map((person) => [String(person._id), person.full_name]),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/instructor/cohorts"
          className="text-sm text-brand-700 hover:underline"
        >
          ← All cohorts
        </Link>
        <h1 className="mt-3 text-xl font-semibold">{cohort.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {cohort.start_date ? `Starts ${cohort.start_date} · ` : ""}
          {cohort.instructor_ids.length} assigned instructor(s)
        </p>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Assigned instructors</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cohort.instructor_ids.map((instructorId) => (
            <span
              key={instructorId}
              className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800"
            >
              {instructorNames.get(instructorId) ?? "Instructor"}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Weekly schedule</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {cohort.schedule.map((entry, index) => (
            <div
              key={`${entry.day_of_week}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span className="font-medium">{DAYS[entry.day_of_week]}</span>
              <span className="text-gray-500">
                {entry.start_time}–{entry.end_time}
              </span>
              <span className="text-gray-500">
                {instructorNames.get(entry.instructor_id) ?? "Assigned instructor"}
              </span>
            </div>
          ))}
          {cohort.schedule.length === 0 && (
            <p className="py-3 text-sm text-gray-500">No weekly schedule has been set.</p>
          )}
        </div>
      </section>

      <CohortStudentPanel
        cohortId={String(cohort._id)}
        initialStudents={students}
      />
    </div>
  );
}
