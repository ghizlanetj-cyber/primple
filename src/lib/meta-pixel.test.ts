import { describe, expect, it, vi } from "vitest";
import { canTrackMetaPage, createMetaTracker, isPublicMarketingPage, META_PIXEL_ID, parseMarketingConsent } from "./meta-pixel";

const page = (href = "https://primple.ma/") => ({ href, referrer: "" });

function fixture() {
  let current = page();
  let loaded: () => void = () => {};
  const send = vi.fn();
  const clearCookies = vi.fn();
  const load = vi.fn((callback: () => void) => { loaded = callback; });
  const tracker = createMetaTracker({ page: () => current, send, clearCookies, load });
  return { tracker, send, load, clearCookies, ready: () => loaded(), visit: (href: string) => { current = page(href); } };
}

describe("Meta public-page boundary", () => {
  it("allows the public production catalogue and marketing pages", () => {
    for (const path of ["/", "/products", "/products/business-cards", "/packs/launch-pack", "/shop/a-print", "/contact", "/privacy"])
      expect(canTrackMetaPage(page(`https://primple.ma${path}`))).toBe(true);
  });
  it("excludes accounts, admin, forms with private URLs and payments", () => {
    for (const path of ["/admin", "/admin/payments", "/dashboard", "/login", "/signup", "/auth/callback", "/checkout", "/cart", "/payment/success", "/shop/checkout", "/shop/confirmation", "/api/public/orders", "/orders/abc"])
      expect(isPublicMarketingPage(`https://primple.ma${path}`)).toBe(false);
  });
  it("never sends production events from team, previews or local development", () => {
    for (const host of ["primple.team", "www.primple.team", "primple.lovable.app", "id-preview--primple.lovable.app", "localhost:8080", "primple.ma.attacker.test"])
      expect(canTrackMetaPage(page(`https://${host}/`))).toBe(false);
  });
  it("supports advertising attribution but refuses unknown query values and fragments", () => {
    expect(canTrackMetaPage(page("https://primple.ma/?utm_source=facebook&fbclid=abc"))).toBe(true);
    for (const suffix of ["?email=test@example.com", "?token=secret", "?order=abc", "#access_token=secret", "?utm_source=a%40b.com"])
      expect(canTrackMetaPage(page(`https://primple.ma/${suffix}`))).toBe(false);
  });
  it("does not share a private same-site referrer", () => {
    expect(canTrackMetaPage({ ...page(), referrer: "https://primple.ma/dashboard?order=abc" })).toBe(false);
    expect(canTrackMetaPage({ ...page(), referrer: "https://primple.team/admin" })).toBe(false);
    expect(canTrackMetaPage({ ...page(), referrer: "https://primple.ma/products" })).toBe(true);
    expect(canTrackMetaPage({ ...page(), referrer: "https://www.facebook.com/" })).toBe(true);
  });
  it("requires an explicit stored choice", () => {
    expect(parseMarketingConsent("granted")).toBe("granted");
    expect(parseMarketingConsent("denied")).toBe("denied");
    for (const value of [null, "true", "accepted", ""]) expect(parseMarketingConsent(value)).toBeNull();
  });
});

describe("Meta consent and navigation", () => {
  it("makes no SDK request without consent", () => {
    const f = fixture(); f.tracker.update(false);
    expect(f.load).not.toHaveBeenCalled(); expect(f.send).not.toHaveBeenCalled();
  });
  it("loads once and sends one view after readiness, including repeated React effects", () => {
    const f = fixture(); f.tracker.update(true); f.tracker.update(true);
    expect(f.load).toHaveBeenCalledTimes(1); expect(f.send).not.toHaveBeenCalled();
    f.ready(); f.tracker.update(true);
    expect(f.send.mock.calls).toEqual([["consent", "grant"], ["trackSingle", META_PIXEL_ID, "PageView"]]);
  });
  it("tracks client navigation and returning to a previous public page", () => {
    const f = fixture(); f.tracker.update(true); f.ready();
    f.visit("https://primple.ma/products"); f.tracker.update(true);
    f.visit("https://primple.ma/"); f.tracker.update(true);
    expect(f.send.mock.calls.filter(c => c[0] === "trackSingle")).toHaveLength(3);
    expect(f.load).toHaveBeenCalledTimes(1);
  });
  it("revokes and clears Meta cookies without reloading the SDK", () => {
    const f = fixture(); f.tracker.update(true); f.ready(); f.tracker.update(false);
    expect(f.send).toHaveBeenLastCalledWith("consent", "revoke"); expect(f.clearCookies).toHaveBeenCalled();
    f.tracker.update(true);
    expect(f.load).toHaveBeenCalledTimes(1);
    expect(f.send.mock.calls.filter(c => c[0] === "trackSingle")).toHaveLength(2);
  });
  it("does not send a queued page view if consent is withdrawn during load", () => {
    const f = fixture(); f.tracker.update(true); f.tracker.update(false); f.ready();
    expect(f.send.mock.calls.some(c => c[0] === "trackSingle")).toBe(false);
  });
  it("rechecks the actual URL if navigation happens during SDK loading", () => {
    const f = fixture(); f.tracker.update(true); f.visit("https://primple.ma/admin?order=secret"); f.ready();
    expect(f.send.mock.calls.some(c => c[0] === "trackSingle")).toBe(false);
    expect(f.send).toHaveBeenLastCalledWith("consent", "revoke");
  });
  it("revokes on private SPA routes and resumes only on an allowed public page", () => {
    const f = fixture(); f.tracker.update(true); f.ready();
    f.visit("https://primple.ma/login"); f.tracker.update(true);
    expect(f.send).toHaveBeenLastCalledWith("consent", "revoke");
    f.visit("https://primple.ma/products"); f.tracker.update(true);
    expect(f.send.mock.calls.filter(c => c[0] === "trackSingle")).toHaveLength(2);
  });
  it("does not load on excluded origins even with stored consent", () => {
    const f = fixture(); f.visit("https://primple.team/admin"); f.tracker.update(true);
    expect(f.load).not.toHaveBeenCalled();
  });
});
