import { describe, expect, it } from "vitest";
import { hostDecision } from "./host-routing";

describe("host routing", () => {
  it("leaves primple.ma untouched", () => {
    expect(hostDecision("primple.ma", "/", "")).toEqual({ type: "pass", noindex: false });
    expect(hostDecision("primple.ma", "/admin", "")).toEqual({ type: "pass", noindex: false });
    expect(hostDecision("localhost:8080", "/products", "")).toEqual({ type: "pass", noindex: false });
  });
  it("keeps www.primple.ma canonical", () => {
    expect(hostDecision("www.primple.ma", "/packs", "?a=1")).toEqual({ type: "redirect", location: "https://primple.ma/packs?a=1", status: 301 });
  });
  it("opens the dashboard on primple.team and keeps sign-in, API and assets", () => {
    expect(hostDecision("primple.team", "/", "")).toEqual({ type: "redirect", location: "/admin", status: 302 });
    for (const p of ["/admin", "/admin/payments", "/login", "/auth/callback", "/api/public/x", "/_serverFn/abc", "/assets/a.js", "/favicon.png"])
      expect(hostDecision("PRIMPLE.TEAM", p, "")).toEqual({ type: "pass", noindex: true });
  });
  it("sends shopping pages to primple.ma and blocks indexing", () => {
    expect(hostDecision("primple.team", "/products/flyers", "?x=1")).toEqual({ type: "redirect", location: "https://primple.ma/products/flyers?x=1", status: 302 });
    expect(hostDecision("www.primple.team", "/checkout", "")).toMatchObject({ type: "redirect" });
    expect(hostDecision("primple.team", "/administrator", "")).toMatchObject({ type: "redirect" });
    expect(hostDecision("primple.team", "/robots.txt", "")).toEqual({ type: "robots", body: "User-agent: *\nDisallow: /\n" });
  });
});
