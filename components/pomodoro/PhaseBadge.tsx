type PhaseBadgeProps = {
  isBreakTime: boolean;
};

export function PhaseBadge({ isBreakTime }: PhaseBadgeProps) {
  const label = isBreakTime ? "Break" : "Work";
  const containerClass = isBreakTime
    ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
    : "border-zinc-700 bg-zinc-900/70 text-zinc-200";
  const dotClass = isBreakTime ? "bg-emerald-400" : "bg-zinc-300";

  return (
    <div className={`inline-flex items-center gap-3 rounded-lg border px-4 py-2 ${containerClass}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Current phase</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
