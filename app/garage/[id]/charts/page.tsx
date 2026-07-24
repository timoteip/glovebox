import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/lib/types";
import { MpgChart, MonthlyCostChart, CostByTypeChart } from "./charts-view";
import type { MpgPoint, CostPoint, CostByType } from "./charts-view";

function buildMpgData(entries: Entry[]): MpgPoint[] {
  const fmtLabel = (e: Entry) =>
    new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Per-entry: stored mpg > trip_miles/gallons
  const perEntry = entries
    .filter((e) => e.type === "fuel")
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((e): MpgPoint[] => {
      if (e.mpg != null && e.mpg > 0) return [{ label: fmtLabel(e), mpg: e.mpg }];
      if (e.trip_miles != null && e.trip_miles > 0 && e.gallons != null && e.gallons > 0)
        return [{ label: fmtLabel(e), mpg: e.trip_miles / e.gallons }];
      return [];
    });

  if (perEntry.length > 0) return perEntry;

  // Odometer fallback
  const fullTanks = entries
    .filter((e) => e.type === "fuel" && e.mpg == null && e.trip_miles == null && e.is_full_tank === true && e.odometer != null && e.gallons != null)
    .sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));

  const points: MpgPoint[] = [];
  for (let i = 1; i < fullTanks.length; i++) {
    const miles = (fullTanks[i].odometer ?? 0) - (fullTanks[i - 1].odometer ?? 0);
    const gallons = fullTanks[i].gallons ?? 0;
    if (gallons > 0 && miles > 0) points.push({ label: fmtLabel(fullTanks[i]), mpg: miles / gallons });
  }
  return points;
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
    .select("year, make, model, nickname")
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

  const mpgData = buildMpgData(allEntries);
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
            MPG trend
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <MpgChart data={mpgData} />
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
