import { getInstructors, getDepartments } from "@/lib/data/queries";
import { requireProfile } from "@/lib/auth";

// NOTE: no real "invite" flow exists without a backend/auth provider.
// This form is a placeholder for where you'd call your own
// "create instructor account" endpoint (which will need to create a
// login credential AND an instructor profile row).
async function inviteInstructor() {
  "use server";
  await requireProfile(["super_admin"]);
  // TODO: call your backend, e.g. POST /api/instructors
}

export default async function InstructorsPage() {
  await requireProfile(["super_admin"]);
  const [instructors, departments] = await Promise.all([getInstructors(), getDepartments()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Instructors</h1>
        <p className="text-sm text-gray-500">Invite instructors and see which department they belong to.</p>
      </div>

      <form action={inviteInstructor} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input name="full_name" placeholder="Full name" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select name="department_id" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Department…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Invite Instructor
        </button>
      </form>
      <p className="text-xs text-gray-400 -mt-3">
        UI-only for now — see the comment in <code>page.tsx</code> for where to wire it to your API.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {instructors.map((i) => (
          <div key={i.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{i.profile?.full_name}</p>
              <p className="text-xs text-gray-400">{i.profile?.email}</p>
            </div>
            <span className="text-xs text-gray-500">{departments.find((d) => d.id === i.department_id)?.name}</span>
          </div>
        ))}
        {instructors.length === 0 && <p className="p-5 text-sm text-gray-400">No instructors yet.</p>}
      </div>
    </div>
  );
}
