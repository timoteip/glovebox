"use client";

import { useRef, useTransition } from "react";
import type { Reminder } from "@/lib/types";
import { addReminder, deleteReminder } from "./reminder-actions";

type Urgency = "overdue" | "soon" | "ok";

function getUrgency(reminder: Reminder, currentMileage: number | null, today: string): Urgency {
  let isOverdue = false;
  let isSoon = false;

  if (reminder.due_date) {
    if (reminder.due_date <= today) isOverdue = true;
    else {
      const daysUntil = Math.floor(
        (new Date(reminder.due_date).getTime() - new Date(today).getTime()) / 86_400_000,
      );
      if (daysUntil <= 30) isSoon = true;
    }
  }

  if (reminder.due_miles != null && currentMileage != null) {
    if (currentMileage >= reminder.due_miles) isOverdue = true;
    else if (currentMileage >= reminder.due_miles - 500) isSoon = true;
  }

  if (isOverdue) return "overdue";
  if (isSoon) return "soon";
  return "ok";
}

const URGENCY_BADGE: Record<Urgency, string> = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  soon:    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  ok:      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Overdue",
  soon:    "Due soon",
  ok:      "Upcoming",
};

function ReminderRow({
  reminder,
  vehicleId,
  currentMileage,
  today,
}: {
  reminder: Reminder;
  vehicleId: string;
  currentMileage: number | null;
  today: string;
}) {
  const [pending, startTransition] = useTransition();
  const urgency = getUrgency(reminder, currentMileage, today);

  const dueParts: string[] = [];
  if (reminder.due_miles != null)
    dueParts.push(`${reminder.due_miles.toLocaleString()} mi`);
  if (reminder.due_date)
    dueParts.push(
      new Date(reminder.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );

  return (
    <li className="flex items-center gap-2 py-2">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[urgency]}`}>
        {URGENCY_LABEL[urgency]}
      </span>
      <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {reminder.name}
      </span>
      {dueParts.length > 0 && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {dueParts.join(" · ")}
        </span>
      )}
      <button
        onClick={() => startTransition(() => deleteReminder(vehicleId, reminder.id))}
        disabled={pending}
        aria-label={`Remove reminder ${reminder.name}`}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        {pending ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        )}
      </button>
    </li>
  );
}

export function RemindersSection({
  vehicleId,
  reminders,
  currentMileage,
  today,
}: {
  vehicleId: string;
  reminders: Reminder[];
  currentMileage: number | null;
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addReminder(vehicleId, formData);
      formRef.current?.reset();
    });
  }

  const sorted = [...reminders].sort((a, b) => {
    const order: Record<Urgency, number> = { overdue: 0, soon: 1, ok: 2 };
    return order[getUrgency(a, currentMileage, today)] - order[getUrgency(b, currentMileage, today)];
  });

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Reminders
      </h2>

      {sorted.length > 0 ? (
        <ul className="mb-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {sorted.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              vehicleId={vehicleId}
              currentMileage={currentMileage}
              today={today}
            />
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          No reminders yet.
        </p>
      )}

      <form ref={formRef} action={handleAdd} className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Oil change"
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        />
        <div className="flex gap-2">
          <input
            name="due_miles"
            type="number"
            min={0}
            placeholder="Due at miles"
            className="h-9 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
          <input
            name="due_date"
            type="date"
            className="h-9 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add reminder"}
        </button>
      </form>
    </div>
  );
}
