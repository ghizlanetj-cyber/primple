# Consolidated French production-readiness pass

## Scope
Complete a French-first localization and accessibility pass without changing the visual design, routes, product configuration, pricing formulas, cart behavior, authentication gate, or payment split.

## Implementation
1. **Centralize the remaining French copy**
   - Add natural French translations for all remaining shared strings used by `/platform`, `/services`, `/pricing`, `/enterprise`, `/help`, `/about`, `/blog`, `/contact`, `/partners`, `/designers`, product FAQs, cart, checkout, and error states.
   - Translate product-specific FAQ questions and answers across every product, including packaging.
   - Translate printer notes and production delays while keeping printer names, contact details, prices, dates, and existing values unchanged.
   - Correct the mobile navigation labels to use the same translation keys as desktop.

2. **Make audited metadata fully French and complete**
   - Update titles, descriptions, Open Graph title/description/type, Twitter card, self-referencing canonical, and `og:url` for every audited public route.
   - Correct `/login`, `/signup`, cart, legal, blog, contact, partner/designer, catalog, and dynamic product metadata.
   - Use the known public domain `https://primple.lovable.app` and keep image metadata omitted where no suitable absolute share image exists.
   - Set the server-rendered document language to French by default.

3. **Translate legal and commercial pages faithfully**
   - Translate legal headings and body copy without changing meaning, payment terms, dates, contact details, rights, or liability scope.
   - Translate platform/service/pricing/enterprise/help/about/blog/contact/partner/designer content and FAQ labels in place.
   - Preserve existing metrics, ratings, and printer names; clearly mark mock/dashboard examples as illustrative where appropriate rather than presenting new claims.

4. **Preserve and verify the working purchase flow**
   - Keep localized accent-insensitive search aliases, native radio semantics, “Ajouter au panier”, cart configuration translations, sticky-header offsets, authentication explanation, 50/50 payment terms, and mobile WhatsApp inset unchanged.
   - Ensure invalid product routes and unknown routes retain clear French not-found pages.
   - Confirm every header/footer destination resolves and `/dashboard` still redirects unauthenticated visitors to login.

5. **Accessibility checks without redesign**
   - Verify heading order, form labels, FAQ button names, visible keyboard focus, meaningful product image alternatives, and keyboard operation of product choices.
   - Check narrow screens for overlap from the fixed header and WhatsApp control.

## Verification
- Run lint, TypeScript checks, and the production build.
- Use the live preview at desktop and narrow widths for the home page, catalog search for “cartes”, business cards, packaging, cart, checkout, login/signup, all listed content/legal routes, unknown routes, and the protected dashboard redirect.
- Inspect rendered titles/descriptions and scan visible page text for untranslated English fragments.
- Do not publish or deploy.
