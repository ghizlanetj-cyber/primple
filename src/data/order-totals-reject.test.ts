import { describe, expect, it } from "vitest";
import { orderTotals } from "@/data/pricing";

describe("orderTotals rejects invalid carts", () => {
  it("rejects empty carts", () => expect(orderTotals([])).toBeNull());
  it("rejects unknown products", () => expect(orderTotals([{ slug: "nope", quantity: 1 }])).toBeNull());
  it("rejects invalid quantities instead of defaulting", () => {
    expect(orderTotals([{ slug: "business-cards", quantity: 0 }])).toBeNull();
    expect(orderTotals([{ slug: "business-cards", quantity: 2.5 }])).toBeNull();
  });
  it("prices a valid line", () => expect(orderTotals([{ slug: "business-cards", quantity: 100 }])?.totalCents).toBeGreaterThan(0));
});
