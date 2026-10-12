import { requireProfile } from "@/lib/auth";

export default async function StudentInterviewPage() {
  await requireProfile(["student"]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
        Coming soon
      </p>
      <h1 className="mt-2 text-xl font-semibold">Interview Prep</h1>
      <p className="mt-2 text-sm text-gray-500">
        Interview preparation tools are not available yet.
      </p>
    </div>
  );
}
