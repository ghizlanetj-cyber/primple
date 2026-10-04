import { describe, expect, it } from "vitest";

import {
  PACK_DISCOUNT,
  packCartSlug,
  packLineSubtotal,
  packQuote,
  packs,
  parsePackLines,
  serializePackLines,
} from "@/data/packs";
import {
  DESIGN_HOURLY_RATE,
  DESIGN_MAX_HOURS,
  DESIGN_MIN_HOURS,
  DESIGN_SERVICE_SLUG,
  designServiceQuote,
} from "@/data/design-service";
import { DELIVERY_FEE, lineQuote, orderTotals } from "@/data/pricing";
import { cartTotals, type CartItem } from "@/store/cart";
import { toCents } from "@/lib/format";
import { canClaimOrder, canPayOrder } from "@/lib/order-access";

describe("packs", () => {
  it("has the ten expected packs with an image and lines", () => {
    expect(packs).toHaveLength(10);
    for (const pack of packs) {
      expect(pack.lines.length).toBeGreaterThan(3);
      expect(pack.image).toMatch(/^\/packs\/.+\.webp\?v=\d+$/);
    }
  });

  for (const pack of packs) {
    it(`${pack.slug} costs exactly 80% of the sum of its items`, () => {
      const quote = packQuote(pack.lines);
      const sumCents = pack.lines.reduce((sum, line) => sum + toCents(packLineSubtotal(line)), 0);
      expect(toCents(quote.normalPrice)).toBe(sumCents);
      expect(toCents(quote.packPrice)).toBe(Math.round(sumCents * (1 - PACK_DISCOUNT)));
      expect(toCents(quote.savings)).toBe(sumCents - toCents(quote.packPrice));
      expect(quote.discountPercent).toBe(20);
      expect(quote.packPrice).toBeGreaterThan(0);
    });
  }

  it("re-prices a pack from the cart selection without trusting the browser", () => {
    const pack = packs[0]!;
    const lines = pack.lines.map((line, i) => ({ ...line, quantity: i === 0 ? 1000 : line.quantity }));
    const raw = serializePackLines(lines);
    const parsed = parsePackLines(pack.slug, raw)!;
    expect(parsed.map((l) => l.ref)).toEqual(pack.lines.map((l) => l.ref));
    expect(parsed[0]!.quantity).toBe(1000);

    const quote = packQuote(parsed);
    const fromCart = lineQuote(packCartSlug(pack), 1, { lines: raw, delivery: "standard" })!;
    expect(fromCart.subtotal).toBe(quote.packPrice);
    expect(fromCart.delivery).toBe(DELIVERY_FEE);
    expect(fromCart.digital).toBe(false);
  });

  it("rejects injected refs, malformed data and below-minimum quantities", () => {
    const pack = packs[1]!;
    expect(parsePackLines(pack.slug, JSON.stringify([{ ref: "free-stuff", quantity: 1, unitPrice: 0 }]))).toBeNull();
    expect(parsePackLines(pack.slug, "not json")).toBeNull();
    const first = pack.lines[0]!;
    expect(parsePackLines(pack.slug, JSON.stringify([{ ref: first.ref, quantity: 1 }]))).toBeNull();
    const ok = parsePackLines(pack.slug, JSON.stringify([{ ref: first.ref, quantity: first.quantity }]))!;
    expect(packQuote(ok).packPrice).toBe(packQuote(pack.lines).packPrice);
  });
});

describe("design service", () => {
  it("costs 100 MAD per hour from 1 to 10 hours, with no delivery", () => {
    for (let hours = DESIGN_MIN_HOURS; hours <= DESIGN_MAX_HOURS; hours += 1) {
      const quote = designServiceQuote(hours);
      expect(quote.subtotal).toBe(DESIGN_HOURLY_RATE * hours);
      expect(quote.delivery).toBe(0);
      expect(quote.total).toBe(quote.subtotal);

      const line = lineQuote(DESIGN_SERVICE_SLUG, hours, { hours: String(hours) })!;
      expect(line.subtotal).toBe(DESIGN_HOURLY_RATE * hours);
      expect(line.delivery).toBe(0);
      expect(line.digital).toBe(true);
    }
  });

  it("clamps hours outside 1–10", () => {
    expect(designServiceQuote(0).hours).toBe(DESIGN_MIN_HOURS);
    expect(designServiceQuote(99).hours).toBe(DESIGN_MAX_HOURS);
    expect(designServiceQuote(Number.NaN).subtotal).toBe(DESIGN_HOURLY_RATE);
  });

  it("never adds delivery to a cart of design hours only", () => {
    const item = cartItem(DESIGN_SERVICE_SLUG, 3, { hours: "3" });
    const totals = cartTotals([item]);
    expect(totals.delivery).toBe(0);
    expect(totals.total).toBe(300);
  });
});

