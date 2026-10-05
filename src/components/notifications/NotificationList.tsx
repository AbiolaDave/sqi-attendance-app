import type { Notification } from "@/types";
import { markNotificationRead } from "@/lib/actions/notifications";

const TYPE_DOT: Record<string, string> = {
  assignment: "bg-blue-500",
  test: "bg-purple-500",
  attendance: "bg-orange-500",
  schedule: "bg-yellow-500",
  payment: "bg-green-500",
  system: "bg-gray-400",
};

export function NotificationList({ notifications, redirectPath }: { notifications: Notification[]; redirectPath: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
      {notifications.map((n) => (
        <div key={n.id} className={`px-5 py-4 flex items-start justify-between gap-3 ${n.read ? "" : "bg-brand-50/40"}`}>
          <div className="flex items-start gap-3">
            <span className={`h-2 w-2 rounded-full mt-1.5 ${TYPE_DOT[n.type]}`} />
            <div>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-gray-500">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          </div>
          {!n.read && (
            <form action={markNotificationRead.bind(null, n.id, redirectPath)}>
              <button type="submit" className="text-xs text-brand-600 hover:underline whitespace-nowrap">
                Mark read
              </button>
            </form>
          )}
        </div>
      ))}
      {notifications.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">No notifications yet.</p>}
    </div>
  );
}
