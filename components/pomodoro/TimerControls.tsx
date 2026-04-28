type TimerControlsProps = {
  onStart: () => void;
  onStop: () => void;
};

export function TimerControls({ onStart, onStop }: TimerControlsProps) {
  return (
    <div className="flex w-full max-w-sm gap-3">
      <button
        type="button"
        onClick={onStart}
        className="flex-1 rounded-lg bg-zinc-100 px-4 py-3 font-medium text-black transition hover:bg-zinc-300"
      >
        Start Pomodoro
      </button>
      <button
        type="button"
        onClick={onStop}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-medium text-zinc-200 transition hover:border-zinc-500"
      >
        Stop
      </button>
    </div>
  );
}
