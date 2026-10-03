# Connect the foundation to Supabase

Login is reserved for provisioned organizers. Public signup and `/account` are removed; attendees will use guest transaction flows. Contact/partner/exhibitor inquiries and the edition-scoped organizer inbox are connected. Ticket sales and payments remain closed.

## Current connected project

As of 30 September 2026, this repository is linked to **Classico Mboa**, project `omzfphciqhiqavpsxlxg`. The local `.env.local` contains this project's keys (ignored by Git). Both `202609300001_foundation.sql` and `202609300002_restrict_platform_trigger.sql` are applied remotely. Do not rerun the SQL manually on this project; use `supabase db push --linked --skip-vault` for new versioned migrations.

Auth is configured for `http://localhost:3002` and its `/auth/callback` route, with public signup disabled, email confirmation, a 12-character minimum password, secure password changes, existing TOTP support preserved, and an eight-digit French email-code template. No custom SMTP provider has been connected.

Verified against the hosted project: password login, code login, profile saving, denial of organizer access to attendees, browser inquiry submission, support-role inbox access, status changes and their audit records, status-field escalation denial and immediate suspension enforcement. Temporary verification accounts and records were removed. Code verification used an admin-generated test code without sending email; real inbox delivery and your permanent organizer account remain to be checked.

The permanent Edition 8 administrator has been provisioned from the email explicitly provided by the owner. Email ownership remains unverified until the owner signs in with a code; no password was assigned and no invitation was sent. The steps below document setup for a fresh environment; project setup is already done here.

## 1. Create or choose a development project

Create a Supabase project for development. Use a separate production project when preparing launch. Save the database password in your password manager; the application does not need that password or a direct PostgreSQL connection string for this increment.

## 2. Configure the local app

Copy `.env.example` to `.env.local` if that file does not exist. Add these values locally, never in chat or source control:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SECRET_KEY
```

Use the port actually running Classico Mboa. Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported. The server variable accepts a Supabase server secret key or legacy service-role key. It must never have a `NEXT_PUBLIC_` prefix. The `.env.local` file is gitignored.

Get the project URL and keys from the project's Connect/API settings. Restart the dev server after changes. Production deployments require these variables in their hosting environment and a fresh build because public pages and public key values can be compiled at build time.

## 3. Apply the migration

In the project's SQL Editor, execute the complete contents of:

`supabase/migrations/202609300001_foundation.sql`

Run it once on a fresh project. It creates tables, indexes, row-level security, profile creation, protected functions, and Edition 8. The transaction rolls back if any step fails. It intentionally does not silently overwrite an existing schema. For subsequent changes, add a new migration rather than editing an already-applied one.

The alternative for a team using the Supabase CLI is to initialize/link the project and apply the versioned migration with `supabase db push`; check the target project before pushing.

## 4. Configure email authentication

In Supabase Auth:

1. Enable Email authentication and keep email confirmation enabled.
2. Set Site URL to the same origin as `NEXT_PUBLIC_SITE_URL`.
3. Allow the exact redirect `http://localhost:3002/auth/callback` (adjust the port). Add the production HTTPS callback when deploying.
4. Keep public signup disabled (`auth.enable_signup = false`). Keep the Email provider enabled so already-provisioned organizers can sign in.
5. In the **Magic Link** email template, include `{{ .Token }}` as the visible code. The app's passwordless flow asks users to type this code, rather than follow a link. Codes support 6–8 digits.
6. Configure SMTP before public use; the development email sender may only deliver to allowed recipients and has restrictive limits. Set appropriate Auth rate limits and bot protection before launch.

The app supports password sign-in and email codes for existing organizers. A valid Supabase session alone is insufficient: successful login also requires an active permitted staff role for the current edition. After code login, use **Mon mot de passe** in `/admin` (or `/admin/security`) to set or change your own password. Passwords require at least 12 characters and matching confirmation; Supabase enforces secure password-change reauthentication. If prompted, sign in with a fresh email code and retry. MFA UI, session management, and account deletion remain future Phase 10 work.

## 5. Verify connection

```powershell
npm run verify:backend
```

This checks public edition access, denial of anonymous inquiry reads, and the server-only submission RPC. It does not create sample inquiries or print credentials.

Provision an organizer using step 6, then visit `/auth/sign-in`, choose **Recevoir un code**, enter the provisioned email, and use **Saisir mon code** to verify the received code. Successful login opens `/admin`. There is no public account signup or `/account` page.

## 6. Grant the first organizer role

Use the trusted terminal provisioner for an explicitly authorized email:

```powershell
node scripts/provision-organizer.mjs omzfphciqhiqavpsxlxg AUTHORIZED_EMAIL
```

The provisioner creates an unconfirmed account if needed and grants the Edition 8 admin role. It does not send mail, assign a password, verify email ownership or override a suspended/disabled profile. Only a trusted operator should grant staff roles. Users cannot assign roles through the website or edit their own account status. `admin`, `manager`, and `support` can access this increment's inbox. `checkin` and `editor` do not receive inquiry access. Roles apply to a specific edition.

