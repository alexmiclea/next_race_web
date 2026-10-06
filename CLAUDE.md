# CLAUDE.md

@AGENTS.md

Guidance for Claude when working in this repository. Keep this file short and current — update it whenever a decision is made.

## Project

**Next Race** — a website listing local endurance races in Romania: running, swimming, cycling, triathlon, and possibly other sports later.

The goal is to help athletes find upcoming races near them: what, where, when, distance, and how to sign up.

### Status

Early stage. Next.js app scaffolded with a basic home page listing upcoming approved events from Supabase. Initial database schema in `supabase/migrations/`. Race scraper in `scraper/`.

### Layout

- `src/app/` — Next.js 16 App Router pages (`params` / `searchParams` / `cookies()` are async)
- `src/lib/supabase/server.ts` — Supabase client for server code (publishable key; RLS controls access)
- `src/i18n/request.ts` + `messages/ro.json` — next-intl, Romanian only, no locale prefix in URLs yet
- `supabase/migrations/` — SQL migrations, applied in order (for now: pasted into the Supabase SQL editor)
- `scraper/` — standalone scraper package (excluded from the website's TypeScript and ESLint)

### Data model

- `events` — one event (name, dates, city, county, links, review `status`, `source` / `source_url` / `external_key`). Public readers only see `approved` events (RLS).
- `races` — one per distance/category of an event (`label`, `distance_km`, `sport_slug`).
- `sports`, `counties` — reference data. Sport names live in the `sports` table, not in translation files.

## Decisions

Record decisions here so they aren't re-discussed in later sessions.

- Scope: Romania only, for now.
- Sports: running, swimming, cycling, triathlon (more may be added — keep the sport list data-driven, not hard-coded across pages).
- Tech stack: Next.js + Supabase (Postgres database, auth, admin table view). Chosen because the site will need dynamic data beyond a static list. Rich filtering is a key feature.
- Race data is stored in Supabase.
- Hosting: Vercel (free Hobby tier to start; it is non-commercial only, so move to Pro or another host if the site starts making money). Keep the app portable so it can move to a self-hosted server later.
- Language: Romanian at launch, i18n-ready for English later. All UI text goes in translation files — never hard-code user-facing strings in components. Race content (names, descriptions from organizers) stays in its original language.

- Race data sourcing (business plan: become the platform organizers submit to; until then, fill the database by scraping):
  - Scraped races and, later, organizer submissions go into one review queue (`pending` / `approved` / `rejected`). Only approved races are public. The owner manually reviews every entry.
  - Scrape facts only (name, date, location, distances, registration link). Don't copy descriptions or photos verbatim. Respect `robots.txt` and terms of use. Prefer organizers' own sites over other race-listing sites (EU database right; future competitors).
  - Always store and show the source URL for each race.
  - Detect duplicates (similar name + same date + city) across sources and runs; update or flag instead of creating duplicates.
  - The scraper runs on a schedule via GitHub Actions (not Vercel Cron), one source at a time.
  - Build order: listing + filters with hand-entered seed data → review queue + admin screen → scraper → organizer accounts and submissions.

- No mobile app for now. The website must be fully responsive (mobile-first) instead.
- Supabase project: `ckzhgqaalsgwiomlbbdf` (EU). Env vars in `.env.local` (see `.env.example`). The secret key is server-only and must never be committed or pasted into chat.
- The scraper is generic and reusable: websites are config entries in `scraper/src/sources.ts` (URL, sport, parser); parsers in `scraper/src/parsers/` handle page layouts, not specific sites. Don't write site-specific scraper code.
- Scrape sources (add each new one here once checked):
  - https://vladcarbune.ro/calendar-evenimente-alergare-{year}/ (running)

## Open questions

Resolve these before building much; move each to **Decisions** once settled.

- More scrape sources, especially for swimming, cycling and triathlon

## Domain notes

- A race has at least: name, sport, date, location (city/county), distances, organizer, registration link.
- One event can include several distances or categories (e.g. 5K / 10K / half marathon, sprint / olympic triathlon).
- Dates and times are in Romanian time (Europe/Bucharest).

## Conventions

- Keep the site fast, mobile-first, and accessible.
- Make small, focused changes; one feature per branch / pull request.
- Don't commit secrets or API keys.
- No Vercel-specific services (Vercel Postgres/KV/Blob, Edge Config, Vercel Analytics, Vercel Cron, etc.) — keep the app portable. Use Supabase or portable alternatives instead.

## Commands

Website (repo root; needs `.env.local`):

- `npm install` — install dependencies
- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — generate route types, then TypeScript check

Scraper (`scraper/`, standalone Node ≥ 23.6 package, TypeScript run directly by Node — no build step):

- `npm install` — install dependencies
- `npm run scrape` — scrape all sources into `scraper/output/<hostname>.json` and `.csv` (git-ignored), and into Supabase as `pending` events when `scraper/.env` has `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (see `scraper/.env.example`). Re-runs refresh events that are still pending; approved/rejected events are never changed.
- `npm test` — parser tests
- `npm run typecheck` — TypeScript check

To add a website, add an entry to `scraper/src/sources.ts`; add a parser only if its layout is new. Review happens in the Supabase table editor: set `events.status` to `approved` or `rejected`; parser warnings are in `review_note`. Events whose distances weren't found get one race labelled `?`.
