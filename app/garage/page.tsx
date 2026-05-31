import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddVehicleForm } from "./add-vehicle-form";
import { VehicleCard } from "./vehicle-card";

export default async function GaragePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: vehicles, error }, { data: prefs }] = await Promise.all([
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_preferences").select("default_vehicle_id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (error) throw new Error(error.message);

  const defaultVehicleId = prefs?.default_vehicle_id ?? null;
  const showDefault = (vehicles?.length ?? 0) > 1;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Glovebox
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Your garage
        </h1>

        {vehicles && vehicles.length > 0 ? (
          <ul className="mb-8 flex flex-col gap-3">
            {vehicles.map((v) => (
              <li key={v.id}>
                <VehicleCard
                vehicle={v}
                isDefault={v.id === defaultVehicleId}
                showDefault={showDefault}
              />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            No vehicles yet — add your first one below.
          </p>
        )}

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Add a vehicle
          </h2>
          <AddVehicleForm />
        </div>
      </div>
    </main>
  );
}
