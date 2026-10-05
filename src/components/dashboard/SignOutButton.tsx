import { signOutMock } from "@/lib/actions/session";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutMock}>
      <button
        type="submit"
        className={
          compact
            ? "text-xl text-red-500 "
            : "mt-2 w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:text-red-600"
        }
      >
        Sign out
      </button>
    </form>
  );
}
