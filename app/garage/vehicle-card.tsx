"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Vehicle } from "@/lib/types";
import { deleteVehicle } from "./actions";

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
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
  );
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [pending, startTransition] = useTransition();

  const title = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  function handleDelete() {
    if (!confirm(`Remove ${title}? This will delete all its entries too.`))
      return;
    startTransition(() => deleteVehicle(vehicle.id));
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Link
        href={`/garage/${vehicle.id}`}
        className="flex min-w-0 flex-1 flex-col gap-0.5"
      >
        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </span>
        {vehicle.nickname && (
          <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {vehicle.nickname}
          </span>
        )}
        {vehicle.vin && (
          <span className="mt-0.5 font-mono text-xs text-zinc-400 dark:text-zinc-600">
            {vehicle.vin}
          </span>
        )}
      </Link>

      <div className="ml-3 flex flex-shrink-0 items-center gap-1">
        <Link
          href={`/garage/${vehicle.id}/edit-vehicle`}
          aria-label={`Edit ${title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <PencilIcon />
        </Link>

        <button
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Remove ${title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          ) : (
            <TrashIcon />
          )}
        </button>
      </div>
    </div>
  );
}
