type SessionState = "idle" | "running" | "paused";

type TimerControlsProps = {
  sessionState: SessionState;
  onStart: () => void;
  onStopPomodoro: () => void;
  onPause: () => void;
  onResume: () => void;
};

export function TimerControls({
  sessionState,
  onStart,
  onStopPomodoro,
  onPause,
  onResume,
}: TimerControlsProps) {
  const isIdle = sessionState === "idle";
  const isPaused = sessionState === "paused";

  return (
    <div className="flex w-full max-w-sm gap-3">
      <button
        type="button"
        onClick={isIdle ? onStart : onStopPomodoro}
        className="flex-1 rounded-lg bg-zinc-100 px-4 py-3 font-medium text-black transition hover:bg-zinc-300"
      >
        {isIdle ? "Start Pomodoro" : "Stop Pomodoro"}
      </button>
      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        disabled={isIdle}
        className={`flex-1 rounded-lg border bg-zinc-900 px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 disabled:border-zinc-700 disabled:hover:border-zinc-700 disabled:text-zinc-200 ${
          isPaused
            ? "border-rose-500/50 text-rose-400 hover:border-rose-400/70 hover:text-rose-300"
            : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
        }`}
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
