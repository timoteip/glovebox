# GloveBox

A small web app for keeping track of your cars: log fuel fills, see real
fuel economy over time, and get reminded about maintenance. It's the kind of
thing a paper logbook in the glovebox used to do.

## Features

- A garage of vehicles, each with its own photo, details and default view.
- Fuel logging with per-fill odometer **or** trip distance — mix them freely.
- Fuel economy the Fuelly way: full-to-full intervals, partial fills rolled
  forward, missed fills breaking the chain instead of reporting bad numbers.
  Lifetime / best / worst / current figures, plus a trend chart.
- US and metric units throughout (US mpg, UK mpg, L/100 km, km/L).
- Maintenance reminders you can edit inline.
- Email/password and Google sign-in.

## Stack

- [Next.js](https://nextjs.org) (App Router, Server Components, Server Actions)
- [Supabase](https://supabase.com) — Postgres, Auth, Storage, row-level security
- Tailwind CSS, Recharts, Vitest

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run `schema.sql` against it (SQL editor or
   `psql`). This sets up the tables, storage bucket and RLS policies.

3. Copy the env template and fill in your project values (Project Settings →
   API in the Supabase dashboard):

   ```bash
   cp .env.example .env.local
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

The fuel-economy engine (`lib/fuel/`) is the part with real logic worth
testing; the reasoning behind how it works lives in `docs/decisions.md`.
