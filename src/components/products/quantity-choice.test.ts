import { describe, expect, it } from "vitest";

import { quantityChoiceDetails } from "./quantity-choice";

describe("quantity choice display", () => {
  it("shows only quantity when there is no saving", () => {
    expect(quantityChoiceDetails("100", 0)).toEqual({ quantity: "100", savings: null });
  });

  it("shows quantity and the dynamic saving without price text", () => {
    const choice = quantityChoiceDetails("1 000", 37);
    expect(choice).toEqual({ quantity: "1 000", savings: "-37%" });
    expect(JSON.stringify(choice)).not.toMatch(/MAD|DH|unit/i);
  });
});