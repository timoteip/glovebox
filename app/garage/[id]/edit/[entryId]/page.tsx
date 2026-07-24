import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "../../entry-form";
import { updateEntry } from "./actions";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id, entryId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", entryId)
    .single();

  // RLS returns null if this entry's vehicle doesn't belong to the user.
  if (!entry) notFound();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("year, make, model, nickname")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  const vehicleTitle =
    vehicle.nickname ??
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateEntry(id, entryId, formData);
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
          Edit entry
        </span>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <EntryForm
          vehicleId={id}
          defaultValues={{
            type: entry.type,
            date: entry.date,
            odometer: entry.odometer,
            title: entry.title,
            description: entry.description,
            cost: entry.cost,
            gallons: entry.gallons,
            trip_miles: entry.trip_miles,
            mpg: entry.mpg,
            is_full_tank: entry.is_full_tank,
            fuel_grade: entry.fuel_grade,
          }}
          onSubmit={handleUpdate}
          submitLabel="Save changes"
        />

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
