import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddVehicleSheet } from "./add-vehicle-sheet";
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

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-6">
        <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Your garage
        </h1>

        {vehicles && vehicles.length > 0 ? (
          <ul className="flex flex-col gap-3">
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
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400" aria-hidden="true">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                <rect x="9" y="11" width="14" height="10" rx="2" />
                <circle cx="12" cy="16" r="1" />
                <circle cx="20" cy="16" r="1" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">No vehicles yet</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Tap the button below to add your first one.</p>
            </div>
          </div>
        )}
      </div>

      <AddVehicleSheet />
    </main>
  );
}
