"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addVehicle(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const vin = String(formData.get("vin") ?? "").trim() || null;

  if (!make || !model) return;

  const { error } = await supabase.from("vehicles").insert({
    user_id: user.id,
    year,
    make,
    model,
    nickname,
    vin,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/garage");
}

export async function deleteVehicle(vehicleId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId);

  if (error) throw new Error(error.message);

  revalidatePath("/garage");
}
