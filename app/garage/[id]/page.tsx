import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntrySheet } from "./entry-sheet";
import { RemindersSection } from "./reminders-section";
import { TimelineSection } from "./timeline-section";
import type { Entry } from "@/lib/types";

interface Stats {
  currentMileage: number | null;
  avgMpg: number | null;
  totalSpent: number;
}

function computeStats(entries: Entry[]): Stats {
  const odometerReadings = entries
    .map((e) => e.odometer)
    .filter((o): o is number => o != null);
  const currentMileage =
    odometerReadings.length > 0 ? Math.max(...odometerReadings) : null;

  // Per-entry MPG: stored mpg > calculated from trip_miles/gallons > odometer fallback
  const entryMpgs = entries
    .filter((e) => e.type === "fuel")
    .map((e): number | null => {
      if (e.mpg != null && e.mpg > 0) return e.mpg;
      if (e.trip_miles != null && e.trip_miles > 0 && e.gallons != null && e.gallons > 0) return e.trip_miles / e.gallons;
      return null;
    })
    .filter((v): v is number => v !== null);

  // Odometer-based fallback (for entries with neither mpg nor trip_miles)
  const odometerMpgs: number[] = [];
  if (entryMpgs.length === 0) {
    const fullTankFuels = entries
      .filter((e) => e.type === "fuel" && e.mpg == null && e.trip_miles == null && e.is_full_tank === true && e.odometer != null && e.gallons != null)
      .sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));
    for (let i = 1; i < fullTankFuels.length; i++) {
      const miles = (fullTankFuels[i].odometer ?? 0) - (fullTankFuels[i - 1].odometer ?? 0);
      const gallons = fullTankFuels[i].gallons ?? 0;
      if (gallons > 0 && miles > 0) odometerMpgs.push(miles / gallons);
    }
  }

  const allMpgs = entryMpgs.length > 0 ? entryMpgs : odometerMpgs;
  const avgMpg = allMpgs.length > 0
    ? allMpgs.reduce((a, b) => a + b, 0) / allMpgs.length
    : null;

  const totalSpent = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return { currentMileage, avgMpg, totalSpent };
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

  const [{ data: entries }, { data: reminders }] = await Promise.all([
    supabase
      .from("entries")
      .select("*")
      .eq("vehicle_id", id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select("*")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const allEntries = (entries ?? []) as Entry[];
  const allReminders = reminders ?? [];
  const stats = computeStats(allEntries);
  const today = new Date().toISOString().slice(0, 10);

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
        <Link
          href={`/garage/${id}/edit-vehicle`}
          aria-label="Edit vehicle"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>

        <Link
          href={`/garage/${id}/charts`}
          className="ml-auto mr-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Charts
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>

      {vehicle.photo_url && (
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={vehicle.photo_url}
            alt={vehicleTitle}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-32 py-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {vehicleTitle}
        </h1>
        {vehicle.nickname && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {vehicle.nickname}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Mileage</span>
            <span className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              {stats.currentMileage != null ? stats.currentMileage.toLocaleString() : "—"}
            </span>
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">miles</span>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Avg MPG</span>
            <span className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              {stats.avgMpg != null ? stats.avgMpg.toFixed(1) : "—"}
            </span>
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">mpg</span>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Spent</span>
            <span className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              ${stats.totalSpent.toFixed(0)}
            </span>
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">total</span>
          </div>
        </div>

        {/* Reminders */}
        <RemindersSection
          vehicleId={id}
          reminders={allReminders}
          currentMileage={stats.currentMileage}
          today={today}
        />

        {/* Timeline with filter */}
        <TimelineSection entries={allEntries} vehicleId={id} />

      </div>

      <EntrySheet vehicleId={id} />
    </main>
  );
}
