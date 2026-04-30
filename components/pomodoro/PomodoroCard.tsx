"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { PRESETS } from "./constants";
import { CustomPresetModal } from "./CustomPresetModal";
import { PhaseBadge } from "./PhaseBadge";
import { playBell } from "./playBell";
import { PresetSelector } from "./PresetSelector";
import { SessionHistory } from "./SessionHistory";
import { TimerControls } from "./TimerControls";
import { TimerDisplay } from "./TimerDisplay";
import type { PomodoroHistoryRecord, PomodoroPreset } from "./types";

export function PomodoroCard() {
  const { data: session, status } = useSession();
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? "there";
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [sessionActive, setSessionActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [pomodoroName, setPomodoroName] = useState("Focus session");
  const [historyRecords, setHistoryRecords] = useState<PomodoroHistoryRecord[]>([]);
  const [customPreset, setCustomPreset] = useState<PomodoroPreset | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [didLoadDriveSettings, setDidLoadDriveSettings] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [didLoadDriveData, setDidLoadDriveData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const isDriveLoading = status === "authenticated" && !didLoadDriveData;
  const phaseCompletionHandledRef = useRef(false);
  const soundMutedRef = useRef(false);
  const skipNextSyncRef = useRef(false);
  const skipNextSettingsSaveRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("pomodoro-sound-muted") === "true") {
        setSoundMuted(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    soundMutedRef.current = soundMuted;
  }, [soundMuted]);

  const toggleSoundMuted = () => {
    setSoundMuted((current) => {
      const next = !current;
      try {
        localStorage.setItem("pomodoro-sound-muted", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const selectedPreset = useMemo(
    () => (selectedPresetId === "custom" && customPreset ? customPreset : PRESETS.find((preset) => preset.id === selectedPresetId) ?? PRESETS[0]),
    [selectedPresetId, customPreset],
  );

  const presetsForSelector = useMemo(
    () =>
      PRESETS.map((preset) =>
        preset.id === "custom" && customPreset
          ? { ...preset, label: customPreset.label }
          : preset,
      ),
    [customPreset],
  );

  const [secondsLeft, setSecondsLeft] = useState(selectedPreset.workMinutes * 60);

  const addHistoryRecord = () => {
    const cleanName = pomodoroName.trim() || "Untitled session";

    setHistoryRecords((currentRecords) => [
      {
        id: crypto.randomUUID(),
        name: cleanName,
        presetLabel: selectedPreset.label,
        durationMinutes: selectedPreset.workMinutes,
        completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        completedAtISO: new Date().toISOString(),
      },
      ...currentRecords,
    ]);
  };

  const completeSessionWithOptionalSound = () => {
    if (!soundMutedRef.current) {
      void playBell();
    }
    addHistoryRecord();
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setDidLoadDriveData(false);
      setDidLoadDriveSettings(false);
      setSyncStatus("idle");
      skipNextSyncRef.current = false;
      skipNextSettingsSaveRef.current = false;
      return;
    }

    let isCancelled = false;

    const loadFromDrive = async () => {
      setSyncStatus("syncing");
      try {
        const response = await fetch("/api/drive/pomodoros", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load records");
        }

        const data = (await response.json()) as { records?: PomodoroHistoryRecord[] };
        if (!isCancelled && Array.isArray(data.records)) {
          // Evita que la hidratacion inicial desde Drive dispare un POST innecesario.
          skipNextSyncRef.current = true;
          setHistoryRecords(data.records);
          setSyncStatus("synced");
        }
      } catch {
        if (!isCancelled) {
          setSyncStatus("error");
        }
      } finally {
        if (!isCancelled) {
          setDidLoadDriveData(true);
        }
      }
    };

    void loadFromDrive();

    return () => {
      isCancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let isCancelled = false;

    const loadSettingsFromDrive = async () => {
      try {
        const response = await fetch("/api/drive/settings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load settings");
        }

        const data = (await response.json()) as { calendarSyncEnabled?: boolean };
        if (!isCancelled) {
          skipNextSettingsSaveRef.current = true;
          setCalendarSyncEnabled(Boolean(data.calendarSyncEnabled));
        }
      } finally {
        if (!isCancelled) {
          setDidLoadDriveSettings(true);
        }
      }
    };

    void loadSettingsFromDrive();

    return () => {
      isCancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !didLoadDriveSettings) return;
    if (skipNextSettingsSaveRef.current) {
      skipNextSettingsSaveRef.current = false;
      return;
    }

    void fetch("/api/drive/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarSyncEnabled }),
    });
  }, [calendarSyncEnabled, status, didLoadDriveSettings]);

  useEffect(() => {
    if (status !== "authenticated" || !didLoadDriveData) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    let isCancelled = false;

    const syncToDrive = async () => {
      setSyncStatus("syncing");
      try {
        const response = await fetch("/api/drive/pomodoros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: historyRecords }),
        });

        if (!response.ok) {
          throw new Error("Unable to save records");
        }

        if (!isCancelled) {
          setSyncStatus("synced");
        }
      } catch {
        if (!isCancelled) {
          setSyncStatus("error");
        }
      }
    };

    void syncToDrive();

    return () => {
      isCancelled = true;
    };
  }, [historyRecords, status, didLoadDriveData]);

  useEffect(() => {
    if (status !== "authenticated" || !didLoadDriveData || !calendarSyncEnabled) return;

    const pending = historyRecords.filter((record) => !record.calendarSynced);
    if (pending.length === 0) return;

    let isCancelled = false;

    const syncPendingRecordsToCalendar = async () => {
      for (const record of pending) {
        try {
          const response = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ record }),
          });

          if (!response.ok) {
            throw new Error("Unable to sync calendar event");
          }

          const data = (await response.json()) as { eventId?: string | null };
          if (!isCancelled) {
            setHistoryRecords((currentRecords) =>
              currentRecords.map((currentRecord) =>
                currentRecord.id === record.id
                  ? {
                      ...currentRecord,
                      calendarSynced: true,
                      calendarEventId: data.eventId ?? undefined,
                    }
                  : currentRecord,
              ),
            );
          }
        } catch {
          if (!isCancelled) {
            setSyncStatus("error");
          }
        }
      }
    };

    void syncPendingRecordsToCalendar();

    return () => {
      isCancelled = true;
    };
  }, [status, didLoadDriveData, calendarSyncEnabled, historyRecords]);

  useEffect(() => {
    setSessionActive(false);
    setIsRunning(false);
    setIsBreakTime(false);
    setSecondsLeft(selectedPreset.workMinutes * 60);
    phaseCompletionHandledRef.current = false;
  }, [selectedPreset]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((currentValue) => (currentValue > 0 ? currentValue - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft > 0) {
      phaseCompletionHandledRef.current = false;
      return;
    }

    if (!isRunning || phaseCompletionHandledRef.current) return;

    phaseCompletionHandledRef.current = true;

    if (isBreakTime) {
      completeSessionWithOptionalSound();
      setSessionActive(false);
      setIsRunning(false);
      setIsBreakTime(false);
      setSecondsLeft(selectedPreset.workMinutes * 60);
      return;
    }

    if (selectedPreset.breakMinutes > 0) {
      setIsBreakTime(true);
      setSecondsLeft(selectedPreset.breakMinutes * 60);
      return;
    }

    completeSessionWithOptionalSound();
    setSessionActive(false);
    setIsRunning(false);
    setSecondsLeft(selectedPreset.workMinutes * 60);
  }, [secondsLeft, isRunning, isBreakTime, selectedPreset, pomodoroName]);

  const stopPomodoroSession = () => {
    setSessionActive(false);
    setIsRunning(false);
    setIsBreakTime(false);
    setSecondsLeft(selectedPreset.workMinutes * 60);
    phaseCompletionHandledRef.current = false;
  };

  const startOrResumeSession = () => {
    setSessionActive(true);
    setIsRunning(true);
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  const handleCustomPresetClick = () => {
    if (!customPreset) {
      setIsCustomModalOpen(true);
      return;
    }

    if (selectedPresetId !== "custom") {
      setSelectedPresetId("custom");
      return;
    }

    setIsCustomModalOpen(true);
  };

  const handleSaveCustomPreset = (values: { name: string; workMinutes: number; breakMinutes: number }) => {
    const newCustomPreset: PomodoroPreset = {
      id: "custom",
      label: values.name,
      workMinutes: values.workMinutes,
      breakMinutes: values.breakMinutes,
    };

    setCustomPreset(newCustomPreset);
    setSelectedPresetId("custom");
  };

  const toggleCalendarSync = () => {
    setCalendarSyncEnabled((current) => !current);
  };

  const handleDeleteRecord = async (record: PomodoroHistoryRecord) => {
    try {
      if (record.calendarEventId) {
        const response = await fetch("/api/calendar/events", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: record.calendarEventId }),
        });

        if (!response.ok) {
          throw new Error("Unable to delete calendar event");
        }
      }

      setHistoryRecords((currentRecords) =>
        currentRecords.filter((currentRecord) => currentRecord.id !== record.id),
      );
    } catch {
      setSyncStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-zinc-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <SessionHistory
          records={historyRecords}
          isLoading={isDriveLoading}
          onDeleteRecord={handleDeleteRecord}
        />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-zinc-900/80"
              aria-label="Open settings"
            >
              <img src="/sounds/images/gear.svg" alt="Settings" className="h-5 w-5" />
            </button>
            {status === "authenticated" ? (
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <span>Hi, {firstName}</span>
                {syncStatus === "syncing" ? (
                  <img src="/sounds/images/syncing.svg" alt="Syncing" className="h-4 w-4" />
                ) : null}
                {syncStatus === "synced" ? (
                  <img src="/sounds/images/check_mark.svg" alt="Synced" className="h-4 w-4" />
                ) : null}
                {syncStatus === "error" ? <span className="text-rose-400">sync failed</span> : null}
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signIn("google")}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
              >
                <img src="/sounds/images/google.svg" alt="Google logo" className="h-4 w-4" />
                <span>LOGIN</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Minimalist Pomodoro</h1>

          <div className="w-full max-w-sm text-left">
            <label htmlFor="pomodoro-name" className="mb-2 block text-sm text-zinc-400">
              Session name
            </label>
            <input
              id="pomodoro-name"
              type="text"
              value={pomodoroName}
              onChange={(event) => setPomodoroName(event.target.value)}
              placeholder="e.g. Deep work - Marketing report"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-400"
            />
          </div>

          <PresetSelector
            presets={presetsForSelector}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handlePresetSelect}
            onCustomPresetClick={handleCustomPresetClick}
          />
          <PhaseBadge isBreakTime={isBreakTime} />
          <TimerDisplay
            secondsLeft={secondsLeft}
            isBreakTime={isBreakTime}
            breakMinutes={selectedPreset.breakMinutes}
          />
          <button
            type="button"
            onClick={toggleSoundMuted}
            className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
            aria-pressed={soundMuted}
          >
            {soundMuted ? "Unmute completion sound" : "Mute completion sound"}
          </button>
          <TimerControls
            sessionState={!sessionActive ? "idle" : isRunning ? "running" : "paused"}
            onStart={startOrResumeSession}
            onStopPomodoro={stopPomodoroSession}
            onPause={pauseSession}
            onResume={startOrResumeSession}
          />
        </div>
        </section>
      </div>
      <CustomPresetModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomPreset}
      />
      {isSettingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-100">Sync with Google Calendar</p>
                <p className="text-xs text-zinc-500">Optional export of sessions to Calendar.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={calendarSyncEnabled}
                onClick={toggleCalendarSync}
                className={`relative h-6 w-11 rounded-full border transition ${
                  calendarSyncEnabled
                    ? "border-zinc-200 bg-zinc-100"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full transition ${
                    calendarSyncEnabled ? "left-5 bg-black" : "left-0.5 bg-zinc-300"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
