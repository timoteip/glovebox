"use client";

import { useRef, useState, useTransition } from "react";
import { addEntry } from "./actions";
import type { Entry, EntryType } from "@/lib/types";

const TYPES: { value: EntryType; label: string }[] = [
  { value: "fuel",    label: "Fuel" },
  { value: "service", label: "Service" },
  { value: "part",    label: "Part" },
  { value: "mileage", label: "Mileage" },
  { value: "note",    label: "Note" },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export type EntryFormDefaults = Pick<
  Entry,
  "type" | "date" | "odometer" | "title" | "description" | "cost" | "gallons" | "trip_miles" | "mpg" | "is_full_tank" | "fuel_grade"
>;

interface Props {
  vehicleId: string;
  defaultValues?: EntryFormDefaults;
  onSubmit?: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
}

const INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400";

const LABEL = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function EntryForm({ vehicleId, defaultValues, onSubmit, onSuccess, submitLabel = "Add entry" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<EntryType>(defaultValues?.type ?? "fuel");
  const [pending, startTransition] = useTransition();

  // Fuel field state — kept in sync so any two fields calculate the third
  const [gallonsVal, setGallonsVal] = useState(defaultValues?.gallons?.toString() ?? "");
  const [tripMilesVal, setTripMilesVal] = useState(defaultValues?.trip_miles?.toString() ?? "");
  const [mpgVal, setMpgVal] = useState(() => {
    const g = defaultValues?.gallons;
    const t = defaultValues?.trip_miles;
    if (g && t && g > 0 && t > 0) return (t / g).toFixed(1);
    if (defaultValues?.mpg) return defaultValues.mpg.toFixed(1);
    return "";
  });

  const showTitle       = type !== "mileage" && type !== "fuel";
  const showDescription = type === "service" || type === "part" || type === "note";
  const showCost        = type === "service" || type === "part" || type === "fuel";
  const showOdometer    = type !== "note";
  const showFuel        = type === "fuel";

  function handleGallonsChange(val: string) {
    setGallonsVal(val);
    const g = parseFloat(val);
    const t = parseFloat(tripMilesVal);
    if (g > 0 && t > 0) setMpgVal((t / g).toFixed(1));
    else if (!val) setMpgVal("");
  }

  function handleTripMilesChange(val: string) {
    setTripMilesVal(val);
    const g = parseFloat(gallonsVal);
    const t = parseFloat(val);
    if (g > 0 && t > 0) setMpgVal((t / g).toFixed(1));
    else if (!val) setMpgVal("");
  }

  function handleMpgChange(val: string) {
    setMpgVal(val);
    const g = parseFloat(gallonsVal);
    const m = parseFloat(val);
    if (g > 0 && m > 0) setTripMilesVal((m * g).toFixed(1));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await addEntry(vehicleId, formData);
        formRef.current?.reset();
        setType("fuel");
        setGallonsVal("");
        setTripMilesVal("");
        setMpgVal("");
        onSuccess?.();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              type === t.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      {/* Date + Odometer — side by side when both visible */}
      <div className={showOdometer ? "grid grid-cols-2 gap-3" : ""}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date ?? today()}
            className={INPUT}
          />
        </div>
        {showOdometer && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="odometer" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Odometer (mi)
            </label>
            <input
              id="odometer"
              name="odometer"
              type="number"
              min={0}
              placeholder="45 000"
              defaultValue={defaultValues?.odometer ?? ""}
              className={INPUT}
            />
          </div>
        )}
      </div>

      {/* Title */}
      {showTitle && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder={type === "service" ? "Oil change" : type === "part" ? "Air filter" : "Note"}
            defaultValue={defaultValues?.type === type ? (defaultValues?.title ?? "") : ""}
            className={INPUT}
          />
        </div>
      )}

      {/* Description */}
      {showDescription && (
        <label className={LABEL}>
          Notes
          <textarea
            name="description"
            rows={2}
            placeholder="Optional details…"
            defaultValue={defaultValues?.description ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400 resize-none"
          />
        </label>
      )}

      {/* Fuel-specific fields */}
      {showFuel && (
        <>
          {/* Gallons + Trip miles side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gallons" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Gallons</label>
              <input
                id="gallons"
                name="gallons"
                type="number"
                min={0}
                step="0.001"
                placeholder="12.345"
                value={gallonsVal}
                onChange={(e) => handleGallonsChange(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="trip_miles" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trip miles</label>
              <input
                id="trip_miles"
                name="trip_miles"
                type="number"
                min={0}
                step="0.1"
                placeholder="125.4"
                value={tripMilesVal}
                onChange={(e) => handleTripMilesChange(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {/* MPG — live calculated, also editable */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mpg_display" className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              MPG
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">auto-calculated · editable</span>
            </label>
            <input
              id="mpg_display"
              name="mpg"
              type="number"
              min={0}
              step="0.1"
              placeholder="—"
              value={mpgVal}
              onChange={(e) => handleMpgChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:bg-zinc-900"
            />
          </div>

          {/* Grade */}
          <label className={LABEL}>
            Grade
            <select
              name="fuel_grade"
              defaultValue={defaultValues?.fuel_grade ?? ""}
              className={INPUT}
            >
              <option value="">— select —</option>
              <option value="Regular (87)">Regular (87)</option>
              <option value="Mid-grade (88–90)">Mid-grade (88–90)</option>
              <option value="Premium (91–94)">Premium (91–94)</option>
              <option value="Diesel">Diesel</option>
            </select>
          </label>

          {/* Full tank toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-3 transition-colors dark:border-zinc-700 dark:bg-zinc-900">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Full tank</span>
            <input
              name="is_full_tank"
              type="checkbox"
              defaultChecked={defaultValues?.is_full_tank ?? true}
              className="peer sr-only"
            />
            <span className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full bg-zinc-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-zinc-900 peer-checked:after:translate-x-4 dark:bg-zinc-700 dark:peer-checked:bg-zinc-100 dark:after:bg-zinc-400 dark:peer-checked:after:bg-zinc-900" />
          </label>
        </>
      )}

      {/* Cost */}
      {showCost && (
        <label className={LABEL}>
          Cost ($)
          <input
            name="cost"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.cost ?? ""}
            className={INPUT}
          />
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
