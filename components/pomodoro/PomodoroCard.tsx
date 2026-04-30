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
  const [soundMuted, setSoundMuted] = useState(false);
  const phaseCompletionHandledRef = useRef(false);
  const soundMutedRef = useRef(false);

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
        completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-zinc-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <SessionHistory records={historyRecords} />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex w-full items-center justify-end">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <span>Hi, {firstName}</span>
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
    </main>
  );
}
