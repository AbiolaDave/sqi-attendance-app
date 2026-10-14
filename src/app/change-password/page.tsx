import { ChangePasswordForm } from "@/components/auth/PasswordForms";
import { requireProfile } from "@/lib/auth";

export default async function ChangePasswordPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-brand-700">
        Change password
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Update the password for {profile.email}. Use at least 12 characters.
      </p>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
