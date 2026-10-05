import { describe, expect, it } from "vitest";

import { can, csvCell, dateRange, moneyOf, summarize, type OrderMoney } from "./admin-metrics";

const base: OrderMoney = {
  total: 200,
  deposit_amount: 100,
  balance_amount: 100,
  payment_status: "unpaid",
  deposit_paid: true,
  status: "Delivered",
  email: "a@b.ma",
  guest_email: null,
  user_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("money truth", () => {
  it("Delivered never implies the cash balance was collected", () => {
    expect(moneyOf(base)).toEqual({ orderValue: 200, collected: 100, courierHeld: 0, balanceDue: 100 });
  });
  it("a recorded but unremitted collection is courier-held, not collected", () => {
    expect(moneyOf(base, { amount: 100, remitted: false })).toEqual({ orderValue: 200, collected: 100, courierHeld: 100, balanceDue: 0 });
  });
  it("a remitted collection counts as collected", () => {
    expect(moneyOf(base, { amount: 100, remitted: true })).toEqual({ orderValue: 200, collected: 200, courierHeld: 0, balanceDue: 0 });
  });
  it("unconfirmed orders carry no money", () => {
    expect(moneyOf({ ...base, deposit_paid: false })).toEqual({ orderValue: 0, collected: 0, courierHeld: 0, balanceDue: 0 });
  });
  it("cancelled orders have nothing outstanding", () => {
    expect(moneyOf({ ...base, status: "Cancelled" }).balanceDue).toBe(0);
  });
  it("summaries add collections per order", () => {
    const s = summarize([{ ...base, balance: { amount: 100, remitted: true } }, base]);
    expect(s).toMatchObject({ orderValue: 400, collected: 300, courierHeld: 0, balanceDue: 100 });
  });
});

describe("capabilities", () => {
  it("team is operational only; moderator is payment-only", () => {
    expect(can("team", "write_ops")).toBe(true);
    for (const c of ["confirm_money", "manage_team", "manage_catalog", "crm_actions", "payments"] as const) expect(can("team", c)).toBe(false);
    expect(can("moderator", "payments")).toBe(true);
    expect(can("moderator", "read_ops")).toBe(false);
    expect(can("admin", "manage_team")).toBe(true);
    expect(can(null, "read_ops")).toBe(false);
    expect(can("none", "read_ops")).toBe(false);
    expect(can("__proto__", "read_ops")).toBe(false);
  });
});

describe("csv and ranges", () => {
  it("neutralizes spreadsheet formulas and quotes", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell('a"b')).toBe(`"a""b"`);
    expect(csvCell(null)).toBe(`""`);
  });
  it("validates date ranges", () => {
    expect(dateRange("2026-01-01", "2026-01-31").from).toBe("2026-01-01T00:00:00.000Z");
    expect(() => dateRange("2026-02-01", "2026-01-01")).toThrow();
    expect(() => dateRange("2020-01-01", "2026-01-01")).toThrow();
  });
});

describe("csv whitespace formulas", () => {
  it("neutralizes whitespace or newline prefixed formulas", () => {
    for (const v of [" =1+1", "\n=1", "\t+1", "  @SUM(A1)"]) expect(csvCell(v).startsWith(`"'`)).toBe(true);
  });
});
