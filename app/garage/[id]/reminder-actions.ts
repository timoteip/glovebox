"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addReminder(vehicleId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const due_miles = formData.get("due_miles") ? Number(formData.get("due_miles")) : null;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  if (!name) return;

  const { error } = await supabase.from("reminders").insert({
    vehicle_id: vehicleId,
    name,
    due_miles,
    due_date,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
}

export async function updateReminder(vehicleId: string, reminderId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const due_miles = formData.get("due_miles") ? Number(formData.get("due_miles")) : null;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  if (!name) return;

  const { error } = await supabase
    .from("reminders")
    .update({ name, due_miles, due_date })
    .eq("id", reminderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
}

export async function deleteReminder(vehicleId: string, reminderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
}
