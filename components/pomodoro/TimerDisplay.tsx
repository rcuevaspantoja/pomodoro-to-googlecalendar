import { formatTime } from "./utils";

type TimerDisplayProps = {
  secondsLeft: number;
  isBreakTime: boolean;
  breakMinutes: number;
};

export function TimerDisplay({ secondsLeft, isBreakTime, breakMinutes }: TimerDisplayProps) {
  const timerColorClass = isBreakTime ? "text-emerald-400" : "text-zinc-100";

  return (
    <div className="relative inline-flex justify-center">
      <p className={`select-none text-7xl font-bold tabular-nums tracking-widest ${timerColorClass}`}>
        {formatTime(secondsLeft)}
      </p>
      {breakMinutes > 0 ? (
        <span className="pointer-events-none absolute bottom-2 left-full ml-3 select-none text-m font-medium text-zinc-500">
          /{breakMinutes}m
        </span>
      ) : null}
    </div>
  );
}
