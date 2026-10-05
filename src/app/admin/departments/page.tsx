import { getDepartments } from "@/lib/data/queries";
import { requireProfile } from "@/lib/auth";

// NOTE: this "form" doesn't persist a new department anywhere yet —
// there's no write function in queries.ts for departments because
// this is meant to be your first real backend endpoint. Wire the
// action below up to a POST to your API once it exists.
async function createDepartment() {
  "use server";
  await requireProfile(["super_admin"]);
  // TODO: call your backend, e.g. POST /api/departments
  
}

export default async function DepartmentsPage() {
  await requireProfile(["super_admin"]);
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="text-sm text-gray-500">Create and manage academic departments.</p>
      </div>

      <form action={createDepartment} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row gap-3">
        <input name="name" placeholder="Department name" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input name="description" placeholder="Description (optional)" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Add Department
        </button>
      </form>
      <p className="text-xs text-gray-400 -mt-3">
        This form is UI-only for now — see the comment in <code>page.tsx</code> for where to wire it to your API.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {departments.length === 0 && <p className="p-5 text-sm text-gray-400">No departments yet.</p>}
        {departments.map((d) => (
          <div key={d.id} className="p-4">
            <p className="font-medium text-sm">{d.name}</p>
            {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
