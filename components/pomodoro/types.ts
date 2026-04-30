export type PomodoroPreset = {
  id: string;
  label: string;
  workMinutes: number;
  breakMinutes: number;
};

export type PomodoroHistoryRecord = {
  id: string;
  name: string;
  presetLabel: string;
  completedAt: string;
  completedAtISO: string;
  durationMinutes: number;
  exportedToDrive?: boolean;
  calendarSynced?: boolean;
  calendarEventId?: string;
};
