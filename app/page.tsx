import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check for an explicit default vehicle first.
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("default_vehicle_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (prefs?.default_vehicle_id) {
    redirect(`/garage/${prefs.default_vehicle_id}`);
  }

  // No default set — if there's exactly one vehicle go straight to it.
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .limit(2);

  if (vehicles?.length === 1) {
    redirect(`/garage/${vehicles[0].id}`);
  }

  redirect("/garage");
}
