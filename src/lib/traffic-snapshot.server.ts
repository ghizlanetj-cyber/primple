import type { TrafficReport } from "./traffic-report";

/** Measured Lovable report, captured via the project analytics tool. No runtime API is available.
 * Keep this snapshot server-only and expose it only after the existing staff capability check.
 * Daily definitions changed on October 26; no cross-cutover comparisons are included.
 */
export const trafficSnapshot: TrafficReport = {
  source: "Lovable Analytics",
  from: "2026-10-26", to: "2026-10-29", capturedAt: "2026-10-29T12:04:00Z",
  includesInternalTraffic: true,
  metrics: { visits: 254, pageviews: 499, pagesPerVisit: 1.96, bounceRate: 43, durationSeconds: 15 },
  daily: [
    { day: "2026-10-26", visits: 77, pageviews: 153 },
    { day: "2026-10-27", visits: 97, pageviews: 212 },
    { day: "2026-10-28", visits: 67, pageviews: 116 },
    { day: "2026-10-29", visits: 13, pageviews: 18 },
  ],
  channels: {
    search: { visits: 5, pageviews: 9, pagesPerVisit: 1.8, bounceRate: 60, durationSeconds: 1346.09 },
    ads: { visits: 39, pageviews: 54, pagesPerVisit: 1.38, bounceRate: 46.15, durationSeconds: 35.05 },
    social: { visits: 88, pageviews: 188, pagesPerVisit: 2.14, bounceRate: 43.18, durationSeconds: 73.17 },
    direct: { visits: 117, pageviews: 240, pagesPerVisit: 2.05, bounceRate: 39.32, durationSeconds: 95.55 },
    referral: { visits: 5, pageviews: 8, pagesPerVisit: 1.6, bounceRate: 20, durationSeconds: 23.06 },
    ai: { visits: 0, pageviews: 0, pagesPerVisit: 0, bounceRate: 0, durationSeconds: 0 },
  },
  pages: [
    { label: "/", value: 183 }, { label: "/products", value: 50 }, { label: "/admin", value: 47 },
    { label: "/products/business-cards", value: 29 }, { label: "/packs", value: 15 },
    { label: "/products/books", value: 9 }, { label: "/products/flyers", value: 9 },
    { label: "/cart", value: 7 }, { label: "/contact", value: 6 }, { label: "/products/roll-up-banners", value: 6 },
  ],
  sources: [
    { label: "Direct", value: 128 }, { label: "m.facebook.com", value: 62 }, { label: "l.instagram.com", value: 39 },
    { label: "l.facebook.com", value: 6 }, { label: "instagram.com", value: 5 }, { label: "google.com", value: 4 },
    { label: "com.google.android.googlequicksearchbox", value: 2 }, { label: "facebook.com", value: 2 },
    { label: "l.wl.co", value: 2 }, { label: "accounts.google.com", value: 1 },
  ],
  devices: [{ label: "Mobile", value: 207 }, { label: "Ordinateur", value: 46 }],
  countries: [{ label: "Maroc", value: 245 }, { label: "États-Unis", value: 4 }, { label: "France", value: 3 }, { label: "Pologne", value: 1 }],
};