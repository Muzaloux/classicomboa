# Prototype implementation tracker

Latest increment: manual Mobile Money checkout, 30 September 2026. Connected project: `omzfphciqhiqavpsxlxg` (Classico Mboa). The owner authorized live WhatsApp checkout with organizer receipt verification, confirmed 19 December 2026 and a shared 500-place capacity at 1,000/2,000 XAF. See the manual-payment release section below for current operations; the earlier test-flow notes describe the preceding increment. Phases 3 and 11 still lack automated provider integration, email delivery and full launch hardening.

## Current ticketing delivery

- Migration 003 is applied: stock, orders, immutable price snapshots, test payments/events, tickets and check-ins, with RLS and permission-checked RPCs.
- Guest checkout reserves stock for 15 minutes. Prices are calculated in PostgreSQL; duplicate requests reuse the same order. Expired reservations stop consuming stock.
- Signed, timestamp-checked test webhooks validate amount/currency. Payment confirmation and ticket issuance share one transaction; retries cannot issue extra tickets.
- Guest orders require a private HttpOnly cookie. A reference plus a 256-bit recovery key restores access on another device. No automatic email delivery exists yet.
- Order pages render printable QR tickets. Admins/managers can manage categories, review paginated orders and void unused tickets. Voiding does not refund or return capacity.
- Check-in staff can sign in and validate codes. Live mode rejects test tickets. The QR camera scanner is lazy-loaded; manual code entry works. Physical phone-camera testing remains outstanding.
- Local test mode requires `TICKETING_MODE=test` and a random `TEST_PAYMENT_WEBHOOK_SECRET` of at least 32 characters. Production remains closed; no live provider adapter exists.
- Validation: 16 local tests, production build, hosted simultaneous stock requests, signed webhook rejection/retries, guest browser purchase, cross-browser recovery, unauthorized-access denial, check-in and voiding. QR output decodes to the expected secure payload.
- The website currently configures 19 December 2026, while the roadmap/initial migration use 12 December. Confirm the official date and align database/public configuration before real sales.

Production website and organizer authentication are deployed on Shirley's Vercel Pro team. Contact links, official supplied logo and mobile bottom navigation are implemented. Custom-domain DNS verification and GitHub auto-deployment access remain separate launch checks. Historical entries below describe earlier increments and are not current deployment status.

Source: `Classico_Mboa_Phases 1-15.txt`. The source repeats phases 10–15; use the later expanded requirements in addition to the earlier outline. This tracker records implementation, not production approval.

## Stack adaptation

Keep the installed Next.js 16.3.7 App Router, React 19, strict TypeScript, Tailwind CSS 4, Lucide and existing custom CSS identity. Use server components for page content and small client components for navigation, countdown, filters, sharing and connectivity. Fonts now use next/font. Do not add shadcn or Framer Motion solely to replace functioning custom components; accessible native controls and CSS motion cover this increment.

Supabase clients, account flows, protected inquiry storage and versioned PostgreSQL migrations are implemented and connected to the existing Classico Mboa project. Two migrations are applied and hosted auth/persistence flows have passed verification. Vercel remains a deployment option; the website has not been deployed.

## Phase progress

| Phase | Status | Remaining delivery |
| --- | --- | --- |
| 1 — Foundation | In progress | Complete component inventory and broader accessibility/performance checks. Local optimized photos and image fallbacks are implemented. |
| 2 — Public website | In progress | Inquiry forms implemented and hosted submission verified. News detail/media publishing, confirmed links and full accessibility/performance review remain. |
| 3 — Ticketing | Test flow implemented | Real payment provider, email ticket delivery, operational recovery/support, physical scanner testing and launch acceptance remain. |
| 4 — Voting | Implemented, awaiting migration | Paid votes (100 XAF) via manual Mobile Money with organizer confirmation, `/vote`, `/vote/results`, `/admin/votes`; migration `202609300009_voting.sql` must be applied. Fan-award categories without candidates (supporter, look, etc.) and duplicate-fraud review remain. |
| 5 — Tombola | Implemented, awaiting migration | Paid entries (500 XAF) via manual Mobile Money, numbered entries on confirmation, server-side final draw (one win per buyer), masked public winners, `/tombola`, `/admin/tombola`; migration `202609300010_tombola.sql`. Physical on-stage draw display and prize fulfilment tracking remain. |
| 6 — FIFA Cup | Removed from scope | Removed at the organizer’s request: public pages, navigation, homepage card, programme, category and proposed price. |
| 7 — Village | Not started | Applications, review, reservation, payment, allocation and vendor directory. Public information page exists. |
| 8 — Sponsorship | Not started | Proposals, agreements, deliverables and commercial tracking. Public information page exists. |
| 9 — Organizer admin | Started | Edition-scoped inquiry inbox, filters, pagination and audited status changes verified on hosted Supabase. Permanent organizer assignment and other operational modules remain. |
| 10 — Authentication | Started | Password signup/sign-in, email code access, profiles, session refresh and edition staff authorization implemented. Hosted password/code login verified. Real email delivery, account security controls and the complete role matrix remain. |
| 11 — Shared payments | Started | Test payment ledger, signature verification and idempotency exist. Real provider, refunds, reconciliation, alerts and finance reporting remain. |
| 12 — CMS | Not started | Publishing, media rights, storage, scheduling and permissions. |
| 13 — Live operations | Not started | Authorized score/programme updates, reconnect behavior and displays. |
| 14 — Hardening | Not started | Security/RLS/payment abuse tests, E2E, load/performance, monitoring and backups. |
| 15 — Launch & operations | Not started | Admin-managed editions, archive/closeout, financial closure, deployment and handover. |

