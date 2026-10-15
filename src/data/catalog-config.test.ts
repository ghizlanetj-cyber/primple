import { describe, expect, it } from "vitest";

import {
  SOURCE_CATALOG,
  buildCatalog,
  defaultPackPricing,
  defaultProductPricing,
  validateProductPricing,
  type PricingRow,
} from "@/data/catalog-config";
import { getPack, packQuote, packs, parsePackLines, serializePackLines } from "@/data/packs";
import { lineQuote, orderTotals } from "@/data/pricing";
import { defaultSelection, getProduct, priceQuote, products } from "@/data/products";
import { isBulkQuoteQuantity } from "@/lib/quantity";

const flyers = getProduct("flyers")!;
const row = (kind: string, slug: string, config: unknown, version = 1): PricingRow => ({ kind, slug, config: config as never, version });

describe("default catalogue is unchanged", () => {
  it("prices every product and pack exactly as the source", () => {
    for (const p of products) {
      if (p.quoteOnly) continue;
      for (const q of p.quantities) {
        expect(lineQuote(p.slug, q, {}, SOURCE_CATALOG)).toEqual(lineQuote(p.slug, q, {}));
      }
    }
    for (const pack of packs) expect(packQuote(SOURCE_CATALOG.getPack(pack.slug)!.lines, SOURCE_CATALOG, pack.slug).packPrice).toBe(packQuote(pack.lines).packPrice);
  });
  it("default overrides round-trip to the same prices", () => {
    const rows = products.map((p) => row("product", p.slug, defaultProductPricing(p)));
    const c = buildCatalog(rows);
    for (const p of products) {
      if (p.quoteOnly) continue;
      const q = p.quantities[1] ?? p.quantities[0]!;
      expect(lineQuote(p.slug, q, {}, c)?.subtotal).toBe(lineQuote(p.slug, q, {})?.subtotal);
    }
  });
});

describe("product overrides", () => {
  const base = defaultProductPricing(flyers);
  const c = buildCatalog([row("product", "flyers", { ...base, anchorCents: base.anchorCents * 2, quantities: [...base.quantities, base.quantities.at(-1)! * 2] })]);
  it("change the charged amount on server totals without mutating shared data", () => {
    const q = base.anchorQuantity;
    const live = orderTotals([{ slug: "flyers", quantity: q }], c)!;
    const source = orderTotals([{ slug: "flyers", quantity: q }])!;
    expect(live.subtotalCents).toBe(source.subtotalCents * 2);
    expect(getProduct("flyers")!.anchor.subtotal).toBe(flyers.anchor.subtotal);
    expect(lineQuote("flyers", q, {})!.subtotal).toBe(source.subtotalCents / 100);
  });
  it("extends the automatic range and still sends larger quantities to a quote", () => {
    const max = c.getProduct("flyers")!.quantities.at(-1)!;
    expect(lineQuote("flyers", max, {}, c)).not.toBeNull();
    expect(lineQuote("flyers", max + 1, {}, c)).toBeNull();
    expect(isBulkQuoteQuantity(c.getProduct("flyers")!, max + 1)).toBe(true);
  });
  it("applies a quote threshold inside the range", () => {
    const t = buildCatalog([row("product", "flyers", { ...base, bulkQuoteAt: base.quantities[1] })]);
    expect(lineQuote("flyers", base.quantities[1]!, {}, t)).toBeNull();
    expect(lineQuote("flyers", base.quantities[0]!, {}, t)).not.toBeNull();
  });
  it("applies option multipliers and quantity discounts", () => {
    const factors = JSON.parse(JSON.stringify(base.optionFactors));
    const g = Object.keys(factors)[0]!;
    const choice = Object.keys(factors[g])[1]!;
    factors[g][choice] = 3;
    const m = buildCatalog([row("product", "flyers", { ...base, optionFactors: factors, breaks: [{ quantity: base.quantities[0], factor: 1 }, { quantity: base.quantities.at(-1), factor: 0.5 }] })]);
    const p = m.getProduct("flyers")!;
    const sel = { ...defaultSelection(p), [g]: choice };
    const plain = priceQuote(p, p.quantities[0]!, defaultSelection(p)).subtotal;
    expect(priceQuote(p, p.quantities[0]!, sel).subtotal).toBeGreaterThan(plain * 2);
    expect(priceQuote(p, p.quantities.at(-1)!, defaultSelection(p)).unitPrice).toBeLessThan(priceQuote(p, p.quantities[0]!, defaultSelection(p)).unitPrice);
  });
});

