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
- CRM worker claims one outbox job at a time (crm_claim limit 1) inside a time-budgeted batch and writes results only via lease-checked crm_complete — prevents stale leases and lost updates.
- Order creation and payment always reprice lines via orderTotals and reject unpriceable carts; never fall back to stored or browser totals — prevents tampered amounts.
- Cash balances collected at delivery are recorded only in balance_collections via an admin server function; "Delivered" status never implies money was collected or remitted.
- Payment/invoice wording comes from paymentSummary in src/lib/invoice.ts so dashboard and invoice never disagree.
- Quantities have only a minimum; above a product's largest preset quantity (or bulkQuoteAt) lineQuote/parsePackLines return null and the UI offers a quote request — never extrapolate prices.
- /admin access (moderators only get /admin/payments) goes through my_staff_role() and the capability matrix in admin-metrics.ts before the service client; team members live in team_members (operational only), roles never come from user_metadata. Keeps least privilege in one checked place.
- Admin mutations go through audited, versioned SQL functions (admin_update_order_ops, admin_update_message, admin_record_balance, etc.); never write sidecar tables directly from TypeScript. Prevents lost updates and unaudited changes.
- Catalog availability overrides live in catalog_availability and are enforced by the orders insert trigger and payment start. Source price defaults stay in src/data; audited live overrides live in catalog_pricing. Prevents ordering switched-off items and keeps checkout on current prices.

- Catalogue availability public reads use only kind/slug/available; notes and updated_by are private. Packs inherit canonical product availability through catalog_pack_products; keep its migration seed in sync with src/data/packs.ts.
- Customer identity joins use exact normalized email keys, never LIKE patterns. Shared uncapped aggregates supply list/detail totals; history is paginated independently.
- Shop payments remain processor-owned in shop_orders, in cents and original currency. Edit only shop_order_ops through audited versioned RPCs, and expose no processor identifiers. Report MAD shop payments separately from print/courier cash.
- Every new internal table explicitly revokes ALL client defaults (including TRUNCATE/TRIGGER/MAINTAIN), enables RLS, and grants only service_role. New internal RPCs revoke PUBLIC/anon/authenticated EXECUTE.
- A refunded production label is a refund-pending workflow state, not a monetary refund. Preserve actual payment and cash-collection evidence.
- Card payment success is shown only after the server order status reads "paid" (set by the signed webhook), via getPrintPaymentStatus polling; the widget result never confirms payment or clears the cart. Prevents false confirmations and double charges.
- Live prices: admin overrides live in catalog_pricing (config {} = source defaults, monotonic versions, admin_set_pricing only). Pricing code takes an explicit request-local Catalog (buildCatalog); never mutate src/data arrays. Server checkout/payment loads it fresh via loadLiveCatalog and refuses an unpaid order whose stored total differs. UI shows no price while live pricing is loading or failed.
- Host routing lives in src/lib/host-routing.ts (applied in src/server.ts): primple.team serves only /admin, sign-in, API and assets with noindex; hostnames never grant access.
- Meta Pixel 2086841301952485 is owned by MarketingConsent and meta-pixel.ts. Load it only after explicit advertising consent on allowlisted primple.ma public pages; never add an unconditional head script or noscript beacon. Keep admin, account, payment, team and preview hosts excluded. Only PageView is configured; no customer data or purchase events are sent by this integration.
- Offer cards use madOffer for compact decimal display; checkout and invoice amounts retain mad so formatting never changes payable centimes.
