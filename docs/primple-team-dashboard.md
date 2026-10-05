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
- The "Delivered" status never counts as money collected. Totals come from SQL (`admin_order_money`, `admin_report`, `admin_customers`) over all rows, with no row caps.

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
