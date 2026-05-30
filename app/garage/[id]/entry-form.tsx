"use client";

import { useRef, useState } from "react";
import { addEntry } from "./actions";
import type { EntryType } from "@/lib/types";

const TYPES: { value: EntryType; label: string }[] = [
  { value: "service", label: "Service" },
  { value: "part", label: "Part" },
  { value: "fuel", label: "Fuel" },
  { value: "mileage", label: "Mileage" },
  { value: "note", label: "Note" },
];

const today = () => new Date().toISOString().slice(0, 10);

export function EntryForm({ vehicleId }: { vehicleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<EntryType>("service");

  const showTitle = type !== "mileage";
  const showDescription = type === "service" || type === "part" || type === "note";
  const showCost = type === "service" || type === "part" || type === "fuel";
  const showOdometer = type !== "note";
  const showFuel = type === "fuel";

  async function handleSubmit(formData: FormData) {
    await addEntry(vehicleId, formData);
    formRef.current?.reset();
    setType("service");
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
          defaultValue={today()}
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
              type === "service"
                ? "Oil change"
                : type === "part"
                  ? "Air filter"
                  : type === "fuel"
                    ? "Fill-up"
                    : "Note"
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
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              name="is_full_tank"
              type="checkbox"
              defaultChecked
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
        Add entry
      </button>
    </form>
  );
}