function cartItem(slug: string, quantity: number, selection: Record<string, string>): CartItem {
  const quote = lineQuote(slug, quantity, selection)!;
  return {
    id: `${slug}-${quantity}`,
    slug,
    name: slug,
    quantity,
    selection,
    labels: [],
    unitPrice: quote.unitPrice,
    subtotal: quote.subtotal,
    delivery: quote.delivery,
    productionDays: quote.productionDays,
    deliveryMin: quote.deliveryMin,
    deliveryMax: quote.deliveryMax,
  };
}

describe("cart, checkout and server recompute agree", () => {
  const mixed = [
    cartItem("business-cards", 1000, { delivery: "standard" }),
    cartItem(packCartSlug(packs[0]!), 1, {
      lines: serializePackLines(packs[0]!.lines),
      delivery: "standard",
    }),
    cartItem(DESIGN_SERVICE_SLUG, 2, { hours: "2" }),
  ];

  it("produces the same subtotal, delivery and total on both sides", () => {
    const client = cartTotals(mixed);
    const server = orderTotals(
      mixed.map((i) => ({ slug: i.slug, quantity: i.quantity, selection: i.selection })),
    )!;
    expect(server.subtotalCents).toBe(toCents(client.subtotal));
    expect(server.deliveryCents).toBe(toCents(client.delivery));
    expect(server.totalCents).toBe(toCents(client.total));
    expect(server.totalCents).toBe(server.subtotalCents + server.deliveryCents);
  });

  it("charges express delivery once for the whole order", () => {
    const express = [
      cartItem("flyers", 1000, { delivery: "express" }),
      cartItem("business-cards", 500, { delivery: "standard" }),
      cartItem(DESIGN_SERVICE_SLUG, 1, { hours: "1" }),
    ];
    const client = cartTotals(express);
    const server = orderTotals(
      express.map((i) => ({ slug: i.slug, quantity: i.quantity, selection: i.selection })),
    )!;
    expect(client.delivery).toBe(120);
    expect(server.deliveryCents).toBe(toCents(client.delivery));
    expect(server.totalCents).toBe(toCents(client.total));
  });

  it("rejects an order containing an unknown item", () => {
    expect(orderTotals([{ slug: "corporate-gifts", quantity: 50 }])).toBeNull();
    expect(orderTotals([{ slug: "pack-does-not-exist", quantity: 1 }])).toBeNull();
  });
});

describe("guest order access", () => {
  const order = {
    user_id: null,
    guest_email: "Client@Example.com",
    claim_token: "11111111-1111-1111-1111-111111111111",
  };

  it("lets the guest holding the token pay, and nobody else", () => {
    expect(canPayOrder(order, { claimToken: order.claim_token })).toBe(true);
    expect(canPayOrder(order, { claimToken: "22222222-2222-2222-2222-222222222222" })).toBe(false);
    expect(canPayOrder(order, {})).toBe(false);
    expect(canPayOrder({ user_id: "u1", claim_token: null }, { userId: "u1" })).toBe(true);
    expect(canPayOrder({ user_id: "u1", claim_token: null }, { userId: "u2" })).toBe(false);
  });

  it("attaches the order only to the verified email that placed it", () => {
    expect(
      canClaimOrder(order, {
        userId: "u1",
        email: "client@example.com",
        claimToken: order.claim_token,
      }),
    ).toBe(true);
    expect(
      canClaimOrder(order, { userId: "u1", email: "someone@else.com", claimToken: order.claim_token }),
    ).toBe(false);
    expect(canClaimOrder(order, { userId: "u1", email: "client@example.com", claimToken: "nope" })).toBe(
      false,
    );
    expect(
      canClaimOrder(
        { ...order, user_id: "other" },
        { userId: "u1", email: "client@example.com", claimToken: order.claim_token },
      ),
    ).toBe(false);
    expect(canClaimOrder(null, { userId: "u1", claimToken: order.claim_token })).toBe(false);
  });
});
