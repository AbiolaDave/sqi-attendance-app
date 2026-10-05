import { requireProfile } from "@/lib/auth";
import { getStudentById, getBalanceEntriesForStudent, balanceStatus } from "@/lib/data/queries";
import { BalanceBadge } from "@/components/ui/BalanceBadge";

export default async function StudentPaymentsPage() {
  const profile = await requireProfile(["student"]);
  const student = await getStudentById(profile.id);
  if (!student) return <p className="text-sm text-gray-400">No student record found.</p>;

  const entries = await getBalanceEntriesForStudent(profile, profile.id);
  const outstanding = student.total_fee - student.amount_paid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Balance</h1>
        <p className="text-sm text-gray-500">Only you can see this — not other students.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-3xl font-semibold">₦{outstanding.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">₦{student.amount_paid.toLocaleString()} paid of ₦{student.total_fee.toLocaleString()}</p>
        </div>
        <BalanceBadge status={balanceStatus(student.total_fee, student.amount_paid)} />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-sm">Payment History</h2>
        </div>
        {entries.map((e) => (
          <div key={e.id} className="px-5 py-3 flex items-center justify-between text-sm">
            <span>{e.note || "Payment recorded"}</span>
            <div className="flex items-center gap-3 text-gray-400">
              <span>{new Date(e.recorded_at).toLocaleDateString()}</span>
              <span className="font-medium text-gray-700">₦{e.amount.toLocaleString()}</span>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">No payments recorded yet.</p>}
      </div>
    </div>
  );
}
