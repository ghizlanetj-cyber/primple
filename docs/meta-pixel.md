# Meta Pixel

Pixel ID: `2086841301952485`. This is a public integration identifier, not a secret.

`MarketingConsent` mounts once in the root and uses the existing French/English/Arabic language choice. Visitors can accept or refuse with equal-weight buttons and reopen **Choix des cookies** on public pages. The choice is stored in `primple-marketing-consent-v1`; blocked storage falls back to the current visit. The privacy page describes this optional tracking.

`src/lib/meta-pixel.ts` loads the standard Meta SDK only after explicit consent, with automatic configuration disabled. It initializes once, sends `trackSingle` PageView for this pixel on permitted route changes and avoids duplicate views from repeated React effects. A late SDK load rechecks consent and the actual URL. Refusing or withdrawing revokes Meta consent and clears only `_fbp`/`_fbc`, preserving login, cart and language state.

Only allowlisted public HTTPS pages on primple.ma/www.primple.ma are eligible. Admin/account/login/payment/checkout/cart routes, team hosts, preview and local hosts are excluded. Unknown query parameters, fragments and private same-site referrers also block tracking, because Meta reads browser URLs. Normal advertising attribution parameters are supported. There is no unconditional noscript image: it would bypass the consent choice.

Only PageView is configured. No advanced matching, names, emails, order identifiers, purchase events or Conversions API integration are added. Supabase, payment confirmation and CRM flows are unchanged. Ad blockers or network failures must not block the website.

Validation: `src/lib/meta-pixel.test.ts` covers consent, navigation deduplication, excluded origins/routes, private URLs/referrers, revocation and consent/navigation changes during SDK loading. Verify the published site with no prior choice, refusal, acceptance, client navigation and later withdrawal; confirm PageView receipt in Meta Events Manager when an authorized session is available.
