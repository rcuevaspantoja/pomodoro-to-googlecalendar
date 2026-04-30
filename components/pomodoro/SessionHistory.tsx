import type { PomodoroHistoryRecord } from "./types";

type SessionHistoryProps = {
  records: PomodoroHistoryRecord[];
  isLoading: boolean;
  onDeleteRecord: (record: PomodoroHistoryRecord) => void;
};

export function SessionHistory({ records, isLoading, onDeleteRecord }: SessionHistoryProps) {
  return (
    <aside className="h-full rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-black/40">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Session log</h2>

      {isLoading ? (
        <div className="mt-4 flex min-h-[420px] items-center justify-center">
          <img src="/sounds/images/loading.svg" alt="Loading sessions" className="h-14 w-14" />
        </div>
      ) : records.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No completed cycles yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="group flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2"
            >
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{record.name}</p>
                  <p className="text-xs text-zinc-400">
                    {record.presetLabel} - {record.completedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteRecord(record)}
                className="inline-flex h-5 w-5 self-center items-center justify-center"
                aria-label="Delete pomodoro entry"
                title="Delete entry"
              >
                {record.calendarSynced ? (
                  <img
                    src="/sounds/images/calendar.svg"
                    alt="Synced to Google Calendar"
                    className="h-4 w-4 opacity-80 group-hover:hidden"
                  />
                ) : null}
                <img
                  src="/sounds/images/cross.svg"
                  alt="Delete entry"
                  className={`h-4 w-4 opacity-90 ${record.calendarSynced ? "hidden group-hover:block" : "block"}`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
