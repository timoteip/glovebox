# GloveBox

A web app for keeping track of your cars. Log your fill-ups, see what gas mileage you're really getting, and get reminded when maintenance is due — the job the paper logbook in your glovebox used to do.

## What it does

- Keep a list of your vehicles, each with a photo and its own details
- Log every fill-up — enter the odometer reading or just the trip distance, whichever you have
- Works out your real fuel economy from those fill-ups, instead of the number on the window sticker
- Shows your lifetime, best, worst, and most recent figures, plus a chart of how they're trending
- Skips a calculation rather than showing a wrong number when a fill-up is missing
- Works in US mpg, UK mpg, L/100 km, or km/L
- Maintenance reminders you can edit right in the list
- Sign in with email and password, or with a Google account

## Built with

- **Next.js** – Builds the app.
- **Supabase** – Stores everything (vehicles, fill-ups, photos) and handles sign-ins. It also makes sure each person can only see their own data.
- **Tailwind CSS** – Styles the app.
- **Recharts** – Draws the charts.
- **Vitest** – Runs automatic checks on the fuel economy math.

## Getting started

**1. Install the dependencies:**

```bash
npm install
```

**2. Set up the database.** Create a free project at [supabase.com](https://supabase.com), then paste the contents of `schema.sql` into its SQL editor and run it. That creates the tables the app needs.

**3. Add your Supabase keys.** Copy the template, then fill in the values from your Supabase dashboard under Project Settings → API:

```bash
cp .env.example .env.local
```

**4. Start it up:**

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

To run the automated tests: `npm test`
