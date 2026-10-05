import { requireProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const NAV = [
  { label: "Dashboard", href: "/student" },
  { label: "My Attendance", href: "/student/attendance" },
  { label: "Assessments", href: "/student/tests" },
  { label: "Assignments", href: "/student/assignments" },
  { label: "Practice", href: "/student/practice" },
  { label: "Interview Prep", href: "/student/interview" },
  { label: "Leaderboard", href: "/student/leaderboard" },
  { label: "Payments", href: "/student/payments" },
  { label: "Notifications", href: "/student/notifications" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(["student"]);

  return (
    <DashboardShell roleLabel="Student" userName={profile.full_name} navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
