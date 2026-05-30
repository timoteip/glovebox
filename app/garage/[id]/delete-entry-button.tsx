"use client";

import { useTransition } from "react";
import { deleteEntry } from "./actions";

export function DeleteEntryButton({
  vehicleId,
  entryId,
  title,
}: {
  vehicleId: string;
  entryId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Remove "${title}"?`)) return;
    startTransition(() => deleteEntry(vehicleId, entryId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Remove ${title}`}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      )}
    </button>
  );
}
