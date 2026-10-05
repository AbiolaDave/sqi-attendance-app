import { requireProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const NAV = [
  { label: "Dashboard", href: "/instructor" },
  { label: "My Students", href: "/instructor/students" },
  { label: "Attendance", href: "/instructor/attendance" },
  { label: "Assessments", href: "/instructor/tests" },
  { label: "Assignments", href: "/instructor/assignments" },
  { label: "Practice Questions", href: "/instructor/practice" },
  { label: "Interview Questions", href: "/instructor/interview" },
  { label: "Payments", href: "/instructor/payments" },
  { label: "Leaderboards", href: "/instructor/leaderboards" },
  { label: "Notifications", href: "/instructor/notifications" },
];

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(["instructor"]);

  return (
    <DashboardShell roleLabel="Instructor" userName={profile.full_name} navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
