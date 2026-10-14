export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_8px_28px_rgba(28,43,79,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(28,43,79,0.09)] sm:rounded-[22px] sm:p-6">
      <span
        aria-hidden="true"
        className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-brand-50 transition duration-300 group-hover:scale-125"
      />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="relative mt-3 text-3xl font-bold tracking-tight text-slate-800">
        {value}
      </p>
      {hint && (
        <p className="relative mt-2 text-xs leading-relaxed text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}
