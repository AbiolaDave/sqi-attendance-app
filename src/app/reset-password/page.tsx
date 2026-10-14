import { ResetPasswordForm } from "@/components/auth/PasswordForms";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fc] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_28px_80px_rgba(28,43,79,0.12)] sm:p-9">
        <span className="mb-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 font-black text-white shadow-lg shadow-brand-500/20">
          S
        </span>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
          Reset your password
        </h1>
        <p className="mb-7 text-sm leading-6 text-slate-500">
          Choose a new password of at least 12 characters.
        </p>
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
