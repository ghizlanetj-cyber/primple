import { describe, expect, it } from "vitest";

import {
  cheapestSelection,
  defaultSelection,
  fromPriceBasis,
  getProduct,
  priceQuote,
  products,
  type Product,
  type Selection,
} from "@/data/products";
import { cartTotals } from "@/store/cart";
import { lineQuote } from "@/data/pricing";

function anchorSelection(product: Product): Selection {
  const base = product.anchorCheapest ? cheapestSelection(product) : defaultSelection(product);
  return { ...base, ...(product.anchor.selection ?? {}) };
}

describe("corrected prices", () => {
  it("flyers cost 1.40 MAD per unit at every quantity", () => {
    const flyers = getProduct("flyers")!;
    for (const q of [250, 1000, 5000]) {
      expect(priceQuote(flyers, q, cheapestSelection(flyers)).subtotal).toBeCloseTo(1.4 * q, 2);
    }
    expect(fromPriceBasis(flyers).unitPrice).toBeCloseTo(1.4, 6);
  });
  it("roll-ups cost 850 MAD per unit", () => {
    const r = getProduct("roll-up-banners")!;
    expect(priceQuote(r, 1, cheapestSelection(r)).subtotal).toBe(850);
    expect(priceQuote(r, 5, cheapestSelection(r)).subtotal).toBe(4250);
  });
  it("packaging is quote only and never priced in the cart", () => {
    expect(getProduct("packaging")!.quoteOnly).toBe(true);
    expect(lineQuote("packaging", 100, {})).toBeNull();
  });
  it("design add-on is added once, without delivery", () => {
    const plain = lineQuote("flyers", 1000, {})!;
    const withDesign = lineQuote("flyers", 1000, { design: "primple" })!;
    expect(withDesign.subtotal).toBeCloseTo(plain.subtotal + 200, 2);
    expect(withDesign.delivery).toBe(plain.delivery);
  });
});

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

    it(`${product.slug} keeps option prices ordered by premium level`, () => {
      for (const group of product.options) {
        if (group.id === "delivery") continue;
        const priced = group.choices.map((choice) => ({
          factor: choice.factor ?? 1,
          subtotal: priceQuote(product, product.anchor.quantity, {
            ...anchorSelection(product),
            [group.id]: choice.id,
          }).subtotal,
        }));
        for (const a of priced) {
          for (const b of priced) {
            if (a.factor > b.factor) expect(a.subtotal).toBeGreaterThanOrEqual(b.subtotal - 1e-9);
          }
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
