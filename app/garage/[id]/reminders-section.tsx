"use client";

import { useRef, useState, useTransition } from "react";
import type { Reminder } from "@/lib/types";
import { addReminder, updateReminder, deleteReminder } from "./reminder-actions";

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

const INPUT_SM = "h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400";

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
  const [editing, setEditing] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
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

  function handleSave(formData: FormData) {
    startSaveTransition(async () => {
      await updateReminder(vehicleId, reminder.id, formData);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-2">
          <input
            name="name"
            type="text"
            required
            autoFocus
            defaultValue={reminder.name}
            className={`w-full ${INPUT_SM}`}
          />
          <div className="flex gap-2">
            <input
              name="due_miles"
              type="number"
              min={0}
              placeholder="Due at miles"
              defaultValue={reminder.due_miles ?? ""}
              className={`flex-1 ${INPUT_SM}`}
            />
            <input
              name="due_date"
              type="date"
              defaultValue={reminder.due_date ?? ""}
              className={`flex-1 ${INPUT_SM}`}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-8 flex-1 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savePending}
              className="h-8 flex-1 rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {savePending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

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
        onClick={() => setEditing(true)}
        aria-label={`Edit reminder ${reminder.name}`}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={() => startDeleteTransition(() => deleteReminder(vehicleId, reminder.id))}
        disabled={deletePending}
        aria-label={`Remove reminder ${reminder.name}`}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        {deletePending ? (
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
  const [showForm, setShowForm] = useState(false);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addReminder(vehicleId, formData);
      formRef.current?.reset();
      setShowForm(false);
    });
  }

  const sorted = [...reminders].sort((a, b) => {
    const order: Record<Urgency, number> = { overdue: 0, soon: 1, ok: 2 };
    return order[getUrgency(a, currentMileage, today)] - order[getUrgency(b, currentMileage, today)];
  });

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Reminders
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        )}
      </div>

      {sorted.length > 0 ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
        !showForm && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No reminders yet.</p>
        )
      )}

      {showForm && (
        <form ref={formRef} action={handleAdd} className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <input
            name="name"
            type="text"
            required
            autoFocus
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 flex-1 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-9 flex-1 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {pending ? "Adding…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
