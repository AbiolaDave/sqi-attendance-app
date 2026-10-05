import { requireProfile } from "@/lib/auth";
import { getStudentsVisibleTo, getProfile, balanceStatus } from "@/lib/data/queries";
import { BalanceBadge } from "@/components/ui/BalanceBadge";
import { recordPayment } from "./actions";

export default async function InstructorPaymentsPage() {
  const user = await requireProfile(["instructor"]);
  const students = await getStudentsVisibleTo(user);
  const rows = await Promise.all(students.map(async (s) => ({ student: s, profile: await getProfile(s.id) })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-gray-500">
          Record what a student has paid so far. This is a manual balance tracker, not a payment gateway — no money
          moves through this page.
        </p>
      </div>

      <form action={recordPayment} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select name="student_id" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2">
          <option value="">Select student…</option>
          {rows.map(({ student, profile }) => (
            <option key={student.id} value={student.id}>{profile?.full_name}</option>
          ))}
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount (₦)" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input name="note" placeholder="Note (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="md:col-span-4 rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
          Record Payment
        </button>
      </form>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {rows.map(({ student, profile }) => (
          <div key={student.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{profile?.full_name}</p>
              <p className="text-xs text-gray-400">
                ₦{student.amount_paid.toLocaleString()} paid of ₦{student.total_fee.toLocaleString()} · ₦
                {(student.total_fee - student.amount_paid).toLocaleString()} outstanding
              </p>
            </div>
            <BalanceBadge status={balanceStatus(student.total_fee, student.amount_paid)} />
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-sm text-gray-400">No students assigned to you yet.</p>}
      </div>
    </div>
  );
}
