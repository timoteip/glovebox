import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, toFuelFills } from "@/lib/fuel/economy";
import { type EconomyUnit, economyLabel } from "@/lib/fuel/units";
import type { Entry, Vehicle } from "@/lib/types";
import { MpgChart, MonthlyCostChart, CostByTypeChart } from "./charts-view";
import type { MpgPoint, CostPoint, CostByType } from "./charts-view";

type VehicleUnits = Pick<Vehicle, "distance_unit" | "volume_unit" | "economy_unit">;

// The economy trend is the sequence of full-to-full intervals from the engine.
// Imported readings (stored mpg, no odometer) are appended as a separate series
// so history stays visible without polluting the derived figures.
function buildEconomyData(entries: Entry[], units: VehicleUnits): MpgPoint[] {
  const fmtLabel = (date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const unit = units.economy_unit;

  const derived: (MpgPoint & { date: string })[] = computeStats(toFuelFills(entries, units), unit)
    .intervals.filter((iv) => iv.valid && iv.economy != null)
    .map((iv) => ({ label: fmtLabel(iv.date), mpg: iv.economy!, date: iv.date }));

  // Legacy mpg readings only make sense on an mpg axis; skip them for metric units.
  const showLegacy = unit === "mpg_us" || unit === "mpg_uk";
  const legacy: (MpgPoint & { date: string })[] = showLegacy
    ? entries
        .filter((e) => e.type === "fuel" && e.mpg != null && e.mpg > 0 && e.odometer == null)
        .map((e) => ({ label: fmtLabel(e.date), mpg: e.mpg!, date: e.date, legacy: true }))
    : [];

  return [...derived, ...legacy].sort((a, b) => a.date.localeCompare(b.date));
}

function buildMonthlyCostData(entries: Entry[]): CostPoint[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.cost == null) continue;
    const [year, month] = e.date.split("-");
    const key = `${year}-${month}`;
    map.set(key, (map.get(key) ?? 0) + e.cost);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, cost]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      return { label, cost };
    });
}

const TYPE_LABELS: Record<string, string> = {
  service: "Service",
  part: "Part",
  fuel: "Fuel",
  mileage: "Mileage",
  note: "Note",
};

function buildCostByTypeData(entries: Entry[]): CostByType[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.cost == null || e.cost === 0) continue;
    map.set(e.type, (map.get(e.type) ?? 0) + e.cost);
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([type, cost]) => ({ type: TYPE_LABELS[type] ?? type, cost }));
}

export default async function ChartsPage({
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
    .select("year, make, model, nickname, distance_unit, volume_unit, economy_unit")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("date", { ascending: true });

  const allEntries = (entries ?? []) as Entry[];
  const vehicleTitle =
    vehicle.nickname ??
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  const econUnit = vehicle.economy_unit as EconomyUnit;
  const economyData = buildEconomyData(allEntries, vehicle);
  const economyLabelText = economyLabel[econUnit];
  const monthlyCostData = buildMonthlyCostData(allEntries);
  const costByTypeData = buildCostByTypeData(allEntries);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href={`/garage/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← {vehicleTitle}
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Charts
        </span>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Economy trend <span className="font-normal normal-case tracking-normal text-zinc-400">({economyLabelText})</span>
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <MpgChart data={economyData} unit={economyLabelText} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Monthly cost
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <MonthlyCostChart data={monthlyCostData} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Cost by type
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <CostByTypeChart data={costByTypeData} />
          </div>
        </section>
      </div>
    </main>
  );
}
