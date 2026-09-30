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

For a fresh checkout, copy `.env.example` to `.env.local` and follow [the setup guide](docs/supabase-setup.md). This workspace is already linked to the Classico Mboa Supabase project (`omzfphciqhiqavpsxlxg`), with ignored local credentials and five applied migrations. Its development URL is `http://localhost:3002`; update `NEXT_PUBLIC_SITE_URL` when the production domain is confirmed.

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

Confirmed ticket prices: Classique 1,000 XAF and VIP 2,000 XAF, sharing an edition-wide capacity of 500. Programme times, voting campaigns, tombola prizes, tournament rules, artists and sponsors still require confirmation.

## Roadmap Status

The public website is deployed on Shirley's Vercel Pro team. Supabase project `omzfphciqhiqavpsxlxg` has five applied migrations. Organizer-only login, password management, inquiry workflows and role-protected ticketing tools are implemented.

Phase 3 now has a verified guest test flow: stock reservation, private order recovery, signed test payment confirmation, QR issuance, printable tickets, category management, ticket cancellation and single-use check-in. Phase 11 has initial payment ledger/signature/idempotency foundations. Manual Mobile Money checkout now reserves a place for two hours and opens WhatsApp with Manuel or Youana. Only an authorized organizer can confirm the actual received amount and a unique receipt before tickets are issued. No payment API or automatic payment confirmation is configured.

No full transactional phase is declared production-ready. Physical camera verification, email ticket delivery, refunds, reconciliation, broader security/load tests and the other operational modules remain outstanding. Public signup stays disabled.

## Implementation tracking

See [the 15-phase tracker](docs/implementation-progress.md) for stack decisions, implementation status, known limitations and the next delivery sequence.

Validation: run `npm run typecheck`, `npm run build`, and, with the production app running on port 3100, `npm run verify:routes`.