describe("validation", () => {
  const base = defaultProductPricing(flyers);
  const bad = (patch: Record<string, unknown>) => () => validateProductPricing({ ...base, ...patch }, flyers);
  it("rejects unsafe values", () => {
    expect(bad({ anchorCents: 0 })).toThrow();
    expect(bad({ anchorCents: 12.5 })).toThrow();
    expect(bad({ anchorCents: Number.POSITIVE_INFINITY })).toThrow();
    expect(bad({ quantities: [500, 100] })).toThrow();
    expect(bad({ quantities: [100, 100] })).toThrow();
    expect(bad({ quantities: [1.5] })).toThrow();
    expect(bad({ quantities: [] })).toThrow();
    expect(bad({ bulkQuoteAt: base.quantities[0] })).toThrow();
    expect(bad({ productionDays: 0 })).toThrow();
    expect(bad({ anchorQuantity: base.quantities.at(-1)! + 1 })).toThrow();
    expect(bad({ breaks: [{ quantity: 100, factor: 0.8 }, { quantity: 50, factor: 0.7 }] })).toThrow();
    expect(bad({ breaks: [{ quantity: 100, factor: 0.8 }, { quantity: 500, factor: 0.9 }] })).toThrow();
    expect(bad({ optionFactors: { nope: { x: 1 } } })).toThrow();
    expect(bad({ optionFactors: { [Object.keys(base.optionFactors)[0]!]: { [Object.keys(Object.values(base.optionFactors)[0]!)[0]!]: -1 } } })).toThrow();
  });
  it("fails closed on an invalid stored row", () => {
    expect(() => buildCatalog([row("product", "flyers", { anchorCents: -5 })])).toThrow();
    expect(() => buildCatalog([row("internal", "letterhead", { unitPriceCents: 0 })])).toThrow();
  });
});

describe("pack overrides", () => {
  const pack = getPack("launch")!;
  it("apply discount, default quantities and internal unit prices", () => {
    const d = defaultPackPricing(pack);
    const c = buildCatalog([
      row("pack", "launch", { ...d, discountPercent: 50 }),
      row("internal", "letterhead", { unitPriceCents: 1000 }),
    ]);
    const live = lineQuote("pack-launch", 1, { lines: serializePackLines(c.getPack("launch")!.lines) }, c)!;
    const source = lineQuote("pack-launch", 1, { lines: serializePackLines(pack.lines) })!;
    expect(live.subtotal).not.toBe(source.subtotal);
    expect(live.savingsPercent).toBe(50);
    expect(c.internalUnitPrice("letterhead")).toBe(10);
  });
  it("rejects pack quantities outside the product's automatic range", () => {
    const d = defaultPackPricing(pack);
    expect(() => buildCatalog([row("pack", "launch", { ...d, lines: { ...d.lines, flyers: 1 } })])).toThrow();
    expect(() => buildCatalog([row("pack", "launch", { ...d, lines: { ...d.lines, flyers: 10_000_000 } })])).toThrow();
    expect(() => buildCatalog([row("pack", "launch", { ...d, discountPercent: 95 })])).toThrow();
  });
  it("customer pack quantities still respect the live product minimum", () => {
    const fb = defaultProductPricing(getProduct("flyers")!);
    const c = buildCatalog([row("product", "flyers", { ...fb, quantities: [fb.quantities[1]!, ...fb.quantities.slice(2)], anchorQuantity: fb.quantities[1]! })]);
    const raw = JSON.stringify([{ ref: "flyers", quantity: fb.quantities[0] }]);
    expect(parsePackLines("launch", raw, c)).toBeNull();
  });
});

describe("review corrections", () => {
  const pack = getPack("launch")!;
  it("treats a reset tombstone as source defaults", () => {
    const c = buildCatalog([row("product", "flyers", {}, 3), row("pack", "launch", {}, 2)]);
    expect(lineQuote("flyers", flyers.quantities[0]!, {}, c)).toEqual(lineQuote("flyers", flyers.quantities[0]!, {}));
    expect(c.versions["product:flyers"]).toBe(3);
  });
  it("prices large internal pack quantities in full, never capped", () => {
    const lines = pack.lines.map((l) => (l.ref === "letterhead" ? { ...l, quantity: 250000 } : l));
    const q = packQuote(lines, SOURCE_CATALOG, "launch");
    const letter = q.lines.find((x) => x.line.ref === "letterhead")!;
    expect(letter.subtotal).toBe(1.6 * 250000);
    const live = lineQuote("pack-launch", 1, { lines: serializePackLines(lines) })!;
    expect(live.subtotal).toBe(q.packPrice);
  });
  it("rejects unsafe or overflowing pack quantities", () => {
    expect(parsePackLines("launch", JSON.stringify([{ ref: "letterhead", quantity: Number.MAX_SAFE_INTEGER + 1 }]))).toBeNull();
    expect(lineQuote("pack-launch", 1, { lines: JSON.stringify([{ ref: "letterhead", quantity: Number.MAX_SAFE_INTEGER }]) })).toBeNull();
  });
  it("rejects default and omitted lines that fall below a raised product minimum", () => {
    const fb = defaultProductPricing(getProduct("flyers")!);
    const raised = [fb.quantities.at(-1)! ];
    const c = buildCatalog([row("product", "flyers", { ...fb, quantities: raised, anchorQuantity: raised[0], breaks: null })]);
    expect(parsePackLines("launch", undefined, c)).toBeNull();
    expect(parsePackLines("launch", JSON.stringify([{ ref: "letterhead", quantity: 250 }]), c)).toBeNull();
  });
  it("a stale pack override does not break the whole catalogue", () => {
    const fb = defaultProductPricing(getProduct("flyers")!);
    const d = defaultPackPricing(pack);
    const raised = [fb.quantities.at(-1)!];
    const c = buildCatalog([
      row("pack", "launch", { ...d, discountPercent: 30 }),
      row("product", "flyers", { ...fb, quantities: raised, anchorQuantity: raised[0], breaks: null }),
    ]);
    expect(c.packsNeedingReview).toContain("launch");
    expect(c.getPack("launch")).toBeUndefined();
    expect(lineQuote("pack-launch", 1, {}, c)).toBeNull();
    expect(c.getProduct("business-cards")).toBeDefined();
  });
});
