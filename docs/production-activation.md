# Primple production activation

Supabase stays the source of truth. `/admin` → Équipe includes an admin-only production health panel. It checks the current paired payment-key environment, database access, private artwork bucket and Zoho secret presence without returning credential values. A matching live key prefix is configuration evidence, not proof that the merchant account or webhook works.

## Required live checks
1. Confirm approved team accounts and Supabase Auth site/redirect URLs for https://primple.ma, including the existing auth callback route. Retain RLS and role checks. Customer logins are separate from business data and must not be purged unless explicitly selected.
2. In the YouCan Pay merchant account, activate the live merchant credentials. Set `YOUCANPAY_PUBLIC_KEY` and `YOUCANPAY_PRIVATE_KEY` in Lovable's server secrets as one matching live pair. Never paste credentials into chat or commit them. Sandbox and mixed key pairs must never be relabelled as live.
3. Configure the signed webhook at https://primple.ma/api/public/youcanpay-webhook. The existing signature check uses the configured private key. The server-confirmed order status, not the checkout widget response, determines successful payment and cart clearing.
4. Verify one authorized real payment and its signed confirmation when the owner is ready to make that payment. A database reset is not a payment refund and does not remove transactions at YouCan Pay.
5. Verify contact and quote submissions reach Supabase and the staff inbox, and private uploaded artwork is accessible only by its owner or authorized staff. Confirm customer emails/Google sign-in on the production domain.
6. Zoho is optional for taking orders. Set its server OAuth secrets, confirm MAD currency and field mappings, then schedule the authenticated worker according to docs/primple-zoho-integration.md. Do not push old test jobs. Reset its local outbox/mappings only as part of an approved test-data reset. Deleting local mappings does not delete already-synced Zoho records.
7. Publish the tested connected Lovable project and verify desktop/mobile login, checkout, confirmation, inbox, quotes and admin permissions against the production domain.

## One-time test-data reset
Before clearing anything, inspect current counts, foreign keys, storage objects and all approved staff identities. Export a restorable private backup of the selected business tables and artwork files, outside the public Git repository. Pause CRM work during the reset so old test jobs cannot be sent. Preserve team access, configuration, catalogue/pricing, availability settings, schema, migrations, RLS and runtime secrets. Identify customer login deletion separately.

The approved business reset includes print/shop orders and their operational records, file associations, design conversations/messages, contact messages and quote metadata, financial diagnostic/test collection rows, and test CRM outbox/attempt/error/mapping records. All login accounts and profiles were explicitly preserved. Internal note/audit history requires an explicit reset procedure because append-only protections intentionally reject ordinary deletion and TRUNCATE. Do not globally disable RLS, remove security triggers, drop tables, or embed a destructive reset in an automatic migration or public dashboard endpoint.

Use one controlled transaction where possible, protect staff profile rows, and fail on unexpected counts or foreign-key relationships. Private storage objects must be removed with the Storage API rather than deleting storage metadata directly. Verify final empty business counts, preserved administrator access, intact security grants, and a successful new workflow after reset. Re-enable only production CRM scheduling with a fresh sync cutoff.

## Verified activation state, October 15–16, 2026
- The approved reset completed with a private business-data backup outside Git and 13 verified artwork copies in a private storage bucket. Final counts: 14 preserved logins/profiles, 4 admins, zero orders/messages and zero active artwork. No external payment refund or provider-record deletion was performed.
- Paired live YouCan Pay keys are present. Signed webhook confirmation remains authoritative. A new real payment and merchant-account settlement have not been tested by this release.
- Catalogue price/quantity editors, live public pricing and security checks passed: 165 tests, clean cloud TypeScript check and production build, plus authenticated desktop/mobile checks using a disposable account that was removed afterward.
- `primple.team` and `www.primple.team` are verified in Lovable. The application routes them to the staff dashboard and keeps `primple.ma` public. Remove the global primary-domain redirect so these hosts can serve independently; never make the team hostname redirect the public store.
- Zoho credentials are not configured, so external synchronization remains inactive. Supabase continues to receive operational records independently.
