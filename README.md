# Classico Mboa

Classico Mboa is the permanent event platform. Editions and their activities are represented as data; Edition 8 is the current public edition.

## Local Development

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

The Next.js development server is available at `http://localhost:3000`.

```bash
npm run build
npm run start
```

For a fresh checkout, copy `.env.example` to `.env.local` and follow [the setup guide](docs/supabase-setup.md). This workspace is already linked to the Classico Mboa Supabase project (`omzfphciqhiqavpsxlxg`), with ignored local credentials and two applied migrations. Its development URL is `http://localhost:3002`; update `NEXT_PUBLIC_SITE_URL` when the production domain is confirmed.

## Project Structure

- `app/`: Next.js App Router, metadata, public routes, and route states.
- `data/`: Edition, homepage, team, and public-page data.
- `src/App.tsx`: Server-rendered homepage with focused interactive components.
- `src/styles.css`: Design tokens, public-page styles, and responsive layouts.
- `types/domain.ts`: Shared edition-scoped domain interfaces.

## Edition 8 Facts

- Date: 19 December 2026
- Venue: Omnisports Bépanda
- City: Douala, Cameroon
- Timezone: Africa/Douala
- Locale: fr-CM
- Currency: XAF

Programme times, ticket tiers/prices, voting campaigns, tombola prizes, tournament rules, artists, and sponsors remain unconfirmed and are not presented as live offers.

## Roadmap Status

Phase 1 is in progress: the project now uses Next.js App Router, strict TypeScript, Tailwind CSS, edition-scoped types/data, public route placeholders, metadata, SEO endpoints, and loading/error/not-found states. Shared layout/page components, countdown, filters, font optimization and offline messaging are now implemented. The full component inventory, image fallback pass and broader acceptance checks remain in progress.

Phase 2 is in progress: the homepage and branded public route shells are available. Dedicated public information modules, programme/player filters, sharing and reusable edition routing are implemented. Persisted inquiry forms are verified against hosted Supabase. Actual community links, official content/media and the full accessibility/performance review remain outstanding.

Phases 9–10 have started: organizer-only login, edition-scoped staff permissions and an inquiry inbox are implemented and hosted flows verified, with PostgreSQL RLS and audit records. Public signup is disabled, `/account` is removed, and the owner's Edition 8 admin account is provisioned. The owner's first email-code login and real email delivery still need verification. Phases 3–8 and 11–15 remain unimplemented; ticketing, payments, voting, tombola and tournament registration are not operational.

Live Supabase credentials are configured locally and are excluded from Git. No public website domain or payment provider is configured. Ticket/payment services and launch hardening remain future work.

## Implementation tracking

See [the 15-phase tracker](docs/implementation-progress.md) for stack decisions, implementation status, known limitations and the next delivery sequence.

Validation: run `npm run typecheck`, `npm run build`, and, with the production app running on port 3100, `npm run verify:routes`.
