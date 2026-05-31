"use client";

import { useState } from "react";
import Link from "next/link";
import type { Entry, EntryType } from "@/lib/types";
import { DeleteEntryButton } from "./delete-entry-button";

const TYPE_STYLES: Record<EntryType, { label: string; classes: string }> = {
  service: { label: "Service", classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  part:    { label: "Part",    classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  fuel:    { label: "Fuel",    classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  mileage: { label: "Mileage", classes: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  note:    { label: "Note",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
};

const FILTERS: { value: EntryType | "all"; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "service", label: "Service" },
  { value: "part",    label: "Part" },
  { value: "fuel",    label: "Fuel" },
  { value: "mileage", label: "Mileage" },
  { value: "note",    label: "Note" },
];

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EntryRow({ entry, vehicleId }: { entry: Entry; vehicleId: string }) {
  const { label, classes } = TYPE_STYLES[entry.type];

  return (
    <li className="group flex items-start gap-2 py-3">
      <div className="flex w-full min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
            {label}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatDate(entry.date)}
          </span>
          {entry.odometer != null && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {entry.odometer.toLocaleString()} mi
            </span>
          )}
        </div>

        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {entry.title}
        </span>

        {entry.description && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {entry.description}
          </span>
        )}

        <div className="flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {entry.cost != null && <span>${entry.cost.toFixed(2)}</span>}
          {entry.gallons != null && <span>{entry.gallons} gal</span>}
          {entry.fuel_grade && <span>{entry.fuel_grade}</span>}
          {entry.is_full_tank === false && (
            <span className="text-zinc-400 dark:text-zinc-600">partial fill</span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Link
          href={`/garage/${vehicleId}/edit/${entry.id}`}
          aria-label={`Edit ${entry.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>
        <DeleteEntryButton vehicleId={vehicleId} entryId={entry.id} title={entry.title} />
      </div>
    </li>
  );
}

export function TimelineSection({
  entries,
  vehicleId,
}: {
  entries: Entry[];
  vehicleId: string;
}) {
  const [active, setActive] = useState<EntryType | "all">("all");

  const visible = active === "all" ? entries : entries.filter((e) => e.type === active);

  return (
    <>
      {/* Filter bar */}
      <div className="mt-8 flex flex-wrap gap-1.5">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActive(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active === value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <h2 className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Timeline
        {active !== "all" && (
          <span className="ml-2 font-normal normal-case text-zinc-400 dark:text-zinc-600">
            — {visible.length} {visible.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </h2>

      {visible.length > 0 ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {visible.map((entry) => (
            <EntryRow key={entry.id} entry={entry} vehicleId={vehicleId} />
          ))}
        </ul>
      ) : (
        <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
          {entries.length === 0 ? "No entries yet — add the first one below." : "No entries of this type."}
        </p>
      )}
    </>
  );
}
