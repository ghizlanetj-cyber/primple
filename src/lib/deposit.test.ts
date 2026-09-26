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

describe("manual payment tree", () => {
  it("full transfer and Cash Plus are 100% manual", async () => {
    const d = await import("./deposit");
    for (const m of [d.BANK_FULL_METHOD, d.CASHPLUS_FULL_METHOD]) {
      expect(d.isManualMethod(m)).toBe(true);
      expect(d.onlineAmountCents(17581, m)).toBe(17581);
    }
  });
  it("COD advances are 50% and only card advance is automatic", async () => {
    const d = await import("./deposit");
    expect(d.isManualMethod(d.DEPOSIT_METHOD)).toBe(false);
    for (const m of [d.BANK_ADVANCE_METHOD, d.CASHPLUS_ADVANCE_METHOD]) {
      expect(d.isManualMethod(m)).toBe(true);
      expect(d.splitAmounts(175.81, m)).toEqual({ dueNow: 87.91, balance: 87.9 });
    }
    expect(d.isPrintMethod("cash_pickup")).toBe(false);
  });
});
