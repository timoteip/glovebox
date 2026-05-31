"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords do not match.")}`,
    );
  }

  if (password.length < 6) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Password must be at least 6 characters.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/reset-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/garage");
}
