# Primple → Zoho CRM integration

## Architecture
Customer action (checkout, YouCan Pay webhook, staff payment confirmation, contact form)
→ the existing Cloud database (database triggers write to an outbox; they never call the network and never raise)
→ `POST /api/public/crm-worker` (server runtime, needs a bearer token)
→ Zoho CRM v8 (refresh-token OAuth, only allowlisted Zoho domains).

## Migrations (drizzle/migrations)
- `0016_crm_admin_outbox.sql`: empty no-op (`SELECT 1`), applied by mistake. Harmless; kept so the migration journal stays consistent.
- `0017_crm_admin_outbox_schema.sql`: applied to the Cloud database.
  - **Tables:** `crm_settings` (`sync_since` = the time the integration was turned on), `order_ops` (internal production stage, notes, supplier, cost), `message_meta` (classification, quote stage, read flag), `crm_outbox`, `crm_mappings`, `crm_sync_attempts`, `crm_enqueue_errors`.
  - **Access:** RLS is on and there are no policies, so only the service role can use these tables.
  - **Triggers:**
    - profiles insert or email/name change → Contact job.
    - orders insert or contact change → Contact job.
    - order becomes `payment_status='paid'` or `deposit_paid` → Contact and Deal jobs, and `order_ops` moves to `payment_confirmed`.
    - shop_orders become `paid` → Contact and Deal jobs.
    - contact_messages insert → unread `message_meta` row only.
    - an admin sets `message_meta` to quote/sales → Contact and Deal jobs.
    - A public form can never classify its own message.
  - **Functions** (service role only; PUBLIC, anon and authenticated execute revoked):
    - `crm_claim`: `FOR UPDATE SKIP LOCKED`, leases of up to 600 s, lease owner token.
    - `crm_complete`: owner check, then version check (a newer event goes back to pending), exponential backoff with jitter or Retry-After, dead after 8 attempts, blocked state.
    - `crm_retry`.
    - `crm_reconcile`: only looks at events after `sync_since`, at most 100 per run.
  - **Hardened `guard_order_payment_fields`:** customers can no longer change `user_id`, `items`, `reference`, `claim_token`, `claimed_at` or `guest_email`. On insert, the claim fields are forced to null.
  - **New `guard_order_files`:** customers cannot change file owner, path, bucket or guest token, and can only attach files to orders they own. Server-side guest and claim flows use the service role and are unaffected.
  - **Schedule:** pg_cron job `primple-crm-reconcile` runs hourly and only re-queues missed jobs. The HTTP call to the worker is **not scheduled yet** (see Setup step 4).

## Code
- `src/lib/crm-core.ts`: Zoho client logic with no environment access. Token refresh, 10 s timeouts, retry on 401, 429 with Retry-After, 5xx retried, record-level errors returned with HTTP 2xx are treated as failures. Contact upsert by normalized email (search first, never blanks fields). Account linking reuses exactly one name match and skips if several match. Deal upsert uses `duplicate_check_fields:["Primple_External_ID"]`. Also contains the MAD currency gate and the sanitizer.
- `src/lib/crm-worker.server.ts`: reads secrets, loads source records, processes one bounded batch.
- `src/routes/api/public/crm-worker.ts`: accepts `CRM_WORKER_SECRET` or the existing `LOVABLE_CRON_SECRET` (via `authenticateCronRequest`) before loading any worker or admin code.
- `src/lib/admin.functions.ts` and `src/routes/_authenticated/admin.index.tsx` (`/admin`): every function requires a session and the **admin** role before using the service client. Moderators keep `/admin/payments` only. No API returns claim tokens or payment processor tokens. Artwork links are signed for 300 s after the admin check.
- `src/lib/admin-metrics.ts`: order value, amount actually collected and balance due at delivery.

## Deal mapping
- **External IDs:** `orders:<uuid>`, `shop_orders:<uuid>`, `quotes:<message uuid>`.
- **Common fields:** `Primple_Source="Primple.ma"`, `Primple_Admin_URL=https://primple.ma/admin?order=<id>` (or `?message=<id>`).
- **Confirmed orders:** Stage `Closed Won`, Lead_Source `OnlineStore`.
- **Quotes:** Lead_Source `Web Download`, no amount. Stages:

