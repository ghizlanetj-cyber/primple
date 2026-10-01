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
2. In Generate Code, use this scope (no DELETE, no settings access), duration 10 min:
   `ZohoCRM.modules.contacts.READ,ZohoCRM.modules.contacts.CREATE,ZohoCRM.modules.contacts.UPDATE,ZohoCRM.modules.accounts.READ,ZohoCRM.modules.accounts.CREATE,ZohoCRM.modules.accounts.UPDATE,ZohoCRM.modules.deals.READ,ZohoCRM.modules.deals.CREATE,ZohoCRM.modules.deals.UPDATE,ZohoCRM.org.READ`
   - READ: search Contacts/Accounts. CREATE: insert and upsert (Zoho's upsert documents ALL, WRITE or CREATE). UPDATE: PUT on existing Contacts. `org.READ`: the MAD currency check on `/crm/v8/org`.
   - If Zoho answers `OAUTH_SCOPE_MISMATCH` when an upsert updates an existing record, replace that module's CREATE+UPDATE with `.WRITE`. That still excludes DELETE; never use `modules.ALL`.
   Exchange the code once from a terminal:
   `curl -X POST "https://accounts.zoho.<dc>/oauth/v2/token" -d grant_type=authorization_code -d client_id=… -d client_secret=… -d code=…`
   Keep only the `refresh_token`. Never paste it into chat, docs or logs.
3. In Lovable → Project Settings → Secrets, add the five ZOHO_* secrets. Also add `CRM_WORKER_SECRET` with a value from `openssl rand -hex 32`.
4. **Automatic worker (not active yet — owner action).** Open Cloud → SQL editor and run the block below. Replace `<same value as CRM_WORKER_SECRET>` yourself; it is typed only into the SQL editor. The block is safe to re-run: it updates the Vault secret instead of creating a duplicate, and replaces the cron job instead of adding a second one.
```sql
do $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'crm_worker_bearer';
  if v_id is null then
    perform vault.create_secret('<same value as CRM_WORKER_SECRET>', 'crm_worker_bearer', 'Primple CRM worker bearer');
  else
    perform vault.update_secret(v_id, '<same value as CRM_WORKER_SECRET>');
  end if;
  if exists (select 1 from cron.job where jobname = 'primple-crm-worker') then
    perform cron.unschedule('primple-crm-worker');
  end if;
end $$;

select cron.schedule('primple-crm-worker', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://primple.ma/api/public/crm-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'crm_worker_bearer')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  )
  where exists (
    select 1 from public.crm_outbox
    where (status in ('pending', 'failed') and next_attempt_at <= now())
       or (status = 'processing' and lease_expires_at < now())
  );
$job$);
```
   - Every 15 minutes (96 checks a day; at most about 15 minutes' delay). It only calls the site when a job is due, including jobs whose lease has expired.
   - The worker stops claiming new jobs after about 40 seconds, inside the 55-second request timeout.
   - It only works after the app is published. Check it with `select jobname, schedule from cron.job;`.
5. Publish, then use `/admin` → CRM Zoho → "Lancer un lot maintenant" for a first manual run against Zoho.

## Worker behaviour
- Each job is claimed with `crm_claim(owner, 1, 120)` immediately before it is processed, so no job waits on an expiring lease.
- One Zoho client and access token are reused for the whole batch. A batch has a limit of 1–50 jobs and stops claiming after its time budget (40 s by default).
- Outcomes go through `crm_complete`, which checks the lease owner. A lost lease writes nothing, including the extra Contact mapping that Deal jobs now store.
- Accounts: an exact-name search with `\ ( ) ,` backslash-escaped (punctuation is never deleted). Returned names must match exactly (ignoring case and spacing).
  - One match is linked. Several matches link nothing (no merge).
  - No match creates the Account through `Accounts/upsert` with `duplicate_check_fields: ["Account_Name"]`, so concurrent jobs cannot create duplicates.
- Contacts: only identity fields (Email, names, Phone, Account link when empty) are synced. `Lead_Source` and the customer-ID `Description` are written only when Zoho reports that this sync inserted the Contact, so existing sales fields are never overwritten.

## Tests
- **Mock-Zoho unit tests:** `src/lib/crm-core.test.ts` (no live CRM). They cover the Account race, punctuation, ambiguous matches, Description preservation, claiming one job at a time with a time budget, Contact mapping, and lost leases.
- **Static security tests:** `src/lib/admin-security.test.ts`.
- **Live database tests (rolled back, nothing sent to Zoho):**
  - `tests/db/crm_outbox_leases.sql` → `PASS 8/8`: completion by the wrong owner, a new version arriving during processing, an expired lease reclaimed, a stale owner rejected, failure and retry, manual retry, final completion.
  - `tests/db/order_files_guard.sql` → `PASS 11/11`.
- **Not run:** live Zoho calls (no credentials yet).

## Live audit follow-up (2026-10-01)
- **Currency:** the MAD check reads `GET /crm/v8/org` → `org[0].iso_code` and needs the `ZohoCRM.org.READ` scope (included in the setup scope). Live org PRIMPLE reports `iso_code=MAD`, so amounts will sync once credentials are set. No settings/currencies permission is needed.
- **Table privileges:** `0018_revoke_truncate_trigger_client_roles.sql` removes TRUNCATE and TRIGGER from anon and authenticated on every public table. `0019` removes all anon/authenticated privileges on the CRM and admin tables.
  - Verified live: TRUNCATE 0/16 and TRIGGER 0/16 tables for both roles.
  - SELECT, INSERT, UPDATE and DELETE are kept, so checkout and existing RLS behaviour are unchanged.
  - REFERENCES is still granted; it was left on purpose because it isn't needed for this fix.
- **Scheduler:** `pg_cron` and `pg_net` (built-in database extensions, no extra cost or project) were turned on by migration `0017`.
  - Live job: `primple-crm-reconcile`, hourly. It only re-queues missed events.
  - The 15-minute HTTP worker job (Setup step 4) still has to be created by the owner, because the agent can't write to Vault. No other Lovable scheduler is available to this project.
  - Until step 4 is done, Zoho delivery only happens when an admin clicks "Lancer un lot maintenant".

## Admin bootstrap (owner runs once in Cloud → SQL editor)
`user_roles` has no rows. Nobody is granted admin automatically and no identity is guessed.
- **Status 2026-10-01:** there is no account for `joecreatearts@gmail.com` yet. Sign up on primple.ma with that email and confirm it first.
- The query only grants the explicitly typed email, and only if that email is confirmed.
```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('joecreatearts@gmail.com')
  and email_confirmed_at is not null
on conflict (user_id, role) do nothing
returning user_id;
```
If it returns no row, the account doesn't exist or the email isn't confirmed yet. Check with:
```sql
select u.email, u.email_confirmed_at is not null as confirmed, r.role
from auth.users u left join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('joecreatearts@gmail.com');
```

## Artwork file ownership guard (migration 0020)
`guard_order_files` (BEFORE INSERT/UPDATE on `order_files`) applies to signed-in and anonymous customer requests. Server-side code (guest upload, guest claim, admin) is exempt.
- **New rows:** `user_id` must be the caller, `bucket` must be `client-artwork`, `path` must start with `<caller uuid>/` (no `..`), and `guest_token` is forced to null.
- **After insert:** `user_id`, `path`, `bucket` and `guest_token` cannot be changed.
- **Order linking:** `order_id` must be an order the caller owns. If `order_reference` is also set, it must be that order's reference. A reference without an order must also belong to the caller.
- **Still works:** linking an uploaded file to the customer's own order, guest checkout files and account claim (both server-side). Claimed guest files keep their `guest/...` path and stay readable by their verified owner.
- **Live regression test:** `tests/db/order_files_guard.sql` runs in one transaction and rolls back. Live result: `PASS 11/11`. It covers a forged path to another customer's file, a forged guest path, a wrong bucket, linking to another customer's order, a mismatched reference (with and without an order), path rewrite, a valid attach, a claim_token change, and the server-side exemption.
- **Admin APIs:** they never select or return `claim_token`, `guest_token` or YouCan Pay token or transaction IDs. This is checked by `src/lib/admin-security.test.ts` and `stripSensitive`.
