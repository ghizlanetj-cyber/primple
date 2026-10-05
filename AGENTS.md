<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Zoho CRM sync uses a DB outbox (triggers enqueue only) drained by /api/public/crm-worker; never call Zoho from checkout or triggers — keeps payments independent of CRM uptime.
- /admin management functions require the admin role server-side before loading the service client; moderators only get /admin/payments.
- CRM worker claims one outbox job at a time (crm_claim limit 1) inside a time-budgeted batch and writes results only via lease-checked crm_complete — prevents stale leases and lost updates.
- Order creation and payment always reprice lines via orderTotals and reject unpriceable carts; never fall back to stored or browser totals — prevents tampered amounts.
- Cash balances collected at delivery are recorded only in balance_collections via an admin server function; "Delivered" status never implies money was collected or remitted.
- Payment/invoice wording comes from paymentSummary in src/lib/invoice.ts so dashboard and invoice never disagree.
- Quantities have only a minimum; above a product's largest preset quantity (or bulkQuoteAt) lineQuote/parsePackLines return null and the UI offers a quote request — never extrapolate prices.
- /admin access goes through my_staff_role() and the capability matrix in admin-metrics.ts before the service client; team members live in team_members (operational only), roles never come from user_metadata. Keeps least privilege in one checked place.
- Admin mutations go through audited, versioned SQL functions (admin_update_order_ops, admin_update_message, admin_record_balance, etc.); never write sidecar tables directly from TypeScript. Prevents lost updates and unaudited changes.
- Catalog availability overrides live in catalog_availability and are enforced by the orders insert trigger and payment start; prices stay in src/data. Prevents ordering switched-off items.
