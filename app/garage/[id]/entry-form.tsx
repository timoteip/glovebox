"use client";

import { useRef, useState } from "react";
import { addEntry } from "./actions";
import type { Entry, EntryType } from "@/lib/types";

const TYPES: { value: EntryType; label: string }[] = [
  { value: "service", label: "Service" },
  { value: "part", label: "Part" },
  { value: "fuel", label: "Fuel" },
  { value: "mileage", label: "Mileage" },
  { value: "note", label: "Note" },
];

const today = () => new Date().toISOString().slice(0, 10);

export type EntryFormDefaults = Pick<
  Entry,
  "type" | "date" | "odometer" | "title" | "description" | "cost" | "gallons" | "is_full_tank" | "fuel_grade"
>;

interface Props {
  vehicleId: string;
  // When provided, form is in "add" mode using these as initial values.
  // Edit mode uses a separate action passed via onSubmit.
  defaultValues?: EntryFormDefaults;
  onSubmit?: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}

export function EntryForm({
  vehicleId,
  defaultValues,
  onSubmit,
  submitLabel = "Add entry",
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<EntryType>(defaultValues?.type ?? "service");

  const showTitle = type !== "mileage" && type !== "fuel";
  const showDescription = type === "service" || type === "part" || type === "note";
  const showCost = type === "service" || type === "part" || type === "fuel";
  const showOdometer = type !== "note";
  const showFuel = type === "fuel";

  async function handleSubmit(formData: FormData) {
    if (onSubmit) {
      await onSubmit(formData);
    } else {
      await addEntry(vehicleId, formData);
      formRef.current?.reset();
      setType("service");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              type === t.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      {/* Date */}
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Date <span className="text-red-500">*</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date ?? today()}
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        />
      </label>

      {/* Odometer */}
      {showOdometer && (
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Odometer (mi)
          <input
            name="odometer"
            type="number"
            min={0}
            placeholder="45000"
            defaultValue={defaultValues?.odometer ?? ""}
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
      )}

      {/* Title */}
      {showTitle && (
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title <span className="text-red-500">*</span>
          <input
            name="title"
            type="text"
            required={showTitle}
            placeholder={
              type === "service" ? "Oil change" : type === "part" ? "Air filter" : "Note"
            }
            defaultValue={
              defaultValues?.type === type ? (defaultValues?.title ?? "") : ""
            }
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
      )}

      {/* Description */}
      {showDescription && (
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
          <textarea
            name="description"
            rows={2}
            placeholder="Optional details…"
            defaultValue={defaultValues?.description ?? ""}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
      )}

      {/* Cost */}
      {showCost && (
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cost ($)
          <input
            name="cost"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.cost ?? ""}
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
      )}

      {/* Fuel-only fields */}
      {showFuel && (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Gallons
            <input
              name="gallons"
              type="number"
              min={0}
              step="0.001"
              placeholder="12.345"
              defaultValue={defaultValues?.gallons ?? ""}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Grade
            <select
              name="fuel_grade"
              defaultValue={defaultValues?.fuel_grade ?? ""}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            >
              <option value="">— select —</option>
              <option value="Regular (87)">Regular (87)</option>
              <option value="Mid-grade (88–90)">Mid-grade (88–90)</option>
              <option value="Premium (91–94)">Premium (91–94)</option>
              <option value="Diesel">Diesel</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              name="is_full_tank"
              type="checkbox"
              defaultChecked={defaultValues?.is_full_tank ?? true}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Full tank
          </label>
        </>
      )}

      <button
        type="submit"
        className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitLabel}
      </button>
    </form>
  );
}
