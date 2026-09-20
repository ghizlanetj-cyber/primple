import { describe, expect, it } from "vitest";

import {
  defaultSelection,
  fromPriceBasis,
  getProduct,
  priceQuote,
  products,
  type Product,
  type Selection,
} from "@/data/products";
import { cartTotals } from "@/store/cart";

function anchorSelection(product: Product): Selection {
  return { ...defaultSelection(product), ...(product.anchor.selection ?? {}) };
}

describe("market anchors", () => {
  for (const product of products) {
    it(`${product.slug} matches its anchor subtotal exactly`, () => {
      const quote = priceQuote(product, product.anchor.quantity, anchorSelection(product));
      expect(quote.subtotal).toBe(product.anchor.subtotal);
      expect(quote.unitPrice).toBeCloseTo(product.anchor.subtotal / product.anchor.quantity, 6);
    });
  }
});

describe("quantity behaviour", () => {
  for (const product of products) {
    it(`${product.slug} keeps unit price monotonically decreasing`, () => {
      const selection = anchorSelection(product);
      const units = product.quantities.map((q) => priceQuote(product, q, selection).unitPrice);
      for (let i = 1; i < units.length; i += 1) {
        expect(units[i]!).toBeLessThanOrEqual(units[i - 1]! + 1e-9);
      }
      for (const q of product.quantities) {
        const quote = priceQuote(product, q, selection);
        expect(quote.subtotal).toBeGreaterThan(0);
        expect(quote.total).toBeGreaterThan(quote.subtotal - 1e-9);
      }
    });

    it(`${product.slug} never gets cheaper with a premium option`, () => {
      const base = priceQuote(product, product.anchor.quantity, anchorSelection(product)).subtotal;
      for (const group of product.options) {
        if (group.id === "delivery") continue;
        for (const choice of group.choices) {
          const quote = priceQuote(product, product.anchor.quantity, {
            ...anchorSelection(product),
            [group.id]: choice.id,
          });
          if ((choice.factor ?? 1) >= 1) expect(quote.subtotal).toBeGreaterThanOrEqual(base - 1e-9);
        }
      }
    });
  }
});

describe("savings", () => {
  it("are zero at the smallest quantity and grow with volume", () => {
    const cards = getProduct("business-cards")!;
    const selection = defaultSelection(cards);
    expect(priceQuote(cards, 100, selection).savingsPercent).toBe(0);
    expect(priceQuote(cards, 2500, selection).savingsPercent).toBeGreaterThan(0);
    expect(priceQuote(cards, 2500, selection).savingsPercent).toBeGreaterThan(
      priceQuote(cards, 500, selection).savingsPercent,
    );
  });
});

describe("large format surface", () => {
  const banner = getProduct("large-format")!;

  it("prices 109 MAD per square metre", () => {
    const selection = { ...defaultSelection(banner), width: "2", height: "3" };
    const quote = priceQuote(banner, 1, selection);
    expect(quote.area).toBe(6);
    expect(quote.subtotal).toBe(654);
    expect(priceQuote(banner, 2, selection).subtotal).toBeGreaterThan(quote.subtotal);
  });

  it("falls back to valid defaults for non-positive input", () => {
    const quote = priceQuote(banner, 1, { ...defaultSelection(banner), width: "0", height: "-2" });
    expect(quote.area).toBe(1);
    expect(quote.subtotal).toBe(109);
  });
});

describe("delivery", () => {
  it("is charged once per line and once per cart", () => {
    const flyers = getProduct("flyers")!;
    const quote = priceQuote(flyers, 1000, anchorSelection(flyers));
    expect(quote.delivery).toBe(30);
    expect(quote.total).toBe(quote.subtotal + 30);

    const line = {
      id: "a",
      slug: flyers.slug,
      name: flyers.name,
      quantity: 1000,
      selection: anchorSelection(flyers),
      labels: [],
      unitPrice: quote.unitPrice,
      subtotal: quote.subtotal,
      delivery: quote.delivery,
      productionDays: quote.productionDays,
      deliveryMin: quote.deliveryMin,
      deliveryMax: quote.deliveryMax,
    };
    const totals = cartTotals([line, { ...line, id: "b" }]);
    expect(totals.subtotal).toBe(quote.subtotal * 2);
    expect(totals.delivery).toBe(30);
    expect(totals.total).toBe(totals.subtotal + 30);
  });
});

describe("from price", () => {
  it("is computed and never above the anchor unit price", () => {
    for (const product of products) {
      const basis = fromPriceBasis(product);
      expect(basis.amount).toBeGreaterThan(0);
      expect(basis.unitPrice).toBeLessThanOrEqual(
        product.anchor.subtotal / product.anchor.quantity + 1e-9,
      );
    }
  });
});
