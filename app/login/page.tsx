import Link from "next/link";
import { signIn, signUp } from "./actions";
import { GoogleButton } from "./google-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-50">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-zinc-900" aria-hidden="true">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="16" r="1" />
              <circle cx="20" cy="16" r="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Glovebox
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your car&apos;s whole history, in one place. Sign in to continue or create an account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {message}
          </div>
        )}

        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <button
            formAction={signIn}
            className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </button>
          <button
            formAction={signUp}
            className="h-11 rounded-lg border border-zinc-200 px-4 font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Create account
          </button>
        </form>

        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-700 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Forgot password?
          </Link>
        </div>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600">or</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <GoogleButton />
      </div>
    </main>
  );
}
