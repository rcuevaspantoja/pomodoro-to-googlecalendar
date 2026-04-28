import { useEffect, useState } from "react";

type CustomPresetValues = {
  name: string;
  workMinutes: string;
  breakMinutes: string;
};

type CustomPresetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: { name: string; workMinutes: number; breakMinutes: number }) => void;
};

export function CustomPresetModal({ isOpen, onClose, onSave }: CustomPresetModalProps) {
  const [values, setValues] = useState<CustomPresetValues>({
    name: "",
    workMinutes: "25",
    breakMinutes: "5",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setValues({ name: "", workMinutes: "25", breakMinutes: "5" });
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const cleanName = values.name.trim();
    const parsedWork = Number(values.workMinutes);
    const parsedBreak = Number(values.breakMinutes);

    if (!cleanName) {
      setError("Name is required.");
      return;
    }
    if (!Number.isInteger(parsedWork) || parsedWork < 1) {
      setError("Work minutes must be an integer >= 1.");
      return;
    }
    if (!Number.isInteger(parsedBreak) || parsedBreak < 0) {
      setError("Break minutes must be an integer >= 0.");
      return;
    }

    onSave({ name: cleanName, workMinutes: parsedWork, breakMinutes: parsedBreak });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
        <h3 className="text-lg font-semibold text-zinc-100">Create custom preset</h3>
        <p className="mt-1 text-sm text-zinc-400">Define a name, work minutes, and optional break minutes.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="custom-name" className="mb-1 block text-sm text-zinc-300">
              Name
            </label>
            <input
              id="custom-name"
              type="text"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-400"
              placeholder="e.g. Sprint review"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-work" className="mb-1 block text-sm text-zinc-300">
                Work minutes
              </label>
              <input
                id="custom-work"
                type="number"
                min={1}
                value={values.workMinutes}
                onChange={(event) => setValues((current) => ({ ...current, workMinutes: event.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="custom-break" className="mb-1 block text-sm text-zinc-300">
                Break minutes
              </label>
              <input
                id="custom-break"
                type="number"
                min={0}
                value={values.breakMinutes}
                onChange={(event) => setValues((current) => ({ ...current, breakMinutes: event.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-300"
          >
            Save custom preset
          </button>
        </div>
      </div>
    </div>
  );
}
