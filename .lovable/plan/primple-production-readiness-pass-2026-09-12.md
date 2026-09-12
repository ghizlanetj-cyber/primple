# Primple production-readiness pass

## Goal
Ship one polished light-only experience with a persistent, accessible Français / English / العربية selector in the global footer, complete shared translations, and verified purchase journeys—without changing routes, pricing, product options, factual claims, or publishing.

## Implementation
1. **Light theme only**
   - Remove dark-mode variants, dark token overrides, theme labels, preferences, and any system-theme behavior.
   - Keep the existing charcoal content bands and glossy header as intentional brand surfaces, while ensuring the application itself always initializes in the light theme without a refresh flash.

2. **Global language behavior**
   - Move the language control out of the header/mobile menu into the footer bottom area using an accessible native selector or equivalent keyboard-operable control.
   - Persist the selected language, update `<html lang>` and `dir`, and apply RTL to Arabic without changing the layout structure.
   - Update document title, description, Open Graph text, and accessible labels when the language changes while preserving French as the server-rendered default.

3. **Complete shared translations**
   - Consolidate French, English, and Arabic copy through the existing i18n dictionaries.
   - Cover shared navigation/footer, forms, cart/checkout/auth, product configuration and FAQs, homepage sections, and every requested public route.
   - Keep names, contact details, URLs, prices, ratings, metrics, legal meaning, dates, and payment policy unchanged.

4. **Homepage quality pass**
   - Add accurate FR/EN/AR versions of the three existing testimonials and job titles.
   - Check the hero, CTAs, statistics, four steps, product cards, partner section, FAQ, final CTA, footer, and accessible names.
   - Fix only clipping, overlap, inconsistent copy, or misleading links; keep pricing CTAs aimed at `/products` and contact CTAs at `/contact`.

5. **Validation**
   - Run type checks and the available production build/checks.
   - Use the live preview at desktop and narrow mobile widths to verify all requested routes, language persistence/RTL, catalog search, product configuration, cart, checkout gate, authentication pages, fixed header, WhatsApp control, and 404 behavior.
   - Record any limitation caused only by protected/generated files. Do not publish or deploy.

## Technical notes
- Extend the current `useI18n()`/shared phrase-map approach rather than introducing another localization library.
- Use semantic design tokens and existing controls; remove only actual dark-theme machinery, not deliberate dark brand sections.
- Keep French as the initial SSR language to avoid hydration mismatch, then restore the saved language immediately after hydration and synchronize metadata client-side.
