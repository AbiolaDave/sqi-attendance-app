import type { BalanceStatus } from "@/types";

const STYLES: Record<BalanceStatus, string> = {
  fully_paid: "bg-green-50 text-green-700 border-green-200",
  partially_paid: "bg-orange-50 text-orange-700 border-orange-200",
  outstanding: "bg-red-50 text-red-700 border-red-200",
};

const LABELS: Record<BalanceStatus, string> = {
  fully_paid: "Fully Paid",
  partially_paid: "Partially Paid",
  outstanding: "Outstanding",
};

export function BalanceBadge({ status }: { status: BalanceStatus }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
