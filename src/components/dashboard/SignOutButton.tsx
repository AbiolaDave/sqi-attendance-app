import { signOut } from "@/lib/actions/session";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={
          compact
            ? "flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            : "w-full rounded-xl px-2 py-2 text-left text-xs font-medium text-slate-400 transition hover:bg-red-400/10 hover:text-red-200"
        }
      >
        Sign out
      </button>
    </form>
  );
}
