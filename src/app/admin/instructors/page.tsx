import { requireProfile } from "@/lib/auth";
import InstructorForm from "./InstructorForm";
import { getInstructors, getDepartments } from "@/lib/data/queries";

// async function inviteInstructor() {
//   "use server";
//   await requireProfile(["super_admin"]);

// }

export default async function InstructorsPage() {
  const [instructors, departments] = await Promise.all([
    getInstructors(),
    getDepartments(),
  ]);
  const departmentOptions = departments.map((department) => ({
    _id: String(department._id),
    name: department.department,
  }));
  await requireProfile(["super_admin"]);



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Instructors</h1>
        <p className="text-sm text-gray-500">
          Invite instructors and see which department they belong to.
        </p>
      </div>

      <InstructorForm departments={departmentOptions} />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {instructors.map((i) => (
          <div key={i.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{i.full_name}</p>
              <p className="text-xs text-gray-400">{i.email}</p>
            </div>
            <span className="text-xs text-gray-500">
              {departmentOptions.find((d) => d._id === i.department_id)?.name}
            </span>
          </div>
        ))}
        {instructors.length === 0 && (
          <p className="p-5 text-sm text-gray-400">No instructors yet.</p>
        )}
      </div>
    </div>
  );
}
