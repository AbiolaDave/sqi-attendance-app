import { getDepartments } from "@/lib/data/queries";
import { requireProfile } from "@/lib/auth";
import DepartmentForm from "./DepartmentForm";

async function createDepartment() {
  "use server";
  await requireProfile(["super_admin"]);

}

export default async function DepartmentsPage() {
  await requireProfile(["super_admin"]);
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="text-sm text-gray-500">
          Create and manage academic departments.
        </p>
      </div>
      <DepartmentForm />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {departments.length === 0 && (
          <p className="p-5 text-sm text-gray-400">No departments yet.</p>
        )}
        {departments.map((d) => (
          <div key={d.id} className="p-4">
            <p className="font-medium text-sm">{d.department}</p>
            {d.description && (
              <p className="text-xs text-gray-400">{d.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
