import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function DashboardShell({
  roleLabel,
  userName,
  navItems,
  children,
}: {
  roleLabel: string;
  userName: string;
  navItems: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="font-semibold text-brand-700 leading-tight">
            SQI College
          </p>
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <p className="px-3 text-sm text-brand-700 truncate">{userName}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <p className="font-semibold text-brand-700">SQI College</p>
          <p className="px-3 text-xl text-brand-700 truncate">{userName} abc</p>
          <SignOutButton compact />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
