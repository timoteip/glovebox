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

  const { data: existing } = await supabase
    .from("vehicles")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = existing ? (existing.sort_order ?? 0) + 1 : 0;

  const { error } = await supabase.from("vehicles").insert({
    user_id: user.id,
    year,
    make,
    model,
    nickname,
    vin,
    sort_order,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/garage");
}

export async function moveVehicle(vehicleId: string, direction: "up" | "down") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!vehicles || vehicles.length < 2) return;

  const idx = vehicles.findIndex((v) => v.id === vehicleId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= vehicles.length) return;

  const reordered = [...vehicles];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

  await Promise.all(
    reordered.map((v, i) =>
      supabase.from("vehicles").update({ sort_order: i }).eq("id", v.id),
    ),
  );

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
