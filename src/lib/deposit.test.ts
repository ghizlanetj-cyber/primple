import { describe, expect, it } from "vitest";

import { CARD_METHOD, DEPOSIT_METHOD, onlineAmountCents, splitAmounts } from "./deposit";

describe("print deposit", () => {
  it("charges the full total for card and unknown methods", () => {
    expect(onlineAmountCents(17580, CARD_METHOD)).toBe(17580);
    expect(onlineAmountCents(17580, "anything")).toBe(17580);
    expect(onlineAmountCents(17580, null)).toBe(17580);
  });
  it("charges half, rounded up, for the deposit method", () => {
    expect(onlineAmountCents(16500, DEPOSIT_METHOD)).toBe(8250);
    expect(onlineAmountCents(17581, DEPOSIT_METHOD)).toBe(8791);
  });
  it("deposit plus balance always equals the total", () => {
    const s = splitAmounts(175.81, DEPOSIT_METHOD);
    expect(Math.round((s.dueNow + s.balance) * 100)).toBe(17581);
  });
});

describe("bank transfer advance", () => {
  it("is half the verified total, rounded up", async () => {
    const { BANK_METHOD } = await import("./deposit");
    expect(onlineAmountCents(17581, BANK_METHOD)).toBe(8791);
    expect(splitAmounts(165, BANK_METHOD)).toEqual({ dueNow: 82.5, balance: 82.5 });
  });
});
