- [x] Restyle header search panel with existing glass treatment
- [x] Add localized Books product, options, pricing, search, and footer
- [x] Verify responsive FR/EN/AR behavior, pricing, state isolation, tests, and types
- [x] Simplify quantity choices to quantity and dynamic savings only
- [x] Enable secure guest artwork upload through checkout and later account claim
- [x] Replace the ten pack images with the supplied mapped artwork
- [x] Preserve the latest signup, dashboard, role, and Google-only authentication edits
- [x] Diagnose and fix the current build failure
- [x] Verify signup, dashboard access protection, packs, tests, types, and production build without publishing

- [x] Publish with YouCan Pay keys (notification URL set by owner in YouCan Pay)

- [x] Print checkout: 50% card deposit + 50% cash at delivery (server-verified)
- [x] P0 copy: Primple labels, packaging quote wording, remove ratings, card delivery lines
- [x] Remove the homepage Expert Designer and restore the original hero flow
- [x] Admin dashboard + Zoho CRM outbox (awaiting Zoho runtime secrets + worker schedule step)
- [x] Change phone/WhatsApp to +212708877006
- [x] Brief pass: strict repricing, pack minimums, return-URL allowlist, quote form → CRM, duplicate-order guard
- [x] Truthful invoice/dashboard payment status, production+delivery working-day estimates, live order updates
- [x] Admin: record cash balance collected / remitted
- [ ] Team workspace (brief §9)
- [ ] Separate interior/cover uploads, file type/size checks, BAT gating
- [ ] Shop orders in admin list; admin revenue to include collected balances
- [ ] SEO/accessibility review

## Catalogue pricing + primple.team (2026-10-15)
- [x] Live pricing overrides, admin editor, server repricing, price-change review
- [x] Private artwork backup (13 objects)
- [x] Review fixes: ABA versioning, pricing error state, pack caps/min, unpriceable cart lines, pack dependency
- [x] Delete 13 original artwork files after SHA256 check
- [ ] primple.team connection (owner must connect domain + DNS)

## Uploaded homepage patch (2026-10-18)
- [x] Apply the full uploaded patch with accurate current payment wording
- [x] Verify homepage, header/search, languages and product/pack price display without publishing

## Payment initiation audit (2026-10-24)
- [ ] Trace read-only diagnostics and safe gateway configuration
- [ ] Fix explicit dispatch, checked manual updates and safe initiation errors
- [ ] Run focused regressions and inspect final diff without publishing or production writes

## Dashboard analytics (2026-10-29)
- [x] Add private measured traffic report with visits, search, ads, sources, pages and devices
- [x] Verify aggregation and access rules (20 focused tests); isolated UI fixture checked, authenticated end-to-end remains unverified
- [ ] Live updates, keyword rankings and ad spend (Google Analytics connection is tracking-only, no report access; Search Console and ad reporting connections still needed)
