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
};