## Implemented in this increment

- Shared desktop/mobile navigation and footer across all routes; active links, Escape handling and skip link.
- Server-rendered homepage preserving the existing design; dedicated hydration-safe countdown to the event calendar day in Douala, with a nonnegative elapsed-date state.
- Reusable page hero, section, empty-state, information-card and call-to-action components.
- Data-backed programme with category filtering and player directory with team filtering.
- Dedicated public content for tickets, voting, tombola, FIFA Cup, Village, sponsors, partnerships, stands, news, gallery and contact.
- Proposed roadmap prices explicitly labeled unconfirmed; no checkout, fake success or invented participants.
- Edition registry and dynamic /edition/[slug] route; unknown/private editions return 404.
- Page metadata, Event JSON-LD with date-only startDate, share/copy fallback and user-triggered WhatsApp sharing.
- Offline notice; design tokens, touch targets and responsive typography; self-hosted Next.js fonts.
- Git ignore rules for build output, dependencies and local secrets.

## Validation

Run `npm run typecheck`, `npm run build`, then `npm run start -- --port 3100` and `npm run verify:routes`.
Browser review covers mobile programme filtering, mobile menu open/Escape, player team filtering, edition rendering, homepage desktop/mobile and runtime errors. Screenshots are local ignored artifacts under `artifacts/`.

This does not constitute a complete WCAG, security or performance audit.

## Next implementation order

1. Complete the provisioned administrator's first email-code login and verify real email delivery. Complete remaining phase 1–2 acceptance items.
2. Extend the implemented migration/auth foundation with shared payment contracts and atomic ticket inventory before phase 3 transaction mutations.
3. Implement the phase 3 test-provider purchase → issuance → check-in flow with persisted orders, atomic inventory, idempotency and authorization tests.
4. Extend the shared services through phases 4–13, then perform phase 14 hardening before phase 15 launch.

## Configuration and migration notes

The migrations in `supabase/migrations/` are applied to `omzfphciqhiqavpsxlxg`; local credentials are configured in ignored `.env.local`. `NEXT_PUBLIC_SITE_URL` currently points to the local development origin. Replace it with the confirmed HTTPS public origin when deploying. See `docs/supabase-setup.md` for connection and verification details.

Official community URL, contact details, rosters, artists, sponsors, prizes, programme times, commercial conditions and legal copy remain unconfirmed. News remains empty. Fourteen curated event archive photos now populate the local media catalog and gallery. All stock images and remote image dependencies were removed; responsive Next/Image assets include blur placeholders and a branded failure fallback.

## Event-photo update

Reviewed 32 source files under `Event Images/`; selected 14 distinct photos (excluding the duplicate IMG_6667 copy). Original photos remain untouched. Optimized WebP copies total 1,976,432 bytes versus 3,785,455 bytes for the selected JPEG originals, a 48% reduction before responsive delivery.

Photo assignments: match action for the hero, portrait action for the rivalry, both teams for the history section, audience/animation photos for relevant cards and public pages. Gaming, tombola and Village experience cards use branded graphics because the supplied set does not document those activities. No sponsor logos, prizes or player names were inferred.

The gallery supports Football, Équipes and Ambiance filters plus a native-dialog lightbox with previous/next, arrow keys and Escape. Archive photos are not assigned to an unconfirmed edition or date. `data/event-photos.ts` records original source filenames and captions; `scripts/prepare-event-images.mjs` regenerates the optimized catalog using Sharp already present in the installed dependency tree.

Checks at that time: production build, TypeScript, 19 public routes and two 404 checks; desktop hero/mobile gallery visual review; filter/lightbox keyboard checks; no browser runtime errors observed. That photo increment advanced phases 1–2 only.

