import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ lang: "en" as "fr" | "en" | "ar" }));
vi.mock("@/i18n", () => ({ useI18n: () => state }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string;
    search?: Record<string, string>;
    children: ReactNode;
  }) =>
    createElement(
      "a",
      { href: to + (search ? "?" + new URLSearchParams(search).toString() : "") },
      children,
    ),
}));
import { OrderConfirmation } from "./OrderConfirmation";
import { OrderAccountGuide } from "./OrderAccountGuide";
const order = { reference: "PRM-12345", paymentStatus: "paid", amountPaid: 100, balance: 0 };
const render = (signedIn: boolean, patch = {}) =>
  renderToStaticMarkup(
    createElement(OrderConfirmation, { signedIn, order: { ...order, ...patch } }),
  );
beforeEach(() => {
  state.lang = "en";
});
describe("post-payment confirmation and account tracking", () => {
  it("shows a persistent receipt and an order-specific account action for a signed-in buyer", () => {
    const html = render(true);
    expect(html).toContain("Your payment is confirmed");
    expect(html).toContain("PRM-12345");
    expect(html).toContain("Go to my account and track my order");
    expect(html).toContain('href="/dashboard?order=PRM-12345&amp;paid=1"');
    expect(html).not.toContain("Taking you");
    expect(html).not.toContain("Cash balance at delivery");
    expect(html).not.toContain('href="/signup');
  });
  it("guides guests through signup, email verification and tracking the same order", () => {
    const html = render(false);
    expect(html).toContain("same email address as your order");
    expect(html).toContain("confirm your email from your inbox");
    expect(html).toContain("artwork review, production and delivery");
    const encoded = encodeURIComponent("/dashboard?order=PRM-12345&paid=1");
    expect(html).toContain('href="/signup?redirect=' + encoded + '"');
    expect(html).toContain('href="/login?redirect=' + encoded + '"');
    expect(html).toContain("Creating an account does not charge you again");
  });
  it("includes the remaining cash balance after a confirmed deposit", () => {
    const html = render(true, { amountPaid: 75, balance: 75 });
    expect(html).toContain("Amount paid");
    expect(html).toContain("Cash balance at delivery");
  });
  it.each(["unpaid", "pending", "awaiting_transfer", "failed"])(
    "never shows a paid receipt for %s",
    (paymentStatus) => {
      expect(render(false, { paymentStatus })).toBe("");
    },
  );
  it("offers account tracking for manual orders without claiming payment confirmation", () => {
    const html = renderToStaticMarkup(
      createElement(OrderAccountGuide, { reference: order.reference, signedIn: false }),
    );
    const encoded = encodeURIComponent("/dashboard?order=PRM-12345");
    expect(html).toContain('href="/signup?redirect=' + encoded + '"');
    expect(html).toContain("does not confirm payment");
    expect(html).not.toContain("Creating an account does not charge you again");
    expect(html).not.toContain("paid%3D1");
  });
  it.each(["en", "fr", "ar"] as const)(
    "provides confirmation and account guidance in %s",
    (lang) => {
      state.lang = lang;
      const html = render(false);
      expect(html).toContain("PRM-12345");
      expect(html).toContain("/signup?redirect=");
      expect(html).toContain("/login?redirect=");
      expect(html).not.toContain("undefined");
    },
  );
});
