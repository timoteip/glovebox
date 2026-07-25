"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EntryType } from "@/lib/types";

export async function updateEntry(
  vehicleId: string,
  entryId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const type = String(formData.get("type") ?? "service") as EntryType;
  const date = String(formData.get("date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const odometer = formData.get("odometer") ? Number(formData.get("odometer")) : null;
  const cost = formData.get("cost") ? Number(formData.get("cost")) : null;
  const gallons = formData.get("gallons") ? Number(formData.get("gallons")) : null;
  const trip_miles = type === "fuel" && formData.get("trip_miles") ? Number(formData.get("trip_miles")) : null;
  const is_full_tank = type === "fuel" ? formData.get("is_full_tank") === "on" : null;
  const missed_fill = type === "fuel" ? formData.get("missed_fill") === "on" : false;
  const fuel_grade = type === "fuel" ? (String(formData.get("fuel_grade") ?? "").trim() || null) : null;

  const autoTitle = type === "mileage" ? "Mileage reading" : type === "fuel" ? "Fill-up" : title;
  if (!date || (!autoTitle && !title)) return;

  // mpg is intentionally left untouched — it holds legacy import readings only.
  const { error } = await supabase
    .from("entries")
    .update({
      type,
      date,
      title: autoTitle,
      description,
      odometer,
      cost,
      gallons,
      trip_miles,
      is_full_tank,
      missed_fill,
      fuel_grade,
    })
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
  redirect(`/garage/${vehicleId}`);
}
