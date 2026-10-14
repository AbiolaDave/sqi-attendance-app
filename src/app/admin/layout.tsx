import { requireProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Departments", href: "/admin/departments" },
  { label: "Instructors", href: "/admin/instructors" },
  { label: "Students", href: "/admin/students" },
  { label: "Assessments", href: "/admin/tests" },
  { label: "Assignments", href: "/admin/assignments" },
  { label: "Practice Questions", href: "/admin/practice" },
  { label: "Interview Questions", href: "/admin/interview" },
  { label: "Leaderboards", href: "/admin/leaderboards" },
  { label: "Notifications", href: "/admin/notifications" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["super_admin"]);

  return (
    <DashboardShell
      roleLabel="Super Admin"
      userName={profile.full_name}
      navItems={NAV}
    >
      {children}
    </DashboardShell>
  );
}
