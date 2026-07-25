"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Built lazily inside the action so importing this module during the build's
// "collect page data" step doesn't require the env vars to be present.
function getAdminStorage() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
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

  const clampFocus = (raw: FormDataEntryValue | null) => {
    const n = Math.round(Number(raw));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  };
  const photo_focus_x = clampFocus(formData.get("photo_focus_x"));
  const photo_focus_y = clampFocus(formData.get("photo_focus_y"));

  if (!make || !model) return;

  // Handle photo
  let photo_url: string | null | undefined = undefined;
  const removePhoto = formData.get("remove_photo") === "true";
  const photoFile = formData.get("photo") as File | null;

  if (removePhoto) {
    const adminStorage = getAdminStorage();
    await adminStorage.storage.from("vehicle-photos").remove([vehicleId]);
    photo_url = null;
  } else if (photoFile && photoFile.size > 0) {
    const adminStorage = getAdminStorage();
    const { error: uploadError } = await adminStorage.storage
      .from("vehicle-photos")
      .upload(vehicleId, photoFile, { contentType: photoFile.type, upsert: true });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    const { data: { publicUrl } } = adminStorage.storage
      .from("vehicle-photos")
      .getPublicUrl(vehicleId);
    photo_url = publicUrl;
  }

  const updateData: Record<string, unknown> = {
    year,
    make,
    model,
    nickname,
    vin,
    photo_focus_x,
    photo_focus_y,
  };
  if (photo_url !== undefined) updateData.photo_url = photo_url;

  const { error } = await supabase
    .from("vehicles")
    .update(updateData)
    .eq("id", vehicleId);

  if (error) throw new Error(error.message);

  revalidatePath(`/garage/${vehicleId}`);
  revalidatePath("/garage");
  redirect(`/garage/${vehicleId}`);
}
