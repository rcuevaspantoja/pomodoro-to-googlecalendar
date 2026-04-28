import type { PomodoroHistoryRecord } from "./types";

type SessionHistoryProps = {
  records: PomodoroHistoryRecord[];
};

export function SessionHistory({ records }: SessionHistoryProps) {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-black/40">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Session log</h2>

      {records.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No completed cycles yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2"
            >
              <span className="mt-0.5 text-emerald-400">✓</span>
              <div>
                <p className="text-sm font-medium text-zinc-100">{record.name}</p>
                <p className="text-xs text-zinc-400">
                  {record.presetLabel} - {record.completedAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
