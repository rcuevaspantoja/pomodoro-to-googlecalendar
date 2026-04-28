import type { PomodoroPreset } from "./types";

export const PRESETS: PomodoroPreset[] = [
  { id: "25-5", label: "25-5 (Classic)", workMinutes: 25, breakMinutes: 5 },
  { id: "50-10", label: "50-10 (Deep focus)", workMinutes: 50, breakMinutes: 10 },
  { id: "solo", label: "Work only (no break)", workMinutes: 25, breakMinutes: 0 },
  { id: "custom", label: "Custom", workMinutes: 25, breakMinutes: 5 },
];
