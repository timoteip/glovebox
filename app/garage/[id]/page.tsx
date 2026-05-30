import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "./entry-form";
import { DeleteEntryButton } from "./delete-entry-button";
import type { Entry, EntryType } from "@/lib/types";

const TYPE_STYLES: Record<EntryType, { label: string; classes: string }> = {
  service: { label: "Service", classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  part:    { label: "Part",    classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  fuel:    { label: "Fuel",    classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  mileage: { label: "Mileage", classes: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  note:    { label: "Note",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Stats {
  currentMileage: number | null;
  avgMpg: number | null;
  totalSpent: number;
}

function computeStats(entries: Entry[]): Stats {
  // Current mileage: highest odometer across all entry types.
  const odometerReadings = entries
    .map((e) => e.odometer)
    .filter((o): o is number => o != null);
  const currentMileage = odometerReadings.length > 0
    ? Math.max(...odometerReadings)
    : null;

  // Avg MPG: between consecutive full-tank fuel entries ordered by odometer.
  const fullTankFuels = entries
    .filter((e) => e.type === "fuel" && e.is_full_tank === true && e.odometer != null && e.gallons != null)
    .sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));

  let avgMpg: number | null = null;
  if (fullTankFuels.length >= 2) {
    const segments: number[] = [];
    for (let i = 1; i < fullTankFuels.length; i++) {
      const miles = (fullTankFuels[i].odometer ?? 0) - (fullTankFuels[i - 1].odometer ?? 0);
      const gallons = fullTankFuels[i].gallons ?? 0;
      if (gallons > 0 && miles > 0) {
        segments.push(miles / gallons);
      }
    }
    if (segments.length > 0) {
      avgMpg = segments.reduce((a, b) => a + b, 0) / segments.length;
    }
  }

  // Total spent: sum of all costs.
  const totalSpent = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return { currentMileage, avgMpg, totalSpent };
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
          {entry.cost != null && (
            <span>${entry.cost.toFixed(2)}</span>
          )}
          {entry.gallons != null && (
            <span>{entry.gallons} gal</span>
          )}
          {entry.fuel_grade && (
            <span>{entry.fuel_grade}</span>
          )}
          {entry.is_full_tank === false && (
            <span className="text-zinc-400 dark:text-zinc-600">partial fill</span>
          )}
        </div>
      </div>

      {/* Edit + delete actions — visible on hover */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <Link
          href={`/garage/${vehicleId}/edit/${entry.id}`}
          aria-label={`Edit ${entry.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
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
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>
        <DeleteEntryButton
          vehicleId={vehicleId}
          entryId={entry.id}
          title={entry.title}
        />
      </div>
    </li>
  );
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const allEntries = entries ?? [];
  const stats = computeStats(allEntries);

  const vehicleTitle = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/garage"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Garage
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {vehicle.nickname ?? vehicleTitle}
        </span>

        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {vehicleTitle}
        </h1>
        {vehicle.nickname && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{vehicle.nickname}</p>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stats.currentMileage != null
                ? stats.currentMileage.toLocaleString()
                : "—"}
            </span>
            <span className="mt-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Current mileage
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stats.avgMpg != null ? `${stats.avgMpg.toFixed(1)}` : "—"}
            </span>
            <span className="mt-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Avg MPG
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              ${stats.totalSpent.toFixed(0)}
            </span>
            <span className="mt-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Total spent
            </span>
          </div>
        </div>

        {/* Timeline */}
        <h2 className="mb-1 mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Timeline
        </h2>
        {allEntries.length > 0 ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {allEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} vehicleId={id} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            No entries yet — add the first one below.
          </p>
        )}

        {/* Add entry form */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Add an entry
          </h2>
          <EntryForm vehicleId={id} />
        </div>
      </div>
    </main>
  );
}
