import { formatTime } from "./utils";

type TimerDisplayProps = {
  secondsLeft: number;
  isBreakTime: boolean;
};

export function TimerDisplay({ secondsLeft, isBreakTime }: TimerDisplayProps) {
  const timerColorClass = isBreakTime ? "text-emerald-400" : "text-zinc-100";

  return (
    <p className={`text-7xl font-bold tabular-nums tracking-widest ${timerColorClass}`}>
      {formatTime(secondsLeft)}
    </p>
  );
}
