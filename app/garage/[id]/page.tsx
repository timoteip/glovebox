import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntrySheet } from "./entry-sheet";
import { RemindersSection } from "./reminders-section";
import { TimelineSection } from "./timeline-section";
import { computeFuelStats, flaggedIntervals, openTankState, toFuelFills } from "@/lib/fuel/economy";
import { distanceLabel, economyLabel, fromKm } from "@/lib/fuel/units";
import type { Entry, Vehicle } from "@/lib/types";

interface Stats {
  currentMileage: number | null;
  totalSpent: number;
}

// fuelMileages are the synthesized fuel odometers (in the vehicle's distance
// unit) so a trip vehicle — whose fuel rows carry no raw odometer — still
// reports a current mileage that advances with every fill.
function computeStats(entries: Entry[], fuelMileages: number[]): Stats {
  const rawReadings = entries
    .map((e) => e.odometer)
    .filter((o): o is number => o != null);
  const all = [...rawReadings, ...fuelMileages];
  const currentMileage = all.length > 0 ? Math.round(Math.max(...all)) : null;

  const totalSpent = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return { currentMileage, totalSpent };
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
  const v = vehicle as Vehicle;
  const fuelFills = toFuelFills(allEntries, v);
  const fuelMileages = fuelFills
    .map((f) => f.odometerKm)
    .filter((k): k is number => k != null)
    .map((km) => fromKm(km, v.distance_unit));
  const stats = computeStats(allEntries, fuelMileages);
  const fuel = computeFuelStats(allEntries, v);
  const fuelContext = openTankState(fuelFills);
  const econLabel = economyLabel[v.economy_unit];
  const distLabel = distanceLabel[v.distance_unit];
  const fmtEcon = (n: number | null) => (n != null ? n.toFixed(1) : "—");
  const flagged = flaggedIntervals(fuel);
  const flaggedDates = flagged.map((iv) =>
    new Date(iv.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );
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

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-32 py-6">
        {vehicle.photo_url && (
          <div className="relative mb-4 h-52 w-full overflow-hidden rounded-xl">
            <img
              src={vehicle.photo_url}
              alt={vehicleTitle}
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${vehicle.photo_focus_x ?? 50}% ${vehicle.photo_focus_y ?? 50}%`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}
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
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{distLabel}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Economy</span>
            <span className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              {fmtEcon(fuel.lifetime)}
            </span>
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{econLabel} lifetime</span>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Spent</span>
            <span className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              ${stats.totalSpent.toFixed(0)}
            </span>
            <span className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">total</span>
          </div>
        </div>

        {/* Fuel economy breakdown */}
        {fuel.lifetime != null && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Fuel economy <span className="font-normal normal-case tracking-normal">({econLabel})</span>
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Current", value: fuel.current },
                { label: "Best", value: fuel.best },
                { label: "Worst", value: fuel.worst },
                { label: "Last 10", value: fuel.last10 },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="flex min-h-[68px] flex-col rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{cell.label}</span>
                  <span className="mt-1 text-lg font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                    {fmtEcon(cell.value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Outlier warning — fill-ups the engine flagged and left out of the figures */}
        {flagged.length > 0 && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/40">
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-500">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {flagged.length === 1
                ? `The fill-up on ${flaggedDates[0]} looks off and isn’t counted in the figures above.`
                : `${flagged.length} fill-ups (${flaggedDates.join(", ")}) look off and aren’t counted in the figures above.`}{" "}
              Check the odometer and volume on {flagged.length === 1 ? "that entry" : "those entries"}.
            </p>
          </div>
        )}

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

      <EntrySheet
        vehicleId={id}
        units={{ distance: v.distance_unit, volume: v.volume_unit, economy: v.economy_unit }}
        fuelContext={fuelContext}
      />
    </main>
  );
}
