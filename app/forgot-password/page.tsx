import Link from "next/link";
import { sendResetEmail } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {message && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {message}
          </p>
        )}

        <form action={sendResetEmail} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
            />
          </label>

          <button
            type="submit"
            className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send reset link
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
