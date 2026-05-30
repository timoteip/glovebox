"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Vehicle } from "@/lib/types";
import { deleteVehicle } from "./actions";

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

      <button
        onClick={handleDelete}
        disabled={pending}
        aria-label={`Remove ${title}`}
        className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        ) : (
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
        )}
      </button>
    </div>
  );
}
