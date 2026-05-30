"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EntryType } from "@/lib/types";

export async function addEntry(vehicleId: string, formData: FormData) {
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
  const is_full_tank = type === "fuel" ? formData.get("is_full_tank") === "on" : null;

  const autoTitle = type === "mileage" ? "Mileage reading" : type === "fuel" ? "Fill-up" : title;
  if (!date || (!autoTitle && !title)) return;

  const { error } = await supabase.from("entries").insert({
    vehicle_id: vehicleId,
    type,
    date,
    title: autoTitle,
    description,
    odometer,
    cost,
    gallons,
    is_full_tank,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
}

export async function deleteEntry(vehicleId: string, entryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
}