## Account and inquiry foundation — 30 September 2026

- Added browser, server and privileged server-only Supabase clients and Next.js proxy session refresh. Private routes always render dynamically.
- Added `/auth/sign-in`, signup confirmation callback, password login, email-code access, signout and `/account` profile editing.
- Added contact, partnership and exhibitor inquiry forms with server validation, Cameroon phone normalization, consent, honeypot and a database-backed hourly email quota. Success only follows persisted storage; no email delivery is claimed.
- Added `/admin` inquiry inbox with edition-scoped access, status filters, pagination and audited status changes.
- Added a transactional migration with profiles, staff memberships, editions, inquiries, audit records and row-level security. Staff roles cannot be self-assigned, and suspended staff immediately lose inquiry access.
- Added eight automated validation/PostgreSQL tests, the backend connection checker, private-route checks and the manual Supabase setup guide.

Validation: TypeScript and production build pass; all eight local tests pass. Browser review covers contact forms, mobile sign-in and unauthenticated admin redirection. Hosted authentication, email delivery and the complete saved-inquiry browser flow remain unverified until Supabase is configured. Local PostgreSQL tests validate persistence and permissions independently of hosted credentials.

No phase is claimed complete by this increment. Phases 9 and 10 have started as dependencies for the later transaction modules. Follow `docs/supabase-setup.md` for the concrete manual steps.

## Hosted Supabase connection and verification — 30 September 2026

- Linked the repository to the user-specified existing project `omzfphciqhiqavpsxlxg`, after confirming an empty public schema and zero auth users.
- Applied both migrations through CLI migration history, configured ignored local keys, and generated database types used by the Supabase clients.
- Configured local auth URLs and the French eight-digit code template while preserving email confirmation and TOTP support.
- Verified browser password sign-in, profile save, attendee denial, contact submission, staff inbox access, status transitions and code sign-in. Independently asserted stored data, audit events, escalation denial and suspension behavior against hosted Supabase.
- Fixed the status dropdown resetting to its previous value after a successful change.
- Deleted all tagged smoke-test accounts, profiles, memberships, inquiries, audit events, quota records and local fixture credentials.
- Production build and eight local migration tests pass. Real inbox delivery and permanent organizer assignment remain pending; transactional ticketing has not started.

## Organizer-only access decision — 30 September 2026

The owner confirmed organizer-only login and provided the permanent admin email. That account now has Edition 8 admin membership; its email is not force-confirmed and no password or invitation was issued. Public signup is disabled in Supabase, the signup UI and `/account` remain removed, and login/callback handlers reject users without an active authorized staff role. Non-staff denial and staff login to `/admin` were verified with disposable accounts, then cleaned up. Guest checkout remains the direction for ticketing. First-owner code login and inbox delivery are still pending.

Password setup is now available at `/admin/security` after organizer authentication. Both the page and mutation check active edition staff access, and only the current user's Supabase session can change that user's password. Hosted browser verification rejected mismatched confirmation, accepted a new password, confirmed that the new password signs in and the old one fails, and removed the temporary test account afterward. The owner's password remains unset until they choose one themselves.


## Manual Mobile Money release - current configuration

The owner confirmed 19 December 2026, Classique 1,000 XAF, VIP 2,000 XAF and approximately 5,000 places. Migrations 004 and 005 are applied. Migration 004 was renumbered from the conflicting 003 date-change filename; the already-applied ticketing migration retains version 003.

Production mode is manual. Both real categories share one edition-wide capacity of 5,000; they are not 5,000 places each. A guest chooses Manoel (+237658846124) or Youana (+237699051046), reserves for two hours, and is redirected to a prefilled WhatsApp conversation. A redirect never marks an order paid. No message is sent automatically. Recent orders can be recovered on the same browser using private cookies; cross-device access requires the recovery key.

An admin/manager verifies receipt in the destination Mobile Money account and enters the actual amount plus a unique receipt in the order detail. Confirmation, ticket issuance and audit logging are atomic. Wrong amounts, reused receipts, unauthorized confirmations and overselling are rejected. Expired orders can be reconciled only when capacity is still available; otherwise staff must resolve the payment directly with the customer. No automatic refund or email delivery exists.

Validation: 19 automated tests; hosted guest checkout for both recipient choices; actual browser redirect to Manoel's WhatsApp draft; saved Youana order link/amount verified; no tickets issued to unpaid orders; tagged unpaid test records cleaned. Manual confirmation and shared-capacity/late-receipt protections tested in PostgreSQL. The mobile hero now uses a right-aligned crop to keep the Barca player visible.
