import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateVehicle } from "./actions";

export default async function EditVehiclePage({
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

  const vehicleTitle =
    vehicle.nickname ??
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateVehicle(id, formData);
  }

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
          Edit vehicle
        </span>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <form action={handleUpdate} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Year
              <input
                name="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                defaultValue={vehicle.year ?? ""}
                placeholder="2019"
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Make <span className="text-red-500">*</span>
              <input
                name="make"
                type="text"
                required
                defaultValue={vehicle.make}
                placeholder="Toyota"
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Model <span className="text-red-500">*</span>
            <input
              name="model"
              type="text"
              required
              defaultValue={vehicle.model}
              placeholder="Camry"
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nickname
            <input
              name="nickname"
              type="text"
              defaultValue={vehicle.nickname ?? ""}
              placeholder="The Daily"
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            VIN (optional)
            <input
              name="vin"
              type="text"
              maxLength={17}
              defaultValue={vehicle.vin ?? ""}
              placeholder="1HGBH41JXMN109186"
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <button
            type="submit"
            className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save changes
          </button>
        </form>

        <Link
          href={`/garage/${id}`}
          className="mt-4 flex h-12 items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
