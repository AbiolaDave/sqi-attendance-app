import { requireProfile } from "@/lib/auth";
import { getAttendanceForStudent, getClassById, getCourseName } from "@/lib/data/queries";

const STATUS_DOT: Record<string, string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  late: "bg-orange-500",
  excused: "bg-blue-500",
};

export default async function StudentAttendancePage() {
  const profile = await requireProfile(["student"]);
  const rows = await getAttendanceForStudent(profile.id);

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const cls = await getClassById(r.class_id);
      const courseName = cls ? await getCourseName(cls.course_id) : "—";
      return { ...r, courseName, classDate: cls?.class_date };
    })
  );
  enriched.sort((a, b) => b.marked_at.localeCompare(a.marked_at));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Attendance</h1>
        <p className="text-sm text-gray-500">Your full attendance history, most recent first. Only you can see this.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
        {enriched.map((r) => (
          <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[r.status]}`} />
              <span>{r.courseName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <span className="capitalize">{r.status}</span>
              <span>{r.classDate}</span>
            </div>
          </div>
        ))}
        {enriched.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">No attendance recorded yet.</p>}
      </div>
    </div>
  );
}
