# Roadmap

- [x] Remove all dark-mode behavior, variants, preferences, and dark token overrides
- [x] Language selector in the global footer
- [x] Language control in the header (desktop + mobile menu), synchronized with the footer
- [x] FR/EN/AR homepage + shared shell translations and RTL behavior
- [ ] Arabic translations for the secondary marketing/legal routes (currently fall back to English)
- [x] Remove demo/mock dashboard data (orders, quotes, printers, fake stats)
- [x] Real invoice generated from the authenticated order (print/download, FR/EN/AR, RTL)
- [x] Remove printer selection UI (DB column kept for a future update)
- [x] Mobile responsiveness pass (no horizontal overflow on key routes)
- [x] Verified dashboard orders are real customer rows (RLS-scoped), no demo fixtures left
- [x] Private client-artwork storage + order_files table with owner-only RLS and signed URLs
- [x] Client files section per order and "My files" view (FR/EN/AR, RTL, mobile)
- [x] Internal storage documentation (docs/client-files.md)
- [x] Branded public OAuth callback and safe post-login destination for Google and Apple
- [ ] Provider consent branding: add Primple's own Google and Apple credentials in Cloud auth settings
- [x] Synchronize the English homepage with the current French design and content