Visit `/admin` to view and filter inquiries. Submit a real test inquiry from `/contact`, `/partner`, or `/stands`; check its exact contents in the inbox, change its status, and inspect `audit_events`. The confirmation means the request was saved, not that an email was sent. No notification email integration exists yet.

## Verification and limitations

`npm test` executes all versioned migrations in embedded PostgreSQL (PGlite) and tests RLS, role separation, status-change auditing, quota enforcement, suspension, and input validation. Hosted Auth and browser persistence were additionally verified on the connected project; inbox email delivery remains unverified.

`scripts/live-foundation-smoke.mjs` supports explicitly targeted disposable hosted tests (`setup`, `issue-code`, `promote`, `verify`, `cleanup`, each followed by the project reference). It refuses a project mismatch. Before promotion, browser login must reject the non-staff fixture. After promotion, login opens `/admin`; submit an inquiry and change its status from new to in review to closed. Always run cleanup; it only removes this run's tagged fixture. Credentials stay in the ignored `artifacts/` directory until cleanup.

The Supabase security advisor's two authenticated SECURITY DEFINER notices are expected for the authorization helper and guarded status-change RPC; both are intentionally callable by signed-in users, check the current user and edition, and have RLS tests. The platform event-trigger execution grants were revoked in migration 002. Leaked-password protection remains disabled in the project's Auth settings and should be reviewed before launch.

The inquiry quota allows three accepted submissions per email address per hour. The honeypot and quota are basic protections, not a complete public-launch abuse defense; rotating email addresses can bypass that quota. Add a verified CAPTCHA and deployment-level request limits before a broad launch. Establish retention/deletion rules and confirm official privacy/contact details before collecting public inquiries at scale.

Edition 8 currently exists in both the migration and the public site's TypeScript data. Keep them aligned until the edition-management phase moves the public site to database-backed publishing. No payment, ticket, or reservation is created by these forms.

References: [Supabase server-side client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [email code authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless).


## Ticketing test flow (migration 003)

Local environment: set TICKETING_MODE=test and TEST_PAYMENT_WEBHOOK_SECRET to a random value with at least 32 characters. Production must remain TICKETING_MODE=closed until a real provider is implemented. Do not put the webhook secret in a NEXT_PUBLIC variable.

Guest routes: /tickets, /tickets/checkout, /tickets/order/[reference], /tickets/retrieve. The reference alone does not grant access; a private cookie or matching recovery key is required. Recovery keys and QR payloads are credentials and must not be logged.

Organizer routes: /admin/tickets (admin/manager), /admin/check-in (admin/manager/checkin). Check-in defaults to real mode and refuses test tickets. Select test mode deliberately for rehearsals. Camera requires HTTPS or localhost and permission; manual code entry is available. Printing uses the browser print/PDF action. Voiding does not refund or return capacity.

Test webhook: POST /api/payments/test/webhook. Sign the exact JSON body with HMAC-SHA256 over timestamp + '.' + body, using headers x-payment-timestamp (Unix seconds) and x-payment-signature (hex). Events must contain reference, UUID event, integer amount, currency XAF and outcome successful/failed. Signatures expire after five minutes. Database validation remains authoritative.

Run npm test and npm run verify:routes. The explicitly targeted scripts/live-ticketing-smoke.mjs supports setup, capture, webhooks, verify and cleanup with project reference omzfphciqhiqavpsxlxg. It creates tagged disposable records, never sends mail, and removes only its own verified test fixtures. For the browser verification, buy two Classique test tickets using the fixture email, simulate success, capture, recover in a second browser, log in as the fixture organizer, reject a ticket in live mode, accept it once in test mode, reject its reuse and void the other ticket. Run verify and cleanup. The webhooks mode separately tests true hosted stock contention and signed callback retries.


## Live manual Mobile Money operations

Use TICKETING_MODE=manual. The test webhook stays disabled. No payment API credentials are needed for this mode. Migrations 004/005 set the date to 2026-12-19, add two real ticket categories and a shared 500-place capacity. Keep TEST_PAYMENT_WEBHOOK_SECRET server-only and unset in production unless explicitly running a test environment.

Checkout opens WhatsApp with Manoel for MoMo or Youana for Mobile Money. Confirm actual receipt in the destination account before opening the matching order at /admin/tickets, entering the received amount and unique transaction receipt, checking the verification box and issuing tickets. Never treat a WhatsApp draft, client statement or screenshot as receipt verification. A duplicate receipt is rejected. Late receipts with insufficient capacity require staff resolution; do not request a second payment.

Tell the customer to return to /tickets/retrieve in the original browser and refresh the order once confirmed. Ask them to save their private recovery key for another browser/device. Do not request or share that key in WhatsApp. E-mail delivery is not configured. Tickets can be printed or saved as PDF. Manual checkout smoke checks use scripts/manual-checkout-smoke.mjs setup/verify/cleanup plus the explicit project reference; cleanup refuses paid orders.
