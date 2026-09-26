# Primple capped-scope implementation plan

## Budget decision

The requested scope cannot be implemented safely within the hard cap of 40 Lovable credits. It combines a payment-model migration across two order systems, verified webhook state transitions, a privileged staff action, a multilingual catalogue-grounded AI assistant, configuration write-back, and several trust-copy changes.

Per the attached instruction, stop before implementation. No product code, database data, credentials, payment configuration, or published site will be changed.

## Recommended implementation sequence

### 1. Deposit payment model and staff collection control

- Add a checkout choice for full card payment or a 50% online deposit with the balance collected at delivery.
- Calculate the deposit from the complete server-verified total, including delivery, using integer centimes and a deterministic rounding rule.
- Persist the payment method, amount due now, remaining balance, deposit verification, and cash collection state for both print and shop orders.
- Keep production blocked until the existing signed YouCan Pay confirmation verifies the full payment or deposit.
- Update confirmation, retry, dashboard, and invoice wording so each state is accurate.
- Add an admin/moderator-only server action to mark the delivery balance collected, with an auditable payment event and an idempotency guard.
- Apply a database migration with explicit grants and row-level security; do not alter keys, environment detection, endpoints, or webhook signature verification.

### 2. Catalogue-grounded Assistant Primple

- Add one reusable compact assistant to product configurators and pack pages.
- Accept French, English, and Arabic, ask no more than three short questions, and never request payment details.
- Use the AI only to identify intent and return structured catalogue identifiers; validate every recommendation server-side against the current product, pack, option, quantity, delivery, and pricing data.
- Show prices and timing only after deterministic recalculation by the existing catalogue engine.
- Enable “Apply to configuration” only when every returned value is valid for the current product or pack.
- Route packaging and unsupported custom requests to the existing quote flow with a concise prefilled brief.
- Reuse the existing AI Gateway request pattern and provide a clear unavailable state without blocking manual configuration.

### 3. Targeted trust and copy corrections

- Update the homepage lead and set the French primary action to “Créer mon espace marque” and secondary action to “Commander une impression,” with matching English and Arabic copy.
- Replace packaging instant-price promises with custom-quote wording.
- Remove fabricated ratings, review counts, aggregate-rating metadata, and verified/authentic review claims where no real source exists.
- State standard delivery as 30 DH on relevant product cards and clarify that the exact total appears in configuration.
- Correct customer-facing brand labels to “Primple” without changing the working email address or DNS.

## Validation

- Add focused tests for deposit rounding, full-payment parity, webhook transitions, duplicate confirmations, cash collection authorization/idempotency, assistant validation, invalid-option rejection, and quote routing.
- Run the relevant tests and the project typecheck/build once.
- Check the affected French, English, and Arabic screens at desktop and mobile widths.
- Do not place a real order, alter existing orders/files/accounts, or publish.

## Expected scope

This should be handled as at least three separately approved passes. The payment pass must come first because its persisted states and webhook behavior define the UI and staff workflow used by later checks.
