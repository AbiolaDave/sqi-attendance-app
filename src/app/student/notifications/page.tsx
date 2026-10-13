import { requireProfile } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/data/queries";
import { NotificationList } from "@/components/notifications/NotificationList";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const notifications = await getNotificationsForUser(profile._id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-gray-500">Only notifications addressed to you.</p>
      </div>
      <NotificationList notifications={notifications} redirectPath="/student/notifications" />
    </div>
  );
}
