import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this, but check here too (defense in depth).
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Glovebox
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your garage
        </h1>
        <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as {user.email}. Vehicles and timelines arrive in the next
          slice.
        </p>
      </div>
    </main>
  );
}
