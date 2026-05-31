"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setDefaultVehicle(vehicleId: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, default_vehicle_id: vehicleId },
      { onConflict: "user_id" },
    );

  if (error) throw new Error(error.message);

  revalidatePath("/garage");
}
