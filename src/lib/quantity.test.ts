import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import { lineQuote } from "@/data/pricing";
import { isBulkQuoteQuantity, parseQuantity, productQuantityLimits } from "@/lib/quantity";

describe("open quantities", () => {
  const flyers = getProduct("flyers")!;
  const limits = productQuantityLimits(flyers);
  it("accepts any whole number from the minimum, with no maximum", () => {
    expect(parseQuantity(String(limits.min), limits)).toBe(limits.min);
    expect(parseQuantity("1234567", limits)).toBe(1234567);
    expect(parseQuantity(String(limits.min - 1), limits)).toBeNull();
    expect(parseQuantity("2.5", limits)).toBeNull();
  });
  it("prices inside the verified range and asks for a quote beyond it", () => {
    expect(lineQuote("flyers", limits.verifiedMax, {})).not.toBeNull();
    expect(isBulkQuoteQuantity(flyers, limits.verifiedMax + 1)).toBe(true);
    expect(lineQuote("flyers", limits.verifiedMax + 1, {})).toBeNull();
  });
});
