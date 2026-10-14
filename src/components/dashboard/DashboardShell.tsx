"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const dashboardPath = navItems[0]?.href;
  const isNavItemActive = (href: string) =>
    pathname === href ||
    (href !== "/" &&
      href !== dashboardPath &&
      pathname.startsWith(`${href}/`));
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-[272px] shrink-0 flex-col bg-[#17213c] text-white md:sticky md:top-0 md:flex md:h-screen">
        <Link
          href="/"
          className="flex items-center gap-3 border-b border-white/10 px-7 py-7 no-underline"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-400 text-lg font-black text-white shadow-lg shadow-brand-500/25">
            S
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-wide text-white">
              SQI College
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Academic portal
            </span>
          </span>
        </Link>

        <div className="px-6 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Workspace
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-4 py-2">
          {navItems.map((item, index) => {
            const active = isNavItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium no-underline transition ${
                  active
                    ? "bg-white text-[#26365f] shadow-[0_8px_24px_rgba(6,13,33,0.18)]"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "bg-white/[0.08] text-slate-400 group-hover:text-white"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <Link
            href="/change-password"
            className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-slate-300 no-underline transition hover:bg-white/[0.07] hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400/15 text-sm font-bold text-brand-200">
              {initials || "U"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-white">
                {userName}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                {roleLabel} · Account settings
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-500">
              ›
            </span>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 font-black text-white">
                S
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-800">
                  SQI College
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {roleLabel}
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/change-password"
                aria-label="Change password"
                title="Change password"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 no-underline hover:border-brand-200 hover:text-brand-600"
              >
                {initials || "U"}
              </Link>
              <SignOutButton compact />
            </div>
          </div>
          <nav
            aria-label="Main navigation"
            className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2"
          >
            {navItems.map((item) => {
              const active = isNavItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium no-underline transition ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 md:min-h-screen">
          <div className="mb-7 hidden items-center justify-between md:flex">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">
                SQI Academic Portal
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your {roleLabel.toLowerCase()} workspace
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
              <span className="text-xs font-medium text-slate-600">
                All systems ready
              </span>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
