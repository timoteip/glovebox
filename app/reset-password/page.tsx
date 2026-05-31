import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // If there's no active session the recovery link was never used or expired.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=" + encodeURIComponent("Reset link is invalid or has expired."));

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            New password
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose a new password for your account.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form action={updatePassword} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            New password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm password
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <button
            type="submit"
            className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
