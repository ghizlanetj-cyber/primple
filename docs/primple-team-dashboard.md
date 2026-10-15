# Primple team dashboard (/admin)

## Roles
| Role | Where stored | Access |
| --- | --- | --- |
| admin | `user_roles` (role `admin`) | Everything: team grants, catalogue availability, cash collection, CRM, payments |
| team | `team_members` (active) | Orders, customers, inbox, quotes, notes, assignment, production stages. No roles, catalogue, payment confirmation or CRM |
| moderator | `user_roles` (role `moderator`) | `/admin/payments` only |

Roles are never read from `user_metadata`. Every server function calls `my_staff_role()` with the caller's own session and checks the capability (`can()` in `src/lib/admin-metrics.ts`) before loading the service client. Database mutation functions re-check the actor role, run in one transaction and append to `admin_audit_log`. Order and message edits use a version number, so a stale edit fails with a conflict instead of overwriting.

## Money rules
- Confirmed value: paid orders, or orders whose advance is confirmed.
- Collected by Primple: online payments plus cash balances marked remitted.
- Courier-held: cash balance recorded as collected by the courier, not yet remitted.
- Outstanding: cash balance with no collection record (cancelled orders excluded).
- The "Delivered" status never counts as money collected. Totals come from SQL (`admin_order_money`, `admin_report`, `admin_customers_v2`) over all rows, with no row caps.

## Catalogue availability
Prices and options stay in `src/data/*`. Admins can switch a product or pack off. Product and pack pages disable add-to-cart, the database refuses new orders containing it, and payment start refuses existing orders containing it.

## First admin (run manually, once, by the owner)
Replace the email with the owner's confirmed account. Nothing runs automatically.

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE lower(email) = lower('OWNER_EMAIL_HERE') AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
```
Team members are then added from the Équipe page (the account must exist with a confirmed email).

## Tests
- Unit: `bunx vitest run` (capabilities, money truth, CSV safety, static checks of the server API).
- Database: `tests/db/team_dashboard.sql`, run through the backend SQL tool (rolled back).


## Completed review additions
- Customer list and detail use the service-only `admin_customer_records` view. The detail summary has no pagination cap. Exact normalized keys preserve `_` and `%` literally; account-linked orders use profile identity even when the order contact email differs.
- Print and shop order histories are paginated together. Messages and customer notes have independent pagination. Shop payments are read from `shop_orders` in cents and their original currency; processor identifiers are never returned. Paid MAD shop totals are reported separately from print cash balances.
- Boutique orders have private, versioned `shop_order_ops` assignment, expected delivery dates, stages and instructions. Notes/history use the same append-only audit flow as print orders. Operational stages do not alter processor-owned payment state.
- Product and pack listing cards show availability. A disabled canonical product blocks every pack containing it. `catalog_pack_products` is derived from `src/data/packs.ts` in migration 0029: update this mapping with an additive migration whenever canonical pack constituents change. Pack custom quantities keep the existing quote path; pricing remains in source.
- Availability is enforced on all order inserts and card payment starts/retries; manual payment requests also check it. Public catalogue reads expose only `kind`, `slug`, `available`. Notes and staff identifiers stay private.
- Cancelled/refund-pending production is shown to the customer as Cancelled and removed from active work/payment/balance queues. The refund-pending stage never refunds a payment. Delivered never implies cash collection or remittance.
- Manual payment confirmation and its audit entry are atomic and idempotent; team members cannot confirm money. Append-only notes/audits also reject TRUNCATE. All internal tables explicitly revoke inherited client grants.
- Zoho retains the existing server-side outbox, idempotent mappings, and lease-checked worker. Supabase remains authoritative. No checkout path calls Zoho. Credentials stay server-side and CRM controls remain admin-only. Shop operation data is available for a future worker adapter without changing its payment flow.

## Validation, 2026-10-05
- TypeScript check, production build, and 134 unit tests passed after the review corrections.
- `tests/db/team_dashboard.sql`: permissions, version conflicts, roles, money, audit, availability (rollback).
- `tests/db/team_dashboard_review.sql`: 23 additional checks, including literal email identity, summary beyond 100 customers, shop operations/totals, private grants, atomic manual payment, constituent pack availability (rollback).
- Existing `tests/db/order_files_guard.sql` and `tests/db/crm_outbox_leases.sql` retain their regression coverage.
- Anonymous `/admin` redirects to sign-in. A product quantity of 250000 remains accepted for a custom quote.
- Final authenticated desktop/mobile verification requires a normal human sign-in. No real-account session was minted for these review checks. No real order/payment, stock override or Zoho sync was performed.

The final dashboard is prepared in the connected Lovable preview. Publishing remains a separate step after authenticated acceptance.


October 15 validation after integrating current payment-confirmation changes: TypeScript passed; 145 unit tests passed (18 files). Live database regression checks described above were transactionally rolled back on October 5. Production health panel is admin-only and exposes no credential values.