| Quote stage | Zoho stage |
|---|---|
| new | Qualification |
| qualified | Needs Analysis |
| proposal | Proposal/Price Quote |
| negotiation | Negotiation/Review |
| won | Closed Won |
| lost | Closed Lost |

- **Amounts:** sent only if `GET /crm/v8/org` reports MAD. Otherwise the job is **blocked** with `currency_unverified` or `currency_mismatch` (fails closed).

## Runtime secrets (server only)
`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ACCOUNTS_DOMAIN` (e.g. `accounts.zoho.eu`), `ZOHO_API_DOMAIN` (e.g. `www.zohoapis.eu`), `CRM_WORKER_SECRET`.

Until all ZOHO_* secrets exist, the worker returns `pending_configuration` and does not claim any jobs.

## Setup
1. Go to https://api-console.zoho.com (your data-centre domain) → Add Client → **Self Client** → copy the Client ID and Client Secret.
2. In Generate Code, use scope `ZohoCRM.modules.contacts.ALL,ZohoCRM.modules.accounts.ALL,ZohoCRM.modules.deals.ALL,ZohoCRM.org.READ`, duration 10 min. Then, from a terminal, exchange it once:
   `curl -X POST "https://accounts.zoho.<dc>/oauth/v2/token" -d grant_type=authorization_code -d client_id=… -d client_secret=… -d code=…`
   and keep the `refresh_token`. Never paste it into chat.
3. In Lovable → Project Settings → Secrets, add the five ZOHO_* secrets. Also add `CRM_WORKER_SECRET` with a value from `openssl rand -hex 32`.
4. To turn on automatic sync, open Cloud → SQL editor and run (same value as `CRM_WORKER_SECRET`):
```sql
select vault.create_secret('<same value>', 'crm_worker_bearer');
select cron.schedule('primple-crm-worker', '*/15 * * * *', $$
  select net.http_post('https://primple.ma/api/public/crm-worker',
    jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='crm_worker_bearer')),
    '{}'::jsonb)
  where exists (select 1 from public.crm_outbox where status in ('pending','failed') and next_attempt_at <= now());
$$);
```
   This runs every 15 min (96 runs a day, about a 15 min maximum delay) and only calls the site when jobs are due. It only works once the app is published.
5. Publish, then use `/admin` → CRM Zoho → "Lancer un lot maintenant" for a first manual run against Zoho.

## Tests
- **Mock-Zoho unit tests:** `src/lib/crm-core.test.ts`.
- **Static security tests:** `src/lib/admin-security.test.ts`.
- **Not run:** live Zoho tests (no runtime credentials yet), and live database tests of RLS and concurrency (no direct database connection in the build sandbox).

## Live audit follow-up (2026-10-01)
- **Currency:** the MAD check reads `GET /crm/v8/org` → `org[0].iso_code` and needs the `ZohoCRM.org.READ` scope (already in the setup scopes). Live org PRIMPLE reports `iso_code=MAD`, so amounts will sync once credentials are set. No settings/currencies permission is needed.
- **Table privileges:** `0018_revoke_truncate_trigger_client_roles.sql` removes TRUNCATE and TRIGGER from anon and authenticated on every public table. `0019` removes all anon/authenticated privileges on the CRM and admin tables.
  - Verified live: TRUNCATE 0/16 and TRIGGER 0/16 tables for both roles.
  - SELECT, INSERT, UPDATE and DELETE are kept, so checkout and existing RLS behaviour are unchanged.
  - REFERENCES is still granted; it was left on purpose because it isn't needed for this fix.
- **Scheduler:** `pg_cron` and `pg_net` (built-in database extensions, no extra cost or project) were turned on by migration `0017`.
  - Live job: `primple-crm-reconcile`, hourly. It only re-queues missed events.
  - The 15-minute HTTP worker job (Setup step 4) still has to be created by the owner, because the agent can't write to Vault. No other Lovable scheduler is available to this project.
  - Until step 4 is done, Zoho delivery only happens when an admin clicks "Lancer un lot maintenant".

## Admin bootstrap (run once in Cloud → SQL editor)
`user_roles` currently has no rows. Replace the email with the verified account that should be admin; it must have signed in at least once.
```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
where lower(email) = lower('owner@example.com')
on conflict (user_id, role) do nothing
returning user_id;
```
If it returns no row, that email has no account yet. Check with:
```sql
select r.role, u.email from public.user_roles r join auth.users u on u.id = r.user_id;
```
