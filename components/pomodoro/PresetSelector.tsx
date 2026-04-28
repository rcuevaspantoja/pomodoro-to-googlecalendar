import type { PomodoroPreset } from "./types";

type PresetSelectorProps = {
  presets: PomodoroPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onCustomPresetClick: () => void;
};

export function PresetSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
  onCustomPresetClick,
}: PresetSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => (preset.id === "custom" ? onCustomPresetClick() : onSelectPreset(preset.id))}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            selectedPresetId === preset.id
              ? "border-zinc-200 bg-zinc-100 text-black"
              : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
