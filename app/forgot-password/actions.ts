"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendResetEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always show the confirmation message — don't reveal whether the email exists.
  redirect(
    `/forgot-password?message=${encodeURIComponent("If that address is registered, you'll get a reset link shortly.")}`,
  );
}
